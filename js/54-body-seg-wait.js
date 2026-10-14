/* ==========================================================================
 * 54-body-seg-wait.js — "사람 윤곽"이 빠진 채로 분석되지 않게 (기다리지 않고, 빠진 것만 나중에 채움)
 *
 * 로드 위치: index.html 맨 끝.
 *
 * 왜 (2026-10-05 · 실측): 같은 손님 사진 4장인데 어떤 때는 뒷머리가 통째로 짧게 나왔습니다("뒷머리 날아갔어").
 *   두 번의 진단을 나란히 놓으니 얼굴 값·섹션 경계·결 신뢰도는 완전히 같은데(같은 사진),
 *     뒤 사진 가닥 길이 22.8 → 11.5cm · 뒤 사진 머리 끝 32.2 → 20.4cm(정수리 아래) · 뿌리밀도 실측 806 → 663칸
 *     [어깨] 사진 인지(정면): 됨 → "못 함(정면 머리 영역/랜드마크 없음)" · TF.js GPU 34.5 → 26MB
 *   로 달랐습니다. 사람 윤곽(personMask)이 빠졌을 때 나오는 모습입니다:
 *     · 사람 윤곽 모델(03a bodySegmenter)은 페이지가 뜰 때 따로 불러옵니다(헤어 모델이 준비된 뒤 시작 · 실패하면 조용히 null).
 *     · 03b extractHairMask는 `if (bodySegmenter)`일 때만 사람 윤곽을 만듭니다 — 아직 안 왔으면 그냥 건너뜁니다.
 *     · 얼굴이 없는 뒤 사진은 "정면과 사람 윤곽을 대조해서"(13a computeSilhouetteAnchors) 카메라를 맞추는데, 사람 윤곽이 없으면
 *       머리 폭만 보는 거친 방식으로 떨어집니다 → 뒤 사진의 배율·중심이 달라져 뒷머리 영역이 줄어듭니다.
 *   즉 네트워크·타이밍에 따라 결과가 갈리는 경합이었습니다(어깨 처리와는 무관).
 *
 * (2026-10-06b) 기다리지 않기 — 사용자: "6초면 오래 걸려서…"
 *   처음 판은 분석을 시작하기 전에 모델을 6초까지 기다렸습니다(그래도 없으면 다시 불러 보며 8초 더).
 *   지금: 분석은 바로 시작합니다. 사람 윤곽은 머리 추출 자체에는 안 쓰이므로(03b 주석: "헤어 추출과 무관"),
 *        모델이 늦게 와서 빠진 사진만 나중에 사람 윤곽을 따로 만들어 채워 넣습니다(03b와 같은 입력·같은 계산).
 *        채우는 때 = 뒤 사진을 분석하기 직전(앞 사진들을 분석하는 몇 초 사이에 모델이 보통 도착함)과 3D를 만들기 직전.
 *        그때도 모델이 없을 때만 waitMs(2초)까지 기다리고, 끝내 없으면 알림을 띄우고 그대로 진행합니다(다음을 위해 뒤에서 다시 불러 둠).
 *   그래서 보통은 추가로 기다리는 시간이 0이고, 채울 것이 있을 때만 사진 한 장에 0.1초쯤 더 걸립니다.
 *   ⚠ 채워 넣는 계산은 분석 모델이 없는 환경에서는 돌려 보지 못했습니다(흐름만 흉내 내서 확인). 진단 [사람 윤곽] 줄에 채운 사진이 찍힙니다.
 *
 * 끄기: BODY_SEG_WAIT.on=false
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[사람 윤곽]';
  var B = W.BODY_SEG_WAIT = Object.assign({ on: true, waitMs: 2000, retry: true }, W.BODY_SEG_WAIT || {});
  var S = B.stats = { waits: 0, waitedMs: 0, retried: 0, filled: [], failed: [], views: {}, warned: false };
  var BASE = ['front', 'left', 'right', 'back'];
  function ready() { try { return !!bodySegmenter; } catch (e) { return false; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function lang() { try { return uiLang === 'ko' ? 'ko' : 'en'; } catch (e) { return 'ko'; } }
  function missing() {
    var out = []; try { BASE.forEach(function (a) { var mi = state.hairMasks && state.hairMasks[a]; if (mi && !mi._x360 && !mi.personMask && state.shots && state.shots[a]) out.push(a); }); } catch (e) {}
    return out;
  }
  /* 사진 한 장의 사람 윤곽(03b extractHairMask와 같은 입력·같은 계산). 실패하면 null */
  B.computeOne = function (angle, mi) {
    return new Promise(function (res) {
      try {
        var src = state.shots[angle], mw = mi.maskW || mi.w, mh = mi.maskH || mi.h;
        if (!src || !(mw > 0) || !(mh > 0) || !ready() || typeof bodySegmentation === 'undefined') { res(null); return; }
        var img = new Image(); img.crossOrigin = 'anonymous';
        img.onerror = function () { res(null); };
        img.onload = function () {
          try {
            var cv = document.createElement('canvas'); cv.width = mw; cv.height = mh;
            cv.getContext('2d').drawImage(img, 0, 0, mw, mh);
            Promise.resolve(bodySegmenter.segmentPeople(cv, { multiSegmentation: false, segmentBodyParts: false })).then(function (segs) {
              if (!segs || !segs.length) { res(null); return null; }
              return bodySegmentation.toBinaryMask(segs, { r: 255, g: 255, b: 255, a: 255 }, { r: 0, g: 0, b: 0, a: 0 }, false, 0.5).then(function (bm) {
                var n = mw * mh, pm = new Uint8Array(n), d = bm.data, i;
                for (i = 0; i < n; i++) pm[i] = d[i * 4 + 3] > 128 ? 1 : 0;
                res(pm);
              });
            }).catch(function (e) { console.warn(TAG + ' ' + angle + ' 사람 윤곽 만들기 실패', e); res(null); });
          } catch (e) { res(null); }
        };
        img.src = src;
      } catch (e) { res(null); }
    });
  };
  /* 모델이 없으면 waitMs까지만 기다림 */
  var gaveUp = false;                     // 이번 분석에서 이미 한 번 기다렸다가 포기했으면 다시 안 기다림
  function waitModel() {
    if (ready()) return Promise.resolve(true);
    if (gaveUp) return Promise.resolve(false);
    var t0 = Date.now();
    try { if (typeof showAI === 'function') showAI(lang() === 'ko' ? '사람 윤곽 모델 준비 중…' : 'Preparing the body outline model…', lang() === 'ko' ? '뒤 사진을 맞추는 데 필요합니다' : 'Needed to align the back photo'); } catch (e) {}
    return (function loop() {
      if (ready()) return Promise.resolve(true);
      if (Date.now() - t0 >= B.waitMs) return Promise.resolve(false);
      return sleep(100).then(loop);
    })().then(function (ok) {
      S.waits++; S.waitedMs = Date.now() - t0;
      if (!ok) gaveUp = true;
      if (!ok && B.retry && typeof initBodySegmenter === 'function' && !S.retried) {      // 다음 분석을 위해 뒤에서 한 번 다시 불러 둠(기다리지 않음)
        S.retried++; try { Promise.resolve(initBodySegmenter()).then(function () {}, function () {}); } catch (e) {}
      }
      console[ok ? 'log' : 'warn'](TAG + ' ' + (ok ? '모델 도착' : '⚠ ' + B.waitMs + 'ms 안에 모델이 안 옴 — 사람 윤곽 없이 진행(뒤 사진 보정이 거친 방식으로 떨어짐)') + ' · 기다린 시간 ' + S.waitedMs + 'ms');
      return ok;
    });
  }
  /* 빠진 사진의 사람 윤곽을 채움. 채울 것이 없으면 바로 끝 */
  var filling = null;
  B.fill = function () {
    if (!B.on) return Promise.resolve(0);
    if (filling) return filling;
    var list = missing();
    if (!list.length) return Promise.resolve(0);
    filling = waitModel().then(function (ok) {
      if (!ok) return 0;
      var i = 0, n = 0;
      function one() {
        if (i >= list.length) return Promise.resolve(n);
        var a = list[i++], mi = state.hairMasks && state.hairMasks[a];
        if (!mi || mi.personMask) return one();
        return Promise.resolve(B.computeOne(a, mi)).then(function (pm) {
          var cur = state.hairMasks && state.hairMasks[a];
          if (pm && cur === mi && !mi.personMask) {
            mi.personMask = pm; n++; S.views[a] = true;
            if (S.filled.indexOf(a) < 0) S.filled.push(a);
            try { if (typeof _silhouetteAnchorCache !== 'undefined' && _silhouetteAnchorCache) delete _silhouetteAnchorCache[a]; } catch (e) {}
          } else if (!pm && S.failed.indexOf(a) < 0) S.failed.push(a);
        }, function () {}).then(one);
      }
      return one();
    }).then(function (n) {
      filling = null;
      if (n) { console.log(TAG + ' 빠졌던 사람 윤곽 ' + n + '장을 채웠습니다(' + S.filled.join(',') + ')'); try { if (typeof _silhouetteAnchorCache !== 'undefined' && _silhouetteAnchorCache) delete _silhouetteAnchorCache.back; } catch (e) {} }
      return n;
    }, function (e) { filling = null; console.warn(TAG + ' 채우기 실패', e); return 0; });
    return filling;
  };
  function warnIfMissing() {
    try {
      var miss = missing();
      if (miss.indexOf('back') >= 0 || miss.indexOf('front') >= 0) {
        if (!S.warned) { S.warned = true; if (typeof showToast === 'function') showToast(lang() === 'ko' ? '사람 윤곽을 읽지 못했어요 — 뒷머리가 짧게 나올 수 있습니다. 새로고침 후 다시 해 주세요.' : 'Could not read the body outline — the back hair may come out short. Please reload and try again.'); }
      } else S.warned = false;
    } catch (e) {}
  }

  var prev = W.extractHairMask;
  if (typeof prev === 'function') W.extractHairMask = function (angle) {
    var self = this, args = arguments;
    function run() { return prev.apply(self, args); }
    function after(r) {
      try { var mi = state.hairMasks && state.hairMasks[angle]; if (mi && !mi._x360 && BASE.indexOf(angle) >= 0) S.views[angle] = !!mi.personMask; } catch (e) {}
      return r;
    }
    if (!B.on) return run();
    if (angle === 'front') { S.filled = []; S.failed = []; gaveUp = false; }
    if (angle !== 'back') return Promise.resolve(run()).then(after);
    // 뒤 사진(4장 중 마지막) 직전: 앞 사진들에서 빠진 것을 채우고(모델이 아직 없으면 여기서만 잠깐 기다림), 뒤 사진은 모델이 온 상태에서 분석
    var pre = (missing().length || !ready()) ? (ready() ? B.fill() : waitModel().then(function () { return B.fill(); })) : Promise.resolve(0);
    return Promise.resolve(pre).then(run, run).then(after).then(function (r) { warnIfMissing(); return r; });
  };
  /* 3D를 만들기 직전에 한 번 더(한 장만 다시 분석한 경우 등) */
  var oBuild = W.buildNeutralHair3D;
  if (typeof oBuild === 'function') W.buildNeutralHair3D = function () {
    var self = this, args = arguments;
    if (!B.on || !missing().length) return oBuild.apply(self, args);
    B.fill().then(function () { warnIfMissing(); oBuild.apply(self, args); }, function () { oBuild.apply(self, args); });
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try {
      var ks = Object.keys(S.views), miss = ks.filter(function (k) { return !S.views[k]; });
      L.push(TAG + ' 모델 ' + (ready() ? '준비됨' : '없음(분석 뒤 내려놓았거나 아직 안 옴)') + ' · 모델을 기다린 횟수 ' + S.waits + '(직전 ' + S.waitedMs + 'ms · 상한 ' + B.waitMs + 'ms)' +
        (S.filled.length ? ' · 나중에 채운 사진 ' + S.filled.join(',') : '') + (S.failed.length ? ' · 채우기 실패 ' + S.failed.join(',') : '') +
        (ks.length ? ' · 사진별 사람 윤곽: ' + ks.map(function (k) { return k + (S.views[k] ? ' ✓' : ' ✗'); }).join(' ') : ' · 아직 분석 전') +
        (miss.length ? '  ⚠ 사람 윤곽이 없는 사진이 있음 — 뒤 사진을 얼굴 없이 맞추는 보정이 거친 방식으로 떨어져 뒷머리가 짧아질 수 있음(새로고침 후 다시)' : ''));
    } catch (e) {}
    return L;
  };
  console.log(TAG + ' 설치 — 분석은 바로 시작하고, 사람 윤곽이 빠진 사진만 나중에 채웁니다(모델이 없을 때만 ' + B.waitMs + 'ms까지 기다림). 끄기 BODY_SEG_WAIT.on=false');
})();
