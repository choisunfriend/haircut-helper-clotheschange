/* ==========================================================================
 * 46-i18n-en.js — 영어 화면에 한글로 남아 있던 글자들 (2026-10-04)
 *
 * 로드 위치: index.html 맨 끝(45-shot360.js 다음).
 *
 * 왜: 번역 표(I18N — 18번·22번)가 만들어진 뒤에 붙인 화면들(360° 촬영 · 조정 3D · 다시 기르기 · 피팅 ·
 *     진단 [복사] 등)은 표에 없어서 영어 화면(EN)에서도 한글로 나왔습니다. 그 글자들을 표에 넣습니다.
 *     원문(한글)은 그대로 두므로 [EN]/[한국어] 전환은 예전처럼 됩니다.
 *
 * 규칙(기존 표와 같음): 글자 전체가 표에 있으면 그대로 바꾸고, 아니면 긴 것부터 부분 치환.
 *   한두 낱말짜리 버튼 글자는 다른 문장 속에서 잘못 바뀌지 않게 "전체가 같을 때만"(I18N_EXACT_ONLY).
 *
 * 범위: 사용자가 보는 화면 글자(버튼·안내·알림·덮개). 진단 패널 본문(개발용 숫자 줄)과 콘솔 기록은 한글 그대로.
 * ========================================================================== */
