/* ==========================================================================
 * 51-roots-fallback.js — 뿌리밀도 격자가 비어서 마네킹·다시 기르기가 둘 다 멈추는 것 막기
 *
 * 로드 위치: index.html 맨 끝(50-shoulders.js 다음).
 *
 * 왜 (2026-10-04 · 앞머리가 눈까지 덮인 곱슬머리 사진):
 *   마네킹 ON을 눌러도 마네킹이 안 되고, OFF로 해도 원본 머리를 다시 기르지 못했습니다.
 *   진단: [다시 기르기] 켜짐 · 모델 없음 · ⚠ 뿌리밀도/격자 없음   (콘솔: [마네킹] 격자/뿌리밀도가 없어 못 심음)
 *   경로:
 *     ① 03b extractHairMask가 "살색"을 이마~눈썹 사이 패치의 평균색으로 잽니다(머리 픽셀을 안 뺌).
 *     ② 앞머리가 이마를 덮으면 그 패치가 머리라서 살색 ≈ 머리색.
 *     ③ 03a measureViewHairIdentity는 살색↔머리색 거리가 minSkinHairDist(40) 미만이면 그 뷰의 밀도를 안 잽니다.
 *     ④ 정면·좌·우가 모두 같은 이유로 빠지고, 후면은 빌려 올 기준 살색(_refSkinCss)이 한 번도 안 잡혀 역시 빠집니다.
 *     ⑤ 13b buildRootDensityField의 실측 셀이 0 → ok:false → 17a 마네킹과 42 다시 기르기가 둘 다 포기하고
 *        사진 가닥을 그대로 보여 줍니다(그래서 ON이든 OFF든 화면이 같음).
 *
 * 무엇을:
 *   ① 살색 다시 재기 — 살색이 머리색과 너무 가까우면(또는 없으면) 그 뷰의 얼굴 랜드마크로 코·볼 자리에서
 *      머리·눈·입 픽셀을 빼고 살색을 다시 잽니다. 잰 값이 머리색과 충분히 다르면 그것으로 밀도를 재고,
 *      기준 살색(_refSkinCss)으로도 넣어 얼굴 없는 뷰(후면)가 빌려 쓰게 합니다.
 *   ② 밀도 격자 대체 — 그래도 실측 셀이 0이면(또는 격자 만들기가 실패하면) 두피 경계(SCALP_LIMIT) 안쪽 전체에
 *      균일한 추정 밀도를 넣은 격자를 돌려줍니다. 전부 "추정"(est=2)으로 표시하므로 겹침 정리(pruneOverlappedRoots)는
 *      예전처럼 건너뜁니다. 숱이 적은 자리는 구분하지 못합니다(전부 같은 밀도).
 *   ③ 고쳐 넣기 — 이미 만들어진 사진 모델에 격자가 없으면 마네킹·다시 기르기 직전에 ②와 같은 격자를 넣습니다.
 *   ④ 진단 줄 [뿌리 대체] — 어느 경로로 처리됐는지.
 *
 * 끄기: ROOTS_FALLBACK.on=false (살색만: skinFix=false · 격자 대체만: fill=false · 고쳐 넣기만: heal=false) 후 사진을 다시 분석.
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[뿌리 대체]';
  var F = W.ROOTS_FALLBACK = Object.assign({
    on: true,
    skinFix: true,      // ① 살색 다시 재기
    fill: true,         // ② 실측 0이면 균일 격자
    heal: true,         // ③ 이미 만들어진 모델에 격자 넣기
    den: 1,             // 대체 격자의 밀도(가닥 수는 STRAND_BUDGET이 정하므로 상대값일 뿐)
    halfW: 0.22,        // 코·볼 표본 반폭(귀 사이 폭 대비)
    minSamples: 30,
    loPct: 0.3, hiPct: 0.85   // 밝기 순으로 이 구간만 평균(콧구멍 그늘·번들거림 제외)
  }, W.ROOTS_FALLBACK || {});
  F.cur = null;                                  // 지금 분석 중인 뷰
  var ST = F.stats = { skin: {}, grid: null, heals: 0 };

  function rgbOf(css) { try { return parseRGBTriple(css); } catch (e) { return null; } }
  function dist(a, b) { return Math.sqrt((a.r - b.r) * (a.r - b.r) + (a.g - b.g) * (a.g - b.g) + (a.b - b.b) * (a.b - b.b)); }
  function minDist() { try { return HAIR_IDENTITY.minSkinHairDist || 40; } catch (e) { return 40; } }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 살색 다시 재기
   * ────────────────────────────────────────────────────────────────────── */
  /* 코·볼 자리(눈 아래 ~ 입 위, 코끝 좌우)의 살색. 못 재면 null */
  function faceSkin(angle, a) {
    var lm = null; try { lm = state.landmarks && state.landmarks[angle]; } catch (e) {}
    if (!lm || lm.lEarX == null || lm.rEarX == null || lm.chinY == null || lm.eyeY == null) return null;
    var w = a.w, h = a.h, px = a.srcPixels, mask = a.maskBuf, person = a.personMask, reason = a.reasonMask;
    if (!px || !(w > 4) || !(h > 4)) return null;
    var earL = Math.min(lm.lEarX, lm.rEarX), earR = Math.max(lm.lEarX, lm.rEarX), span = earR - earL;
    if (!(span > 0.02)) return null;
    var f = lm.features || {}, raw = lm.rawLandmarks;
    var cx = (raw && raw[1] && isFinite(raw[1].x)) ? raw[1].x : (earL + earR) / 2;               // 코끝
    var eyeBot = (f.leftEye && f.rightEye) ? Math.max(f.leftEye.maxY, f.rightEye.maxY) : lm.eyeY;
    var mouthTop = f.mouth ? f.mouth.minY : lm.eyeY + 0.6 * (lm.chinY - lm.eyeY);
    var y0 = eyeBot + 0.15 * (mouthTop - eyeBot), y1 = mouthTop - 0.05 * (mouthTop - eyeBot);
    if (!(y1 > y0)) return null;
    var xs = Math.max(0, Math.round((cx - span * F.halfW) * w)), xe = Math.min(w, Math.round((cx + span * F.halfW) * w));
    var ys = Math.max(0, Math.round(y0 * h)), ye = Math.min(h, Math.round(y1 * h));
    var L = [], R = [], G = [], B = [], x, y, i, r, g, b;
    for (y = ys; y < ye; y++) for (x = xs; x < xe; x++) {
      i = y * w + x;
      if (mask && mask[i] > 0) continue;                                 // 머리
      if (reason && (reason[i] === 2 || reason[i] === 3)) continue;      // 얼굴 상자에서 걷어 낸 머리 · 눈/눈썹/입
      if (person && person[i] !== 1) continue;                           // 배경
      r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2];
      L.push(0.299 * r + 0.587 * g + 0.114 * b); R.push(r); G.push(g); B.push(b);
    }
    if (L.length < F.minSamples) return null;
    var idx = L.map(function (_, k) { return k; }).sort(function (p, q2) { return L[p] - L[q2]; });
    var lo = Math.floor(idx.length * F.loPct), hi = Math.max(lo + 1, Math.floor(idx.length * F.hiPct)), sr = 0, sg = 0, sb = 0, n = 0, k;
    for (k = lo; k < hi; k++) { sr += R[idx[k]]; sg += G[idx[k]]; sb += B[idx[k]]; n++; }
    if (!n) return null;
    return { css: 'rgb(' + Math.round(sr / n) + ',' + Math.round(sg / n) + ',' + Math.round(sb / n) + ')', n: L.length };
  }

  var origExtract = W.extractHairMask;
  if (typeof origExtract === 'function') W.extractHairMask = function (angle) {
    F.cur = angle;
    try { delete ST.skin[angle]; } catch (e) {}
    var done = function () { if (F.cur === angle) F.cur = null; };
    var p;
    try { p = origExtract.apply(this, arguments); } catch (e) { done(); throw e; }
    if (p && typeof p.then === 'function') p.then(done, done); else done();
    return p;
  };

  var origMeasure = W.measureViewHairIdentity;
  if (typeof origMeasure === 'function') W.measureViewHairIdentity = function (a) {
    var angle = F.cur, args = arguments;
    try {
      if (F.on && F.skinFix && a && angle && HAIR_IDENTITY.on) {
        var hair = rgbOf(a.hairColorCss), skin = rgbOf(a.densitySkinCss || a.scalpColorCss), md = minDist();
        var d0 = hair && skin ? dist(skin, hair) : null;
        var bad = hair && (!skin || (HAIR_IDENTITY.borrowSkin && d0 < md));
        if (bad) {
          var rec = { was: a.densitySkinCss || a.scalpColorCss || null, d0: d0, how: '못 고침', css: null, d1: null };
          var fs = faceSkin(angle, a), c = fs && rgbOf(fs.css), ref = null;
          if (c && dist(c, hair) >= md) {
            rec.how = '코·볼에서 다시 잼(' + fs.n + 'px)'; rec.css = fs.css; rec.d1 = dist(c, hair);
            try { if (!HAIR_IDENTITY._refSkinCss || angle === 'front') HAIR_IDENTITY._refSkinCss = fs.css; } catch (e) {}
          } else {
            try { ref = HAIR_IDENTITY._refSkinCss; } catch (e) {}
            c = ref && rgbOf(ref);
            if (c && dist(c, hair) >= md && ref !== a.densitySkinCss) { rec.how = '다른 뷰 살색 빌림'; rec.css = ref; rec.d1 = dist(c, hair); }
          }
          ST.skin[angle] = rec;
          if (rec.css) {
            args = [Object.assign({}, a, { densitySkinCss: rec.css })];
            console.log(TAG + ' ' + angle + ' · 살색이 머리색과 너무 가까움(' + (rec.was || '없음') + ' · 거리 ' + (d0 != null ? d0.toFixed(0) : '?') +
              ' < ' + md + ' — 이마가 머리에 덮였을 가능성) → ' + rec.how + ' ' + rec.css + ' · 거리 ' + rec.d1.toFixed(0) + ' → 밀도를 잽니다');
          } else {
            console.warn(TAG + ' ' + angle + ' · 살색이 머리색과 너무 가깝고(' + (rec.was || '없음') + ') 다시 잴 자리도 없음 — 이 뷰는 밀도를 못 잽니다(실측이 하나도 없으면 균일 격자로 대체)');
          }
        }
      }
    } catch (e) { console.warn(TAG + ' 살색 다시 재기 실패(무시)', e); args = arguments; }
    return origMeasure.apply(this, args);
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ② 밀도 격자 대체
   * ────────────────────────────────────────────────────────────────────── */
  /* 두피 경계 안쪽 전체에 균일 밀도(전부 추정 표시). 13b buildRootDensityField와 같은 모양 */
  function synthRoots(CY, b, why) {
    var NT = HAIR_OCC3D.NT, NP = HAIR_OCC3D.NP, n = NT * NP;
    var OFF = (typeof EST_OFFSCALP !== 'undefined') ? EST_OFFSCALP : 3;
    var den = new Float32Array(n), seen = new Float32Array(n), est = new Uint8Array(n), off = 0, on = 0, r, c, i, ph, th;
    for (r = 0; r < NP; r++) for (c = 0; c < NT; c++) {
      i = r * NT + c; ph = (r + 0.5) / NP * Math.PI; th = (c + 0.5) / NT * 2 * Math.PI - Math.PI;
      if (ph > scalpPhiMax(th)) { est[i] = OFF; off++; } else { den[i] = F.den; est[i] = 2; on++; }
    }
    if (!on) return null;
    return { NT: NT, NP: NP, den: den, seen: seen, est: est, CY: CY, b: b, measured: 0, offScalp: off, grazing: 0, crownFill: -1,
      cells: n, ok: true, fallback: true, why: why };
  }

  var origBRD = W.buildRootDensityField;
  if (typeof origBRD === 'function') W.buildRootDensityField = function (probe, hullW, hullD, bucketOfY, CY, b) {
    var r = null, err = null;
    try { r = origBRD.apply(this, arguments); } catch (e) { err = e; }
    if (r && r.ok) { ST.grid = { mode: '실측', measured: r.measured, cells: r.cells }; return r; }
    if (!F.on || !F.fill) { if (err) throw err; return r; }
    var why = err ? '격자 만들기 실패(' + String(err && err.message || err) + ')' : (!r ? '밀도 표본 없음' : '실측 셀 0');
    var s = null;
    try { s = synthRoots(CY, b, why); } catch (e) { console.warn(TAG + ' 균일 격자 만들기 실패', e); }
    if (!s) { if (err) throw err; return r; }
    ST.grid = { mode: '대체', why: why, cells: s.cells, planted: s.cells - s.offScalp };
    console.warn(TAG + ' 뿌리밀도를 사진에서 못 잼(' + why + ') → 두피 전체에 균일 밀도를 넣었습니다(심을 셀 ' + (s.cells - s.offScalp) + '/' + s.cells +
      ') — 마네킹·다시 기르기는 됩니다. 숱이 적은 자리는 구분하지 못합니다. 되돌리기 ROOTS_FALLBACK.fill=false');
    return s;
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ③ 이미 만들어진 사진 모델에 격자가 없으면 넣기
   * ────────────────────────────────────────────────────────────────────── */
  function ensureRoots(model) {
    try {
      if (!model || !model.strands || !model.strands.length || model.mannequin) return false;
      if (model.roots && model.roots.ok) return true;
      if (!F.on || !F.heal || !model.grid) return false;
      var CY = isFinite(model.CY) ? model.CY : 0.15;
      var b = (model.roots && model.roots.b > 0) ? model.roots.b : (isFinite(model.yTop) && model.yTop - CY > 0 ? model.yTop - CY : 0);
      if (!(b > 0)) { try { b = getScalpEllipsoid().b; } catch (e) {} }
      if (!(b > 0)) return false;
      var s = synthRoots(CY, b, '모델에 격자가 없어 넣음');
      if (!s) return false;
      model.roots = s; ST.heals++;
      ST.grid = { mode: '대체', why: s.why, cells: s.cells, planted: s.cells - s.offScalp };
      console.warn(TAG + ' 사진 모델에 뿌리밀도 격자가 없어 균일 격자를 넣었습니다(심을 셀 ' + (s.cells - s.offScalp) + '/' + s.cells + ')');
      return true;
    } catch (e) { console.warn(TAG + ' 격자 넣기 실패', e); return false; }
  }
  F.ensureRoots = ensureRoots;

  var origMq = W.buildMannequinHair3D;
  if (typeof origMq === 'function') W.buildMannequinHair3D = function () {
    try { ensureRoots(state._hair3Dneutral || state.hair3D); } catch (e) {}
    return origMq.apply(this, arguments);
  };
  try {
    var RG = W.REGROW, origBuild = RG && RG.build;
    if (typeof origBuild === 'function') RG.build = function (cb) {
      try {
        var photo = state._hair3Dneutral, had = !!(photo && photo.roots && photo.roots.ok);
        if (ensureRoots(photo) && !had && RG.failedFor === photo) RG.failedFor = null;      // 격자가 없어 포기했던 사진 — 다시 시도
      } catch (e) {}
      return origBuild.apply(RG, arguments);
    };
  } catch (e) { console.warn(TAG + ' 다시 기르기 연결 실패', e); }

  /* ────────────────────────────────────────────────────────────────────────
   * ④ 진단
   * ────────────────────────────────────────────────────────────────────── */
  F.lines = function () {
    var L = [TAG + ' ' + (F.on ? '켜짐' : '꺼짐')], g = ST.grid, ks = Object.keys(ST.skin);
    if (!g) L[0] += ' · 밀도 격자: 아직 안 만듦';
    else if (g.mode === '실측') L[0] += ' · 밀도 격자: 사진에서 잼(실측 ' + g.measured + '/' + g.cells + '셀)';
    else L[0] += ' · 밀도 격자: ⚠ 균일 추정으로 대체(' + g.why + ' · 심을 셀 ' + g.planted + '/' + g.cells + ')' + (ST.heals ? ' · 모델에 넣음 ' + ST.heals + '회' : '');
    if (ks.length) L.push('  살색 — ' + ks.map(function (k) {
      var s = ST.skin[k];
      return k + ': ' + (s.was || '없음') + '(머리색과 거리 ' + (s.d0 != null ? s.d0.toFixed(0) : '?') + ') → ' + s.how + (s.css ? ' ' + s.css + '(거리 ' + s.d1.toFixed(0) + ')' : '');
    }).join(' · '));
    else L[0] += ' · 살색: 고칠 것 없음';
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(F.lines()); } catch (e) {}
    return L;
  };

  console.log(TAG + ' 설치 — 살색이 머리색과 겹치면 코·볼에서 다시 재고, 뿌리밀도 실측이 0이면 균일 격자로 대체. 콘솔: ROOTS_FALLBACK.lines().join("\\n")');
})();
