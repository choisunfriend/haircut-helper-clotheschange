/* ==========================================================================
 * 50-shoulders.js — 어깨: 머리카락이 몸통을 뚫지 않고 어깨 위·앞·뒤로 놓이게 + "어깨 앞으로 넘겼는가" 인지
 *
 * 로드 위치: index.html 맨 끝(49-photo-change.js 다음).
 *
 * 왜 (2026-10-04 사용자): "어깨 위에 놓이지는 않았어." → "어깨 앞으로 나왔다는 건 인지할 수 있어?
 *   그러면 3D 결과보기에 붙일 몸통 메쉬에서 읽어 보면 되겠네." → "다 넣고, 안 맞으면 빼면 되지."
 *   지금까지 머리카락 계산에는 두상(과 47g의 목 기둥)만 있었고 어깨가 없어서, 긴 머리가 몸통을 그대로 통과했습니다.
 *
 * 무엇을:
 *   ① 어깨 모양을 3D 결과 화면에 붙는 몸통(의상) 메쉬에서 직접 읽습니다 — 어림값이 아니라 그 메쉬의 삼각형을
 *      촘촘히 찍어 (좌우 |x| × 높이 y) 칸마다 "몸통 앞면 z / 뒷면 z"와 "어깨 윗면 높이"를 적어 둡니다.
 *      · 몸통 메쉬는 원래 3D 결과 화면에 들어갈 때 처음 불러오므로, 스타일·조정 화면에 들어올 때 한 번 미리 불러와 잽니다
 *        (재고 나면 버림 · 사진이 바뀌면 다시 잼). 미리 못 쟀으면 3D 결과 화면이 불러올 때 잽니다.
 *   ② 모든 가닥(다시 기른 원본 머리 · 마네킹 스타일 · 길이를 늘린 부분)에 마지막으로 한 번 "몸통 밖으로" 통과시킵니다.
 *      몸통 안에 든 점은 — 어깨 윗면에 살짝 걸친 정도면 위에 얹고, 깊으면 앞면이나 뒷면으로 밀어냅니다.
 *      앞/뒤는 가닥마다 한 번 정합니다: 몸통에 닿기 직전에 어깨 능선보다 앞에 있었으면 앞, 뒤에 있었으면 뒤.
 *      능선 바로 위라 애매하면 ③의 인지 결과를 따릅니다(그쪽을 앞으로 넘긴 사진이면 앞, 아니면 뒤).
 *      목(턱 밑~목 밑동)은 42번의 목 기둥을 같이 씁니다.
 *   ③ 인지 — 정면 사진에서 어깨선 아래에 보이는 머리는 몸 앞에 있는 머리입니다(뒤에 있으면 몸에 가려 안 보임).
 *      사람 영역의 폭이 귀 사이 거리의 2.1배를 넘는 첫 줄을 어깨선으로 보고, 그 아래 머리를 화면 왼쪽/오른쪽 따로 잽니다.
 *      후면 사진은 포즈가 잡은 어깨 높이 아래의 머리(= 등 쪽 머리)를 잽니다. 진단에 숫자로 찍습니다.
 *
 * (2026-10-04i) 앞으로는 사진에서 넘긴 쪽만 — 사용자: "머리가 길기만 하면 다 어깨 앞으로 나온다. 사진에서 어깨 앞으로 머리를 뺀 경우만."
 *   예전: 가닥이 몸통에 닿기 직전에 어깨 능선보다 앞에 있었으면 무조건 앞으로 보냈습니다(사진 인지는 능선 근처의 애매한 가닥에만 씀).
 *        그래서 긴 머리는 옆머리가 전부 어깨 앞으로 나왔습니다.
 *   지금: 그쪽(왼/오른)을 사진에서 어깨 앞으로 넘겼다고 인지했을 때만 예전 규칙. 아니면
 *        · 몸통에 닿은 가닥은 전부 뒤로(어깨 위에 얕게 걸친 점은 그대로 위에 얹음),
 *        · 몸통에 닿지 않고 어깨 앞에 떠 있는 점(어깨 윗면보다 아래 · 몸통 앞면보다 앞)도 뒤로 보냅니다.
 *        목 바로 아래 가운데 띠(|x| < centerBand)는 예외 — 뒤로 보내면 목을 가로지르므로 예전 규칙 그대로.
 *   되돌리기: SHOULDER.frontOnlyIfDraped=false; SHOULDER.refresh()
 *
 * (2026-10-05j) 마네킹은 전부 등 쪽으로 · 어깨를 넘어갈 때 나란히 — 사용자: "마네킹 모드가 떴을 때 어깨 부위가 갈라진 모습.
 *   나란히 정렬해서 등 쪽으로 넘기는 게 기본."
 *   ① 마네킹 모드(mqBack): 사진에서 넘겼는지와 상관없이 전부 뒤로(가운데 띠는 예외). 예전에는 사진이 "앞으로 넘김"이면
 *      마네킹도 능선 앞 가닥은 앞으로, 뒤 가닥은 뒤로 가서 어깨에서 두 갈래로 갈라졌습니다.
 *   ② 넘어가는 자리 다듬기(sweepLen): 뒤로 보낸 가닥은 어깨 아래 점만 등 면으로 옮겨져서, 어깨 높이에서 앞 → 뒤로 한 번에
 *      꺾였습니다(옆에서 보면 가로줄). 처음 뒤로 옮겨진 점에서 가닥을 거슬러 sweepLen만큼은 z를 부드럽게 이어 줍니다
 *      (어깨 위로 올수록 원래 자리 · 내려갈수록 등 쪽). 마네킹·원본 머리 모두 적용.
 *   되돌리기: SHOULDER.mqBack=false · SHOULDER.sweepLen=0 후 SHOULDER.refresh()
 *
 * (2026-10-05k) 어깨 앞으로 넘기기는 끔 — 사용자: "어깨 앞으로 머리를 내려야 할 필요가 있기 전까지는 그냥 아래로 늘어뜨린 형태로.
 *   복잡도만 높아지고 아직 스타일에 꼭 필요할 것 같진 않다. 마네킹도, 어깨 앞으로 넘긴 손님도 일괄적으로 쭉 내려오도록."
 *   frontDrape=false(기본): 사진을 보지 않고, 마네킹·원본 머리 모두 몸통에 닿는 가닥을 전부 등 쪽으로 보냅니다(가운데 띠는 예외).
 *   사진 인지(어깨 앞으로 넘겼는가)는 계산하지 않습니다. 다시 쓰려면 SHOULDER.frontDrape=true; SHOULDER.refresh()
 *
 * (2026-10-07) 어깨 처리 전체를 끔(기본) — 사용자: "얼굴·목 쪽 막음은 최소한으로 해야 한다. 그쪽으로 일부러 보내는 경우도 있으니까."
 *   "(어깨 넘김은) 테스트 삼아 넘겨 본 거다. 그 기능 전혀 필요 없어서 그냥 원복하면 된다." → 선택: 어깨 처리 전체 끔.
 *   계기(폰 영상 · 긴 직모 · 결 표를 건 마네킹): 턱 밑 목 앞을 가로지르는 가닥 뭉치. 같은 손님·같은 사진에서 목 밖으로 민 점이
 *   다시 기른 가닥일 때 6 → 결 표를 건 마네킹일 때 2,632(가닥이 목 앞·목 자리에 와 있었음 — 59번 표 쪽 문제), 거기서 "전부 등 쪽으로"가
 *   그 가닥을 목을 가로질러 뒤로 끌어 가로줄이 됐습니다. 재현(이 파일의 _pass · 상자 몸통 · 합성 긴 머리 12,000가닥):
 *   목·어깨 높이의 가로 마디 — 전부 등 쪽으로 1,214~4,905개 → 어깨 처리를 끄면 0개.
 *   지금: on=false(기본) — 머리가 만들어진 그대로 내려갑니다. 앞·뒤로 보내지 않고, 어깨 위에 얹지 않고, 몸통 메쉬를 미리 불러와 재지도 않습니다.
 *   대신: 긴 머리가 어깨·몸통을 통과할 수 있습니다(이 파일이 생기기 전과 같음).
 *   다시 켜기: SHOULDER.on=true; SHOULDER.refresh()  (조정 화면에 다시 들어오면 몸통을 재고 적용합니다)
 *
 * 끄기: SHOULDER.on=false; SHOULDER.refresh()      (어깨만 끔 · 목 기둥은 REGROW.neck=false)
 * 조절: SHOULDER.margin(몸에서 띄우는 거리) · SHOULDER.restMax(이보다 얕게 걸치면 위에 얹음) 후 SHOULDER.refresh()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[어깨]';
  var H = W.SHOULDER = Object.assign({
    on: false,          // (2026-10-07) 기본 끔 — 머리가 만들어진 그대로 내려감. 켜기: SHOULDER.on=true; SHOULDER.refresh()
    preload: true,      // 스타일·조정 화면에서 몸통 메쉬를 미리 불러와 잼
    cell: 0.05,         // 격자 한 칸(모델 단위 ≈ 0.9cm)
    xMax: 1.5,          // 좌우 범위(≈ 27cm — 어깨 끝 + 팔 윗부분)
    depth: 1.9,         // 목 밑동에서 아래로 재는 범위(≈ 35cm)
    margin: 0.03,       // 몸에서 띄우는 거리(≈ 0.5cm)
    restMax: 0.07,      // 어깨 윗면에서 이보다 얕게 든 점은 위에 얹음(≈ 1.3cm)
    ambig: 0.2,         // 능선에서 이 안쪽(≈ 3.7cm)이면 앞/뒤가 애매 → 사진 인지를 따름
    shoulderRatio: 2.1, // 사진에서 사람 폭이 귀 사이 거리의 이 배수를 넘는 줄 = 어깨선
    earSpanCm: 15,      // 귀 사이 거리(cm 환산용 어림)
    frontOnlyIfDraped: true,   // (2026-10-04i) 사진에서 어깨 앞으로 넘긴 쪽만 앞으로 — 아니면 전부 뒤로
    centerBand: 0.3,    // 가운데 띠 반폭(≈ 5.5cm) — 이 안쪽은 뒤로 보내지 않음(목을 가로지르게 됨)
    frontDrape: false,  // (2026-10-05k) 어깨 앞으로 넘기기(사진 인지) — 끔: 전부 등 쪽으로 곧게
    mqBack: true,       // (2026-10-05j) 마네킹 모드는 사진과 상관없이 전부 등 쪽으로(frontDrape를 켰을 때 쓰임)
    sweepLen: 0.45,     // 뒤로 넘어가는 자리를 가닥 길이로 이만큼(≈ 8cm) 거슬러 부드럽게 이음 · 0 = 끔
    sweepMinJump: 0.08  // 처음 뒤로 옮겨진 점이 이만큼은 움직였을 때만 다듬음
  }, W.SHOULDER || {});
  var S = H.stats = { strands: 0, touched: 0, front: 0, back: 0, rest: 0, neck: 0, forced: 0, swept: 0, smooth: 0, mq: false, ms: 0, src: '', item: '', err: null };
  var grid = null, gridKey = null, ver = 1, pending = null, pendingKey = null;

  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function cmPer() { try { return modelCmPerUnit() || 19; } catch (e) { return 19; } }
  function photoKey() {
    try { var s = state.shots && state.shots.front; return s ? s.length + ':' + s.slice(-24) : ''; } catch (e) { return ''; }
  }

  /* ── ① 몸통 메쉬에서 어깨 읽기 ─────────────────────────────────────────── */
  function measure(obj, key, src, item) {
    var yTop; try { yTop = getNeckBottomY() + 0.02; } catch (e) { return false; }
    if (!isFinite(yTop)) return false;
    var cell = H.cell, NX = Math.ceil(H.xMax / cell), NY = Math.ceil(H.depth / cell), yBot = yTop - NY * cell, xMax = NX * cell;
    var ZF = new Float32Array(NX * NY).fill(-Infinity), ZB = new Float32Array(NX * NY).fill(Infinity), TOP = new Float32Array(NX).fill(-Infinity);
    var tris = 0, filled = 0;
    try { obj.updateMatrixWorld(true); } catch (e) {}
    function put(x, y, z) {
      if (y > yTop || y <= yBot) return;
      var ax = x < 0 ? -x : x; if (ax >= xMax) return;
      var ix = ax / cell | 0, iy = (yTop - y) / cell | 0, k = iy * NX + ix;
      if (z > ZF[k]) ZF[k] = z; if (z < ZB[k]) ZB[k] = z; if (y > TOP[ix]) TOP[ix] = y;
    }
    obj.traverse(function (m) {
      if (!m.isMesh || m.visible === false) return;
      var g = m.geometry, pos = g && g.attributes && g.attributes.position; if (!pos) return;
      var e = m.matrixWorld.elements, idx = g.index, n = idx ? idx.count : pos.count, t, q, i, j;
      var P = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (t = 0; t + 2 < n; t += 3) {
        for (q = 0; q < 3; q++) {
          var vi = idx ? idx.getX(t + q) : t + q, x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi);
          P[q * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
          P[q * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
          P[q * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        }
        var yMaxT = Math.max(P[1], P[4], P[7]), yMinT = Math.min(P[1], P[4], P[7]);
        if (yMinT > yTop || yMaxT < yBot) continue;
        if (Math.min(Math.abs(P[0]), Math.abs(P[3]), Math.abs(P[6])) >= xMax && (P[0] > 0) === (P[3] > 0) && (P[3] > 0) === (P[6] > 0)) continue;
        var e1 = Math.hypot(P[3] - P[0], P[4] - P[1], P[5] - P[2]), e2 = Math.hypot(P[6] - P[0], P[7] - P[1], P[8] - P[2]), e3 = Math.hypot(P[6] - P[3], P[7] - P[4], P[8] - P[5]);
        var N = Math.max(1, Math.min(40, Math.ceil(Math.max(e1, e2, e3) / (cell * 0.5))));
        for (i = 0; i <= N; i++) for (j = 0; j <= N - i; j++) {
          var u = i / N, v = j / N, w = 1 - u - v;
          put(P[0] * w + P[3] * u + P[6] * v, P[1] * w + P[4] * u + P[7] * v, P[2] * w + P[5] * u + P[8] * v);
        }
        tris++;
      }
    });
    for (var k = 0; k < ZF.length; k++) if (ZF[k] > -Infinity) filled++;
    if (filled < 60 || !(TOP[0] > -Infinity)) { S.err = '몸통 메쉬에서 어깨를 못 읽음(칸 ' + filled + ')'; return false; }
    // 어깨 끝: 윗면이 목 밑동에서 가장 멀리(옆으로) 이어지는 칸 · 어깨 내려감: 그 칸의 윗면 높이
    var tipIx = 0, drop = 0, ix;
    for (ix = 0; ix < NX; ix++) if (TOP[ix] > yTop - 0.9) tipIx = ix;
    drop = yTop - TOP[tipIx];
    grid = { yTop: yTop, yBot: yBot, cell: cell, NX: NX, NY: NY, xMax: xMax, ZF: ZF, ZB: ZB, TOP: TOP, tris: tris, filled: filled,
      halfW: (tipIx + 1) * cell, drop: drop };
    gridKey = key; ver++;
    S.src = src || ''; S.item = item || ''; S.err = null;
    drapeMemo = null;
    console.log(TAG + ' 몸통 메쉬에서 어깨를 읽음(' + S.src + (S.item ? ' · ' + S.item : '') + ') — 삼각형 ' + tris + '개 · 칸 ' + filled +
      ' · 어깨 끝(팔 바깥)까지 반폭 ' + (grid.halfW * cmPer()).toFixed(1) + 'cm · 거기서 윗면이 목 밑동보다 ' + (drop * cmPer()).toFixed(1) + 'cm 낮음');
    return true;
  }
  H._measure = measure;

  /* 미리 불러와 재기. 돌려주는 Promise: true = 이번에 새로 쟀음 */
  H.ensure = function () {
    if (!H.on || !H.preload) return Promise.resolve(false);
    var key = photoKey();
    if (!key) return Promise.resolve(false);
    if (grid && gridKey === key) return Promise.resolve(false);
    if (pending && pendingKey === key) return pending;
    if (typeof loadOutfitMesh !== 'function' || typeof recommendOutfitWithAI !== 'function' || typeof THREE === 'undefined') return Promise.resolve(false);
    pendingKey = key;
    pending = (async function () {
      try {
        if (!(state.landmarks && state.landmarks.front) || !(state.hairMasks && state.hairMasks.front)) return false;
        var rec = await recommendOutfitWithAI();
        if (!rec || !rec.item) return false;
        var fm = getFaceMetrics(), crown = null, len = null;
        try { if (isFinite(state._model3DCrownY)) crown = state._model3DCrownY; } catch (e) {}
        try { len = personBodyLenMesh(crown == null ? undefined : crown); } catch (e) { len = null; }
        if (!(len > 0.5)) return false;                               // 몸 길이 자가 아직 없음 — 3D 결과 화면이 불러올 때 잼
        var obj = await loadOutfitMesh(rec.item, fm.widthFactor, len);
        if (photoKey() !== key) return false;
        var ok = measure(obj, key, '미리 불러옴', rec.item.name || rec.item.id || '');
        try { if (typeof disposeObject3D === 'function') disposeObject3D(obj); } catch (e) {}
        return ok;
      } catch (e) { S.err = String(e && e.message || e); console.warn(TAG + ' 미리 재기 실패', e); return false; }
      finally { pending = null; }
    })();
    return pending;
  };

  // 3D 결과 화면이 실제로 불러올 때 — 아직 못 쟀으면 여기서 잼(이미 쟀으면 그대로: 머리를 다시 만들지 않게)
  var origLoad = W.loadOutfitMeshMeasured;
  if (typeof origLoad === 'function') W.loadOutfitMeshMeasured = function (item) {
    var p = origLoad.apply(this, arguments);
    return Promise.resolve(p).then(function (obj) {
      try {
        var key = photoKey();
        if (H.on && obj && !(grid && gridKey === key)) measure(obj, key, '3D 결과 화면에서', (item && (item.name || item.id)) || '');
      } catch (e) { console.warn(TAG + ' 재기 실패', e); }
      return obj;
    });
  };

  /* ── ③ 인지: 어깨 앞으로 넘긴 머리 ─────────────────────────────────────── */
  var drapeMemo = null;
  function runAt(mask, Wm, row, cx) {              // 가운데 열을 품은 사람 영역의 좌우 끝
    var x0 = cx, x1 = cx, base = row * Wm;
    if (!mask[base + cx]) return null;
    while (x0 > 0 && mask[base + x0 - 1]) x0--;
    while (x1 < Wm - 1 && mask[base + x1 + 1]) x1++;
    return [x0, x1];
  }
  function recognize() {
    var key = photoKey();
    if (drapeMemo && drapeMemo.key === key) return drapeMemo;
    var R = { key: key, front: null, back: null, signX: 1 };
    try {
      var mi = state.hairMasks && state.hairMasks.front, lm = state.landmarks && state.landmarks.front;
      if (mi && lm && mi.reasonMask && mi.personMask && mi.maskW && mi.maskH && lm.chinY != null) {
        var Wm = mi.maskW, Hm = mi.maskH, hair = mi.reasonMask, per = mi.personMask;
        var span = Math.abs(lm.rEarX - lm.lEarX) * Wm, cx = Math.round((lm.lEarX + lm.rEarX) / 2 * Wm), chin = Math.round(lm.chinY * Hm);
        if (span > 4 && cx > 0 && cx < Wm - 1) {
          var cmPx = H.earSpanCm / span, row, shRow = -1, how = '사람 폭';
          for (row = chin + Math.round(span * 0.15); row < Hm; row++) {
            var rn = runAt(per, Wm, row, cx);
            if (rn && rn[1] - rn[0] + 1 >= H.shoulderRatio * span) { shRow = row; break; }
          }
          if (shRow < 0) { shRow = chin + Math.round(span * 0.75); how = '어림(턱 아래 ' + (0.75 * H.earSpanCm).toFixed(0) + 'cm)'; }
          var F = { shRow: shRow, how: how, inFrame: shRow < Hm - 2, L: { low: -1, area: 0 }, R: { low: -1, area: 0 }, cmPx: cmPx };
          for (row = Math.max(0, shRow); row < Hm; row++) {
            var nL = 0, nR = 0, base = row * Wm, x;
            for (x = 0; x < Wm; x++) if (hair[base + x] === 1) { if (x < cx) nL++; else nR++; }
            F.L.area += nL; F.R.area += nR;
            if (nL >= 3) F.L.low = row; if (nR >= 3) F.R.low = row;
          }
          ['L', 'R'].forEach(function (k) {
            var o = F[k];
            o.depthCm = o.low >= 0 ? (o.low - shRow) * cmPx : 0;
            o.areaCm2 = o.area * cmPx * cmPx;
            o.draped = F.inFrame && o.depthCm >= 3 && o.areaCm2 >= 6;      // 3cm 넘게 내려오고 6cm² 넘게 보임
          });
          R.front = F;
        }
      }
    } catch (e) { R.err = String(e && e.message || e); }
    try {
      var mb = state.hairMasks && state.hairMasks.back, pe = state.poseEars && state.poseEars.back;
      if (mb && mb.reasonMask && mb.maskW && pe && pe.shoulderY != null && pe.span > 0) {
        var Wb = mb.maskW, Hb = mb.maskH, hb = mb.reasonMask, sr = Math.round(pe.shoulderY * Hb), low = -1, r2, x2, cnt;
        for (r2 = Math.max(0, sr); r2 < Hb; r2++) { cnt = 0; for (x2 = 0; x2 < Wb; x2++) if (hb[r2 * Wb + x2] === 1) cnt++; if (cnt >= 3) low = r2; }
        R.back = { shRow: sr, depthCm: low >= 0 ? (low - sr) * (H.earSpanCm / (pe.span * Wb)) : 0 };
      }
    } catch (e) {}
    try {                                             // 사진의 오른쪽이 모델의 +x인가
      var photo = state._hair3Dneutral, probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe);
      var cam = probe && probe.cams && probe.cams.filter(function (c) { return c.angle === 'front'; })[0];
      if (cam && cam.R && cam.s) R.signX = (cam.R[0] / cam.s) >= 0 ? 1 : -1;
    } catch (e) {}
    drapeMemo = R;
    return R;
  }
  H.recognize = recognize;
  /* 모델 x 쪽(부호)의 머리를 사진에서 어깨 앞으로 넘겼는가 */
  function drapedAt(x) {
    var R = recognize(); if (!R.front) return false;
    var imgRight = (x >= 0) === (R.signX > 0);
    return !!(imgRight ? R.front.R.draped : R.front.L.draped);
  }

  /* ── ② 몸통 밖으로 ─────────────────────────────────────────────────────── */
  function pushPoint(q, prev, st) {
    var g = grid;
    if (q.y > g.yTop) {                              // 목 구간 — 42번의 목 기둥
      var NK = W.REGROW && W.REGROW.neckPush;
      if (NK) { var r0 = NK(q); if (r0 !== q) { S.neck++; return r0; } }
      return q;
    }
    if (q.y <= g.yBot) return q;
    var ax = q.x < 0 ? -q.x : q.x; if (ax >= g.xMax) return q;
    var ix = ax / g.cell | 0, iy = (g.yTop - q.y) / g.cell | 0, k = iy * g.NX + ix, zf = g.ZF[k];
    if (zf === -Infinity) return q;
    var zb = g.ZB[k], m = H.margin;
    // (2026-10-04i) 사진에서 이쪽을 어깨 앞으로 안 넘겼으면 앞에 두지 않음(가운데 띠는 예외)
    var only = H.frontOnlyIfDraped && ax >= H.centerBand;
    var useDrape = H.frontDrape && !st.mq;                         // 사진에서 넘겼는지 볼 것인가
    if (only && useDrape && st.drp == null) st.drp = drapedAt(q.x);
    var noFront = only && (!useDrape || !st.drp);                  // 기본: 전부 뒤로
    if (!(q.z > zb - m && q.z < zf + m)) {
      // 몸통 밖 — 어깨 윗면보다 아래에서 몸통 앞에 떠 있는 점
      if (noFront && q.z >= zf + m && q.y < g.TOP[ix]) {
        if (!st.pref) { st.pref = 'back'; S.touched++; S.back++; S.forced++; }
        if (st.pref === 'back') { S.swept++; return { x: q.x, y: q.y, z: zb - m }; }
      }
      return q;
    }
    // 몸통 안
    if (!st.pref) {
      var mid = (zf + zb) / 2, ref = prev ? prev.z : q.z;
      if (noFront) { st.pref = 'back'; if (ref > mid) S.forced++; }
      else if (Math.abs(ref - mid) < H.ambig) st.pref = (useDrape && drapedAt(q.x)) ? 'front' : 'back';
      else st.pref = ref > mid ? 'front' : 'back';
      S.touched++; if (st.pref === 'front') S.front++; else S.back++;
    }
    var dUp = g.TOP[ix] + m - q.y, dZ = st.pref === 'front' ? zf + m - q.z : q.z - (zb - m);
    if (dUp >= 0 && dUp < H.restMax && dUp < dZ) { S.rest++; return { x: q.x, y: g.TOP[ix] + m, z: q.z }; }   // 어깨 위에 얹음
    return { x: q.x, y: q.y, z: st.pref === 'front' ? zf + m : zb - m };
  }
  /* 뒤로 넘어가는 자리 다듬기: k0(처음 등 면으로 옮겨진 점)에서 가닥을 거슬러 sweepLen만큼 z를 부드럽게 */
  function sweepBack(np, p, k0) {
    var len = H.sweepLen; if (!(len > 0) || k0 < 2) return false;
    var zt = np[k0].z, acc = 0, j, a, b, t, sm, q, z, did = false, NK = W.REGROW && W.REGROW.neckPush;
    for (j = k0 - 1; j >= 1; j--) {
      acc += Math.hypot(p[j].x - p[j + 1].x, p[j].y - p[j + 1].y, p[j].z - p[j + 1].z);   // 원래 가닥의 길이로 잼
      if (acc >= len) break;
      a = np[j];
      t = 1 - acc / len; sm = t * t * (3 - 2 * t);
      z = a.z + (zt - a.z) * sm;
      if (!(z < a.z - 1e-4)) continue;                             // 뒤쪽으로만
      q = { x: a.x, y: a.y, z: z };
      if (NK && q.y > grid.yTop) { try { q = NK(q) || q; } catch (e) {} }
      np[j] = q; did = true;
    }
    return did;
  }
  var passMemo = new WeakMap();
  function pass(list) {
    if (!H.on || !grid || !list || !list.length) return list;
    var hit = passMemo.get(list);
    if (hit && hit.ver === ver) return hit.out;
    var t0 = now(), n = list.length, out = new Array(n), i, k, e, p, np, st, r, top = grid.yTop + 0.6;
    S.strands = n; S.touched = S.front = S.back = S.rest = S.neck = S.forced = S.swept = S.smooth = 0;
    var mq = false; try { mq = !!(H.mqBack && MANNEQUIN.on); } catch (e2) { mq = false; }
    S.mq = mq;
    for (i = 0; i < n; i++) {
      e = list[i]; p = e && e.pts; np = null;
      if (p && p.length > 1) {
        st = { pref: null, drp: null, mq: mq, k0: -1 };
        for (k = 1; k < p.length; k++) {
          if (!(p[k].y < top)) continue;
          r = pushPoint(p[k], np ? np[k - 1] : p[k - 1], st);
          if (r !== p[k]) {
            if (!np) { np = p.slice(); try { np._pre = p._pre || p; } catch (e3) {} }   // _pre: 53번 빗질이 달아 둔 "빗기 전 자리"
            np[k] = r;
            if (st.k0 < 0 && st.pref === 'back' && r.z < p[k].z - H.sweepMinJump) st.k0 = k;
          }
        }
        if (np && st.k0 > 0 && sweepBack(np, p, st.k0)) S.smooth++;
      }
      out[i] = np ? Object.assign({}, e, { pts: np }) : e;
    }
    S.ms = now() - t0;
    passMemo.set(list, { ver: ver, out: out });
    return out;
  }
  H._pass = pass;

  var origCA = W.computeAdjustedHair3DStrands;
  if (typeof origCA !== 'function') { console.warn(TAG + ' computeAdjustedHair3DStrands가 없어 건너뜀'); return; }
  W.computeAdjustedHair3DStrands = function () {
    var out = origCA.apply(this, arguments);
    try { return pass(out); } catch (e) { S.err = String(e && e.message || e); return out; }
  };
  // 서명 — 어깨가 새로 재지거나 꺼지면 미리 만든 헤어도 다시
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    return origFS.apply(this, arguments) + '|sh' + (H.on && grid ? ver : 0);
  };

  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (scr() === 'adjust' && typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  }
  H.refresh = function () { ver++; passMemo = new WeakMap(); drapeMemo = null; redraw(); return H.on; };
  H.reset = function () { grid = null; gridKey = null; drapeMemo = null; ver++; };

  // 스타일·조정 화면에 들어오면 미리 잼. 조정 화면에서 뒤늦게 재졌으면 머리를 한 번 다시 만듦
  var nav = W.navTo;
  if (typeof nav === 'function') W.navTo = async function (name) {
    var r = await nav.apply(this, arguments);
    try {
      if (name === 'style' || name === 'adjust') H.ensure().then(function (fresh) { if (fresh) redraw(); });
    } catch (e) {}
    return r;
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [], cm = cmPer(), a;
    if (!H.on) return L.concat([TAG + ' 꺼짐']);
    a = TAG + ' 켜짐 · ' + (grid ? '몸통 메쉬에서 읽음(' + S.src + (S.item ? ' · ' + S.item : '') + ') — 어깨 끝(팔 바깥)까지 반폭 ' + (grid.halfW * cm).toFixed(1) + 'cm · 거기서 윗면이 목 밑동보다 ' + (grid.drop * cm).toFixed(1) + 'cm 낮음 · 칸 ' + grid.filled
      : '아직 못 읽음(몸통 메쉬를 불러오기 전)' + (pending ? ' · 불러오는 중' : '')) + (S.err ? ' · ⚠ ' + S.err : '');
    L = L.concat([a]);
    if (grid) L.push('  적용(직전) — 가닥 ' + S.strands + '개 중 몸통에 닿은 가닥 ' + S.touched + ' (앞으로 ' + S.front + ' / 뒤로 ' + S.back + ') · 어깨 위에 얹은 점 ' + S.rest + ' · 목 밖으로 민 점 ' + S.neck + ' · ' + Math.round(S.ms) + 'ms' +
      (!H.frontDrape ? ' · 어깨 앞으로 넘기기 꺼짐 — 전부 등 쪽으로: 앞에 있었지만 뒤로 보낸 가닥 ' + S.forced + ' (어깨 앞에 떠 있던 점 ' + S.swept + ')'
        : H.frontOnlyIfDraped ? ' · 앞은 사진에서 넘긴 쪽만: 앞에 있었지만 뒤로 보낸 가닥 ' + S.forced + ' (어깨 앞에 떠 있던 점 ' + S.swept + ')' + (S.mq ? ' · 마네킹: 전부 등 쪽으로' : '') : ' · 앞은 사진에서 넘긴 쪽만: 꺼짐') +
      ' · 넘어가는 자리 다듬은 가닥 ' + S.smooth);
    if (!H.frontDrape) return L;                       // 사진 인지는 안 씀(계산도 안 함)
    try {
      var R = recognize(), F = R.front;
      if (F) {
        var side = function (o) { return '어깨선 아래 ' + o.depthCm.toFixed(1) + 'cm · ' + o.areaCm2.toFixed(0) + 'cm² → ' + (o.draped ? '앞으로 넘김' : '안 넘김'); };
        L.push('  사진 인지(정면) — 어깨선: 사진 높이의 ' + Math.round(F.shRow / (state.hairMasks.front.maskH || 1) * 100) + '% 줄(' + F.how + ')' + (F.inFrame ? '' : ' ⚠ 어깨가 사진 밖 — 판정 안 함') +
          ' · 화면 왼쪽: ' + side(F.L) + ' · 화면 오른쪽: ' + side(F.R));
      } else L.push('  사진 인지(정면) — 못 함(정면 머리 영역/랜드마크 없음)' + (R.err ? ' ⚠ ' + R.err : ''));
      L.push('  사진 인지(후면) — ' + (R.back ? '어깨 아래로 ' + R.back.depthCm.toFixed(1) + 'cm 내려온 머리(등 쪽)' : '어깨 높이를 못 잡음(포즈 없음)'));
    } catch (e) {}
    return L;
  };

  console.log(TAG + (H.on ? ' 설치 — 몸통 메쉬에서 어깨를 읽어 머리카락이 몸통을 뚫지 않게 합니다(전부 등 쪽으로 · 어깨 앞으로 넘기기는 SHOULDER.frontDrape=true로 켬). 끄기 SHOULDER.on=false 후 SHOULDER.refresh()'
    : ' 설치 — 꺼짐(기본): 머리가 만들어진 그대로 내려갑니다(앞·뒤로 보내지 않음 · 몸통을 통과할 수 있음). 켜기 SHOULDER.on=true; SHOULDER.refresh()'));
})();
