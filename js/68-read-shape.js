/* ==========================================================================
 * 68-read-shape.js — 원본 머리 = 방향필터(66번)로 읽은 모양 그대로 · 거꾸로 자란 가닥 규칙 · 뿌리 고르게
 *
 * 로드 위치: index.html에서 61-photo-curl.js 다음(64번보다 앞 — 64번의 페이드·뿌리 채움이 이 파일 바깥에서 그대로 돎).
 *
 * 왜 (2026-10-12 · 사용자):
 *   "웨이브는 방향필터를 통해서 다 제대로 읽고 있는데, 그 뒷처리를 해버려서 원래 모양이 다 사라졌어. 방향필터에서 읽은 모양대로 읽도록."
 *   "머리 위 더듬이를 그냥 눌러놨는데, 그거 방향이 반대로 자란 가닥이야. 처리하는 규칙이 있을 텐데 제대로 안 갔고."
 *   "앞이마 쪽은 뿌리가 성글고 그 바로 위쪽은 뿌리가 밀집된 곳이 띠처럼 있어. 대머리이거나 숱이 적은 곳이 아니면 균일하게."
 *   "원래 수준대로 3만 가닥 가까이."
 *
 *   읽은 웨이브가 사라진 경로(10:38 로그 · 웨이브 손님):
 *     ① 42번 직모 뼈대 — 컬 55라서 읽은 길을 한 바퀴(11cm) 창으로 두 번 펴서 축만 남김("편 가닥 15444").
 *     ② 59번 결 표 — 그 축을 다시 칸 평균 방향으로 줄임.
 *     ③ 61번 — 그 위에 사진 값(파장 6.5 · 진폭 0.52cm)으로 "지어낸" 물결을 얹음. 읽은 자리·위상은 하나도 안 남음.
 *   더듬이: 42번이 "아래쪽에 머리가 없고 두께 1.8cm 이상"인 앞머리선 뿌리 264개를 위로 뒤집어 기름(세운 앞머리 규칙).
 *     긴 웨이브는 볼륨 때문에 두께가 3.7cm라 규칙이 걸려, 위로 솟은 가닥이 생겼고 59번은 짧은 막다른 무리만 눌렀음.
 *
 * 무엇을:
 *   A. 웨이브 사진(61번 ② 고리 정도 < 0.33)은 42번 직모 뼈대를 안 씀 — 기른 가닥 = 방향필터를 따라 걸은 길 그대로.
 *      진짜 고리 컬은 예전대로(뼈대 + 컬 엔진).
 *   B. 원본 머리(마네킹 + 잰 값)를 볼 때, 마네킹 뿌리마다 가장 가까운 "기른 가닥"의 길을 그 뿌리로 옮겨 씀(모양 옮겨심기).
 *      결 표·지어낸 물결을 거치지 않음 → 읽은 굴곡·위상·결이 그대로. 슬라이더(길이·넘김·볼륨·가르마·결·윤기)는
 *      59번과 같은 "기준에서 움직인 만큼만"으로 그 위에 걸림 · 컬은 스펙 값보다 올렸을 때만 그만큼 더 감음.
 *   C. 거꾸로 자란 가닥 — 기른 가닥 전체로 1cm 칸마다 "그 자리를 지나는 가닥들이 가는 쪽"(앞뒤 있는 평균)을 내고,
 *      뿌리에서 8cm 동안 그 흐름과 반대로(평균 cos < revCos) 가는 가닥은 거꾸로 자란 것으로 봄 → 본보기에서 뺌.
 *      그 뿌리는 이웃의 바른 가닥 모양을 받음(누르는 게 아니라 결대로 다시 남).
 *      짧게 막힌 가닥(이웃 뿌리 길이 중앙값의 shortK 미만)도 본보기에서 뺌.
 *   D. 뿌리 고르게 — 13b 뿌리 밀도에서, 머리 있는 칸은 전부 보통 밀도(잰 칸 중앙값)로. 보통의 rootLow(0.6) 미만인 칸만 그대로 두고
 *      64번 ③이 작은 덩어리는 채우고 넓고 빈 덩어리(대머리·숱 적은 곳)는 남김. → 앞이마 성긴 줄 · 그 위 밀집 띠가 없어짐.
 *   (가닥 수는 48번 adjustLow/High = 30000 · 42번 measureShare = 1로 같이 고침)
 *
 * (2026-10-12o) 오늘 저녁 정리 — 무엇이 남았고 왜(같은 날 21:05 로그·영상 · 손님 2: 긴 웨이브 · 짧은 곱슬)
 *   · 이 파일(오전 작업)을 2d2c950에서 되돌렸다가 다시 넣음(잔머리 때문인 줄 알고 되돌린 것이 잘못) · 42번 measureShare=1 · 48번 3D 결과 3만
 *   · 축 고르기는 전부 뺌(42번 axisGabor=false · straightCurly=false) — 사용자: "결과를 바꾸기 위한 제한은 최대한 안 함. 읽은 걸 잘해서 결과로 잇는 게 먼저"
 *     컬·웨이브 모두 사진 결을 그대로 걸은 길 → 이 파일이 마네킹 뿌리에 옮겨심음 → 61번이 방향 필터 선(높이별·가닥별) 굴곡을 얹음(shape)
 *   · 느려진 원인 = 가닥당 점 수(기른 길 0.4cm 걸음 = 긴 머리 100점+ · 61번이 또 촘촘히 다시 찍음) — 완성본 3만: 12g 3.9초 → 12m 10.3초
 *     12n(61번 점 줄임 · 조정 화면 1만/2만)에서 4.2초(웨이브) · 3.1초(곱슬) · 12o: 옮겨심은 길 48점 상한(maxPts) · 61번 한 번 굽는 데 8점(가닥당 120 상한)
 *   · 결과(21:05 영상): 웨이브 풍성 · 컬 더 세밀 — 사용자 확인. 남은 것: 웨이브 손님 길이가 사진보다 짧음(어깨 근처에서 끝) · 3D에서 곱슬 부피가 조정 화면보다 작아 보임
 *   · 50번 어깨 처리는 다시 끔(조정 화면 가슴 높이 가로줄 · 쭈글한 띠)
 * 끄기: READ_SHAPE.on=false(B·C) · READ_SHAPE.waveRaw=false(A) · READ_SHAPE.evenRoots=false(D) — 바꾼 뒤 사진을 다시 분석하거나 마네킹을 켰다 끄기
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[읽은 모양]';
  var RS = W.READ_SHAPE = Object.assign({
    on: true,            // B·C
    waveRaw: false,      // A — (2026-10-12j) 끔: 웨이브도 42번 축(방향 필터 파장으로 고른 결)으로 걷고 굴곡은 61번이 얹음. 켜면 예전(읽은 길 그대로)
    evenRoots: true,     // D
    rootLow: 0.6,        // D: 보통 밀도의 이 비율 미만 칸은 손대지 않음(대머리·숱 적은 곳 후보 — 64번이 덩어리 크기로 가름)
    vox: 0.05,           // C: 흐름 칸(모델 단위 ≈ 1cm)
    revLen: 0.42,        // C: 뿌리에서 이 길이(≈ 8cm)까지 봄
    revCos: -0.15,       // C: 흐름과의 평균 cos가 이 값 미만이면 거꾸로 자란 가닥
    revMinN: 3,          // C: 칸에 자기 말고 이만큼은 다른 마디가 있어야 비교
    shortK: 0.3,         // C: 이웃 뿌리 가닥 길이 중앙값의 이 비율 미만은 본보기 아님
    rootNbr: 0.06,       // C: 뿌리 이웃 칸(≈ 1.2cm · 둘레 27칸 ≈ 3.5cm 안의 뿌리들이 기준)
    rootCell: 0.04,      // B: 뿌리 찾기 칸(≈ 0.8cm)
    reach: 4,            // B
    maxPts: 48,
    offKeepCm: 0.5, offFadeCm: 3,
    farCm: 1.5,          // (2026-10-13b) 본보기 뿌리가 이보다 멀면(사진에 머리가 없는 자리) 그리지 않음
    strayOn: true, strayOut: 0.2, strayCos: 0.45, strayCurlMax: 30,   // (2026-10-13b) 엇나간 본보기 빼기   // (2026-10-13a) 본보기와 뿌리가 떨어진 만큼 길 전체를 옮기지 않고 3cm에 걸쳐 0.5cm까지 붙임
    lockPull: 0, lockRootCm: 1.5,   // (2026-10-12u) 0: 대표 길로 당기지 않음 — 한 조각의 가닥이 한 줄로 겹쳐 뭉치가 됐음. 타래는 같은 조각 = 같은 사진 선 + 가닥마다 읽은 위상(61번)으로 · 예전 0.85   // (2026-10-12s) 사진 타래 조각의 대표 길로 당기는 정도(0 = 당기지 않고 위상·크기만 같게) · (2026-10-12q) 컬 타래로 당기는 정도 · 뿌리에서 이 길이에 걸쳐 서서히 — 0 = 안 모음          // (2026-10-12o) 옮겨심은 길의 점 수 상한(웨이브 한 번에 8점쯤) · 0 = 그대로
    shape: true          // (2026-10-12j) 옮겨심은 축에 61번 굴곡(방향 필터 선 그대로)을 얹음 · false = 축만: 이 칸 수까지 넓혀 찾음(넘으면 예전 경로)
  }, W.READ_SHAPE || {});
  var ST = RS.stats = { built: null, used: 0, fell: 0, curlAdd: 0, wave: null, roots: null, err: null };
  var G = W.REGROW;

  function cpu() { try { return (typeof CURL_BUNDLE !== 'undefined' && CURL_BUNDLE.cmPerUnit) || 19.33; } catch (e) { return 19.33; } }
  function photo() { try { return state._hair3Dneutral || null; } catch (e) { return null; } }
  function model() { try { return (G && G.model && G.src === photo()) ? G.model : null; } catch (e) { return null; } }
  function isOrig() { try { return !!(W.ORIG_MQ && W.ORIG_MQ.on !== false && typeof W.ORIG_MQ.isOriginal === 'function' && W.ORIG_MQ.isOriginal()); } catch (e) { return false; } }

  /* ── A. 웨이브 사진은 직모 뼈대를 안 씀 ─────────────────────────────── */
  function isWavePhoto() {
    try { var ws = W.PHOTO_CURL && typeof W.PHOTO_CURL.waveShape === 'function' ? W.PHOTO_CURL.waveShape() : null; return ws ? { wave: !!ws.isWave, loop: ws.loop } : null; } catch (e) { return null; }
  }
  if (G && typeof G.build === 'function') {
    var innerBuild = G.build, straight0 = G.straightCurly;
    G.build = function () {
      try {
        G.straightCurly = straight0;
        if (RS.waveRaw) { var w = isWavePhoto(); ST.wave = w; if (w && w.wave) G.straightCurly = false; }
      } catch (e) {}
      return innerBuild.apply(this, arguments);
    };
  }

  /* ── C. 본보기 표: 거꾸로 자란 가닥·짧게 막힌 가닥을 빼고 뿌리 칸에 넣음 ── */
  var IDX = null;
  function keyOf(ix, iy, iz) { return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512); }
  function buildIndex(m) {
    var t0 = Date.now(), S = m.strands, n = S.length, V = RS.vox, flow = new Map(), i, j;
    // 흐름 칸 — 마디 방향(앞뒤 있음)의 합
    for (i = 0; i < n; i++) {
      var p = S[i] && S[i].pts; if (!p || p.length < 2) continue;
      for (j = 1; j < p.length; j++) {
        var dx = p[j].x - p[j - 1].x, dy = p[j].y - p[j - 1].y, dz = p[j].z - p[j - 1].z, l = Math.sqrt(dx * dx + dy * dy + dz * dz); if (!(l > 1e-9)) continue;
        var k = keyOf(Math.floor(p[j].x / V), Math.floor(p[j].y / V), Math.floor(p[j].z / V)), c = flow.get(k);
        if (!c) { c = [0, 0, 0, 0]; flow.set(k, c); }
        c[0] += dx / l; c[1] += dy / l; c[2] += dz / l; c[3]++;
      }
    }
    // 뿌리 이웃의 처음 방향 — 42번이 위로 뒤집어 기른 가닥(rg.flip 1)은 기준에서 뺌(앞머리선 한 줄이 통째로 뒤집혀도 그 뒤 뿌리들이 기준이 됨)
    var RN = RS.rootNbr, rootDir = new Map(), d0 = new Array(n);
    function dirOf(q) { var qi = Math.min(q.length - 1, 6), x = q[qi].x - q[0].x, y = q[qi].y - q[0].y, z = q[qi].z - q[0].z, l = Math.sqrt(x * x + y * y + z * z); return l > 1e-9 ? [x / l, y / l, z / l] : null; }
    for (i = 0; i < n; i++) {
      var q0 = S[i] && S[i].pts; if (!q0 || q0.length < 2) continue;
      var dd = d0[i] = dirOf(q0); if (!dd || (S[i].rg && S[i].rg.flip === 1)) continue;
      var kr = keyOf(Math.floor(q0[0].x / RN), Math.floor(q0[0].y / RN), Math.floor(q0[0].z / RN)), cr = rootDir.get(kr);
      if (!cr) rootDir.set(kr, cr = [0, 0, 0, 0]); cr[0] += dd[0]; cr[1] += dd[1]; cr[2] += dd[2]; cr[3]++;
    }
    function rootRef(i) {
      var q = S[i].pts[0], cx = Math.floor(q.x / RN), cy = Math.floor(q.y / RN), cz = Math.floor(q.z / RN), s = [0, 0, 0, 0], a, b, c;
      for (a = -1; a <= 1; a++) for (b = -1; b <= 1; b++) for (c = -1; c <= 1; c++) { var e = rootDir.get(keyOf(cx + a, cy + b, cz + c)); if (e) { s[0] += e[0]; s[1] += e[1]; s[2] += e[2]; s[3] += e[3]; } }
      var dd = d0[i]; if (dd && !(S[i].rg && S[i].rg.flip === 1)) { s[0] -= dd[0]; s[1] -= dd[1]; s[2] -= dd[2]; s[3]--; }
      return s;
    }
    var info = new Array(n), rev = 0, revFlip = 0, flipN = 0, shortN = 0, revRoot = 0;
    for (i = 0; i < n; i++) {
      var q = S[i] && S[i].pts; if (!q || q.length < 2) { info[i] = null; continue; }
      var L = 0, sum = 0, cnt = 0;
      for (j = 1; j < q.length; j++) {
        var ex = q[j].x - q[j - 1].x, ey = q[j].y - q[j - 1].y, ez = q[j].z - q[j - 1].z, el = Math.sqrt(ex * ex + ey * ey + ez * ez); if (!(el > 1e-9)) continue;
        L += el;
        if (L <= RS.revLen) {
          var c2 = flow.get(keyOf(Math.floor(q[j].x / V), Math.floor(q[j].y / V), Math.floor(q[j].z / V)));
          if (c2 && c2[3] - 1 >= RS.revMinN) {
            var ux = ex / el, uy = ey / el, uz = ez / el, ox = c2[0] - ux, oy = c2[1] - uy, oz = c2[2] - uz, ol = Math.sqrt(ox * ox + oy * oy + oz * oz);
            if (ol > 0.5) { sum += (ux * ox + uy * oy + uz * oz) / ol; cnt++; }
          }
        }
      }
      var isRev = cnt >= 2 && sum / cnt < RS.revCos, fl = S[i].rg && S[i].rg.flip === 1;
      if (!isRev && d0[i]) {                                                   // 지나가는 자리에 다른 가닥이 없는 더듬이 — 뿌리 이웃이 가는 쪽과 반대면 거꾸로
        var rr = rootRef(i), rl = Math.sqrt(rr[0] * rr[0] + rr[1] * rr[1] + rr[2] * rr[2]);
        if (rr[3] >= RS.revMinN && rl > 0.3 * rr[3] && (d0[i][0] * rr[0] + d0[i][1] * rr[1] + d0[i][2] * rr[2]) / rl < RS.revCos) { isRev = true; revRoot++; }
      }
      if (fl) flipN++;
      if (isRev) { rev++; if (fl) revFlip++; }
      info[i] = { L: L, rev: isRev, r: q[0] };
    }
    // (2026-10-13b) 엇나간 본보기 — 사용자: "직모 옆으로 가닥들이 생기네"
    //   기른 가닥의 5%쯤은 잔머리·엇나간 가닥(결 표가 빼는 것)인데 본보기로는 그대로 쓰여, 그 근처 마네킹 뿌리 여러 개가 같은 엇나간 길을 받아 옆으로 뜬 가닥 줄이 됨.
    //   ① 3D 머리 덩어리 밖을 지나는 점이 strayOut 넘게 많은 가닥 ② (직모·웨이브 — 잰 컬 strayCurlMax 미만) 길 전체에서 그 자리 흐름과의 평균 cos가 strayCos 미만인 가닥 → 본보기에서 뺌(이웃 바른 가닥 모양을 받음)
    var VC = (G && (G.volT || G.vol)) || null, curlM = 0, strayN = 0, strayV = 0;
    try { var spx = W.ORIG_MQ && W.ORIG_MQ.spec; curlM = (spx && spx.perm && spx.perm.curl) || 0; } catch (e) {}
    // (2026-10-13e) 웨이브·곱슬(잰 컬 strayCurlMax 이상)은 둘 다 안 봄 — 굴곡 때문에 덩어리 밖을 자주 지나 웨이브 손님 본보기 4,900개(17%)가 빠졌고,
    //   앞이마 뿌리가 멀리 있는 긴 가닥을 받아 이마로 더 내려오며 꺾였음(사용자: "웨이브 여자분 이마에 가닥이 더 내려오면서 꺾여 있어")
    if (RS.strayOn && curlM < RS.strayCurlMax) for (i = 0; i < n; i++) {
      var f0 = info[i]; if (!f0 || f0.rev) continue;
      var q2 = S[i].pts, outN = 0, tot = 0, cs = 0, cn = 0;
      for (j = 1; j < q2.length; j++) {
        tot++;
        if (VC) { try { if (VC.at(q2[j]) === 0) outN++; } catch (e) {} }
        if (curlM < RS.strayCurlMax) {
          var fx = q2[j].x - q2[j - 1].x, fy = q2[j].y - q2[j - 1].y, fz = q2[j].z - q2[j - 1].z, fl2 = Math.sqrt(fx * fx + fy * fy + fz * fz); if (!(fl2 > 1e-9)) continue;
          var c3 = flow.get(keyOf(Math.floor(q2[j].x / V), Math.floor(q2[j].y / V), Math.floor(q2[j].z / V)));
          if (c3 && c3[3] - 1 >= RS.revMinN) { var gx = c3[0] - fx / fl2, gy = c3[1] - fy / fl2, gz = c3[2] - fz / fl2, gl = Math.sqrt(gx * gx + gy * gy + gz * gz); if (gl > 0.5) { cs += (fx * gx + fy * gy + fz * gz) / (fl2 * gl); cn++; } }
        }
      }
      if (tot && outN / tot > RS.strayOut) { f0.rev = true; strayV++; continue; }
      if (cn >= 4 && cs / cn < RS.strayCos) { f0.rev = true; strayN++; }
    }
    // 짧게 막힌 가닥 — 뿌리 칸(2cm) 이웃 길이 중앙값 대비
    var RC = RS.rootCell, rc = new Map();
    for (i = 0; i < n; i++) { var f = info[i]; if (!f) continue; var kk = keyOf(Math.floor(f.r.x / (RC * 2)), Math.floor(f.r.y / (RC * 2)), Math.floor(f.r.z / (RC * 2))), a = rc.get(kk); if (!a) rc.set(kk, a = []); a.push(f.L); }
    rc.forEach(function (a) { a.sort(function (x, y) { return x - y; }); a.med = a[a.length >> 1]; });
    var cells = new Map(), good = 0;
    for (i = 0; i < n; i++) {
      var g = info[i]; if (!g || g.rev) continue;
      var a2 = rc.get(keyOf(Math.floor(g.r.x / (RC * 2)), Math.floor(g.r.y / (RC * 2)), Math.floor(g.r.z / (RC * 2))));
      if (a2 && a2.length >= 4 && g.L < a2.med * RS.shortK) { shortN++; continue; }
      var k3 = keyOf(Math.floor(g.r.x / RC), Math.floor(g.r.y / RC), Math.floor(g.r.z / RC)), b = cells.get(k3);
      if (!b) cells.set(k3, b = []); b.push(i); good++;
    }
    ST.built = { strayV: strayV, strayN: strayN, n: n, good: good, rev: rev, revRoot: revRoot, revFlip: revFlip, flipN: flipN, short: shortN, vox: flow.size, ms: Date.now() - t0 };
    try { console.log(TAG + ' 본보기 — 기른 가닥 ' + n + ' 중 ' + good + '개 · 거꾸로 자란 가닥 ' + rev + '(그중 42번이 위로 뒤집어 기른 것 ' + revFlip + '/' + flipN + ') · 짧게 막힌 가닥 ' + shortN + ' · ' + ST.built.ms + 'ms'); } catch (e) {}
    return { m: m, arr: S, cells: cells };
  }
  function index() {
    var m = model(); if (!m || !m.strands || !m.strands.length) return null;
    if (!IDX || IDX.m !== m || IDX.arr !== m.strands) IDX = buildIndex(m);
    return IDX;
  }
  RS.reindex = function () { IDX = null; return index() ? ST.built : null; };

  function resample(p, M) {
    var S = [0], i, j = 0, n = p.length; for (i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z));
    var L = S[n - 1]; if (!(L > 0)) return p;
    var out = new Array(M); for (i = 0; i < M; i++) { var s = L * i / (M - 1); while (j < n - 2 && S[j + 1] < s) j++; var u = (s - S[j]) / Math.max(1e-12, S[j + 1] - S[j]); out[i] = { x: p[j].x + (p[j + 1].x - p[j].x) * u, y: p[j].y + (p[j + 1].y - p[j].y) * u, z: p[j].z + (p[j + 1].z - p[j].z) * u }; }
    return out;
  }
  /* (2026-10-12s) 컬 타래 — 사진에서 읽은 타래 조각 기준(61번 clumpOfPath). 본보기 가닥마다 지나간 조각을 붙여 두고(buildIndex 뒤 한 번),
   *  옮겨심을 때 그 조각의 대표 길(조각에 걸린 기른 가닥 중 가장 긴 것)로 뿌리에서 lockRootCm 지나며 lockPull만큼 당김. 조각에 안 걸린 가닥은 그대로. */
  function clumpTable(ix) {
    if (ix.clT !== undefined) return ix.clT;
    var PC = W.PHOTO_CURL; ix.clT = null;
    if (!PC || typeof PC.clumpOfPath !== 'function' || typeof PC.lockOn !== 'function' || !PC.lockOn()) return null;
    var t0 = Date.now(), of = new Map(), ex = new Map(), lenOf = new Map(), n = 0;
    ix.cells.forEach(function (L) { L.forEach(function (i) {
      var p = ix.arr[i].pts, c = PC.clumpOfPath(p); if (!c) return; of.set(i, c); n++;
      var L0 = 0, k; for (k = 1; k < p.length; k++) L0 += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y, p[k].z - p[k - 1].z);
      if (!(lenOf.get(c.key) >= L0)) { lenOf.set(c.key, L0); ex.set(c.key, i); }
    }); });
    ix.clT = { of: of, ex: ex };
    ST.clumps = { strands: n, clumps: ex.size, ms: Date.now() - t0 };
    try { console.log(TAG + ' 사진 타래 조각 — 본보기 ' + n + '가닥이 조각 ' + ex.size + '개에 걸림 · ' + ST.clumps.ms + 'ms'); } catch (e) {}
    return ix.clT;
  }
  function pullToClump(ix, bi, root, pts) {
    var T = clumpTable(ix); if (!T) return null;
    var c = T.of.get(bi); if (!c) return null;
    var ei = T.ex.get(c.key); if (!(ei >= 0)) return null;
    var out = { lk: c, pts: pts };
    if (ei === bi || !(RS.lockPull > 0)) return out;
    var src = ix.arr[ei].pts, q0 = src[0], M = pts.length, lp = new Array(src.length), k;
    for (k = 0; k < src.length; k++) lp[k] = { x: src[k].x - q0.x + root.x, y: src[k].y - q0.y + root.y, z: src[k].z - q0.z + root.z };
    lp = resample(lp, M);
    var S = 0, o = [pts[0]], rU = RS.lockRootCm / cpu();
    for (k = 1; k < M; k++) {
      S += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y, pts[k].z - pts[k - 1].z);
      var w = Math.min(1, S / Math.max(1e-6, rU)); w = RS.lockPull * w * w * (3 - 2 * w);
      o.push({ x: pts[k].x + (lp[k].x - pts[k].x) * w, y: pts[k].y + (lp[k].y - pts[k].y) * w, z: pts[k].z + (lp[k].z - pts[k].z) * w });
    }
    ST.locked = (ST.locked || 0) + 1; out.pts = o;
    return out;
  }
  function nearest(ix, p) {
    var RC = RS.rootCell, cx = Math.floor(p.x / RC), cy = Math.floor(p.y / RC), cz = Math.floor(p.z / RC), best = -1, bd = Infinity, r, a, b, c;
    for (r = 0; r <= RS.reach; r++) {
      for (a = -r; a <= r; a++) for (b = -r; b <= r; b++) for (c = -r; c <= r; c++) {
        if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) !== r) continue;
        var L = ix.cells.get(keyOf(cx + a, cy + b, cz + c)); if (!L) continue;
        for (var t = 0; t < L.length; t++) { var q = ix.arr[L[t]].pts[0], d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) + (q.z - p.z) * (q.z - p.z); if (d < bd) { bd = d; best = L[t]; } }
      }
      if (best >= 0 && Math.sqrt(bd) <= (r + 0.5) * RC) break;              // 다음 고리에 더 가까운 게 있을 수 없음
    }
    return best;
  }

  /* ── B. 슬라이더 — 59번 adjustFlow와 같은 "기준에서 움직인 만큼만" · 컬은 올린 만큼만 ── */
  function adjustRead(s, g, base, lenOverride, styOverride, lk) {
    var cur = (state.sections && state.sections[s.sec]) || {};
    var sty = (styOverride !== undefined ? styOverride : uniformStyling()) || stylingForRoot(s.pts[0]) || {};
    var dlen = 50; try { dlen = SECTIONS[s.sec].defaults.length; } catch (e) {}
    var r = sectionLengthRatio(s.sec, typeof lenOverride === 'number' ? lenOverride : cur.length) / (sectionLengthRatio(s.sec, dlen) || 1);
    if (isFinite(r) && Math.abs(r - 1) > 1e-6) g = lengthStrand3D(g, r);
    if (RS.shape) { try { var PCx = W.PHOTO_CURL; if (PCx && typeof PCx.applyShape === 'function') { var g2 = PCx.applyShape(g, lk); if (g2 && g2 !== g) { g = g2; ST.shaped = (ST.shaped || 0) + 1; } } } catch (e) {} }   // (2026-10-12j) 옮겨심은 축 위에 사진 선 굴곡
    var curl = Math.max(0, cur.curl || 0), C0 = base.curl || 0, dC = curl - C0;
    var sweep = Math.max(-100, Math.min(100, (sty.sweep || 0) - (base.sweep || 0)));
    var vol = Math.max(0, Math.min(100, 50 + ((typeof sty.volume === 'number' ? sty.volume : 50) - (typeof base.volume === 'number' ? base.volume : 50))));
    var samePart = (sty.part || 0) === (base.part || 0) && (sty.partAmt || 0) === (base.partAmt || 0);
    var part = samePart ? 0 : (sty.part || 0), partAmt = samePart ? 0 : sty.partAmt;
    if (dC > 1) { g = curlStrand3D(g, dC, (typeof cur.wave === 'number' ? cur.wave : 50) / 100, typeof cur.curlDir === 'number' ? cur.curlDir : 0); g = gravityDroop3D(g, dC); ST.curlAdd++; }
    g = partStrand3D(g, part, curl, partAmt);
    g = sweepStrand3D(g, sweep, curl, part, partAmt);
    g = volumeStrand3D(g, vol, s.sec);
    g = flowCurlStrand3D(g, sty.flow || 0);
    g = sleekStrand3D(g, typeof sty.sleek === 'number' ? sty.sleek : 0);
    return g;
  }

  var prevAdj = W.adjustStrandGeom;
  if (typeof prevAdj === 'function') W.adjustStrandGeom = function (s, lenOverride, styOverride) {
    if (RS.on && s && s.mannequin && s.pts && s.pts.length >= 2 && isOrig()) {
      try {
        var ix = index();
        if (ix) {
          var mem = s._rsh;
          if (mem && mem.ix === ix && mem.stub) return mem.stub;
          if (!mem || mem.ix !== ix) {
            var root = s.pts[0], bi = nearest(ix, root), pts = null;
            if (bi >= 0) {
              var src = ix.arr[bi].pts, q0 = src[0], dx = root.x - q0.x, dy = root.y - q0.y, dz = root.z - q0.z, k;
              pts = new Array(src.length);
              // (2026-10-13a) 목·옆머리 잔가닥 — 사진에 머리가 없어 안 심은 뿌리(목선·귀 둘레) 자리의 마네킹 뿌리는 몇 cm 떨어진 본보기 길을
              //   통째로 옮겨 왔음 → 길 전체가 그만큼 비켜 3D 머리 덩어리 밖(목 앞·귀 옆 공중)으로 나감. 이제 뿌리에서 offFadeCm에 걸쳐
              //   비킨 거리를 offKeepCm까지 줄여 본보기 길 옆으로 붙임(같은 길로 겹치지는 않게 조금 남김). 끄기 READ_SHAPE.offFadeCm=0
              var dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
              // (2026-10-13b) 목 가닥 — 사진에 머리가 없어 기른 가닥이 없는 자리(목선 아래·귀 뒤)의 마네킹 뿌리는 멀리(1.5~3cm) 있는 본보기 길을 받아,
              //   그 길까지 목 피부를 가로질러 가는 짧은 선("ㄴ" 모양)이 됨. 사진대로 그 자리는 머리가 없는 것이므로 그리지 않음(두피에 붙은 0.1mm 점). 끄기 READ_SHAPE.farCm=0
              if (RS.farCm > 0 && dl * cpu() > RS.farCm) { ST.farSkip = (ST.farSkip || 0) + 1; var tip = { x: root.x + (root.x) * 1e-4, y: root.y + 1e-5, z: root.z + root.z * 1e-4 }; mem = s._rsh = { ix: ix, pts: null, stub: [root, tip] }; return mem.stub; }
              var keepU = RS.offKeepCm / cpu(), fadeU = RS.offFadeCm / cpu(), acc = 0;
              var fr = (RS.offFadeCm > 0 && dl > keepU) ? keepU / dl : 1;
              if (fr < 1) ST.offPulled = (ST.offPulled || 0) + 1;
              for (k = 0; k < src.length; k++) {
                if (k) acc += Math.hypot(src[k].x - src[k - 1].x, src[k].y - src[k - 1].y, src[k].z - src[k - 1].z);
                var ww = fr < 1 ? Math.min(1, acc / Math.max(1e-6, fadeU)) : 0; ww = ww * ww * (3 - 2 * ww);
                var f2 = 1 - ww * (1 - fr);
                pts[k] = { x: src[k].x + dx * f2, y: src[k].y + dy * f2, z: src[k].z + dz * f2 };
              }
              if (RS.maxPts > 2 && pts.length > RS.maxPts) pts = resample(pts, RS.maxPts);
              var lk = null; if (RS.lockPull >= 0) { try { var pc2 = pullToClump(ix, bi, root, pts); if (pc2) { pts = pc2.pts; lk = pc2.lk; } } catch (e2) {} }   // (2026-10-12s) 사진 타래 조각
            }
            mem = s._rsh = { ix: ix, pts: pts, lk: (typeof lk !== 'undefined') ? lk : null };
            if (pts) ST.used++; else ST.fell++;
          }
          if (mem.pts) {
            // 기준 = 잰 값 그대로(옮겨심은 길에 이미 들어 있는 넘김·볼륨·컬) — 컬은 스펙이 섹션에 넣은 값(= 사진에서 잰 컬)
            var base = {}; try { var sp = W.ORIG_MQ.spec; base = Object.assign({}, (sp && sp.flowBase) || {}); if (sp && sp.perm && typeof sp.perm.curl === 'number') base.curl = sp.perm.curl; } catch (e) {}
            return adjustRead(s, mem.pts, base, lenOverride, styOverride, mem.lk);
          }
        }
      } catch (e) { if (!ST.err) console.warn(TAG + ' 옮겨심기 실패 — 예전 경로', e); ST.err = String(e && e.message || e); }
    }
    var outA = prevAdj.apply(this, arguments);
    try { if (s && s.mannequin && W.PHOTO_CURL && typeof W.PHOTO_CURL.activeRS === 'function') { var rs = W.PHOTO_CURL.activeRS(); if (rs && outA && outA.length > 1) { var o2 = W.PHOTO_CURL.applyShapeRS(RS.maxPts > 2 && outA.length > RS.maxPts ? resample(outA, RS.maxPts) : outA, rs); if (o2) { ST.rsShaped = (ST.rsShaped || 0) + 1; return o2; } } } } catch (e) {}   // (2026-10-12v) 다른 손님에게 건 스타일 — 결 표로 만든 길 위에 스타일에 실린 굴곡
    return outA;
  };
  else console.warn(TAG + ' adjustStrandGeom이 없어 모양 옮겨심기를 못 합니다');

  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments);
    try { if (RS.on && isOrig()) { var m = model(); s += '|rs1:' + (m ? m.strands.length : 0) + (RS.shape ? 's' : '') + RS.maxPts + 'L' + RS.lockPull + 'o' + RS.offKeepCm + ':' + RS.offFadeCm + 'f' + RS.farCm + (RS.strayOn ? 'y' + RS.strayOut + ':' + RS.strayCos : ''); } } catch (e) {}
    return s;
  };

  /* ── D. 뿌리 고르게 ─────────────────────────────────────────────────── */
  var origFill = W.fillUnseenRootCells;
  if (typeof origFill === 'function') W.fillUnseenRootCells = function (ro) {
    var r = origFill.apply(this, arguments);
    if (!RS.evenRoots) return r;
    try {
      var den = ro && ro.den, est = ro && ro.est; if (!den || !est) return r;
      var N = ro.NT * ro.NP, OFFv = typeof EST_OFFSCALP !== 'undefined' ? EST_OFFSCALP : 3, meas = [], i;
      for (i = 0; i < N; i++) if (est[i] === 0 && den[i] > 0) meas.push(den[i]);
      if (meas.length < 20) return r;
      meas.sort(function (a, b) { return a - b; });
      var base = meas[meas.length >> 1], low = base * RS.rootLow, up = 0, down = 0, left = 0;
      for (i = 0; i < N; i++) {
        if (est[i] === OFFv) continue;
        if (!(den[i] >= low)) { left++; continue; }
        if (den[i] < base) up++; else if (den[i] > base) down++;
        den[i] = base;
      }
      ST.roots = { base: +base.toFixed(2), up: up, down: down, left: left };
      console.log(TAG + ' 뿌리 고르게 — 머리 있는 칸을 보통 밀도 ' + ST.roots.base + '로: 올린 칸 ' + up + ' · 내린 칸(밀집 띠) ' + down + ' · 보통의 ' + RS.rootLow + ' 미만이라 남긴 칸 ' + left + '(64번이 작은 덩어리는 채우고 넓게 빈 곳은 대머리로 둠) · 끄기 READ_SHAPE.evenRoots=false');
    } catch (e) { ST.err = '뿌리: ' + (e && e.message || e); }
    return r;
  };

  RS.lines = function () {
    var b = ST.built, w = ST.wave, ro = ST.roots;
    return [TAG + ' ' + (RS.on ? '켜짐' : '꺼짐') +
      ' · 웨이브 사진 직모 뼈대 안 씀: ' + (!RS.waveRaw ? '꺼짐' : w ? (w.wave ? '웨이브(고리 ' + (+w.loop).toFixed(2) + ') → 읽은 길 그대로' : '고리 컬이라 예전대로') : '아직') +
      ' · 옮겨심은 마네킹 가닥 ' + ST.used + ' / 본보기 못 찾아 예전 경로 ' + ST.fell + (ST.offPulled ? ' · 멀리서 옮겨 와 본보기 옆으로 붙인 가닥 ' + ST.offPulled : '') + (ST.curlAdd ? ' · 컬 더 감은 가닥 ' + ST.curlAdd : '') +
      (b ? '\n  본보기: 기른 가닥 ' + b.n + ' 중 ' + b.good + ' · 거꾸로 자란 가닥 ' + b.rev + '(42번이 위로 뒤집은 ' + b.flipN + ' 중 ' + b.revFlip + ') · 짧게 막힌 ' + b.short + ' · ' + b.ms + 'ms' : '') +
      (ro ? '\n  뿌리 고르게: 보통 밀도 ' + ro.base + ' · 올린 칸 ' + ro.up + ' · 내린 칸 ' + ro.down + ' · 남긴 칸 ' + ro.left : '') +
      (ST.err ? ' · ⚠ ' + ST.err : '')];
  };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () { var L = ppl.apply(this, arguments) || []; try { L = L.concat(RS.lines()); } catch (e) {} return L; };
  console.log(TAG + ' 설치 — 원본 머리 = 방향필터로 읽은 가닥 모양을 마네킹 뿌리에 옮겨심음 · 거꾸로 자란 가닥은 본보기에서 뺌 · 뿌리 고르게. 끄기 READ_SHAPE.on / waveRaw / evenRoots = false');
})();
