/* ==========================================================================
 * 61-photo-curl.js — 곱슬 원본 머리: 컬 굵기를 사진에서 잰 값에 맞추고, 가닥이 뭉쳐서 같이 감기게
 *
 * 로드 위치: index.html 맨 끝(60-photo-check.js 다음). 42번·14c(컬 엔진)는 고치지 않습니다.
 *
 * 왜 (2026-10-08 · 사용자, 곱슬 손님 영상): "컬이 원본 사진에 비해 컬 직경이 좁고, 너무 가닥가닥 놀아. 사진에서 읽은 정보가 있을 테니,
 *   거기에 맞춰서 컬 직경과 뭉쳐 다니는 가닥들로 정리되게 해 줘."
 *   진단: 컬 75 · 컬 굵기 반경 1.3cm(뷰 중앙값) → 꺼짐(REGROW.curlRadius=false) — 웨이브 50.
 *   · 굵기 — 사진에서 반경은 재고 있었지만 쓰지 않았습니다. 42번 v5의 환산식이 실제 컬 엔진(14c 컬 묶음)과 안 맞아서(웨이브 100 + 로드 ×1.29 =
 *     한 바퀴 11cm · 두 바퀴도 안 감김 → 곧은 막대) 10/6에 꺼 둔 것입니다(42번 머리말 v8). 그래서 굵은 컬 사진도 웨이브 50짜리 잔 컬로 나왔습니다.
 *   · 뭉침 — 컬 엔진은 가닥을 다발(로드 하나에 감기는 한 타래)로 묶지만, 기본값이 다발 안에서도 가닥마다 감기는 자리(위상)를 크게 흩고(phaseJitter 1.2)
 *     다발 가운데로는 30%만 당깁니다(clumpPull 0.3). 그래서 타래가 아니라 낱가닥이 제각각 꼬불거리는 것처럼 보였습니다.
 *
 * 무엇을 (다시 기른 머리 화면에서, 사진에서 잰 컬이 lookMinCurl 이상일 때만):
 *   ① 컬 굵기 — 실제 엔진을 돌려서 "웨이브 값 → 가닥이 뼈대에서 벗어나는 거리(= 컬 반경)"를 재 둔 표(table)로, 사진에서 잰 반경이 나오는 웨이브 값을 고릅니다.
 *      REGROW.photoCurl()이 돌려주는 wave를 그 값으로 바꾸므로 — 섹션 웨이브 슬라이더 · 등록 스타일(perm.wave)에 그대로 들어갑니다.
 *      웨이브는 waveMin~waveMax 안에서만(너무 굵으면 다시 막대가 됨). 로드 배수(rodScale)는 쓰지 않습니다.
 *   ② 뭉침 모양(look) — 컬을 거는 동안만 컬 엔진의 값 네 개를 바꿉니다:
 *        pitchThick 3.5 → 1.4  굵은 로드에서도 한 바퀴 간격이 덜 늘어남(굵게 해도 감긴 모양이 남음 — ①을 켤 수 있게 된 이유)
 *        clumpPull 0.3 → 0.8 · phaseJitter 1.2 → 0.3 · microAmp 0.07 → 0.03   한 다발의 가닥이 같은 자리에서 같이 감김(타래)
 *      컬 엔진의 전역 값은 건드리지 않습니다(호출 앞뒤로 바꿨다 되돌림) → 마네킹 스타일·스타일 프로필(24번)은 예전 그대로입니다.
 *      제 머리 바탕으로 건 스타일(59번 · 마네킹 안 켬)에도 같은 모양이 걸립니다(그 화면도 다시 기른 가닥이라서).
 *
 * (2026-10-08b) ③ 타래 뼈대 — 사용자(3D 결과 화면 영상): "앞머리에서는 컬이 구현된 게 보여. 근데 나머지 머리는 가닥가닥이 제멋대로 굴곡만 좀 주며 뭉쳐 있는
 *   형태 — 저 앞머리처럼 전체에 적용되게."
 *   원인: 컬은 가닥의 "뼈대"(컬을 편 선)에 감깁니다. 한 다발의 뼈대가 나란하면(앞머리 — 전부 같은 쪽으로 내려옴) 같이 감겨 타래로 보이지만,
 *        곱슬 사진에서 다시 기른 뼈대는 가닥마다 엇갈려 있어서(곱슬은 결 정렬을 일부러 안 함) 다발이 같은 자리에서 감겨도 축이 제각각 → 낱가닥이 꼬불거리는 덩어리.
 *        재현(지어낸 가닥 · 같은 컬 값): 뼈대의 엇갈림만 키우면 타래가 사라지고 영상과 같은 모양이 됩니다.
 *   지금: 컬을 걸기 전에 뼈대를 "타래" 단위로 모읍니다.
 *     · 뿌리가 가까운(아래 2026-10-08c: 컬 지름 × 1직경) 가닥끼리 한 타래. 그 안에서 가장 여럿이 같이 가는 가닥을 길잡이로 삼고(같은 칸에서 반대로 가는 가닥은 다른 타래),
 *       나머지 가닥을 길잡이의 길로 당깁니다(lockPull · 뿌리 자리는 그대로 · 끝으로 갈수록 타래가 모임 lockTaper).
 *     · 타래끼리는 그대로 엇갈립니다 → 부피는 "타래의 엇갈림"에서 나옵니다(예전: 가닥의 엇갈림).
 *     · 다시 기른 가닥(G.model)은 안 건드립니다 — 가닥을 만들 때만 모은 뼈대를 씁니다. 그래서 결 표·스타일 등록·원본 대조는 예전 뼈대 그대로입니다.
 *     · 제 머리 바탕으로 건 곱슬 스타일(직모 손님에게 펌 스타일을 얹은 경우)에도 ②③이 걸립니다(스타일에 적힌 컬이 lookMinCurl 이상이면).
 *   끄기: PHOTO_CURL.lock=false 후 PHOTO_CURL.refresh()
 *
 * (2026-10-08c) 타래 크기 = 펌의 베이스 규칙 — 사용자가 보낸 와인딩 영상 두 개: 한 로드에 뜨는 베이스는 "로드 지름만큼의 두께 × 로드 길이만큼의 폭"인 얇은 판.
 *   예전 값(컬 반경 × 1.4 = 0.7직경)은 눈대중이었습니다. 이제 뿌리 자리 = 컬 지름(사진 반경 × 2) × lockDia(1직경).
 *   구역의 "펌·베이스 폭" 슬라이더가 이 값을 키우고 줄입니다(기본 자리 = 1직경 · 끝까지 올리면 2직경 · 끝까지 내리면 0.5직경 · 구역마다 따로).
 *   판 전체(로드 길이 폭)를 한 타래로 묶지는 않았습니다 — 로드를 풀면 판은 지름 폭쯤의 타래 여러 개로 갈라지기 때문(영상의 완성 머리).
 * (2026-10-08d) 길잡이 펴기 — 사용자(3D 결과 영상): "앞머리 쪽은 타래가 더 생겼는데 나머지는 아닌데?"
 *   추정 원인(실제 가닥으로는 아직 못 봄 · 지어낸 가닥으로 재현): 앞머리는 두피 밖으로 늘어뜨린 가닥이라 뼈대가 곧고 나란함 → 컬이 타래로 보임.
 *     나머지는 곱슬 사진의 결을 따라 걸음마다 10°씩 꺾이며 두피 위를 헤매는 뼈대 → 타래로 모아도 타래 자체가 구불구불 서로 엇갈려 컬이 묻힘.
 *   지금: 길잡이의 길을 lockSmoothCm(3cm)만큼 고르게 폄(가는 쪽만 · 두피에서 뜬 높이는 그대로 → 부피 유지). 길잡이는 "여럿이 같이 가는 가닥 중 가장 긴 것".
 *         길잡이보다 긴 가닥은 남은 길을 제 모양대로 이어 감(예전: 곧은 막대로 뻗음 — 그림에서 확인된 흠).
 *   끄기: PHOTO_CURL.lockSmoothCm=0; PHOTO_CURL.refresh()
 * 확인한 것(실제 앱 코드를 브라우저에 올리고 · 가닥은 지어낸 것): 표의 숫자 · 그림으로 본 타래 모양 · 다른 화면(마네킹)의 가닥이 점 단위로 그대로인 것.
 * ⚠ 확인 못 한 것: 실제 사진. 사진에서 재는 반경 자체가 어림값입니다(42번 curlRk) — 굵기가 사진보다 크거나 작게 나오면 PHOTO_CURL.radiusK(기본 1)로 맞춥니다.
 *   마네킹에 표를 올린 원본(직모·약한 웨이브 — 58번)과 마네킹 스타일에는 걸리지 않습니다.
 *
 * 끄기: PHOTO_CURL.on=false 후 마네킹을 켰다 끄기 · 굵기만 끄기 PHOTO_CURL.radius=false · 뭉침만 끄기 PHOTO_CURL.clump=false
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[사진 컬]';
  var PC = W.PHOTO_CURL = Object.assign({
    on: true,
    radius: true,        // ① 컬 굵기를 사진 반경에 맞춤
    clump: true,         // ② 뭉침 모양
    lookMinCurl: 30,     // 사진에서 잰 컬이 이 이상일 때만
    look: { pitchThick: 1.4, clumpPull: 0.8, phaseJitter: 0.3, microAmp: 0.03 },
    lock: true,          // ③ 타래 뼈대
    lockDia: 1.0,        // 타래 하나의 뿌리 자리 크기 = 컬 지름(사진 반경 × 2) × 이 값 — 펌에서 로드 하나에 뜨는 베이스 두께(1직경)와 같은 규칙. 반경을 못 쟀으면 lockCm
    lockBase: true,      // 그 구역의 "펌·베이스 폭" 슬라이더로 굵게/가늘게: 기본 자리(구역 기본값)에서 1직경 · 끝까지 올리면 lockBaseMax배 · 끝까지 내리면 1/lockBaseMax배
    lockBaseMax: 2,
    lockCm: 2.6, lockCmMin: 1.2, lockCmMax: 5,
    lockPull: 0.85,      // 길잡이의 길로 당기는 정도(1 = 완전히 나란히)
    lockRootCm: 1.0,     // 뿌리에서 이만큼은 서서히(뿌리는 제자리)
    lockTaper: 0.45, lockTaperCm: 5,   // 끝으로 갈수록 타래가 모임: 뿌리 간격의 이 비율까지 · 이 길이에 걸쳐
    lockSmoothCm: 3,     // 길잡이의 길을 이 길이(cm)만큼 고르게 편 뒤 타래를 모음(가는 쪽만 펴고 두피에서 뜬 높이는 지킴) — 0이면 예전처럼 살짝만(두 번)
    clumpSize: true, clumpRK: 1, clumpRMin: 0.6, clumpRMax: 1.6,   // (2026-10-10b) 조각마다 잰 크기로 컬 굵기 · 크기 보정 · 사진 전체 값의 이 배수 사이로
    lockClumps: true, lockClumpFr: [0.25, 0.4, 0.55, 0.7, 0.85], lockClumpVotes: 2,   // (2026-10-10m) 사진 타래 조각으로 묶기 · 가닥에서 비춰 볼 자리 · 같은 조각에 이만큼 걸려야
    lockDot: 0.5,        // 길잡이와 가는 쪽이 이만큼은 같아야 같은 타래(아니면 그 칸의 둘째 타래 · 그것도 아니면 그대로)
    radiusK: 1,          // 사진에서 잰 반경에 곱하는 보정(굵기가 사진과 다르면 이것으로)
    waveMin: 30, waveMax: 90,
    // 실제 컬 엔진(뭉침 모양을 건 상태)으로 잰 값: 컬 값 → [웨이브, 가닥이 뼈대에서 벗어나는 거리 cm(중앙값)] (2026-10-08 · 가닥 15~27cm · 엔진 자 19.33cm/단위)
    table: {
      50: [[30, 0.56], [50, 0.73], [60, 0.79], [70, 0.89], [80, 1.04], [90, 1.33]],
      75: [[30, 0.72], [50, 0.95], [60, 1.04], [70, 1.14], [80, 1.37], [90, 1.78]],
      90: [[30, 0.75], [50, 0.93], [60, 1.01], [70, 1.08], [80, 1.26], [90, 1.33]]
    }
  }, W.PHOTO_CURL || {});
  var S = PC.stats = { rCm: null, wave: null, was: null, curl: null, why: '', look: false, calls: 0, err: null };
  var G = W.REGROW;

  function mqOn() { try { return typeof MANNEQUIN !== 'undefined' && !!MANNEQUIN.on; } catch (e) { return false; } }
  function waveInRow(row, r) {             // 그 컬 값에서 반경 r이 나오는 웨이브(표 밖은 끝 값)
    var i, a, b;
    if (r <= row[0][1]) return row[0][0];
    for (i = 1; i < row.length; i++) { a = row[i - 1]; b = row[i]; if (r <= b[1]) return a[0] + (b[0] - a[0]) * (r - a[1]) / Math.max(1e-6, b[1] - a[1]); }
    return row[row.length - 1][0];
  }
  PC.waveFor = function (rCm, curl) {
    var keys = Object.keys(PC.table).map(Number).sort(function (x, y) { return x - y; }), i, w;
    if (!keys.length || !(rCm > 0)) return 50;
    if (curl <= keys[0]) w = waveInRow(PC.table[keys[0]], rCm);
    else if (curl >= keys[keys.length - 1]) w = waveInRow(PC.table[keys[keys.length - 1]], rCm);
    else for (i = 1; i < keys.length; i++) if (curl <= keys[i]) {
      var w0 = waveInRow(PC.table[keys[i - 1]], rCm), w1 = waveInRow(PC.table[keys[i]], rCm), t = (curl - keys[i - 1]) / (keys[i] - keys[i - 1]);
      w = w0 + (w1 - w0) * t; break;
    }
    return Math.round(Math.max(PC.waveMin, Math.min(PC.waveMax, w)));
  };

  /* ① 사진에서 잰 반경 → 웨이브 */
  if (G && typeof G.photoCurl === 'function') {
    var innerPC = G.photoCurl;
    G.photoCurl = function () {
      var out = innerPC.apply(this, arguments);
      try {
        if (PC.on && PC.radius && !G.curlRadius && out && out.value >= PC.lookMinCurl && out.rCm > 0) {
          var was = out.wave, w = PC.waveFor(out.rCm * PC.radiusK, out.value);
          out.wave = w; out.rodScale = 1; out.photoCurlWave = { was: was, rCm: out.rCm, k: PC.radiusK };
          S.rCm = out.rCm; S.wave = w; S.was = was; S.curl = out.value;
        } else if (out) { S.rCm = out.rCm || null; S.wave = null; S.curl = out.value; S.why = !PC.on ? '꺼짐' : !PC.radius ? '굵기 맞추기 꺼짐(PHOTO_CURL.radius=false)' : G.curlRadius ? '42번 굵기 적용(REGROW.curlRadius)이 켜져 있어 그쪽에 맡김' : !(out.value >= PC.lookMinCurl) ? '컬이 ' + PC.lookMinCurl + ' 미만이라 안 맞춤' : '사진에서 반경을 못 잼'; }
      } catch (e) { S.err = String(e && e.message || e); }
      return out;
    };
  } else console.warn(TAG + ' REGROW.photoCurl이 없어 컬 굵기는 못 맞춥니다');

  /* ② 뭉침 모양 — 다시 기른 머리 화면(사진에서 잰 컬이 있음)에서 컬을 거는 동안만 */
  function baseCurl() {
    var m = 0;
    try { var b = G && G.base && G.base.sections, k; if (b) for (k in b) if (b[k] && b[k].curl > m) m = b[k].curl; } catch (e) {}
    // 제 머리 바탕으로 건 스타일(59번)이 곱슬 스타일이면 그 컬로 — 직모 손님에게 펌 스타일을 얹은 경우
    try { var ns = W.FLOW_SPEC && W.FLOW_SPEC.nativeState, sp = (ns && ns.id && typeof getStyleSpec === 'function') ? getStyleSpec(ns.id) : null, c = sp && sp.flowBase ? +sp.flowBase.curl : 0; if (c > m) m = c; } catch (e) {}
    return m;
  }
  function lookActive() {
    try { return !!(PC.on && PC.clump && G && G.on && !mqOn() && typeof CURL_BUNDLE !== 'undefined' && baseCurl() >= PC.lookMinCurl); } catch (e) { return false; }
  }
  PC.lookActive = lookActive;
  /* ③ 타래 뼈대 — 모델마다 한 번 만들어 둠(가닥 → 모은 점 배열) */
  var lockMemo = { model: null, ver: -1, map: null, n: 0, locks: 0, moved: 0, ms: 0 }, lver = 0;
  function cmU() { try { var c = (typeof modelCmPerUnit === 'function') ? modelCmPerUnit() : 0; return c > 1 ? c : 19.33; } catch (e) { return 19.33; } }
  function arcs(p) { var a = new Float64Array(p.length), i; for (i = 1; i < p.length; i++) a[i] = a[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); return a; }
  function atArc(p, a, s, o) {              // 길 p(호길이 a)에서 s만큼 간 자리 → o · 끝을 넘으면 끝 방향으로 곧게
    var n = p.length, L = a[n - 1], i, t, d;
    if (s >= L) { d = Math.max(1e-9, a[n - 1] - a[n - 2]); t = (s - L) / d; o.x = p[n - 1].x + (p[n - 1].x - p[n - 2].x) * t; o.y = p[n - 1].y + (p[n - 1].y - p[n - 2].y) * t; o.z = p[n - 1].z + (p[n - 1].z - p[n - 2].z) * t; return o; }
    var lo = 0, hi = n - 1; while (hi - lo > 1) { i = (lo + hi) >> 1; if (a[i] <= s) lo = i; else hi = i; }
    t = (s - a[lo]) / Math.max(1e-9, a[hi] - a[lo]); o.x = p[lo].x + (p[hi].x - p[lo].x) * t; o.y = p[lo].y + (p[hi].y - p[lo].y) * t; o.z = p[lo].z + (p[hi].z - p[lo].z) * t; return o;
  }
  function feat(p, a, A) {                  // 가는 쪽: 뿌리 → A만큼 간 자리 · 뿌리 → 끝 (둘 다 길이 1)
    var o = { x: 0, y: 0, z: 0 }, f = new Float32Array(6), l; atArc(p, a, Math.min(A, a[p.length - 1]), o);
    f[0] = o.x - p[0].x; f[1] = o.y - p[0].y; f[2] = o.z - p[0].z; l = Math.hypot(f[0], f[1], f[2]) || 1; f[0] /= l; f[1] /= l; f[2] /= l;
    var e = p[p.length - 1]; f[3] = e.x - p[0].x; f[4] = e.y - p[0].y; f[5] = e.z - p[0].z; l = Math.hypot(f[3], f[4], f[5]) || 1; f[3] /= l; f[4] /= l; f[5] /= l;
    return f;
  }
  function fd(a, b) { return 0.5 * (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] + a[4] * b[4] + a[5] * b[5]); }
  function baseOf(sec) {                    // 그 구역의 펌·베이스 폭 → 직경 배수(기본 자리 = 1)
    if (!PC.lockBase) return 1;
    try {
      var d = SECTIONS[sec] && SECTIONS[sec].defaults ? +SECTIONS[sec].defaults.base : NaN, v = state.sections && state.sections[sec] ? +state.sections[sec].base : NaN;
      if (!(d >= 0)) d = 55; if (!(v >= 0)) return 1;
      var t = v >= d ? (v - d) / Math.max(1, 100 - d) : (v - d) / Math.max(1, d);
      return Math.pow(Math.max(1, PC.lockBaseMax), Math.max(-1, Math.min(1, t)));
    } catch (e) { return 1; }
  }
  function lockCmOf(sec) {
    var cm = PC.lockCm; if (S.rCm > 0) cm = 2 * S.rCm * PC.radiusK * PC.lockDia;
    return Math.max(PC.lockCmMin, Math.min(PC.lockCmMax, cm * baseOf(sec)));
  }
  function lockSig() {
    var a = [PC.lockPull, PC.lockTaper, PC.lockDia, PC.lockSmoothCm, PC.lockRootCm, PC.lockTaperCm, PC.lockDot, PC.lockCm, PC.lockCmMin, PC.lockCmMax, PC.radiusK, S.rCm || 0];
    try { if (PC.lockBase && state.sections) Object.keys(state.sections).sort().forEach(function (k) { a.push(k + '=' + (+baseOf(k)).toFixed(3)); }); } catch (e) {}
    return a.join(',');
  }
  /* (2026-10-10m) 사진의 타래 조각으로 묶기 — 42번이 곱슬 사진에서 찾은 조각(밝은 겉면, 앞으로 드러난 반 바퀴) 위를 지나는 가닥끼리 한 타래.
     가닥의 가운데 몇 점을 사진마다 비춰 보고(가려진 자리는 뺌) 가장 많이 걸린 (사진, 조각)을 그 가닥의 타래로. 못 찾으면 예전처럼 뿌리 칸. */
  var CK = null, nClump = 0;
  function prepClumps() {
    CK = null; nClump = 0;
    if (!PC.lockClumps || !G || typeof G.clumpsFor !== 'function') return;
    try {
      var photo = state._hair3Dneutral, probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe), E = getScalpEllipsoid();
      if (!probe || !probe.cams || !photo || !isFinite(photo.yTop)) return;
      var env = { CY: photo.CY, yTop: photo.yTop, a2: E.a * E.a, b2: E.b * E.b, c2: E.c * E.c, yBody: photo.CY - 0.7 * E.b }, views = [];
      probe.cams.forEach(function (c) {
        var cl = G.clumpsFor(c.angle), mi = state.hairMasks && state.hairMasks[c.angle];
        if (!cl || !mi || !(c.s > 0)) return;
        var kx0 = cl.W / (mi.w || cl.W), cmU0 = (typeof modelCmPerUnit === 'function' ? modelCmPerUnit() : 0) || 19.33;
        views.push({ c: c, cl: cl, kx: kx0, ky: cl.H / (mi.h || cl.H), cmPx: c.s * cmU0 / (kx0 || 1) });
      });
      if (views.length) CK = { env: env, views: views };
    } catch (e) { CK = null; }
  }
  var pj = [0, 0];
  function projectP(c, env, p) {                   // 60번과 같은 식(사진 카메라 · 두상 뒤로 가려지면 0)
    var R = c.R, x = p.x, y = p.y - env.CY, z = p.z;
    pj[0] = (R[0] * x + R[1] * y + R[2] * z) / c.s + c.cx;
    pj[1] = c.crownY + (env.yTop - ((R[3] * x + R[4] * y + R[5] * z) + env.CY)) / c.sy;
    if (R[6] * x + R[7] * y + R[8] * z < 0) {
      if (p.y < env.yBody) return 0;
      var dx = R[6], dy = R[7], dz = R[8], A = dx * dx / env.a2 + dy * dy / env.b2 + dz * dz / env.c2, B = 2 * (x * dx / env.a2 + y * dy / env.b2 + z * dz / env.c2), C = x * x / env.a2 + y * y / env.b2 + z * z / env.c2 - 0.96, D = B * B - 4 * A * C;
      if (D > 0 && (-B + Math.sqrt(D)) / (2 * A) > 1e-4) return 0;
    }
    return 1;
  }
  function clumpKey(p) {
    var votes = {}, best = 0, bk = 0, fr = PC.lockClumpFr, i, v, hitOf = {};
    for (i = 0; i < fr.length; i++) {
      var q = p[Math.min(p.length - 1, Math.round(fr[i] * (p.length - 1)))];
      for (v = 0; v < CK.views.length; v++) {
        var V = CK.views[v]; if (!projectP(V.c, CK.env, q)) continue;
        var lx = Math.floor(pj[0] * V.kx), ly = Math.floor(pj[1] * V.ky); if (lx < 0 || ly < 0 || lx >= V.cl.W || ly >= V.cl.H) continue;
        var lb = V.cl.lab[ly * V.cl.W + lx]; if (!(lb > 0)) continue;
        var key = (v + 1) * 40000 + lb; votes[key] = (votes[key] || 0) + 1; if (!hitOf[key]) hitOf[key] = { fr: fr[i], v: v }; if (votes[key] > best) { best = votes[key]; bk = key; }
      }
    }
    lastHit = best >= PC.lockClumpVotes ? hitOf[bk] : null;
    return best >= PC.lockClumpVotes ? bk : 0;
  }
  var lastHit = null;
  /* (2026-10-10b) 조각마다 컬 크기 — 조각 = 앞으로 드러난 반 바퀴(C·S자): 긴 축 길이(4σ) = 2.83 × 감기는 중심 반경 · 폭 = 타래 굵기 → 바깥 반경 = 길이 ÷ 2.83 + 폭 ÷ 2 (사진 조각 중앙값으로 약 1.2cm — 사진 전체 어림값과 비슷) */
  function clumpRcm(key) {
    if (!CK || !key) return 0;
    var v = Math.floor(key / 40000) - 1, lb = key % 40000, V = CK.views[v]; if (!V || !V.cl.len || !(lb > 0)) return 0;
    var r = (V.cl.len[lb] / 2.83 + V.cl.wid[lb] / 2) * V.cmPx * PC.clumpRK;   // 반원 점들의 긴 축 4σ = 2.83×중심 반경 · 바깥 반경 = 중심 반경 + 굵기 절반
    return r > 0 ? r : 0;
  }
  function buildLocks(model) {
    prepClumps(); var rOf = new Map(), rList = [];
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()), cu = cmU(), S0 = model.strands, n = S0.length, map = new Map(), cells = new Map(), i, s, p, k;
    var cmBy = {}, cmLo = Infinity, cmHi = 0, c;
    var A = 3 / cu, rootL = Math.max(1e-4, PC.lockRootCm / cu), tapL = Math.max(1e-4, PC.lockTaperCm / cu), recs = [];
    for (i = 0; i < n; i++) {
      s = S0[i]; p = s && s.pts; if (!p || p.length < 4 || !s.regrown) continue;
      var a = arcs(p); if (!(a[p.length - 1] > 1e-4)) continue;
      var sc = s.sec == null ? '' : s.sec; if (!(sc in cmBy)) { cmBy[sc] = lockCmOf(sc); cmLo = Math.min(cmLo, cmBy[sc]); cmHi = Math.max(cmHi, cmBy[sc]); }
      c = cmBy[sc] / cu;
      var ck = CK ? clumpKey(p) : 0; if (ck) { nClump++; var rc = clumpRcm(ck); if (rc > 0) { rOf.set(s, rc); rList.push(rc); } }
      var r = { s: s, p: p, a: a, f: feat(p, a, A) }; k = ck ? 'c' + ck : sc + '|' + Math.floor(p[0].x / c) + ',' + Math.floor(p[0].y / c) + ',' + Math.floor(p[0].z / c);
      var g = cells.get(k); if (!g) { g = []; cells.set(k, g); } g.push(r);
    }
    var locks = 0, moved = 0, o = { x: 0, y: 0, z: 0 }, EL = null, ECY = 0;
    try { EL = getScalpEllipsoid(); ECY = (typeof SCALP_CENTER_Y !== 'undefined' && isFinite(SCALP_CENTER_Y)) ? SCALP_CENTER_Y : (model.CY || 0); } catch (e) { EL = null; }
    function make(G0) {                      // 한 무리 → 길잡이를 뽑아 타래로 · 남은 가닥을 돌려줌
      var m = G0.length, lim = Math.min(m, 40), st = m / lim, best = -1, bi = 0, x, y, cnt;
      for (x = 0; x < lim; x++) { var ra = G0[Math.floor(x * st)]; cnt = 0; for (y = 0; y < lim; y++) if (fd(ra.f, G0[Math.floor(y * st)].f) >= 0.8) cnt++; ra.c = cnt; if (cnt > best) { best = cnt; bi = Math.floor(x * st); } }
      if (PC.lockSmoothCm > 0) { var bl = 0; for (x = 0; x < lim; x++) { var rb = G0[Math.floor(x * st)], ll = rb.a[rb.p.length - 1]; if (rb.c >= best * 0.8 && ll > bl) { bl = ll; bi = Math.floor(x * st); } } }
      var Ld = G0[bi], rest = [], mem = [], j;
      for (j = 0; j < m; j++) (fd(G0[j].f, Ld.f) >= PC.lockDot ? mem : rest).push(G0[j]);
      if (mem.length < 2) return rest.length === m ? [] : rest;
      // 길잡이의 길을 두 번 고르게(한 가닥의 잔 꺾임이 타래 전체에 복사되지 않게)
      var lp = Ld.p.map(function (q) { return { x: q.x, y: q.y, z: q.z }; }), ps, q;
      var nps = 2, kk0 = null, ekf = function (v) { var ex = v.x / EL.a, ey = (v.y - ECY) / EL.b, ez = v.z / EL.c; return Math.sqrt(ex * ex + ey * ey + ez * ez); };
      if (PC.lockSmoothCm > 0 && lp.length > 3) {
        var stp = Ld.a[lp.length - 1] / (lp.length - 1), sg = PC.lockSmoothCm / cu / Math.max(1e-6, stp); nps = Math.max(2, Math.min(600, Math.round(2 * sg * sg)));
        if (EL) { kk0 = lp.map(ekf); for (ps = 0; ps < 6; ps++) for (q = 1; q < kk0.length - 1; q++) kk0[q] = (kk0[q - 1] + 2 * kk0[q] + kk0[q + 1]) / 4; }   // 두피에서 뜬 높이(부피)는 지킴 — 살짝만 고름
      }
      for (ps = 0; ps < nps; ps++) for (q = 1; q < lp.length - 1; q++) { lp[q] = { x: (lp[q - 1].x + 2 * lp[q].x + lp[q + 1].x) / 4, y: (lp[q - 1].y + 2 * lp[q].y + lp[q + 1].y) / 4, z: (lp[q - 1].z + 2 * lp[q].z + lp[q + 1].z) / 4 }; }
      if (kk0) for (q = 1; q < lp.length; q++) {                                  // 편 길: 가는 쪽만 펴고 높이는 원래대로(두피 안으로도 안 들어감)
        var ek = ekf(lp[q]), tg = Math.max(1.012, kk0[q]);
        if (ek > 1e-6) { var em = tg / ek; lp[q] = { x: lp[q].x * em, y: ECY + (lp[q].y - ECY) * em, z: lp[q].z * em }; }
      }
      var la = arcs(lp), r0 = Ld.p[0], laL = la[lp.length - 1], rawL = Ld.a[Ld.p.length - 1], lk = PC.lockSmoothCm > 0 ? laL / Math.max(1e-9, rawL) : 1, tipM = { x: 0, y: 0, z: 0 };
      mem.forEach(function (rc) {
        var pp = rc.p, aa = rc.a, out = new Array(pp.length), dx = pp[0].x - r0.x, dy = pp[0].y - r0.y, dz = pp[0].z - r0.z, q2, sx, tp, w;
        out[0] = pp[0];
        for (q2 = 1; q2 < pp.length; q2++) {
          sx = aa[q2];
          if (PC.lockSmoothCm > 0) {
            if (sx <= rawL) atArc(lp, la, sx * lk, o);
            else { atArc(pp, aa, rawL, tipM); o.x = lp[lp.length - 1].x + (pp[q2].x - tipM.x); o.y = lp[lp.length - 1].y + (pp[q2].y - tipM.y); o.z = lp[lp.length - 1].z + (pp[q2].z - tipM.z); }   // 길잡이보다 긴 가닥: 남은 길은 제 모양대로 이어 감(곧은 막대가 되지 않게)
          } else atArc(lp, la, sx, o);
          tp = sx >= tapL ? PC.lockTaper : 1 - (1 - PC.lockTaper) * sx / tapL;
          w = PC.lockPull * Math.min(1, sx / rootL);
          out[q2] = { x: pp[q2].x + (o.x + dx * tp - pp[q2].x) * w, y: pp[q2].y + (o.y + dy * tp - pp[q2].y) * w, z: pp[q2].z + (o.z + dz * tp - pp[q2].z) * w };
        }
        map.set(rc.s, out); moved++;
      });
      locks++;
      return rest;
    }
    cells.forEach(function (g) { var rest = make(g); if (rest.length >= 2) make(rest); });
    if (!(cmHi > 0)) cmLo = cmHi = lockCmOf('');
    rList.sort(function (x, y) { return x - y; });
    lockMemo = { rOf: rOf, rMed: rList.length ? rList[rList.length >> 1] : 0, rP25: rList.length ? rList[Math.floor(rList.length * 0.25)] : 0, rP75: rList.length ? rList[Math.floor(rList.length * 0.75)] : 0, clumped: nClump, clumpViews: CK ? CK.views.length : 0, model: model, ver: lver, sig: lockSig(), map: map, n: n, locks: locks, moved: moved, cm: cmLo, cmHi: cmHi, per: moved / Math.max(1, locks), ms: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0 };
    try { if (nClump) console.log(TAG + ' 타래 뼈대 — 사진 타래 조각으로 묶은 가닥 ' + nClump + '/' + n + ' · 타래 ' + locks + '개 · 조각 크기 반경(25/50/75%) ' + (lockMemo.rMed ? lockMemo.rP25.toFixed(1) + '/' + lockMemo.rMed.toFixed(1) + '/' + lockMemo.rP75.toFixed(1) + 'cm' : '-') + ' · 사진 전체 반경 ' + (S.rCm > 0 ? (+S.rCm).toFixed(1) + 'cm' : '-')); } catch (e) {}
    return lockMemo;
  }
  function lockedPts(s) {
    var m = G && G.model; if (!m || !m.strands) return null;
    var sg = lockSig();
    if (lockMemo.model !== m || lockMemo.ver !== lver || lockMemo.sig !== sg) { try { buildLocks(m); } catch (e) { S.err = '타래 만들기: ' + (e && e.message || e); lockMemo = { model: m, ver: lver, sig: sg, map: new Map(), n: 0, locks: 0, moved: 0, ms: 0 }; } }
    return lockMemo.map.get(s) || null;
  }
  PC._locks = function () { return lockMemo; };
  var innerAdj = W.adjustStrandGeom, curS = null;
  if (typeof innerAdj === 'function') W.adjustStrandGeom = function (s) {
    if (s && s.regrown && !s.mannequin && s.pts && PC.lock && lookActive()) {
      var lp = lockedPts(s);
      if (lp) { var keepP = s.pts, keepC = curS; s.pts = lp; curS = s; try { return innerAdj.apply(this, arguments); } finally { s.pts = keepP; curS = keepC; } }
    }
    return innerAdj.apply(this, arguments);
  };

  var innerCurl = W.curlStrand3D;
  /* ④ (2026-10-10t) 원본 = 맨 마네킹 + 잰 컬 — 사용자: "이제는 값을 좀 더 정밀하게 받으니까 마네킨 모드에 다시 올려보자"
   *  예전에 컬 손님을 마네킹에 올렸을 때 부피가 죽은 원인(컬 엔진으로 직접 잼 · 30cm 직모 · 컬 82):
   *    엔진 기본값은 끝에서 20cm만 감음(windCm 20) → 뿌리에서 17cm는 곧은 채 · 반경도 가닥마다 흩어짐.
   *  지금: 원본(마네킹+스펙)을 볼 때만 · 스펙의 컬이 lookMinCurl 이상이고 잰 반경이 있으면
   *    · 뿌리부터 끝까지 감음(windCm 99 · rootLeaveCm 1) · 뭉침 모양(look)
   *    · 웨이브 = 엔진이 잰 반경을 내는 값, 한 바퀴 간격(pitchThick) = 잰 간격을 내는 값 — 엔진을 직선 가닥에 돌려 이분법으로 찾음(값마다 한 번)
   *    · 감으면 줄어드는 만큼 미리 늘림(엔진으로 잰 남는 비율) → 겉 길이 = 스펙 길이 */
  PC.mq = true; PC.mqVolCut = true; PC.mqVolKeepCm = 1; PC.mqWind = 999; PC.mqRootLeave = 1; PC.mqStretch = true;
  var mqMemo = { key: '', wave: null, pt: null, remain: 1, r: null, P: null }, mqS = PC.mqStats = { calls: 0, solved: '' };
  function origSpec() {
    try { var OM = W.ORIG_MQ; if (!OM || !OM.on || !mqOn() || typeof OM.isOriginal !== 'function' || !OM.isOriginal()) return null; var sp = OM.spec, pm = sp && sp.perm; return (pm && pm.curl >= PC.lookMinCurl && pm.rCm > 0) ? pm : null; } catch (e) { return null; }
  }
  function engineOn(C, w, pt) {                // 직선 30cm 가닥에 엔진을 돌려 반경·간격·남는 비율을 잼
    var CB = CURL_BUNDLE, cm = CB.cmPerUnit || 19.33, L = 30 / cm, n = 300, g = [], i, k, sv = {}, o = {}, p;
    for (k in PC.look) o[k] = PC.look[k]; o.windCm = PC.mqWind; o.rootLeaveCm = PC.mqRootLeave; if (pt != null) o.pitchThick = pt;
    for (i = 0; i <= n; i++) g.push({ x: 0, y: -i * L / n, z: 0.4 });
    for (k in o) { sv[k] = CB[k]; CB[k] = o[k]; }
    try { p = innerCurl(g, C, w / 100, 0); } finally { for (k in sv) CB[k] = sv[k]; }
    var m = p.length, R = [], H = Math.max(5, Math.round(m / 40)), zc = [];
    for (i = H; i < m - H; i++) { var ax = 0, az = 0, j; for (j = i - H; j <= i + H; j++) { ax += p[j].x; az += p[j].z; } ax /= 2 * H + 1; az /= 2 * H + 1; R.push(Math.hypot(p[i].x - ax, p[i].z - az) * cm); }
    R.sort(function (x, y) { return x - y; });
    // (2026-10-11c) 한 바퀴 간격 — 가닥 축(이동 평균)에서 벗어난 x가 부호를 바꾸는 자리로 셈(예전: x=0 기준이라 축이 옆으로 흐르면 못 셌음 → 간격 값이 끝까지 올라가 웨이브가 풀림)
    var dxs = new Float64Array(m);
    for (i = 0; i < m; i++) { var lo2 = Math.max(0, i - H), hi2 = Math.min(m - 1, i + H), sx = 0, j2; for (j2 = lo2; j2 <= hi2; j2++) sx += p[j2].x; dxs[i] = p[i].x - sx / (hi2 - lo2 + 1); }
    for (i = H + 1; i < m - H; i++) if (dxs[i] * dxs[i - 1] < 0) zc.push(p[i].y);
    return { r: R.length ? R[R.length >> 1] : 0, P: zc.length > 3 ? (zc[1] - zc[zc.length - 1]) / ((zc.length - 2) / 2) * cm : NaN, remain: (p[0].y - p[m - 1].y) * cm / 30 };
  }
  function mqSolve(C, rT0, PT0) {
    var key = [C, rT0.toFixed(2), PT0 ? PT0.toFixed(2) : '-', PC.mqWind, PC.mqRootLeave, JSON.stringify(PC.look)].join('|');
    if (mqMemo.key === key) return mqMemo;
    // (2026-10-11a) 엔진이 낼 수 있는 가장 굵은 반경보다 굵으면(굵은 웨이브 3.9cm 등) 가닥을 ks배 줄여서 감고 다시 키움 — 반경·간격이 같이 ks배
    var eMax = engineOn(C, 100, null), ks = (eMax.r > 0 && rT0 > eMax.r * 0.9) ? rT0 / (eMax.r * 0.9) : 1;
    var rT = rT0 / ks, PT = PT0 ? PT0 / ks : PT0;
    var lo = 0, hi = 100, i, e, w = 50;
    for (i = 0; i < 9; i++) { w = (lo + hi) / 2; e = engineOn(C, w, null); if (e.r < rT) lo = w; else hi = w; }
    w = Math.round((lo + hi) / 2);
    var pt = PC.look.pitchThick || 1.4;
    if (PT > 0) { var a = 0.2, b = 6; for (i = 0; i < 9; i++) { pt = Math.sqrt(a * b); e = engineOn(C, w, pt); if (!(e.P > 0)) { b = pt; continue; } if (e.P < PT) a = pt; else b = pt; } pt = Math.sqrt(a * b); }   // 간격을 못 재면(감기지 않음) 더 촘촘한 쪽으로
    e = engineOn(C, w, pt);
    mqMemo = { key: key, wave: w, pt: pt, ks: ks, remain: Math.max(0.12, Math.min(1, e.remain)), r: e.r * ks, P: e.P * ks };
    mqS.solved = '컬 ' + C + ' · 잰 반경 ' + rT0.toFixed(2) + 'cm' + (PT0 ? ' · 잰 간격 ' + PT0.toFixed(1) + 'cm' : '') + ' → 웨이브 ' + w + ' · 간격 값 ' + pt.toFixed(2) + (ks > 1 ? ' · 가닥을 1/' + ks.toFixed(2) + '로 줄여 감고 다시 키움' : '') + ' (엔진: 반경 ' + (e.r * ks).toFixed(2) + ' · 간격 ' + (e.P > 0 ? (e.P * ks).toFixed(1) : '-') + 'cm · 남는 길이 ' + e.remain.toFixed(2) + ')';
    try { console.log(TAG + ' ④ 마네킹 위 잰 컬 — ' + mqS.solved); } catch (e2) {}
    return mqMemo;
  }
  /* (2026-10-11c) ② 사진 결을 따라 그은 선으로 잰 모양(66번) — 웨이브(S자)면 나선 대신 납작한 물결로
   *  사용자: "완전히 말린 컬이 아닌데, 계속 말려서 나와" · "방향필터가 있는데 이거 구분해서 해야돼?"
   *  사진 4장의 선: 고리 정도(0=S자 · 1=고리) · 파장 · 진폭 → 고리 정도 waveLoopMax 미만이면 웨이브.
   *  물결: 축(마네킹 가닥)을 따라 진폭 × sin(2π·호길이/파장 + 위상) 만큼 옆(두상 면에 나란한 방향)으로 흔듦. 뿌리 waveRootCm는 서서히.
   *  위상은 2cm 칸마다 같게(한 타래가 같이 출렁임) · 겉 길이 = 축 길이(스펙 길이). */
  PC.waveMode = true; PC.waveLoopMax = 0.33; PC.waveRootCm = 2; PC.waveLockCm = 2; PC.waveJitter = 0.35;
  var wsMemo = { key: '', v: null };
  function waveShape() {
    var key = ''; try { key = (state._hair3Dneutral ? 1 : 0) + '|' + (G && G.model ? G.model.strands.length : 0); } catch (e) {}
    if (wsMemo.key === key && wsMemo.v) return wsMemo.v;
    var loops = [], lams = [], amps = [], views = [], byView = {}, nAll = 0;
    (typeof ANGLES !== 'undefined' ? ANGLES : ['front', 'left', 'right', 'back']).forEach(function (a) {
      try {
        var id = state.hairMasks && state.hairMasks[a] && state.hairMasks[a].identity, ws = id && id.waveShape; if (!ws || !(ws.bent >= 20)) return;
        var cpp = G && G.cmPerMaskPx ? G.cmPerMaskPx(a) : null; if (!(cpp > 0)) return;
        if (isFinite(ws.loop)) loops.push(ws.loop); if (isFinite(ws.lamPx)) lams.push(ws.lamPx * cpp); if (isFinite(ws.ampPx)) amps.push(ws.ampPx * cpp);
        if (ws.all && ws.all.length) { byView[a] = ws.all.map(function (l) { return [l[0], l[1], l[2] * cpp, l[3] * cpp, l[4], l[5]]; }); nAll += ws.all.length; }
        views.push(a + ' 고리 ' + (+ws.loop).toFixed(2) + ' · 파장 ' + (ws.lamPx * cpp).toFixed(1) + ' · 진폭 ' + (ws.ampPx * cpp).toFixed(2) + 'cm');
      } catch (e) {}
    });
    function med(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a.length ? a[a.length >> 1] : NaN; }
    var v = { loop: med(loops), lamCm: med(lams), ampCm: med(amps), views: views, byView: byView, nAll: nAll };
    v.isWave = isFinite(v.loop) && v.loop < PC.waveLoopMax && v.lamCm > 1 && v.ampCm > 0.05;
    wsMemo = { key: key, v: v };
    try { console.log(TAG + ' ② 사진 선 모양 — ' + (v.isWave ? '웨이브(S자)' : '컬(고리)') + ' · 고리 정도 ' + (+v.loop).toFixed(2) + '(웨이브 기준 ' + PC.waveLoopMax + ' 미만) · 파장 ' + (+v.lamCm).toFixed(1) + 'cm · 진폭 ' + (+v.ampCm).toFixed(2) + 'cm · ' + views.join(' | ')); } catch (e) {}
    return v;
  }
  PC.waveShape = waveShape;
  function hash3(x, y, z) { var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
  function waveStrand(g, A, lam) {
    var cpu = (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33, Au = A / cpu, Lu = lam / cpu, ru = PC.waveRootCm / cpu;
    var CY0 = 0; try { CY0 = (G && G.model && G.model.CY) || (state._hair3Dneutral && state._hair3Dneutral.CY) || 0; } catch (e) {}
    var S = [0], i; for (i = 1; i < g.length; i++) S.push(S[i - 1] + Math.hypot(g[i].x - g[i - 1].x, g[i].y - g[i - 1].y, g[i].z - g[i - 1].z));
    var Ltot = S[S.length - 1]; if (!(Ltot > 1e-6)) return g;
    var cell = PC.waveLockCm / cpu, r0 = g[0], ph = 2 * Math.PI * hash3(Math.floor(r0.x / cell), Math.floor(r0.y / cell), Math.floor(r0.z / cell)) + PC.waveJitter * (hash3(r0.x * 91, r0.y * 37, r0.z * 53) - 0.5);
    var ds = Math.min(Lu / 24, Ltot / 6), m = Math.max(3, Math.ceil(Ltot / ds) + 1), out = [], j = 0;
    for (i = 0; i < m; i++) {
      var s = Math.min(Ltot, i * ds); while (j < g.length - 2 && S[j + 1] < s) j++;
      var u = (s - S[j]) / Math.max(1e-12, S[j + 1] - S[j]), a = g[j], b = g[j + 1];
      var px = a.x + (b.x - a.x) * u, py = a.y + (b.y - a.y) * u, pz = a.z + (b.z - a.z) * u;
      var tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z, tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      var ox = px, oy = py - CY0, oz = pz, ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
      var bx = ty * oz - tz * oy, by = tz * ox - tx * oz, bz = tx * oy - ty * ox, bl = Math.hypot(bx, by, bz);
      if (!(bl > 1e-6)) { bx = 1; by = 0; bz = 0; bl = 1; } bx /= bl; by /= bl; bz /= bl;
      var w = rootW(s, cpu);
      var off = Au * w * Math.sin(2 * Math.PI * s / Lu + ph);
      out.push({ x: px + bx * off, y: py + by * off, z: pz + bz * off });
    }
    return out;
  }
  /* (2026-10-11d) 기준선 없이 컬 모양 — 사용자: "기준을 두지 않고 결흐름대로만" · "웨이브 판정 이거 아직 판정해야돼?"
   *  얼마나 고리인가 w(0 = 납작한 S자 · 1 = 둥근 나선)를 사진 선의 두 값으로 정함: 고리 정도(0.15→0 · 0.5→1)와 가파름(진폭÷파장 0.06→0 · 0.15→1)의 평균.
   *  크기·간격은 w만큼 나선 측정(42번 반경·한 바퀴)에서, 1−w만큼 사진 선(진폭·파장)에서. 앞뒤(두상 바깥) 굴곡 = 크기 × w.
   *  사진 선이 없으면 나선 측정만(w=1). 위상은 뿌리 자리의 부드러운 함수(칸 경계 없음 — 두상 위 격자 줄 고침) + 가닥마다 조금. */
  PC.shapeMode = true; PC.shapeLoop = [0.15, 0.5]; PC.shapeSteep = [0.06, 0.15]; PC.shapeRootCm = 1.5; PC.phaseWaveCm = 7; PC.phaseJit = 0.5; PC.phaseJitAsIs = 2.0;   // (2026-10-12g) 방향 필터 그대로일 때 가닥마다 흩는 위상(라디안) — 0.5면 이웃 가닥이 같은 자리에서 같이 출렁여 겹쳐 보임(뭉침 · 가닥 수가 적어 보임)
  /* (2026-10-12e) 읽은 굴곡 그대로 — 42번이 모아 둔 '읽은 굴곡 장'을 원본 머리(마네킹 + 스펙) 가닥에 얹고, 지어낸 웨이브는 "못 읽은 만큼만" 채움
       자리 p에서:  가닥 = 뼈대 + gain × D(p) + (1 − gain × aC(p) ÷ 잰 굴곡 크기) × 지어낸 굴곡
         D = 그 자리에서 읽은 벗어남(이웃 가닥이 같이 굽은 것만 남음) · aC = 그 크기
         gain = 잰 굴곡 크기(③) ÷ 읽은 굴곡의 크기(걸음이 넓어 읽은 굴곡이 실제보다 작게 잡히는 것을 사진 값으로 맞춤 · 1~readGainMax)
       장이 모르는 자리(가닥이 안 지나간 곳)·못 읽은 자리(가닥마다 제각각 = 잔 컬)는 D ≈ 0 · aC ≈ 0 → 지금처럼 잰 값으로 지어낸 굴곡.
       기본은 꺼짐 — 주소 끝에 ?rw=1 을 붙이거나 콘솔에서 PHOTO_CURL.readWave=true 후 PHOTO_CURL.refresh() (같은 올림으로 켠 것·끈 것을 바로 비교) */
  PC.readWave = false; PC.readGainMax = 2.5; PC.readFill = true;
  /* (2026-10-12f) 방향 필터에서 읽은 첫 값 그대로 — 사용자: "웨이브와 컬이 방향필터에서 읽어낸 초기 정보 그대로 그려지도록 해줘. roots 고르게 펴주고"
   *  예전(11d): 크기·간격을 사진 선(66번)과 42번 나선 측정 사이에서 섞음(w) → 사진에서 읽은 웨이브가 나선 값에 끌려 굵거나 가늘게 나옴.
   *  지금: 사진 선이 있으면 크기 = 66번 진폭 · 한 번 = 66번 파장 · 앞뒤 굴곡(S자 ↔ 고리) = 66번 고리 정도만으로. 나선 측정·표(table)는 안 섞음.
   *        다시 기른 머리 화면(뭉침 모양이 걸리는 쪽)에서도 같은 식으로 그림(사진 선이 있을 때). 사진 선이 없으면 예전 그대로.
   *  뿌리: 모든 가닥이 뿌리에서 rootStraightCm 만큼은 곧게(굴곡 0) · 그 뒤 shapeRootCm에 걸쳐 같은 곡선으로 서서히 — 읽은 굴곡 장(⑤)도 같은 비율로.
   *  예전 = PHOTO_CURL.gaborAsIs=false; PHOTO_CURL.rootStraightCm=0 후 PHOTO_CURL.refresh() */
  PC.gaborAsIs = true; PC.rootStraightCm = 1.0; PC.gaborPitchFromHelix = true;
  function rootW(s, cpu) {                                                // 뿌리 펴기 — 모든 가닥 같은 곡선(곧게 rootStraightCm → shapeRootCm에 걸쳐 0→1)
    var s0 = (PC.rootStraightCm || 0) / cpu, rr = Math.max(1e-6, (PC.shapeRootCm || 0) / cpu), w = (s - s0) / rr;
    if (w <= 0) return 0; if (w >= 1) return 1; return w * w * (3 - 2 * w);
  }
  function gaborOK() { if (!PC.gaborAsIs) return false; var ws = waveShape(); return !!(ws && isFinite(ws.loop) && ws.lamCm > 0 && ws.ampCm > 0); }
  PC.gaborOK = gaborOK;
  try { var rwQ = /[?&]rw=([0-9.]+)/.exec(String(location.search || '')); if (rwQ) PC.readWave = +rwQ[1] > 0; } catch (e) {}
  var rwMemo = { wf: null, gain: 1, lineU: 0 };
  function readField(SH, cpu) {
    if (!PC.readWave || !G || typeof G.waveField !== 'function') return null;
    var wf = G.waveField(); if (!wf || !(wf.known > 0)) return null;
    var lineCm = SH.A, lineU = lineCm / cpu;   // 목표 크기 = ③에서 정한 굴곡 크기(사진 선 진폭과 나선 반경을 섞은 값 — 지어낸 굴곡이 쓰는 것과 같은 값)
    if (rwMemo.wf !== wf || rwMemo.lineU !== lineU) {
      var g0 = wf.ampU > 1e-9 ? lineU / wf.ampU : 1; g0 = Math.max(1, Math.min(PC.readGainMax, g0));
      rwMemo = { wf: wf, gain: g0, lineU: lineU };
      mqS.readTxt = '잰 굴곡 크기 ' + lineCm.toFixed(2) + 'cm ÷ 읽은 굴곡 ' + (wf.ampU * cpu).toFixed(2) + 'cm → ×' + g0.toFixed(2); mqS.readPts = 0; mqS.readFillSum = 0; mqS.readKnown = 0;
      try { console.log(TAG + ' ⑤ 읽은 굴곡 그대로 — ' + mqS.readTxt + ' · 아는 칸 ' + wf.known); } catch (e) {}
    }
    return rwMemo;
  }
  var bsMemo = { key: '', v: null };
  function blendShape(pm) {
    pm = pm || {}; var key = ''; try { key = [pm.rCm, pm.pitchCm, wsMemo.key, PC.gaborAsIs ? 'g' : ''].join('|'); } catch (e) {}
    var ws = waveShape();
    if (bsMemo.key === key + '|' + (ws ? ws.loop : '') && bsMemo.v) return bsMemo.v;
    var rH = pm.rCm > 0 ? pm.rCm * PC.radiusK : null, pH = pm.pitchCm > 0 ? pm.pitchCm : (rH ? rH * 2 : null), w = 1, A, L, src;
    function cl(x) { return Math.max(0, Math.min(1, x)); }
    if (PC.gaborAsIs && ws && isFinite(ws.loop) && ws.lamCm > 0 && ws.ampCm > 0) {
      // (2026-10-12g) 옆에서 찍은 사진에서 나선(컬)은 S자로 비칩니다 — 고리 정도만으로는 컬을 못 가림(짧은 곱슬 손님: 고리 0.29 → 웨이브로만 나옴).
      //   같은 사진 선의 가파름(진폭 ÷ 파장)이 크면 나선 — 둘 중 큰 쪽. 1이면 둥근 나선(반경 = 진폭 · 한 바퀴 = 파장), 0이면 납작한 S자.
      var wl0 = cl((ws.loop - PC.shapeLoop[0]) / (PC.shapeLoop[1] - PC.shapeLoop[0])), ws0 = cl((ws.ampCm / ws.lamCm - PC.shapeSteep[0]) / (PC.shapeSteep[1] - PC.shapeSteep[0]));
      w = Math.max(wl0, ws0);
      A = ws.ampCm; L = ws.lamCm; src = '방향 필터 그대로';
      // (2026-10-12h) 컬 쪽(w)은 한 바퀴 길이만 나선 측정으로 — 방향 필터 선은 촘촘한 컬의 꺾임을 따라가지 못해 큰 흐름의 굴곡을 잼(짧은 곱슬: 선 5.2cm · 나선 측정 2.1~2.7cm → 늘어난 스프링 = 웨이브로 보임)
      if (PC.gaborPitchFromHelix && pH > 0) { L = (1 - w) * ws.lamCm + w * pH; src = '방향 필터 그대로 · 한 바퀴는 나선 측정 ×' + w.toFixed(2); }
    } else if (ws && isFinite(ws.loop) && ws.lamCm > 0 && ws.ampCm > 0) {
      var wl = cl((ws.loop - PC.shapeLoop[0]) / (PC.shapeLoop[1] - PC.shapeLoop[0])), stp = ws.ampCm / ws.lamCm, wsx = cl((stp - PC.shapeSteep[0]) / (PC.shapeSteep[1] - PC.shapeSteep[0]));
      w = (wl + wsx) / 2;
      A = rH ? (1 - w) * ws.ampCm + w * rH : ws.ampCm; L = pH ? (1 - w) * ws.lamCm + w * pH : ws.lamCm; src = '사진 선 + 나선 측정';
    } else if (rH && pH) { A = rH; L = pH; src = '나선 측정만'; }
    else return null;
    var v = { A: A, L: L, w: w, depth: w, pH: pH, gab: (PC.gaborAsIs && ws && ws.byView && ws.nAll > 0) ? ws : null };
    bsMemo = { key: key + '|' + (ws ? ws.loop : ''), v: v };
    mqS.shapeTxt = '고리 정도 ' + (ws ? (+ws.loop).toFixed(2) : '-') + ' · 가파름 ' + (ws ? (ws.ampCm / ws.lamCm).toFixed(3) : '-') + ' → 나선 쪽 ' + w.toFixed(2) + ' · 크기 ' + A.toFixed(2) + 'cm · 한 번 ' + L.toFixed(1) + 'cm · 앞뒤 굴곡 ×' + w.toFixed(2) + ' (' + src + ')';
    try { console.log(TAG + ' ③ 컬 모양(기준선 없음) — ' + mqS.shapeTxt); } catch (e) {}
    return v;
  }
  function smoothPhase(r0, waveCm) {                                      // 자리에 따라 부드럽게 바뀌는 위상(파장 phaseWaveCm · 주면 그 값)
    var cpu = (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33, k = 2 * Math.PI / ((waveCm > 0 ? waveCm : PC.phaseWaveCm) / cpu);
    return Math.PI * (Math.sin(r0.x * k + 1.3) + Math.sin(r0.y * k * 0.83 + 2.1) + Math.sin(r0.z * k * 1.17 + 0.4)) + (PC.gaborAsIs ? PC.phaseJitAsIs : PC.phaseJit) * (hash3(r0.x * 91, r0.y * 37, r0.z * 53) - 0.5);
  }
  /* (2026-10-12i) 선 하나하나 그대로 — 사용자: "정보를 중앙값만 갖고 오지 말고 다 가져와 · 머리가 밧줄처럼 일자 · 굴곡지면서 퍼져야"
   *  가닥마다: 뿌리 방위로 그 자리를 마주 본 사진을 고르고(앞·뒤·옆) · 가닥을 위→아래 5칸으로 나눠 칸마다 그 사진의 같은 높이에서 그은 선 하나를 뽑음(가닥마다 다른 선)
   *    → 파장·진폭이 가닥마다·높이마다 사진대로 다름(곧은 선을 뽑은 칸은 굴곡 0 · 뿌리 쪽이 곧고 끝으로 갈수록 크게 출렁이는 모양이 사진에서 그대로)
   *  물결 면을 가닥(뿌리 자리)마다 돌림: 옆으로만 흔들리던 것(밧줄) → 옆·바깥 사이 어느 면 → 머리가 바깥으로 퍼짐
   *  끄기 PHOTO_CURL.gaborAll=false 후 PHOTO_CURL.refresh() */
  PC.ptsPerWave = 8; PC.maxPts = 120;   // (2026-10-12n) 한 번 굽는 길이에 찍는 점 수(24 → 12) · 가닥당 점 상한 — 긴 웨이브 3만 가닥에서 점이 150개씩이라 3D 완성본 만드는 데 10초
  PC.lockDiaAsIs = 1.0; PC.lockMinCmAsIs = 0.8;   // (2026-10-12m) 사진: 덜 뭉친 타래로 고리 — 같은 위상으로 도는 자리 크기 = 컬 지름 × 이 값(작을수록 타래가 가늘고 많아짐)
  PC.gaborAll = true; PC.gaborBins = 5; PC.gaborBinTol = [0.12, 0.25];
  function viewForRoot(r) {
    var CY0 = 0; try { CY0 = (G && G.model && G.model.CY) || (state._hair3Dneutral && state._hair3Dneutral.CY) || 0; } catch (e) {}
    var az = Math.atan2(r.x, r.z) * 180 / Math.PI, a = Math.abs(az);
    return a < 45 ? 'front' : a > 135 ? 'back' : (az > 0 ? 'left' : 'right');
  }
  function profileFor(r0, SH) {
    var bv = SH.gab.byView, v = viewForRoot(r0), Ls = bv[v] || bv.front || bv.back || bv.left || bv.right; if (!Ls || !Ls.length) return null;
    var nb = PC.gaborBins, A = [], L = [], b, lamMed = SH.gab.lamCm > 0 ? SH.gab.lamCm : SH.L;
    for (b = 0; b < nb; b++) {
      var fc = (b + 0.5) / nb, pick = null, k, t, cand;
      for (t = 0; t < PC.gaborBinTol.length && !pick; t++) {
        cand = Ls.filter(function (l) { return Math.abs(l[0] - fc) < PC.gaborBinTol[t]; });
        if (cand.length >= 3) pick = cand;
      }
      if (!pick) pick = Ls;
      k = Math.floor(hash3(r0.x * 53 + b * 7.1, r0.y * 17 + b, r0.z * 29) * pick.length) % pick.length;
      var l = pick[k];
      if (l[5] || !(l[3] > 0)) { A.push(0); L.push(lamMed); }
      else { A.push(l[3]); L.push(l[2] > 1 ? l[2] : lamMed); }
    }
    return { A: A, L: L, view: v };
  }
  function shapeStrand(g, SH) {
    if (PC.gaborAll && SH.gab) { var rA = shapeStrandAll(g, SH); if (rA) return rA; }
    var cpu = (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33, Au = SH.A / cpu, Lu = SH.L / cpu, ru = PC.shapeRootCm / cpu;
    var CY0 = 0; try { CY0 = (G && G.model && G.model.CY) || (state._hair3Dneutral && state._hair3Dneutral.CY) || 0; } catch (e) {}
    var S = [0], i; for (i = 1; i < g.length; i++) S.push(S[i - 1] + Math.hypot(g[i].x - g[i - 1].x, g[i].y - g[i - 1].y, g[i].z - g[i - 1].z));
    var Lt = S[S.length - 1]; if (!(Lt > 1e-6)) return g;
    var ph = smoothPhase(g[0]), ds = Math.min(Lu / 24, Lt / 6), m = Math.max(3, Math.ceil(Lt / ds) + 1), out = [], j = 0;
    var RW = readField(SH, cpu), fo = RW ? { x: 0, y: 0, z: 0, a: 0, k: 0 } : null, fill, rx, ry, rz;
    for (i = 0; i < m; i++) {
      var s = Math.min(Lt, i * ds); while (j < g.length - 2 && S[j + 1] < s) j++;
      var u = (s - S[j]) / Math.max(1e-12, S[j + 1] - S[j]), a = g[j], b = g[j + 1];
      var px = a.x + (b.x - a.x) * u, py = a.y + (b.y - a.y) * u, pz = a.z + (b.z - a.z) * u;
      var tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z, tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      var ox = px, oy = py - CY0, oz = pz, od = ox * tx + oy * ty + oz * tz; ox -= od * tx; oy -= od * ty; oz -= od * tz;   // 바깥 방향(축에 수직으로)
      var ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
      var bx = ty * oz - tz * oy, by = tz * ox - tx * oz, bz = tx * oy - ty * ox, bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
      var wr = rootW(s, cpu);
      var t = 2 * Math.PI * s / Lu + ph, c1 = Au * wr * Math.cos(t), c2 = Au * wr * SH.depth * Math.sin(t);
      fill = 1; rx = ry = rz = 0;
      if (RW) {
        RW.wf.at(px, py, pz, fo); rx = RW.gain * wr * fo.x; ry = RW.gain * wr * fo.y; rz = RW.gain * wr * fo.z;
        if (PC.readFill) fill = Math.max(0, Math.min(1, 1 - RW.gain * fo.a / Math.max(1e-9, RW.lineU)));
        mqS.readPts++; mqS.readFillSum += fill; if (fo.k > 0.5) mqS.readKnown++;
      }
      out.push({ x: px + rx + fill * (bx * c1 + ox * c2), y: py + ry + fill * (by * c1 + oy * c2), z: pz + rz + fill * (bz * c1 + oz * c2) });
    }
    return out;
  }
  /* (2026-10-12q) 컬 타래 — 사용자: "컬이 철사가 됐어. 가닥끼리 모여서 타래가 되면 좋을텐데"
   *  컬(나선 쪽 lockW 이상)이면 뿌리를 "컬 지름 × lockDiaAsIs" 칸으로 묶어 한 칸 = 한 타래: 같은 사진 선(파장·진폭) · 같은 위상 · 같은 감는 면으로 감음(가닥마다 위상만 lockJit 조금).
   *  68번이 같은 칸의 가닥들을 그 칸 대표 길(본보기 하나)로 모음 → 축이 나란해서 같이 감겨 타래가 됨. 끄기 PHOTO_CURL.lockMode=false */
  /* (2026-10-12s) 타래 = 사진에서 읽은 타래 조각(42번 clumpsFor) — 사용자: "묶도록 짜는 게 아니고, 결을 읽을 때 그렇게 읽어야" · 격자 칸(12q)은 뺌
   *  68번이 기른 가닥마다 그 가닥이 지나간 사진 조각(clumpOfPath · 10/10m과 같은 투표)을 붙여 두고, 옮겨심을 때 넘겨줌(LK).
   *  같은 조각 = 같은 사진 선 · 같은 위상 · 같은 감는 면 · 컬 크기 = 그 조각에서 잰 반경 · 조각에 안 걸린 가닥은 제 뿌리 그대로(묶지 않음). 끄기 PHOTO_CURL.lockMode=false */
  PC.lockMode = true; PC.lockW = 0.6; PC.lockJit = 0.35; PC.lockRFromClump = true;
  var ckPhoto = null;
  PC.clumpOfPath = function (p) {
    try {
      if (!p || p.length < 4) return null;
      var ph = state._hair3Dneutral; if (ckPhoto !== ph) { prepClumps(); ckPhoto = ph; }
      if (!CK) return null;
      var k = clumpKey(p); if (!k) return null;
      var o = { key: k, rCm: clumpRcm(k) };
      if (lastHit) { var R = CK.views[lastHit.v].c.R; o.frac = lastHit.fr; o.dir = [R[6], R[7], R[8]]; }   // (2026-10-12u) 조각을 본 사진 · 그 가닥이 조각을 지난 자리 — 그 자리에서 고리가 그 사진 쪽으로 드러나 있었음(조각 = 앞으로 드러난 반 바퀴)
      return o;
    } catch (e) { return null; }
  };
  PC.lockOn = function () { try { var SH = blendShape(origSpec() || {}); return !!(PC.lockMode && SH && SH.w >= PC.lockW); } catch (e) { return false; } };
  /* (2026-10-12w) 자리 그대로 옮기기 — 사용자: "모양은 살았는데, 위치가 같진 않네"
   *  원본 머리를 그릴 때 가닥마다 실제로 쓴 값(높이 5칸의 크기·한 번 길이 · 뿌리에서의 위상 · 감는 면)을 두피 칸(두피 타원의 위도 NP × 경도 NT · 48×24)마다 모아 둠.
   *  스타일에 실어(exportShape · cells) 받는 손님은 뿌리의 두피 칸 값을 그대로 씀 → 같은 자리에서 같은 쪽으로 굽음. 칸 안 가닥끼리 위상이 흩어진 정도(원 평균 길이 R)도 읽어 그만큼만 흩음.
   *  칸에 값이 없으면 예전(선 묶음에서 고름) · 끄기 PHOTO_CURL.cellMode=false */
  PC.cellMode = true; PC.cellNT = 48; PC.cellNP = 24;   // 칸 ≈ 1.2cm(두피 둘레 기준)
  var CELLREC = { photo: null, m: new Map() };
  function scalpCell(r0, CYc) {
    try {
      var E = getScalpEllipsoid(); if (!E || !(E.a > 0)) return -1;
      var cy = Math.max(-1, Math.min(1, (r0.y - CYc) / E.b)), ph = Math.acos(cy), th = Math.atan2(r0.x / E.a, r0.z / E.c);
      var r = Math.max(0, Math.min(PC.cellNP - 1, Math.floor(ph / Math.PI * PC.cellNP))), c = Math.floor((th + Math.PI) / (2 * Math.PI) * PC.cellNT); c = ((c % PC.cellNT) + PC.cellNT) % PC.cellNT;
      return r * PC.cellNT + c;
    } catch (e) { return -1; }
  }
  function recordCell(ci, PF, t0, phi) {
    if (ci < 0) return;
    var ph = state._hair3Dneutral; if (CELLREC.photo !== ph) { CELLREC.photo = ph; CELLREC.m = new Map(); }
    var c = CELLREC.m.get(ci); if (!c) { c = { n: 0, A: [0, 0, 0, 0, 0], L: [0, 0, 0, 0, 0], tc: 0, ts: 0, pc: 0, ps: 0 }; CELLREC.m.set(ci, c); }
    var b; for (b = 0; b < 5 && b < PF.A.length; b++) { c.A[b] += PF.A[b]; c.L[b] += PF.L[b]; }
    c.tc += Math.cos(t0); c.ts += Math.sin(t0); c.pc += Math.cos(2 * phi); c.ps += Math.sin(2 * phi); c.n++;
  }
  function cellsExport() {
    var out = []; if (CELLREC.photo !== state._hair3Dneutral) return out;
    CELLREC.m.forEach(function (c, ci) {
      if (c.n < 1) return; var n = c.n, R = Math.hypot(c.tc, c.ts) / n, r3 = function (x) { return Math.round(x * 1000) / 1000; };
      out.push([ci].concat(c.A.map(function (x) { return r3(x / n); }), c.L.map(function (x) { return r3(x / n); }), [r3(Math.atan2(c.ts, c.tc)), r3(R), r3(0.5 * Math.atan2(c.ps, c.pc)), n]));
    });
    return out;
  }
  PC.cellsExport = cellsExport;
  function shapeStrandAll(g, SH, LKin, OV) {
    var LK = (LKin && PC.lockMode && SH.w >= PC.lockW) ? LKin : null, rP = LK ? { x: (LK.key % 997) * 0.0131, y: Math.floor(LK.key / 997) * 0.0173, z: (LK.key % 31) * 0.0217 } : g[0];
    var cpu = (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33, PF = OV ? { A: OV.A.slice(), L: OV.L.slice(), view: 'cell' } : profileFor(rP, SH); if (!PF) return null;
    var CY0 = 0; try { CY0 = (G && G.model && G.model.CY) || (state._hair3Dneutral && state._hair3Dneutral.CY) || 0; } catch (e) {}
    var S = [0], i; for (i = 1; i < g.length; i++) S.push(S[i - 1] + Math.hypot(g[i].x - g[i - 1].x, g[i].y - g[i - 1].y, g[i].z - g[i - 1].z));
    var Lt = S[S.length - 1]; if (!(Lt > 1e-6)) return g;
    var nb = PF.A.length, w = SH.w, useH = PC.gaborPitchFromHelix && SH.pH > 0, Lmin = 1e9, b;
    if (!OV && LK && PC.lockRFromClump && LK.rCm > 0) for (b = 0; b < nb; b++) if (PF.A[b] > 0) PF.A[b] = LK.rCm;   // 그 조각에서 잰 컬 반경
    if (OV) useH = false;
    for (b = 0; b < nb; b++) { PF.L[b] = useH ? (1 - w) * PF.L[b] + w * SH.pH : PF.L[b]; if (PF.L[b] < Lmin) Lmin = PF.L[b]; }
    var r0 = g[0], phi = OV ? OV.phi : 2 * Math.PI * hash3(rP.x * 13.7, rP.y * 71.3, rP.z * 37.9), cf = Math.cos(phi), sf = Math.sin(phi);
    var Am = 0, An = 0; for (b = 0; b < nb; b++) if (PF.A[b] > 0) { Am += PF.A[b]; An++; } Am = An ? Am / An : SH.A;
    var lockCm = Math.max(PC.lockMinCmAsIs, PC.lockDiaAsIs * 2 * Am);   // (2026-10-12m) 한 타래 크기 = 컬 지름 × lockDiaAsIs — 예전 7cm 칸이 통째로 같은 위상이라 한 고리에 가닥이 너무 많았음
    var t = OV ? OV.t0 : LK ? 2 * Math.PI * hash3(rP.x * 41.3, rP.y * 17.9, rP.z * 63.1) + PC.lockJit * (hash3(r0.x * 91, r0.y * 37, r0.z * 53) - 0.5) : smoothPhase(r0, lockCm), ds = Math.max(Math.min(Lmin / cpu / PC.ptsPerWave, Lt / 6), Lt / PC.maxPts), m = Math.max(3, Math.ceil(Lt / ds) + 1), out = [], j = 0, sPrev = 0;
    var PP = [], E1 = [], E2 = [], TT = [], AU = [], SS = [];
    for (i = 0; i < m; i++) {
      var s = Math.min(Lt, i * ds); while (j < g.length - 2 && S[j + 1] < s) j++;
      var u = (s - S[j]) / Math.max(1e-12, S[j + 1] - S[j]), a = g[j], bb = g[j + 1];
      var px = a.x + (bb.x - a.x) * u, py = a.y + (bb.y - a.y) * u, pz = a.z + (bb.z - a.z) * u;
      var tx = bb.x - a.x, ty = bb.y - a.y, tz = bb.z - a.z, tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      var ox = px, oy = py - CY0, oz = pz, od = ox * tx + oy * ty + oz * tz; ox -= od * tx; oy -= od * ty; oz -= od * tz;
      var ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
      var bx = ty * oz - tz * oy, by = tz * ox - tx * oz, bz = tx * oy - ty * ox, bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
      E1.push([cf * bx + sf * ox, cf * by + sf * oy, cf * bz + sf * oz]); E2.push([-sf * bx + cf * ox, -sf * by + cf * oy, -sf * bz + cf * oz]);
      var f = s / Lt * nb - 0.5, b0 = Math.max(0, Math.min(nb - 1, Math.floor(f))), b1 = Math.min(nb - 1, b0 + 1), q = Math.max(0, Math.min(1, f - b0)); q = q * q * (3 - 2 * q);
      var Acm = PF.A[b0] + (PF.A[b1] - PF.A[b0]) * q, Lcm = PF.L[b0] + (PF.L[b1] - PF.L[b0]) * q;
      t += 2 * Math.PI * (s - sPrev) * cpu / Math.max(0.3, Lcm); sPrev = s;   // 파장이 칸마다 달라도 위상이 끊기지 않게 쌓아 감
      PP.push(px, py, pz); TT.push(t); AU.push(Acm / cpu * rootW(s, cpu)); SS.push(s);
    }
    var dT = 0; if (OV) LK = null;                                                           // (2026-10-12u) 읽은 위상 — 가닥이 사진 조각을 지난 자리에서 고리가 그 사진 쪽(카메라 쪽)으로 드러나도록 위상을 맞춤
    if (LK && LK.dir && LK.frac != null && PC.readPhase !== false) {       //   가닥마다 제 길·제 자리에서 맞추므로 같은 조각이라도 위상이 조금씩 다름(한 점으로 겹치지 않음) · 끄기 PHOTO_CURL.readPhase=false
      var sc = LK.frac * Lt, ic = 0; while (ic < SS.length - 1 && SS[ic] < sc) ic++;
      var d = LK.dir, a1 = d[0] * E1[ic][0] + d[1] * E1[ic][1] + d[2] * E1[ic][2], a2 = d[0] * E2[ic][0] + d[1] * E2[ic][1] + d[2] * E2[ic][2];
      if (Math.abs(a1) + Math.abs(a2) > 1e-3) { dT = Math.atan2(a1, a2 / Math.max(0.2, w)) - TT[ic]; mqS.readPh = (mqS.readPh || 0) + 1; }
    }
    for (i = 0; i < TT.length; i++) {
      var c1 = AU[i] * Math.sin(TT[i] + dT), c2 = AU[i] * w * Math.cos(TT[i] + dT);
      out.push({ x: PP[3 * i] + E1[i][0] * c1 + E2[i][0] * c2, y: PP[3 * i + 1] + E1[i][1] * c1 + E2[i][1] * c2, z: PP[3 * i + 2] + E1[i][2] * c1 + E2[i][2] * c2 });
    }
    if (SH.rec) recordCell(scalpCell(g[0], CY0), PF, (TT.length ? TT[0] : 0) + dT, phi);   // (2026-10-12w) 원본에서 쓴 값을 두피 칸에 모음
    mqS.allN = (mqS.allN || 0) + 1; mqS.allV = mqS.allV || {}; mqS.allV[PF.view] = (mqS.allV[PF.view] || 0) + 1;
    return out;
  }
  PC.blendShape = blendShape; PC._shapeStrand = shapeStrand;
  /* (2026-10-12v) 굴곡을 스타일에 싣기 — 사용자: "적용받는 곳도 (그 손님 머리를) 다시 기르기 한 다음에 얹는 게 아니고, 편 다음에 얹어야"
   *  원본 머리(68번)를 보며 스타일을 등록하면 이 손님 사진에서 읽은 굴곡(방향 필터 선 · 나선 쪽 · 한 바퀴 · 크기)을 spec.readShape로 실음(59번).
   *  다른 손님에게 걸면: 그 손님의 뿌리 자리 + 스타일 결 표로 만든 길(59번 · 굴곡 없는 흐름) 위에 이 값으로 굴곡을 얹고(68번이 부름), 컬 엔진은 안 돌림(겹치지 않게).
   *  받는 손님 사진의 굴곡은 쓰지 않음 · 타래 위상은 사진이 없으니 자리에 따라 부드럽게(타래 크기 = 컬 지름) · 끄기 PHOTO_CURL.rsApply=false */
  PC.rsApply = true; PC.rsMaxLines = 200;
  PC.exportShape = function () {
    try {
      if (!shapeAllowed()) return null;   // (2026-10-13a) 직모 원본에서 등록한 스타일에는 굴곡을 안 실음
      var SH = blendShape(origSpec() || {}); if (!SH || !SH.gab || !SH.gab.byView) return null;
      var bv = {}, k; for (k in SH.gab.byView) {
        var L = SH.gab.byView[k], st = Math.max(1, Math.ceil(L.length / PC.rsMaxLines)), o = [], i;
        for (i = 0; i < L.length; i += st) o.push(L[i].map(function (x) { return isFinite(x) ? Math.round(x * 1000) / 1000 : 0; }));
        bv[k] = o;
      }
      return { v: 1, A: +SH.A.toFixed(3), L: +SH.L.toFixed(3), w: +SH.w.toFixed(3), pH: SH.pH > 0 ? +SH.pH.toFixed(3) : 0,
        cells: PC.cellMode ? cellsExport() : [], cellNT: PC.cellNT, cellNP: PC.cellNP,
        gab: { lamCm: +(+SH.gab.lamCm).toFixed(3), ampCm: +(+SH.gab.ampCm).toFixed(3), loop: +(+SH.gab.loop).toFixed(3), nAll: SH.gab.nAll, byView: bv } };
    } catch (e) { return null; }
  };
  function rsSpec() {
    try { if (!PC.rsApply || origSpec()) return null; var id = state.specAppliedId; if (!id || typeof getStyleSpec !== 'function') return null; var sp = getStyleSpec(id); return (sp && sp.readShape && sp.readShape.gab) ? sp.readShape : null; } catch (e) { return null; }
  }
  PC.activeRS = rsSpec;
  PC.applyShapeRS = function (g, rs) {
    if (!PC.on || !g || g.length < 2 || !rs) return g;
    var SH = { A: rs.A, L: rs.L, w: rs.w, depth: rs.w, pH: rs.pH, gab: rs.gab }, OV = null;
    mqS.rs = (mqS.rs || 0) + 1;
    if (PC.cellMode && rs.cells && rs.cells.length && rs.cellNT === PC.cellNT && rs.cellNP === PC.cellNP) {
      if (rs._cm !== rs.cells) { rs._cmap = new Map(); rs.cells.forEach(function (c) { rs._cmap.set(c[0], c); }); rs._cm = rs.cells; }
      var CYt = 0; try { CYt = (state._hair3Dneutral && state._hair3Dneutral.CY) || (G && G.model && G.model.CY) || 0; } catch (e) {}
      var c = rs._cmap.get(scalpCell(g[0], CYt));
      if (c) {
        var R = Math.max(1e-3, Math.min(1, c[12])), sd = Math.sqrt(-2 * Math.log(R)), r0 = g[0];   // 칸 안 가닥끼리 흩어진 정도(원본에서 읽은 값)만큼 위상을 흩음
        OV = { A: c.slice(1, 6), L: c.slice(6, 11), t0: c[11] + sd * 1.7 * (hash3(r0.x * 91, r0.y * 37, r0.z * 53) - 0.5) * 2, phi: c[13] };
        mqS.rsCell = (mqS.rsCell || 0) + 1;
      }
    }
    return shapeStrandAll(g, SH, null, OV) || g;
  };
  /* (2026-10-13a) 직모에는 굴곡을 안 얹음 — 사용자: "폰에서 찍은 건 직모 여자인데, 컬이 얹힌 거야"
   *  예전: applyShape가 잰 컬과 상관없이 사진 방향 필터 선(66번)의 진폭을 얹음 → 직모 사진도 선마다 잔 흔들림(빛·잔머리)이 있어 0.5~1cm 굴곡이 생김.
   *  지금: 원본 스펙의 잰 컬(perm.curl)이 shapeMinCurl 미만이면 얹지 않고 스타일에도 안 실음. 끄기 PHOTO_CURL.shapeMinCurl=0 */
  PC.shapeMinCurl = 10;
  function measuredCurl() { try { var sp = W.ORIG_MQ && W.ORIG_MQ.spec, pm = sp && sp.perm; return (pm && typeof pm.curl === 'number') ? pm.curl : null; } catch (e) { return null; } }
  function shapeAllowed() { var c = measuredCurl(); if (c == null || !(PC.shapeMinCurl > 0)) return true; if (c < PC.shapeMinCurl) { mqS.straightSkip = (mqS.straightSkip || 0) + 1; return false; } return true; }
  PC.shapeAllowed = shapeAllowed;
  PC.applyShape = function (g, lk) {                                     // (2026-10-12j) 68번이 옮겨심은 축에 사진 선 굴곡을 얹음 · lk = 그 가닥의 사진 타래 조각
    if (!PC.on || !PC.gaborAll || !g || g.length < 2) return g;
    if (!shapeAllowed()) return g;
    var SH = blendShape(origSpec() || {}); if (!SH || !SH.gab) return g;
    if (PC.cellMode) SH = Object.assign({}, SH, { rec: true });
    var res = shapeStrandAll(g, SH, lk) || g;
    return (res !== g && PC.shapePushIn) ? pushIn(res, g) : res;   // (2026-10-13a) 굴곡이 3D 머리 덩어리 밖(목·옆 공중)으로 부푼 점은 축 쪽으로 당김
  };
  PC.shapePushIn = true;
  /* (2026-10-11c) ① 감은 컬이 좁은 덩어리(42번 여유 둔 교집합) 밖으로 부푼 점은 축 쪽으로 당겨 넣음 — 자르지 않음 */
  PC.mqPushIn = true; mqS.pushed = 0;
  function pushIn(res, axis) {
    var VT = G && G.volT; if (!PC.mqPushIn || !VT || !res || !axis || axis.length < 2) return res;
    var n = res.length, m = axis.length, i, k;
    for (i = 1; i < n; i++) {
      var p = res[i]; if (VT.at(p) !== 0) continue;
      var a = axis[Math.min(m - 1, Math.round(i / Math.max(1, n - 1) * (m - 1)))]; if (VT.at(a) === 0) continue;
      var lo = 0, hi = 1; for (k = 0; k < 6; k++) { var t = (lo + hi) / 2, q = { x: a.x + (p.x - a.x) * t, y: a.y + (p.y - a.y) * t, z: a.z + (p.z - a.z) * t }; if (VT.at(q) === 0) hi = t; else lo = t; }
      res[i] = { x: a.x + (p.x - a.x) * lo, y: a.y + (p.y - a.y) * lo, z: a.z + (p.z - a.z) * lo }; mqS.pushed++;
    }
    return res;
  }
  function mqCurl(g, C) {
    var pm = origSpec(); if (!pm || !(C > 0) || typeof CURL_BUNDLE === 'undefined') return null;   // 원본 머리(마네킹)일 때만 — 마네킹 스타일에는 사진 결을 안 얹음
    var CB = CURL_BUNDLE, o = {}, sv = {}, k, args = Array.prototype.slice.call(arguments);
    // (2026-10-11d) 컬의 축은 3D 머리 덩어리(42번) 안에서 끝 — 축이 덩어리를 빠져나가면(두 점 연속) 거기까지(사진에서 잰 길이 · 얼굴 앞으로 내려오던 앞머리 축)
    var VC = (G && (G.volT || G.vol)) || null;   // (2026-10-11d) 축은 좁은 덩어리(여유 둔 교집합)에서 끊음 — 넓은 덩어리(다수결)로는 이마 앞 공중·옆머리 틈으로 나간 축(더듬이)이 안 끊겼음
    if (PC.mqVolCut && VC && g && g.length > 3) {
      var cpu = CB.cmPerUnit || 19.33, acc = 0, outRun = 0, cutAt = -1, j3;
      for (j3 = 1; j3 < g.length; j3++) {
        acc += Math.hypot(g[j3].x - g[j3 - 1].x, g[j3].y - g[j3 - 1].y, g[j3].z - g[j3 - 1].z);
        if (acc * cpu < PC.mqVolKeepCm) continue;
        if (VC.at(g[j3]) === 0) { if (++outRun >= 2) { cutAt = j3 - 1; break; } } else outRun = 0;
      }
      if (cutAt > 1) { args[0] = g.slice(0, cutAt); mqS.cut = (mqS.cut || 0) + 1; }
    }
    var axis0 = args[0];
    if (PC.shapeMode) {                                                   // (2026-10-11d) 기준선 없이 — 사진 선 모양과 나선 측정을 섞은 한 식
      var SH = blendShape(pm);
      if (SH) { mqS.shaped = (mqS.shaped || 0) + 1; return pushIn(shapeStrand(axis0, SH), axis0); }
    }
    if (PC.waveMode) { var WS = waveShape(); if (WS && WS.isWave) { mqS.wave = (mqS.wave || 0) + 1; return pushIn(waveStrand(axis0, WS.ampCm, WS.lamCm), axis0); } }
    var M = mqSolve(C, pm.rCm * PC.radiusK, pm.pitchCm > 0 ? pm.pitchCm : null);
    for (k in PC.look) o[k] = PC.look[k]; o.windCm = PC.mqWind; o.rootLeaveCm = PC.mqRootLeave; o.pitchThick = M.pt;
    args[2] = M.wave / 100;
    if (PC.mqStretch && M.remain < 0.999 && typeof lengthStrand3D === 'function') { try { args[0] = lengthStrand3D(args[0], 1 / M.remain); } catch (e) {} }
    var ks = M.ks || 1, r0 = args[0] && args[0][0];
    function sc(pts, f) { var o2 = new Array(pts.length), j, q; for (j = 0; j < pts.length; j++) { q = pts[j]; o2[j] = { x: r0.x + (q.x - r0.x) * f, y: r0.y + (q.y - r0.y) * f, z: r0.z + (q.z - r0.z) * f }; } return o2; }
    if (ks > 1 && r0) args[0] = sc(args[0], 1 / ks);
    for (k in o) { sv[k] = CB[k]; CB[k] = o[k]; }
    mqS.calls++;
    try { var res = innerCurl.apply(this, args); res = (ks > 1 && r0 && res && res.length) ? sc(res, ks) : res; return pushIn(res, axis0); } finally { for (k in sv) CB[k] = sv[k]; }
  }
  if (typeof innerCurl === 'function') {
    W.curlStrand3D = function () {
      if (rsSpec()) { mqS.rsNoCurl = (mqS.rsNoCurl || 0) + 1; return arguments[0]; }   // (2026-10-12v) 스타일에 실린 굴곡을 얹을 것이라 컬 엔진은 안 돌림
      if (PC.mq && !lookActive()) { var mr = mqCurl.apply(this, arguments); if (mr) return mr; }
      if (!lookActive()) return innerCurl.apply(this, arguments);
      if (PC.shapeMode && gaborOK() && arguments[0] && arguments[0].length > 1) {   // (2026-10-12f) 다시 기른 머리도 방향 필터 값 그대로
        var SHg = blendShape(origSpec()); if (SHg) { S.gabor = (S.gabor || 0) + 1; return pushIn(shapeStrand(arguments[0], SHg), arguments[0]); }
      }
      var CB = CURL_BUNDLE, L = PC.look, sv = {}, k;
      if (PC.clumpSize && curS && lockMemo.rOf && lockMemo.rOf.has(curS) && arguments.length >= 3 && S.rCm > 0) {   // 조각마다 잰 크기로 웨이브(컬 굵기)
        var rg0 = S.rCm * PC.radiusK, rc0 = Math.max(rg0 * PC.clumpRMin, Math.min(rg0 * PC.clumpRMax, lockMemo.rOf.get(curS)));
        var args = Array.prototype.slice.call(arguments); args[2] = PC.waveFor(rc0, args[1] || 75) / 100; S.sized = (S.sized || 0) + 1;
        for (k in L) { sv[k] = CB[k]; CB[k] = L[k]; } S.calls++;
        try { return innerCurl.apply(this, args); } finally { for (k in sv) CB[k] = sv[k]; }
      }
      for (k in L) { sv[k] = CB[k]; CB[k] = L[k]; }
      S.calls++;
      try { return innerCurl.apply(this, arguments); } finally { for (k in sv) CB[k] = sv[k]; }
    };
  } else console.warn(TAG + ' curlStrand3D가 없어 뭉침 모양은 못 겁니다');
  // 서명 — 모양이 걸렸는지가 바뀌면 미리 만든 헤어도 다시
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments);
    try { var a = lookActive(), om = origSpec(); if (om) s += '|pmq' + [om.curl, om.rCm, om.pitchCm, PC.mqWind, PC.mqRootLeave, PC.mqStretch, PC.gaborAsIs ? 'g' + PC.rootStraightCm + ':' + PC.shapeRootCm + ':' + PC.phaseJitAsIs + ':2' + (PC.gaborPitchFromHelix ? 'h' : '') + (PC.gaborAll ? 'a' + PC.gaborBins + ':' + PC.lockDiaAsIs + (PC.lockMode ? 'L' + PC.lockW + ':' + PC.lockJit + (PC.readPhase !== false ? 'p' : '') : '') : '') : 0, 'sm' + PC.shapeMinCurl + (PC.shapePushIn ? 'p' : '') + ':' + measuredCurl(), PC.readWave ? 'rw' + PC.readGainMax + (PC.readFill ? 'f' : '') + ((G && G.waveField && G.waveField()) ? 1 : 0) : 0].join(','); return s + '|pcl' + (a ? [PC.look.pitchThick, PC.look.clumpPull, PC.look.phaseJitter, PC.look.microAmp].join(',') + (PC.lock ? 'L' + lver + ':' + lockSig() : '') : 0); } catch (e) { return s; }
  };

  PC.lines = function () {
    var a = lookActive(), L = [];
    L.push(TAG + ' ' + (PC.on ? '켜짐' : '꺼짐') +
      ' · 컬 굵기: ' + (!PC.radius ? '안 맞춤(PHOTO_CURL.radius=false)' : (S.wave != null ? '사진 반경 ' + (+S.rCm).toFixed(1) + 'cm' + (PC.radiusK !== 1 ? ' ×' + PC.radiusK : '') + ' · 컬 ' + S.curl + ' → 웨이브 ' + S.wave + '(예전 ' + S.was + ')' :
        (S.curl != null ? (S.rCm > 0 ? '사진 반경 ' + (+S.rCm).toFixed(1) + 'cm — ' : '') + (S.why || '안 맞춤') : '아직 안 잼'))) +
      ' · 뭉침 모양: ' + (!PC.clump ? '꺼짐' : (a ? '걸림(한 바퀴 간격 ' + PC.look.pitchThick + ' · 다발로 당김 ' + PC.look.clumpPull + ' · 감기는 자리 흩기 ' + PC.look.phaseJitter + ' · 잔떨림 ' + PC.look.microAmp + ')' :
        '안 걸림(다시 기른 머리 화면이 아니거나 사진 컬이 ' + PC.lookMinCurl + ' 미만)')) +
      ' · 타래 뼈대: ' + (!PC.lock ? '꺼짐' : (a && lockMemo.map ? '타래 ' + lockMemo.locks + '개(뿌리 자리 ' + (+lockMemo.cm).toFixed(1) + (lockMemo.cmHi > lockMemo.cm + 0.05 ? '~' + (+lockMemo.cmHi).toFixed(1) : '') + 'cm = 컬 지름 ' + (S.rCm > 0 ? (2 * S.rCm * PC.radiusK).toFixed(1) + 'cm' : '못 잼') + ' × ' + PC.lockDia + '직경' + (PC.lockBase ? ' × 펌·베이스 폭' : '') + ' · 타래당 ' + Math.round(lockMemo.per || 0) + '가닥) · 사진 타래 조각으로 묶은 가닥 ' + (lockMemo.clumped || 0) + '(사진 ' + (lockMemo.clumpViews || 0) + '장 · 조각 크기 반경 ' + (lockMemo.rMed ? lockMemo.rP25.toFixed(1) + '/' + lockMemo.rMed.toFixed(1) + '/' + lockMemo.rP75.toFixed(1) + 'cm' : '-') + ' · 조각 크기로 감은 가닥 ' + (S.sized || 0) + ') · 길잡이로 모은 가닥 ' + lockMemo.moved + '/' + lockMemo.n + ' · ' + Math.round(lockMemo.ms) + 'ms' : (a ? '아직 안 만듦' : '안 걸림'))) +
      (S.err ? ' · ⚠ ' + S.err : ''));
    if (mqS.solved) L.push('   ④ 마네킹 위 잰 컬: ' + mqS.solved + ' · 감은 가닥 ' + mqS.calls + ' · 3D 머리 덩어리 밖에서 축을 끝낸 가닥 ' + (mqS.cut || 0) + ' · 좁은 덩어리 밖으로 부푼 점을 당겨 넣음 ' + (mqS.pushed || 0) + ' · 기준선 없이 감은 가닥 ' + (mqS.shaped || 0) + (mqS.shapeTxt ? '(' + mqS.shapeTxt + ')' : '') + ' (끄기 PHOTO_CURL.mqVolCut / mqPushIn / waveMode=false)');
    if (mqS.straightSkip) L.push('   직모라 굴곡 안 얹음: 가닥 ' + mqS.straightSkip + '번(잰 컬 ' + measuredCurl() + ' < ' + PC.shapeMinCurl + ' · 끄기 PHOTO_CURL.shapeMinCurl=0)');
    L.push('   ⑤ 읽은 굴곡 그대로: ' + (!PC.readWave ? '꺼짐(켜기 = 주소 끝에 ?rw=1 · 콘솔 PHOTO_CURL.readWave=true 후 PHOTO_CURL.refresh())' : (mqS.readPts > 0 ? '켜짐 — ' + mqS.readTxt + ' · 얹은 점 ' + mqS.readPts + '(굴곡 장이 아는 자리 ' + Math.round(mqS.readKnown / mqS.readPts * 100) + '%) · 지어낸 굴곡을 남긴 비율 평균 ' + Math.round(mqS.readFillSum / mqS.readPts * 100) + '% (끄기 ?rw=0)' : '켜짐 — 아직 안 걸림(곱슬·웨이브 원본 머리가 아니거나 굴곡 장이 없음)')));
    return L;
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { PC.lines().forEach(function (x) { L.push(x); }); } catch (e) {}
    return L;
  };
  /* 지금 손님에게 다시 걸기(끄고 켠 뒤) — 사진에서 다시 재서 슬라이더에 넣음 */
  PC.refresh = function () {
    lver++;
    try { if (G && G.model && G.model.strands) G.model.strands.forEach(function (s) { if (s && s._fnat) s._fnat = null; }); } catch (e) {}
    try { if (G && G.on && typeof G.applyBaseline === 'function') { if (G.base) G.base = null; G.applyBaseline(); } } catch (e) { S.err = String(e && e.message || e); }
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  };
  console.log(TAG + ' 설치 — 곱슬 원본 머리의 컬 굵기를 사진에서 잰 반경에 맞추고(웨이브), 가닥이 다발로 같이 감기게 합니다(v20261012e · 사진 타래 조각으로 묶기 · 조각마다 크기 · ④ 원본 = 마네킹 + 잰 반경·간격으로 감기). 끄기 PHOTO_CURL.on=false 후 마네킹을 켰다 끄기 · 굵기 보정 PHOTO_CURL.radiusK');
})();