(function () {
  'use strict';
  if (typeof I18N === 'undefined') { console.warn('[i18n] I18N 표가 없습니다 — 18-perf-i18n-boot.js보다 먼저 불렸습니까?'); return; }

  var EXACT = {                                   // 전체가 같을 때만
    '시작': 'Start', '완료': 'Done', '복사': 'Copy', '의상': 'Outfit', '보기': 'View', '자동': 'Auto',
    '전신': 'Full body', '상반신': 'Upper body', '머리': 'Head', '원본 머리': 'Your hair'
  };
  var T = {
    /* ── 360° 촬영 (45) ── */
    '🔄 360° 촬영': '🔄 360° Capture',
    '저장된 360 세트 불러오기 (': 'Load saved 360 set (',
    '내보내기': 'Export', '가져오기': 'Import',
    '다시 시작': 'Restart', '수동 찍기': 'Manual shot', '좌우 바꾸기': 'Swap left/right', '카메라 다시 열기': 'Retry camera',
    '화면을 눌러 카메라 켜기': 'Tap to start the camera',
    '카메라를 여는 중…': 'Opening the camera…',
    '손님 정면에 서서 [시작]을 누르세요. 폰은 세워서 머리를 향하게.': 'Stand in front of the client and press [Start]. Hold the phone upright, pointed at the head.',
    '15~20초에 걸쳐 한 바퀴 · 손님은 고개와 머리카락을 움직이지 않습니다 · 출발점으로 돌아오면 [완료]': 'One full circle in 15–20 seconds · the client keeps head and hair still · press [Done] when you are back at the start',
    '너무 빨라요 — 천천히 도세요': 'Too fast — walk around slowly',
    '다 찍었어요 — [완료]를 누르세요': 'All angles captured — press [Done]',
    '머리를 타원 안에 두고 천천히 한 바퀴 도세요': 'Keep the head inside the oval and walk one slow circle',
    '폰을 세워서 손님 머리를 향해 주세요': 'Hold the phone upright and point it at the client’s head',
    '각도 센서가 없습니다 — [수동 찍기]로 한 장씩 찍으세요(정면부터 한 방향으로)': 'No rotation sensor — use [Manual shot] to take one photo at a time (start at the front, keep going one way)',
    '사진이 모자랍니다 — 정면·양옆·뒤가 다 찍혀야 해요': 'Not enough photos — front, both sides and back are all needed',
    '좌우를 바꿨어요': 'Left/right swapped', '좌우를 원래대로 했어요': 'Left/right back to normal',
    '360 세트가 비어 있습니다': 'The 360 set is empty',
    '360 세트에 ': 'The 360 set has no ', ' 각도 사진이 없습니다 — 다시 찍어 주세요': ' photo — please capture again',
    '360° 사진 ': '360° set: ', '장 — 4장을 슬롯에 넣었어요': ' photos — 4 placed in the slots',
    '내보낼 360 세트가 없습니다': 'No 360 set to export', '내보내기 실패': 'Export failed',
    '360 세트 파일을 읽지 못했습니다': 'Couldn’t read the 360 set file',
    '카메라는 https 주소에서만 열 수 있습니다 — 주소가 https://로 시작하는지 확인해 주세요': 'The camera only works on https — check that the address starts with https://',
    '이 브라우저에서는 카메라를 열 수 없습니다': 'This browser can’t open the camera',
    '카메라가 끊겼습니다 — [카메라 다시 열기]를 눌러 주세요': 'The camera was disconnected — press [Retry camera]',
    '카메라 영상이 나오지 않습니다 — 다른 앱이 카메라를 쓰고 있지 않은지 확인하고 [카메라 다시 열기]를 눌러 주세요': 'No picture from the camera — make sure no other app is using it, then press [Retry camera]',
    '카메라 권한이 꺼져 있습니다 — 브라우저 주소창의 카메라 권한을 허용한 뒤 [카메라 다시 열기]를 눌러 주세요': 'Camera permission is off — allow the camera in the browser’s address bar, then press [Retry camera]',
    '쓸 수 있는 카메라를 찾지 못했습니다': 'No usable camera found',
    '카메라를 열 수 없습니다 — 다른 앱이나 탭이 카메라를 쓰고 있지 않은지 확인하고 [카메라 다시 열기]를 눌러 주세요': 'Couldn’t open the camera — make sure no other app or tab is using it, then press [Retry camera]',

    /* ── 조정 화면 3D (43) · 원본 머리 (42) ── */
    '3D 모델 준비 중…': 'Preparing the 3D model…',
    '머리 만드는 중…': 'Building hair…',
    '드래그 회전 · Shift+드래그(두 손가락) 이동 · 휠(핀치) 확대': 'Drag to rotate · Shift+drag (two fingers) to move · wheel (pinch) to zoom',
    '뿌리부터 다시 기르는 중…': 'Rebuilding your hair from the roots…',
    '다시 만드는 중…': 'Rebuilding…',
    '원본 머리 · 치수 잼 — 긴 머리 · 볼륨 ': 'Your hair · measured — long hair · volume ',
    '원본 머리 · 치수 잼 — 윗머리 ': 'Your hair · measured — top ',
    '원본 머리 · 치수 잼': 'Your hair · measured',
    'cm · 옆 ': 'cm · sides ', 'cm · 뒤 ': 'cm · back ', 'cm · 볼륨 ': 'cm · volume ', ' · 넘김 ': ' · sweep ', ' · 컬 ': ' · curl ',
    'ON: 마네킹 모드(컬·스타일링을 지운 상태에서 시작) · OFF: 사진에서 다시 기른 원본 머리(치수 잼)': 'ON: mannequin mode (starts with curl and styling cleared) · OFF: your own hair rebuilt from the photos (measured)',
    '원본 머리를 아직 못 쟀어요 — 마네킹을 끄고 잠시 기다려 주세요': 'Your hair hasn’t been measured yet — turn the mannequin off and wait a moment',
    '이 스타일 이름을 입력하세요 (원본 머리에서 잰 숫자로 등록)': 'Name this style (saved from the numbers measured on your hair)',
    '스타일로 등록했어요: ': 'Saved as a style: ',
    '원본에서 잼': 'Measured from photos',

    /* ── 조정 화면 상태 줄 (05) ── */
    '] 랜드마크 없음 — 슬롯 기본각 ': '] no landmarks — assuming slot angle ', '° 가정': '°',
    '] 랜드마크 없음 — 촬영시점 실측 사용 yaw:': '] no landmarks — using the angle measured at capture, yaw:',
    '] 포즈행렬 없음 — 근사yaw:': '] no pose matrix — approx. yaw:', '만 사용': ' only', '(근사yaw:': '(approx. yaw:',

    /* ── 3D 결과 화면 피팅 (44) ── */
    '의상 입히는 중…': 'Changing outfit…', '직접 고름': 'Picked by you',

    /* ── 진단 패널 버튼 (38) ── */
    '복사됨 ✓': 'Copied ✓', '복사 실패': 'Copy failed',
    '진단 계산 중… (스타일을 고른 뒤 처음 열 때는 몇 초 걸립니다)': 'Calculating diagnostics… (takes a few seconds the first time after picking a style)',
    '진단 실패: ': 'Diagnostics failed: '
  };

  Object.assign(I18N, T, EXACT);
  try { if (typeof I18N_EXACT_ONLY !== 'undefined') Object.keys(EXACT).forEach(function (k) { I18N_EXACT_ONLY.add(k); }); } catch (e) {}
  try { _i18nSubKeys = null; } catch (e) {}

  // 브라우저 탭 제목은 <head>에 있어 화면 번역이 닿지 않음 — 언어에 맞춰 바꿈
  var TITLE = { en: 'GYEOL — Style Preview', ko: '결 GYEOL — 스타일 프리뷰' };
  function syncTitle() { try { document.title = TITLE[uiLang === 'ko' ? 'ko' : 'en']; } catch (e) {} }
  var origApply = window.applyUiLang;
  if (typeof origApply === 'function') window.applyUiLang = function () { var r = origApply.apply(this, arguments); syncTitle(); return r; };
  syncTitle();
  try { if (typeof applyUiLang === 'function') applyUiLang(); } catch (e) {}
})();
