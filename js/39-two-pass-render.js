/* ==========================================================================
 * 39-two-pass-render.js — 슬라이더에서 손 뗀 뒤 그림이 늦게 바뀌는 문제
 *
 * 로드 위치: index.html 맨 끝(38-diag-copy-cam.js 다음).
 *
 * 실측(4GB 폰, 2026-10-03): 값이 바뀐 뒤 조정 화면을 한 번 그리는 데 712~1730ms.
 *   renderFrame 12549ms/10회 ≈ projectHair3DToView 11358ms/9회 — 그리기의 거의 전부가 헤어 투영이고,
 *   그 안에서 가닥을 약 7,400개(모델 21,920개 중 솎기 2.97) 새로 계산합니다(가닥 하나 ≈ 0.11ms).
 *
 * 고침: 값이 바뀐 직후에는 가닥의 일부(처음엔 1/3, 지금은 1/2)만으로 먼저 그리고(빠른 그림), 손이 쉬면 전체로 다시 그립니다(완성 그림).
 *   · 완성 그림은 지금과 똑같습니다 — 가닥 수 목표(HAIR3D_RENDER.targetMul)를 빠른 그림 동안만 잠깐 낮춥니다.
 *   · 솎는 간격이 정확히 정수배라 빠른 그림에 쓴 가닥은 완성 그림에도 그대로 들어갑니다.
 *     28번의 가닥별 기억 덕분에 완성 그림은 나머지 2/3만 계산합니다 → 버리는 계산이 없습니다.
 *   · 값이 그대로일 때(뷰 전환 등)와 충분히 빠른 기기(완성 그림이 minMs 이하)는 예전처럼 바로 완성 그림.
 *   · 슬라이더를 잡고 있는 동안에는 완성 그림을 미룹니다(손가락이 멈춰 버리지 않게).
 *
 * (2026-10-03d) 미니 3D가 열려 있을 때:
 *   · 빠른 그림 뒤에는 미니 3D를 갱신하지 않고, 완성 그림 뒤에 한 번만 갱신합니다.
 *   · 미니 3D의 솎는 간격을 2D의 정확히 3배로 맞춥니다(약 2,500 → 2,400가닥). 간격이 어긋나 있어서
 *     미니 3D가 2D와 다른 가닥을 따로 계산하고 있었습니다(실측 미니3D 321~498ms). 맞추면 2D가 계산한 가닥을 그대로 씁니다.
 *
 * (2026-10-03e) 2D 가닥 수 줄이기 + 미니 3D 늘리기 (사용자 요청)
 *   · 2D 목표 가닥을 사진 원본의 1.5배 → 1배로 (저사양 판정 기기만). 계산하는 가닥 약 7,000 → 4,800개.
 *     화면에서 머리 폭이 140px 남짓인데 0.43px 굵기 선을 5,500개 넘게 그리고 있었습니다.
 *     이건 보여 주는 순서가 아니라 일 자체가 1/3 줄어드는 것입니다. 모든 기기에 걸려면 TWO_PASS.mulLowOnly=false.
 *   · 미니 3D는 2D와 같은 간격으로(miniK=1) — 2D가 계산한 가닥을 전부 그대로 씁니다(약 2,500 → 4,800가닥, 추가 계산 없음).
 *     2D는 그중 가려진 것을 빼고 그리므로 미니 3D 쪽이 더 많습니다.
 *   · 빠른 그림 비율은 1/3 → 1/2 (가닥 수는 예전 빠른 그림과 같은 약 2,400개).
 *
 * (2026-10-03f) 2D 가닥 6,000개 고정 (사용자 요청 — 1배는 너무 휑했음)
 *   · 목표 배율 대신 "머리 전체에서 6,000가닥"으로 고정합니다(저사양 판정 기기만 · 예전 약 7,000).
 *     1배 방식은 뷰마다 가닥 수가 달라서(정면 4,900 · 후면 3,000) 후면이 특히 비어 보였습니다.
 *   · 모든 뷰가 같은 6,000가닥을 쓰므로 뷰를 바꿀 때 가닥을 새로 계산하지 않습니다.
 *   · 미니 3D도 같은 6,000가닥 · 빠른 그림은 그 절반(3,000).
 *
 * (2026-10-03g) 빠른 그림(절반만 먼저 까는 단계) 끔 — 사용자 요청. 값이 바뀌면 바로 완성 그림 한 번만 그립니다.
 *   실측(6,000가닥): 빠른 그림 627ms + 완성 그림 926ms = 1553ms. 끄면 중간 단계 없이 완성 그림만(약 1.0~1.5초).
 *   2D 6,000가닥 고정과 미니 3D 맞추기는 그대로입니다. 다시 켜기: TWO_PASS.quickPass=true
 *
 * 끄기: TWO_PASS.on=false · TWO_PASS.alignMini=false · 2D 가닥 원래대로 TWO_PASS.strands2D=0 · 빠른 그림 TWO_PASS.quickPass / 비율 TWO_PASS.frac
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[두 번 그리기]';
  var TP = W.TWO_PASS = Object.assign({
    on: true,
    quickPass: false,  // 빠른 그림(가닥 일부로 먼저 그리기) — 2026-10-03g부터 기본 끔
    frac: 1 / 2,       // 빠른 그림의 가닥 비율 (2026-10-03e: 2D 목표를 1배로 낮추면서 1/3 → 1/2)
    strands2D: 6000,   // 2D가 계산하는 가닥 수(머리 전체) — 0이면 원래 방식(사진 원본 가닥 수 × 1.5)
    mul2D: 0,          // (예전 방식) 2D 목표 배율 — strands2D가 0일 때만 쓰임 · 0이면 건드리지 않음
    mulLowOnly: true,  // 저사양 판정 기기에서만 낮춤
    miniK: 1,          // 미니 3D 솎는 간격 = 2D 간격 × 이 값 (1 = 2D가 계산한 가닥 전부)
    settleMs: 350,     // 빠른 그림 뒤 이만큼 조용하면 완성 그림
    minMs: 250,        // 완성 그림이 이보다 빠른 기기는 두 번 그리지 않음
    alignMini: true,   // 미니 3D 솎는 간격을 2D 간격의 정수배로 맞춤
    quick: 0, full: 0, lastQuickMs: 0, lastFullMs: 0
  }, W.TWO_PASS || {});

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function stateSig() {
    try {
      var m = state.hair3Dneutral;
      if (!m || !m.strands) return null;
      return adjCacheSig(m, null, 1) + '\u00a7' + (typeof adjFilterSig === 'function' ? adjFilterSig() : '');
    } catch (e) { return null; }
  }

  var origProj = W.projectHair3DToView, origFrame = W.renderAdjustFrame;
  if (typeof origProj !== 'function' || typeof origFrame !== 'function' || typeof HAIR3D_RENDER === 'undefined' || typeof adjCacheSig !== 'function') {
    console.warn(TAG + ' 필요한 함수가 없어 건너뜀');
    return;
  }

  var inAdjust = false;      // renderAdjustFrame 안에서 불린 투영만 대상
  var fullSig = null;        // 마지막 완성 그림의 상태
  var missMs = Infinity;     // 값이 바뀐 뒤의 완성 그림 한 번에 걸리는 시간(측정 전에는 느리다고 봄)
  var forceFull = false, timer = null, finger = false, quickCost = 0;
  var lastWasQuick = false, miniBase = null;
  var baseMul = HAIR3D_RENDER.targetMul, baseStride = HAIR3D_RENDER.stride, ourStride = null;
  /* 2D 가닥 수 정하기. ourStride가 숫자면 우리가 간격을 직접 정한 상태(6,000가닥 고정). */
  function applyMul() {
    try {
      var low = false, n = 0, H = HAIR3D_RENDER;
      try { low = typeof isLowMemDevice === 'function' && isLowMemDevice(); } catch (e) {}
      try { n = state.hair3Dneutral && state.hair3Dneutral.strands ? state.hair3Dneutral.strands.length : 0; } catch (e) {}
      var use = TP.on && (low || !TP.mulLowOnly);
      if (use && TP.strands2D > 0 && n > 0 && baseStride == null) {
        ourStride = Math.max(1, n / TP.strands2D);
        H.stride = ourStride; H.targetMul = baseMul;
      } else {
        if (ourStride != null) { H.stride = baseStride; ourStride = null; }
        H.targetMul = (use && TP.mul2D > 0) ? TP.mul2D : baseMul;
      }
    } catch (e) {}
  }
  applyMul();

  function alignMini() {
    try {
      if (typeof MINI3D === 'undefined') return;
      if (miniBase == null) miniBase = MINI3D.maxStrands;
      if (!TP.on || !TP.alignMini) { MINI3D.maxStrands = miniBase; return; }
      var d = W._lastStrandDiag && W._lastStrandDiag[state.currentViewAngle];
      if (!d || !(d.stride >= 1) || !(d.total > 0) || !(miniBase > 0)) return;
      var k = Math.max(1, Math.round(+TP.miniK || 1));                  // 2D 간격의 정수배
      MINI3D.maxStrands = d.total / (d.stride * k);
    } catch (e) {}
  }
  var origMini = W.scheduleHair3DRefresh;
  if (typeof origMini === 'function') {
    W.scheduleHair3DRefresh = function () {
      if (TP.on && lastWasQuick) return;             // 미니 3D는 완성 그림 뒤에 한 번
      return origMini.apply(this, arguments);
    };
  }

  W.renderAdjustFrame = function () {
    inAdjust = true;
    try { return origFrame.apply(this, arguments); } finally { inAdjust = false; }
  };

  function schedule(ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(runFull, ms == null ? TP.settleMs : ms);
  }
  function runFull() {
    timer = null;
    if (scr() !== 'adjust') return;
    if (finger) return schedule(200);                // 슬라이더를 잡고 있으면 미룸
    forceFull = true;
    try { W.renderAdjustFrame(); }
    catch (e) { console.warn(TAG + ' 완성 그림 실패', e); }
    finally { forceFull = false; }
  }

  W.projectHair3DToView = function () {
    var H = HAIR3D_RENDER;
    applyMul();
    if (!TP.on || !inAdjust || scr() !== 'adjust' || (H.stride != null && ourStride == null) || H.targetStrands != null) return origProj.apply(this, arguments);
    var sig = stateSig();
    if (!sig) return origProj.apply(this, arguments);
    var t0 = now(), r;

    var wantQuick = TP.quickPass && !forceFull && fullSig !== null && sig !== fullSig && missMs > TP.minMs && TP.frac > 0 && TP.frac < 1;
    if (wantQuick) {
      if (ourStride != null) {                          // 간격을 1/frac배로(절반이면 2배) — 완성 그림 가닥의 부분집합
        H.stride = ourStride / TP.frac;
        try { r = origProj.apply(this, arguments); } finally { H.stride = ourStride; }
      } else {
        var keep = H.targetMul;
        H.targetMul = (keep || 1) * TP.frac;
        try { r = origProj.apply(this, arguments); } finally { H.targetMul = keep; }
      }
      TP.quick++; TP.lastQuickMs = quickCost = now() - t0;
      lastWasQuick = true;
      schedule();
      return r;
    }

    // 완성 그림
    var changed = sig !== fullSig, forced = forceFull;
    forceFull = false;
    if (timer && !changed) { clearTimeout(timer); timer = null; }
    r = origProj.apply(this, arguments);
    var d = now() - t0;
    TP.full++; TP.lastFullMs = d;
    if (changed) missMs = d + (forced ? quickCost : 0);  // 값이 바뀐 뒤의 완성 그림만 "느린지" 판정에 씀
    fullSig = sig; quickCost = 0; lastWasQuick = false;
    alignMini();
    if (timer) { clearTimeout(timer); timer = null; }
    return r;
  };

  function isRange(t) { return !!t && t.tagName === 'INPUT' && t.type === 'range'; }
  document.addEventListener('pointerdown', function (e) { if (isRange(e.target)) finger = true; }, true);
  function up() { finger = false; }
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);
  W.addEventListener('blur', up);

  TP.status = function () {
    return { on: TP.on, quick: TP.quick, full: TP.full, lastQuickMs: Math.round(TP.lastQuickMs), lastFullMs: Math.round(TP.lastFullMs),
      missMs: isFinite(missMs) ? Math.round(missMs) : null, pending: !!timer };
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    return L.concat(['[2D 그리기] 빠른 그림 ' + (TP.quickPass ? '켜짐 ' : '꺼짐 ') + TP.quick + '회(직전 ' + Math.round(TP.lastQuickMs) + 'ms) · 완성 그림 ' + TP.full + '회(직전 ' + Math.round(TP.lastFullMs) +
      'ms) · 값 바뀐 뒤 완성까지 ' + (isFinite(missMs) ? Math.round(missMs) + 'ms' : '측정 전') +
      (ourStride != null ? ' · 2D ' + TP.strands2D + '가닥 고정(간격 ' + ourStride.toFixed(2) + ')' : ' · 2D 목표 ×' + HAIR3D_RENDER.targetMul) + (typeof MINI3D !== 'undefined' ? ' · 미니3D 상한 ' + Math.round(MINI3D.maxStrands) + '가닥' : '') + (TP.on ? '' : ' · 꺼짐')]);
  };

  console.log(TAG + ' 설치 — 2D 가닥 수 고정 · 미니 3D 가닥 맞춤 · 빠른 그림은 기본 꺼짐(TWO_PASS.quickPass=true로 켬). 끄기 TWO_PASS.on=false · 상태 TWO_PASS.status()');
})();
