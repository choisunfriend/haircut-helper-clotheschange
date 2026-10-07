/* ==========================================================================
 * 49-photo-change.js — 사진이 바뀌면 사람(얼굴·두상·머리)도 바뀌게
 *
 * 로드 위치: index.html에서 48-strand-budget.js 다음.
 *
 * 증상 (2026-10-04 사용자): 다른 사람 사진을 올렸는데 조정 화면의 사람이 그대로.
 *
 * 원인: 사진에서 만든 것들(머리 영역 · 3D 머리 모델 · 두상 치수 · 얼굴)을 비우는 자리가
 *   [새로 시작]과 360° 세트 불러오기뿐이었습니다.
 *     · [업로드](handleFileUpload)는 사진만 갈아 끼우고 아무것도 안 비움 —
 *       머리 영역 다시 뽑기(stylePrepDone)조차 안 켜져서 예전 사람의 분석이 그대로 남음.
 *     · [재촬영] · [저장된 사진 쓰기]는 머리 영역은 다시 뽑지만 3D 머리 모델(state.hair3Dneutral)은 안 비움.
 *   3D 모델은 "없을 때만" 새로 만들고, 조정 화면 3D(43번)는 그 모델이 바뀔 때만 두상·얼굴을 다시 만들기 때문에
 *   예전 사람이 그대로 보였습니다. (예전 2D 조정 화면은 사진을 직접 그려서 사진만 바뀌어 보였음.)
 *
 * 고침: 사진을 넣는 길이 여러 갈래라 길마다 고치지 않고, 촬영 화면을 떠날 때 한 군데서 확인합니다.
 *   4장 사진의 지문이 지난번 분석 때와 다르면 →
 *     사진에서 만든 것 전부 비움([새로 시작]과 같은 목록 — 사진·랜드마크·고른 스타일은 그대로 둠)
 *     → 머리 영역·랜드마크 다시 분석 → 3D 모델·두상·얼굴은 조정 화면이 새로 만듦.
 *   고른 스타일이 있으면 새 사람 두상에 맞춰 다시 겁니다(길이를 새 두상 기준으로 다시 풂).
 *
 * 끄기: PHOTO_CHANGE.on=false
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[사진 바뀜]';
  var P = W.PHOTO_CHANGE = Object.assign({ on: true }, W.PHOTO_CHANGE || {});
  var S = P.stats = { resets: 0, lastAt: null, lastAngles: '' };
  var doneSig = null;                                 // 지난번에 분석을 맡긴 사진들의 지문(각도별)

  function angles() { try { return ANGLES; } catch (e) { return ['front', 'left', 'right', 'back']; } }
  function sigOf(s) {
    if (!s) return '';
    var n = s.length, m = n >> 1;
    return n + ':' + s.slice(m, m + 24) + ':' + s.slice(-40);
  }
  function sigs() {
    var o = {};
    angles().forEach(function (a) { var s = null; try { s = state.shots && state.shots[a]; } catch (e) {} o[a] = sigOf(s); });
    return o;
  }
  function changed(now) {
    if (!doneSig) return angles().filter(function (a) { return now[a]; });
    return angles().filter(function (a) { return now[a] !== doneSig[a]; });
  }
  function tryDo(fn) { try { fn(); } catch (e) {} }

  /* 사진에서 만든 것 전부 비움 */
  function resetDerived(which, first) {
    angles().forEach(function (a) {
      ['hairCanvases', 'hairMasks', 'baseCanvases', 'baseFillCanvases'].forEach(function (k) { tryDo(function () { if (state[k]) state[k][a] = null; }); });
    });
    tryDo(function () { stylePrepDone = false; });
    tryDo(function () { state.hair3D = null; state.hair3Dneutral = null; state._model3DCrownY = null; });
    tryDo(function () { state.strandPaths = {}; state.neutralStrandPaths = null; state._viewCalHealTried = {}; });
    tryDo(function () { state.hairField3D = null; state.hairOcc3D = null; state.hairIdentity = null; });
    tryDo(function () { if (typeof resetScalpSkinSample === 'function') resetScalpSkinSample(); });
    tryDo(function () { HAIR_IDENTITY._refSkinCss = null; });
    tryDo(function () { if (typeof combClear === 'function') combClear(); });
    tryDo(function () { for (var k in _viewMaskCache) delete _viewMaskCache[k]; });
    tryDo(function () { state.aiOutfitRecommendation = null; });
    tryDo(function () { _garmentNeckOpening = null; });
    tryDo(function () { if (typeof resetBodyBase === 'function') resetBodyBase(); });
    tryDo(function () { resetResultScreenCache(); });
    tryDo(function () { _headCrossSectionCache = null; });
    tryDo(function () { _headVerticalRadiusCache = null; });
    tryDo(function () { _headEllipsoidLogged = false; });
    tryDo(function () { _headWidthGuardLogged = false; });
    tryDo(function () { resetSkinGraft(); });
    tryDo(function () { angles().forEach(function (a) { delete _graftLogged[a]; delete _plateLogged[a]; }); });
    tryDo(function () { _silhouetteAnchorCache = {}; });
    // 다시 기르기(42): 잰 기준·마네킹 되돌리기 값은 예전 사람 것
    tryDo(function () { var G = W.REGROW; if (G) { G.base = null; G.mqSnap = null; G.failedFor = null; G.model = null; G.src = null; } });
    tryDo(function () { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); });
    // 3D 장면에 남아 있는 예전 사람(두상·얼굴·머리)을 바로 치움 — 새 모델이 될 때까지 예전 얼굴이 보이지 않게
    tryDo(function () {
      if (typeof model3D === 'undefined' || !model3D || !model3D.initialized) return;
      var g = model3D.headGroup;
      while (g.children.length) { var c = g.children[0]; g.remove(c); tryDo(function () { disposeObject3D(c); }); }
      tryDo(function () { if (W.GPU_DIET && W.GPU_DIET.markDirty) W.GPU_DIET.markDirty(); });
    });
    // 고른 스타일은 새 두상 기준으로 다시 걸리게
    tryDo(function () {
      state.specAppliedId = null; state._specUndo = null;
      var st = state.selectedStyle;
      if (st && st.specId && typeof MANNEQUIN !== 'undefined' && MANNEQUIN.on) state.pendingSpecId = st.specId;
    });
    if (first) return;                               // 첫 분석 — 비울 것이 없었음(세지 않음)
    S.resets++; S.lastAt = new Date().toTimeString().slice(0, 8); S.lastAngles = which.join(',');
    console.log(TAG + ' ' + which.join(',') + ' 사진이 바뀜 — 머리 영역·3D 모델·두상·얼굴을 비우고 다시 만듭니다');
  }

  var nav = W.navTo;
  if (typeof nav !== 'function') { console.warn(TAG + ' navTo가 없어 건너뜀'); return; }
  W.navTo = async function (screen) {
    var needPrep = false;
    try {
      if (P.on && screen !== 'capture') {
        var now = sigs(), ch = changed(now), any = angles().some(function (a) { return now[a]; });
        if (any && ch.length) {
          var first = !doneSig;
          resetDerived(ch, first);
          doneSig = now;
          needPrep = screen !== 'style';             // 'style'로 가면 원래 흐름이 분석을 돌림
          if (!first) try { if (typeof showToast === 'function') showToast('사진이 바뀌어 새로 분석합니다'); } catch (e) {}
        } else if (!any) doneSig = null;
      }
    } catch (e) { console.warn(TAG + ' 확인 실패', e); }
    if (needPrep) {                                   // 아래 탭으로 조정·결과·3D에 바로 간 경우
      try { if (typeof runStyleAnalysisPipeline === 'function') await runStyleAnalysisPipeline(); }
      catch (e) { console.warn(TAG + ' 다시 분석 실패', e); }
    }
    return nav.apply(this, arguments);
  };

  // [새로 시작]은 사진까지 지우므로 지문도 비움
  var origNew = W.startNewCustomer;
  if (typeof origNew === 'function') W.startNewCustomer = function () { doneSig = null; return origNew.apply(this, arguments); };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    return L.concat([TAG + ' ' + (P.on ? '켜짐' : '꺼짐') + ' · 사진이 바뀌어 전부 다시 만든 횟수 ' + S.resets +
      (S.lastAt ? ' (마지막 ' + S.lastAt + ' · ' + S.lastAngles + ')' : '')]);
  };

  console.log(TAG + ' 설치 — 촬영 화면을 떠날 때 사진이 지난번과 다르면 사진에서 만든 것을 전부 다시 만듭니다. 끄기 PHOTO_CHANGE.on=false');
})();
