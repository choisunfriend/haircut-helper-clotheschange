/* ==========================================================================
 * 57-spec-pass.js — 원본 머리에서 재고도 스타일 스펙에 안 넘기던 값 넘기기 (가르마 · 컬 굵기 초과분 · 컬 길이)
 *
 * 로드 위치: index.html 맨 끝(42-regrow.js 뒤 아무 데나 — 지금은 맨 끝). 42번·16번·17번은 고치지 않습니다.
 *
 * 왜 (2026-10-06 · 사용자): "원본 머리를 스타일로 저장해서 다시 돌려보니까 마네킨 모드 기반으로 생성되는데, 영 다른 모양이네."
 *   "(재고도 스펙에) 안 넘기게 지금 해놨다고? 넘겨줘."
 *   원본 머리를 스타일로 등록하면(42번 REGROW.register) 스펙에 섹션 길이 · 컬 · 웨이브 · 넘김 · 볼륨 · 페이드만 들어갑니다.
 *   아래 셋은 재기는 하는데 스펙에 안 들어가서, 마네킹에 다시 걸면 그만큼 달라졌습니다.
 *
 * 무엇을 (등록할 때 스펙에 넣고, 마네킹에 걸 때 쓰게 함):
 *   ① 컬 길이 — 짧은 머리(길이를 cm로 저장하는 쪽)만.
 *      42번이 저장하는 cm는 "보이는 길이"(컬을 편 뼈대 길이)인데, 마네킹 쪽(16번 applyStyleSpec)은 그 cm를 "컬을 건 가닥의 호길이"(= 편 길이)로
 *      맞춥니다. 그래서 곱슬 손님은 마네킹에서 그만큼 짧게 나왔습니다(컬 75면 약 0.72배).
 *      → 저장할 때 cm에 1/curlRemain(컬)을 곱합니다. 원본 화면(42번 curlKeepShape)이 가닥을 늘려 잡는 것과 같은 식이라,
 *        원본 화면의 가닥 길이와 마네킹의 가닥 길이가 같아집니다.
 *      긴 머리(끝 높이로 저장)는 마네킹 쪽이 컬을 건 상태에서 끝 높이를 맞추므로 손댈 것이 없습니다.
 *   ② 컬 굵기 초과분 — 웨이브 100으로도 모자랄 때의 로드 배수(rodScale). 지금까지는 "다시 기른 가닥에만" 걸렸습니다.
 *      → spec.perm.rodScale로 저장하고, 그 스타일이 걸려 있는 동안 마네킹 가닥에도 같은 방식(가닥을 줄여서 컬을 걸고 다시 키움)으로 겁니다.
 *        그 상태에서 [현재 모델을 스타일로 등록]하면 새 스타일에도 같이 들어갑니다(spec.rodScale).
 *   ③ 가르마 — 42번이 잰 위치(part.x)를 가르마 슬라이더 값으로 바꿔 styling.part에 넣습니다.
 *      위치 환산: 14번 가르마는 두상 방향의 x성분이 −part/100 × PART3D.MAXOFF인 자리에서 갈라집니다(실제 함수 partingPushHead로 확인:
 *      part 0 → 가운데 · ±50 → ∓0.325 · ±100 → ∓0.65). 재는 쪽과 거는 쪽이 같은 모델 x축을 쓰므로 좌우는 사진과 무관하게 맞습니다.
 *      세기(partAmt): ⚠ 어림입니다. 42번의 "양쪽으로 갈라지는 정도"는 못 씁니다 — 가르마가 없는 마네킹도 가운데에서 100%로 나옵니다
 *      (가닥이 원래 바깥으로 떨어지므로). 그래서 "가운데 선과 가르마 사이에서 난 가닥이 가운데를 넘어 반대쪽으로 가는 비율"을 따로 재서
 *      그것이 crossLo(50%)~crossHi(90%)일 때 세기 0~100으로 넣습니다. 가르마가 가운데(|위치| < partMinX)면 세기 0 = 안 넣습니다
 *      (가운데 가르마와 가르마 없음을 가닥 방향만으로는 구분 못 함).
 *
 * 확인한 것(실제 앱 코드를 브라우저에 올려서): 16번의 cm 맞추기가 호길이 기준임 · 14번 컬 엔진이 호길이를 거의 그대로 둠(0.85~1.05배) ·
 *   가르마 위치 환산 · 마네킹 가닥에 로드 배수가 걸림 / 다시 기른 가닥에는 두 번 안 걸림.
 * 확인 못 한 것: 실제 손님 사진으로 등록 → 다시 걸기. 가르마 세기는 위 어림식 그대로입니다.
 *   이미 등록해 둔 스타일에는 이 값이 없습니다 — 원본 머리에서 다시 등록해야 들어갑니다.
 *
 * 끄기: SPEC_PASS.on=false (전부) · SPEC_PASS.curlLen=false · SPEC_PASS.rod=false · SPEC_PASS.part=false (등록할 때 적용)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[스펙 넘기기]';
  var G = W.REGROW;
  if (!G || typeof G.register !== 'function' || typeof G.measure !== 'function') { console.warn(TAG + ' REGROW.register/measure를 못 찾아 건너뜀(42-regrow.js 다음에 넣어야 합니다)'); return; }

  var SP = W.SPEC_PASS = Object.assign({
    on: true,
    curlLen: true,       // ① 짧은 곱슬머리의 cm를 편 길이로
    rod: true,           // ② 로드 배수(rodScale)
    part: true,          // ③ 가르마
    partMinX: 0.15,      // 가르마 위치(두상 반폭 대비)가 이보다 가운데면 안 넣음
    crossLo: 0.5, crossHi: 0.9,   // 가운데를 넘어가는 가닥 비율 이 구간을 세기 0 → partMaxAmt로 (⚠ 어림)
    partMaxAmt: 100,
    partMinN: 20         // 가운데 선과 가르마 사이의 가닥이 이만큼은 있어야 믿음
  }, W.SPEC_PASS || {});
  SP.last = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ③ 가르마: 42번이 잰 위치 → 슬라이더 값, 세기는 "가운데를 넘어가는 비율"로 */
  function measurePart(r) {
    var out = { ok: false, why: '', x: r.part ? r.part.x : 0, part: 0, amt: 0, cross: null, n: 0 };
    if (!r.part) { out.why = '잰 가르마 없음'; return out; }
    if (Math.abs(r.part.x) < SP.partMinX) { out.why = '가운데(위치 ' + r.part.x.toFixed(1) + ') — 가르마 없음과 구분 못 해서 안 넣음'; return out; }
    var P3 = (typeof PART3D !== 'undefined') ? PART3D : null;
    if (!P3 || !P3.OFFSET || !P3.DIST || !(P3.MAXOFF > 0)) { out.why = '가르마 엔진이 위치 방식이 아님(PART3D.OFFSET/DIST) — 환산 못 함'; return out; }
    var m = G.model, Es = null, Eh = null;
    try { Es = getScalpEllipsoid(); Eh = getHeadEllipsoid(); } catch (e) {}
    if (!m || !m.strands || !Es || !Eh || !(Es.a > 0) || !(Eh.a > 0)) { out.why = '모델/두상 없음'; return out; }
    var CY = isFinite(m.CY) ? m.CY : 0.15, x0 = r.part.x * Es.a, sg = x0 > 0 ? 1 : -1;
    // 위치: 두피 윗면에서 x = x0인 자리의 "두상 방향 x성분"(14번 partingPushHead가 쓰는 값)
    var yy = CY + Es.b * Math.sqrt(Math.max(0, 1 - (x0 / Es.a) * (x0 / Es.a))) - 0.15;
    var vx = x0 / Eh.a, vy = yy / Eh.b, vl = Math.sqrt(vx * vx + vy * vy) || 1, nx0 = vx / vl;
    out.part = Math.round(clamp(-nx0 / P3.MAXOFF * 100, -100, 100));
    // 세기: 가운데 선과 가르마 사이에서 난 윗머리 가닥이 가운데를 넘어 반대쪽으로 가는 비율(방향의 x성분으로 가중)
    var tot = 0, cross = 0, n = 0, i, s, rx;
    for (i = 0; i < m.strands.length; i++) {
      s = m.strands[i]; if (!s.rg || (s.sec !== 'crown' && s.sec !== 'front')) continue;
      rx = s.pts[0].x;
      if (!(rx * sg > 0) || !(Math.abs(rx) < Math.abs(x0))) continue;
      var w = Math.abs(s.rg.dx); tot += w; n++;
      if (s.rg.dx * sg < 0) cross += w;
    }
    out.n = n;
    if (n < SP.partMinN || !(tot > 0)) { out.why = '가운데 선과 가르마 사이의 가닥이 ' + n + '개뿐 — 안 넣음'; return out; }
    out.cross = cross / tot;
    out.amt = Math.round(SP.partMaxAmt * clamp((out.cross - SP.crossLo) / Math.max(1e-6, SP.crossHi - SP.crossLo), 0, 1));
    if (!(out.amt > 0)) { out.why = '가운데를 넘어가는 가닥 ' + Math.round(out.cross * 100) + '% — 가르마로 안 봄'; return out; }
    out.ok = true;
    return out;
  }

  /* 잰 결과(r)의 스펙에 넘길 값을 넣음 — r.spec을 그 자리에서 고침 */
  SP.enrich = function (r) {
    var info = { curlLenK: 1, lenBefore: null, rodScale: 1, part: null };
    if (!SP.on || !r || !r.spec) { SP.last = info; return r; }
    var sp = r.spec, curl = (sp.perm && sp.perm.curl > 0) ? sp.perm.curl : 0;
    // ① 컬 길이
    if (SP.curlLen && curl > 0 && !r.isLong && sp.lenCm && typeof G.curlRemain === 'function') {
      var rem = G.curlRemain(curl);
      if (rem > 0.05 && rem < 0.999) {
        info.curlLenK = 1 / rem; info.lenBefore = Object.assign({}, sp.lenCm);
        Object.keys(sp.lenCm).forEach(function (k) { if (typeof sp.lenCm[k] === 'number') sp.lenCm[k] = +(sp.lenCm[k] / rem).toFixed(1); });
        sp.lenCmSeen = info.lenBefore;                                         // 참고용: 보이는 길이(고치기 전 값)
      }
    }
    // ② 로드 배수
    if (SP.rod && curl > 0 && r.curl && r.curl.rodScale > 1.005) { info.rodScale = +(+r.curl.rodScale).toFixed(2); sp.perm.rodScale = info.rodScale; }
    // ③ 가르마
    if (SP.part) {
      var pm = null; try { pm = measurePart(r); } catch (e) { pm = { ok: false, why: '재기 실패: ' + (e && e.message || e) }; }
      info.part = pm;
      if (pm.ok && sp.styling) { sp.styling.part = pm.part; sp.styling.partAmt = pm.amt; }
    }
    SP.last = info;
    return r;
  };
  SP.lines = function () {
    var i = SP.last; if (!i) return [TAG + ' ' + (SP.on ? '대기 — 원본 머리를 스타일로 등록하면 찍힙니다' : '꺼짐')];
    var L = [TAG + ' 직전 등록에서 스펙에 넘긴 값'];
    L.push('  컬 길이: ' + (i.lenBefore ? 'cm × ' + i.curlLenK.toFixed(2) + ' (보이는 길이 → 편 길이) · 고치기 전 ' + Object.keys(i.lenBefore).map(function (k) { return k + ' ' + i.lenBefore[k]; }).join(' · ') : '안 고침(직모 · 긴 머리 · 꺼짐)'));
    L.push('  로드 배수: ' + (i.rodScale > 1 ? '×' + i.rodScale.toFixed(2) + ' (마네킹 가닥에도 걸림)' : '없음(웨이브 100 이내)'));
    L.push('  가르마: ' + (!i.part ? '꺼짐' : i.part.ok ? '위치 ' + (i.part.x > 0 ? '+' : '') + i.part.x.toFixed(1) + ' → 슬라이더 ' + i.part.part + ' · 세기 ' + i.part.amt +
      ' (가운데를 넘어가는 가닥 ' + Math.round(i.part.cross * 100) + '% · ' + i.part.n + '가닥 — 세기는 어림)' : '안 넣음 — ' + i.part.why));
    return L;
  };

  /* 등록할 때만 넣음 — 원본 화면(기준 값 넣기)이 쓰는 REGROW.measure는 그대로 */
  var origRegister = G.register;
  G.register = function () {
    if (!SP.on) return origRegister.apply(this, arguments);
    var m = G.measure, stl;
    G.measure = function () { var r = m.apply(G, arguments); try { return r ? SP.enrich(r) : r; } catch (e) { console.warn(TAG + ' 넣기 실패(예전대로 등록)', e); return r; } };
    try { stl = origRegister.apply(this, arguments); } finally { G.measure = m; }
    if (stl) { try { console.log(SP.lines().join('\n')); } catch (e) {} }
    return stl;
  };

  /* ② 거는 쪽 — 지금 걸려 있는(또는 걸고 있는) 스타일의 로드 배수를 마네킹 가닥의 컬에 */
  var pendingId = null, curScale = 1;
  function activeRod() {
    try {
      var id = pendingId || state.specAppliedId; if (!id || typeof getStyleSpec !== 'function') return 1;
      var sp = getStyleSpec(id), k = sp ? (+sp.rodScale || (sp.perm && +sp.perm.rodScale)) : 0;
      return (SP.on && SP.rod && k > 1.005 && isFinite(k)) ? Math.min(4, k) : 1;
    } catch (e) { return 1; }
  }
  SP.activeRod = activeRod;
  function scalePts(pts, k) { var o = new Array(pts.length), i, p; for (i = 0; i < pts.length; i++) { p = pts[i]; o[i] = { x: p.x * k, y: p.y * k, z: p.z * k }; } return o; }
  var innerAdj = W.adjustStrandGeom, innerCurl = W.curlStrand3D, innerApply = W.applyStyleSpec;
  if (typeof innerAdj === 'function' && typeof innerCurl === 'function') {
    W.adjustStrandGeom = function (s) {
      var save = curScale;
      curScale = (s && s.mannequin) ? activeRod() : 1;                        // 다시 기른 가닥은 42번이 직접 겁니다(두 번 걸지 않음)
      try { return innerAdj.apply(this, arguments); } finally { curScale = save; }
    };
    W.curlStrand3D = function (g, curl) {
      if (!(curScale > 1) || !(curl > 0) || !g || g.length < 3) return innerCurl.apply(this, arguments);
      var a = Array.prototype.slice.call(arguments), ks = curScale, out;
      a[0] = scalePts(g, 1 / ks);
      out = innerCurl.apply(this, a);
      return out ? scalePts(out, ks) : out;
    };
  } else console.warn(TAG + ' adjustStrandGeom/curlStrand3D를 못 찾아 로드 배수는 마네킹에 못 겁니다');
  if (typeof innerApply === 'function') W.applyStyleSpec = function (id) {
    var save = pendingId; pendingId = id;                                      // 길이를 맞추는 동안에도 이 스타일의 배수로
    try { return innerApply.apply(this, arguments); }
    finally { pendingId = save; try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {} }
  };
  /* 마네킹 상태에서 [현재 모델을 스타일로 등록]할 때도 지금 걸린 배수를 같이 저장(06번 buildSpecFromCurrent는 perm을 안 만들므로 spec.rodScale에) */
  var innerBuildSpec = W.buildSpecFromCurrent;
  if (typeof innerBuildSpec === 'function') W.buildSpecFromCurrent = function () {
    var spec = innerBuildSpec.apply(this, arguments);
    try { var k = activeRod(); if (spec && k > 1) spec.rodScale = +k.toFixed(2); } catch (e) {}
    return spec;
  };
  var innerClear = W.clearStyleSpec;
  if (typeof innerClear === 'function') W.clearStyleSpec = function () {
    try { return innerClear.apply(this, arguments); }
    finally { try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {} }
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { var k = activeRod(); if (SP.last) L = L.concat(SP.lines()); if (k > 1) L.push(TAG + ' 지금 걸린 스타일의 로드 배수 ×' + k.toFixed(2) + ' — 마네킹 가닥의 컬에 걸림'); } catch (e) {}
    return L;
  };
  console.log(TAG + ' 설치 — 원본 머리를 스타일로 등록할 때 컬 길이(짧은 곱슬) · 로드 배수 · 가르마를 스펙에 넣습니다. 끄기 SPEC_PASS.on=false');
})();
