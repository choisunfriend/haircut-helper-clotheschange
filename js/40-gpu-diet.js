/* ==========================================================================
 * 40-gpu-diet.js — GPU·메모리 점유 자체를 줄이기 (보여 주는 순서가 아니라 일을 줄임)
 *
 * 로드 위치: index.html 맨 끝(39-two-pass-render.js 다음).
 *
 * ① 3D 결과 화면: 바뀐 게 없으면 다시 그리지 않기
 *    원래 루프는 3D 화면에 있는 동안 매 프레임(초당 60번) 헤어 선 전체·두상·의상을 다시 그립니다.
 *    가만히 보고 있을 때도, 자동 회전 중에도요.
 *    · 카메라·두상 회전·장면 구성이 직전에 그린 것과 같으면 건너뜁니다.
 *      (놓친 변화가 있어도 보이도록 idleMs마다 한 번은 무조건 그림 — 텍스처가 뒤늦게 뜨는 경우 등)
 *    · 저사양 판정 기기는 움직이는 중에도 초당 30번까지만 그립니다. 자동 회전 속도는 그대로입니다
 *      (회전각은 원래 루프가 매 프레임 올리고, 그리기만 한 번 걸러 함).
 *
 * ② 분석용 모델을 분석이 끝난 뒤 내려놓기
 *    머리 분리(MediaPipe) · 몸 분리(TF.js) · 얼굴 랜드마크 · 포즈 모델은 촬영·분석 때만 쓰이는데,
 *    앱을 열 때 올라와서 한 번도 내려가지 않았습니다(close/dispose 호출 없음).
 *    조정·3D 화면에 들어가고 holdMs 뒤에 내려놓고, 촬영 화면으로 돌아오면 다시 올립니다.
 *    분석(runStyleAnalysisPipeline)이 불리면 모델이 다 올라올 때까지 기다렸다가 시작합니다.
 *    ⚠ faceLandmarkerReady는 내려놓은 동안에도 true로 둡니다 — 조정 화면 렌더가 이 값이 true일 때만
 *      섹션 경계를 보정(refineSectionBoundaries)하기 때문입니다. 촬영 화면으로 돌아오는 순간 false로 내리고
 *      다시 올라오면 원래 코드가 true로 올립니다.
 *    대가: 재촬영·새 손님 때 모델이 다시 올라오는 몇 초.
 *
 * ③ 진단 줄 [GPU] — 3D 그리기 횟수(그림/건너뜀) · 장면의 선·삼각형 수 · 그림판 크기 · TF.js가 잡은 GPU 메모리 ·
 *    모델을 내려놓기 전/후.
 *
 * 끄기: GPU_DIET.on=false (전부) · .skipIdle=false · .cap30=false · .releaseModels=false
 * 상태: GPU_DIET.status()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[GPU 다이어트]';
  var G = W.GPU_DIET = Object.assign({
    on: true,
    skipIdle: true,       // ① 바뀐 게 없으면 3D를 다시 그리지 않음
    idleMs: 500,          //    그래도 이만큼마다 한 번은 그림
    cap30: null,          //    초당 30번 상한 — null이면 저사양 판정 기기만
    releaseModels: true,  // ② 분석 끝난 뒤 모델 내려놓기
    holdMs: 2500          //    조정·3D 화면에 들어간 뒤 이만큼 지나서
  }, W.GPU_DIET || {});
  var S = G.stats = { drawn: 0, skipped: 0, released: 0, reloaded: 0, tfBefore: null, tfAfter: null, lastErr: null };

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function lowMem() { try { return typeof isLowMemDevice === 'function' && isLowMemDevice(); } catch (e) { return false; } }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 3D 그리기 건너뛰기
   * ────────────────────────────────────────────────────────────────────── */
  function sceneSig(m) {
    var c = m.camera, g = m.headGroup, a = [], n = 0, vis = 0;
    a.push(c.position.x, c.position.y, c.position.z, c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w, c.fov, c.aspect, c.near);
    a.push(g.rotation.x, g.rotation.y, g.rotation.z, g.position.x, g.position.y, g.position.z, g.scale.x, g.visible ? 1 : 0);
    m.scene.traverse(function (o) { n++; if (o.visible) vis = (vis * 31 + n) | 0; });
    var el = m.renderer.domElement;
    a.push(n, vis, el.width, el.height);
    return a.join(',');
  }
  var forced = false;
  G.markDirty = function () { forced = true; };
  function patchRenderer(m) {
    if (!m || !m.renderer || m.renderer.__gpuDiet) return;
    var rnd = m.renderer, orig = rnd.render, lastSig = null, lastAt = 0;
    rnd.__gpuDiet = true;
    rnd.render = function (scene, camera) {
      if (!G.on || scene !== m.scene) return orig.apply(this, arguments);
      var t = now(), sig = null;
      try { sig = sceneSig(m); } catch (e) { sig = null; }
      if (forced) { forced = false; sig = null; }                 // 내용이 바뀌었다고 알려 옴(43번: 헤어 갈아 끼움) — 바로 그림
      if (sig !== null) {
        if (sig === lastSig) {
          if (G.skipIdle && t - lastAt < G.idleMs) { S.skipped++; return; }
        } else {
          var cap = G.cap30 == null ? lowMem() : G.cap30;
          if (cap && t - lastAt < 30) { S.skipped++; return; }         // 움직이는 중: 초당 30번까지
        }
      }
      lastSig = sig; lastAt = t; S.drawn++;
      return orig.apply(this, arguments);
    };
  }
  var origInit = W.initModel3DRenderer;
  if (typeof origInit === 'function') {
    W.initModel3DRenderer = function () {
      var r = origInit.apply(this, arguments);
      try { patchRenderer(r || (typeof model3D !== 'undefined' ? model3D : null)); } catch (e) { console.warn(TAG + ' 3D 그리기 고침 실패', e); }
      return r;
    };
  }
  try { if (typeof model3D !== 'undefined' && model3D && model3D.initialized) patchRenderer(model3D); } catch (e) {}

  /* ────────────────────────────────────────────────────────────────────────
   * ② 분석용 모델 내려놓기 / 다시 올리기
   * ────────────────────────────────────────────────────────────────────── */
  var released = false, faceReleased = false, reloadP = null, relTimer = null;
  function tfGpuMB() {
    try { var m = tf.memory(); return typeof m.numBytesInGPU === 'number' ? m.numBytesInGPU / 1048576 : null; } catch (e) { return null; }
  }
  function tryCall(o, name) { try { if (o && typeof o[name] === 'function') o[name](); } catch (e) { S.lastErr = String(e && e.message || e); } }

  function releaseNow(why) {
    if (!G.on || !G.releaseModels || released || reloadP) return;
    try {
      if (typeof stylePrepDone === 'undefined' || !stylePrepDone) return;      // 분석이 아직 안 끝남
      if (typeof segmenterReady === 'undefined' || (!segmenterReady && !segmenterError)) return;   // 아직 올라오는 중
      var sc = scr();
      if (sc !== 'adjust' && sc !== 'model3d') return;
      S.tfBefore = tfGpuMB();
      try { tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0); } catch (e) {}   // 풀어 준 텍스처를 쌓아 두지 않고 바로 지움

      // 머리 분리(MediaPipe) · 몸 분리(TF.js) — segmenter가 둘 중 하나를 가리킴
      var tfModels = [];
      if (typeof bodySegmenter !== 'undefined' && bodySegmenter) tfModels.push(bodySegmenter);
      if (segmenter && segmenter !== mpImageSegmenter && tfModels.indexOf(segmenter) < 0) tfModels.push(segmenter);
      tryCall(mpImageSegmenter, 'close');
      tfModels.forEach(function (mdl) { tryCall(mdl, 'dispose'); });
      mpImageSegmenter = null; segmenter = null; segmenterReady = false; segmenterError = false;
      if (typeof bodySegmenter !== 'undefined') bodySegmenter = null;

      // 얼굴 랜드마크 — Ready 값은 그대로 둠(조정 화면 섹션 경계 보정이 이 값에 걸려 있음)
      faceReleased = false;
      if (typeof faceLandmarker !== 'undefined' && faceLandmarker && faceLandmarkerReady) {
        tryCall(faceLandmarker, 'close'); faceLandmarker = null; faceReleased = true;
      }
      // 포즈(후면 촬영용) — 필요할 때 원래 코드가 다시 올림
      if (typeof posePoseLandmarker !== 'undefined' && posePoseLandmarker && poseLandmarkerState === 'ready') {
        tryCall(posePoseLandmarker, 'close'); posePoseLandmarker = null; poseLandmarkerState = 'idle';
      }
      released = true; S.released++;
      S.tfAfter = tfGpuMB();
      console.log(TAG + ' 분석용 모델 내려놓음 (' + why + ') — TF.js GPU ' +
        (S.tfBefore == null ? '?' : S.tfBefore.toFixed(1)) + ' → ' + (S.tfAfter == null ? '?' : S.tfAfter.toFixed(1)) + 'MB');
    } catch (e) { S.lastErr = String(e && e.message || e); console.warn(TAG + ' 모델 내려놓기 실패', e); }
  }

  /* 모델이 필요해지면 부름. 내려놓은 적이 없으면 아무것도 안 함. 돌려주는 값: 다 올라오면 풀리는 Promise */
  function ensureModels(why) {
    if (relTimer) { clearTimeout(relTimer); relTimer = null; }
    if (reloadP) return reloadP;
    if (!released) return Promise.resolve();
    released = false; S.reloaded++;
    console.log(TAG + ' 분석용 모델 다시 올림 (' + why + ')');
    var jobs = [];
    try {
      if (faceReleased) { faceLandmarkerReady = false; faceReleased = false; jobs.push(Promise.resolve(initFaceLandmarker())); }
      jobs.push(Promise.resolve(initSegmenter()).then(function () { return initBodySegmenter(); }));
    } catch (e) { S.lastErr = String(e && e.message || e); console.warn(TAG + ' 모델 다시 올리기 실패', e); }
    var done = function () { reloadP = null; };
    reloadP = Promise.all(jobs.map(function (p) { return p.then(null, function (e) { S.lastErr = String(e && e.message || e); }); })).then(done, done);
    return reloadP;
  }
  G.ensureModels = ensureModels;
  G.releaseNow = function () { releaseNow('직접 호출'); };

  var origAct = W.activateScreen;
  if (typeof origAct === 'function') {
    W.activateScreen = function (name) {
      if (name === 'capture') ensureModels('촬영 화면');        // 원래 코드(라이브 가이드)보다 먼저 — Ready 값을 내려 둬야 함
      var r = origAct.apply(this, arguments);
      if (name === 'adjust' || name === 'model3d') {
        if (relTimer) clearTimeout(relTimer);
        relTimer = setTimeout(function () { relTimer = null; releaseNow(name + ' 화면'); }, G.holdMs);
      } else if (relTimer) { clearTimeout(relTimer); relTimer = null; }
      return r;
    };
  }
  var origPipe = W.runStyleAnalysisPipeline;
  if (typeof origPipe === 'function') {
    W.runStyleAnalysisPipeline = function () {
      var self = this, args = arguments;
      if (!released && !reloadP) return origPipe.apply(self, args);
      try { if (typeof showAI === 'function') showAI('모델 로딩 중…', '분석 모델을 다시 준비하고 있어요'); } catch (e) {}
      return ensureModels('분석').then(function () { return origPipe.apply(self, args); });
    };
  }
  // 촬영 직후의 얼굴 확인은 원래 코드가 faceLandmarkerReady를 5초까지 기다림 — 따로 고칠 것 없음.

  /* ────────────────────────────────────────────────────────────────────────
   * ③ 진단 줄
   * ────────────────────────────────────────────────────────────────────── */
  G.status = function () {
    var o = { drawn: S.drawn, skipped: S.skipped, modelsReleased: released, released: S.released, reloaded: S.reloaded,
      tfGpuMB: tfGpuMB(), tfBefore: S.tfBefore, tfAfter: S.tfAfter, lastErr: S.lastErr };
    try {
      if (typeof model3D !== 'undefined' && model3D && model3D.initialized) {
        var inf = model3D.renderer.info, el = model3D.renderer.domElement;
        o.scene = { lines: inf.render.lines, triangles: inf.render.triangles, calls: inf.render.calls,
          geometries: inf.memory.geometries, textures: inf.memory.textures, canvas: el.width + '×' + el.height };
      }
    } catch (e) {}
    return o;
  };
  function f1(v) { return v == null ? '?' : (Math.round(v * 10) / 10); }
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [], st = G.status(), sc = st.scene;
    var tot = st.drawn + st.skipped;
    return L.concat(['[GPU] 3D 그리기 ' + st.drawn + '회 / 건너뜀 ' + st.skipped + '회' + (tot ? ' (' + Math.round(st.skipped / tot * 100) + '% 줄임)' : '') +
      (sc ? ' · 장면 선 ' + sc.lines + ' · 삼각형 ' + sc.triangles + ' · 그리기 호출 ' + sc.calls + ' · 그림판 ' + sc.canvas + ' · 지오메트리 ' + sc.geometries + ' · 텍스처 ' + sc.textures : ' · 3D 장면 아직 없음') +
      ' · TF.js GPU ' + f1(st.tfGpuMB) + 'MB · 분석 모델 ' + (st.modelsReleased ? '내려놓음' : '올라와 있음') +
      ' (내림 ' + st.released + ' / 다시 올림 ' + st.reloaded + (st.tfBefore != null ? ' · 내리기 전 ' + f1(st.tfBefore) + ' → 후 ' + f1(st.tfAfter) + 'MB' : '') + ')' +
      (st.lastErr ? ' · ⚠ ' + st.lastErr : '') + (G.on ? '' : ' · 꺼짐')]);
  };

  console.log(TAG + ' 설치 — 3D 안 바뀌면 안 그림(저사양 30fps 상한) · 분석 끝나면 모델 내려놓음. 끄기 GPU_DIET.on=false · 상태 GPU_DIET.status()');
})();
