/* ==========================================================================
 * 58-original-on-mannequin.js — 원본 머리 = 마네킹을 켜고 그 위에 사진에서 잰 스펙을 올린 것
 *
 * 로드 위치: index.html 맨 끝(57-spec-pass.js 다음). 42번·17번·16번은 고치지 않습니다.
 *
 * 왜 (2026-10-06 · 사용자): "다른 스타일들은 기반이 마네킨 모드다. 원본 머리를 스타일로 저장해서 다시 돌려보니까 마네킨 모드 기반으로
 *   생성되는데, 영 다른 모양이네." "마네킨 모드를 켜고 그 위에 스펙을 올려라. 그 상태로 스타일을 저장해야 나중에 적용해도 안 변한다."
 *   예전: 마네킹 OFF = 다시 기른 가닥(42번)을 그대로 그림. 그 머리를 스타일로 등록하면 숫자 몇 개만 남고, 다시 걸 때는 마네킹에 그 숫자를
 *        거는 다른 경로라서 모양이 달라졌습니다.
 *
 * 무엇을:
 *   · 다시 기르기는 "재는 용도"로만 돕니다. 다 기르면 그 가닥을 그리지 않고,
 *       ① 마네킹 초기화(섹션 기본값 · 컬 0 · 스타일링 중립 · 페이드 꺼짐)
 *       ② 그 위에 잰 스펙(42번 measure + 57번이 넘기는 컬 길이·로드 배수·가르마)을 등록 스타일과 같은 경로(applyStyleSpec)로 겁니다.
 *     화면에 보이는 원본 머리가 곧 "마네킹 + 스펙"입니다.
 *   · 그 상태에서 [현재 모델을 스타일로 등록]하면 여느 마네킹 스타일과 같은 경로(06번 buildSpecFromCurrent)로 저장됩니다.
 *     다시 걸 때도 같은 마네킹에 같은 값이 걸리므로 같은 모양이 나옵니다.
 *   · 버튼의 뜻은 그대로 — [마네킹 초기화 OFF] = 원본 머리 · [마네킹 초기화 ON] = 맨 마네킹(초기화).
 *     달라진 것은 OFF일 때도 속은 마네킹이라는 것뿐입니다(MANNEQUIN.on은 계속 true).
 *   · 사진이 바뀌면(49번) 원본 머리였던 경우에 한해 새 사진으로 다시 재서 올립니다.
 *   · 재기에 실패하면(다시 기른 모델이 없음) 예전처럼 다시 기른 가닥을 그대로 보여 줍니다.
 *
 * ⚠ 원본 머리가 예전(다시 기른 가닥)보다 사진과 덜 닮습니다 — 스펙이 담는 것(섹션 길이 · 컬 · 굵기 · 넘김 · 볼륨 · 페이드 · 가르마)만큼만 닮습니다.
 *   자리마다의 결 방향·두께는 아직 스펙에 없습니다. 닮게 하려면 스펙에 담는 것을 늘려야 합니다(다음 단계).
 *
 * 확인한 것(실제 앱 코드를 브라우저에 올리고, 사진 모델·다시 기른 모델은 지어낸 것으로):
 *   원본 올리기 → 그 상태를 스타일로 등록 → 맨 마네킹으로 초기화 → 등록한 스타일 다시 걸기 → 가닥이 점 단위로 같은가.
 * 확인 못 한 것: 실제 손님 사진.
 *
 * 끄기: ORIG_MQ.on=false 후 버튼을 두 번(예전 방식 = 다시 기른 가닥을 그림)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[원본=마네킹+스펙]';
  var G = W.REGROW;
  if (!G || typeof G.applyBaseline !== 'function' || typeof G.measure !== 'function') { console.warn(TAG + ' REGROW를 못 찾아 건너뜀(42-regrow.js 다음에 넣어야 합니다)'); return; }

  var ID = '__original__';
  var OM = W.ORIG_MQ = Object.assign({ on: true, name: '원본 머리 (마네킹 + 잰 값)' }, W.ORIG_MQ || {});
  OM.id = ID; OM.spec = null; OM.src = null; OM.mode = 'orig';   // mode: 'orig' = 원본 머리를 보는 중 · 'mq' = 맨 마네킹/다른 스타일
  var ST = OM.stats = { applied: 0, fellBack: 0, lastErr: null, at: null };

  function mqOn() { try { return typeof MANNEQUIN !== 'undefined' && !!MANNEQUIN.on; } catch (e) { return false; } }
  function photoNow() { try { return state._hair3Dneutral || null; } catch (e) { return null; } }
  function isOrig() { try { return mqOn() && state.specAppliedId === ID; } catch (e) { return false; } }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function setTag(t) { try { var el = document.getElementById('adjustStyleTag'); if (el) el.textContent = t; } catch (e) {} }
  function secOrder() { return (typeof SECTION_ORDER !== 'undefined') ? SECTION_ORDER : ['crown', 'front', 'temple', 'side', 'occipital', 'nape']; }
  OM.isOriginal = isOrig;

  /* 등록 스타일 찾기에 원본 스펙을 끼움(STYLE_SPECS·STYLES에는 넣지 않음 — 스타일 목록에 안 보이게) */
  var innerGet = W.getStyleSpec;
  if (typeof innerGet !== 'function') { console.warn(TAG + ' getStyleSpec이 없어 건너뜀'); return; }
  W.getStyleSpec = function (id) { if (id === ID) return OM.spec; return innerGet.apply(this, arguments); };

  /* 버튼 표시: 원본 머리를 보는 중이면 OFF(= 원본), 아니면 17번 그대로 */
  var innerSyncBtn = W.syncMannequinBtn;
  function syncBtn() {
    try { if (typeof innerSyncBtn === 'function') innerSyncBtn(); } catch (e) {}
    try {
      var b = document.getElementById('mannequinBtn'); if (!b) return;
      if (OM.on && isOrig()) { b.classList.remove('on'); b.textContent = '마네킹 초기화 OFF'; }
      b.title = 'OFF: 원본 머리(마네킹에 사진에서 잰 값을 올린 것) · ON: 맨 마네킹으로 초기화';
    } catch (e) {}
  }
  if (typeof innerSyncBtn === 'function') W.syncMannequinBtn = syncBtn;

  /* 맨 마네킹 — 섹션 기본값 · 컬 0 · 스타일링 중립 · 페이드 꺼짐 · 걸린 스타일 없음 */
  function bare() {
    try {
      state.specAppliedId = null; state._specUndo = null;
      secOrder().forEach(function (sec) { var d = {}; try { d = clone(SECTIONS[sec].defaults) || {}; } catch (e) {} d.curl = 0; state.sections[sec] = d; });
      state._globalCurl = 0;
      try { if (state.fade) state.fade.enabled = false; } catch (e) {}
      try { if (typeof BRAID !== 'undefined') BRAID.on = false; } catch (e) {}
      G.mqSnap = null;                                                        // 42번이 예전 마네킹 값을 되돌리지 않게
    } catch (e) { console.warn(TAG + ' 초기화 값 넣기 실패', e); }
    mannequinReset();                                                         // 스타일링 중립 · 마네킹 켬 · 빗질 지움 · 다시 그림
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
  }
  OM.bare = bare;

  /* 다시 기른 모델에서 잰 스펙을 마네킹 위에 올림. 못 하면 false */
  OM.apply = function () {
    var photo = photoNow();
    if (!photo || !(G.model && G.src === photo)) return false;
    var r = null;
    try { r = G.measure(); } catch (e) { ST.lastErr = '재기 실패: ' + (e && e.message || e); }
    if (!r || !r.spec) return false;
    try { if (W.SPEC_PASS && typeof W.SPEC_PASS.enrich === 'function') W.SPEC_PASS.enrich(r); } catch (e) { console.warn(TAG + ' 57번 값 넣기 실패(없이 진행)', e); }
    var spec = clone(r.spec); spec.name = OM.name; spec.source = 'original-on-mannequin';
    OM.spec = spec; OM.src = photo; OM.measured = r; OM.mode = 'orig';
    bare();
    var res = null;
    try { res = applyStyleSpecAndRender(ID); } catch (e) { ST.lastErr = '스펙 걸기 실패: ' + (e && e.message || e); console.warn(TAG + ' ' + ST.lastErr, e); }
    if (!isOrig()) { ST.fellBack++; return !!res; }
    ST.applied++; ST.lastErr = null; ST.at = new Date().toTimeString().slice(0, 8);
    setTag(OM.name); syncBtn();
    try { console.log(OM.lines().join('\n')); if (typeof G.measureLines === 'function') console.log(G.measureLines(r).join('\n')); } catch (e) {}
    return true;
  };

  /* 42번이 다 기른 뒤(그리고 마네킹 OFF로 돌아올 때마다) 부르는 "기준 값 넣기" 자리 — 다시 기른 가닥을 보여 주는 대신 마네킹에 스펙을 올림 */
  var innerBaseline = G.applyBaseline;
  G.applyBaseline = function () {
    if (!OM.on) return innerBaseline.apply(this, arguments);
    var ok = false;
    try { if (G.on && !mqOn()) ok = OM.apply(); } catch (e) { ST.lastErr = String(e && e.message || e); console.warn(TAG + ' 실패 — 예전 방식으로', e); }
    if (ok) return true;
    if (mqOn()) return false;                                                // 이미 마네킹 — 42번의 기준 값을 넣으면 안 됨
    ST.fellBack++;
    return innerBaseline.apply(this, arguments);                             // 못 올림 — 예전처럼 다시 기른 가닥
  };

  /* 원본 머리 보이기 — 이 사진으로 이미 쟀으면 바로, 아니면 42번 흐름(다시 기르기 → 위의 자리)으로 */
  function showOriginal() {
    OM.mode = 'orig';
    var photo = photoNow();
    if (photo && OM.spec && OM.src === photo && G.model && G.src === photo) {
      if (isOrig()) return;
      bare();
      try { applyStyleSpecAndRender(ID); } catch (e) { console.warn(TAG + ' 스펙 걸기 실패', e); }
      if (isOrig()) { setTag(OM.name); syncBtn(); return; }
    }
    try {                                                                     // 42번의 "마네킹 OFF → 다시 기르기"를 그대로 탐
      state.specAppliedId = null; state._specUndo = null;
      MANNEQUIN.on = false; syncBtn();
      if (typeof G.sync === 'function') G.sync();
    } catch (e) { console.warn(TAG + ' 다시 기르기 시작 실패', e); }
  }
  OM.showOriginal = showOriginal;

  /* 버튼: 원본 머리 ↔ 맨 마네킹 */
  var innerToggle = W.toggleMannequin;
  if (typeof innerToggle === 'function') W.toggleMannequin = function () {
    if (!OM.on) return innerToggle.apply(this, arguments);
    if (!mqOn()) {                                                            // 다시 기르는 중이거나 예전 방식으로 떨어진 상태 — 17번·42번 그대로(마네킹 켬)
      OM.mode = 'mq';
      var r = innerToggle.apply(this, arguments); syncBtn(); return r;
    }
    if (isOrig()) { OM.mode = 'mq'; bare(); setTag('마네킹'); syncBtn(); }
    else showOriginal();
  };

  /* 다른 스타일을 걸면 원본 보기가 아님 */
  var innerApply = W.applyStyleSpec;
  if (typeof innerApply === 'function') W.applyStyleSpec = function (id) {
    if (id !== ID) OM.mode = 'mq';
    try { return innerApply.apply(this, arguments); } finally { setTimeout(syncBtn, 0); }
  };

  /* 조정 화면에 들어올 때 — 원본을 보던 중인데 걸린 것이 없으면(사진이 바뀌어 49번이 비운 경우) 새 사진으로 다시 */
  var innerSetup = W.setupAdjustScreen;
  if (typeof innerSetup === 'function') W.setupAdjustScreen = function () {
    // 원본 머리를 보던 중에 사진이 바뀌면 49번이 "고른 스타일"을 다시 걸도록 예약합니다(마네킹이 켜져 있으므로) — 원본을 보던 중이었으면 원본으로
    try { if (OM.on && navWasOrig && !navPend0 && state.pendingSpecId) { state.pendingSpecId = null; OM.mode = 'orig'; } } catch (e) {}
    var pending = null; try { pending = state.pendingSpecId; } catch (e) {}
    var r = innerSetup.apply(this, arguments);
    if (OM.on && !pending) setTimeout(function () {
      try {
        if (typeof currentScreen !== 'undefined' && currentScreen !== 'adjust') return;
        if (OM.mode === 'orig' && mqOn() && !isOrig() && !state.specAppliedId) showOriginal();
        else syncBtn();
      } catch (e) {}
    }, 0);
    return r;
  };

  /* 화면을 옮기기 시작할 때의 상태(49번이 비우기 전) */
  var navWasOrig = false, navPend0 = null, innerNav = W.navTo;
  if (typeof innerNav === 'function') W.navTo = function () {
    try { navWasOrig = !!(OM.on && isOrig()); navPend0 = state.pendingSpecId || null; } catch (e) { navWasOrig = false; navPend0 = null; }
    var p, done = function () { navWasOrig = false; navPend0 = null; };
    try { p = innerNav.apply(this, arguments); } catch (e) { done(); throw e; }
    if (p && typeof p.then === 'function') p.then(done, done); else done();
    return p;
  };

  OM.lines = function () {
    var L = [TAG + ' ' + (!OM.on ? '꺼짐(예전 방식 — 다시 기른 가닥을 그림)' : isOrig() ? '원본 머리 = 마네킹 + 잰 스펙' : OM.mode === 'orig' ? '원본 머리 준비 중/못 올림' : '맨 마네킹 또는 다른 스타일') +
      ' · 올린 횟수 ' + ST.applied + (ST.at ? '(마지막 ' + ST.at + ')' : '') + ' · 예전 방식으로 떨어진 횟수 ' + ST.fellBack + (ST.lastErr ? ' · ⚠ ' + ST.lastErr : '')];
    try {
      var sp = OM.spec;
      if (sp && OM.src === photoNow()) L.push('  올린 스펙: ' + (sp.tipAt ? '끝 높이 ' + Object.keys(sp.tipAt).map(function (k) { return k + ' ' + sp.tipAt[k]; }).join(' · ') :
        '길이 cm ' + Object.keys(sp.lenCm || {}).map(function (k) { return k + ' ' + sp.lenCm[k]; }).join(' · ')) +
        ' | 컬 ' + (sp.perm ? sp.perm.curl + ' · 웨이브 ' + sp.perm.wave + (sp.perm.rodScale > 1 ? ' · 로드 ×' + sp.perm.rodScale : '') : '-') +
        ' | 넘김 ' + (sp.styling ? sp.styling.sweep : '-') + ' · 볼륨 ' + (sp.styling ? sp.styling.volume : '-') + ' · 가르마 ' + (sp.styling && sp.styling.partAmt ? sp.styling.part + '(세기 ' + sp.styling.partAmt + ')' : '없음') +
        ' | 페이드 ' + (sp.fade && sp.fade.enabled ? '높이 ' + sp.fade.height + '%' : '꺼짐'));
    } catch (e) {}
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(OM.lines()); } catch (e) {}
    return L;
  };
  try { syncBtn(); } catch (e) {}
  console.log(TAG + ' 설치 — 원본 머리를 다시 기른 가닥으로 그리지 않고, 마네킹을 켠 뒤 사진에서 잰 스펙을 올려서 보여 줍니다(버튼 OFF = 원본 · ON = 맨 마네킹). 끄기 ORIG_MQ.on=false');
})();
