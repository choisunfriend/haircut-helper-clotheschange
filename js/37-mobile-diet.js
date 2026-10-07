/* ==========================================================================
 * 37-mobile-diet.js — 폰에서 느려지고 꺼지는 문제 (슬라이더 · 누적 · 3D 진입)
 *
 * 로드 위치: index.html 맨 끝(36-gloss-wave.js 다음). 28번·36번 새 버전과 같이 올려야 합니다.
 *
 * ① 슬라이더 — 드래그 중에는 숫자·손잡이만 움직이고, 그림은 손이 멈추거나 뗄 때 그립니다.
 *    막대 값이 바뀔 때마다 조정 화면 전체 렌더(폰에서 0.5초 이상)가 돌아 그동안 손잡이가
 *    손가락을 못 따라왔습니다. 터치 가드(12px·300ms)는 건드리지 않았습니다.
 *    렌더가 충분히 빠른 기기(dragLiveMs 이하)는 예전처럼 드래그 중에도 실시간으로 그립니다.
 *    미니 3D 갱신도 손을 뗄 때 한 번만 합니다.
 *
 * ② 3D 헤어 미리 만들기 — 값이 정해지면(마지막 그림 뒤 preDelayMs) 조정 화면이 한가할 때
 *    3D 결과 화면에 쓸 헤어(광택·웨이브 다듬기 → 다발 뭉치기 → 사진 색 입히기 → 음영)를
 *    조금씩(sliceMs) 끝까지 만들어 둡니다. 3D 결과보기는 그걸 받아서 바로 띄웁니다.
 *    다 못 만든 채 넘어가면 만들던 데서 이어서 마저 만듭니다.
 *    계산식은 원래 함수들과 같고, 방식만 다릅니다: 전체 가닥 복사본(다듬은 것·뭉친 것)과
 *    숫자 배열을 통째로 만들지 않고 가닥 하나씩 최종 버퍼에 바로 씁니다 → 진입 순간 메모리가 훨씬 적습니다.
 *    레게펌(땋기)은 원래 경로 그대로입니다.
 *
 * ③ 누적 막기
 *    · 상태(막대 값)가 바뀌면 예전 상태의 조정 캐시를 그 자리에서 버립니다
 *      (예전: 3벌이 찰 때까지 옛 전체 가닥이 남아 있었음).
 *    · 3D 결과 화면을 나가면 장면(헤어·얼굴·의상)의 GPU 버퍼를 바로 반납합니다
 *      (예전: 다음에 다시 들어올 때까지 잡고 있었음).
 *    · 3D 결과 화면에 들어가면 전체 가닥 기억을 비웁니다(완성본만 있으면 됨 · 조정 화면으로 돌아오면 다시 채움).
 *    · 3D 헤어 색은 8비트로 담고(사진 색이 원래 8비트 — float의 1/4 크기), 버퍼 한 벌을 돌려 씁니다.
 *
 * ④ (2026-10-03c) 3D 진입 때 나눠서 만들기 — 실측(4GB 폰): 미리 만들기가 끝나기 전에 넘어가면
 *    빈 화면으로 2~5초 멈췄습니다(이어서 2087ms · 진입 때 만듦 4713ms). 남은 일을 한 번에 하지 않고
 *    조각(entrySliceMs)으로 나눠 하면서 "3D 헤어 만드는 중… ○○%"를 보여 줍니다. 총 시간은 비슷하지만
 *    화면이 얼지 않습니다. 미리 만들기 시작도 앞당겼습니다(700 → 400ms, 확인 간격 500 → 200ms).
 *    진단 줄에 마지막 헤어 만들기의 단계별 시간(가닥 계산 · 가닥 쓰기 · 음영)이 찍힙니다.
 *
 * ⑤ (2026-10-03d) 3D 결과 화면을 한꺼번에 보여 주기 — 원래 순서가 두상·헤어 → (의상 추천·로딩 0.2~0.8초) 의상
 *    → 얼굴 메쉬라서 머리만 먼저 떠 있다가 옷과 얼굴이 뒤늦게 붙었습니다. 다 붙을 때까지 장면을 숨겼다가
 *    한 번에 보여 줍니다(최대 6초 뒤에는 무조건 보여 줌).
 *
 * 끄기: MOBILE_DIET.on=false (전부) · .entryProgress=false · .showTogether=false · .drag=false · .pre3D=false · .prune=false · .release3D=false · .freeFull=false
 * 상태: MOBILE_DIET.status()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[폰 다이어트]';
  var D = W.MOBILE_DIET = Object.assign({
    on: true,
    drag: true,          // ① 드래그 중 그림 미루기
    dragPauseMs: 140,    //    손이 이만큼 멈추면 그림
    dragLiveMs: 45,      //    직전 렌더가 이보다 빠르면 미루지 않고 실시간
    pre3D: true,         // ② 3D 헤어 미리 만들기
    preDelayMs: 400,     //    마지막 그림 뒤 이만큼 조용하면 시작 (2026-10-03c: 700 → 400)
    prePollMs: 200,      //    가닥 미리계산이 끝났는지 확인하는 간격 (2026-10-03c: 500 → 200)
    sliceMs: 12,         //    한 번에 일하는 시간
    entryProgress: true, // ④ 3D 진입 때 남은 일을 나눠서 하며 진행률 표시
    entrySliceMs: 40,    //    진입 때 한 조각
    showTogether: true,  // ⑤ 3D 장면을 다 붙은 뒤 한꺼번에 보여 주기
    prune: true,         // ③ 옛 상태 캐시 즉시 버림
    release3D: true,     // ③ 3D 화면 나갈 때 장면 반납
    freeFull: true,      // ③ 3D 화면에 들어갈 때 전체 가닥 기억 비움
    lite: true,          // ⑥ (2026-10-04f) 조정 화면의 헤어는 가볍게(사진 색 입히기·코팅·음영 없이)
    bgFull: true,        // ⑥ 조정 화면이 한가할 때 3D 결과 화면용 완성본(전체 가닥·색·음영)을 뒤에서 미리 만듦
    bgDelayMs: 250,      //    조정 화면 헤어가 뜬 뒤 이만큼 조용하면 시작 (2026-10-04g: 500 → 250)
    bgSliceMs: 12        //    한 번에 일하는 시간
  }, W.MOBILE_DIET || {});
  var S = D.stats = { freedFull: 0, bufReuse: 0, deferred: 0, lastRenderMs: 0, pruned: 0, released: 0, preHit: 0, preResume: 0, preCold: 0, preFallback: 0, preBuiltMs: 0, lastBuild: null, lastShow: null };

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function neutral() { try { var m = state.hair3Dneutral; return m && m.strands ? m : null; } catch (e) { return null; } }
  function J(v) { try { return JSON.stringify(v); } catch (e) { return '?'; } }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 슬라이더 드래그 중 그림 미루기
   * ────────────────────────────────────────────────────────────────────── */
  var drag = { el: null, pending: false, timer: null, mini: false };
  function isRange(t) { return !!t && t.tagName === 'INPUT' && t.type === 'range'; }

  var origDraw = W.drawAdjustPreview;
  var origMini = W.scheduleHair3DRefresh;

  function flushDrag() {
    if (drag.timer) { clearTimeout(drag.timer); drag.timer = null; }
    if (!drag.pending) return;
    drag.pending = false;
    try { origDraw(); } catch (e) { console.warn(TAG + ' 그리기 실패', e); }
  }
  function endDrag() {
    if (!drag.el) return;
    drag.el = null;
    flushDrag();
    if (drag.mini) { drag.mini = false; try { origMini(); } catch (e) {} }
  }

  if (typeof origDraw === 'function') {
    W.drawAdjustPreview = function () {
      if (!D.on || !D.drag || !drag.el || !(S.lastRenderMs > D.dragLiveMs)) return origDraw.apply(this, arguments);
      drag.pending = true; S.deferred++;
      if (drag.timer) clearTimeout(drag.timer);
      drag.timer = setTimeout(flushDrag, D.dragPauseMs);
    };
    document.addEventListener('pointerdown', function (e) { if (isRange(e.target)) drag.el = e.target; }, true);
    document.addEventListener('pointerup', endDrag, true);
    document.addEventListener('pointercancel', endDrag, true);
    document.addEventListener('change', function (e) { if (isRange(e.target)) flushDrag(); }, true);
    W.addEventListener('blur', endDrag);
  } else console.warn(TAG + ' drawAdjustPreview 없음 — 슬라이더 고침 건너뜀');

  if (typeof origMini === 'function') {
    W.scheduleHair3DRefresh = function () {
      if (D.on && D.drag && drag.el) { drag.mini = true; return; }   // 미니 3D는 손 뗄 때 한 번
      return origMini.apply(this, arguments);
    };
  }

  var origFrame = W.renderAdjustFrame;
  if (typeof origFrame === 'function') {
    W.renderAdjustFrame = function () {
      var t0 = now();
      try { return origFrame.apply(this, arguments); }
      finally { S.lastRenderMs = now() - t0; schedulePre(); }
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ③-a 옛 상태의 조정 캐시 즉시 버리기
   *   캐시 키 = 상태 서명에 (뷰, 간격)만 끼운 것. 지금 상태와 다른 키는 다시 쓰일 일이 없는데
   *   LRU 3칸이 찰 때까지 남아 있었고, 3D용 전체 가닥(과 거기 딸린 복사본)이 그렇게 남았습니다.
   * ────────────────────────────────────────────────────────────────────── */
  var lastState = null;
  function normKey(k) {
    var p = String(k).split('|');
    if (p.length < 6) return k;
    p[4] = '*'; p[5] = '1.0000';
    return p.join('|');
  }
  function pruneStale(model) {
    var cur;
    try { cur = adjCacheSig(model, null, 1); } catch (e) { return; }
    if (cur === lastState) return;
    lastState = cur;
    if (pre.sig) dropPre();                       // 미리 만든 3D 헤어도 옛 상태 것
    if (bg.sig) dropBg();
    try {
      var dead = [];
      ADJ_CACHE._map.forEach(function (v, k) { if (normKey(k) !== cur) dead.push(k); });
      if (!dead.length) return;
      dead.forEach(function (k) { ADJ_CACHE._map.delete(k); });
      ADJ_CACHE._lru = ADJ_CACHE._lru.filter(function (k) { return ADJ_CACHE._map.has(k); });
      S.pruned += dead.length;
    } catch (e) {}
  }
  var origGeo = W._adjGeometry;
  if (typeof origGeo === 'function' && typeof adjCacheSig === 'function') {
    W._adjGeometry = function () {
      if (D.on && D.prune) { var m = neutral(); if (m) pruneStale(m); }
      return origGeo.apply(this, arguments);
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ③-b 3D 결과 화면을 나갈 때 장면 반납
   *   setupModel3DScreen은 "다음에 들어올 때" 비우므로, 조정 화면에 있는 동안 헤어·얼굴·의상의
   *   GPU 버퍼가 그대로 잡혀 있었습니다. 나갈 때 바로 비웁니다(다시 들어오면 어차피 새로 붙임).
   * ────────────────────────────────────────────────────────────────────── */
  function disposeDeep(root) {
    root.traverse(function (o) {
      try { if (o.geometry) o.geometry.dispose(); } catch (e) {}
      var mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach(function (m) {
        try {
          for (var k in m) { var v = m[k]; if (v && v.isTexture) v.dispose(); }
          m.dispose();
        } catch (e) {}
      });
    });
  }
  function release3D(why) {
    try {
      if (typeof model3D === 'undefined' || !model3D || !model3D.initialized || !model3D.headGroup) return;
      var g = model3D.headGroup, n = 0;
      if (!g.children.length) return;
      try { model3DGeneration++; } catch (e) {}   // 붙이는 중이던 비동기 작업(의상·얼굴)은 버림
      while (g.children.length) { var c = g.children[0]; g.remove(c); disposeDeep(c); n++; }
      // 미리 만든 헤어는 CPU 쪽 버퍼만 들고 있음(다시 들어오면 그대로 붙임). 딸린 것(헤어핀)은 뗌.
      if (pre.obj) while (pre.obj.children.length) pre.obj.remove(pre.obj.children[0]);
      try { model3D.renderer.renderLists.dispose(); } catch (e) {}
      S.released++;
      console.log(TAG + ' 3D 장면 반납 — 객체 ' + n + '개 (' + why + ')');
    } catch (e) { console.warn(TAG + ' 3D 장면 반납 실패', e); }
  }
  var origAct = W.activateScreen;
  if (typeof origAct === 'function') {
    W.activateScreen = function (name) {
      var prev = scr();
      var r = origAct.apply(this, arguments);
      if (D.on && D.release3D && prev === 'model3d' && name !== 'model3d') {
        release3D('3D→' + name);
        // 나가는 순간 아직 만들던 중이었다면 뒤늦게 붙는 것이 있음 — 잠시 뒤 한 번 더
        [1500, 5000].forEach(function (ms) { setTimeout(function () {
          if (scr() === 'model3d') return;
          if (W.ADJUST3D && W.ADJUST3D.on && scr() === 'adjust') return;   // (2026-10-04) 조정 화면이 같은 장면을 쓰는 중
          release3D('뒤늦게 붙은 것');
        }, ms); });
      }
      if (name === 'adjust') schedulePre();
      return r;
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ② 3D 헤어 미리 만들기 (가닥 하나씩 최종 버퍼에 바로 쓰기)
   *
   *   원래 buildAdjustedHair3DObject (+24번 음영)와 같은 순서·같은 식:
   *     computeAdjustedHair3DStrands → [36 다듬기] → clumpStrands3D → bakeStrandColors3D → 선분 → 음영
   *   다른 점은 전체 목록을 단계마다 통째로 복사하지 않는다는 것뿐입니다.
   * ────────────────────────────────────────────────────────────────────── */
  var pre = { sig: null, obj: null, ready: false, job: null, tries: 0 };
  /* 버퍼 한 벌을 돌려 씀 — 값이 바뀔 때마다 수십 MB를 새로 잡았다 버리지 않게 */
  /* (2026-10-04f) 두 벌까지 — 조정 화면용(작은 것)과 3D 결과 화면용(큰 것)이 번갈아 쓰이므로 크기가 맞는 것만 꺼냄 */
  var pools = [];
  function recycle(b) {
    if (!b || !b.pos || !b.col) return;
    for (var i = 0; i < pools.length; i++) if (pools[i].pos === b.pos) return;
    pools.push({ pos: b.pos, col: b.col });
    if (pools.length > 2) {                                           // 가장 큰 것과 가장 작은 것만 남김
      pools.sort(function (x, y) { return x.pos.length - y.pos.length; });
      pools.splice(1, pools.length - 2);
    }
  }
  function takeBufs(need) {
    var best = -1;
    for (var i = 0; i < pools.length; i++) {
      var L = pools[i].pos.length;
      if (L >= need && pools[i].col.length >= need && L <= need * 2.2 && (best < 0 || L < pools[best].pos.length)) best = i;
    }
    if (best >= 0) { var b = pools.splice(best, 1)[0]; S.bufReuse++; return b; }
    for (i = pools.length - 1; i >= 0; i--) if (pools[i].pos.length < need) pools.splice(i, 1);   // 모자란 것은 버림
    var cap = Math.ceil(need * 1.05 / 6) * 6;
    return { pos: new Float32Array(cap), col: new Uint8Array(cap) };
  }
  /* ⑥ (2026-10-04f) 조정 화면은 가볍게 · 완성본은 뒤에서
     사용자: "조정에서 음영이랑 코팅·색 입히기까지는 필요 없다. 조정에 필요한 것만 먼저 그리고, 나머지는 그 뒤 시간에
     계속 계산해서 3D 결과보기 시간도 아끼자."
       · 조정 화면의 헤어(lite) = 고른 가닥만 · 가닥 색 한 가지(가닥마다 밝기만 조금 다르게) · 사진 색 입히기/코팅/음영 없음.
         모양(길이·컬·다발·웨이브 다듬기)은 완성본과 같습니다.
       · 그 헤어가 뜬 뒤 조용하면, 3D 결과 화면용 완성본(전체 가닥 + 사진 색 + 음영)을 뒤에서 조금씩 만듭니다(bg).
         값을 다시 움직이면 버리고 새로 시작. 3D 결과보기를 누르면 다 된 것은 바로 받아 쓰고, 덜 됐으면 이어서 만듭니다. */
  var bg = { sig: null, obj: null, ready: false, job: null };
  var forcing = false, preparing = 0, bgTimer = null, lastTouch = 0;
  try {
    ['pointerdown', 'pointermove', 'touchmove', 'wheel'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { if (ev !== 'pointermove' || (e && e.buttons)) lastTouch = now(); }, { capture: true, passive: true });
    });
  } catch (e) {}
  function isLite() { return D.lite !== false && !!D.externalDriver && !forcing && scr() === 'adjust'; }
  function withFull(fn) {                                             // 조정 화면에 있으면서 "3D 결과 화면이라면"으로 계산
    var SBg = W.STRAND_BUDGET, was = forcing, wasB = SBg ? SBg.forceFull : false;
    forcing = true; if (SBg) SBg.forceFull = true;
    try { return fn(); } finally { forcing = was; if (SBg) SBg.forceFull = wasB; }
  }
  function dropBg() {
    try {
      if (bg.job && bg.job.bufs) recycle(bg.job.bufs);
      var o = bg.obj;
      if (o && !o.parent && o.userData && o.userData._bufs) {
        try { o.geometry.dispose(); } catch (e) {}
        recycle(o.userData._bufs); o.userData._bufs = null;
      }
    } catch (e2) {}
    bg.sig = null; bg.obj = null; bg.ready = false; bg.job = null;
  }
  /* 지금 pre에 든 것이 완성본(또는 만들던 완성본)이면 버리지 않고 bg로 옮김. true = 옮김 */
  function parkPreAsBg() {
    if (pre.lite !== false || !pre.sig) return false;
    if (!(pre.job || (pre.ready && pre.obj && !pre.obj.parent))) return false;
    dropBg();
    bg.sig = pre.sig; bg.obj = pre.ready ? pre.obj : null; bg.ready = !!pre.ready; bg.job = pre.job || null;
    pre.sig = null; pre.obj = null; pre.ready = false; pre.job = null; pre.tries = 0; pre.entryMade = false; pre.lite = null;
    return true;
  }
  /* 뒤에서 만든(만들던) 완성본이 지금 필요한 것이면 pre로 가져옴. true = 가져옴 */
  function adoptBg(sig) {
    if (!bg.sig || bg.sig !== sig || !(bg.ready || bg.job)) return false;
    if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
    if (pre.sig && pre.sig !== sig) dropPre();
    pre.sig = sig; pre.obj = bg.obj; pre.ready = bg.ready; pre.job = bg.job; pre.entryMade = false; pre.lite = false;
    if (bg.ready) S.bgHit = (S.bgHit || 0) + 1; else S.bgResume = (S.bgResume || 0) + 1;
    bg.sig = null; bg.obj = null; bg.ready = false; bg.job = null;
    return true;
  }
  function scheduleBg(delay) {
    if (!D.on || D.bgFull === false || !D.pre3D) return;
    if (bgTimer) clearTimeout(bgTimer);
    bgTimer = setTimeout(bgTick, delay == null ? D.bgDelayMs : delay);
  }
  function bgTick() {
    bgTimer = null;
    if (!D.on || D.bgFull === false || !D.pre3D || !D.externalDriver || scr() !== 'adjust') return;
    if (preparing > 0 || drag.el || drag.pending) return scheduleBg(300);
    if (now() - lastTouch < 250) return scheduleBg(120);              // 손으로 돌리는 중에는 쉼
    var model = neutral();
    if (!model || !canStream()) return;
    var sig;
    try { sig = withFull(function () { return fullSig(model); }); } catch (e) { return; }
    if (bg.sig !== sig) { dropBg(); bg.sig = sig; }
    if (bg.ready) return;
    try {
      withFull(function () {
        if (!bg.job) {
          var Q = W.GYEOL_3D;
          if (Q && typeof Q.warmStep === 'function' && Q.warmStep(D.bgSliceMs) < 1) return;   // 가닥 계산의 남은 부분
          bg.job = new Job(sig, model);
        }
        bg.job.step(D.bgSliceMs);
      });
    } catch (e) { console.warn(TAG + ' 완성본 미리 만들기 중단 — 3D 결과 화면에 들어갈 때 만듭니다', e); dropBg(); return; }
    if (!bg.job || !bg.job.done) return scheduleBg(6);
    var job = bg.job, still = null; bg.job = null;
    try { still = withFull(function () { return fullSig(model); }); } catch (e) {}
    if (still !== sig) {
      try { if (job.obj && job.obj.userData) recycle(job.obj.userData._bufs); } catch (e) {}
      dropBg(); return scheduleBg();
    }
    bg.obj = job.obj; bg.ready = true;
    S.bgBuilt = (S.bgBuilt || 0) + 1;
    S.lastFullBuild = { how: '뒤에서 미리', ms: Math.round(job.ms), calc: Math.round(job.tm[0]), write: Math.round(job.tm[1]), shade: Math.round(job.tm[2]), strands: job.count || 0 };
    try {                                                              // 다 만들었으니 가닥 기억은 비움
      ADJ_CACHE._map.clear(); ADJ_CACHE._lru = [];
      var Q2 = W.GYEOL_3D; if (Q2 && typeof Q2.dropMemo === 'function') { Q2.dropMemo(); S.freedFull++; }
    } catch (e) {}
    console.log(TAG + ' 3D 결과 화면용 완성본을 뒤에서 미리 만듦 — 가닥 ' + (job.count || 0) + '개 · 일한 시간 ' + Math.round(job.ms) + 'ms');
  }
  /* (2026-10-04e) 조정 화면용 헤어 보관 — 3D 결과 화면에 가 있는 동안 조정 화면의 헤어(1만 가닥)를 버리지 않고
     CPU 버퍼만 들고 있다가(화면 메모리는 내림), 돌아오면 다시 만들지 않고 그대로 붙입니다.
     돌아오는 순간 3D 결과 화면용(3만 가닥)은 버퍼까지 버리므로 큰 것 두 벌을 같이 들고 있지 않습니다. */
  var stash = null;
  function stashForReturn() {
    if (D.stash === false || !pre.ready || !pre.obj || pre.job || pre.lite !== true) return;
    releaseStash();
    var o = pre.obj;
    try { if (o.parent) o.parent.remove(o); } catch (e) {}
    try { o.geometry.dispose(); } catch (e) {}                     // 화면(GPU) 쪽만 내림 — 버퍼는 그대로
    stash = { sig: pre.sig, obj: o };
    pre.sig = null; pre.obj = null; pre.ready = false; pre.tries = 0; pre.entryMade = false; pre.lite = null;
    S.stashKept = (S.stashKept || 0) + 1;
  }
  function releaseStash() {
    if (!stash) return;
    try {
      var o = stash.obj;
      if (o && !o.parent) {
        try { o.geometry.dispose(); } catch (e) {}
        try { if (o.material && o.material.dispose) o.material.dispose(); } catch (e) {}
        if (o.userData && o.userData._bufs) { recycle(o.userData._bufs); o.userData._bufs = null; }
      }
    } catch (e2) {}
    stash = null;
  }
  /* 보관해 둔 것이 지금 상태와 같으면 꺼내 씀. true = 꺼내 씀 */
  function takeStash(sig) {
    if (!stash) return false;
    if (stash.sig !== sig) {
      if (scr() === 'adjust') { releaseStash(); S.stashMiss = (S.stashMiss || 0) + 1; }
      return false;
    }
    var o = stash.obj; stash = null;
    if (!parkPreAsBg()) dropPre();                                 // 3D 결과 화면용 완성본은 다시 갈 때 쓰게 둠(화면 메모리는 이미 내림)
    pre.sig = sig; pre.obj = o; pre.ready = true; pre.entryMade = false; pre.lite = true;
    S.stashHit = (S.stashHit || 0) + 1;
    return true;
  }
  function dropPre() {
    try {
      if (pre.job && pre.job.bufs) recycle(pre.job.bufs);
      var o = pre.obj;
      if (o && !o.parent && o.userData && o.userData._bufs) {      // 장면에 안 붙어 있을 때만 버퍼 회수
        try { o.geometry.dispose(); } catch (e) {}
        recycle(o.userData._bufs); o.userData._bufs = null;
      }
    } catch (e2) {}
    pre.sig = null; pre.obj = null; pre.ready = false; pre.job = null; pre.tries = 0; pre.entryMade = false; pre.lite = null;
  }
  /* 3D 결과 화면에 들어가면(헤어 완성본을 붙인 뒤) 그걸 만드는 데 쓴 "전체 가닥" 기억을 비움.
     조정 화면에서는 뷰를 바꿀 때 빨리 그리려고 들고 있지만, 3D 화면에 있는 동안은 쓸 일이 없음. */
  function freeFull(model) {
    if (!D.freeFull) return;
    try {
      var k = adjCacheSig(model, null, 1);
      if (ADJ_CACHE._map.delete(k)) ADJ_CACHE._lru = ADJ_CACHE._lru.filter(function (x) { return x !== k; });
      var Q = W.GYEOL_3D;
      if (Q && typeof Q.dropMemo === 'function') { Q.dropMemo(); S.freedFull++; }
    } catch (e) {}
  }

  function braidOn() { return typeof BRAID !== 'undefined' && BRAID.on && typeof buildBraid3DObject === 'function'; }
  function canStream() {
    if (typeof THREE === 'undefined' || braidOn()) return false;
    if (typeof bakeStrandColors3D !== 'function' || typeof viewOfRoot !== 'function' || typeof HAIR_PIXEL_COLOR === 'undefined') return false;
    var GW = W.GLOSS_WAVE;
    if (GW && typeof GW.strand !== 'function') return false;   // 36번이 옛 버전 — 원래 경로로
    return true;
  }
  function fullSig(model) {
    var a = [adjCacheSig(model, null, 1), typeof adjFilterSig === 'function' ? adjFilterSig() : ''];
    try { a.push(J([HAIR_CLUMP3D.on, HAIR_CLUMP3D.cellCm, HAIR_CLUMP3D.pull, HAIR_CLUMP3D.rampCm, HAIR_CLUMP3D.tailCm])); } catch (e) { a.push('-'); }
    var GW = W.GLOSS_WAVE; a.push(GW && GW.cfg ? J(GW.cfg()) : '-');
    var SB = W.STYLE_BASE; a.push(SB ? J([SB.on, (SB.active && SB.active.shade) || SB.shade]) : '-');
    a.push(J(HAIR_PIXEL_COLOR));
    try { a.push(modelCmPerUnit()); } catch (e) { a.push('-'); }
    try { var E = getHeadEllipsoid(); a.push(E.a + ',' + E.b + ',' + E.c); } catch (e) { a.push('-'); }
    a.push(typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : '-', model.CY, model.yTop, J(model.viewCal));
    a.push(isLite() ? 'lite' : 'full');
    return a.join('\u00a7');
  }

  function b8(v) { return v >= 1 ? 255 : v > 0 ? Math.round(v * 255) : 0; }
  function Job(sig, model) {
    this.sig = sig; this.model = model; this.stage = 0; this.done = false; this.obj = null;
    this.i = 0; this.cur = 0; this.pix = 0; this.ms = 0; this.frac = 0;
    this.tm = [0, 0, 0];   // 단계별 ms: 가닥 계산(init) · 가닥 쓰기(다듬기·뭉치기·색) · 음영
    this.lite = isLite();  // 조정 화면용: 사진 색 입히기·코팅·음영 없이
  }
  Job.prototype.finish = function (obj) { this.obj = obj; this.done = true; this.frac = 1; this.list = this.rep = this.repCache = null; };

  Job.prototype.init = function () {
    var GW = W.GLOSS_WAVE, list;
    if (GW) GW._defer = true;                     // 다듬기는 아래에서 가닥 단위로
    try { list = W.computeAdjustedHair3DStrands(); } finally { if (GW) GW._defer = false; }
    if (!list || !list.length) return this.finish(null);
    this.list = list;
    this.gcfg = GW && GW.cfg && Array.isArray(list) ? GW.cfg() : null;
    if (this.lite && this.gcfg && this.gcfg.shape === false) this.gcfg = null;   // 코팅만 하는 스타일(모양 그대로) — 조정 화면에선 건너뜀
    this.gcpu = this.gcfg ? GW.cpu() : 0;
    var n = list.length, i;

    // 다발: 뿌리가 같은 칸(cellCm)에 든 가닥들 → 칸 중심에 가장 가까운 가닥이 대표
    this.rep = null;
    if (typeof HAIR_CLUMP3D !== 'undefined' && HAIR_CLUMP3D.on && n >= 2 && typeof clumpStrands3D === 'function') {
      var cmu = null;
      try { cmu = typeof modelCmPerUnit === 'function' ? modelCmPerUnit() : null; } catch (e) {}
      if (cmu > 0) {
        var cell = HAIR_CLUMP3D.cellCm / cmu, cells = new Map(), rep = new Int32Array(n).fill(-1);
        this.ramp = HAIR_CLUMP3D.rampCm / cmu; this.tail = HAIR_CLUMP3D.tailCm / cmu;
        this.pull = Math.max(0, Math.min(1, HAIR_CLUMP3D.pull));
        for (i = 0; i < n; i++) {
          var r = list[i] && list[i].pts && list[i].pts[0];
          if (!r || !isFinite(r.x) || !isFinite(r.y) || !isFinite(r.z)) continue;
          var key = Math.floor(r.x / cell) + ',' + Math.floor(r.y / cell) + ',' + Math.floor(r.z / cell);
          var arr = cells.get(key);
          if (!arr) { arr = []; cells.set(key, arr); }
          arr.push(i);
        }
        cells.forEach(function (idx, key) {
          if (idx.length < 2) return;
          var k = key.split(',').map(Number);
          var cx = (k[0] + 0.5) * cell, cy = (k[1] + 0.5) * cell, cz = (k[2] + 0.5) * cell;
          var best = idx[0], bd = Infinity;
          for (var j = 0; j < idx.length; j++) {
            var q = list[idx[j]].pts[0];
            var d = Math.pow(q.x - cx, 2) + Math.pow(q.y - cy, 2) + Math.pow(q.z - cz, 2);
            if (d < bd) { bd = d; best = idx[j]; }
          }
          var rp = list[best].pts;
          if (!rp || rp.length < 2) return;
          for (var m = 0; m < idx.length; m++) rep[idx[m]] = best;
        });
        this.rep = rep; this.repCache = new Map();
      }
    }

    var segs = 0;
    for (i = 0; i < n; i++) { var p = list[i] && list[i].pts; if (p && p.length >= 2) segs += p.length - 1; }
    this.bufs = takeBufs(segs * 6);               // 위치 float32 · 색 8비트(사진 색이 원래 8비트)
    this.pos = this.bufs.pos; this.col = this.bufs.col;
    this.color = new THREE.Color();
    this.stage = 1;
  };

  Job.prototype.gloss = function (i) {
    var sd = this.list[i];
    return this.gcfg ? W.GLOSS_WAVE.strand(sd, this.gcfg, this.gcpu, null) : sd;
  };
  Job.prototype.repOf = function (r) {
    var R = this.repCache.get(r);
    if (!R) {
      var g = this.gloss(r);
      R = { g: g, arc: _clumpArc(g.pts) };
      this.repCache.set(r, R);
    }
    return R;
  };

  Job.prototype.strand = function (i) {
    var sd = this.list[i];
    if (!sd || !sd.pts || sd.pts.length < 2) return;
    var r = this.rep ? this.rep[i] : -1, g, pts;
    if (r === i) g = this.repOf(i).g; else g = this.gloss(i);
    pts = g.pts;
    if (r >= 0 && r !== i) {                      // 대표 가닥 쪽으로 당김
      var R = this.repOf(r), rp = R.g.pts, ra = R.arc, RL = ra[ra.length - 1];
      var a = _clumpArc(pts), np = new Array(pts.length);
      for (var k = 0; k < pts.length; k++) {
        var s = a[k], w = this.pull * Math.min(1, s / (this.ramp || 1e-9));
        if (s > RL) w *= Math.max(0, 1 - (s - RL) / (this.tail || 1e-9));
        if (w <= 0) { np[k] = pts[k]; continue; }
        var c = _clumpAt(rp, ra, Math.min(s, RL)), p = pts[k];
        np[k] = { x: p.x + (c.x - p.x) * w, y: p.y + (c.y - p.y) * w, z: p.z + (c.z - p.z) * w };
      }
      pts = np;
    }
    if (!pts || pts.length < 2) return;

    var cols = null;
    if (!this.lite) {
      var ang = g.srcAngle || (pts[0] ? viewOfRoot(pts[0]) : null);
      cols = HAIR_PIXEL_COLOR.reproject && ang ? bakeStrandColors3D(pts, this.model, ang, g.color, g.colors, g.dye) : (g.colors || null);
    }
    var use = cols && cols.length > 1 ? cols : null;
    if (use) this.pix++;
    var n = pts.length, m = use ? use.length : 0, C = this.color, P = this.pos, K = this.col, o = this.cur;
    if (!use) {
      try { C.set(g.color || '#1a1a1a'); } catch (e0) { C.set('#1a1a1a'); }
      if (this.lite) {                                // 가닥마다 밝기를 조금 다르게 — 한 덩어리로 뭉개져 보이지 않게
        var jf = 0.78 + 0.5 * (((i * 2654435761) >>> 0) / 4294967296);
        C.r *= jf; C.g *= jf; C.b *= jf;
      }
    }
    var ci = 0, lim = use ? Math.round((ci + 1) * (n - 1) / m) : n - 1;
    if (use) try { C.set(use[0]); } catch (e) { C.set(g.color || '#1a1a1a'); }
    for (var q = 1; q < n; q++) {
      if (use) {
        while (ci < m - 1 && q > lim) { ci++; lim = Math.round((ci + 1) * (n - 1) / m); }
        try { C.set(use[ci]); } catch (e2) {}
      }
      var A = pts[q - 1], B = pts[q];
      if (!isFinite(A.x) || !isFinite(A.y) || !isFinite(A.z)) continue;
      if (!isFinite(B.x) || !isFinite(B.y) || !isFinite(B.z)) continue;
      P[o] = A.x; P[o + 1] = A.y; P[o + 2] = A.z; P[o + 3] = B.x; P[o + 4] = B.y; P[o + 5] = B.z;
      K[o] = K[o + 3] = b8(C.r); K[o + 1] = K[o + 4] = b8(C.g); K[o + 2] = K[o + 5] = b8(C.b);
      o += 6;
    }
    this.cur = o;
  };

  Job.prototype.makeObject = function () {
    this.count = this.list.length;
    this.list = this.rep = this.repCache = null;
    if (!this.cur) { recycle(this.bufs); this.bufs = null; return this.finish(null); }
    this.pos = this.pos.subarray(0, this.cur); this.col = this.col.subarray(0, this.cur);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3, true));
    var obj = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true }));
    obj.name = 'adjustedHair';
    obj.userData._bufs = this.bufs; this.bufs = null;
    this.obj = obj;
    if (this.lite) return this.finish(obj);          // 조정 화면용은 음영 없음

    // 음영(24번 shadeHairObject와 같은 식 — 색 버퍼에 바로 덮어씀)
    var SB = W.STYLE_BASE, sh = SB && SB.on && ((SB.active && SB.active.shade) || SB.shade);
    var n = this.pos.length / 3, E = null;
    if (sh && typeof SB._shade === 'function' && n >= 4) { try { E = getHeadEllipsoid(); } catch (e) { E = null; } }
    if (!E) return this.finish(obj);
    this.sh = sh; this.E = E; this.n = n;
    this.cy = typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15;
    this.rho = new Float32Array(n); this.bin = new Uint16Array(n); this.bmax = new Float32Array(36 * 18);
    this.i = 0; this.stage = 3;
  };

  Job.prototype.shadeA = function (end) {          // 방향 칸마다 가장 바깥 반지름
    var P = this.pos, E = this.E, cy = this.cy, rho = this.rho, bin = this.bin, bmax = this.bmax, NT = 36, NP = 18;
    for (var i = this.i; i < end; i++) {
      var dx = P[i * 3] / E.a, dy = (P[i * 3 + 1] - cy) / E.b, dz = P[i * 3 + 2] / E.c;
      var r = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      var th = Math.atan2(dx, dz), ph = Math.acos(Math.max(-1, Math.min(1, dy / r)));
      var bi = Math.min(NP - 1, (ph / Math.PI * NP) | 0) * NT + Math.min(NT - 1, ((th + Math.PI) / (2 * Math.PI) * NT) | 0);
      rho[i] = r; bin[i] = bi; if (r > bmax[bi]) bmax[bi] = r;
    }
    this.i = end;
  };
  Job.prototype.shadeCap = function () {           // 밝기 중앙값 → 상한
    var K = this.col, n = this.n, L = new Float64Array(Math.ceil(n / 7)), c = 0;
    for (var j = 0; j < n; j += 7) L[c++] = (0.299 * K[j * 3] + 0.587 * K[j * 3 + 1] + 0.114 * K[j * 3 + 2]) / 255;
    L.sort();
    this.cap = (L[L.length >> 1] || 0.2) * this.sh.lumCap;
    var Lt = [0.3, 0.8, 0.5], V = [0, 0, 1], H = [Lt[0] + V[0], Lt[1] + V[1], Lt[2] + V[2]];
    var hl = Math.hypot(H[0], H[1], H[2]);
    this.H = [H[0] / hl, H[1] / hl, H[2] / hl];
    this.i = 0; this.stage = 5;
  };
  Job.prototype.shadeB = function (end) {          // 안쪽 가닥 어둡게 · 밝기 상한 · 결 하이라이트
    var P = this.pos, K = this.col, sh = this.sh, H = this.H, cap = this.cap, rho = this.rho, bin = this.bin, bmax = this.bmax;
    for (var s = this.i; s + 1 < end; s += 2) {
      var tx = P[s * 3 + 3] - P[s * 3], ty = P[s * 3 + 4] - P[s * 3 + 1], tz = P[s * 3 + 5] - P[s * 3 + 2];
      var tl = Math.hypot(tx, ty, tz) || 1e-9;
      var th2 = (tx * H[0] + ty * H[1] + tz * H[2]) / tl;
      var kk = Math.pow(Math.sqrt(Math.max(0, 1 - th2 * th2)), sh.specPow);
      for (var q = s; q < s + 2; q++) {
        var bm = bmax[bin[q]], d = bm > 1.02 ? Math.max(0, Math.min(1, (rho[q] - 1) / (bm - 1))) : 1;
        var ao = sh.ao + (1 - sh.ao) * Math.pow(d, 0.8);
        var rr = K[q * 3] / 255, gg = K[q * 3 + 1] / 255, bb = K[q * 3 + 2] / 255;
        var lum = 0.299 * rr + 0.587 * gg + 0.114 * bb;
        if (lum > cap && lum > 0) { var f = cap / lum; rr *= f; gg *= f; bb *= f; }
        var sp = kk * sh.spec * d * d;
        K[q * 3] = b8(rr * ao + sp * 0.85);
        K[q * 3 + 1] = b8(gg * ao + sp * 0.8);
        K[q * 3 + 2] = b8(bb * ao + sp * 0.72);
      }
    }
    this.i = end;
  };

  // budget(ms) 동안만 일하고 돌아옴. Infinity면 끝까지.
  Job.prototype.step = function (budget) {
    var t0 = now(), n, end, s0, g;
    while (!this.done) {
      s0 = now(); g = this.stage === 0 ? 0 : this.stage <= 2 ? 1 : 2;
      if (this.stage === 0) this.init();
      else if (this.stage === 1) {
        n = this.list.length; end = Math.min(n, this.i + 4);
        for (; this.i < end; this.i++) this.strand(this.i);
        this.frac = 0.85 * this.i / n;
        if (this.i >= n) this.stage = 2;
      }
      else if (this.stage === 2) this.makeObject();
      else if (this.stage === 3) {
        this.shadeA(Math.min(this.n, this.i + 8000));
        this.frac = 0.85 + 0.05 * this.i / this.n;
        if (this.i >= this.n) this.stage = 4;
      }
      else if (this.stage === 4) this.shadeCap();
      else if (this.stage === 5) {
        end = Math.min(this.n, this.i + 6000);      // 짝수 유지(선분 = 정점 2개)
        this.shadeB(end);
        this.frac = 0.9 + 0.1 * this.i / this.n;
        if (this.i >= this.n) { this.obj.geometry.attributes.color.needsUpdate = true; this.rho = this.bin = this.bmax = null; this.finish(this.obj); }
      }
      this.tm[g] += now() - s0;
      if (now() - t0 >= budget) break;
    }
    this.ms += now() - t0;
  };
  D._Job = Job;   // 점검용

  /* 조정 화면이 한가할 때 조금씩 */
  var preTimer = null;
  function schedulePre(delay, cont) {
    if (!D.on || !D.pre3D) return;
    if (D.externalDriver) return;                 // (2026-10-04) 43번(조정 화면 3D)이 직접 만들기를 몰 때는 배경 작업을 안 돌림
    if (preTimer) clearTimeout(preTimer);
    preTimer = setTimeout(function () { preTick(cont); }, delay == null ? D.preDelayMs : delay);
  }
  function preTick(cont) {
    preTimer = null;
    if (!D.on || !D.pre3D || scr() !== 'adjust') return;
    if (drag.el || drag.pending) return schedulePre(300);
    var model = neutral();
    if (!model || !canStream()) return;
    var sig;
    if (cont && pre.job && pre.job.model === model) sig = pre.job.sig;   // 이어 하는 조각 — 서명은 끝날 때 다시 확인
    else {
      try { sig = fullSig(model); } catch (e) { return; }
      if (pre.sig !== sig) { dropPre(); pre.sig = sig; }
    }
    if (pre.ready) return;
    if (!pre.job) {
      var Q = W.GYEOL_3D;
      if (!Q || typeof Q.warmReady !== 'function') return;          // 28번이 옛 버전 — 진입 때 만듦
      if (!Q.warmReady()) {                                           // 가닥 미리계산이 끝나길 기다림
        if (pre.tries === 0 && Q.scheduleWarm) Q.scheduleWarm();
        if (++pre.tries < 600) schedulePre(D.prePollMs || 500);
        return;
      }
      pre.job = new Job(sig, model);
    }
    try { pre.job.step(D.sliceMs); }
    catch (e) { console.warn(TAG + ' 3D 미리 만들기 중단 — 진입 때 원래 방식으로 만듭니다', e); dropPre(); return; }
    if (!pre.job.done) return schedulePre(0, true);
    var job = pre.job; pre.job = null;
    var still = null;
    try { still = fullSig(model); } catch (e) {}
    if (still !== sig) {                                             // 만드는 사이 값이 바뀜
      try { if (job.obj) recycle(job.obj.userData._bufs); } catch (e) {}
      dropPre(); return schedulePre();
    }
    pre.obj = job.obj; pre.ready = true; pre.lite = !!job.lite; S.preBuiltMs = job.ms; noteBuild(job, '미리');
    console.log(TAG + ' 3D 헤어 미리 만들기 끝 — 가닥 ' + (job.count || 0) + '개 · 선분 ' + (job.obj ? job.pos.length / 6 : 0) +
      '개 · 일한 시간 ' + Math.round(job.ms) + 'ms (조금씩 나눠서) · 3D 결과보기는 이걸 받아 씁니다');
  }

  function noteBuild(job, how) {
    if (!job.lite) S.lastFullBuild = { how: how, ms: Math.round(job.ms), calc: Math.round(job.tm[0]), write: Math.round(job.tm[1]), shade: Math.round(job.tm[2]), strands: job.count || 0 };
    S.lastBuild = { how: how, ms: Math.round(job.ms), calc: Math.round(job.tm[0]), write: Math.round(job.tm[1]), shade: Math.round(job.tm[2]), strands: job.count || 0 };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ④ 3D 진입 때 남은 일을 나눠서 하기 (진행률 표시)
   *   순서: 가닥 미리계산의 남은 부분(28번 warmStep) → 헤어 만들기 Job의 남은 부분.
   *   둘 다 조정 화면에서 하던 일을 그대로 이어서 하는 것이라 결과는 같습니다.
   *   돌려주는 값(Promise): true = 헤어가 준비됨 · false = 못 함(원래 경로가 진입 때 만듦)
   * ────────────────────────────────────────────────────────────────────── */
  D.prepare3D = function (onProg) {
    return new Promise(function (res0) {
      preparing++;
      if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
      var settled = false;
      function res(v) { if (settled) return; settled = true; preparing = Math.max(0, preparing - 1); res0(v); }
      var model, sig, Q = W.GYEOL_3D;
      try {
        if (!D.on || !D.pre3D || !canStream()) return res(false);
        model = neutral(); if (!model) return res(false);
        // (2026-10-04) 값이 바뀐 뒤 처음이면 "옛 상태 정리"를 여기서 먼저 끝냄. 예전에는 2D 그리기가 먼저 돌면서
        // 해 줬는데, 조정 화면이 3D가 되면서(43번) 2D 그리기가 없어져 만들던 것이 중간에 버려졌음.
        if (D.prune) pruneStale(model);
        sig = fullSig(model);
      } catch (e) { return res(false); }
      if (pre.sig === sig && pre.ready) return res(true);
      try { if (adoptBg(sig) && pre.ready) return res(true); } catch (e) {}   // (2026-10-04f) 뒤에서 미리 만든 완성본(덜 됐으면 아래에서 이어서)
      try { if (takeStash(sig)) return res(true); } catch (e) {}      // (2026-10-04e) 3D 결과 화면에 가기 전에 보관해 둔 헤어
      if (pre.sig !== sig) { if (!parkPreAsBg()) dropPre(); pre.sig = sig; }
      if (preTimer) { clearTimeout(preTimer); preTimer = null; }
      var job = pre.job, phaseA = !job && Q && typeof Q.warmStep === 'function';
      if (job) S.preResume++; else S.preCold++;
      var slice = D.entrySliceMs || 40;
      function prog(f) { if (onProg) try { onProg(f); } catch (e) {} }
      function tick() {
        try {
          if (pre.sig !== sig) return res(false);                       // 그 사이 다른 쪽에서 버림
          if (phaseA) {                                                 // 가닥 계산의 남은 부분
            var f = Q.warmStep(slice);
            if (f < 1) { prog(0.45 * f); return setTimeout(tick, 0); }
            phaseA = false;
          }
          if (!job) { job = pre.job || new Job(sig, model); pre.job = job; }
          if (pre.job !== job) return res(false);
          job.step(slice);
          prog(0.45 + 0.55 * job.frac);
          if (!job.done) return setTimeout(tick, 0);
          pre.job = null; pre.obj = job.obj; pre.ready = true; pre.entryMade = true; pre.lite = !!job.lite;
          S.preBuiltMs = job.ms; noteBuild(job, job.lite ? '조정 화면(가볍게)' : '진입(나눠서)');
          res(true);
        } catch (e) {
          console.warn(TAG + ' 진입 때 나눠서 만들기 중단 — 원래 방식으로 만듭니다', e);
          dropPre(); res(false);
        }
      }
      tick();
    });
  };

  var origSetup = W.setupModel3DScreen, setupGen = 0;
  /* ⑤ 얼굴(메쉬 또는 사진 데칼)은 setupModel3DScreen이 끝난 뒤에 따로 붙으므로, 그 약속을 잡아 둠 */
  var faceP = null, decalP = null;
  ['buildRealFaceMesh', 'buildFacePhotoDecal'].forEach(function (name, idx) {
    var f = W[name];
    if (typeof f !== 'function') return;
    W[name] = function () {
      var r = f.apply(this, arguments);
      if (idx === 0) { faceP = r; decalP = null; } else decalP = r;
      return r;
    };
  });
  /* 돌려주는 Promise는 장면이 실제로 보이는 순간에 풀립니다(38번의 "걸린 시간"이 보일 때까지의 시간이 되도록). */
  function runSetup(self, args, gen, onShown) {
    faceP = decalP = null;
    var t0 = now(), p = origSetup.apply(self, args), g = null;
    function finish() { if (onShown) try { onShown(); } catch (e) {} }
    try { g = D.showTogether && typeof model3D !== 'undefined' && model3D && model3D.initialized ? model3D.headGroup : null; } catch (e) { g = null; }
    if (!g) { Promise.resolve(p).then(finish, finish); return p; }
    g.visible = false;                                                   // 첫 프레임이 그려지기 전(같은 작업 안)
    return new Promise(function (res, rej) {
      var done = false, tSetup = null;
      function show(byGuard) {
        if (done) return; done = true; clearTimeout(guard); g.visible = true;
        S.lastShow = { setupMs: tSetup == null ? null : Math.round(tSetup), shownMs: Math.round(now() - t0), guard: !!byGuard };
        finish(); res();
      }
      var guard = setTimeout(function () { show(true); }, 6000);
      function settle(x) { return x && typeof x.then === 'function' ? x.then(function () {}, function () {}) : Promise.resolve(); }
      Promise.resolve(p).then(function () {
        tSetup = now() - t0;
        settle(faceP).then(function () { return settle(decalP); }).then(function () { setTimeout(function () { show(false); }, 0); });
      }, function (e) { show(false); rej(e); });
    });
  }
  if (typeof origSetup === 'function') {
    W.setupModel3DScreen = function () {
      var self = this, args = arguments, gen = ++setupGen;
      if (!D.on) return origSetup.apply(self, args);
      if (!D.pre3D || !D.entryProgress || !neutral()) return runSetup(self, args, gen);
      try {
        var sigNow = fullSig(neutral());
        if (pre.sig !== sigNow) {
          try { stashForReturn(); } catch (e1) {}                        // (2026-10-04e) 조정 화면의 헤어는 돌아올 때 쓰게 보관
          try { adoptBg(sigNow); } catch (e2) {}                         // (2026-10-04f) 뒤에서 미리 만든 완성본
        }
        if (pre.ready && pre.sig === sigNow) return runSetup(self, args, gen);
      } catch (e) { return runSetup(self, args, gen); }
      var shown = false, sub = null, lastPct = -1;
      try {
        if (typeof showAI === 'function') { showAI('3D 헤어 만드는 중…', '0%'); shown = true; sub = document.getElementById('aiOverlaySub'); }
      } catch (e) {}
      function hide() { if (shown) { shown = false; try { hideAI(); } catch (e) {} } }
      function go() {
        if (gen !== setupGen || scr() !== 'model3d') { hide(); return; }  // 그 사이 나갔거나 다시 들어옴
        if (sub) sub.textContent = '의상·얼굴 붙이는 중…';
        try { return runSetup(self, args, gen, hide); } catch (e) { hide(); throw e; }
      }
      return new Promise(function (r) {                                  // 안내를 먼저 그리고 시작
        var raf = W.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
        raf(function () { setTimeout(r, 0); });
      }).then(function () {
        return D.prepare3D(function (f) {
          var pct = Math.round(f * 100);
          if (sub && pct !== lastPct) { lastPct = pct; sub.textContent = pct + '%'; }
        });
      }).then(go, go);
    };
  }

  var origBuild = W.buildAdjustedHair3DObject;
  if (typeof origBuild === 'function') {
    W.buildAdjustedHair3DObject = function () {
      if (!D.on || !D.pre3D || !canStream()) return origBuild.apply(this, arguments);
      var model = neutral();
      if (!model) return origBuild.apply(this, arguments);
      try {
        var sig = fullSig(model), t0 = now(), how;
        if (pre.sig === sig && pre.ready) {
          if (pre.entryMade) how = '진입 때 나눠서 만든 것'; else { S.preHit++; how = '미리 만든 것 받아 씀'; }
          pre.entryMade = false;
        }
        else {
          if (pre.sig !== sig) { dropPre(); pre.sig = sig; }
          var job = pre.job;
          if (job) { S.preResume++; how = '만들던 데서 이어서(' + Math.round(job.frac * 100) + '%부터)'; }
          else { job = new Job(sig, model); S.preCold++; how = '지금 만듦'; }
          pre.job = null;
          job.step(Infinity);
          pre.obj = job.obj; pre.ready = true; pre.lite = !!job.lite; noteBuild(job, job.lite ? '조정 화면(한 번에)' : '진입(한 번에)');
        }
        if (isLite() && D.bgFull !== false) scheduleBg();   // 조정 화면: 가닥 기억을 그대로 두고, 조용해지면 완성본을 뒤에서 만듦
        else freeFull(model);   // 3D 화면에 있는 동안은 전체 가닥 기억이 필요 없음(조정 화면으로 돌아오면 28번이 다시 채움)
        console.log(TAG + ' 3D 헤어 — ' + how + ' · ' + Math.round(now() - t0) + 'ms');
        return pre.obj;
      } catch (e) {
        console.warn(TAG + ' 3D 헤어 새 방식 실패 — 원래 방식으로 만듭니다', e);
        dropPre(); S.preFallback++;
        return origBuild.apply(this, arguments);
      }
    };
  }

  /* (2026-10-04) 장면에서 뗀 헤어 객체의 버퍼를 돌려받음 — 43번이 값이 바뀔 때마다 헤어를 갈아 끼우면서 부름 */
  D.recycleObject = function (o) {
    try {
      if (!o || o.parent) return;
      try { o.geometry.dispose(); } catch (e) {}
      try { if (o.material && o.material.dispose) o.material.dispose(); } catch (e) {}
      if (o.userData && o.userData._bufs && o !== pre.obj && o !== bg.obj && !(stash && o === stash.obj)) { recycle(o.userData._bufs); o.userData._bufs = null; }
    } catch (e2) {}
  };

  /* ── 상태 ─────────────────────────────────────────────────────────────── */
  function preLine() {
    if (!D.pre3D) return '꺼짐';
    if (braidOn()) return '레게펌 — 원래 경로';
    if (pre.ready) return '준비됨';
    if (pre.job) return '만드는 중 ' + Math.round(pre.job.frac * 100) + '%';
    return '대기';
  }
  D.status = function () {
    return { drag: { deferred: S.deferred, lastRenderMs: Math.round(S.lastRenderMs), live: !(S.lastRenderMs > D.dragLiveMs) },
      pruned: S.pruned, released3D: S.released,
      pre3D: { state: preLine(), hit: S.preHit, resumed: S.preResume, cold: S.preCold, fallback: S.preFallback, builtMs: Math.round(S.preBuiltMs), last: S.lastBuild } };
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    return L.concat(['[폰 다이어트] 드래그 중 미룬 그림 ' + S.deferred + '회(직전 렌더 ' + Math.round(S.lastRenderMs) + 'ms) · 옛 캐시 버림 ' + S.pruned +
      '벌 · 전체 가닥 기억 비움 ' + S.freedFull + '회 · 버퍼 재사용 ' + S.bufReuse + '회 · 3D 장면 반납 ' + S.released + '회 · 3D 미리 만들기: ' + preLine() + ' (받아 씀 ' + S.preHit + ' / 이어서 ' + S.preResume +
      ' / 진입 때 만듦 ' + S.preCold + ' / 원래 방식 ' + S.preFallback + ')' +
      (S.lastBuild ? ' · 마지막 헤어 만들기[' + S.lastBuild.how + '] ' + S.lastBuild.ms + 'ms = 가닥 계산 ' + S.lastBuild.calc + ' + 가닥 쓰기 ' + S.lastBuild.write + ' + 음영 ' + S.lastBuild.shade + ' (가닥 ' + S.lastBuild.strands + '개)' : '') +
      ' · 완성본 뒤에서 만들기: ' + (D.bgFull === false ? '꺼짐' : bg.ready ? '준비됨' : bg.job ? '만드는 중 ' + Math.round(bg.job.frac * 100) + '%' : '대기') +
      ' (다 만듦 ' + (S.bgBuilt || 0) + ' / 3D 진입 때 받아 씀 ' + (S.bgHit || 0) + ' / 이어서 ' + (S.bgResume || 0) + ')' +
      (S.lastFullBuild ? ' · 마지막 완성본[' + S.lastFullBuild.how + '] ' + S.lastFullBuild.ms + 'ms = 가닥 계산 ' + S.lastFullBuild.calc + ' + 가닥 쓰기 ' + S.lastFullBuild.write + ' + 음영 ' + S.lastFullBuild.shade + ' (가닥 ' + S.lastFullBuild.strands + '개)' : '') +
      ' · 조정 화면 헤어 보관: ' + (stash ? '보관 중' : '없음') + ' (보관 ' + (S.stashKept || 0) + ' / 돌아와서 받아 씀 ' + (S.stashHit || 0) + ' / 상태가 달라 못 씀 ' + (S.stashMiss || 0) + ')' +
      (S.lastShow ? ' · 3D 장면 붙이기 ' + S.lastShow.setupMs + 'ms → 한꺼번에 보임 ' + S.lastShow.shownMs + 'ms' + (S.lastShow.guard ? ' ⚠ 6초 안전장치로 보임(얼굴 붙기를 못 기다림)' : '') : '')]);
  };

  console.log(TAG + ' 설치 — 드래그 중 그림 미루기 · 옛 캐시 즉시 버림 · 3D 나갈 때 장면 반납 · 3D 헤어 미리 만들기. 끄기 MOBILE_DIET.on=false · 상태 MOBILE_DIET.status()');
})();
