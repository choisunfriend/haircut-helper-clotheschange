/* 31-goat-events.js — 방문자가 어느 화면까지 갔는지 GoatCounter에 이벤트로 남김 (2026-10-20)
 * 사용자: "들어온 기록만 남고 세부적인 건 안 나와" · "난독화 앱들에도 적용 가능하면 갖다 넣기만"
 *
 * 앱 코드는 건드리지 않음 — 화면(section.screen)에 'active'가 붙는 것만 지켜봄. 그래서 원본·난독화 어느 쪽에도 그대로 넣으면 됨.
 * 남기는 것(한 방문에 화면마다 한 번): screen-capture · screen-style · screen-adjust · screen-result · screen-model3d
 *   GoatCounter 대시보드에서 이벤트 이름 "step-capture" 같은 것으로 보임. 사진·이름 등 개인정보는 보내지 않음.
 * 필요: index.html에 GoatCounter count.js가 이 파일보다 먼저(또는 async로) 있어야 함. 늦게 올라와도 기다렸다 보냄.
 * 끄기: window.GOAT_EVENTS_OFF = true (이 파일보다 먼저)
 */
(function () {
  'use strict';
  if (window.GOAT_EVENTS_OFF) return;
  var sent = {}, queue = [];

  function flush() {
    var gc = window.goatcounter;
    if (!gc || typeof gc.count !== 'function') return false;
    while (queue.length) {
      var e = queue.shift();
      try { gc.count({ path: e, title: e, event: true }); } catch (err) {}
    }
    return true;
  }
  function send(name) {
    if (sent[name]) return;
    sent[name] = 1; queue.push(name);
    if (!flush()) {
      var tries = 0, t = setInterval(function () { if (flush() || ++tries > 60) clearInterval(t); }, 1000);
    }
  }
  function check() {
    var list = document.querySelectorAll('section.screen.active');
    for (var i = 0; i < list.length; i++) {
      var id = list[i].id || '';
      if (id.indexOf('screen-') === 0) send('step-' + id.slice(7));
    }
  }
  function start() {
    check();
    var screens = document.querySelectorAll('section.screen');
    if (!screens.length || typeof MutationObserver !== 'function') return;
    var mo = new MutationObserver(check);
    for (var i = 0; i < screens.length; i++) mo.observe(screens[i], { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
