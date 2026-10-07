/* ==========================================================================
 * 52-views360.js — 360° 세트의 나머지 사진을 "형태 계산"에 넣기
 *
 * 로드 위치: index.html 맨 끝(51-roots-fallback.js 다음).
 *
 * 왜 (2026-10-05 · 사용자): "사진 4장은 보여주기 위해서 4장인 거고, 전체 14장은 렌더링 전에 형태를 만드는 계산에 쓰는 것."
 *   45번(360° 촬영)은 14장을 뽑아 놓고 4장(정면·좌45·우45·후면)만 흐름에 넣었고, 나머지는 state.shots360에 들고만 있었습니다.
 *   그래서 360으로 찍어도 형태 계산은 4장짜리와 같았습니다(진짜 옆모습이 없어 뒤통수 두께를 못 재고, 귀 뒤·뒤통수 옆의 결도 못 읽음).
 *
 * 무엇을:
 *   ① 분석 — 기존 4장의 머리 추출이 끝난 직후(분석 모델이 올라와 있는 동안) 나머지 사진도 같은 extractHairMask로 분석합니다.
 *      결과(머리 마스크·결 방향·숱 격자)는 state.hairMasks['v90'] 같은 키로 들어갑니다(v90 = 손님 왼쪽 90°, vm90 = 오른쪽 90°).
 *      화면·슬롯·2D 조정은 그대로 4장입니다(state.shots에는 넣지 않음 · 사진 원본과 캔버스는 분석 뒤 버림).
 *   ② 카메라 맞추기 — 얼굴이 안 보이는 각도가 대부분이라 얼굴 랜드마크 없이 맞춥니다.
 *        방향   = 촬영 때 센서 각도(정면으로 고른 장의 센서 각도 ↔ 정면 얼굴 실측 yaw를 맞춤). 얼굴이 잡힌 사진은 얼굴 실측 yaw.
 *                 고개 숙임·기울임은 0.
 *        배율   = 얼굴이 잡힌 사진: 정면 배율 × (정면의 눈→턱 픽셀 ÷ 이 사진의 눈→턱 픽셀).
 *                 얼굴이 없는 사진: 정면 배율 × (정면의 "정수리→어깨선" 픽셀 ÷ 이 사진의 "정수리→어깨선" 픽셀) — 세로 길이는 돌아도 안 변한다는 가정.
 *                 어깨선이 안 잡히는 사진(옆모습은 어깨가 안 벌어짐)은 "정수리→목 밑동"으로 같은 계산.
 *                 둘 다 못 찾으면 믿는 이웃 각도 사이를 보간.
 *        가로 중심 = 정수리 아래 얕은 깊이(머리 높이의 capDepth)에서 머리 윤곽을 가로지른 선의 가운데.
 *        세로 기준 = 머리 맨 위(기존 4장과 같은 규칙).
 *   ③ 넣기 — 13b makeHairOccupancyProbe(점유 프로브)를 만들 때 추가 카메라를 같이 넣습니다. 프로브의 카메라를 읽는 계산이
 *      전부 14장을 보게 됩니다: 점유(머리 영역) 판정 · 뿌리밀도 · 다시 기르기(42)의 머리 영역 투표·두께 재기·결 읽기 · 마네킹 앞머리 판정.
 *      사진 가닥 들어올리기(13c)와 2D 화면은 예전대로 4장입니다.
 *      합성 장면(뒤통수 아래가 불룩한 단발 · 14방향)으로 본 효과: 다시 기르기 방식의 두께 재기 — 직접 잰 칸 244 → 415(/796),
 *      두께 오차 중앙값 3.1cm → 0.4cm. 점유 판정(probe.at)은 "그 자리를 정면으로 보는 사진"의 가중 평균이라 사진 수로는 거의 안 변합니다.
 *   ④ 진단 [360 뷰] — 어느 사진이 들어갔고 어느 사진을 왜 뺐는지.
 *
 * (2026-10-05b) 계산을 망칠 수 있는 사진은 뺀다 — 사용자: "계산에 오류날 수 있는 사진은 빼고 하도록."
 *   실측(혼자 팔을 돌려 찍은 세트): 센서 각도는 "폰이 돈 각도"라 몸이 같이 돌면 머리 둘레 각도와 안 맞습니다. +30·+45·+60°가 거의 같은
 *   정면 얼굴이었고, −30~−90°는 아래에서 올려다본 근접 사진, 180°는 머리가 화면 가장자리에 걸렸습니다. 그대로 넣었더니
 *   두께 중앙값 2.5 → 0.3cm(두께 0으로 잰 칸 6 → 728), 안 심은 뿌리 13 → 4741 — 머리가 두상에 납작하게 붙었습니다.
 *   두께는 "윤곽선을 보는 사진이 전부 머리라고 해야" 인정하므로 한 장만 틀려도 그 방향이 깎입니다. 그래서 의심스러우면 뺍니다.
 *   사진마다 보는 것(하나라도 걸리면 그 사진은 안 씀):
 *     · 머리가 화면에 다 들어왔나 — 머리 윗선이 좌우 가장자리(edgeFrac)에 닿거나 맨 위가 잘리면 뺌
 *     · 배율을 믿을 수 있나 — 얼굴이 잡힌 사진은 얼굴 자(눈→턱 길이 · 앱의 정면 세로 자와 같은 자)로 잼.
 *       얼굴이 없는 사진은 몸 자(어깨선/목 밑동)인데, 얼굴이 잡힌 사진들에서 몸 자가 얼굴 자와 rulerTol 안으로 맞을 때만 믿음
 *       (실측 세트: 어깨선 자는 1.00, 얼굴 자는 1.47 — 팔을 들고 찍으면 어깨선이 안 맞음). 못 믿으면 얼굴 없는 사진은 전부 뺌.
 *       비가 범위 밖이면 뺌. 못 잰 사진은 믿는 이웃 둘 사이일 때만 보간
 *     · 올려다보거나 내려다봤나 — 얼굴 실측 pitch가 정면과 pitchTol 넘게 다르면 뺌
 *     · 머리 크기가 말이 되나 — 머리 윗선 폭 ÷ 그 각도의 두상 폭이 qLo~qHi 밖이면 뺌(너무 가깝거나 먼 사진)
 *     · 두피가 머리 안에 들어오나(옆·뒤 사진만 — yaw 75° 이상) — 맞춘 카메라로 두피(머리 나는 자리)를 사진에 되쏘면 머리 마스크 안에
 *       떨어져야 함(agreeMin). 앞쪽 사진은 이마 헤어라인이 사람마다 달라 이 검사가 안 맞으므로 얼굴 값들로만 봄
 *     · 센서 각도 = 얼굴 각도인가 — 얼굴이 잡힌 사진은 얼굴 실측 yaw와 yawTol 넘게 다르면 뺌. 얼굴이 보여야 할 각도(faceMustDeg 이내)인데
 *       얼굴을 못 찾아도 뺌
 *   세트 전체: 얼굴로 확인한 사진 중 어긋난 것이 2장 이상이고 절반 이상이면, 얼굴로 확인할 수 없는 옆·뒤 사진의 센서 각도도 못 믿으므로
 *     추가 사진을 전부 안 씁니다(4장으로 계산).
 *   기준 4장(좌·우·후면)도 360 세트에서 온 것이면 같은 눈으로 보되, 빼지는 않고 진단에 ⚠만 띄웁니다(gateBase=false).
 *     (2026-10-05c) 처음에는 프로브에서 뺐는데, 실측에서 더 나빠졌습니다: 후면 사진은 여전히 사진 가닥을 만드는데(13c 들어올리기)
 *     프로브에서 후면이 빠지니 그 가닥을 다듬어 줄 점유 판정이 없어져 뒷가닥이 20cm로 길어졌고(끝 1.72 · 가시 87%),
 *     "긴 머리"로 판정돼 짧은 머리가 어깨까지 내려왔습니다. 기준 사진은 들어올리기와 프로브가 같은 사진을 봐야 합니다.
 *     얼굴 각도를 못 잰 좌·우·후면은 가정값(±90°·180°) 대신 센서 각도를 씁니다(state.capturePose).
 *   ⚠ 문턱값은 합성 장면과 실패 세트 한 벌로 잡은 것입니다. 진단 [360 뷰]에 사진마다 값과 뺀 이유가 찍힙니다.
 *
 * (2026-10-05d) 촬영 안내 — 사용자: "흔들렸는지, 각도가 중간에 어긋났는지 내용을 알려 주고, 더 나은 품질을 원하시면 다시 찍어 주세요 정도."
 *   문제가 보인 사진이 있으면 화면 아래에 안내 카드를 한 번 띄웁니다.
 *   뜨는 시점(2026-10-05e · 사용자: "분석까지 기다렸는데 바로 다시 찍으라면 어이없다 — 결과물을 보면서 선택하게"):
 *     분석 직후가 아니라, 조정 화면에서 첫 머리가 다 그려진 뒤(분석 덮개가 내려가고 · 다시 기르기가 끝나고 · 1초쯤 그대로일 때).
 *     카드는 화면 아래쪽에만 떠서 위의 3D 머리는 그대로 보입니다.
 *   종류: 머리가 화면 밖으로 나감 · 흔들림(선명도가 세트 중앙값의 blurFrac 미만) · 각도가 어긋남(센서 각도 ≠ 얼굴 각도, 얼굴이 보여야 하는데 안 보임)
 *         · 거리가 달라짐(배율을 못 맞춤) · 폰 높이가 달라짐(올려다봄/내려다봄). 어느 방향 사진인지와 한 줄 요령을 같이 보여 줍니다.
 *   기준 4장(정면·양옆·뒤)에 문제가 있으면 "결과가 부정확할 수 있다"고 따로 알립니다(기준 사진은 빼지 않으므로).
 *   [다시 찍기] = 촬영 화면으로 · [그대로 진행] = 닫기. 흔들린 사진은 안내만 하고 계산에서는 빼지 않습니다.
 *   끄기: VIEWS360.advise=false · 다시 보기: VIEWS360.showAdvice(true)
 *
 * 아직 안 하는 것: 얼굴 옆 깊이에 추가 사진 쓰기 · 고개 숙임/기울임 보정 · 원근(가까운 쪽이 크게 찍히는 것).
 *
 * 끄기: VIEWS360.on=false 후 사진을 다시 분석. 걸러내기만 끄기: VIEWS360.gate=false. 특정 사진 빼기: VIEWS360.skip=['v90'].
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[360 뷰]';
  var X = W.VIEWS360 = Object.assign({
    on: true,
    shoulderK: 1.6,     // 어깨선 A = 사람 윤곽 폭이 그 위쪽 폭 중앙값의 이 배수를 넘는 첫 줄(13a 실루엣 앵커와 같은 규칙)
    neckK: 1.25, neckMax: 0.8,    // 목 밑동 B = 목(가장 좁은 줄 · 머리 최대 폭의 neckMax 미만) 아래로 폭이 목의 neckK배를 넘기 직전 줄
    capDepth: 0.12,     // 가로 중심을 재는 깊이(정수리→어깨선 높이 대비)
    ratioLo: 0.7, ratioHi: 1.4,   // 배율 비가 이 밖이면 못 믿음
    minCols: 0.08,      // 머리 윗선이 잡힌 열이 사진 폭의 이만큼은 돼야 씀
    skip: [],           // 빼고 싶은 뷰 키(예: ['v90'])
    // (2026-10-05b) 걸러내기
    gate: true,
    gateBase: false,    // 기준 좌·우·후면을 프로브에서 빼기 — 끔(들어올리기와 프로브가 어긋나 더 나빠짐 · 머리말 2026-10-05c). ⚠만 띄움
    edgeFrac: 0.02,     // 머리 윗선이 좌우 가장자리 이 안쪽(사진 폭 대비)에 닿으면 "화면 밖"
    interpMaxGap: 130,  // 배율 보간: 양쪽 이웃(직접 잰 뷰) 사이 각도가 이보다 넓으면 안 믿음
    qLo: 0.75, qHi: 2.3,   // 머리 윗선 반폭 ÷ 그 각도의 두상 반폭
    agreeMin: 0.75, agreeFromDeg: 75,   // 두피 되쏘기(옆·뒤 사진만 — yaw가 agreeFromDeg 이상): 이 비율 이상이어야
    yawTol: 18,         // 센서 각도 ↔ 얼굴 실측 yaw 허용 차(도)
    pitchTol: 15,       // 얼굴 실측 pitch가 정면과 이만큼 넘게 다르면 뺌(올려다보거나 내려다본 사진)
    faceMustDeg: 55,    // 이 각도 안쪽이면 얼굴이 잡혀야 함
    setBadMin: 2, setBadFrac: 0.34,  // 얼굴로 확인한 사진 중 어긋난 것이 이만큼이면 세트의 센서 각도를 안 믿음
    faceRatioLo: 0.77, faceRatioHi: 1.6,  // 얼굴 자(눈→턱)로 잰 배율 비의 허용 범위(정면보다 30% 넘게 가깝거나 60% 넘게 멀면 뺌 — 원근이 달라짐)
    rulerTol: 0.12,     // 어깨선·목 밑동 자가 얼굴 자와 이 안쪽으로 맞아야 그 자를 믿음(얼굴이 잡힌 사진들에서 확인)
    // (2026-10-05d) 촬영 안내
    advise: true,
    blurFrac: 0.5       // 선명도가 세트 중앙값의 이 비율 미만이면 "흔들림"
  }, W.VIEWS360 || {});
  X.views = {}; X.order = []; X.ref = null; X.busy = false; X.setFp = null; X.fp = null; X.forSet = null; X.note = ''; X.last = null; X.advisePending = false;

  var BASE = ['front', 'left', 'right', 'back'];
  function tail(u) { return typeof u === 'string' ? u.length + ':' + u.slice(-24) : ''; }
  function fpNow() { try { return BASE.map(function (a) { return tail(state.shots && state.shots[a]); }).join('|'); } catch (e) { return ''; } }
  function wrapDeg(d) { d = ((d + 180) % 360 + 360) % 360 - 180; return d === -180 ? 180 : d; }
  function keyOf(deg) { var d = Math.round(wrapDeg(deg)); return 'v' + (d < 0 ? 'm' + (-d) : d); }
  function nearest(frames, deg, maxOff) {
    var best = null, bd = 1e9;
    frames.forEach(function (f) { var d = Math.abs(wrapDeg(f.deg - deg)); if (d < bd) { bd = d; best = f; } });
    return best && bd <= maxOff ? best : null;
  }
  /* 45번 applySet과 같은 규칙으로 4장을 고름 */
  function picks(set) { return { front: nearest(set.frames, 0, 20), left: nearest(set.frames, 45, 25), right: nearest(set.frames, -45, 25), back: nearest(set.frames, 180, 35) }; }
  function isExtraKey(k) { return /^vm?\d+$/.test(k); }

  /* ────────────────────────────────────────────────────────────────────────
   * 사진 한 장에서 카메라 맞추기에 쓸 치수 재기
   * ────────────────────────────────────────────────────────────────────── */
  /* 사람 윤곽: 맨 윗줄 · 어깨선(마스크 줄 번호). 못 찾으면 -1
     어깨선 A = 윤곽 폭이 그 위쪽 폭 중앙값의 shoulderK배를 넘는 첫 줄(앞·뒤에서 잘 잡힘)
     목 밑동 B = 머리 가장 넓은 줄 아래에서 가장 좁은 줄(목)을 찾고, 그 아래로 폭이 목 폭의 neckK배를 넘기 직전 줄
                (옆모습은 어깨가 안 벌어져 A가 안 잡힘 — 목은 옆에서도 보임. 머리가 목을 덮으면 B가 안 잡힘) */
  function personStats(pm, mw, mh) {
    var out = { top: -1, shoulder: -1, neckBase: -1 };
    if (!pm || !(mw > 8) || !(mh > 8)) return out;
    var y, x, l, r, cnt, widths = [], rows = [], sorted, med;
    for (y = 0; y < mh; y++) {
      l = -1; r = -1; cnt = 0;
      for (x = 0; x < mw; x++) if (pm[y * mw + x]) { if (l < 0) l = x; r = x; cnt++; }
      if (out.top < 0) { if (cnt >= 3) out.top = y; else continue; }
      var wd = l < 0 ? 0 : r - l + 1;
      rows.push(wd);
      if (out.shoulder < 0 && wd > 0) {
        if (widths.length > 8) {
          sorted = widths.slice().sort(function (a, b) { return a - b; }); med = sorted[sorted.length >> 1];
          if (wd > med * X.shoulderK) out.shoulder = y;
        }
        if (out.shoulder < 0) widths.push(wd);
      }
    }
    var n = rows.length, i, wmax = 0, imax = 0, lim = Math.min(n, Math.round((out.shoulder >= 0 ? out.shoulder - out.top : n) * 0.6));   // 머리 구간만
    for (i = 0; i < lim; i++) if (rows[i] > wmax) { wmax = rows[i]; imax = i; }
    if (wmax > 8) {
      var wmin = wmax, imin = -1;
      for (i = imax + 1; i < n; i++) {
        if (rows[i] > 0 && rows[i] < wmin) { wmin = rows[i]; imin = i; }
        if (imin >= 0 && rows[i] > wmin * X.neckK) break;
      }
      if (imin >= 0 && wmin < wmax * X.neckMax && i < n) out.neckBase = out.top + i - 1;
    }
    return out;
  }
  /* 머리 윗선(scalpY)에서: 좌우 끝 · 맨 위 · 정수리 아래 얕은 깊이의 가로 중심 */
  function measure(mi) {
    if (!mi || !mi.scalpY || !(mi.w > 8) || !(mi.h > 8)) return null;
    var sY = mi.scalpY, w = mi.w, x, minX = Infinity, maxX = -Infinity, crown = Infinity, valid = 0;
    for (x = 0; x < w; x++) { var v = sY[x]; if (v >= 0) { valid++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (v < crown) crown = v; } }
    if (!(maxX > minX) || !isFinite(crown)) return null;
    var mw = mi.maskW || w, mh = mi.maskH || mi.h, ky = mi.h / mh;
    var ps = personStats(mi.personMask, mw, mh);
    var top = ps.top >= 0 ? ps.top * ky : -1, sh = ps.shoulder >= 0 ? ps.shoulder * ky : -1, nb = ps.neckBase >= 0 ? ps.neckBase * ky : -1;
    var H = (top >= 0 && sh > top) ? sh - top : 0, HB = (top >= 0 && nb > top) ? nb - top : 0;
    var depth = X.capDepth * (H > 0 ? H : HB > 0 ? HB : (maxX - minX));
    var cl = Infinity, cr = -Infinity;
    for (x = 0; x < w; x++) if (sY[x] >= 0 && sY[x] <= crown + depth) { if (x < cl) cl = x; if (x > cr) cr = x; }
    return { w: w, h: mi.h, minX: minX, maxX: maxX, hw: (maxX - minX) / 2, crown: crown, valid: valid, top: top, shoulder: sh, H: H, neckBase: nb, HB: HB,
      capCx: cr >= cl ? (cl + cr) / 2 : (minX + maxX) / 2 };
  }
  X._measure = measure;
  /* 머리가 화면에 다 들어왔나. 문제 있으면 사유 문자열 */
  function frameProblem(m) {
    if (!m) return '머리 윗선을 못 잡음';
    if (m.hw < 4 || m.valid < m.w * X.minCols) return '머리 윗선이 거의 안 잡힘';
    var e = Math.max(1, X.edgeFrac * m.w);
    if (m.minX <= e || m.maxX >= m.w - 1 - e) return '머리가 화면 ' + (m.minX <= e ? '왼쪽' : '오른쪽') + ' 가장자리에 걸림';
    if (m.crown <= 1) return '머리 맨 위가 화면 밖';
    return '';
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 나머지 사진 분석
   * ────────────────────────────────────────────────────────────────────── */
  function dropKey(k) {
    ['shots', 'hairCanvases', 'baseCanvases', 'baseFillCanvases', 'strandPaths', 'landmarks', 'captureLmStatus', 'capturePose', 'poseEars'].forEach(function (n) {
      try { if (state[n] && k in state[n]) delete state[n][k]; } catch (e) {}
    });
    try { if (typeof imgCache !== 'undefined' && imgCache[k]) delete imgCache[k]; } catch (e) {}
  }
  function clearViews() {
    try { Object.keys(state.hairMasks || {}).forEach(function (k) { if (isExtraKey(k)) delete state.hairMasks[k]; }); } catch (e) {}
    Object.keys(X.views).forEach(dropKey);
    X.views = {}; X.order = []; X.ref = null; X.fp = null; X.forSet = null;
  }
  X.clear = clearViews;
  /* 지금 4장이 360 세트에서 온 그대로인가 */
  function setLive() { try { return !!(state.shots360 && state.shots360.frames && X.setFp && X.setFp === fpNow()); } catch (e) { return false; } }
  function active() { return !!(X.on && setLive() && X.forSet === state.shots360 && X.fp === fpNow() && X.order.length); }
  X.active = active;

  var prevExtract = null;                 // 설치 때 채움
  X.extractOne = function (key) { return prevExtract ? prevExtract(key) : Promise.resolve(false); };   // 테스트에서 바꿔 끼울 수 있게
  function faceOf(lm) {
    if (!lm || typeof lm.poseYawDeg !== 'number' || !isFinite(lm.poseYawDeg)) return null;
    var ecN = (typeof lm.chinY === 'number' && typeof lm.eyeY === 'number') ? lm.chinY - lm.eyeY : 0;
    return { yaw: lm.poseYawDeg, pitch: (typeof lm.posePitchDeg === 'number' && isFinite(lm.posePitchDeg)) ? lm.posePitchDeg : null, ecN: ecN > 0.01 ? ecN : 0 };
  }
  /* 얼굴 실측({yaw, pitch, ecN = 눈→턱 ÷ 사진 높이}). 얼굴 인식을 못 돌렸으면 undefined · 돌렸는데 못 찾았으면 null */
  X.canFace = function () { try { return !!(faceLandmarkerReady && faceLandmarker && typeof detectFaceLandmarks === 'function'); } catch (e) { return false; } };
  X.faceOne = function (key) {
    if (!X.canFace()) return Promise.resolve(undefined);
    return Promise.resolve(detectFaceLandmarks(key)).then(function (lm) { return faceOf(lm); }, function () { return undefined; });
  };

  function bodyRatio(ref, m) {            // 어깨선 → 목 밑동 순. {r, src, bad}
    var r = 0, src = '';
    if (ref && ref.H > 0 && m && m.H > 0) { r = ref.H / m.H; src = '어깨선'; }
    else if (ref && ref.HB > 0 && m && m.HB > 0) { r = ref.HB / m.HB; src = '목 밑동'; }
    if (!(r > 0)) return { r: null, src: '', bad: '' };
    if (r >= X.ratioLo && r <= X.ratioHi) return { r: r, src: src, bad: '' };
    return { r: null, src: src, bad: src + ' 비가 범위 밖(' + r.toFixed(2) + ')' };
  }
  /* 배율 비
       얼굴이 잡힌 뷰 = 얼굴 자(눈→턱 길이: 정면 ÷ 이 사진). 앱의 정면 세로 자와 같은 자라 가장 믿을 만함.
       얼굴이 없는 뷰 = 몸 자(어깨선 → 목 밑동). 단, 얼굴이 잡힌 사진들에서 몸 자가 얼굴 자와 rulerTol 안으로 맞을 때만 믿음
                       (실측: 팔을 든 셀카 세트에서 어깨선 자가 1.00이라 했지만 얼굴 자는 1.47이었음).
       못 잰 뷰 = 믿는 이웃 둘 사이 보간. */
  function fillRatios() {
    var ref = X.ref, rf = X.refFace, errs = [];
    X.order.forEach(function (k) {
      var v = X.views[k], b = bodyRatio(ref, v.m);
      v.rb = b.r; v.rbSrc = b.src; v.rbBad = b.bad;
      v.rfa = (rf && rf.ec > 0 && v.ec > 0) ? rf.ec / v.ec : null;
      if (v.rfa != null) { if (v.rb != null) errs.push(Math.abs(v.rb / v.rfa - 1)); else if (v.rbBad) errs.push(1); }
    });
    ['left', 'right'].forEach(function (a) {           // 기준 좌·우도 검증 표본으로
      try {
        var mi = state.hairMasks && state.hairMasks[a], fa = faceOf(state.landmarks && state.landmarks[a]);
        if (!mi || !fa || !(fa.ecN > 0) || !rf || !(rf.ec > 0)) return;
        var b = bodyRatio(ref, measure(mi)), r2 = rf.ec / (fa.ecN * mi.h);
        if (b.r != null) errs.push(Math.abs(b.r / r2 - 1)); else if (b.bad) errs.push(1);
      } catch (e) {}
    });
    errs.sort(function (x, y) { return x - y; });
    var med = errs.length ? errs[errs.length >> 1] : null;
    X.bodyRuler = { n: errs.length, med: med, ok: med == null || med <= X.rulerTol };
    var known = [{ deg: 0, r: 1 }];
    X.order.forEach(function (k) {
      var v = X.views[k]; v.ratio = null; v.ratioSrc = ''; v.ratioBad = '';
      if (v.rfa != null) {
        v.ratio = v.rfa; v.ratioSrc = '눈→턱(얼굴)';
        if (v.rfa >= X.faceRatioLo && v.rfa <= X.faceRatioHi) known.push({ deg: v.deg, r: v.rfa });
        else v.ratioBad = '얼굴 자 비가 범위 밖(' + v.rfa.toFixed(2) + ')';
      } else if (v.rb != null) {
        v.ratio = v.rb; v.ratioSrc = v.rbSrc;
        if (X.bodyRuler.ok) known.push({ deg: v.deg, r: v.rb });
        else v.ratioBad = '이 세트에서는 ' + v.rbSrc + ' 자가 얼굴 자와 안 맞음(얼굴이 잡힌 ' + X.bodyRuler.n + '장에서 중앙 오차 ' + Math.round(X.bodyRuler.med * 100) + '%)';
      } else if (v.rbBad) { v.ratioSrc = v.rbBad; v.ratioBad = v.rbBad; }
    });
    X.order.forEach(function (k) {
      var v = X.views[k]; if (v.ratio != null) return;
      var lo = null, hi = null, dl = 1e9, dh = 1e9;
      known.forEach(function (q) {
        var d = wrapDeg(q.deg - v.deg);
        if (d <= 0 && -d < dl) { dl = -d; lo = q; }
        if (d >= 0 && d < dh) { dh = d; hi = q; }
      });
      var pre = v.ratioSrc ? v.ratioSrc + ' → ' : '';
      if (!v.ratioBad && lo && hi && lo !== hi && dl + dh > 0 && dl + dh <= X.interpMaxGap) { v.ratio = (lo.r * dh + hi.r * dl) / (dl + dh); v.ratioSrc = pre + '이웃 보간'; }
      else {
        var g = lo && hi ? (dl <= dh ? lo : hi) : (lo || hi);
        v.ratio = g ? g.r : ((ref && ref.h > 0 && v.m && v.m.h > 0) ? ref.h / v.m.h : 1);
        v.ratioSrc = pre + (g ? '가까운 뷰 값' : '같은 거리 가정');
        if (!v.ratioBad) v.ratioBad = '배율을 직접 못 재고 보간할 이웃도 없음';
      }
    });
  }

  X.prepare = function () {
    if (X.busy) return X.busy;
    var set = state.shots360;
    if (!X.on || !set || !set.frames || !setLive()) return Promise.resolve(false);
    if (X.forSet === set && X.fp === fpNow()) return Promise.resolve(true);
    clearViews();
    var p = picks(set), used = [p.front, p.left, p.right, p.back], seen = {}, list = [];
    set.frames.forEach(function (f) {
      if (!f || !f.url || used.indexOf(f) >= 0) return;
      var k = keyOf(f.deg); if (seen[k] || X.skip.indexOf(k) >= 0) return;
      seen[k] = true; list.push({ key: k, deg: wrapDeg(f.deg), url: f.url });
    });
    list.sort(function (a, b) { return a.deg - b.deg; });
    X.degFront = p.front ? wrapDeg(p.front.deg) : 0;
    X.baseDeg = { front: X.degFront, left: p.left ? wrapDeg(p.left.deg) : 45, right: p.right ? wrapDeg(p.right.deg) : -45, back: p.back ? wrapDeg(p.back.deg) : 180 };
    try { X.ref = measure(state.hairMasks && state.hairMasks.front); } catch (e) { X.ref = null; }
    X.faceWasReady = X.canFace();            // 카드를 띄울 때는 분석 모델이 이미 내려가 있으므로 지금 값을 기억
    X.refFace = null;
    try { var ff = faceOf(state.landmarks && state.landmarks.front); if (ff && X.ref) X.refFace = { yaw: ff.yaw, pitch: ff.pitch, ec: ff.ecN * X.ref.h }; } catch (e) {}
    var cap = (typeof capShotDataURL === 'function') ? capShotDataURL : function (u) { return Promise.resolve(u); };
    var t0 = Date.now(), okN = 0, i = 0, fp0 = fpNow();
    function one() {
      if (i >= list.length) return Promise.resolve();
      var it = list[i++], faceYaw;
      try { if (typeof showAI === 'function') showAI('360° 사진 분석 중… ' + i + '/' + list.length, Math.round(it.deg) + '° 사진'); } catch (e) {}
      return cap(it.url).then(function (u) {
        state.shots[it.key] = u;
        return X.faceOne(it.key);
      }).then(function (fy) {
        faceYaw = fy;
        return X.extractOne(it.key);
      }).then(function (ok) {
        var mi = state.hairMasks && state.hairMasks[it.key], m = null;
        if (ok && mi) { try { m = measure(mi); } catch (e) { m = null; } }
        if (m) {
          // 가볍게: 형태 계산에 쓰는 것만 남김
          ['photoRGB', 'personMask', 'reasonCanvas', 'avgColorsBySection', 'colorPalette', 'faceBoxDiag'].forEach(function (n) { try { mi[n] = null; } catch (e) {} });
          mi._x360 = true;
          var fc = faceYaw && typeof faceYaw === 'object' ? faceYaw : null;
          X.views[it.key] = { key: it.key, deg: it.deg, m: m, cal: null, ratio: null, ratioSrc: '', ratioBad: '', why: '', kind: '',
            face: fc, faceYaw: fc ? fc.yaw : faceYaw, ec: fc && fc.ecN > 0 ? fc.ecN * m.h : 0 };
          X.order.push(it.key); okN++;
        } else {
          try { if (state.hairMasks) delete state.hairMasks[it.key]; } catch (e) {}
          console.warn(TAG + ' ' + it.key + '(' + Math.round(it.deg) + '°) 분석 실패 — 이 사진은 안 씁니다');
        }
        dropKey(it.key);
      }, function (e) {
        try { if (state.hairMasks) delete state.hairMasks[it.key]; } catch (x) {}
        dropKey(it.key);
        console.warn(TAG + ' ' + it.key + ' 분석 중 오류 — 안 씁니다', e);
      }).then(one);
    }
    X.busy = one().then(function () {
      X.busy = false;
      if (fpNow() !== fp0) { clearViews(); console.warn(TAG + ' 분석하는 사이 사진이 바뀌어 버립니다'); return false; }
      fillRatios();
      X.forSet = set; X.fp = fp0;
      X.note = '추가 ' + list.length + '장 중 ' + okN + '장 분석 · ' + (Date.now() - t0) + 'ms';
      console.log(TAG + ' ' + X.note + ' — ' + X.order.map(function (k) { var v = X.views[k]; return k + ' ×' + v.ratio.toFixed(3) + '(' + v.ratioSrc + ')'; }).join(' · '));
      try { var A = X.advice(); if (A && A.items.length) console.warn(TAG + ' 촬영 안내 — ' + A.items.map(function (it) { return Math.round(it.deg) + '°' + (it.base ? '(기준)' : '') + ' ' + it.kind + ': ' + it.why; }).join(' · ')); } catch (e) {}
      X.advisePending = true; watchAdvice();          // 카드는 첫 렌더가 끝난 뒤에(아래 watchAdvice)
      return okN > 0;
    }, function (e) { X.busy = false; console.warn(TAG + ' 준비 실패', e); return false; });
    return X.busy;
  };

  /* 4장 추출이 끝난 직후(모델이 올라와 있는 동안) 이어서 */
  if (typeof W.extractHairMask === 'function') {
    prevExtract = W.extractHairMask;
    W.extractHairMask = function (angle) {
      var p = prevExtract.apply(this, arguments);
      if (angle !== 'back' || !p || typeof p.then !== 'function') return p;
      return p.then(function (r) {
        var go = false; try { go = X.on && setLive() && !(X.forSet === state.shots360 && X.fp === fpNow()); } catch (e) {}
        if (!go) { try { if (!setLive() && X.order.length) clearViews(); } catch (e) {} return r; }
        return Promise.resolve(X.prepare()).then(function () { return r; }, function () { return r; });
      });
    };
  }
  /* 세트를 넣은 순간의 4장 지문 — 이후 4장이 바뀌면(다른 손님 사진) 추가 사진은 안 씀.
     얼굴 각도를 못 재는 좌·우·후면은 가정값(±90°·180°) 대신 센서 각도를 쓰게 촬영 포즈로 넣어 둠(01 getViewPoseSource의 'live' 단계). */
  try {
    var Q = W.SHOT360, oApply = Q && Q.applySet;
    if (typeof oApply === 'function') Q.applySet = function (set) {
      clearViews(); X.setFp = null;
      return Promise.resolve(oApply.apply(Q, arguments)).then(function (ok) {
        if (!ok) return ok;
        X.setFp = fpNow();
        try {
          var p = picks(set), d0 = p.front ? wrapDeg(p.front.deg) : 0;
          state.capturePose = state.capturePose || {};
          ['left', 'right', 'back'].forEach(function (a) {
            if (!p[a]) return;
            state.capturePose[a] = { yawDeg: wrapDeg(p[a].deg - d0), pitchDeg: 0, rollDeg: 0, _x360: true };
          });
        } catch (e) { console.warn(TAG + ' 센서 각도를 포즈로 넣기 실패', e); }
        return ok;
      });
    };
  } catch (e) { console.warn(TAG + ' applySet 연결 실패', e); }
  /* 3D를 만들기 직전에 한 번 더(추출 때 못 했으면) */
  var oBuild = W.buildNeutralHair3D;
  if (typeof oBuild === 'function') W.buildNeutralHair3D = function (cb) {
    var self = this, args = arguments, need = false;
    try { need = X.on && setLive() && !(X.forSet === state.shots360 && X.fp === fpNow()); } catch (e) {}
    if (!need) { try { if (!setLive() && X.order.length) clearViews(); } catch (e) {} return oBuild.apply(self, args); }
    var hasModel = false; try { hasModel = !!segmenter; } catch (e) {}
    if (!hasModel) { X.note = '분석 모델이 내려가 있어 추가 사진을 분석하지 못함 — 4장으로만 계산'; console.warn(TAG + ' ' + X.note); return oBuild.apply(self, args); }
    Promise.resolve(X.prepare()).then(function () { oBuild.apply(self, args); }, function () { oBuild.apply(self, args); });
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ② 카메라 맞추기 + 걸러내기 → ③ 프로브에 넣기
   * ────────────────────────────────────────────────────────────────────── */
  /* 맞춘 카메라로 두피(머리 나는 자리 · 그 사진 쪽을 향한 면)를 사진에 되쏘았을 때 머리 마스크 안에 떨어지는 비율 */
  function scalpAgree(cal, mi, yTop, CY) {
    var Es = null; try { Es = getScalpEllipsoid(); } catch (e) {}
    if (!Es || !cal || !mi || !mi.reasonMask) return null;
    var R = composeRotationZYX(cal.pose.yaw, cal.pose.pitch || 0, cal.pose.roll || 0);
    var mw = mi.maskW || mi.w, mh = mi.maskH || mi.h, kx = mw / mi.w, ky = mh / mi.h, mk = mi.reasonMask;
    var a2 = Es.a * Es.a, b2 = Es.b * Es.b, c2 = Es.c * Es.c, NP = 16, NT = 40, r, c, n = 0, hit = 0;
    function hairAt(ix, iy) {
      var x = Math.round(ix * kx), y = Math.round(iy * ky), dx, dy, xx, yy;
      for (dy = -2; dy <= 2; dy += 2) for (dx = -2; dx <= 2; dx += 2) {
        xx = x + dx; yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < mw && yy < mh && mk[yy * mw + xx] === 1) return true;
      }
      return false;
    }
    for (r = 1; r < NP; r++) for (c = 0; c < NT; c++) {
      var ph = (r + 0.5) / NP * (Math.PI * 0.75), th = (c + 0.5) / NT * 2 * Math.PI - Math.PI, lim = Math.PI;
      try { lim = scalpPhiMax(th); } catch (e) {}
      if (ph > lim - 0.06) continue;                                     // 두피 경계 안쪽만
      var x = Es.a * Math.sin(ph) * Math.sin(th), y = Es.b * Math.cos(ph), z = Es.c * Math.sin(ph) * Math.cos(th);
      var nx = x / a2, ny = y / b2, nz = z / c2, nl = Math.hypot(nx, ny, nz) || 1;
      if ((R[6] * nx + R[7] * ny + R[8] * nz) / nl < 0.5) continue;       // 그 사진 쪽을 향한 면만
      var ix = (R[0] * x + R[1] * y + R[2] * z) / cal.s + cal.cx, iy = cal.crownY + (yTop - ((R[3] * x + R[4] * y + R[5] * z) + CY)) / cal.sy;
      n++;
      if (ix >= 0 && iy >= 0 && ix < mi.w && iy < mi.h && hairAt(ix, iy)) hit++;
    }
    return n >= 12 ? hit / n : null;
  }
  X._scalpAgree = scalpAgree;

  function headHalfWidthAt(yaw) {
    var E = null; try { E = getHeadEllipsoid(); } catch (e) {}
    if (!E) return 0;
    var cs = Math.cos(yaw), sn = Math.sin(yaw);
    return Math.sqrt(E.a * E.a * cs * cs + E.c * E.c * sn * sn);
  }
  /* 보정(정면 배율) 없이도 알 수 있는 문제. {kind, why} — kind: frame(화면 밖) · dist(거리/배율) · angle(각도) · height(폰 높이) */
  function precheck(v, frontYawDeg) {
    var m = v.m, fp = frameProblem(m);
    if (fp) return { kind: 'frame', why: fp };
    if (v.ratioBad) return { kind: 'dist', why: v.ratioBad };
    var yawS = wrapDeg(v.deg - (X.degFront || 0)) + (frontYawDeg || 0);
    if (typeof v.faceYaw === 'number' && Math.abs(wrapDeg(v.faceYaw - yawS)) > X.yawTol) return { kind: 'angle', why: '센서 각도와 얼굴 각도가 다름(센서 ' + yawS.toFixed(0) + '° · 얼굴 ' + v.faceYaw.toFixed(0) + '°)' };
    if (v.face && v.face.pitch != null && X.refFace && X.refFace.pitch != null && Math.abs(v.face.pitch - X.refFace.pitch) > X.pitchTol) return { kind: 'height', why: '올려다보거나 내려다본 사진(고개 각도 ' + v.face.pitch.toFixed(0) + '° · 정면 ' + X.refFace.pitch.toFixed(0) + '°)' };
    if (v.faceYaw === null && Math.abs(yawS) <= X.faceMustDeg) return { kind: 'angle', why: '얼굴이 보여야 할 각도(' + yawS.toFixed(0) + '°)인데 얼굴을 못 찾음' };
    return { kind: '', why: '' };
  }
  /* 추가 사진 한 장: 카메라 + 뺄 이유(없으면 '') */
  function calFor(v, viewCal, yTop, CY, ctx) {
    var f = viewCal && viewCal.front, m = v.m, out = { cal: null, why: '', kind: '' };
    v.q = null; v.agree = null; v.yawSensor = null;
    if (!f || !(f.sy > 0) || !f.pose) { out.why = '정면 보정 없음'; return out; }
    var basic = !m || m.hw < 4 || m.valid < m.w * X.minCols;
    if (basic) { out.why = frameProblem(m); out.kind = 'frame'; return out; }
    if (!(v.ratio > 0)) { out.why = '배율 없음'; out.kind = 'dist'; return out; }
    var sy = f.sy * v.ratio;
    if (!isFinite(sy) || !(sy > 0)) { out.why = '배율 계산 실패'; out.kind = 'dist'; return out; }
    var frontYaw = (f.pose.yaw || 0) * 180 / Math.PI, yawS = wrapDeg(v.deg - (X.degFront || 0)) + frontYaw;   // 센서 기준 yaw(도)
    v.yawSensor = yawS;
    var yawDeg = (typeof v.faceYaw === 'number') ? v.faceYaw : yawS;                          // 얼굴이 잡혔으면 얼굴 실측
    var cal = { pose: { yaw: yawDeg * Math.PI / 180, pitch: 0, roll: 0 }, cx: m.capCx, s: sy, sy: sy, crownY: m.crown, x360: true };
    out.cal = cal;
    var A = headHalfWidthAt(cal.pose.yaw); v.q = A > 0 ? m.hw * sy / A : null;
    try { v.agree = scalpAgree(cal, state.hairMasks[v.key], yTop, CY); } catch (e) { v.agree = null; }
    if (!X.gate) return out;
    var pre = precheck(v, frontYaw);
    if (pre.why) { out.why = pre.why; out.kind = pre.kind; }
    else if (v.q != null && (v.q < X.qLo || v.q > X.qHi)) { out.kind = 'dist'; out.why = '머리 크기가 안 맞음(두상 폭의 ' + v.q.toFixed(2) + '배 — ' + (v.q > X.qHi ? '너무 가깝게 찍혔거나 배율이 틀림' : '너무 멀거나 머리가 잘림') + ')'; }
    else if (Math.abs(wrapDeg(yawDeg)) >= X.agreeFromDeg && v.agree != null && v.agree < ctx.thr) { out.kind = 'angle'; out.why = '두피가 머리 영역 밖으로 나감(맞음 ' + Math.round(v.agree * 100) + '% < ' + Math.round(ctx.thr * 100) + '%)'; }
    return out;
  }
  /* 기준 좌·우·후면(360 세트에서 온 것): 프로브에서 뺄 이유 */
  function baseProblem(name, viewCal, yTop, CY, ctx) {
    var mi = state.hairMasks && state.hairMasks[name], cal = viewCal[name], info = { name: name, agree: null, why: '' };
    if (!mi || !cal) return info;
    var m = null; try { m = measure(mi); } catch (e) {}
    var fp = frameProblem(m); if (fp) { info.why = fp; return info; }
    var yawDeg = cal.pose.yaw * 180 / Math.PI, lm = null, canFace = false;
    try { lm = state.landmarks && state.landmarks[name]; canFace = X.canFace(); } catch (e) {}
    var hasFace = !!(lm && typeof lm.poseYawDeg === 'number');
    if (canFace && !hasFace && Math.abs(wrapDeg(yawDeg)) <= X.faceMustDeg && name !== 'back') { info.why = '얼굴이 보여야 할 각도(' + yawDeg.toFixed(0) + '°)인데 얼굴을 못 찾음'; return info; }
    if (hasFace || Math.abs(wrapDeg(yawDeg)) < X.agreeFromDeg) return info;   // 앞쪽 사진은 두피 되쏘기를 안 봄(이마 헤어라인이 사람마다 달라 안 맞음)
    try { info.agree = scalpAgree(cal, mi, yTop, CY); } catch (e) {}
    if (info.agree != null && info.agree < ctx.thr) info.why = '두피가 머리 영역 밖으로 나감(맞음 ' + Math.round(info.agree * 100) + '% < ' + Math.round(ctx.thr * 100) + '%)';
    return info;
  }

  var oProbe = W.makeHairOccupancyProbe;
  if (typeof oProbe === 'function') W.makeHairOccupancyProbe = function (viewCal, names, yTop, CY, scale) {
    X.last = { used: [], dropped: [], base: (names || []).slice(), baseDropped: [], baseWarn: [], baseInfo: {}, setBad: '', thr: null, agreeFront: null };
    try {
      if (active() && viewCal && viewCal.front) {
        var L = X.last, vc = Object.assign({}, viewCal), nm = names.slice();
        var ctx = { thr: X.agreeMin };
        L.thr = ctx.thr;
        // 추가 사진 평가
        var res = {};
        X.order.forEach(function (k) {
          var v = X.views[k]; v.cal = null; v.why = '';
          if (X.skip.indexOf(k) >= 0) { v.why = '사용자가 뺌(skip)'; return; }
          if (!(state.hairMasks && state.hairMasks[k])) { v.why = '마스크 없음'; return; }
          res[k] = calFor(v, viewCal, yTop, CY, ctx); v.why = res[k].why; v.kind = res[k].kind;
        });
        // 세트 전체: 얼굴로 확인한 사진 중 센서 각도가 어긋난 것
        var checked = 0, bad = 0;
        X.order.forEach(function (k) {
          var v = X.views[k]; if (v.yawSensor == null || v.faceYaw === undefined) return;
          if (typeof v.faceYaw === 'number') { checked++; if (Math.abs(wrapDeg(v.faceYaw - v.yawSensor)) > X.yawTol) bad++; }
          else if (Math.abs(v.yawSensor) <= X.faceMustDeg) { checked++; bad++; }
        });
        ['left', 'right'].forEach(function (a) {                                  // 기준 좌·우: 센서 각도 ↔ 얼굴 실측
          try {
            var lm = state.landmarks && state.landmarks[a], sd = X.baseDeg && X.baseDeg[a];
            if (sd == null || !viewCal[a]) return;
            var ys = wrapDeg(sd - (X.degFront || 0)) + (viewCal.front.pose.yaw || 0) * 180 / Math.PI;
            if (lm && typeof lm.poseYawDeg === 'number') { checked++; if (Math.abs(wrapDeg(lm.poseYawDeg - ys)) > X.yawTol) bad++; }
            else if (X.canFace() && Math.abs(ys) <= X.faceMustDeg) { checked++; bad++; }
          } catch (e) {}
        });
        if (X.gate && bad >= X.setBadMin && bad >= checked * X.setBadFrac) {
          L.setBad = '얼굴로 확인한 ' + checked + '장 중 ' + bad + '장의 센서 각도가 실제와 달라, 확인할 수 없는 옆·뒤 사진의 각도도 믿을 수 없음 — 추가 사진을 전부 안 씀';
          X.order.forEach(function (k) { var v = X.views[k]; if (!v.why) { v.why = '세트의 센서 각도를 못 믿음'; v.kind = 'angle'; } });
        }
        X.order.forEach(function (k) {
          var v = X.views[k], r = res[k];
          if (v.why || !r || !r.cal) { L.dropped.push(k); return; }
          v.cal = r.cal; vc[k] = r.cal; nm.push(k); L.used.push(k);
        });
        // 기준 좌·우·후면
        if (X.gate) ['left', 'right', 'back'].forEach(function (a) {
          var j = nm.indexOf(a); if (j < 0) return;
          var bi = baseProblem(a, viewCal, yTop, CY, ctx); L.baseInfo[a] = bi;
          if (bi.why && X.gateBase) { nm.splice(j, 1); L.baseDropped.push(a); }
          else if (bi.why) L.baseWarn.push(a);
        });
        console.log(TAG + ' 형태 계산: 기준 ' + nm.filter(function (n) { return BASE.indexOf(n) >= 0; }).join(',') + ' + 추가 ' + L.used.length + '장(' + (L.used.join(',') || '없음') + ')' +
          (L.dropped.length ? ' · 뺀 추가 사진 ' + L.dropped.map(function (k) { return k + '[' + X.views[k].why + ']'; }).join(' ') : '') +
          (L.baseDropped.length ? ' · 뺀 기준 사진 ' + L.baseDropped.map(function (a) { return a + '[' + L.baseInfo[a].why + ']'; }).join(' ') : '') +
          (L.baseWarn.length ? ' · ⚠ 의심스러운 기준 사진(그대로 씀) ' + L.baseWarn.map(function (a) { return a + '[' + L.baseInfo[a].why + ']'; }).join(' ') : '') +
          (L.setBad ? ' · ⚠ ' + L.setBad : ''));
        if (L.used.length || L.baseDropped.length) return oProbe.call(this, vc, nm, yTop, CY, scale);
      }
    } catch (e) { console.warn(TAG + ' 추가 사진 넣기 실패 — 4장으로만 계산', e); if (X.last) { X.last.used = []; X.last.baseDropped = []; } }
    return oProbe.apply(this, arguments);
  };

  /* ────────────────────────────────────────────────────────────────────────
   * 촬영 안내 — 어떤 사진에 무슨 문제가 있었나(분석 직후 · 보정 전에 알 수 있는 것)
   * ────────────────────────────────────────────────────────────────────── */
  var KINDS = ['frame', 'blur', 'angle', 'dist', 'height'];
  var TXT = {
    ko: {
      title: '촬영 안내',
      intro: function (n, t) { return t + '장 중 ' + n + '장에서 문제가 보였어요.'; },
      frame: ['머리가 화면 밖으로 나감', '머리 전체가 타원 안에 들어오게 해 주세요.'],
      blur: ['흔들림', '조금 더 천천히 돌아 주세요.'],
      angle: ['각도가 어긋남', '손님은 가만히 있고, 폰이 머리 둘레를 돌아야 해요.'],
      dist: ['거리가 달라짐', '처음과 같은 거리를 유지해 주세요(어깨까지 보이게).'],
      height: ['폰 높이가 달라짐', '폰을 처음과 같은 높이로 들어 주세요.'],
      base: function (l) { return '기준 사진(' + l + ')에 문제가 있어 결과가 부정확할 수 있어요.'; },
      extra: function (n) { return '문제가 있는 추가 사진 ' + n + '장은 빼고 계산합니다.'; },
      setBad: '돌면서 찍은 각도를 믿을 수 없어 추가 사진은 쓰지 않습니다.',
      redo: '더 나은 품질을 원하시면 다시 찍어 주세요.',
      again: '다시 찍기', go: '그대로 진행', more: function (n) { return ' 외 ' + n + '장'; },
      front: '정면', back: '뒤', left: function (d) { return '왼쪽 ' + d + '°'; }, right: function (d) { return '오른쪽 ' + d + '°'; }
    },
    en: {
      title: 'Capture check',
      intro: function (n, t) { return n + ' of ' + t + ' photos had a problem.'; },
      frame: ['Head went out of the frame', 'Keep the whole head inside the oval.'],
      blur: ['Motion blur', 'Walk around a little more slowly.'],
      angle: ['Angle drifted', 'The client stays still; the phone circles the head.'],
      dist: ['Distance changed', 'Keep the same distance as at the start (shoulders in view).'],
      height: ['Phone height changed', 'Hold the phone at the same height as at the start.'],
      base: function (l) { return 'The key photos (' + l + ') have a problem, so the result may be inaccurate.'; },
      extra: function (n) { return n + ' extra photo' + (n > 1 ? 's' : '') + ' with problems will be left out of the calculation.'; },
      setBad: 'The capture angles cannot be trusted, so the extra photos are not used.',
      redo: 'For better quality, please shoot again.',
      again: 'Shoot again', go: 'Continue', more: function (n) { return ' +' + n + ' more'; },
      front: 'front', back: 'back', left: function (d) { return 'left ' + d + '°'; }, right: function (d) { return 'right ' + d + '°'; }
    }
  };
  function lang() { try { return uiLang === 'ko' ? 'ko' : 'en'; } catch (e) { return 'ko'; } }
  function degLabel(deg, T) { var d = Math.round(wrapDeg(deg)); return d === 0 ? T.front : Math.abs(d) === 180 ? T.back : d > 0 ? T.left(d) : T.right(-d); }
  /* {total, items:[{deg, base, kind, why}], baseBad:[deg], extraBad:n} — 세트가 없거나 분석 전이면 null */
  X.advice = function () {
    var set = null; try { set = state.shots360; } catch (e) {}
    if (!set || !set.frames || !setLive() || X.forSet !== set) return null;
    var p = picks(set), items = [], seen = {}, frontYaw = X.refFace ? X.refFace.yaw : 0;
    function add(deg, base, kind, why) { var k = Math.round(wrapDeg(deg)) + ':' + kind; if (seen[k]) return; seen[k] = true; items.push({ deg: wrapDeg(deg), base: base, kind: kind, why: why }); }
    // 흔들림
    var sh = set.frames.map(function (f) { return f.sharp; }).filter(function (x) { return x > 0; }).sort(function (a, b) { return a - b; });
    var med = sh.length ? sh[sh.length >> 1] : 0;
    var baseFrames = [p.front, p.left, p.right, p.back];
    if (med > 0) set.frames.forEach(function (f) { if (f.sharp > 0 && f.sharp < med * X.blurFrac) add(f.deg, baseFrames.indexOf(f) >= 0, 'blur', '선명도 ' + f.sharp + ' (세트 중앙값 ' + med + ')'); });
    // 기준 4장
    BASE.forEach(function (a) {
      var f = p[a]; if (!f) return;
      var mi = state.hairMasks && state.hairMasks[a], m = null; try { m = measure(mi); } catch (e) {}
      var fp = mi ? frameProblem(m) : '';
      if (fp) { add(f.deg, true, 'frame', fp); return; }
      var lm = null; try { lm = state.landmarks && state.landmarks[a]; } catch (e) {}
      var hasFace = !!(lm && typeof lm.poseYawDeg === 'number'), ys = wrapDeg(f.deg - (X.degFront || 0)) + frontYaw;
      var couldFace = X.faceWasReady || X.canFace();
      if (a === 'front') { if (couldFace && !hasFace) add(f.deg, true, 'angle', '정면 사진에서 얼굴을 못 찾음'); return; }
      if (a === 'back') return;
      if (hasFace && Math.abs(wrapDeg(lm.poseYawDeg - ys)) > X.yawTol) add(f.deg, true, 'angle', '센서 각도와 얼굴 각도가 다름(센서 ' + ys.toFixed(0) + '° · 얼굴 ' + lm.poseYawDeg.toFixed(0) + '°)');
      else if (couldFace && !hasFace && Math.abs(ys) <= X.faceMustDeg) add(f.deg, true, 'angle', '얼굴이 보여야 할 각도(' + ys.toFixed(0) + '°)인데 얼굴을 못 찾음');
      else if (hasFace && typeof lm.posePitchDeg === 'number' && X.refFace && X.refFace.pitch != null && Math.abs(lm.posePitchDeg - X.refFace.pitch) > X.pitchTol) add(f.deg, true, 'height', '올려다보거나 내려다본 사진');
    });
    // 추가 사진
    var extraBad = 0;
    X.order.forEach(function (k) {
      var v = X.views[k], pre = v.why ? { kind: v.kind, why: v.why } : precheck(v, frontYaw);
      if (pre.why && pre.kind) { add(v.deg, false, pre.kind, pre.why); extraBad++; }
    });
    var baseBad = []; items.forEach(function (it) { if (it.base && it.kind !== 'blur' && baseBad.indexOf(it.deg) < 0) baseBad.push(it.deg); });
    var bad = {}; items.forEach(function (it) { bad[Math.round(it.deg)] = 1; });
    return { total: set.frames.length, bad: Object.keys(bad).length, items: items, baseBad: baseBad, extraBad: extraBad, setBad: !!(X.last && X.last.setBad) };
  };
  X.adviceText = function (lg) {
    var A = X.advice(); if (!A || !A.items.length) return null;
    var T = TXT[lg || lang()], lines = [];
    KINDS.forEach(function (kd) {
      var its = A.items.filter(function (it) { return it.kind === kd; }); if (!its.length) return;
      its.sort(function (a, b) { return (b.base ? 1 : 0) - (a.base ? 1 : 0) || Math.abs(a.deg) - Math.abs(b.deg); });
      var lab = its.slice(0, 4).map(function (it) { return degLabel(it.deg, T); }).join(', ') + (its.length > 4 ? T.more(its.length - 4) : '');
      lines.push({ head: T[kd][0], where: lab, tip: T[kd][1] });
    });
    var notes = [];
    if (A.baseBad.length) notes.push(T.base(A.baseBad.map(function (d) { return degLabel(d, T); }).join(', ')));
    if (A.setBad) notes.push(T.setBad); else if (A.extraBad) notes.push(T.extra(A.extraBad));
    return { title: T.title, intro: T.intro(A.bad, A.total), lines: lines, notes: notes, redo: T.redo, again: T.again, go: T.go };
  };
  /* 첫 머리가 다 그려졌나: 촬영·스타일 화면이 아니고 · 분석 덮개가 내려갔고 · 3D 만들기/다시 기르기가 끝났음 */
  function adviceReady() {
    try {
      if (typeof currentScreen === 'undefined' || currentScreen === 'capture' || currentScreen === 'style') return false;
      var ov = document.getElementById('aiOverlay'); if (ov && !ov.classList.contains('hidden')) return false;
      try { if (typeof NEUTRAL_BUILD !== 'undefined' && NEUTRAL_BUILD.running) return false; } catch (e) {}
      var photo = state._hair3Dneutral; if (!photo || !photo.strands || !photo.strands.length) return false;
      var RG = W.REGROW, mq = false; try { mq = !!MANNEQUIN.on; } catch (e) {}
      if (RG && RG.building) return false;
      if (RG && RG.on && !mq && RG.failedFor !== photo && !(RG.model && RG.src === photo)) return false;    // 다시 기르기가 아직 안 끝남
      return true;
    } catch (e) { return false; }
  }
  X._adviceReady = adviceReady;
  var advTimer = null, advOk = 0;
  function stopWatch() { if (advTimer) { clearInterval(advTimer); advTimer = null; } }
  function watchAdvice() {
    if (advTimer) return;
    advOk = 0;
    advTimer = setInterval(function () {
      if (!X.advisePending || !X.advise || !setLive()) { stopWatch(); return; }
      if (!adviceReady()) { advOk = 0; return; }
      if (++advOk < 2) return;                          // 두 번 연속(≈1초) 그대로일 때
      stopWatch(); X.advisePending = false;
      try { X.showAdvice(false); } catch (e) {}
    }, 500);
  }
  X.hideAdvice = function () { var el = document.getElementById('views360Advice'); if (el && el.parentNode) el.parentNode.removeChild(el); };
  /* 안내 카드. force=true면 이미 본 세트라도 다시 */
  X.showAdvice = function (force) {
    try {
      if (!X.advise && !force) return false;
      if (!force && X.advisedFp === X.fp) return false;
      var t = X.adviceText(); X.hideAdvice();
      if (!t) return false;
      X.advisedFp = X.fp;
      var esc = function (x) { return String(x).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
      var el = document.createElement('div'); el.id = 'views360Advice';
      el.style.cssText = 'position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:min(440px,calc(100vw - 24px));max-height:62vh;overflow:auto;z-index:9000;' +
        'background:#221c16;color:#f2e8da;border:1px solid #c9874a;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.55);padding:14px 16px 12px;font:14px/1.5 system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;';
      el.innerHTML = '<div style="font-weight:700;font-size:15px;color:#e6a468;margin-bottom:4px">' + esc(t.title) + '</div>' +
        '<div style="margin-bottom:8px">' + esc(t.intro) + '</div>' +
        t.lines.map(function (l) {
          return '<div style="margin:0 0 8px"><div><b>' + esc(l.head) + '</b> <span style="opacity:.75">— ' + esc(l.where) + '</span></div><div style="opacity:.85;font-size:13px">' + esc(l.tip) + '</div></div>';
        }).join('') +
        t.notes.map(function (n) { return '<div style="font-size:13px;opacity:.85;margin:0 0 4px">' + esc(n) + '</div>'; }).join('') +
        '<div style="margin:8px 0 10px;font-weight:600">' + esc(t.redo) + '</div>' +
        '<div style="display:flex;gap:8px"><button type="button" id="views360AdviceAgain" style="flex:1;padding:10px 8px;border-radius:10px;border:1px solid #c9874a;background:transparent;color:#e6a468;font:inherit;font-weight:600">' + esc(t.again) + '</button>' +
        '<button type="button" id="views360AdviceGo" style="flex:1;padding:10px 8px;border-radius:10px;border:0;background:#c9874a;color:#1a1410;font:inherit;font-weight:700">' + esc(t.go) + '</button></div>';
      document.body.appendChild(el);
      document.getElementById('views360AdviceGo').onclick = function () { X.hideAdvice(); };
      document.getElementById('views360AdviceAgain').onclick = function () {
        X.hideAdvice();
        try { if (typeof navTo === 'function') navTo('capture'); } catch (e) {}
        try { if (W.SHOT360 && typeof W.SHOT360.open === 'function') W.SHOT360.open(); } catch (e) {}
      };
      return true;
    } catch (e) { console.warn(TAG + ' 안내 카드 실패', e); return false; }
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ④ 진단
   * ────────────────────────────────────────────────────────────────────── */
  X.lines = function () {
    var L = [], set = null; try { set = state.shots360; } catch (e) {}
    if (!X.on) return [TAG + ' 꺼짐'];
    if (!set || !set.frames) return [TAG + ' 켜짐 · 360 세트 없음(4장으로 계산)'];
    if (!setLive()) return [TAG + ' 켜짐 · 360 세트(' + set.frames.length + '장)가 있지만 지금 4장이 그 세트의 것이 아님 — 추가 사진 안 씀'];
    var la = X.last, used = la ? la.used : [];
    L.push(TAG + ' 켜짐 · 세트 ' + set.frames.length + '장 · ' + (X.note || '아직 분석 전') +
      ' · 형태 계산에 넣은 추가 사진 ' + used.length + '장' + (la && la.dropped.length ? ' · 뺀 추가 사진 ' + la.dropped.length + '장' : '') +
      (la && la.baseDropped.length ? ' · 뺀 기준 사진 ' + la.baseDropped.join(',') : '') +
      (la && la.baseWarn && la.baseWarn.length ? ' · ⚠ 의심스러운 기준 사진 ' + la.baseWarn.join(',') + '(그대로 씀 — 다시 찍는 것이 좋음)' : '') + (X.gate ? '' : ' · 걸러내기 꺼짐') +
      (la ? '' : ' (3D를 아직 안 만듦)'));
    if (la && la.setBad) L.push('  ⚠ ' + la.setBad);
    try { var ad = X.advice(); if (ad) L.push('  촬영 안내(화면 카드) — ' + (ad.items.length ? ad.items.map(function (it) { return Math.round(it.deg) + '°' + (it.base ? '(기준)' : '') + ' ' + it.kind; }).join(' · ') : '문제 없음') + (X.advise ? '' : ' · 카드 꺼짐')); } catch (e) {}
    if (X.bodyRuler) L.push('  배율 자 — 얼굴이 잡힌 사진은 눈→턱 · 없는 사진은 어깨선/목 밑동: ' + (X.bodyRuler.n ? '얼굴 자와 대조 ' + X.bodyRuler.n + '장 · 중앙 오차 ' + Math.round(X.bodyRuler.med * 100) + '% → ' + (X.bodyRuler.ok ? '믿음' : '⚠ 못 믿음(얼굴 없는 사진은 뺌)') : '대조할 얼굴 사진이 없어 그대로 씀'));
    if (!X.order.length) return L;
    L.push('  뷰: 센서각 → 쓴 yaw(얼굴 실측이 있으면 그 값) · 배율(정면 대비 · 출처) · 머리크기(두상 폭 대비) · 두피 맞음(옆·뒤 ' + X.agreeFromDeg + '° 이상만 봄 · 문턱 ' + Math.round(X.agreeMin * 100) + '%) → 넣음/뺌');
    X.order.forEach(function (k) {
      var v = X.views[k];
      L.push('   ' + k + ' ' + Math.round(v.deg) + '°' + (v.yawSensor != null ? ' → ' + (typeof v.faceYaw === 'number' ? '얼굴 ' + v.faceYaw.toFixed(0) + '°(센서 ' + v.yawSensor.toFixed(0) + '°)' : v.yawSensor.toFixed(0) + '°' + (v.faceYaw === null ? '(얼굴 못 찾음)' : '')) : '') +
        ' · ×' + (v.ratio != null ? v.ratio.toFixed(3) : '?') + ' ' + v.ratioSrc +
        (v.q != null ? ' · 크기 ' + v.q.toFixed(2) : '') + (v.agree != null ? ' · 맞음 ' + Math.round(v.agree * 100) + '%' : '') +
        ' · cx ' + Math.round(v.m.capCx) + '/' + v.m.w + ' · 위 ' + Math.round(v.m.crown) + 'px' +
        (v.cal ? ' → 넣음' : ' → 뺌: ' + (v.why || '아직 평가 전')));
    });
    if (la && la.baseInfo) {
      var bl = ['left', 'right', 'back'].filter(function (a) { return la.baseInfo[a]; }).map(function (a) {
        var bi = la.baseInfo[a], out = la.baseDropped.indexOf(a) >= 0;
        return a + (bi.agree != null ? ' 맞음 ' + Math.round(bi.agree * 100) + '%' : '') + (bi.why ? (out ? ' → 형태 계산에서 뺌: ' : ' → ⚠ 의심(그대로 씀): ') + bi.why : ' → 괜찮음');
      });
      if (bl.length) L.push('  기준 사진 — ' + bl.join(' · '));
    }
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(X.lines()); } catch (e) {}
    return L;
  };

  console.log(TAG + ' 설치 — 360 세트의 나머지 사진을 형태 계산(점유·뿌리밀도·다시 기르기)에 넣습니다(의심스러운 사진은 뺌). 콘솔: VIEWS360.lines().join("\\n")');
})();
