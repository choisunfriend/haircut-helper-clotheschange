/* ==========================================================================
 * 69-style-paths.js — 원본 머리를 스타일로 등록할 때 "보이는 가닥 길 그대로"(타래 자리까지) 실음
 *
 * 로드 위치: index.html에서 68-read-shape.js 바로 다음(68번의 adjustStrandGeom 바깥을 감쌈).
 *
 * 왜 (2026-10-13 · 사용자):
 *   "앞에 컬 헤어 여자분 머리를 스타일로 저장해서 뒤에 적용해 봤는데, 머리가 늘어지네. 타래 위치까지 다 기억하게 스타일 등록되게 해줘."
 *   예전(12v·12w) 등록 = 결 표(59번 · 칸마다 큰 흐름 방향 + 길이) + 굴곡 값(61번 · 두피 칸마다 크기·한 번·위상).
 *     받는 손님은 결 표로 길을 "다시 지어서"(굴곡 없는 흐름 → 중력 쪽으로 내려감) 그 위에 굴곡을 얹음
 *     → 원본의 부피(덩어리 안에서 옆·바깥으로 뜬 길)와 타래가 놓인 자리가 사라지고 아래로 늘어짐.
 *
 * 무엇을:
 *   A. 기록 — 원본 머리(마네킹 + 잰 값 · 68번 옮겨심기)를 그릴 때 마네킹 가닥마다 최종 길(굴곡·타래·슬라이더까지 다 걸린 것)을
 *      뿌리 자리 칸(cell ≈ 0.8cm)마다 하나씩 모아 둠.
 *   B. 등록 — buildSpecFromCurrent에서 원본 머리를 보고 있으면 spec.readPaths로 실음
 *      (뿌리 int16 · 길은 점 사이 차이를 int8로 · base64 — 1000가닥쯤 ≈ 100~200KB). 등록 때 슬라이더 값(섹션 길이·컬·넘김·볼륨·가르마)도 같이.
 *   C. 적용 — 이 스타일이 걸린 다른 손님의 마네킹 가닥은 가장 가까운 뿌리의 길을 그대로 옮겨 씀(결 표로 다시 짓지 않음 · 굴곡도 다시 안 얹음).
 *      같은 칸(≈0.8cm)의 가닥은 같은 길을 나란히 따라가 타래가 원본 자리에서 그대로 생김.
 *      슬라이더는 "등록 때 값에서 움직인 만큼만"(길이 비율·넘김·볼륨·가르마·컬 더 감기).
 * 끄기: STYLE_PATHS.on=false(기록·적용 모두) · STYLE_PATHS.apply=false(적용만 — 예전 결 표 경로)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[스타일 길]';
  var SP = W.STYLE_PATHS = Object.assign({
    on: true, apply: true,
    cell: 0.04,          // 뿌리 칸(모델 단위 ≈ 0.8cm) — 칸마다 길 하나
    stepCm: 0.6,         // 실을 때 점 간격(컬 한 바퀴 2cm에 3~4점 이상)
    maxPts: 72,
    reach: 4,            // 적용 때 뿌리 찾기 칸 반경
    offKeepCm: 0.4, offFadeCm: 2.5
  }, W.STYLE_PATHS || {});
  var ST = SP.stats = { rec: 0, cells: 0, exportKB: 0, exportN: 0, used: 0, fell: 0, err: null };
  var REC = { photo: null, m: new Map() };

  function cpu() { try { return (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33; } catch (e) { return 19.33; } }
  function photo() { try { return state._hair3Dneutral || null; } catch (e) { return null; } }
  function isOrig() { try { return !!(W.ORIG_MQ && W.ORIG_MQ.on !== false && typeof W.ORIG_MQ.isOriginal === 'function' && W.ORIG_MQ.isOriginal()); } catch (e) { return false; } }
  function keyOf(ix, iy, iz) { return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512); }
  function cellKey(p) { var c = SP.cell; return keyOf(Math.floor(p.x / c), Math.floor(p.y / c), Math.floor(p.z / c)); }
  function arcLen(p) { var L = 0, i; for (i = 1; i < p.length; i++) L += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); return L; }
  function resample(p, M) {
    var S = [0], i, j = 0, n = p.length; for (i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z));
    var L = S[n - 1]; if (!(L > 0) || M < 2) return p.slice();
    var out = new Array(M); for (i = 0; i < M; i++) { var s = L * i / (M - 1); while (j < n - 2 && S[j + 1] < s) j++; var u = (s - S[j]) / Math.max(1e-12, S[j + 1] - S[j]); out[i] = { x: p[j].x + (p[j + 1].x - p[j].x) * u, y: p[j].y + (p[j + 1].y - p[j].y) * u, z: p[j].z + (p[j + 1].z - p[j].z) * u }; }
    return out;
  }

  /* ── A. 기록 ─────────────────────────────────────────────────────────── */
  function record(s, out) {
    var ph = photo(); if (REC.photo !== ph) { REC.photo = ph; REC.m = new Map(); }
    var r = s.pts[0]; if (!r || !out || out.length < 2) return;
    var k = cellKey(r), e = REC.m.get(k);
    var c = SP.cell, cx = (Math.floor(r.x / c) + 0.5) * c, cy = (Math.floor(r.y / c) + 0.5) * c, cz = (Math.floor(r.z / c) + 0.5) * c, d = (r.x - cx) * (r.x - cx) + (r.y - cy) * (r.y - cy) + (r.z - cz) * (r.z - cz);
    if (e && e.s !== s && e.d < d) return;                                 // 칸 가운데에 가까운 뿌리 하나만(같은 가닥이면 새 길로 바꿈)
    REC.m.set(k, { s: s, d: d, r: { x: r.x, y: r.y, z: r.z }, p: out, sec: s.sec });
    ST.rec++;
  }

  /* ── B. 실기(인코딩) ─────────────────────────────────────────────────── */
  var Q = 1e-4;   // 뿌리 좌표 단위(모델 단위) — int16이면 ±3.27
  function exportPaths() {
    if (REC.photo !== photo() || !REC.m.size) return null;
    var bytes = [], n = 0, stepU = SP.stepCm / cpu();
    function i16(v) { v = Math.max(-32768, Math.min(32767, Math.round(v))); bytes.push(v & 255, (v >> 8) & 255); }
    function u16(v) { v = Math.max(0, Math.min(65535, Math.round(v))); bytes.push(v & 255, (v >> 8) & 255); }
    REC.m.forEach(function (e) {
      var p = e.p, L = arcLen(p); if (!(L > 1e-6)) return;
      var M = Math.max(4, Math.min(SP.maxPts, Math.ceil(L / stepU) + 1)), q = resample(p, M), i;
      var mx = 0; for (i = 1; i < M; i++) mx = Math.max(mx, Math.abs(q[i].x - q[i - 1].x), Math.abs(q[i].y - q[i - 1].y), Math.abs(q[i].z - q[i - 1].z));
      var sc = Math.max(1e-6, mx / 127);                                  // 점 사이 차이 한 칸 크기(모델 단위)
      i16(e.r.x / Q); i16(e.r.y / Q); i16(e.r.z / Q); u16(sc / 1e-6); bytes.push(M);
      var px = q[0].x, py = q[0].y, pz = q[0].z;                           // 되살린 점을 따라가며 양자화(오차가 쌓이지 않게)
      for (i = 1; i < M; i++) {
        var ax = Math.max(-127, Math.min(127, Math.round((q[i].x - px) / sc))), ay = Math.max(-127, Math.min(127, Math.round((q[i].y - py) / sc))), az = Math.max(-127, Math.min(127, Math.round((q[i].z - pz) / sc)));
        bytes.push(ax & 255, ay & 255, az & 255); px += ax * sc; py += ay * sc; pz += az * sc;
      }
      n++;
    });
    var bin = '', CH = 8192, i2; for (i2 = 0; i2 < bytes.length; i2 += CH) bin += String.fromCharCode.apply(null, bytes.slice(i2, i2 + CH));
    var sty = {}, len = {}, curl = {};
    try { sty = Object.assign({}, (typeof uniformStyling === 'function' && uniformStyling()) || {}); } catch (e) {}
    try { Object.keys(state.sections || {}).forEach(function (k) { var c = state.sections[k]; if (c) { if (typeof c.length === 'number') len[k] = c.length; curl[k] = c.curl || 0; } }); } catch (e) {}
    var out = { v: 1, q: Q, cell: SP.cell, n: n, d: btoa(bin), sty: sty, len: len, curl: curl };
    ST.exportN = n; ST.exportKB = Math.round(out.d.length / 1024);
    return out;
  }
  function decode(rp) {
    if (rp._dec) return rp._dec;
    var bin = atob(rp.d), N = bin.length, o = 0, list = [], q = rp.q || Q;
    function b() { return bin.charCodeAt(o++); }
    function i16() { var v = b() | (b() << 8); return v >= 32768 ? v - 65536 : v; }
    function i8() { var v = b(); return v >= 128 ? v - 256 : v; }
    while (o + 9 <= N) {
      var r = { x: i16() * q, y: i16() * q, z: i16() * q }, sc = (b() | (b() << 8)) * 1e-6, M = b(), p = [{ x: r.x, y: r.y, z: r.z }], i;
      if (o + (M - 1) * 3 > N) break;
      for (i = 1; i < M; i++) { var l = p[i - 1]; p.push({ x: l.x + i8() * sc, y: l.y + i8() * sc, z: l.z + i8() * sc }); }
      list.push({ r: r, p: p });
    }
    var cells = new Map(), c = rp.cell || SP.cell;
    list.forEach(function (e, idx) { var k = keyOf(Math.floor(e.r.x / c), Math.floor(e.r.y / c), Math.floor(e.r.z / c)), a = cells.get(k); if (!a) cells.set(k, a = []); a.push(idx); });
    rp._dec = { list: list, cells: cells, c: c };
    try { Object.defineProperty(rp, '_dec', { enumerable: false, value: rp._dec, writable: true }); } catch (e) {}   // 저장(JSON) 때 안 실리게
    return rp._dec;
  }
  function nearest(D, p) {
    var c = D.c, cx = Math.floor(p.x / c), cy = Math.floor(p.y / c), cz = Math.floor(p.z / c), best = -1, bd = Infinity, r, a, b2, d2;
    for (r = 0; r <= SP.reach; r++) {
      for (a = -r; a <= r; a++) for (b2 = -r; b2 <= r; b2++) for (d2 = -r; d2 <= r; d2++) {
        if (Math.max(Math.abs(a), Math.abs(b2), Math.abs(d2)) !== r) continue;
        var L = D.cells.get(keyOf(cx + a, cy + b2, cz + d2)); if (!L) continue;
        for (var t = 0; t < L.length; t++) { var q = D.list[L[t]].r, dd = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) + (q.z - p.z) * (q.z - p.z); if (dd < bd) { bd = dd; best = L[t]; } }
      }
      if (best >= 0 && Math.sqrt(bd) <= (r + 0.5) * c) break;
    }
    return best;
  }

  /* ── C. 적용 ─────────────────────────────────────────────────────────── */
  function activePaths() {
    try {
      if (!SP.on || !SP.apply || isOrig()) return null;
      var id = state.specAppliedId; if (!id || typeof getStyleSpec !== 'function') return null;
      var sp = getStyleSpec(id); return (sp && sp.readPaths && sp.readPaths.d) ? sp.readPaths : null;
    } catch (e) { return null; }
  }
  SP.active = activePaths;
  function placePath(src, root) {
    var q0 = src[0], dx = root.x - q0.x, dy = root.y - q0.y, dz = root.z - q0.z, dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var keepU = SP.offKeepCm / cpu(), fadeU = SP.offFadeCm / cpu(), fr = (SP.offFadeCm > 0 && dl > keepU) ? keepU / dl : 1, acc = 0, out = new Array(src.length), k;
    for (k = 0; k < src.length; k++) {
      if (k) acc += Math.hypot(src[k].x - src[k - 1].x, src[k].y - src[k - 1].y, src[k].z - src[k - 1].z);
      var w = fr < 1 ? Math.min(1, acc / Math.max(1e-6, fadeU)) : 0; w = w * w * (3 - 2 * w);
      var f = 1 - w * (1 - fr);
      out[k] = { x: src[k].x + dx * f, y: src[k].y + dy * f, z: src[k].z + dz * f };
    }
    return out;
  }
  function adjustFromReg(s, g, rp, lenOverride, styOverride) {
    var cur = (state.sections && state.sections[s.sec]) || {}, base = rp.sty || {};
    var sty = {}; try { sty = (styOverride !== undefined ? styOverride : uniformStyling()) || stylingForRoot(s.pts[0]) || {}; } catch (e) {}
    try {
      var L0 = rp.len && typeof rp.len[s.sec] === 'number' ? rp.len[s.sec] : null, L1 = typeof lenOverride === 'number' ? lenOverride : cur.length;
      if (L0 != null && typeof L1 === 'number' && L1 !== L0) { var r = sectionLengthRatio(s.sec, L1) / (sectionLengthRatio(s.sec, L0) || 1); if (isFinite(r) && Math.abs(r - 1) > 1e-6) g = lengthStrand3D(g, r); }
    } catch (e) {}
    var curl = Math.max(0, cur.curl || 0), C0 = (rp.curl && rp.curl[s.sec]) || 0, dC = curl - C0;
    var sweep = Math.max(-100, Math.min(100, (sty.sweep || 0) - (base.sweep || 0)));
    var vol = Math.max(0, Math.min(100, 50 + ((typeof sty.volume === 'number' ? sty.volume : 50) - (typeof base.volume === 'number' ? base.volume : 50))));
    var samePart = (sty.part || 0) === (base.part || 0) && (sty.partAmt || 0) === (base.partAmt || 0);
    var part = samePart ? 0 : (sty.part || 0), partAmt = samePart ? 0 : sty.partAmt;
    try {
      if (dC > 1 && W.PHOTO_CURL && typeof W.PHOTO_CURL.activeRS === 'function' && !W.PHOTO_CURL.activeRS()) { g = curlStrand3D(g, dC, (typeof cur.wave === 'number' ? cur.wave : 50) / 100, typeof cur.curlDir === 'number' ? cur.curlDir : 0); g = gravityDroop3D(g, dC); }
      if (part || sweep) { g = partStrand3D(g, part, curl, partAmt); g = sweepStrand3D(g, sweep, curl, part, partAmt); }
      if (vol !== 50) g = volumeStrand3D(g, vol, s.sec);
      var fl = (sty.flow || 0) - (base.flow || 0); if (fl) g = flowCurlStrand3D(g, fl);
      var sl = (typeof sty.sleek === 'number' ? sty.sleek : 0) - (typeof base.sleek === 'number' ? base.sleek : 0); if (sl > 0) g = sleekStrand3D(g, sl);
    } catch (e) { if (!ST.err) ST.err = '슬라이더: ' + (e && e.message || e); }
    return g;
  }

  var prevAdj = W.adjustStrandGeom;
  if (typeof prevAdj === 'function') W.adjustStrandGeom = function (s, lenOverride, styOverride) {
    if (SP.on && s && s.mannequin && s.pts && s.pts.length >= 2) {
      try {
        var rp = activePaths();
        if (rp) {
          var D = decode(rp), mem = s._spth;
          if (!mem || mem.D !== D || mem.r0 !== s.pts[0]) {
            var bi = nearest(D, s.pts[0]);
            mem = s._spth = { D: D, r0: s.pts[0], pts: bi >= 0 ? placePath(D.list[bi].p, s.pts[0]) : null };
            if (mem.pts) ST.used++; else ST.fell++;
          }
          if (mem.pts) return adjustFromReg(s, mem.pts, rp, lenOverride, styOverride);
        }
      } catch (e) { if (!ST.err) console.warn(TAG + ' 적용 실패 — 예전 경로', e); ST.err = String(e && e.message || e); }
    }
    var out = prevAdj.apply(this, arguments);
    try { if (SP.on && s && s.mannequin && s.pts && isOrig()) record(s, out); } catch (e) {}   // (2026-10-13b) 길이·스타일 인자가 늘 넘어와서 예전 조건으로는 한 번도 기록이 안 됐음(진단 "기록한 칸 0")
    return out;
  };
  else console.warn(TAG + ' adjustStrandGeom이 없어 스타일 길을 못 씁니다');

  var innerBuildSpec = W.buildSpecFromCurrent;
  if (typeof innerBuildSpec === 'function') W.buildSpecFromCurrent = function () {
    var spec = innerBuildSpec.apply(this, arguments);
    try {
      if (spec && SP.on && isOrig()) {
        var rp = exportPaths();
        if (rp && rp.n > 0) {
          spec.readPaths = rp;
          console.log(TAG + ' 원본 머리에서 등록 — 보이는 가닥 길 ' + rp.n + '개(뿌리 칸 ' + Math.round(SP.cell * cpu() * 10) / 10 + 'cm마다 하나 · 타래 자리 그대로)를 실음 · ' + ST.exportKB + 'KB');
        } else console.warn(TAG + ' 등록 — 기록된 길이 없음(원본 머리를 한 번 그린 뒤 등록하세요)');
      }
    } catch (e) { console.warn(TAG + ' 등록에 길 싣기 실패', e); }
    return spec;
  };

  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments);
    try { var rp = activePaths(); if (rp) { s += '|sp' + rp.n + ':' + rp.d.length + ':' + SP.offKeepCm; btnSync(); } } catch (e) {}
    return s;
  };

  /* (2026-10-13f) 버튼 표시 — 스타일 길이 있는 스타일은 마네킹 뿌리 자리만 쓰고 모양은 등록한 그대로라, 걸 때 [마네킹 초기화]를 OFF로 보이게
   *  사용자: "마네킨 뿌리만 쓴다고. 그럼 상관없지. 버튼만 off로 해. 헷갈리니까" · 끄기 STYLE_PATHS.btnOff=false */
  SP.btnOff = true;
  function btnSync() {
    try {
      if (!SP.btnOff || !activePaths()) return;
      var b = document.getElementById('mannequinBtn'); if (!b) return;
      b.classList.remove('on'); if (b.textContent !== '마네킹 초기화 OFF') b.textContent = '마네킹 초기화 OFF';
      b.title = '스타일 길이 든 스타일 — 마네킹 뿌리 자리만 쓰고 모양은 등록한 그대로';
    } catch (e) {}
  }
  var innerSync = W.syncMannequinBtn;
  if (typeof innerSync === 'function') W.syncMannequinBtn = function () { var r = innerSync.apply(this, arguments); btnSync(); return r; };
  SP.btnSync = btnSync;

  SP.lines = function () {
    return [TAG + ' ' + (SP.on ? '켜짐' : '꺼짐') + ' · 기록한 칸 ' + REC.m.size + (ST.exportN ? ' · 직전 등록에 실은 길 ' + ST.exportN + '개(' + ST.exportKB + 'KB)' : '') +
      ' · 지금 걸린 스타일 길: ' + (activePaths() ? '있음 — 옮겨 쓴 가닥 ' + ST.used + ' / 못 찾아 예전 경로 ' + ST.fell : '없음(결 표 경로)') + (ST.err ? ' · ⚠ ' + ST.err : '')];
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () { var L = ppl.apply(this, arguments) || []; try { L = L.concat(SP.lines()); } catch (e) {} return L; };
  console.log(TAG + ' 설치 — 원본 머리를 스타일로 등록하면 보이는 가닥 길(타래 자리까지)을 실어 다른 손님에게 그대로 옮김. 끄기 STYLE_PATHS.on=false / .apply=false');
})();
