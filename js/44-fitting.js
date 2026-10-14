/* ==========================================================================
 * 44-fitting.js — 3D 결과 화면: 하단 버튼 없음 (2026-10-04b)
 *
 * 로드 위치: index.html에서 43-adjust-3d.js 다음. (파일 이름은 덮어쓰기 편하게 그대로 둠)
 *
 * 바뀐 것 (2026-10-04 사용자: "3D 결과보기 화면 하단 버튼들은 필요 없음, 다 삭제"):
 *   · [보기: 전신/상반신/머리] · [의상: 자동/옷 목록] 막대를 없앴습니다(코드째 삭제).
 *     의상은 원래대로 머리에 맞춰 자동 추천된 옷이 입혀집니다.
 *   · 3D 결과 화면의 [시술 스펙] 버튼도 뗍니다(조정 화면 위쪽의 [시술 스펙]은 그대로).
 *   · 남긴 것 하나: 3D 결과 화면에 들어올 때 보기를 전신(100% · 이동 없음)으로 되돌림.
 *     조정 화면(3D)과 확대·이동 값을 같이 쓰기 때문에, 이게 없으면 조정 화면에서 확대해 둔 채로 들어옵니다.
 *   · 그대로 둔 것: 위쪽 헤어핀 막대(29번) · 확대 막대(− 100% ＋ ↺) · [← 결과] [새로 시작].
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[3D 결과 화면]';
  if (typeof setupModel3DScreen !== 'function') { console.warn(TAG + ' setupModel3DScreen이 없어 건너뜀'); return; }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }

  function removeButtons() {
    ['fittingBar', 'treatSpecBtn3D'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }
  function fullView() {
    try {
      if (typeof MODEL3D_VIEW === 'undefined') return;
      MODEL3D_VIEW.zoom = 1; MODEL3D_VIEW.panX = 0; MODEL3D_VIEW.panY = 0;
      if (typeof model3dApplyView === 'function') model3dApplyView();
    } catch (e) {}
  }

  var origSetup = W.setupModel3DScreen;
  W.setupModel3DScreen = function () {
    var p = origSetup.apply(this, arguments);
    var after = function () { removeButtons(); if (scr() === 'model3d') fullView(); };
    try { Promise.resolve(p).then(after, after); } catch (e) { after(); }
    return p;
  };

  // [시술 스펙] 3D 버튼은 25번이 DOMContentLoaded 때 붙임 — 그 뒤에 한 번 뗌
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(removeButtons, 0); });
  else setTimeout(removeButtons, 0);

  console.log(TAG + ' 하단 버튼(보기·의상·시술 스펙) 없음 — 들어올 때 전신 보기');
})();
