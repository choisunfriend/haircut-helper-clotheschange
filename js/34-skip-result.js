// 34-skip-result.js
// 2D 결과(result) 단계를 건너뛰고 조정 → 3D 두상으로 바로 넘어가게 한다.
// 기존 코드(음성 명령 '결과/완료' 등)에서 navTo('result')를 불러도 3D 화면으로 보낸다.
(function () {
  'use strict';

  // 단계 표시: 5단계 → 4단계
  try {
    STAGE_NAMES.capture = '1/4 · 촬영';
    STAGE_NAMES.style   = '2/4 · 스타일';
    STAGE_NAMES.adjust  = '3/4 · 조정';
    STAGE_NAMES.model3d = '4/4 · 3D두상';
  } catch (e) {}

  // 영어 UI용 번역 추가
  try {
    I18N['2/4 · 스타일'] = '2/4 · Style';
    I18N['3/4 · 조정']   = '3/4 · Adjust';
    I18N['4/4 · 3D두상'] = '4/4 · 3D Head';
    _i18nSubKeys = null; // 부분일치 키 캐시 재생성
  } catch (e) {}

  // navTo('result') → navTo('model3d')
  var prevNavTo = window.navTo;
  if (typeof prevNavTo === 'function') {
    window.navTo = function (screen) {
      if (screen === 'result') {
        var args = Array.prototype.slice.call(arguments);
        args[0] = 'model3d';
        return prevNavTo.apply(this, args);
      }
      return prevNavTo.apply(this, arguments);
    };
  }
})();
