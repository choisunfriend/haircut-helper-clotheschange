/*
 * 33-cut-from-tip.js — ① 커트는 끝에서부터  ② 3D 미리보기 전체보기
 *
 * ① 증상: 길이 슬라이더를 줄이면 윗부분 흐름까지 같이 움직였다.
 *    원인: adjustStrandGeom이 lengthStrand3D로 "먼저 자르고" 그 짧은 가닥에 가르마·넘김·컬·
 *          중력·볼륨·흐름·매끈함을 입혔다. 이 연산들은 가닥 길이에 따라 결과가 달라서
 *          (컬 주기, 처짐 무게, 넘김 곡선) 길이가 바뀌면 남은 윗부분 모양도 다시 계산됐다.
 *    고침: 실제 커트처럼 — 원래 길이로 스타일을 다 만든 뒤, 완성된 가닥을 호길이 기준으로
 *          끝에서부터 잘라낸다. 그래서 줄일 때 위쪽은 그대로, 아래쪽만 사라진다.
 *          · 호출 동안만 lengthStrand3D를 바꿔치기: 비율 < 1이면 자르지 않고 비율만 기억
 *          · 비율 > 1(기르기)은 예전 그대로(늘린 뒤 스타일)
 *          · 앞머리 선 트림(mqTrimAtFringeLine)은 그대로 두고, 남길 길이는 원래 가닥 기준
 *          · 컬 있는 가닥은 덜 잘림: 잘라낼 양 × hairShrinkFactor(hairEffectiveCurl)
 *            (직모·펌 없음 = ×1 그대로 · 끄기 CUT_FROM_TIP.curlSpare = false)
 *    끄기: CUT_FROM_TIP.on = false (예전 동작)
 *
 * ② 증상: ⛶ 를 눌러도 전체 화면이 안 되고 옆으로만 조금 넓어졌다(캔버스는 예전 크기).
 *    원인: 26-hair-clump.js의 드래그가 창을 한 번이라도 끌면 인라인으로 left/top과
 *          right:auto·bottom:auto를 박는다. 인라인이 .expanded CSS를 이겨서 전체 화면 배치가 무시됐다.
 *    고침: 확대할 때 인라인 위치를 치워 두고, 줄일 때 되돌린다. 크기 변화마다 렌더러 크기도 맞춘다.
 */
