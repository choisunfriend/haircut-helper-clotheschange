/* ==========================================================================
 * 43-regrow-template.js — 다시 기른 머리를 "모양 그대로" 스타일로 저장 → 마네킹 모드에서도 같은 머리
 *
 * 로드 위치: index.html 맨 끝(42-regrow.js 다음).
 *
 * 왜 (2026-10-06):
 *   [다시 기르기] → [스타일 숫자 재기] → [이 숫자로 스타일 등록]은 섹션별 길이 cm·볼륨·넘김 같은 "숫자"만
 *   저장했습니다. 그 스타일을 고르면 마네킹 초기화가 켜지고, 마네킹 가닥(두피에서 아래로 곧게 떨어지는 기본형)에
 *   숫자를 걸어 길이를 역산합니다. 다시 기른 머리의 모양(결 방향·층·흐름·두께)은 숫자에 안 담기므로
 *   등록한 머리와 전혀 다른 머리가 됐습니다.
 *
 * 무엇을:
 *   ① 저장 — REGROW.register 를 감쌉니다. 등록할 때 다시 기른 가닥을 두피 타원체 기준으로 정규화해서
 *      (x/a, (y−CY)/b, z/c) 스타일에 같이 저장합니다(stl.shape — 가닥 ≤ TPL.maxStrands개 × 점 TPL.pts개, int16 → base64).
 *      localStorage 용량이 모자라면 가닥 수를 반씩 줄여 다시 저장합니다.
 *   ② 심기 — shape 가 있는 스타일이 골라져 있으면 buildMannequinHair3D 가 만든 마네킹 가닥을 버리고,
 *      저장한 모양을 "지금 손님의" 두피 타원체로 되펴서 심습니다(같은 손님이면 같은 자리 · 다른 손님이면 두상 크기에 맞춰 늘고 줄음).
 *      가닥 수·색은 원래 마네킹과 같게: 수는 마네킹 가닥 수만큼(모자라면 아주 조금 돌려 복제), 색은 그 손님 사진에서 굽습니다.
 *   ③ 조정 엔진 — 마네킹 가닥에는 원래 커트·컬·가르마·볼륨 엔진이 다 걸립니다. 그대로 두면 저장한 모양 위에
 *      기본 커트·볼륨이 또 걸려 모양이 바뀌므로, 모양 가닥은
 *        · 막대가 스타일을 건 직후 값(기준) 그대로면 → 손대지 않음(= 등록한 머리 그대로)
 *        · 막대를 움직이면 → 기준에서 움직인 "만큼만" 겁니다: 길이(비율) · 컬 · 가르마 · 넘김 · 볼륨 · 흐름 · 매끈함
 *   ④ 스타일을 걸 때 숫자 스펙의 페이드·땋기는 끕니다(모양에 이미 들어 있음).
 *
 * 한계:
 *   · 이 파일 이전에 등록한 스타일에는 모양이 없습니다 — 다시 기른 뒤 다시 등록해야 합니다(숫자 방식으로 그대로 동작).
 *   · 다른 손님에게 걸면 두상 타원체 비율로만 맞춥니다. 얼굴 위치가 두상에 비해 많이 다르면 앞머리 끝 높이가 달라질 수 있습니다.
 *   · 막대로 움직인 커트는 "끝에서 자르기/늘리기"입니다(레이어 각도·엘리베이션 막대는 모양 가닥에 안 걸림).
 *
 * 끄기: REGROW_TPL.on = false → 스타일 다시 고르기 (숫자 방식으로 돌아감)
 * 상태: REGROW_TPL.lines().join('\n')
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[모양 스타일]';
  var T = W.REGROW_TPL = Object.assign({
    on: true,
    maxStrands: 4000,   // 저장할 가닥 수 상한 (4000 × 14점 ≈ 450KB)
    pts: 14,            // 가닥 하나를 이 점 수로 다시 나눠 저장
    q: 4000,            // 정규화 좌표 양자화(1/4000 · 범위 ±8)
    minStrands: 500,    // 용량 때문에 줄일 때 하한
    jitterRad: 0.035,   // 복제 가닥을 돌리는 각(라디안) — 0.035 ≈ 두상 둘레의 0.5%
    seed: 20261006
  }, W.REGROW_TPL || {});
  T.last = null;

  /* ── 인코딩 ─────────────────────────────────────────────────────────── */
  function toB64(i16) {
    var u8 = new Uint8Array(i16.buffer, i16.byteOffset, i16.byteLength), s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  function fromB64(b64) {
    var s = atob(b64), u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return new Int16Array(u8.buffer);
  }
  function resample(p, K) {        // 호길이 기준 K점
    var n = p.length, cum = [0], i;
    for (i = 1; i < n; i++) cum.push(cum[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z));
    var L = cum[n - 1], out = [], j = 1;
    if (!(L > 1e-9)) return null;
    for (var k = 0; k < K; k++) {
      var t = L * k / (K - 1);
      while (j < n - 1 && cum[j] < t) j++;
      var a = p[j - 1], b = p[j], seg = cum[j] - cum[j - 1], f = seg > 1e-12 ? (t - cum[j - 1]) / seg : 0;
      f = Math.max(0, Math.min(1, f));
      out.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f });
    }
    return out;
  }

  /* ① 다시 기른 모델 → 모양 */
  T.capture = function (maxN) {
    var R = W.REGROW, m = R && R.model;
    if (!m || !m.strands || !m.strands.length || R.src !== state._hair3Dneutral) return null;
    var Es = null; try { Es = getScalpEllipsoid(); } catch (e) {}
    if (!Es || !(Es.a > 0) || !(Es.b > 0) || !(Es.c > 0)) return null;
    var CY = m.CY, K = T.pts, Q = T.q, all = m.strands.filter(function (s) { return s.pts && s.pts.length >= 3; });
    var N = Math.min(all.length, maxN || T.maxStrands), step = all.length / N;
    var buf = new Int16Array(N * K * 3), n = 0, clip = 0;
    for (var i = 0; i < N; i++) {
      var s = all[Math.floor(i * step)], r = resample(s.pts, K);
      if (!r) continue;
      for (var k = 0; k < K; k++) {
        var v = [r[k].x / Es.a, (r[k].y - CY) / Es.b, r[k].z / Es.c];
        for (var d = 0; d < 3; d++) {
          var qv = Math.round(v[d] * Q);
          if (qv > 32767 || qv < -32767) { clip++; qv = qv > 0 ? 32767 : -32767; }
          buf[(n * K + k) * 3 + d] = qv;
        }
      }
      n++;
    }
    if (!n) return null;
    return { v: 1, n: n, k: K, q: Q, total: all.length, clip: clip, data: toB64(n === N ? buf : buf.subarray(0, n * K * 3)) };
  };

  /* ① 등록을 감쌈 */
  function wrapRegister() {
    var R = W.REGROW;
    if (!R || typeof R.register !== 'function' || R.register._tpl) return false;
    var orig = R.register;
    R.register = function () {
      var shape = null;
      try { shape = T.on ? T.capture() : null; } catch (e) { console.warn(TAG + ' 모양 저장 실패', e); }
      var stl = orig.apply(this, arguments);
      if (!stl || !shape) return stl;
      stl.shape = shape;
      stl.tags = '원본 모양 그대로';
      // 저장 — 용량이 모자라면 가닥 수를 줄여 다시
      var ok = false, n = shape.n;
      while (!ok) {
        try {
          localStorage.setItem('gyeol_customStyles', JSON.stringify(STYLES.filter(function (s) { return s.isCustom; })));
          ok = true;
        } catch (e) {
          n = Math.floor(n / 2);
          if (n < T.minStrands) break;
          try { stl.shape = T.capture(n) || stl.shape; } catch (x) { break; }
        }
      }
      if (!ok) {
        try { showToast('저장 공간이 모자라 모양은 이번 세션에서만 유지돼요 — 안 쓰는 스타일을 지워 주세요'); } catch (e) {}
        console.warn(TAG + ' localStorage 용량 부족 — 모양(' + Math.round(stl.shape.data.length / 1024) + 'KB)은 메모리에만 있음');
      }
      try { if (typeof buildStyleGrid === 'function') buildStyleGrid(); } catch (e) {}
      console.log(TAG + ' "' + stl.name + '" 에 모양 저장 — 가닥 ' + stl.shape.n + '/' + shape.total + ' × ' + stl.shape.k + '점 · ' +
        Math.round(stl.shape.data.length / 1024) + 'KB' + (shape.clip ? ' · 범위 밖 점 ' + shape.clip : '') + (ok ? '' : ' · ⚠ 저장 안 됨'));
      return stl;
    };
    R.register._tpl = true;
    return true;
  }
  if (!wrapRegister()) console.warn(TAG + ' REGROW.register 가 없어 저장은 건너뜀(42-regrow.js 다음에 불러와야 함)');

  /* ── 지금 골라진 모양 스타일 ─────────────────────────────────────────── */
  function activeShape() {
    if (!T.on) return null;
    var s = state && state.selectedStyle;
    return s && s.shape && s.shape.data ? s : null;
  }
  var decoded = { key: null, arr: null };
  function shapeArr(sh) {
    if (decoded.key !== sh.data) { decoded.key = sh.data; decoded.arr = fromB64(sh.data); }
    return decoded.arr;
  }

  /* ② 마네킹 대신 모양을 심음 */
  var origBuild = W.buildMannequinHair3D;
  if (typeof origBuild === 'function') {
    W.buildMannequinHair3D = function () {
      var m = origBuild.apply(this, arguments), sty = activeShape();
      if (!m || !sty) return m;
      try { return plant(m, sty); } catch (e) { console.warn(TAG + ' 모양 심기 실패 — 마네킹 그대로', e); return m; }
    };
  } else console.warn(TAG + ' buildMannequinHair3D 없음');

  function plant(m, sty) {
    var sh = sty.shape, A = shapeArr(sh), K = sh.k, Q = sh.q, n = sh.n;
    var Es = getScalpEllipsoid(), CY = m.CY != null ? m.CY : SCALP_CENTER_Y;
    var photo = state._hair3Dneutral || m;
    var target = Math.max(n, m.strands.length || n);
    // 섹션별 색 팔레트 — 원래 마네킹 가닥에서
    var pal = {};
    m.strands.forEach(function (s) { if (s.color) { var a = pal[s.sec || 'crown'] || (pal[s.sec || 'crown'] = []); if (a.length < 300) a.push(s.color); } });
    var seed = T.seed >>> 0;
    function rnd() { seed = (seed + 0x6D2B79F5) >>> 0; var t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    var out = [], secN = {}, baked = 0;
    for (var c = 0; c < target; c++) {
      var i = c % n, copy = (c / n) | 0;
      // 복제본은 정규화 공간(≈ 단위 구)에서 y축·x축으로 아주 조금 돌림 → 두피 밖 관계 유지
      var ay = 0, ax = 0;
      if (copy > 0) { ay = (rnd() * 2 - 1) * T.jitterRad; ax = (rnd() * 2 - 1) * T.jitterRad * 0.6; }
      var cy1 = Math.cos(ay), sy1 = Math.sin(ay), cx1 = Math.cos(ax), sx1 = Math.sin(ax);
      var pts = new Array(K);
      for (var k = 0; k < K; k++) {
        var o = (i * K + k) * 3, u = A[o] / Q, v = A[o + 1] / Q, w = A[o + 2] / Q;
        if (copy > 0) {
          var u1 = u * cy1 + w * sy1, w1 = -u * sy1 + w * cy1;     // y축
          var v2 = v * cx1 - w1 * sx1, w2 = v * sx1 + w1 * cx1;    // x축
          u = u1; v = v2; w = w2;
        }
        pts[k] = { x: u * Es.a, y: CY + v * Es.b, z: w * Es.c };
      }
      var sec = null; try { sec = resolveSection3D(pts[0], CY, Es.b); } catch (e) {} sec = sec || 'crown';
      var view = 'front'; try { view = viewOfRoot(pts[0]); } catch (e) {}
      var pl = pal[sec] || pal.crown, color = pl && pl.length ? pl[rnd() * pl.length | 0] : '#2B2320', colors = null;
      try { colors = bakeStrandColors3D(pts, photo, view, color, null); } catch (e) { colors = null; }
      if (colors) baked++;
      secN[sec] = (secN[sec] || 0) + 1;
      out.push({ pts: pts, sec: sec, color: color, colors: colors, srcAngle: view, rootFacing: 0, mannequin: true, tpl: true });
    }
    var res = Object.assign({}, m, { strands: out, tpl: sty.id });
    T.last = { style: sty.name, n: out.length, saved: n, copies: Math.ceil(target / n), baked: baked, sec: secN, mqN: m.strands.length };
    console.log(TAG + ' "' + sty.name + '" 모양으로 심음 — 가닥 ' + out.length + '(저장 ' + n + ' · 마네킹 ' + m.strands.length + ') · ' +
      Object.keys(secN).map(function (k) { return k + ' ' + Math.round(secN[k] / out.length * 100) + '%'; }).join(' '));
    return res;
  }

  /* ③ 조정 엔진 — 기준에서 움직인 만큼만 */
  var base = null;   // { id, sections, sbv, uni }
  function snap() {
    var uni = null; try { uni = uniformStyling(); } catch (e) {}
    return {
      id: state.selectedStyle && state.selectedStyle.id,
      sections: JSON.parse(JSON.stringify(state.sections)),
      sbv: JSON.parse(JSON.stringify(state.stylingByView || {})),
      uni: uni ? JSON.parse(JSON.stringify(uni)) : null
    };
  }
  T.rebase = function () { base = snap(); bump(); };   // 지금 막대 값을 "모양 그대로" 기준으로
  function bump() { try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {} }

  var origApply = W.applyStyleSpec;
  if (typeof origApply === 'function') {
    W.applyStyleSpec = function (id) {
      var rep = origApply.apply(this, arguments), sty = activeShape();
      if (rep && sty && (sty.specId === id || sty.id === id)) {
        try { if (state.fade) state.fade.enabled = false; } catch (e) {}
        try { if (typeof BRAID !== 'undefined') BRAID.on = false; } catch (e) {}
        base = snap();
        bump();
        console.log(TAG + ' 기준 저장 — 막대가 이 값이면 등록한 모양 그대로, 움직이면 움직인 만큼만 겁니다');
      }
      return rep;
    };
  }
  // 스타일을 바꾸면 기준 버림 (마네킹은 원래 코드가 mannequinReset 에서 다시 만듦)
  var origSel = W.selectStyle;
  if (typeof origSel === 'function') W.selectStyle = function () { base = null; return origSel.apply(this, arguments); };
  var origNone = W.selectNoStyle;
  if (typeof origNone === 'function') W.selectNoStyle = function () { base = null; return origNone.apply(this, arguments); };

  var GEO = ['length', 'curl', 'wave', 'curlDir'];
  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }
  function call(fn, args) { var f = W[fn]; if (typeof f !== 'function') return args[0]; try { var r = f.apply(null, args); return r && r.length >= 2 ? r : args[0]; } catch (e) { return args[0]; } }

  function deltaGeom(s, sty) {
    var pts = s.pts;
    if (!base || base.id !== (state.selectedStyle && state.selectedStyle.id)) return pts;     // 아직 스펙 전 → 그대로
    var sec = s.sec || 'crown', now = state.sections[sec] || {}, b0 = base.sections[sec] || {};
    // 길이 — 기준 대비 비율
    try {
      var rn = sectionLengthRatio(sec, now.length), rb = sectionLengthRatio(sec, b0.length);
      if (rb > 1e-6 && Math.abs(rn / rb - 1) > 1e-3) pts = call('lengthStrand3D', [pts, rn / rb]);
    } catch (e) {}
    // 컬 — 올린 만큼
    var dc = num(now.curl, 0) - num(b0.curl, 0), curl = Math.max(0, dc);
    if (curl > 0) {
      pts = call('curlStrand3D', [pts, curl, num(now.wave, 50) / 100, num(now.curlDir, 0)]);
      pts = call('gravityDroop3D', [pts, curl]);
    }
    // 스타일링 — 뷰 기준값과의 차이
    var cur = null;   // 원래 엔진과 같은 순서: 넘겨받은 값 → 전체 공통값 → 뿌리 자리 뷰 값
    try { cur = (sty !== undefined ? sty : uniformStyling()) || stylingForRoot(s.pts[0]); } catch (e) { cur = sty || null; }
    var bs = base.uni || base.sbv[s.srcAngle] || base.sbv.front || null;
    if (cur && bs) {
      var dPartAmt = num(cur.partAmt, 0) - num(bs.partAmt, 0), partMoved = num(cur.part, 0) !== num(bs.part, 0);
      if (partMoved || dPartAmt > 0) pts = call('partStrand3D', [pts, num(cur.part, 0), curl, partMoved ? num(cur.partAmt, 0) : dPartAmt]);
      var dSw = num(cur.sweep, 0) - num(bs.sweep, 0);
      if (dSw) pts = call('sweepStrand3D', [pts, dSw, curl, num(cur.part, 0), 0]);
      var dV = num(cur.volume, 50) - num(bs.volume, 50);
      if (dV) pts = call('volumeStrand3D', [pts, 50 + dV, sec]);           // 50 = 볼륨 0 (원래 식)
      var dF = num(cur.flow, 0) - num(bs.flow, 0);
      if (dF > 0) pts = call('flowCurlStrand3D', [pts, dF]);
      var dS = num(cur.sleek, 0) - num(bs.sleek, 0);
      if (dS > 0) pts = call('sleekStrand3D', [pts, dS]);
    }
    return pts;
  }
  var innerAdj = W.adjustStrandGeom;
  if (typeof innerAdj === 'function') {
    W.adjustStrandGeom = function (s, len, sty) {
      if (!T.on || !s || !s.tpl || !s.pts) return innerAdj.apply(this, arguments);
      return deltaGeom(s, sty);
    };
    bump();
  } else console.warn(TAG + ' adjustStrandGeom 없음');

  T.lines = function () {
    var L = ['[모양 스타일] ' + (T.on ? '켜짐' : '꺼짐') + ' · 골라진 스타일 ' + (activeShape() ? '"' + activeShape().name + '"(모양 있음)' : '(모양 없음)') + ' · 기준 ' + (base ? '저장됨' : '없음')];
    if (T.last) L.push('  마지막 심기 — "' + T.last.style + '" 가닥 ' + T.last.n + ' (저장 ' + T.last.saved + ' × 최대 ' + T.last.copies + '벌 · 마네킹 가닥 수 ' + T.last.mqN + ') · 사진색 ' + T.last.baked +
      ' · ' + Object.keys(T.last.sec).map(function (k) { return k + ' ' + T.last.sec[k]; }).join(' '));
    try {
      var cnt = STYLES.filter(function (s) { return s.shape; }), kb = 0;
      cnt.forEach(function (s) { kb += s.shape.data.length / 1024; });
      L.push('  모양 있는 스타일 ' + cnt.length + '개 · 저장 용량 ≈' + Math.round(kb) + 'KB');
    } catch (e) {}
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(T.lines()); } catch (e) {}
    return L;
  };

  console.log(TAG + ' 설치 — 다시 기른 머리를 등록하면 모양이 같이 저장되고, 마네킹 모드에서 그 모양 그대로 심습니다 · 끄기 REGROW_TPL.on=false');
})();
