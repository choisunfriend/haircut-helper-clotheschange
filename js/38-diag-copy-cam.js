/* ==========================================================================
 * 38-diag-copy-cam.js — 녹화 없이 숫자 보내기 · 진단 버튼 · 카메라 끄기
 *
 * 로드 위치: index.html 맨 끝(37-mobile-diet.js 다음).
 *
 * ① 카메라 끄기 — 카메라는 앱을 열 때 켜져서 한 번도 꺼지지 않았습니다(getTracks().stop() 없음).
 *    스타일·조정·3D 화면에 있는 동안에도 센서와 영상 프레임이 계속 돌아 메모리·발열을 먹습니다.
 *    촬영 화면을 나가면 끄고, 촬영 화면으로 돌아오면 다시 켭니다.
 *
 * ② 진단 버튼 — 두 가지가 겹쳐 잘 안 눌렸습니다.
 *    · 버튼 높이가 약 22px(글자 11px + 여백 4px) — 손가락으로 맞히기 어려운 크기.
 *    · 누르면 그 자리에서 미뤄 둔 진단 계산(28번 C: 뷰별 재풀이·실루엣 4뷰·전체 가닥)을 다 하고
 *      나서야 패널이 그려집니다. 그동안 화면이 멈춰 있어 "안 눌렸나" 하고 다시 누르면,
 *      쌓여 있던 두 번째 탭이 패널을 도로 닫습니다.
 *    고침: 버튼을 키우고, 누르면 "계산 중…"을 먼저 그린 뒤 계산하고, 계산 중·직후의 탭은 버립니다.
 *
 * ③ 숫자를 글자로 복사 — 진단 패널에 [복사] 버튼. 화면 녹화 없이 붙여넣기로 보낼 수 있습니다.
 *    마지막 진단 글은 localStorage에도 남깁니다(앱이 꺼져도 DIAG_TOOLS.last()로 꺼냄).
 *
 * ④ 3D 진입 기록 — 3D 결과 화면에 들어갈 때마다 JS힙(진입 전 → 최고 → 끝)과 걸린 시간,
 *    그 순간의 성능 줄을 적어 둡니다. 조정 화면의 진단 → [복사]에 같이 들어갑니다.
 *    (3D 화면의 [진단] 버튼은 2026-10-03d에 뺐습니다 — 사용자 요청)
 *
 * 끄기: DIAG_TOOLS.on=false (②③④) · DIAG_TOOLS.camOff=false (①)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[진단 도구]';
  var T = W.DIAG_TOOLS = Object.assign({ on: true, camOff: true }, W.DIAG_TOOLS || {});
  var LS_KEY = 'gyeol_diag_last';
  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function heap() { try { var m = performance.memory; return m ? m.usedJSHeapSize / 1048576 : null; } catch (e) { return null; } }
  function mb(v) { return v == null ? '—' : Math.round(v); }
  function clock() { var d = new Date(); function p(n) { return (n < 10 ? '0' : '') + n; } return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
  function afterPaint(fn) {
    var raf = W.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    raf(function () { setTimeout(fn, 0); });
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 촬영 화면 밖에서는 카메라 끄기
   * ────────────────────────────────────────────────────────────────────── */
  var cam = T.cam = { stops: 0, restarts: 0 };
  function camStop() {
    try {
      if (typeof cameraStream === 'undefined' || !cameraStream) return;
      cameraStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
      cameraStream = null;
      try { video.srcObject = null; } catch (e) {}
      cam.stops++;
      console.log(TAG + ' 카메라 끔 (촬영 화면 밖)');
    } catch (e) { console.warn(TAG + ' 카메라 끄기 실패', e); }
  }
  function camStart() {
    try {
      if (typeof cameraStream === 'undefined' || cameraStream || typeof initCamera !== 'function') return;
      if (!cam.stops) return;                       // 우리가 끈 적이 없으면 건드리지 않음(권한 거부 등)
      cam.restarts++;
      var p = initCamera();
      var after = function () {
        if (scr() !== 'capture') return camStop();  // 켜지는 사이 다른 화면으로 갔으면 다시 끔
        try { if (typeof updateAngleUI === 'function') updateAngleUI(); } catch (e) {}
      };
      if (p && typeof p.then === 'function') p.then(after, after); else after();
    } catch (e) { console.warn(TAG + ' 카메라 다시 켜기 실패', e); }
  }
  var origAct = W.activateScreen;
  if (typeof origAct === 'function') {
    W.activateScreen = function (name) {
      var r = origAct.apply(this, arguments);
      if (T.camOff) { if (name === 'capture') camStart(); else camStop(); }
      return r;
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * 글자 모으기
   * ────────────────────────────────────────────────────────────────────── */
  // 미뤄 둔 진단 계산(28번 C)을 돌리지 않고 성능 줄만
  function perfLinesLight() {
    var F = W.STYLE_FAST, keep = F ? F.pending : null;
    if (F) F.pending = null;
    try { return (typeof W.perfPanelLines === 'function' && W.perfPanelLines()) || []; }
    catch (e) { return ['(성능 줄 실패: ' + (e && e.message) + ')']; }
    finally { if (F) F.pending = keep; }
  }
  function rankLines() {
    var P = W.GYEOL_PERF, rows = [], k;
    if (!P || !P.t) return [];
    for (k in P.t) if (P.t[k].n) rows.push([k, P.t[k].ms, P.t[k].n]);
    rows.sort(function (a, b) { return b[1] - a[1]; });
    return rows.slice(0, 12).map(function (r) { return '  ' + r[0] + ' ' + Math.round(r[1]) + 'ms / ' + r[2] + '회'; });
  }
  var log3D = T.log3D = [];
  function log3DLines() {
    if (!log3D.length) return ['(아직 3D 화면에 들어간 적 없음)'];
    var out = [];
    log3D.forEach(function (e, i) {
      out.push('#' + (i + 1) + ' ' + e.at + ' · JS힙 진입 전 ' + mb(e.h0) + ' → 최고 ' + mb(e.peak) + ' → 끝 ' + mb(e.h1) + 'MB · ' +
        (e.ms == null ? '아직 진행 중' : '걸린 시간 ' + Math.round(e.ms) + 'ms') + (e.hair ? ' · ' + e.hair : ''));
    });
    var last = log3D[log3D.length - 1];
    if (last.lines) { out.push('— 마지막 진입 직후의 성능 줄 —'); out = out.concat(last.lines); }
    return out;
  }
  function header() {
    var n = navigator, s = W.screen || {};
    return ['결 진단 · ' + new Date().toISOString().slice(0, 10) + ' ' + clock() + ' · 화면 ' + scr(),
      (n.userAgent || ''),
      '화면 ' + W.innerWidth + '×' + W.innerHeight + ' @' + (W.devicePixelRatio || 1) + ' · 기기 메모리 ' + (n.deviceMemory || '?') + 'GB · 코어 ' + (n.hardwareConcurrency || '?') +
      ' · 카메라 끔 ' + cam.stops + '회/다시 켬 ' + cam.restarts + '회'];
  }
  function fullText(panelText) {
    var a = header();
    a.push('', panelText || perfLinesLight().join('\n'));
    a.push('', '── 3D 진입 기록 ──'); a = a.concat(log3DLines());
    var rk = rankLines(); if (rk.length) { a.push('', '── 함수별 누적(포함 시간) ──'); a = a.concat(rk); }
    try { if (W.MOBILE_DIET && W.MOBILE_DIET.status) a.push('', '── MOBILE_DIET.status ──', JSON.stringify(W.MOBILE_DIET.status())); } catch (e) {}
    var txt = a.join('\n').replace(/<\/?b>/g, '');
    try { localStorage.setItem(LS_KEY, txt.slice(0, 60000)); } catch (e) {}
    return txt;
  }
  T.text = function () { return fullText(null); };
  T.last = function () { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } };

  function copyText(text, btn) {
    var label = btn ? btn.textContent : '';
    function flash(msg) { if (!btn) return; btn.textContent = msg; setTimeout(function () { btn.textContent = label; }, 1600); }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        flash(ok ? '복사됨 ✓' : '복사 실패');
      } catch (e) { flash('복사 실패'); }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash('복사됨 ✓'); }, fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }
  function mkBtn(label, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.style.cssText = 'min-height:34px;min-width:64px;padding:6px 12px;border-radius:8px;border:1px solid #0f0;background:#062a06;color:#0f0;font:600 12px monospace;touch-action:manipulation;';
    b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); });
    return b;
  }
  function addBar(box, getText, onClose) {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:sticky;top:-8px;display:flex;gap:8px;margin:-8px -8px 6px;padding:6px 8px;background:rgba(0,0,0,0.95);z-index:1;';
    bar.appendChild(mkBtn('복사', function (b) { copyText(getText(), b); }));
    if (onClose) bar.appendChild(mkBtn('닫기', onClose));
    box.insertBefore(bar, box.firstChild);
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ②③ 조정 화면 진단 버튼
   * ────────────────────────────────────────────────────────────────────── */
  var box = document.getElementById('diagInfoBox'), btn = document.getElementById('diagInfoToggle');
  var origToggle = W.toggleDiagInfo, busy = false;
  if (btn) {
    btn.style.minHeight = '40px'; btn.style.minWidth = '88px'; btn.style.padding = '10px 14px';
    btn.style.fontSize = '12px'; btn.style.touchAction = 'manipulation'; btn.style.zIndex = '51';
  }
  if (box) box.style.bottom = '56px';
  if (box && typeof origToggle === 'function') {
    W.toggleDiagInfo = function () {
      if (!T.on) return origToggle.apply(this, arguments);
      if (busy) return;                                         // 계산 중·직후에 쌓인 탭은 버림
      if (box.style.display !== 'none') return origToggle.apply(this, arguments);   // 닫기
      busy = true;
      box.style.display = 'block';
      box.textContent = '진단 계산 중… (스타일을 고른 뒤 처음 열 때는 몇 초 걸립니다)';
      var t0 = now();
      afterPaint(function () {
        try {
          box.style.display = 'none';
          origToggle();                                         // 원래 함수가 열고 내용을 채움
          var panel = box.textContent, took = Math.round(now() - t0);
          panel = '[진단 패널 여는 데 ' + took + 'ms]\n' + panel;
          T.lastPanel = panel;
          fullText(panel);                                      // localStorage에 남김
          addBar(box, function () { return fullText(T.lastPanel); }, null);
        } catch (e) {
          box.style.display = 'block';
          box.textContent = '진단 실패: ' + (e && e.message);
          console.warn(TAG + ' 진단 패널 실패', e);
        } finally { setTimeout(function () { busy = false; }, 400); }
      });
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ④ 3D 진입 기록 + 3D 화면 진단 버튼
   * ────────────────────────────────────────────────────────────────────── */
  var origSetup = W.setupModel3DScreen;
  if (typeof origSetup === 'function') {
    W.setupModel3DScreen = function () {
      if (!T.on) return origSetup.apply(this, arguments);
      var e = { at: clock(), h0: heap(), peak: heap(), h1: null, ms: null, lines: null, hair: '' };
      log3D.push(e); while (log3D.length > 4) log3D.shift();
      var t0 = now(), ticks = 0;
      var iv = setInterval(function () {
        var h = heap(); if (h != null && (e.peak == null || h > e.peak)) e.peak = h;
        if (++ticks > 240) clearInterval(iv);                   // 최대 1분
      }, 250);
      var done = function () {
        e.ms = now() - t0;
        setTimeout(function () {                                // 얼굴 메쉬 등 뒤늦게 붙는 것까지 조금 기다림
          clearInterval(iv);
          e.h1 = heap(); if (e.h1 != null && e.h1 > e.peak) e.peak = e.h1;
          try { var st = W.MOBILE_DIET && W.MOBILE_DIET.status && W.MOBILE_DIET.status().pre3D;
            if (st) e.hair = '헤어: 받아 씀 ' + st.hit + ' / 이어서 ' + st.resumed + ' / 진입 때 만듦 ' + st.cold + ' / 원래 방식 ' + st.fallback; } catch (x) {}
          if (scr() === 'model3d') e.lines = perfLinesLight();
          fullText(null);                                       // 앱이 꺼져도 남도록
        }, 2500);
      };
      var r;
      try { r = origSetup.apply(this, arguments); } catch (x) { done(); throw x; }
      if (r && typeof r.then === 'function') r.then(done, done); else done();
      return r;
    };
  }

  /* (2026-10-03d) 3D 화면의 [진단] 버튼은 뺐습니다(사용자 요청). 3D 진입 기록은 계속 남고,
     조정 화면의 진단 → [복사]에 같이 들어갑니다. */

  console.log(TAG + ' 설치 — 촬영 화면 밖 카메라 끔 · 진단 버튼 키움/먼저 그림 · [복사] · 3D 진입 기록. ' +
    '글자 꺼내기 DIAG_TOOLS.text() · 마지막 기록 DIAG_TOOLS.last() · 끄기 DIAG_TOOLS.on=false / .camOff=false');
})();
