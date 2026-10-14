/* 67-cause-test.js — 원인 찾기 (2026-10-11q)
 * 사용자: "나는 그게 깔끔해지는 원인을 찾고 싶어서. 후보를 하나씩 되돌려봐"
 * 주소 뒤에 ?t=번호 를 붙여 열면 12:25 버전에서 그 후보 하나만 어제 20:17 때로 되돌립니다(여러 개는 ?t=1,3).
 *   ?t 가 없으면 평소대로(12:25 + 옆으로 눕힌 가닥 규칙). ?t 가 있으면 그 새 규칙은 끕니다(가시가 가려지지 않게).
 * index.html 맨 끝에 올립니다. 다 찾으면 이 파일과 script 줄을 지우면 됩니다.
 */
(function () {
  var W = window, TAG = '[원인 찾기]';
  var T = {
    '0': ['기준 — 12:25 그대로(새 규칙만 끔)', function () {}],
    '1': ['얇은 자리에서 멈춤 끔(페이드용 · 10j)', function () { REGROW.thinStopCm = 0; }],
    '2': ['정면 사진 참고 끔 → 예전 다수결(11a·11h)', function () { REGROW.hullViews = []; }],
    '3': ['두피 밖 3D 방향 끔(11a)', function () { REGROW.tri3D = false; }],
    '4': ['길이 상한 · 곧게 늘어뜨리기 다시 켬(11f)', function () { REGROW.lenCap = true; REGROW.hangDown = true; }],
    '5': ['얼굴 · 목 막음 다시 켬(10d)', function () { REGROW.neck = true; if (W.FLOW_SPEC) FLOW_SPEC.guardNeck = true; try { HAIR_OCC3D.faceVeto = true; } catch (e) {} }],
    '6': ['사진 맞춤 끔(65번)', function () { if (W.VIEW_ALIGN) VIEW_ALIGN.on = false; }],
    '7': ['방향 필터로 결 읽기 끔(66번 · 모양 재기는 그대로)', function () { if (W.GABOR_ORIENT) GABOR_ORIENT.replace = false; }],
    '8': ['뿌리 결 앞뒤를 이웃으로 정하기 끔(11d)', function () { REGROW.polNbr = false; }],
    '9': ['누운 머리 길이 끝내기 끔(짧은 머리 · 11a)', function () { REGROW.onScalpLen = false; }],
    '10': ['섹션 부피를 스펙에 안 넣음(12:25)', function () { REGROW.secVol = false; }],
    '11': ['뒤집기 4cm · 오르막 벌점 그대로(10g·10i 되돌림)', function () { REGROW.flipThickCm = 4; REGROW.polThickLo = 0; REGROW.polThickHi = 0; REGROW.polSlopeLo = 0; REGROW.polSlopeHi = 0; REGROW.glossNbrKeep = false; }],
    '12': ['페이드를 원본 머리에도 걸기 · 구역 전체 높이 끔(64번)', function () { if (W.SEG_ORIENT) SEG_ORIENT.fadeAll = false; if (W.FADE_ZONE) FADE_ZONE.on = false; REGROW.fadeOn = false; }]
  };
  var q = '';
  try { q = (new URLSearchParams(location.search).get('t') || '').trim(); } catch (e) {}
  var CT = W.CAUSE_TEST = { on: false, ids: [], names: [], list: function () { return Object.keys(T).map(function (k) { return '?t=' + k + ' — ' + T[k][0]; }).join('\n'); } };
  if (!q) { console.log(TAG + ' 꺼짐(평소 버전). 후보 목록: CAUSE_TEST.list()'); return; }
  if (typeof REGROW === 'undefined') { console.warn(TAG + ' REGROW 없음 — 안 걸림'); return; }
  var ids = q === 'all' ? Object.keys(T).filter(function (k) { return k !== '0'; }) : q.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return T[x]; });
  if (!ids.length) { console.warn(TAG + ' 모르는 번호: ' + q + '\n' + CT.list()); return; }
  REGROW.sideLayStay = false;
  ids.forEach(function (k) { try { T[k][1](); CT.ids.push(k); CT.names.push(T[k][0]); } catch (e) { console.warn(TAG + ' ' + k + ' 실패', e); } });
  CT.on = true;
  var txt = '원인 찾기 ?t=' + (q === 'all' ? 'all(전부 되돌림)' : CT.ids.join(',')) + ' · ' + (q === 'all' ? '후보 ' + CT.ids.length + '개' : CT.names.join(' + '));
  console.log(TAG + ' ' + txt + ' · 옆으로 눕힌 가닥 새 규칙은 끔');
  function badge() {
    try {
      var b = document.createElement('div');
      b.textContent = txt;
      b.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:99999;max-width:70vw;padding:5px 9px;border-radius:6px;background:#b3261e;color:#fff;font:600 12px/1.35 system-ui,sans-serif;pointer-events:none;opacity:.92';
      document.body.appendChild(b);
    } catch (e) {}
  }
  if (document.body) badge(); else document.addEventListener('DOMContentLoaded', badge);
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () { var L = ppl.apply(this, arguments) || []; L.push(TAG + ' ' + txt); return L; };
})();
