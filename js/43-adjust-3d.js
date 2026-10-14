/* ==========================================================================
 * 43-adjust-3d.js — 조정 화면을 3D 완성 이미지로 (2D 합성·미니 3D 대신)
 *
 * 로드 위치: index.html에서 42-regrow.js 다음.
 *
 * 왜 (2026-10-04 사용자):
 *   "조정 화면에 2D랑 미니 화면 지우고, 3D 완성 이미지가 지금 2D 화면 자리에 들어오게. 2D처럼 확대·축소·회전되게 하고
 *    머리카락은 다 나오게. 지금 미니 화면은 머리가 길면 아래가 구부러지거든. 그러지 않게."
 *
 * 무엇을:
 *   · 조정 화면의 그림 자리에 3D 결과 화면과 "같은 장면"(같은 렌더러·같은 두상·같은 헤어 만들기)을 넣습니다.
 *     렌더러를 하나 더 만들지 않고, 3D 결과 화면의 그림판을 조정 화면과 번갈아 옮겨 씁니다(GPU 메모리 한 벌).
 *   · 장면 = 두상 + 얼굴 + 헤어. 의상·몸은 조정 화면에 없습니다(3D 결과 화면에서 입힘) —
 *     그래서 긴 머리가 어깨에 걸려 구부러질 것도 없습니다.
 *   · 헤어는 전체 가닥(최종 3D와 같은 객체). 슬라이더가 바뀌면 37번의 "나눠서 만들기"로 다시 만들어
 *     다 되면 갈아 끼웁니다(만드는 동안은 직전 머리가 그대로 보임 · 아래에 진행률).
 *   · 2D 그리기는 조정 화면에서 통째로 건너뜁니다(안 보이는 그림에 시간을 쓰지 않음).
 *   · 조작: 드래그 = 회전 · Shift+드래그/두 손가락 = 이동 · 휠/핀치 = 확대 · 더블클릭 = 원래대로.
 *     확대 막대(− 100% ＋ ↺)와 정면/좌/우/후면 탭도 3D에 걸립니다(탭 = 그 면이 보이게 돌림).
 *   · 처음 뜰 때 헤어 전체가 화면에 들어오게 맞춥니다.
 *
 * 숨기는 것: 2D 그림 · 미니 3D · 2D 전용 버튼(가닥 보기 / 원본 결 보기 / 결필드 원본 / 3D 미리보기 / 옮기기 실험).
 *
 * 끄기: ADJUST3D.on=false 후 ADJUST3D.refresh() (예전 2D 화면으로)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[조정 3D]';
  var A = W.ADJUST3D = Object.assign({ on: true, debounceMs: 140 }, W.ADJUST3D || {});
  var S = A.stats = { builds: 0, swaps: 0, lastMs: 0, baseBuilds: 0, err: null };
  if (typeof THREE === 'undefined' || typeof initModel3DRenderer !== 'function' || typeof loadHeadMesh !== 'function') {
    console.warn(TAG + ' 필요한 함수가 없어 건너뜀'); A.on = false; return;
  }
  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function m3() { try { return (model3D && model3D.initialized) ? model3D : null; } catch (e) { return null; } }
  function active() { return !!A.on && scr() === 'adjust'; }
  A.active = active;

  /* ── 화면 요소 ────────────────────────────────────────────────────────── */
  var host = null, chip = null, hintShown = false, lastW = 0, lastH = 0;
  try {
    var st = document.createElement('style');
    st.textContent = '#screen-adjust.a3-on #adjustCanvas,#screen-adjust.a3-on #devMini3D,#screen-adjust.a3-on #maskDebugToggle,' +
      '#screen-adjust.a3-on #rawDebugToggle,#screen-adjust.a3-on #fieldDebugToggle,#screen-adjust.a3-on #btn3dEngine,' +
      '#screen-adjust.a3-on #origExpBtn,#screen-adjust.a3-on #combBtn{display:none !important;}' +
      '#adjust3dHost canvas{display:block;width:100% !important;height:100% !important;}';
    document.head.appendChild(st);
  } catch (e) {}
  function syncClass() { try { document.getElementById('screen-adjust').classList.toggle('a3-on', !!A.on); if (host) host.style.display = A.on ? '' : 'none'; } catch (e) {} }
  function ensureHost() {
    if (host) return host;
    var pv = document.querySelector('#screen-adjust .adjust-preview');
    if (!pv) return null;
    host = document.createElement('div');
    host.id = 'adjust3dHost';
    host.style.cssText = 'position:absolute;inset:0;z-index:0;overflow:hidden;' +
      'background:radial-gradient(ellipse at 50% 32%,#f1ece3 0%,#d6cfc3 55%,#b9b1a4 100%);';
    pv.insertBefore(host, pv.firstChild);
    chip = document.createElement('div');
    chip.id = 'adjust3dChip';
    chip.style.cssText = 'position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:6;display:none;pointer-events:none;' +
      'font-size:11px;color:#fff;background:rgba(0,0,0,.55);padding:4px 10px;border-radius:10px;white-space:nowrap;';
    pv.appendChild(chip);
    return host;
  }
  var chipTimer = null;
  function setChip(t, ms) {
    if (!chip) return;
    if (chipTimer) { clearTimeout(chipTimer); chipTimer = null; }
    chip.textContent = t || ''; chip.style.display = t ? 'block' : 'none';
    if (t && ms) chipTimer = setTimeout(function () { chip.style.display = 'none'; }, ms);
  }

  /* ── 렌더러를 조정 화면 ↔ 3D 결과 화면으로 옮기기 ─────────────────────── */
  function stopAutoRotate() {              // 원래 루프는 손대기 전까지 혼자 돕니다 — 조정 화면에서는 가만히 있어야 함
    try {
      var c = model3D.renderer.domElement, o = { clientX: 0, clientY: 0, pointerId: 98765, bubbles: true };
      c.dispatchEvent(new PointerEvent('pointerdown', o));
      c.dispatchEvent(new PointerEvent('pointerup', o));
      W.dispatchEvent(new PointerEvent('pointerup', o));
    } catch (e) {}
  }
  function patchRender() {                 // 조정·3D 화면이 아니면 그리지 않음(루프 문을 열어 둔 대신)
    var m = m3(); if (!m || m.renderer.__a3) return;
    var r = m.renderer, orig = r.render;
    r.__a3 = true;
    r.render = function () {
      var s = scr();
      if (s !== 'model3d' && !(s === 'adjust' && A.on)) return;
      return orig.apply(this, arguments);
    };
  }
  var origInit = W.initModel3DRenderer;
  W.initModel3DRenderer = function () {
    var r = origInit.apply(this, arguments);
    try { MOBILE_PERF.loopGate = false; } catch (e) {}
    patchRender(); stopAutoRotate();
    return r;
  };
  function attach() {
    var h = ensureHost(); if (!h) return false;
    syncClass();
    if (!(h.clientWidth > 0 && h.clientHeight > 0)) return false;
    var moved = false;
    if (!m3()) { W.initModel3DRenderer(h); moved = true; }
    else if (model3D.container !== h) { h.appendChild(model3D.renderer.domElement); model3D.container = h; moved = true; }
    // 크기가 바뀌었을 때만 다시 맞춤(매번 맞추면 머리 길이가 바뀔 때마다 화면이 들썩임)
    if (moved || h.clientWidth !== lastW || h.clientHeight !== lastH) {
      lastW = h.clientWidth; lastH = h.clientHeight;
      try { resizeModel3D(); } catch (e) {}
    }
    try { model3D.headGroup.visible = true; } catch (e) {}
    return true;
  }
  function toResult() {
    var m = m3(), vp = document.getElementById('model3dViewport');
    hair = null; sceneKey = null; framed = false; gen++; busy = false; again = false;
    if (!m || !vp || m.container === vp) return;
    vp.appendChild(m.renderer.domElement); m.container = vp;
  }

  /* ── 장면: 두상 + 얼굴 (+ 헤어는 따로) ────────────────────────────────── */
  var hair = null, sceneKey = null, framed = false, gen = 0, busy = false, again = false, baseP = null;
  function buildBase(key) {
    var g = model3D.headGroup;
    while (g.children.length) { var c = g.children[0]; g.remove(c); try { disposeObject3D(c); } catch (e) {} }
    hair = null; framed = false; sceneKey = key; S.baseBuilds++;
    g.rotation.set(0, 0, 0);
    var myGen; try { myGen = ++model3DGeneration; } catch (e) { myGen = 0; }
    function stale() { try { return myGen !== model3DGeneration || !active(); } catch (e) { return true; } }
    var color = '#E8C39E';
    try { color = (state.hairMasks && state.hairMasks.front && state.hairMasks.front.scalpColor) || color; } catch (e) {}
    return Promise.resolve(loadHeadMesh(color)).then(function (res) {
      if (stale() || !res || !res.group) return;
      g.add(res.group); dirty();
      var fm = null; try { fm = getFaceMetrics(); } catch (e) {}
      try {
        Promise.resolve(buildRealFaceMesh(fm)).then(function (mesh) {
          if (stale()) return;
          if (mesh) {
            g.add(mesh); dirty();
            try { if (typeof conformScalpToFace === 'function') conformScalpToFace(g, mesh); } catch (e) { console.warn(TAG + ' 두피면↔얼굴 붙이기 실패', e); }
            return;
          }
          if (typeof buildFacePhotoDecal === 'function') return Promise.resolve(buildFacePhotoDecal(fm)).then(function (d) { if (d && !stale()) g.add(d); });
        }).catch(function (e) { console.warn(TAG + ' 얼굴 붙이기 실패', e); });
      } catch (e) { console.warn(TAG + ' 얼굴 붙이기 실패', e); }
    });
  }
  function dirty() { try { if (W.GPU_DIET && W.GPU_DIET.markDirty) W.GPU_DIET.markDirty(); } catch (e) {} }
  function swapHair(obj) {
    var g = model3D.headGroup, old = hair;
    if (obj === old && obj.parent === g) return;
    if (old && old.parent) old.parent.remove(old);
    g.add(obj); hair = obj; S.swaps++; dirty();
    if (old && old !== obj) {
      try { while (old.children.length) old.remove(old.children[0]); } catch (e) {}
      var D = W.MOBILE_DIET;
      try { if (D && D.recycleObject) D.recycleObject(old); else disposeObject3D(old); } catch (e) {}
    }
  }
  function updateHair() {
    if (busy) { again = true; return; }
    busy = true; again = false;
    var t0 = now(), my = ++gen, D = W.MOBILE_DIET;
    S.builds++;
    // (2026-10-04f) "머리 만드는 중… ○○%" 표시는 뺌(사용자 요청) — 조정 화면 헤어는 가볍게 만들어 금방 바뀜
    var pr = (D && typeof D.prepare3D === 'function') ? D.prepare3D() : Promise.resolve(false);
    pr.then(function () {
      busy = false;
      if (my !== gen || !active()) { setChip(''); return; }
      if (again) { again = false; return updateHair(); }          // 만드는 사이 값이 또 바뀜 — 최신 값으로 다시
      var obj = null;
      try { obj = buildAdjustedHair3DObject(); } catch (e) { S.err = String(e && e.message || e); console.warn(TAG + ' 헤어 만들기 실패', e); }
      if (obj && m3()) swapHair(obj);
      S.lastMs = now() - t0;
      if (!framed && obj) {                                                              // 헤어 전체가 들어오게
        try { MODEL3D_VIEW.zoom = 1; MODEL3D_VIEW.panX = 0; MODEL3D_VIEW.panY = 0; } catch (e) {}   // 3D 결과 화면에서 쓰던 확대·이동은 가져오지 않음
        try { frameCameraToHead(); } catch (e) {}
        framed = true;
      }
      if (!hintShown) { hintShown = true; setChip('드래그 회전 · Shift+드래그(두 손가락) 이동 · 휠(핀치) 확대', 4500); } else setChip('');
    }, function (e) { busy = false; setChip(''); console.warn(TAG + ' 헤어 준비 실패', e); });
  }

  /* ── 갱신 ─────────────────────────────────────────────────────────────── */
  var timer = null, waitN = 0;
  function schedule(ms) { if (timer) clearTimeout(timer); timer = setTimeout(refresh, ms == null ? A.debounceMs : ms); }
  function refresh() {
    timer = null;
    syncClass();
    try { if (W.MOBILE_DIET) W.MOBILE_DIET.externalDriver = !!A.on; } catch (e) {}
    if (!active()) return;
    if (!attach()) { if (waitN++ < 40) schedule(150); return; }
    var model = null; try { model = state.hair3Dneutral; } catch (e) {}
    if (!model || !model.strands || !model.strands.length) {       // 중립 모델은 원래 흐름(scheduleHair3DRefresh)이 만듦 — 기다림
      setChip('3D 모델 준비 중…');
      if (waitN++ < 120) schedule(300);
      return;
    }
    waitN = 0;
    var key = state._hair3Dneutral || model;
    var need = sceneKey !== key || !model3D.headGroup.children.length;
    if (need && !baseP) {
      baseP = buildBase(key).then(function () { baseP = null; }, function (e) { baseP = null; console.warn(TAG + ' 두상 만들기 실패', e); });
    }
    (baseP || Promise.resolve()).then(function () { if (active()) updateHair(); });
  }
  A.refresh = function () {
    syncClass();
    if (!A.on) {                                    // 예전 2D 화면으로
      try { if (W.MOBILE_DIET) W.MOBILE_DIET.externalDriver = false; } catch (e) {}
      try { if (typeof drawAdjustPreview === 'function') { if (typeof RENDER_SKIP !== 'undefined') RENDER_SKIP.last = null; drawAdjustPreview(); } } catch (e) {}
      return;
    }
    schedule(0);
  };

  /* ── 걸기 ─────────────────────────────────────────────────────────────── */
  // 2D 그리기 건너뛰기
  var origFrame = W.renderFrame;
  if (typeof origFrame === 'function') W.renderFrame = function (canvas) {
    if (A.on && canvas && canvas.id === 'adjustCanvas' && scr() === 'adjust') return;
    return origFrame.apply(this, arguments);
  };
  // 값·뷰가 바뀔 때마다 원래 흐름이 부르는 자리
  var sideAtPlusX = null, lastView = null;
  function yawFor(view) {
    if (view === 'front') return 0;
    if (view === 'back') return Math.PI;
    if (sideAtPlusX == null) {
      try { var E = getHeadEllipsoid(), cy = (state.hair3Dneutral && state.hair3Dneutral.CY) || 0; sideAtPlusX = viewOfRoot({ x: E.a, y: cy, z: 0 }); } catch (e) { sideAtPlusX = 'left'; }
    }
    return view === sideAtPlusX ? -Math.PI / 2 : Math.PI / 2;      // +x 쪽을 카메라로 = −90°
  }
  var origRAF = W.renderAdjustFrame;
  if (typeof origRAF === 'function') W.renderAdjustFrame = function () {
    var r = origRAF.apply(this, arguments);
    if (A.on && scr() === 'adjust') {
      try {
        var v = state.currentViewAngle;
        if (lastView !== null && v !== lastView && m3()) model3D.headGroup.rotation.y = yawFor(v);   // 탭 = 그 면이 보이게
        lastView = v;
      } catch (e) {}
      schedule();
    }
    return r;
  };
  var origAct = W.activateScreen;
  if (typeof origAct === 'function') W.activateScreen = function (name) {
    var r = origAct.apply(this, arguments);
    if (name === 'adjust' && A.on) { waitN = 0; lastView = null; schedule(30); }
    return r;
  };
  var origSetup = W.setupModel3DScreen;
  if (typeof origSetup === 'function') W.setupModel3DScreen = function () {
    try { toResult(); } catch (e) { console.warn(TAG + ' 3D 화면으로 옮기기 실패', e); }
    return origSetup.apply(this, arguments);
  };
  // 확대 막대
  var oStep = W.adjustViewStep, oReset = W.adjustViewReset, oApply = W.model3dApplyView;
  W.adjustViewStep = function (f) { if (active() && typeof model3dZoomStep === 'function') return model3dZoomStep(f); return oStep && oStep.apply(this, arguments); };
  W.adjustViewReset = function () {
    if (active() && typeof model3dViewReset === 'function') { model3dViewReset(); try { frameCameraToHead(); } catch (e) {} return; }
    return oReset && oReset.apply(this, arguments);
  };
  if (typeof oApply === 'function') W.model3dApplyView = function () {
    var r = oApply.apply(this, arguments);
    try { if (active()) { var el = document.getElementById('adjustZoomPct'); if (el) el.textContent = Math.round(MODEL3D_VIEW.zoom * 100) + '%'; } } catch (e) {}
    return r;
  };
  W.addEventListener('resize', function () { if (active()) schedule(120); });

  A.status = function () {
    return { on: A.on, attached: !!(m3() && host && model3D.container === host), hair: !!hair, builds: S.builds, swaps: S.swaps, lastMs: Math.round(S.lastMs), baseBuilds: S.baseBuilds, err: S.err };
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [], s = A.status();
    return L.concat(['[조정 3D] ' + (s.on ? '켜짐' : '꺼짐') + ' · 그림판 ' + (s.attached ? '조정 화면에 있음' : '다른 화면') + ' · 헤어 만들기 ' + s.builds + '회 / 갈아 끼움 ' + s.swaps +
      '회 · 직전 ' + s.lastMs + 'ms(값 바뀐 뒤 새 머리가 보일 때까지) · 두상 만들기 ' + s.baseBuilds + '회' + (s.err ? ' · ⚠ ' + s.err : '')]);
  };

  syncClass();
  console.log(TAG + ' 설치 — 조정 화면에 3D 완성 이미지(2D·미니 3D 숨김). 끄기 ADJUST3D.on=false 후 ADJUST3D.refresh() · 상태 ADJUST3D.status()');
})();
