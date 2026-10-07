/* ==========================================================================
 * 48-strand-budget.js — 가닥 수: 3D 결과 화면 3만 · 조정 화면 1만 (앞머리는 전부)
 *
 * 로드 위치: index.html에서 47-natural-grow.js 다음.
 *
 * 왜 (2026-10-04 사용자):
 *   "3D 결과보기는 3만 가닥 수준, 조정 화면은 줄여서."
 *   (2026-10-04e) "조정이 오래 걸린다 → 1만 가닥으로. 프론트 쪽에서는 빼지 말고 사이드와 뒷머리 쪽에서 골고루."
 *
 * 무엇을:
 *   ① 머리 모델(다시 기른 원본 머리 · 마네킹 둘 다)을 STRAND_BUDGET.total(30,000)가닥으로 심습니다.
 *      — 42-regrow.js와 17a-mannequin.js의 "심을 가닥 수" 한 줄이 이 값을 읽습니다.
 *        (사진에 머리가 없는 자리의 뿌리는 안 심으므로 실제 수는 2~3% 적게 나옵니다.)
 *   ② 조정 화면에서는 그중 STRAND_BUDGET.adjust(10,000)가닥만 그립니다. 3D 결과 화면은 전부.
 *      · keepAll 섹션(앞머리 front · 관자놀이 temple — 얼굴 둘레)은 한 가닥도 안 뺍니다.
 *      · 나머지(정수리·옆·뒤·목덜미)에서 남은 수만큼 일정 간격으로 고르게 뽑습니다.
 *      · "전체 가닥" 요청(인자 없는 computeAdjustedHair3DStrands())에만 걸립니다.
 *        간격을 직접 정해 부르는 곳(진단·치수 재기·2D)은 그대로입니다.
 *   ③ (2026-10-04e) 느렸던 진짜 이유 — 값이 바뀔 때마다 28번의 "미리 계산"이 화면에 안 그리는 가닥까지
 *      모델 전체(3만)를 다시 계산하고 있었습니다(진단: adjustStrandGeom 240,000회 = 8번 × 30,000).
 *      28번이 이 파일의 maskFor()를 읽어 조정 화면에서는 고른 가닥만 계산합니다.
 *   ④ 37번의 "미리 만든 3D 헤어"가 두 화면 사이에서 섞이지 않게 서명에 화면별 꼬리표를 붙입니다.
 *
 * 바꾸기: STRAND_BUDGET.total / .adjust / .keepAll 을 고친 뒤 STRAND_BUDGET.refresh()
 * 끄기:   STRAND_BUDGET.on=false; STRAND_BUDGET.refresh()   (예전처럼 사진 가닥 수 · 두 화면 같은 수)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[가닥 수]';
  /* (2026-10-04g) 고사양 폰은 조정 화면도 25,000가닥 — 사용자: "고사양폰은 한 2만5천 가닥 해도 상관없겠다."
     고사양 = 기기 메모리 8GB 이상(크롬이 알려 주는 최댓값) · 메모리를 안 알려 주는 브라우저(아이폰 등)는 코어 6개 이상이고 저사양 판정이 아니면. */
  function highEnd() {
    try {
      if (typeof isLowMemDevice === 'function' && isLowMemDevice()) return false;
      var dm = navigator.deviceMemory, hc = navigator.hardwareConcurrency || 0;
      if (typeof dm === 'number' && dm > 0) return dm >= 8;
      return hc >= 6;
    } catch (e) { return false; }
  }
  var B = W.STRAND_BUDGET = Object.assign({ on: true, total: 30000, adjustLow: 10000, adjustHigh: 25000, keepAll: ['front', 'temple'] }, W.STRAND_BUDGET || {});
  B.highEnd = highEnd();
  if (!(B.adjust > 0)) B.adjust = B.highEnd ? B.adjustHigh : B.adjustLow;
  var S = B.stats = { lastAdjust: 0, lastFull: 0, bySec: null };

  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function model() { try { var m = state.hair3Dneutral; return m && m.strands ? m : null; } catch (e) { return null; } }

  /* 조정 화면에서 그릴 가닥 표. 돌려주는 값 { key, keep(Uint8Array), n } · 줄일 필요가 없으면 null */
  var maskMemo = new WeakMap();
  function buildMask(m) {
    var st = m.strands, n = st.length, keepAll = {}, i, kept = 0, rest = 0;
    (B.keepAll || []).forEach(function (k) { keepAll[k] = 1; });
    var keep = new Uint8Array(n);
    for (i = 0; i < n; i++) { if (keepAll[st[i].sec]) { keep[i] = 1; kept++; } else rest++; }
    var want = Math.max(0, B.adjust - kept);                       // 나머지에서 뽑을 수
    if (rest > 0 && want > 0) {
      var step = Math.max(1, rest / want), acc = 0;
      for (i = 0; i < n; i++) {
        if (keep[i]) continue;
        acc += 1 / step;
        if (acc >= 1) { acc -= 1; keep[i] = 1; kept++; }
      }
    }
    var by = {};
    for (i = 0; i < n; i++) { var sec = st[i].sec || '?', b = by[sec] || (by[sec] = [0, 0]); b[1]++; if (keep[i]) b[0]++; }
    S.bySec = by;
    return keep;
  }
  B.maskFor = function (m) {
    if (B.forceFull) return null;                                  // 37번이 조정 화면에서 3D 결과 화면용 완성본을 뒤에서 만드는 중
    if (!B.on || scr() !== 'adjust' || !(B.adjust > 0) || !m || !m.strands) return null;
    var n = m.strands.length;
    if (n <= B.adjust) return null;
    var key = n + ':' + B.adjust + ':' + (B.keepAll || []).join(',');
    var e = maskMemo.get(m);
    if (!e || e.key !== key || e.arr !== m.strands) { e = { key: key, keep: buildMask(m), n: 0, arr: m.strands }; for (var i = 0; i < n; i++) e.n += e.keep[i]; maskMemo.set(m, e); }
    return e;
  };
  /* 캐시 열쇠로 쓰는 간격 값(1 = 전부) */
  function adjustStride() {
    var m = model(), e = m ? B.maskFor(m) : null;
    return e && e.n > 0 ? m.strands.length / e.n : 1;
  }
  B.stride = adjustStride;

  // ② 전체 가닥 요청에만
  var origCA = W.computeAdjustedHair3DStrands;
  if (typeof origCA !== 'function') { console.warn(TAG + ' computeAdjustedHair3DStrands가 없어 건너뜀'); return; }
  W.computeAdjustedHair3DStrands = function (view, stride) {
    if (!view && stride == null) {
      var k = adjustStride(), out;
      if (k > 1) {
        var save = B._inFull; B._inFull = true;                    // 28번 _adjGeometry가 이 표시를 보고 고른 가닥만 계산
        try { out = origCA.call(this, null, k); } finally { B._inFull = save; }
        if (out && out.length) S.lastAdjust = out.length;
        return out;
      }
      out = origCA.apply(this, arguments);
      if (out && out.length) { if (scr() === 'adjust' && !B.forceFull) S.lastAdjust = out.length; else S.lastFull = out.length; }
      return out;
    }
    return origCA.apply(this, arguments);
  };

  // ④ 화면별 꼬리표 — 37번 fullSig가 adjFilterSig()를 서명에 넣음
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments), m = model(), e = m ? B.maskFor(m) : null;
    return e ? s + '|n' + e.key : s;
  };

  /* 값을 바꾼 뒤: 모델을 다시 만들게 하고 다시 그림 */
  B.refresh = function () {
    maskMemo = new WeakMap();
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try {
      var photo = state._hair3Dneutral, m = model();
      if (photo && m && Math.abs(m.strands.length - B.total) > B.total * 0.06) state.hair3Dneutral = photo;   // 모델 가닥 수가 목표와 다를 때만 다시 심음
    } catch (e) {}
    try { if (W.REGROW) { W.REGROW.base = null; if (typeof W.REGROW.sync === 'function' && scr() === 'adjust') W.REGROW.sync(); } } catch (e) {}
    try { if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
    return { total: B.total, adjust: B.adjust, keepAll: B.keepAll, on: B.on };
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [], m = model(), n = m ? m.strands.length : 0, by = S.bySec, parts = [];
    if (by) Object.keys(by).forEach(function (k) { parts.push(k + ' ' + by[k][0] + '/' + by[k][1]); });
    return L.concat([TAG + ' ' + (B.on ? '켜짐' : '꺼짐') + ' · 목표: 모델 ' + B.total + ' / 조정 화면 ' + B.adjust + (B.highEnd ? '(고사양)' : '(저사양)') + ' (전부 남기는 섹션: ' + ((B.keepAll || []).join(',') || '없음') + ')' +
      ' · 지금 모델 ' + n + '가닥' + (m && m.mannequin ? '(마네킹)' : m && m.regrown ? '(다시 기른 머리)' : '(사진 가닥)') +
      ' · 직전에 그린 수 — 조정 화면 ' + (S.lastAdjust || '—') + ' · 3D 결과 화면 ' + (S.lastFull || '—') +
      (parts.length ? '\n  조정 화면에 남긴 가닥(남김/전체): ' + parts.join(' · ') : '')]);
  };

  console.log(TAG + ' 설치 — 모델 ' + B.total + '가닥 · 조정 화면은 ' + B.adjust + '가닥(' + (B.keepAll || []).join('·') + '은 전부, 나머지에서 고르게). 바꾸기 STRAND_BUDGET.total / .adjust / .keepAll 후 STRAND_BUDGET.refresh()');
})();
