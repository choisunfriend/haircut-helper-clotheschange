/* ==========================================================================
 * 41-original-asis.js — 원본 결 → 3D 옮기기 1단계: "원본 3D 그대로" 보기 + 옮겨진 가닥 재기
 *
 * 로드 위치: index.html 맨 끝(40-gpu-diet.js 다음).
 *
 * 왜: 마네킹 초기화를 끄면 사진에서 뜬 가닥이 3D에서 뻗치고 덥수룩해집니다(2026-10-03 노트북 영상:
 *     옆을 짧게 친 남자 머리가 3D에서는 귀를 덮는 곱슬 더벅머리 + 삐죽 솟은 가닥).
 *     원인 후보가 둘이라 먼저 갈라야 합니다.
 *       (가) 조정 엔진이 사진 가닥을 바꿈 — 마네킹을 꺼도 섹션 기본값이 그대로 걸립니다.
 *            · 컬 기본값 30 → 컬 + 처짐
 *            · 커트 엔진(CUT3D)이 섹션마다 가이드 길이로 다시 자름 → 가이드보다 짧은 가닥은
 *              끝 방향으로 곧게 "늘림"(lengthStrand3D의 ratio>1 분기, 최대 1.8배) → 삐죽한 가시
 *       (나) 들어올린 가닥 자체가 3D에서 어긋남 — 4면의 결 방향이 서로 안 맞음
 *
 * ① [원본 3D 그대로] 버튼 — 켜면 사진 가닥에는 조정 엔진을 통째로 건너뜁니다(adjustStrandGeom이
 *    가닥을 손대지 않고 돌려줌). 마네킹은 자동으로 꺼집니다. 2D·미니 3D·3D 결과 화면에 전부 걸립니다.
 *    이 상태에서 보이는 것이 "들어올린 가닥 그 자체"입니다. 켜도 뻗치면 (나), 깨끗해지면 (가).
 *    사진 영역 밖 다듬기(세그다듬기)와 빗질은 그대로 둡니다.
 *
 * ② 진단 줄 [원본 옮기기] — 사진 뷰별로
 *      가닥 수 · 길이 · 끝이 머리(타원체) 밖으로 나간 정도 · 가시 가닥 비율
 *      (가시 = 끝이 머리 반지름의 1.25배 밖 + 끝 방향이 바깥을 향함)
 *    과, 조정 엔진이 가닥 길이를 얼마나 바꾸는지(조정 후 길이 ÷ 원본 길이)를 섹션별로 찍습니다.
 *
 * ③ (2026-10-03b) [옮기기 실험] 버튼 — "원본 3D 그대로"를 켜도 뻗쳤습니다(노트북 영상). 즉 들어올리는 단계 자체의 문제.
 *    콘솔 기록에 용의자가 둘 찍혀 있습니다.
 *      · 결정렬: "필드↔가닥 각차 평균 78.7° … 150~180°에 몰림 = 극성 문제" · 스텝 64,860개 중 24,527개를 되돌림
 *        (4면의 결을 합친 방향장이 가닥 끝 방향을 반대로 알고 있는 자리가 많다는 뜻 — 그 방향으로 가닥을 꺾으면 지그재그·가시)
 *      · 채움: 가닥 10,869 → 25,099개(+131%) — 절반 넘는 가닥이 이웃을 복제해 옮겨 심은 것
 *    이 둘을 하나씩 끄고 모델을 다시 만들어, 가시·꺾임·길이가 어떻게 달라지는지 표로 찍습니다.
 *    끝나면 원래 설정으로 되돌려 다시 만듭니다. (마네킹은 꺼집니다)
 *
 * 끄기: ORIG_ASIS.on=false 후 ORIG_ASIS.refresh() · 버튼은 기본 숨김(2026-10-04) — 다시 보이려면 ORIG_ASIS.button=true (새로고침)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[원본 그대로]';
  var O = W.ORIG_ASIS = Object.assign({ on: false, button: false /* 2026-10-04: 버튼 없앰(사용자 요청) — 콘솔 ORIG_ASIS.toggle()은 그대로 */, spikeR: 1.25, spikeCos: 0.5, sample: 1500 }, W.ORIG_ASIS || {});

  var innerAdj = W.adjustStrandGeom;
  if (typeof innerAdj !== 'function') { console.warn(TAG + ' adjustStrandGeom이 없어 건너뜀'); return; }

  /* ① 사진 가닥은 손대지 않고 돌려줌 */
  W.adjustStrandGeom = function (s) {
    if (O.on && s && !s.mannequin && s.pts) return s.pts;
    return innerAdj.apply(this, arguments);
  };

  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof combRefresh === 'function') combRefresh(); else if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) { console.warn(TAG + ' 다시 그리기 실패', e); }
  }
  var btn = null;
  function syncBtn() {
    if (!btn) return;
    btn.textContent = '원본 3D 그대로 ' + (O.on ? 'ON' : 'OFF');
    btn.classList.toggle('on', !!O.on);
  }
  O.refresh = function () { syncBtn(); redraw(); };
  O.toggle = function () {
    O.on = !O.on;
    try {
      if (O.on && typeof MANNEQUIN !== 'undefined' && MANNEQUIN.on && typeof toggleMannequin === 'function') toggleMannequin();   // 마네킹 끔
    } catch (e) {}
    console.log(TAG + ' ' + (O.on ? '켬 — 사진 가닥에 조정 엔진을 걸지 않음' : '끔 — 조정 엔진 다시 적용'));
    O.refresh();
  };
  // 마네킹을 다시 켜면 이 모드는 의미가 없으므로 같이 끔
  var origMq = W.mannequinReset;
  if (typeof origMq === 'function') W.mannequinReset = function () {
    if (O.on) { O.on = false; syncBtn(); try { ADJ_CACHE.bump(); } catch (e) {} }
    return origMq.apply(this, arguments);
  };

  if (O.button) try {
    var bar = document.querySelector('#screen-adjust .mode-bar'), mq = document.getElementById('mannequinBtn');
    if (bar) {
      btn = document.createElement('button');
      btn.id = 'origAsIsBtn'; btn.type = 'button';
      if (mq && mq.className) btn.className = mq.className;
      btn.title = '사진에서 뜬 가닥을 조정 없이 그대로 3D로 봅니다 (마네킹은 꺼집니다)';
      btn.addEventListener('click', function () { O.toggle(); });
      bar.appendChild(btn);
      syncBtn();
    }
  } catch (e) { console.warn(TAG + ' 버튼 만들기 실패', e); }

  /* ────────────────────────────────────────────────────────────────────────
   * ② 재기
   * ────────────────────────────────────────────────────────────────────── */
  function arc(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); return L; }
  function q(a, f) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * f))]; }
  function n2(v) { return isFinite(v) ? (Math.round(v * 100) / 100).toFixed(2) : '?'; }
  function n1(v) { return isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '?'; }

  O.measure = function () {
    var m = state.hair3Dneutral;
    if (!m || !m.strands || !m.strands.length) return null;
    var E = null, cy = m.CY || 0, cm = 1;
    try { E = getHeadEllipsoid(); } catch (e) {}
    try { cm = modelCmPerUnit() || 1; } catch (e) {}
    if (!E) return null;
    var step = Math.max(1, m.strands.length / O.sample), byView = {}, bySec = {}, acc = 0, i, s;
    function R(p) { var x = p.x / E.a, y = (p.y - cy) / E.b, z = p.z / E.c; return Math.sqrt(x * x + y * y + z * z); }
    var keepOn = O.on; O.on = false;                       // 조정 엔진이 바꾸는 양을 재려면 잠깐 원래대로
    try {
      for (i = 0; i < m.strands.length; i++) {
        acc += 1 / step; if (acc < 1) continue; acc -= 1;
        s = m.strands[i];
        var p = s.pts; if (!p || p.length < 2) continue;
        var v = byView[s.srcAngle || '?'] || (byView[s.srcAngle || '?'] = { n: 0, len: [], tipR: [], rootR: [], spike: 0, up: 0 });
        var tip = p[p.length - 1], prev = p[p.length - 2], L = arc(p), rt = R(tip);
        // 끝 방향이 바깥(타원체 법선)을 향하는 정도
        var nx = tip.x / (E.a * E.a), ny = (tip.y - cy) / (E.b * E.b), nz = tip.z / (E.c * E.c), nl = Math.hypot(nx, ny, nz) || 1;
        var dx = tip.x - prev.x, dy = tip.y - prev.y, dz = tip.z - prev.z, dl = Math.hypot(dx, dy, dz) || 1;
        var out = (dx * nx + dy * ny + dz * nz) / (dl * nl);
        v.n++; v.len.push(L * cm); v.tipR.push(rt); v.rootR.push(R(p[0]));
        if (rt > O.spikeR && out > O.spikeCos) v.spike++;
        if (tip.y > p[0].y) v.up++;                        // 끝이 뿌리보다 위(위로 선 가닥)
        if (!s.mannequin) {
          var b = bySec[s.sec || '?'] || (bySec[s.sec || '?'] = { n: 0, ratio: [] });
          var g = null;
          try { g = innerAdj(s, null, typeof uniformStyling === 'function' ? uniformStyling() : undefined); } catch (e) { g = null; }
          if (g && g.length >= 2 && L > 1e-9) { b.n++; b.ratio.push(arc(g) / L); }
        }
      }
    } finally { O.on = keepOn; }
    return { total: m.strands.length, mannequin: !!m.mannequin, byView: byView, bySec: bySec, cm: cm };
  };

  var memoKey = null, memoVal = null;
  O.lines = function () {
    var r = null;
    try {
      var key = null;
      try { key = adjCacheSig(state.hair3Dneutral, null, 1) + '|' + (typeof adjFilterSig === 'function' ? adjFilterSig() : ''); } catch (e) { key = null; }
      if (key && key === memoKey) r = memoVal;              // 값이 그대로면 다시 재지 않음(3D 진입 기록 때마다 재지 않도록)
      else { r = O.measure(); memoKey = key; memoVal = r; }
    } catch (e) { return ['[원본 옮기기] 재기 실패: ' + (e && e.message)]; }
    if (!r) return ['[원본 옮기기] 모델 없음'];
    var L = ['[원본 옮기기] 원본 3D 그대로 ' + (O.on ? '켜짐' : '꺼짐') + ' · 모델 ' + r.total + '가닥' + (r.mannequin ? ' (지금은 마네킹 모델 — 사진 가닥을 보려면 마네킹을 끄세요)' : ' (사진 가닥)')];
    L.push('  들어올린 가닥(조정 전) — 뷰별: 길이cm 중앙값/p90 · 끝 위치(1.00=두피면) 중앙값/p90 · 가시 · 위로 선 가닥');
    Object.keys(r.byView).forEach(function (k) {
      var v = r.byView[k];
      L.push('   ' + k + ' ' + v.n + '개 · 길이 ' + n1(q(v.len, 0.5)) + '/' + n1(q(v.len, 0.9)) + ' · 뿌리 ' + n2(q(v.rootR, 0.5)) +
        ' · 끝 ' + n2(q(v.tipR, 0.5)) + '/' + n2(q(v.tipR, 0.9)) + ' · 가시 ' + Math.round(v.spike / v.n * 100) + '% · 위로 ' + Math.round(v.up / v.n * 100) + '%');
    });
    var secs = Object.keys(r.bySec);
    if (secs.length) {
      L.push('  조정 엔진이 길이를 바꾸는 양(조정 후÷원본 · 1.00=그대로) — 섹션별 중앙값/p90 · 늘린 가닥 비율');
      L.push('   ' + secs.map(function (k) {
        var b = r.bySec[k], grown = b.ratio.filter(function (x) { return x > 1.05; }).length;
        return k + ' ' + n2(q(b.ratio, 0.5)) + '/' + n2(q(b.ratio, 0.9)) + ' 늘림' + (b.n ? Math.round(grown / b.n * 100) : 0) + '%';
      }).join(' · '));
    }
    try {
      var cs = [];
      (typeof SECTION_ORDER !== 'undefined' ? SECTION_ORDER : []).forEach(function (k) {
        var sc = state.sections[k] || {}; cs.push(k + ' 길이' + sc.length + '/컬' + sc.curl);
      });
      if (cs.length) L.push('  지금 섹션 값: ' + cs.join(' · ') + ' · 커트엔진 ' + (typeof CUT3D !== 'undefined' && CUT3D.on ? '켜짐' : '꺼짐'));
    } catch (e) {}
    return L;
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ③ 옮기기 실험 — 들어올리는 단계의 장치를 하나씩 끄고 다시 만들어 비교
   * ────────────────────────────────────────────────────────────────────── */
  function rawStats() {
    var m = state.hair3Dneutral;
    if (!m || !m.strands || !m.strands.length || m.mannequin) return null;
    var E = null, cy = m.CY || 0, cm = 1;
    try { E = getHeadEllipsoid(); } catch (e) {}
    try { cm = modelCmPerUnit() || 1; } catch (e) {}
    if (!E) return null;
    function R(p) { var x = p.x / E.a, y = (p.y - cy) / E.b, z = p.z / E.c; return Math.sqrt(x * x + y * y + z * z); }
    var len = [], tipR = [], kink = [], spike = 0, n = 0, pts = 0, out = 0, views = {}, i, j;
    for (i = 0; i < m.strands.length; i++) {
      var s = m.strands[i], p = s.pts; if (!p || p.length < 2) continue;
      n++;
      var L = 0, turn = 0, turns = 0;
      for (j = 1; j < p.length; j++) {
        var ax = p[j].x - p[j - 1].x, ay = p[j].y - p[j - 1].y, az = p[j].z - p[j - 1].z, al = Math.hypot(ax, ay, az);
        L += al;
        if (j > 1 && al > 1e-9) {
          var bx = p[j - 1].x - p[j - 2].x, by = p[j - 1].y - p[j - 2].y, bz = p[j - 1].z - p[j - 2].z, bl = Math.hypot(bx, by, bz);
          if (bl > 1e-9) { turn += Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by + az * bz) / (al * bl)))); turns++; }
        }
        pts++; if (R(p[j]) > 1.15) out++;
      }
      var tip = p[p.length - 1], prev = p[p.length - 2], rt = R(tip);
      var nx = tip.x / (E.a * E.a), ny = (tip.y - cy) / (E.b * E.b), nz = tip.z / (E.c * E.c), nl = Math.hypot(nx, ny, nz) || 1;
      var dx = tip.x - prev.x, dy = tip.y - prev.y, dz = tip.z - prev.z, dl = Math.hypot(dx, dy, dz) || 1;
      var isSpike = rt > O.spikeR && (dx * nx + dy * ny + dz * nz) / (dl * nl) > O.spikeCos;
      if (isSpike) spike++;
      len.push(L * cm); tipR.push(rt); if (turns) kink.push(turn / turns * 180 / Math.PI);
      var v = views[s.srcAngle || '?'] || (views[s.srcAngle || '?'] = { n: 0, spike: 0 });
      v.n++; if (isSpike) v.spike++;
    }
    return { n: n, lenMed: q(len, 0.5), lenP90: q(len, 0.9), tipMed: q(tipR, 0.5), tipP90: q(tipR, 0.9), tipMax: q(tipR, 0.999),
      kinkMed: q(kink, 0.5), kinkP90: q(kink, 0.9), spikePct: n ? spike / n * 100 : 0, outPct: pts ? out / pts * 100 : 0, views: views };
  }
  function statLine(name, r) {
    if (!r) return '  ' + name + ' — 모델 없음(만들기 실패)';
    var vs = Object.keys(r.views).map(function (k) { var v = r.views[k]; return k + ' ' + Math.round(v.spike / Math.max(1, v.n) * 100) + '%'; }).join(' / ');
    return '  ' + name + ' — 가닥 ' + r.n + ' · 가시 ' + n1(r.spikePct) + '% (' + vs + ') · 머리 밖 점 ' + n1(r.outPct) + '% · 끝 위치 ' + n2(r.tipMed) + '/' + n2(r.tipP90) + '/최대 ' + n2(r.tipMax) +
      ' · 꺾임 ' + n1(r.kinkMed) + '°/' + n1(r.kinkP90) + '° · 길이 ' + n1(r.lenMed) + '/' + n1(r.lenP90) + 'cm';
  }
  function rebuild(cb) {
    var called = false, done = function () { if (called) return; called = true; setTimeout(cb, 60); };
    try { rebuildHair3D(); } catch (e) { console.warn(TAG + ' 다시 만들기 실패', e); }
    try { buildNeutralHair3D(done); } catch (e) { done(); }
    setTimeout(done, 20000);                                 // 안전장치
  }
  var box = null;
  function showBox(text) {
    try {
      var host = document.querySelector('#screen-adjust .adjust-preview');
      if (!host) return;
      if (!box) {
        box = document.createElement('div');
        box.style.cssText = 'position:absolute;left:8px;right:8px;top:70px;bottom:56px;z-index:80;background:rgba(0,0,0,0.9);color:#0f0;font:11px/1.5 monospace;' +
          'padding:8px;border-radius:6px;white-space:pre-wrap;overflow:auto;';
        host.appendChild(box);
      }
      box.textContent = '';
      var bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;';
      function mk(label, fn) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.style.cssText = 'min-height:30px;padding:4px 12px;border-radius:8px;border:1px solid #0f0;background:#062a06;color:#0f0;font:600 12px monospace;';
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); }); return b;
      }
      bar.appendChild(mk('복사', function (b) {
        var ok = function () { b.textContent = '복사됨 ✓'; setTimeout(function () { b.textContent = '복사'; }, 1500); };
        try { navigator.clipboard.writeText(text).then(ok, function () { b.textContent = '복사 실패'; }); } catch (e) { b.textContent = '복사 실패'; }
      }));
      bar.appendChild(mk('닫기', function () { box.style.display = 'none'; }));
      // 눈으로 보기 — 그 설정으로 다시 만들어 둔 채로 둠(미니 3D·3D 결과 화면에서 확인). '원래대로'로 되돌림.
      ['②', '③', '④', '⑤', '원래대로'].forEach(function (lab, idx) {
        bar.appendChild(mk(lab === '원래대로' ? lab : lab + '로 보기', function () { box.style.display = 'none'; O.view(idx === 4 ? 0 : idx + 1); }));
      });
      bar.style.flexWrap = 'wrap';
      box.appendChild(bar); box.appendChild(document.createTextNode(text));
      box.style.display = 'block';
    } catch (e) {}
  }
  var running = false, base = null;
  /* n: 0=원래대로 1=결정렬 끔 2=채움 끔 3=둘 다 끔 4=둘 다+세그다듬기 끔 — 그 설정으로 다시 만들어 둔다(눈으로 확인용) */
  O.view = function (n) {
    if (running) return;
    if (!base) base = { field: HAIR_FIELD3D.on, fill: HAIR_OVERLAP.fill, occ: HAIR_OCC3D.on };
    var c = [base, { field: false, fill: base.fill, occ: base.occ }, { field: base.field, fill: false, occ: base.occ },
      { field: false, fill: false, occ: base.occ }, { field: false, fill: false, occ: false }][n] || base;
    running = true;
    try { if (typeof MANNEQUIN !== 'undefined' && MANNEQUIN.on && typeof toggleMannequin === 'function') toggleMannequin(); } catch (e) {}
    HAIR_FIELD3D.on = c.field; HAIR_OVERLAP.fill = c.fill; HAIR_OCC3D.on = c.occ;
    try { if (typeof showAI === 'function') showAI('다시 만드는 중…', ''); } catch (e) {}
    setTimeout(function () {
      rebuild(function () {
        try { if (typeof hideAI === 'function') hideAI(); } catch (e) {}
        running = false; O.viewing = n;
        console.log(TAG + ' 보기 설정 ' + n + ' — 결정렬 ' + (c.field ? '켬' : '끔') + ' · 채움 ' + (c.fill ? '켬' : '끔') + ' · 세그다듬기 ' + (c.occ ? '켬' : '끔'));
        redraw();
      });
    }, 60);
  };
  O.experiment = function () {
    if (running) return;
    if (typeof rebuildHair3D !== 'function' || typeof buildNeutralHair3D !== 'function' || typeof HAIR_FIELD3D === 'undefined' || typeof HAIR_OVERLAP === 'undefined') {
      console.warn(TAG + ' 실험에 필요한 함수가 없습니다'); return;
    }
    running = true;
    try { if (typeof MANNEQUIN !== 'undefined' && MANNEQUIN.on && typeof toggleMannequin === 'function') toggleMannequin(); } catch (e) {}
    if (!base) base = { field: HAIR_FIELD3D.on, fill: HAIR_OVERLAP.fill, occ: HAIR_OCC3D.on };
    var keep = base;
    var cases = [
      { name: '① 지금 그대로            ', field: keep.field, fill: keep.fill, occ: keep.occ },
      { name: '② 결정렬 끔              ', field: false, fill: keep.fill, occ: keep.occ },
      { name: '③ 채움(복제) 끔          ', field: keep.field, fill: false, occ: keep.occ },
      { name: '④ 결정렬·채움 둘 다 끔   ', field: false, fill: false, occ: keep.occ },
      { name: '⑤ ④ + 세그다듬기도 끔    ', field: false, fill: false, occ: false }
    ];
    var out = ['[옮기기 실험] 들어올리는 단계의 장치를 하나씩 끄고 다시 만든 결과 (조정 엔진은 안 거친 가닥 그대로)',
      '  읽는 법 — 가시: 끝이 머리 반지름의 ' + O.spikeR + '배 밖 + 끝 방향이 바깥 (뷰별 %) · 머리 밖 점: 타원체 1.15배 밖에 있는 점 · 끝 위치: 중앙값/p90/최대(1.00=두상 타원체 면)',
      '           꺾임: 가닥 안에서 이웃 마디 사이 평균 각(중앙값/p90) — 크면 지그재그 · 길이: 중앙값/p90'];
    var i = 0;
    function say(t) { try { if (typeof showAI === 'function') showAI('옮기기 실험 중…', t); } catch (e) {} }
    function next() {
      if (i >= cases.length) return finish();
      var c = cases[i];
      say((i + 1) + ' / ' + cases.length);
      HAIR_FIELD3D.on = c.field; HAIR_OVERLAP.fill = c.fill; HAIR_OCC3D.on = c.occ;
      setTimeout(function () {
        rebuild(function () {
          var r = null; try { r = rawStats(); } catch (e) { console.warn(TAG + ' 재기 실패', e); }
          out.push(statLine(c.name, r));
          i++; next();
        });
      }, 60);
    }
    function finish() {
      HAIR_FIELD3D.on = keep.field; HAIR_OVERLAP.fill = keep.fill; HAIR_OCC3D.on = keep.occ;
      say('원래 설정으로 되돌리는 중');
      rebuild(function () {
        try { if (typeof hideAI === 'function') hideAI(); } catch (e) {}
        running = false; O.viewing = 0;
        try { out.push('  사진 각도 — ' + ['front', 'left', 'right', 'back'].map(function (k) { return k + ' ' + Math.round(getViewYawDeg(k)) + '°'; }).join(' · ') + '  (측면이 90°에 가까울수록 옆·뒤 깊이를 실제로 잰 것)'); } catch (e) {}
        out.push('  눈으로 보려면 위의 [②로 보기]…[⑤로 보기]를 누르세요 — 그 설정으로 다시 만들어 둡니다. [원본 3D 그대로]를 켠 채 미니 3D와 3D 결과 화면에서 비교하고, 끝나면 [원래대로].');
        O.lastExperiment = out.join('\n');
        console.log(O.lastExperiment);
        showBox(O.lastExperiment);
        redraw();
      });
    }
    next();
  };

  if (O.button) try {
    var bar2 = document.querySelector('#screen-adjust .mode-bar');
    if (bar2) {
      var eb = document.createElement('button');
      eb.id = 'origExpBtn'; eb.type = 'button'; eb.textContent = '옮기기 실험';
      eb.title = '들어올리는 단계의 장치를 하나씩 끄고 다시 만들어 가시·꺾임·길이를 비교합니다 (10~30초)';
      eb.addEventListener('click', function () { O.experiment(); });
      bar2.appendChild(eb);
    }
  } catch (e) {}

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(O.lines()); } catch (e) {}
    if (O.lastExperiment) L = L.concat(O.lastExperiment.split('\n'));
    return L;
  };

  console.log(TAG + ' 설치 — 조정 화면의 [원본 3D 그대로] 버튼 · 진단 줄 [원본 옮기기]. 콘솔: ORIG_ASIS.toggle() · ORIG_ASIS.lines().join("\\n")');
})();
