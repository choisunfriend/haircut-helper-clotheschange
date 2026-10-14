/* 62-dialog-lang.js — 스타일 이름 묻기 · 삭제 확인 창을 앱 언어로 (2026-10-10)
 *
 * 사용자: "처음 안내에 있는 확인, 취소는 한글이니까 영어로 바꿔줘"
 * 원인: 스타일 저장의 이름 칸(prompt)과 삭제 확인(confirm)은 브라우저가 띄우는 창이라 버튼 글자(확인/취소)와
 *       "choisunfriend.github.io 내용:" 머리말을 브라우저 언어로 붙입니다. 앱 쪽 코드로는 그 글자를 못 바꿉니다.
 * 지금: 그 세 곳(registerCurrentAsStyle · REGROW.register · deleteSelectedStyle)을 앱이 그리는 창으로 바꿉니다.
 *       글자는 앱 언어(uiLang)를 따름 — 영어: OK / Cancel · 한국어: 확인 / 취소. Enter = 확인 · Esc = 취소.
 *       창에서 받은 답을 원래 함수에 그대로 넘기므로(그동안만 prompt/confirm이 그 답을 돌려줌) 저장 내용은 예전과 같습니다.
 * 끄기: DIALOG_LANG.on = false (브라우저 창으로 돌아감)
 * 넣는 자리: index.html에서 61-photo-curl.js 다음(맨 끝 — 다른 모듈이 감싼 뒤에 감싸야 함)
 */
(function () {
  'use strict';
  var W = window, TAG = '[대화창 언어]';
  var D = W.DIALOG_LANG = Object.assign({ on: true }, W.DIALOG_LANG || {});
  function en() { try { return typeof uiLang !== 'undefined' && uiLang === 'en'; } catch (e) { return false; } }
  function tr(s) { try { return typeof tUI === 'function' ? tUI(s) : s; } catch (e) { return s; } }

  var css = document.createElement('style');
  css.textContent =
    '.dlg62-back{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.dlg62{background:#1f2024;color:#f2efe9;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.45);width:min(440px,100%);padding:18px 18px 14px;font:14px/1.5 system-ui,sans-serif}' +
    '.dlg62 p{margin:0 0 12px;white-space:pre-wrap}' +
    '.dlg62 input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:9px;border:1.5px solid #8fa8d8;background:#16171a;color:#f2efe9;font-size:15px;outline:none}' +
    '.dlg62 .row{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}' +
    '.dlg62 button{min-width:84px;padding:9px 16px;border-radius:999px;border:0;font-size:14px;cursor:pointer}' +
    '.dlg62 .ok{background:#c8915a;color:#1b130c;font-weight:600}.dlg62 .no{background:#3a3c42;color:#f2efe9}';
  (document.head || document.documentElement).appendChild(css);

  function ask(kind, msg, def) {            // kind 'prompt' | 'confirm' → Promise(답 | null/false)
    return new Promise(function (done) {
      var back = document.createElement('div'); back.className = 'dlg62-back';
      var box = document.createElement('div'); box.className = 'dlg62'; box.setAttribute('role', 'dialog');
      var p = document.createElement('p'); p.textContent = msg; box.appendChild(p);
      var inp = null;
      if (kind === 'prompt') { inp = document.createElement('input'); inp.type = 'text'; inp.value = def || ''; box.appendChild(inp); }
      var row = document.createElement('div'); row.className = 'row';
      var no = document.createElement('button'); no.type = 'button'; no.className = 'no'; no.textContent = en() ? 'Cancel' : '취소';
      var ok = document.createElement('button'); ok.type = 'button'; ok.className = 'ok'; ok.textContent = en() ? 'OK' : '확인';
      row.appendChild(no); row.appendChild(ok); box.appendChild(row); back.appendChild(box);
      try { no.__ko = null; ok.__ko = null; back.setAttribute('data-noi18n', '1'); } catch (e) {}
      function end(v) { document.removeEventListener('keydown', key, true); try { back.remove(); } catch (e) {} done(v); }
      function yes() { end(kind === 'prompt' ? inp.value : true); }
      function nay() { end(kind === 'prompt' ? null : false); }
      function key(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); nay(); } else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); yes(); } }
      ok.onclick = yes; no.onclick = nay; back.addEventListener('mousedown', function (e) { if (e.target === back) nay(); });
      document.addEventListener('keydown', key, true);
      document.body.appendChild(back);
      setTimeout(function () { try { (inp || ok).focus(); if (inp) inp.select(); } catch (e) {} }, 0);
    });
  }
  D.ask = ask;

  // 원래 함수가 부르는 prompt/confirm을 가로채 먼저 앱 창으로 묻고, 답을 쥔 채 원래 함수를 다시 부름
  var busy = false;
  function wrapAsk(obj, name, kind) {
    var inner = obj && obj[name];
    if (typeof inner !== 'function') { console.warn(TAG + ' ' + name + '이(가) 없어 건너뜀'); return false; }
    obj[name] = function () {
      if (!D.on || busy) return inner.apply(this, arguments);
      var self = this, args = arguments, asked = null;
      var keepP = W.prompt, keepC = W.confirm;
      // 1) 원래 함수가 무엇을 묻는지(글자)만 알아냄 — 답은 "취소"로 돌려줘서 아무것도 바뀌지 않게
      try {
        busy = true;
        W.prompt = function (m, d) { if (!asked) asked = { kind: 'prompt', msg: m, def: d }; return null; };
        W.confirm = function (m) { if (!asked) asked = { kind: 'confirm', msg: m }; return false; };
        inner.apply(self, args);
      } catch (e) {} finally { W.prompt = keepP; W.confirm = keepC; busy = false; }
      if (!asked) return null;                                      // 묻지 않는 경우(예: 원본을 못 잼 — 안내만 뜸)는 1)에서 이미 끝남
      return ask(asked.kind, asked.msg, asked.def).then(function (ans) {
        if (asked.kind === 'prompt' ? (ans == null || !String(ans).trim()) : !ans) return null;
        try {
          busy = true;
          W.prompt = function () { return ans; }; W.confirm = function () { return true; };
          return inner.apply(self, args);
        } finally { W.prompt = keepP; W.confirm = keepC; busy = false; }
      });
    };
    return true;
  }
  var n = 0;
  if (wrapAsk(W, 'registerCurrentAsStyle', 'prompt')) n++;
  if (W.REGROW && wrapAsk(W.REGROW, 'register', 'prompt')) n++;
  if (wrapAsk(W, 'deleteSelectedStyle', 'confirm')) n++;
  console.log(TAG + ' 설치 — 스타일 이름·삭제 확인 창을 앱 언어로(' + n + '곳). 끄기 DIALOG_LANG.on=false');
})();