(function () {
  'use strict';
  var W = window;

  /* ---------- ① 커트는 끝에서부터 ---------- */
  var CUT_FROM_TIP = W.CUT_FROM_TIP = Object.assign({ on: true, curlSpare: true, stats: { cut: 0, curlSpared: 0 } }, W.CUT_FROM_TIP || {});

  function arcLen(pts) {
    var s = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      s += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    return s;
  }

  // 호길이 keep만 남기고 끝을 잘라냄(마지막 점은 보간). 점의 다른 필드는 유지.
  function truncateArc(pts, keep) {
    if (!pts || pts.length < 2 || !(keep > 0)) return pts && pts.length ? pts.slice(0, Math.min(2, pts.length)) : pts;
    var out = [pts[0]], s = 0;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var d = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (s + d >= keep) {
        var t = d > 1e-12 ? (keep - s) / d : 0;
        out.push(Object.assign({}, b, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }));
        return out.length >= 2 ? out : pts.slice(0, 2);
      }
      out.push(b);
      s += d;
    }
    return out;
  }
  W.cutFromTipTruncate = truncateArc;

  // 잘라낼 양에 곱할 계수(1 = 그대로, 작을수록 덜 잘림). 직모·펌 없음이면 유효컬 0 → 1.
  function curlSpare(strand, ratio) {
    if (!CUT_FROM_TIP.curlSpare) return 1;
    try {
      if (typeof hairEffectiveCurl !== 'function' || typeof hairShrinkFactor !== 'function') return 1;
      var sec = state && state.sections && state.sections[strand.sec];
      var curl = sec && typeof sec.curl === 'number' ? sec.curl : 0;
      var eff = hairEffectiveCurl(curl, strand.sec, ratio);
      if (!(eff > 0)) return 1;
      var f = hairShrinkFactor(eff);
      return isFinite(f) ? Math.max(0.3, Math.min(1, f)) : 1;
    } catch (e) { return 1; }
  }

  var origAdj = W.adjustStrandGeom;
  var origLen = W.lengthStrand3D;
  var origTrim = W.mqTrimAtFringeLine;

  if (typeof origAdj === 'function' && typeof origLen === 'function' && !origAdj.__cutFromTip) {
    var ctx = null; // 호출 중 상태

    var lenStub = function (pts, r) {
      if (!ctx || !(r > 0) || r >= 1 || !pts || pts.length < 2) return origLen.apply(this, arguments);
      ctx.ratio = r;
      ctx.L0 = arcLen(pts);
      ctx.Lpre = ctx.L0;
      return pts; // 자르지 않고 원래 길이로 스타일
    };
    var trimStub = null; // 앞머리 트림은 그대로(남길 길이를 절대값으로 재므로 따로 잴 필요 없음)

    var wrapped = function (strand, len, sty) {
      if (!CUT_FROM_TIP.on || ctx) return origAdj.apply(this, arguments);
      ctx = { ratio: null, L0: 0, Lpre: 0 };
      var saveLen = W.lengthStrand3D, saveTrim = W.mqTrimAtFringeLine;
      W.lengthStrand3D = lenStub;
      if (trimStub) W.mqTrimAtFringeLine = trimStub;
      var out, c;
      try {
        out = origAdj.apply(this, arguments);
      } finally {
        W.lengthStrand3D = saveLen;
        if (trimStub) W.mqTrimAtFringeLine = saveTrim;
        c = ctx; ctx = null;
      }
      if (c.ratio == null || !out || out.length < 2) return out;
      // 남길 길이 = 원래 가닥 호길이 × 비율(절대값). 스타일 연산은 호길이를 거의 보존하고,
      // 앞머리 선·눈 상자 트림으로 이미 더 짧아졌으면 아무것도 안 한다(두 번 줄이지 않음).
      var cutFrac = 1 - c.ratio;
      // 컬 있는 가닥은 덜 잘림 — 잘라낼 양 × 수축 계수(08-cut-engine의 모발상태·유효컬 그대로)
      var k = curlSpare(strand, c.ratio);
      if (k < 1) { cutFrac *= k; CUT_FROM_TIP.stats.curlSpared++; }
      var keep = (1 - cutFrac) * c.L0, have = arcLen(out);
      if (!(keep < have - 1e-9)) return out;
      CUT_FROM_TIP.stats.cut++;
      return truncateArc(out, keep);
    };
    wrapped.__cutFromTip = true;
    W.adjustStrandGeom = wrapped;

    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    console.log('[커트·끝에서] 설치 — 스타일을 원래 길이로 만든 뒤 끝에서부터 자릅니다(위쪽 흐름 고정) · 끄기 CUT_FROM_TIP.on=false');
  }

  W.setCutFromTip = function (on) {
    CUT_FROM_TIP.on = !!on;
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof drawAdjustPreview === 'function') drawAdjustPreview(); } catch (e) {}
    try { if (typeof refreshDevMini3D === 'function') refreshDevMini3D(); } catch (e) {}
    return CUT_FROM_TIP.on;
  };

  /* ---------- ② 3D 미리보기 전체보기 ---------- */
  var POS_KEYS = ['left', 'top', 'right', 'bottom', 'position', 'width', 'height'];

  function resizeSoon() {
    var go = function () {
      try { if (typeof resizeDevMini3D === 'function') resizeDevMini3D(); } catch (e) {}
      try { if (typeof refreshDevMini3D === 'function') refreshDevMini3D(); } catch (e) {}
    };
    requestAnimationFrame(function () { go(); setTimeout(go, 60); });
  }

  W.toggleDevMini3DExpand = function () {
    var el = document.getElementById('devMini3D');
    if (!el) return;
    var expand = !el.classList.contains('expanded');
    if (expand) {
      var saved = {};
      POS_KEYS.forEach(function (k) { saved[k] = el.style[k]; el.style[k] = ''; });
      el._mini3dSavedPos = saved;
      el.classList.add('expanded');
    } else {
      el.classList.remove('expanded');
      var s = el._mini3dSavedPos;
      if (s) POS_KEYS.forEach(function (k) { el.style[k] = s[k] || ''; });
      el._mini3dSavedPos = null;
    }
    resizeSoon();
  };

  // 창 크기가 바뀔 때(확대 상태 포함)도 렌더러를 맞춘다
  try {
    var wrap = document.getElementById('devMini3DCanvasWrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      var pending = false;
      new ResizeObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          try { if (typeof resizeDevMini3D === 'function') resizeDevMini3D(); } catch (e) {}
          try { if (typeof devMini3D !== 'undefined' && devMini3D && devMini3D.markDirty) devMini3D.markDirty(); } catch (e) {}
        });
      }).observe(wrap);
    }
  } catch (e) {}
  // Esc로 전체보기 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var el = document.getElementById('devMini3D');
    if (el && el.classList.contains('expanded')) W.toggleDevMini3DExpand();
  });
})();
