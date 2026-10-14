/*
 * 32-braid-drape.js — 레게펌(땋기) 디렉션: 가르마에서 옆으로 당겨 떨어지게
 *
 * 증상: 레게펌을 걸면 땋은 가닥이 뿌리에서 곧장 수직으로 떨어져, 3D에서 보브 돔처럼
 *       머리 윤곽 안으로 모이고 얼굴 앞 가닥이 일자로 얼굴을 덮었다.
 * 원인: 땋기 중심선 = computeAdjustedHair3DStrands()의 마네킹 가닥 그대로인데,
 *       reggae_twist 스펙은 넘김·가르마가 전부 0이라 옆으로 벌어질 힘이 하나도 없다.
 *       실제 박스 브레이드는 굵고 뻣뻣해서 두상 돔을 타고 "가르마 반대쪽·바깥"으로
 *       벌어진 뒤에 떨어진다(타겟 사진: 가운데 가르마 → 양옆으로 부채꼴).
 * 고침: BRAID.on일 때만, 조정이 끝난 가닥 끝쪽을 바깥으로 민다.
 *       · 방향 = 좌우(가르마에서 멀어지는 쪽)와 두상 바깥(방사) 방향의 혼합, 수평
 *       · 뿌리는 그대로(뿌리에서 rampCm에 걸쳐 0 → spreadCm로 부드럽게)
 *       · 정수리 쪽 뿌리일수록 더 벌어짐(돔을 더 길게 타고 내려오므로)
 *       2D 조정 화면과 3D 뷰가 같은 함수를 쓰므로 둘 다 같이 바뀐다.
 *       캐시된 배열은 건드리지 않고 새 배열을 만든다(ADJ_CACHE 공유 안전).
 * 끄기: BRAID_DRAPE.on = false · 세기: setBraidDrape(4.5) (cm, 기본 3.2)
 */
(function () {
  'use strict';
  var W = window;
  var TAG = '[땋기 디렉션]';

  var BRAID_DRAPE = W.BRAID_DRAPE = Object.assign({
    on: true,
    spreadCm: 3.2,   // 가닥 끝이 바깥으로 벌어지는 양(cm)
    rampCm: 7.0,     // 뿌리에서 이 길이에 걸쳐 0 → spreadCm
    sideMix: 0.65,   // 1 = 순수 좌우, 0 = 순수 방사(앞 가닥은 앞으로, 뒷 가닥은 뒤로)
    topMin: 0.35,    // 귀 높이 뿌리의 벌어짐 비율(정수리 = 1)
    stats: { n: 0 }
  }, W.BRAID_DRAPE || {});

  function braidOn() {
    return BRAID_DRAPE.on && typeof BRAID !== 'undefined' && BRAID.on;
  }

  function cmPerUnit() {
    try { if (typeof modelCmPerUnit === 'function') { var c = modelCmPerUnit(); if (c > 0) return c; } } catch (e) {}
    try { if (typeof braidCmPerUnit3D === 'function') { var d = braidCmPerUnit3D(); if (d > 0) return d; } } catch (e) {}
    return null;
  }

  // 한 가닥을 바깥으로 늘어뜨림. 순수 함수(입력 배열·점은 안 바꿈).
  function drapeStrand(pts, E, CY, cmu, P) {
    if (!pts || pts.length < 3) return pts;
    var r = pts[0];
    var nx = r.x / E.a, nz = r.z / E.c, ny = (r.y - CY) / E.b;
    var side = nx >= 0 ? 1 : -1;
    var rl = Math.hypot(nx, nz);
    var rx = rl > 1e-6 ? nx / rl : side, rz = rl > 1e-6 ? nz / rl : 0;
    var dx = side * P.sideMix + rx * (1 - P.sideMix), dz = rz * (1 - P.sideMix);
    var dl = Math.hypot(dx, dz) || 1;
    dx /= dl; dz /= dl;
    // 정수리(ny≈1) → 1, 귀 높이(ny≈0) 아래 → topMin
    var hw = P.topMin + (1 - P.topMin) * Math.max(0, Math.min(1, ny));
    var A = P.spreadCm / cmu * hw, ramp = Math.max(1e-6, P.rampCm / cmu);
    var out = new Array(pts.length), s = 0;
    out[0] = pts[0];
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], q = pts[i - 1];
      s += Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      var t = Math.min(1, s / ramp), w = A * (1 - (1 - t) * (1 - t));
      out[i] = Object.assign({}, p, { x: p.x + dx * w, z: p.z + dz * w });
    }
    return out;
  }
  W.braidDrapeStrand = drapeStrand;

  var _memo = new WeakMap();
  function paramSig() {
    return [BRAID_DRAPE.spreadCm, BRAID_DRAPE.rampCm, BRAID_DRAPE.sideMix, BRAID_DRAPE.topMin].join(',');
  }

  function drapeAll(list) {
    if (!braidOn() || !Array.isArray(list) || !list.length) return list;
    var E = null;
    try { E = getHeadEllipsoid(); } catch (e) {}
    var h = state && state.hair3Dneutral;
    var cmu = cmPerUnit();
    if (!E || !(E.a > 0 && E.b > 0 && E.c > 0) || !h || !(cmu > 0)) return list;
    var CY = isFinite(h.CY) ? h.CY : (typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15);
    var sig = paramSig() + '|' + E.a + ',' + E.b + ',' + E.c + ',' + CY + ',' + cmu;
    var m = _memo.get(list);
    if (m && m.sig === sig) return m.out;
    var out = new Array(list.length);
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      out[i] = it && it.pts ? Object.assign({}, it, { pts: drapeStrand(it.pts, E, CY, cmu, BRAID_DRAPE) }) : it;
    }
    _memo.set(list, { sig: sig, out: out });
    BRAID_DRAPE.stats.n = out.length;
    return out;
  }

  var orig = W.computeAdjustedHair3DStrands;
  if (typeof orig !== 'function') {
    console.warn(TAG + ' computeAdjustedHair3DStrands 없음 — 건너뜀');
    return;
  }
  if (!orig.__braidDrape) {
    var wrapped = function () { return drapeAll(orig.apply(this, arguments)); };
    wrapped.__braidDrape = true;
    W.computeAdjustedHair3DStrands = wrapped;
  }

  W.setBraidDrape = function (cm) {
    BRAID_DRAPE.spreadCm = Math.max(0, Math.min(10, +cm || 0));
    try { if (typeof drawAdjustPreview === 'function') drawAdjustPreview(); } catch (e) {}
    try { if (typeof refreshDevMini3D === 'function') refreshDevMini3D(); } catch (e) {}
    return BRAID_DRAPE.spreadCm;
  };

  console.log(TAG + ' 설치 — 땋기일 때 가닥 끝을 가르마 바깥으로 ' + BRAID_DRAPE.spreadCm +
    'cm (뿌리에서 ' + BRAID_DRAPE.rampCm + 'cm에 걸쳐) · 끄기 BRAID_DRAPE.on=false · 세기 setBraidDrape(cm)');
})();
