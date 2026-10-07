/* ==========================================================================
 * 47-natural-grow.js — 길이를 늘릴 때 뻗치지 않게 (다시 기른 원본 머리)
 *
 * 로드 위치: index.html 맨 끝(46-i18n-en.js 다음).
 *
 * 증상 (2026-10-04 폰 영상): 마네킹 OFF(다시 기른 원본 머리)에서 길이를 58 → 76으로 올리면
 *   머리 전체가 성게처럼 사방으로 곧게 뻗침. 52·31로 내리면 멀쩡.
 *
 * 원인: 42번 adjustRegrown이 길이 비율 > 1이면 lengthStrand3D(가닥, 비율)를 부르는데,
 *   그 "늘리기" 분기는 가닥의 마지막 한 마디 방향으로 직선을 그어 붙입니다(중력 없음 · 두상 충돌 없음).
 *     · 마지막 한 마디(≈0.5~1cm)는 웨이브의 어느 위상에서 끝났느냐에 따라 옆·위·앞 아무 데나 봅니다.
 *     · 58 → 76 = 비율 1.32 → 33cm 가닥이면 +10cm가 그 방향으로 곧게 나갑니다.
 *     · 두피에 누워 끝난 가닥(넘긴 앞머리·정수리)은 두피 접선 방향으로 끝나므로 머리 위로 가시가 섭니다.
 *   마네킹 가닥은 원래 아래로 늘어져 끝나서 같은 식으로 늘려도 티가 안 났습니다.
 *
 * 고침: 다시 기른 가닥을 늘릴 때는 42번이 두피 밖 구간을 기르던 것과 같은 규칙으로 이어 기릅니다.
 *   ① 시작 방향 = 끝 한 마디가 아니라 끝쪽 구간(≈4cm) 전체의 방향. 위로 향하면 그 성분을 줄임.
 *   ② 한 걸음마다 중력 쪽으로 조금씩 꺾음(약 2.5cm 가면 거의 아래) → 늘어난 부분은 아래로 떨어짐.
 *   ③ 두상 안으로 못 들어감 — 끝이 떠 있던 높이(두피 타원체 기준)를 유지한 채 두상을 타고 흘러내림.
 *   길이(호길이)는 예전과 똑같이 원래 × 비율. 줄이기(비율 < 1)와 마네킹 가닥은 건드리지 않습니다.
 *
 * 끄기: NATURAL_GROW.on=false 후 NATURAL_GROW.refresh()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[길이 늘리기]';
  var N = W.NATURAL_GROW = Object.assign({
    on: true,
    regrownOnly: true,   // 다시 기른 가닥만(false면 lengthStrand3D를 직접 부르는 모든 자리)
    dirSpanCm: 4,        // 시작 방향을 재는 끝쪽 구간
    gravityCm: 2.5,      // 이만큼 가면 방향의 63%가 아래로 넘어감(작을수록 빨리 떨어짐)
    upDamp: 0.25,        // 시작 방향이 위를 보면 위 성분에 곱함
    minLevel: 1.02,      // 두피 타원체 대비 최소 높이(이 안으로는 못 들어감)
    maxLevel: 1.5
  }, W.NATURAL_GROW || {});
  var S = N.stats = { grown: 0, addCm: 0, pushed: 0, slid: 0, err: null };

  var inner = W.lengthStrand3D;
  if (typeof inner !== 'function') { console.warn(TAG + ' lengthStrand3D가 없어 건너뜀'); return; }

  /* ── 두상(두피 타원체) — 가닥마다 다시 재지 않게 잠깐 기억 ─────────────── */
  var headCache = null, headAt = 0, headKey = null;
  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function head() {
    var key = null, t = now();
    try { key = state._hair3Dneutral || state.hair3Dneutral || null; } catch (e) {}
    if (headCache && key === headKey && t - headAt < 400) return headCache;
    var E = null, cy = 0, cm = 0;
    try { E = (typeof getScalpEllipsoid === 'function') ? getScalpEllipsoid() : getHeadEllipsoid(); } catch (e) { E = null; }
    try { var m = state.hair3Dneutral; if (m && isFinite(m.CY)) cy = m.CY; else if (typeof SCALP_CENTER_Y !== 'undefined') cy = SCALP_CENTER_Y; } catch (e) {}
    try { cm = modelCmPerUnit() || 0; } catch (e) {}
    headCache = (E && E.a > 0 && E.b > 0 && E.c > 0) ? { a: E.a, b: E.b, c: E.c, cy: cy, cm: cm > 0 ? cm : 19.33 } : { none: true, cm: cm > 0 ? cm : 19.33 };
    headAt = t; headKey = key;
    return headCache;
  }

  /* ── 이어 기르기 ───────────────────────────────────────────────────────── */
  function grow(pts, ratio) {
    var n = pts.length, i, L = 0, seg = new Array(n);
    seg[0] = 0;
    for (i = 1; i < n; i++) { seg[i] = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z); L += seg[i]; }
    if (!(L > 1e-9)) return pts;
    var H = head(), add = L * (ratio - 1), step = L / (n - 1);
    if (!(add > 1e-9) || !(step > 1e-9)) return pts;

    // ① 시작 방향: 끝쪽 구간 전체(끝점 − 구간 시작점)
    var span = Math.min(L * 0.5, Math.max(step * 2, N.dirSpanCm / H.cm)), acc = 0, j = n - 1;
    while (j > 1 && acc + seg[j] < span) { acc += seg[j]; j--; }
    var tip = pts[n - 1], from = pts[j - 1];
    var dx = tip.x - from.x, dy = tip.y - from.y, dz = tip.z - from.z, dl = Math.hypot(dx, dy, dz);
    if (!(dl > 1e-9)) { dx = 0; dy = -1; dz = 0; dl = 1; }
    dx /= dl; dy /= dl; dz /= dl;
    if (dy > 0) { dy *= N.upDamp; dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl; }

    // ③ 끝이 떠 있던 높이(두피 타원체의 몇 배 껍질인가)
    var a = 0, b = 0, c = 0, cy = 0, lvl = 0;
    if (!H.none) {
      a = H.a; b = H.b; c = H.c; cy = H.cy;
      var ty = tip.y - cy;
      lvl = Math.sqrt(tip.x * tip.x / (a * a) + ty * ty / (b * b) + tip.z * tip.z / (c * c));
      lvl = Math.max(N.minLevel, Math.min(N.maxLevel, lvl));
      a *= lvl; b *= lvl; c *= lvl;
    }
    // 정수리 한가운데처럼 흘러내릴 쪽이 안 정해지는 자리에서 쓸 옆 방향(뿌리 → 끝의 수평 성분, 없으면 바깥쪽)
    var root = pts[0], hx = tip.x - root.x, hz = tip.z - root.z, hl = Math.hypot(hx, hz);
    if (!(hl > 1e-6)) { hx = tip.x; hz = tip.z; hl = Math.hypot(hx, hz); }
    if (!(hl > 1e-6)) { hx = 0; hz = -1; hl = 1; }
    hx /= hl; hz /= hl;

    var out = pts.slice(), P = { x: tip.x, y: tip.y, z: tip.z }, done = 0, guard = 0;
    var maxPts = Math.ceil(add / step) * 3 + 8;
    while (done < add - 1e-9 && guard++ < maxPts) {
      var h = Math.min(step, add - done);
      // ② 중력 쪽으로 꺾기(걸음 길이에 비례)
      var g = 1 - Math.exp(-h * H.cm / Math.max(0.2, N.gravityCm));
      dx *= (1 - g); dy = dy * (1 - g) - g; dz *= (1 - g);
      dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;

      if (lvl) {
        // 두상 겉면에 붙어 있고 안쪽을 향하면 → 면을 타고 흐르게(법선 성분 제거)
        var px = P.x, py = P.y - cy, pz = P.z;
        var q = px * px / (a * a) + py * py / (b * b) + pz * pz / (c * c);
        if (q < 1.02) {
          var nx = px / (a * a), ny = py / (b * b), nz = pz / (c * c), nl = Math.hypot(nx, ny, nz) || 1;
          nx /= nl; ny /= nl; nz /= nl;
          var dn = dx * nx + dy * ny + dz * nz;
          if (dn < 0) {
            var tx = dx - dn * nx, tyy = dy - dn * ny, tz = dz - dn * nz, tl = Math.hypot(tx, tyy, tz);
            if (tl < 0.2) {                      // 정수리 꼭대기: 중력이 법선과 겹침 → 옆으로 먼저
              var hn = hx * nx + hz * nz;
              tx = hx - hn * nx; tyy = -hn * ny; tz = hz - hn * nz; tl = Math.hypot(tx, tyy, tz) || 1;
            }
            dx = tx / tl; dy = tyy / tl; dz = tz / tl;
            S.slid++;
          }
        }
      }

      var Q = { x: P.x + dx * h, y: P.y + dy * h, z: P.z + dz * h };
      if (lvl) {
        var qx = Q.x, qy = Q.y - cy, qz = Q.z, qq = qx * qx / (a * a) + qy * qy / (b * b) + qz * qz / (c * c);
        if (qq < 1 && qq > 0) { var k = 1 / Math.sqrt(qq); Q.x = qx * k; Q.y = cy + qy * k; Q.z = qz * k; S.pushed++; }
      }
      try { if (W.REGROW && typeof W.REGROW.neckPush === 'function') { var Qn = W.REGROW.neckPush(Q); if (Qn !== Q) { Q = Qn; S.neck = (S.neck || 0) + 1; } } } catch (en) {}   // (2026-10-04g) 목 안으로 못 들어감
      var real = Math.hypot(Q.x - P.x, Q.y - P.y, Q.z - P.z);
      if (!(real > h * 0.05)) {                  // 거의 못 나감(막힘) — 옆으로 한 걸음 비켜서 계속
        Q = { x: P.x + hx * h, y: P.y, z: P.z + hz * h };
        real = h; dx = hx; dy = 0; dz = hz;
      }
      out.push(Q);
      done += real; P = Q;
    }
    S.grown++; S.addCm += add * H.cm;
    return out;
  }

  /* ── 걸기 ─────────────────────────────────────────────────────────────── */
  var curRegrown = false;                        // 지금 조정 중인 가닥이 다시 기른 가닥인가
  var prevAdj = W.adjustStrandGeom;
  if (typeof prevAdj === 'function') W.adjustStrandGeom = function (s) {
    var save = curRegrown;
    curRegrown = !!(s && s.regrown && !s.mannequin);
    try { return prevAdj.apply(this, arguments); } finally { curRegrown = save; }
  };

  W.lengthStrand3D = function (pts, ratio) {
    if (N.on && ratio > 1 + 1e-6 && pts && pts.length >= 2 && (curRegrown || !N.regrownOnly)) {
      try { return grow(pts, ratio); } catch (e) { S.err = String(e && e.message || e); }
    }
    return inner.apply(this, arguments);
  };

  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  }
  N.refresh = function () { headCache = null; redraw(); return N.on; };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    var avg = S.grown ? (S.addCm / S.grown) : 0;
    return L.concat([TAG + ' ' + (N.on ? '켜짐' : '꺼짐') + ' — 늘린 부분은 중력·두상을 따라 이어 기름 · 늘린 가닥 누적 ' + S.grown +
      ' · 평균 +' + avg.toFixed(1) + 'cm · 두상 밖으로 밀어냄 ' + S.pushed + '걸음 · 면 타고 흐름 ' + S.slid + '걸음 · 목 밖으로 ' + (S.neck || 0) + '걸음' + (S.err ? ' · ⚠ ' + S.err : '')]);
  };

  try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
  console.log(TAG + ' 설치 — 다시 기른 머리를 늘릴 때 끝 방향으로 곧게 긋지 않고 중력·두상을 따라 이어 기릅니다. 끄기 NATURAL_GROW.on=false 후 NATURAL_GROW.refresh()');
})();
