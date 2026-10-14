/* ==========================================================================
 * 61-photo-curl.js — 곱슬 원본 머리: 컬 굵기를 사진에서 잰 값에 맞추고, 가닥이 뭉쳐서 같이 감기게
 *
 * 로드 위치: index.html 맨 끝(60-photo-check.js 다음). 42번·14c(컬 엔진)는 고치지 않습니다.
 *
 * 왜 (2026-10-08 · 사용자, 곱슬 손님 영상): "컬이 원본 사진에 비해 컬 직경이 좁고, 너무 가닥가닥 놀아. 사진에서 읽은 정보가 있을 테니,
 *   거기에 맞춰서 컬 직경과 뭉쳐 다니는 가닥들로 정리되게 해 줘."
 *   진단: 컬 75 · 컬 굵기 반경 1.3cm(뷰 중앙값) → 꺼짐(REGROW.curlRadius=false) — 웨이브 50.
 *   · 굵기 — 사진에서 반경은 재고 있었지만 쓰지 않았습니다. 42번 v5의 환산식이 실제 컬 엔진(14c 컬 묶음)과 안 맞아서(웨이브 100 + 로드 ×1.29 =
 *     한 바퀴 11cm · 두 바퀴도 안 감김 → 곧은 막대) 10/6에 꺼 둔 것입니다(42번 머리말 v8). 그래서 굵은 컬 사진도 웨이브 50짜리 잔 컬로 나왔습니다.
 *   · 뭉침 — 컬 엔진은 가닥을 다발(로드 하나에 감기는 한 타래)로 묶지만, 기본값이 다발 안에서도 가닥마다 감기는 자리(위상)를 크게 흩고(phaseJitter 1.2)
 *     다발 가운데로는 30%만 당깁니다(clumpPull 0.3). 그래서 타래가 아니라 낱가닥이 제각각 꼬불거리는 것처럼 보였습니다.
 *
 * 무엇을 (다시 기른 머리 화면에서, 사진에서 잰 컬이 lookMinCurl 이상일 때만):
 *   ① 컬 굵기 — 실제 엔진을 돌려서 "웨이브 값 → 가닥이 뼈대에서 벗어나는 거리(= 컬 반경)"를 재 둔 표(table)로, 사진에서 잰 반경이 나오는 웨이브 값을 고릅니다.
 *      REGROW.photoCurl()이 돌려주는 wave를 그 값으로 바꾸므로 — 섹션 웨이브 슬라이더 · 등록 스타일(perm.wave)에 그대로 들어갑니다.
 *      웨이브는 waveMin~waveMax 안에서만(너무 굵으면 다시 막대가 됨). 로드 배수(rodScale)는 쓰지 않습니다.
 *   ② 뭉침 모양(look) — 컬을 거는 동안만 컬 엔진의 값 네 개를 바꿉니다:
 *        pitchThick 3.5 → 1.4  굵은 로드에서도 한 바퀴 간격이 덜 늘어남(굵게 해도 감긴 모양이 남음 — ①을 켤 수 있게 된 이유)
 *        clumpPull 0.3 → 0.8 · phaseJitter 1.2 → 0.3 · microAmp 0.07 → 0.03   한 다발의 가닥이 같은 자리에서 같이 감김(타래)
 *      컬 엔진의 전역 값은 건드리지 않습니다(호출 앞뒤로 바꿨다 되돌림) → 마네킹 스타일·스타일 프로필(24번)은 예전 그대로입니다.
 *      제 머리 바탕으로 건 스타일(59번 · 마네킹 안 켬)에도 같은 모양이 걸립니다(그 화면도 다시 기른 가닥이라서).
 *
 * 확인한 것(실제 앱 코드를 브라우저에 올리고 · 가닥은 지어낸 것): 표의 숫자 · 그림으로 본 타래 모양 · 다른 화면(마네킹)의 가닥이 점 단위로 그대로인 것.
 * ⚠ 확인 못 한 것: 실제 사진. 사진에서 재는 반경 자체가 어림값입니다(42번 curlRk) — 굵기가 사진보다 크거나 작게 나오면 PHOTO_CURL.radiusK(기본 1)로 맞춥니다.
 *   마네킹에 표를 올린 원본(직모·약한 웨이브 — 58번)과 마네킹 스타일에는 걸리지 않습니다.
 *
 * 끄기: PHOTO_CURL.on=false 후 마네킹을 켰다 끄기 · 굵기만 끄기 PHOTO_CURL.radius=false · 뭉침만 끄기 PHOTO_CURL.clump=false
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[사진 컬]';
  var PC = W.PHOTO_CURL = Object.assign({
    on: true,
    radius: true,        // ① 컬 굵기를 사진 반경에 맞춤
    clump: true,         // ② 뭉침 모양
    lookMinCurl: 30,     // 사진에서 잰 컬이 이 이상일 때만
    look: { pitchThick: 1.4, clumpPull: 0.8, phaseJitter: 0.3, microAmp: 0.03 },
    radiusK: 1,          // 사진에서 잰 반경에 곱하는 보정(굵기가 사진과 다르면 이것으로)
    waveMin: 30, waveMax: 90,
    // 실제 컬 엔진(뭉침 모양을 건 상태)으로 잰 값: 컬 값 → [웨이브, 가닥이 뼈대에서 벗어나는 거리 cm(중앙값)] (2026-10-08 · 가닥 15~27cm · 엔진 자 19.33cm/단위)
    table: {
      50: [[30, 0.56], [50, 0.73], [60, 0.79], [70, 0.89], [80, 1.04], [90, 1.33]],
      75: [[30, 0.72], [50, 0.95], [60, 1.04], [70, 1.14], [80, 1.37], [90, 1.78]],
      90: [[30, 0.75], [50, 0.93], [60, 1.01], [70, 1.08], [80, 1.26], [90, 1.33]]
    }
  }, W.PHOTO_CURL || {});
  var S = PC.stats = { rCm: null, wave: null, was: null, curl: null, why: '', look: false, calls: 0, err: null };
  var G = W.REGROW;

  function mqOn() { try { return typeof MANNEQUIN !== 'undefined' && !!MANNEQUIN.on; } catch (e) { return false; } }
  function waveInRow(row, r) {             // 그 컬 값에서 반경 r이 나오는 웨이브(표 밖은 끝 값)
    var i, a, b;
    if (r <= row[0][1]) return row[0][0];
    for (i = 1; i < row.length; i++) { a = row[i - 1]; b = row[i]; if (r <= b[1]) return a[0] + (b[0] - a[0]) * (r - a[1]) / Math.max(1e-6, b[1] - a[1]); }
    return row[row.length - 1][0];
  }
  PC.waveFor = function (rCm, curl) {
    var keys = Object.keys(PC.table).map(Number).sort(function (x, y) { return x - y; }), i, w;
    if (!keys.length || !(rCm > 0)) return 50;
    if (curl <= keys[0]) w = waveInRow(PC.table[keys[0]], rCm);
    else if (curl >= keys[keys.length - 1]) w = waveInRow(PC.table[keys[keys.length - 1]], rCm);
    else for (i = 1; i < keys.length; i++) if (curl <= keys[i]) {
      var w0 = waveInRow(PC.table[keys[i - 1]], rCm), w1 = waveInRow(PC.table[keys[i]], rCm), t = (curl - keys[i - 1]) / (keys[i] - keys[i - 1]);
      w = w0 + (w1 - w0) * t; break;
    }
    return Math.round(Math.max(PC.waveMin, Math.min(PC.waveMax, w)));
  };

  /* ① 사진에서 잰 반경 → 웨이브 */
  if (G && typeof G.photoCurl === 'function') {
    var innerPC = G.photoCurl;
    G.photoCurl = function () {
      var out = innerPC.apply(this, arguments);
      try {
        if (PC.on && PC.radius && !G.curlRadius && out && out.value >= PC.lookMinCurl && out.rCm > 0) {
          var was = out.wave, w = PC.waveFor(out.rCm * PC.radiusK, out.value);
          out.wave = w; out.rodScale = 1; out.photoCurlWave = { was: was, rCm: out.rCm, k: PC.radiusK };
          S.rCm = out.rCm; S.wave = w; S.was = was; S.curl = out.value;
        } else if (out) { S.rCm = out.rCm || null; S.wave = null; S.curl = out.value; S.why = !PC.on ? '꺼짐' : !PC.radius ? '굵기 맞추기 꺼짐(PHOTO_CURL.radius=false)' : G.curlRadius ? '42번 굵기 적용(REGROW.curlRadius)이 켜져 있어 그쪽에 맡김' : !(out.value >= PC.lookMinCurl) ? '컬이 ' + PC.lookMinCurl + ' 미만이라 안 맞춤' : '사진에서 반경을 못 잼'; }
      } catch (e) { S.err = String(e && e.message || e); }
      return out;
    };
  } else console.warn(TAG + ' REGROW.photoCurl이 없어 컬 굵기는 못 맞춥니다');

  /* ② 뭉침 모양 — 다시 기른 머리 화면(사진에서 잰 컬이 있음)에서 컬을 거는 동안만 */
  function baseCurl() {
    try { var b = G && G.base && G.base.sections, k, m = 0; if (!b) return 0; for (k in b) if (b[k] && b[k].curl > m) m = b[k].curl; return m; } catch (e) { return 0; }
  }
  function lookActive() {
    try { return !!(PC.on && PC.clump && G && G.on && !mqOn() && typeof CURL_BUNDLE !== 'undefined' && baseCurl() >= PC.lookMinCurl); } catch (e) { return false; }
  }
  PC.lookActive = lookActive;
  var innerCurl = W.curlStrand3D;
  if (typeof innerCurl === 'function') {
    W.curlStrand3D = function () {
      if (!lookActive()) return innerCurl.apply(this, arguments);
      var CB = CURL_BUNDLE, L = PC.look, sv = {}, k;
      for (k in L) { sv[k] = CB[k]; CB[k] = L[k]; }
      S.calls++;
      try { return innerCurl.apply(this, arguments); } finally { for (k in sv) CB[k] = sv[k]; }
    };
  } else console.warn(TAG + ' curlStrand3D가 없어 뭉침 모양은 못 겁니다');
  // 서명 — 모양이 걸렸는지가 바뀌면 미리 만든 헤어도 다시
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments);
    try { var a = lookActive(); return s + '|pcl' + (a ? [PC.look.pitchThick, PC.look.clumpPull, PC.look.phaseJitter, PC.look.microAmp].join(',') : 0); } catch (e) { return s; }
  };

  PC.lines = function () {
    var a = lookActive(), L = [];
    L.push(TAG + ' ' + (PC.on ? '켜짐' : '꺼짐') +
      ' · 컬 굵기: ' + (!PC.radius ? '안 맞춤(PHOTO_CURL.radius=false)' : (S.wave != null ? '사진 반경 ' + (+S.rCm).toFixed(1) + 'cm' + (PC.radiusK !== 1 ? ' ×' + PC.radiusK : '') + ' · 컬 ' + S.curl + ' → 웨이브 ' + S.wave + '(예전 ' + S.was + ')' :
        (S.curl != null ? (S.rCm > 0 ? '사진 반경 ' + (+S.rCm).toFixed(1) + 'cm — ' : '') + (S.why || '안 맞춤') : '아직 안 잼'))) +
      ' · 뭉침 모양: ' + (!PC.clump ? '꺼짐' : (a ? '걸림(한 바퀴 간격 ' + PC.look.pitchThick + ' · 다발로 당김 ' + PC.look.clumpPull + ' · 감기는 자리 흩기 ' + PC.look.phaseJitter + ' · 잔떨림 ' + PC.look.microAmp + ')' :
        '안 걸림(다시 기른 머리 화면이 아니거나 사진 컬이 ' + PC.lookMinCurl + ' 미만)')) + (S.err ? ' · ⚠ ' + S.err : ''));
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { PC.lines().forEach(function (x) { L.push(x); }); } catch (e) {}
    return L;
  };
  /* 지금 손님에게 다시 걸기(끄고 켠 뒤) — 사진에서 다시 재서 슬라이더에 넣음 */
  PC.refresh = function () {
    try { if (G && G.on && typeof G.applyBaseline === 'function') { if (G.base) G.base = null; G.applyBaseline(); } } catch (e) { S.err = String(e && e.message || e); }
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  };
  console.log(TAG + ' 설치 — 곱슬 원본 머리의 컬 굵기를 사진에서 잰 반경에 맞추고(웨이브), 가닥이 다발로 같이 감기게 합니다. 끄기 PHOTO_CURL.on=false 후 마네킹을 켰다 끄기 · 굵기 보정 PHOTO_CURL.radiusK');
})();
