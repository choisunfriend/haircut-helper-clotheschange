/* ==========================================================================
 * 56-neighbor-align.js — 다시 기른 머리: 다 기른 뒤 "뿌리 이웃"을 기준으로 결 정렬 (v3 · 2026-10-07 연쇄로 다시 짬)
 *
 * 로드 위치: index.html 맨 끝(55-fly-trim.js 다음). 42-regrow.js는 고치지 않습니다.
 *
 * 왜 v3 (2026-10-07 · 사용자): "원본 다시 기르기 자체가 빗 기능 사용 이전에 이웃 결들이랑 나란히 정렬돼서 빗 기능이 필요 없어야 한다."
 *   "(이웃 자리에서 멀어서 · 거의 반대라서 건너뛰는 것은) 인근 뿌리 기준으로 하면 이유가 상쇄되잖아. 머리카락은 인근 마디가 같이 연결되어서
 *   연쇄적으로 움직여야 되는 거다." "100도 넘게 반대가 되는 경우는 컬을 적용한 경우 말고는 있을 수가 없다."
 *   v2 실측(2026-10-07 로그 · 직모 긴 머리 29,237가닥): 돌린 마디 32,199 · "이웃 자리에서 멀어" 그대로 둔 마디 22,332 · "거의 반대라" 그대로 둔 마디 14,729.
 *   v2는 방향·위치를 전부 "고치기 전 가닥"에서 한 번에 읽고 나서 가닥을 다시 이었습니다. 그래서
 *     · 위에서 한 번 벗어난 가닥은 그 아래 마디가 전부 "이웃 자리에서 멀다"로 빠졌고,
 *     · 허용 각 안에서 조금씩 벗어나 결과 나란한 채 떠 있는 가닥은 돌릴 마디가 하나도 없었고(방향만 봄),
 *     · 100° 넘게 반대인 마디는 길이와 상관없이 전부 그대로 뒀습니다.
 *
 * 무엇을 (42번이 가닥을 다 기른 직후 · v7 결 정렬 "앞"에 한 번 — 자리는 v2와 같음):
 *   기준(이웃) = v2 그대로: 뿌리가 가까운 가닥(뿌리 칸 cell ≈ 1.2cm · 옆 칸과 섞음)들이 "뿌리에서 같은 길이만큼 간 자리"에서
 *     어느 쪽으로 가는가(방향) · 뿌리에서 보아 어디에 있는가(자리) · 그 자리가 얼마나 퍼져 있는가(폭 — v3에서 더함).
 *   고치는 법 = 연쇄: 뿌리에서부터 한 마디씩 걸으며, 다음 마디는 "이미 고쳐서 이어 온 자리"에서 판정합니다.
 *     ① 방향 — 이웃 결에서 alignTol° 넘게 벗어난 마디를 이웃 결 쪽으로(alignFull° 이상은 alignK만큼). v2와 같은 식.
 *     ② 자리 — 이어 온 자리가 이웃들의 자리에서 "이웃이 원래 퍼진 폭"(posK × 퍼짐 · 최소 posMin + posGrow × 길이) 밖이면
 *        그 폭 안으로 들어올 때까지 마디를 이웃 자리 쪽으로 기울입니다(한 마디에 pullMax°까지 · 폭 안은 안 건드림 → 볼륨은 남음).
 *        결과 나란한 채 떠 있는 가닥이 여기서 붙습니다. 마디 길이는 그대로(방향만 틂).
 *        v2의 "이웃 자리에서 멀면 그대로 둠"은 없앴습니다 — 벗어나기 시작한 자리에서 바로잡으므로 그 아래가 멀어지지 않습니다.
 *     ③ 반대 마디(alignFlip° 넘게) — 연달아 반대인 구간의 길이로 가릅니다.
 *        짧은 구간(flipShort ≈ 2.5cm 이하 = 꺾였다 돌아오는 자리)은 이웃 결로 폅니다.
 *        긴 구간은 그대로 두고, 그 가닥은 거기서부터 끝까지 손대지 않습니다(다른 쪽으로 넘어간 머리로 봄).
 *   그대로 둔 것(42번 값을 읽음): 뿌리 보호(alignRoot까지 한 점도 안 옮김 · alignRootFade에 걸쳐 서서히) · alignTol/alignFull/alignK ·
 *     이웃 결집도 < alignCoh인 자리(가르마·가마)는 기준으로 안 씀 · 곱슬 세기(kMul — 0이면 아무것도 안 함) · 마디 길이 · 꼬리 자르기 없음.
 *
 * ⚠ 합성 머리로만 확인했습니다(실제 손님 사진으로는 못 돌려 봄). 진단 [이웃 결 정렬] 줄에 방향으로 돌린 마디 · 자리로 당긴 마디 ·
 *   편 꺾임 · 그대로 둔 긴 반대 구간 · "이웃 폭 밖에 있던 마디 전 → 후"가 찍힙니다. 전 → 후가 안 줄면 이 파일이 안 듣는 것입니다.
 *   v2 동작으로: NEIGHBOR_ALIGN.chain=false (그러면 flip·far 규칙도 v2 그대로)
 *
 * 끄기: NEIGHBOR_ALIGN.on=false 후 NEIGHBOR_ALIGN.rebuild() (값을 바꾼 뒤에도 rebuild — 머리를 다시 기릅니다)
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[이웃 결 정렬]';
  var G = W.REGROW;
  if (!G || typeof G.alignStrands !== 'function') { console.warn(TAG + ' REGROW.alignStrands를 못 찾아 건너뜀(42-regrow.js 다음에 넣어야 합니다)'); return; }

  var NB = W.NEIGHBOR_ALIGN = Object.assign({
    on: true,
    cell: 0.07,          // 뿌리 이웃 칸(모델 단위 ≈ 1.2cm)
    bin: 0.03,           // 뿌리에서 잰 길이 칸(≈ 0.5cm)
    maxBins: 160,        // 길이 칸 상한(≈ 79cm) — 그보다 긴 구간은 마지막 칸으로
    minN: 6,             // 그 자리까지 자란 이웃이 이만큼은 돼야 기준으로 씀
    trim: 45,            // 도: 이웃 평균을 다시 낼 때 첫 평균에서 이 안쪽인 마디만 씀
    spreadK: 1.3,        // 이웃이 원래 벌어진 자리는 기준 각을 (퍼짐 × 이 값)까지 넓힘 · 0 = 안 넓힘
    nearMin: 0.06, nearK: 0.6,  // (v2만 씀) 뿌리 이웃들의 자리에서 (nearMin + nearK × 뿌리에서의 길이)보다 멀리 떨어진 마디는 안 건드림
    // ── v3(연쇄)
    chain: true,         // false = v2 동작 그대로
    posK: 1.5,           // 이웃 자리의 퍼짐 × 이 값까지는 제자리로 봄(볼륨을 남기는 폭) — 줄이면 더 붙고 납작해짐
    posMin: 0.03, posGrow: 0.02,   // 그 폭의 하한 = posMin + posGrow × 뿌리에서의 길이(모델 단위 · 0.03 ≈ 0.5cm)
    pullMax: 25,         // 도: 폭 밖의 마디를 이웃 자리 쪽으로 기울이는 상한(한 마디에) · 0 = 자리는 안 봄(방향만)
    flipShort: 0.14,     // 연달아 반대(alignFlip° 넘게)인 구간이 이 길이(≈ 2.5cm) 이하면 꺾임으로 보고 폄 · 더 길면 거기서부터 그대로
    // 돌리는 세기·각도·뿌리 보호·곱슬 처리는 REGROW(42번)의 alignK · alignTol · alignFull · alignFlip · alignCoh · alignRoot · alignRootFade를 그대로 읽습니다
  }, W.NEIGHBOR_ALIGN || {});
  var S = NB.stats = null;

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function qv(a, f) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * f))]; }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }

  var OFFA = 512, SP = 1024, WGT = [1, 0.6, 0.3, 0.15];
  function keyOf(p, cell) {
    var a = Math.floor(p.x / cell) + OFFA, b = Math.floor(p.y / cell) + OFFA, c = Math.floor(p.z / cell) + OFFA;
    if (a < 1 || b < 1 || c < 1 || a >= SP - 1 || b >= SP - 1 || c >= SP - 1) return -1;
    return a + SP * (b + SP * c);
  }

  /* ── v2(NEIGHBOR_ALIGN.chain=false일 때만 씀 · 손대지 않음) ──
     뿌리 칸 × 길이 칸마다 이웃들의 방향 합(x,y,z) · 마디 수 · 뿌리에서 본 마디 위치 합(x,y,z). own[si] = 그 가닥의 뿌리 칸 번호(-1 = 없음).
     ref가 있으면 그 평균에서 trim° 안쪽인 마디만 넣음 */
  function buildField2(strands, nb, ref, cTrim, coh) {
    var cell = NB.cell, bin = NB.bin, n = strands.length, map = new Map(), raw = [], keys = [], own = new Int32Array(n);
    var si, p, m, i, k, id, A, arc, ux, uy, uz, len, b, b0, b1, RF, rx, ry, rz, rn, rl;
    for (si = 0; si < n; si++) {
      own[si] = -1; p = strands[si] && strands[si].pts; if (!p || p.length < 2) continue;
      k = keyOf(p[0], cell); if (k < 0) continue;
      id = map.get(k);
      if (id === undefined) { id = raw.length; map.set(k, id); raw.push(new Float32Array(nb * 7)); keys.push(k); }
      own[si] = id; A = raw[id]; arc = 0; m = p.length;
      RF = ref ? ref.F[ref.own[si]] : null;
      for (i = 1; i < m; i++) {
        ux = p[i].x - p[i - 1].x; uy = p[i].y - p[i - 1].y; uz = p[i].z - p[i - 1].z; len = Math.sqrt(ux * ux + uy * uy + uz * uz);
        if (!(len > 1e-9)) continue;
        ux /= len; uy /= len; uz /= len;
        var ox = (p[i].x + p[i - 1].x) * 0.5 - p[0].x, oy = (p[i].y + p[i - 1].y) * 0.5 - p[0].y, oz = (p[i].z + p[i - 1].z) * 0.5 - p[0].z;
        b0 = Math.min(nb - 1, Math.floor(arc / bin)); arc += len; b1 = Math.min(nb - 1, Math.floor((arc - 1e-9) / bin));
        for (b = b0; b <= b1; b++) {                                            // 마디가 걸친 길이 칸마다
          if (RF) {
            rx = RF[b * 7]; ry = RF[b * 7 + 1]; rz = RF[b * 7 + 2]; rn = RF[b * 7 + 3]; rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
            if (!(rn >= NB.minN) || !(rl / rn >= coh) || (ux * rx + uy * ry + uz * rz) / rl < cTrim) continue;
          }
          A[b * 7] += ux; A[b * 7 + 1] += uy; A[b * 7 + 2] += uz; A[b * 7 + 3] += 1; A[b * 7 + 4] += ox; A[b * 7 + 5] += oy; A[b * 7 + 6] += oz;
        }
      }
    }
    // 옆 칸과 섞음(칸 경계에서 기준이 뚝 바뀌지 않게)
    var out = new Array(raw.length), dx, dy, dz, j, w, B, R, t, L = nb * 7;
    for (id = 0; id < raw.length; id++) {
      B = new Float32Array(L); k = keys[id];
      for (dz = -1; dz <= 1; dz++) for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
        j = map.get(k + dx + SP * (dy + SP * dz)); if (j === undefined) continue;
        w = WGT[Math.abs(dx) + Math.abs(dy) + Math.abs(dz)]; R = raw[j];
        for (t = 0; t < L; t++) if (R[t]) B[t] += w * R[t];
      }
      out[id] = B;
    }
    return { F: out, own: own, cells: raw.length };
  }
  /* 칸별 기준 — M[칸][길이 칸 × 9] = 이웃 방향(x,y,z) · cos(tol) · cos(full) · 쓸 수 있나(0/1) · 뿌리에서 본 이웃들의 평균 위치(x,y,z) */
  function consensus2(strands, nb, P) {
    var f0 = buildField2(strands, nb, null, 0, P.coh), f1 = buildField2(strands, nb, f0, Math.cos(NB.trim * Math.PI / 180), P.coh);
    var M = new Array(f0.F.length), id, b, A, B, R, sx, sy, sz, cn, ml, n0, l0, R1, sig, tol, wid = P.full - P.tol;
    for (id = 0; id < f0.F.length; id++) {
      A = f0.F[id]; B = f1.F[id]; R = M[id] = new Float32Array(nb * 9);
      for (b = 0; b < nb; b++) {
        n0 = A[b * 7 + 3]; if (!(n0 >= NB.minN)) continue;
        l0 = Math.sqrt(A[b * 7] * A[b * 7] + A[b * 7 + 1] * A[b * 7 + 1] + A[b * 7 + 2] * A[b * 7 + 2]);
        if (!(l0 / n0 >= P.coh)) continue;                                     // 이웃이 갈림(가르마·가마)
        sx = B[b * 7]; sy = B[b * 7 + 1]; sz = B[b * 7 + 2]; cn = B[b * 7 + 3]; ml = Math.sqrt(sx * sx + sy * sy + sz * sz);
        if (!(cn >= NB.minN) || !(cn >= 0.5 * n0) || !(ml > 1e-6)) continue;   // 평균 둘레에 모인 마디가 절반도 안 됨
        R1 = Math.min(1, ml / cn); sig = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-6, R1)))) * 180 / Math.PI;   // 이웃 퍼짐(도)
        tol = Math.max(P.tol, (NB.spreadK > 0 ? NB.spreadK : 0) * sig);
        R[b * 9] = sx / ml; R[b * 9 + 1] = sy / ml; R[b * 9 + 2] = sz / ml;
        R[b * 9 + 3] = Math.cos(Math.min(170, tol) * Math.PI / 180); R[b * 9 + 4] = Math.cos(Math.min(175, tol + wid) * Math.PI / 180);
        R[b * 9 + 5] = 1;
        R[b * 9 + 6] = B[b * 7 + 4] / cn; R[b * 9 + 7] = B[b * 7 + 5] / cn; R[b * 9 + 8] = B[b * 7 + 6] / cn;
      }
    }
    return { M: M, own: f0.own, cells: f0.cells };
  }

  /* strands를 그 자리에서 고침. kMul = 42번이 넘겨주는 정렬 세기(1 = 직모 · 0 = 곱슬) — v7과 같은 뜻 */
  NB.runV2 = function (strands, CY, kMul) {
    var st = { on: !!NB.on, skipped: '', n: strands ? strands.length : 0, strands: 0, segs: 0, rot: [], kept: 0, flipKept: 0, farKept: 0, pushed: 0, cells: 0, kMul: kMul == null ? 1 : kMul, root: 0, ms: 0 };
    if (!NB.on || !strands || !strands.length) return st;
    if (!G.align) { st.skipped = 'REGROW.align=false'; return st; }
    if (kMul != null && !(kMul > 0.01)) { st.skipped = '곱슬 — 정렬 안 함(42번 alignCurlOff)'; return st; }
    var t0 = now();
    var tolD = num(G.alignTol, 12), fullD = num(G.alignFull, 40), flipD = num(G.alignFlip, 100);
    if (!(fullD > tolD + 1)) fullD = tolD + 1;
    var K = num(G.alignK, 0.75) * (kMul == null ? 1 : Math.min(1, kMul));
    var rootKeep = Math.max(0, num(G.alignRoot, 0.15)), rootFade = Math.max(0, num(G.alignRootFade, 0.1));
    var cFlip = Math.cos(flipD * Math.PI / 180);
    var P = { tol: tolD, full: fullD, coh: num(G.alignCoh, 0.6) };
    st.root = rootKeep;
    var Es = null; try { Es = getScalpEllipsoid(); } catch (e) { Es = null; }
    if (!Es || !(Es.a > 0) || !(Es.b > 0) || !(Es.c > 0)) Es = null;
    if (!isFinite(CY)) CY = 0.15;
    // 길이 칸 수
    var maxArc = 0, si, p, i, a, n = strands.length;
    for (si = 0; si < n; si++) { p = strands[si] && strands[si].pts; if (!p) continue; a = 0; for (i = 1; i < p.length; i++) a += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); if (a > maxArc) maxArc = a; }
    var nb = Math.max(4, Math.min(NB.maxBins | 0, Math.floor(maxArc / NB.bin) + 2)), bin = NB.bin;
    var fld = consensus2(strands, nb, P); st.cells = fld.cells;
    var U = new Float64Array(4 * 256), WR = new Float32Array(256);
    for (si = 0; si < n; si++) {
      if (fld.own[si] < 0) continue;
      var s = strands[si]; p = s.pts; var m = p.length; if (m < 3) continue;
      if (U.length < m * 4) { U = new Float64Array(m * 4 + 128); WR = new Float32Array(m + 32); }
      var B = fld.M[fld.own[si]], arc = 0, lo = m, hi = 0, last = m - 1;
      for (i = 1; i < m; i++) {
        var ux = p[i].x - p[i - 1].x, uy = p[i].y - p[i - 1].y, uz = p[i].z - p[i - 1].z, len = Math.sqrt(ux * ux + uy * uy + uz * uz), wr = 0;
        if (len > 1e-9) {
          ux /= len; uy /= len; uz /= len;
          var b = Math.min(nb - 1, Math.floor((arc + len * 0.5) / bin)); arc += len;
          // 뿌리 보호 — v7과 같은 식(뿌리에서 이 마디 끝까지의 길이로 잼)
          wr = arc <= rootKeep ? 0 : (arc < rootKeep + rootFade ? (arc - rootKeep) / rootFade : 1);
          if (wr > 0 && B[b * 9 + 5]) {
            var mx = B[b * 9], my = B[b * 9 + 1], mz = B[b * 9 + 2], cTol = B[b * 9 + 3], cFull = B[b * 9 + 4];
            var dot = ux * mx + uy * my + uz * mz;
            var ex = (p[i].x + p[i - 1].x) * 0.5 - p[0].x - B[b * 9 + 6], ey = (p[i].y + p[i - 1].y) * 0.5 - p[0].y - B[b * 9 + 7], ez = (p[i].z + p[i - 1].z) * 0.5 - p[0].z - B[b * 9 + 8];
            var gate = NB.nearMin + NB.nearK * arc;
            if (dot <= cFlip) st.flipKept++;                                    // 거의 반대 — 그대로 둠
            else if (ex * ex + ey * ey + ez * ez > gate * gate) st.farKept++;   // 이웃들 자리에서 이미 멀리 떨어짐 — 그대로 둠
            else if (dot < cTol) {
              var tt = (cTol - dot) / Math.max(1e-6, cTol - cFull); if (tt > 1) tt = 1;
              var w = K * tt * tt * (3 - 2 * tt) * wr;
              var tx = ux + (mx - ux) * w, ty = uy + (my - uy) * w, tz = uz + (mz - uz) * w, tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (tl > 1e-3 && w > 0.01) {
                tx /= tl; ty /= tl; tz /= tl;
                st.segs++; if (st.segs % 13 === 0) st.rot.push(Math.acos(Math.max(-1, Math.min(1, ux * tx + uy * ty + uz * tz))) * 180 / Math.PI);
                ux = tx; uy = ty; uz = tz; if (i < lo) lo = i; if (i > hi) hi = i;
              }
            }
          }
        } else { ux = 0; uy = -1; uz = 0; len = 0; }
        U[i * 4] = ux; U[i * 4 + 1] = uy; U[i * 4 + 2] = uz; U[i * 4 + 3] = len; WR[i] = wr;
      }
      if (lo >= m) continue;                                                   // 돌린 마디 없음 — 가닥을 그대로 둠
      // 첫 바뀐 마디 앞의 점은 같은 점 그대로(뿌리 보호 구간은 전부 여기 들어감)
      var out = new Array(m), x = p[lo - 1].x, y = p[lo - 1].y, z = p[lo - 1].z, s1 = Math.min(last, hi + 1), ax, ay, az, al, i1, L = 0, q, q2;
      for (i = 0; i < lo; i++) out[i] = p[i];
      st.kept += lo;
      for (i = lo; i < m; i++) {
        ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2];
        if (i <= s1 && WR[i] >= 1) {                                           // 바뀐 구간은 이웃 마디와 한 번 고르게 — 뿌리 보호(서서히 구간 포함) 밖에서만
          i1 = i < last ? i + 1 : i;
          ax = U[(i - 1) * 4] + 2 * ax + U[i1 * 4]; ay = U[(i - 1) * 4 + 1] + 2 * ay + U[i1 * 4 + 1]; az = U[(i - 1) * 4 + 2] + 2 * az + U[i1 * 4 + 2];
          al = Math.sqrt(ax * ax + ay * ay + az * az);
          if (al > 1e-6) { ax /= al; ay /= al; az /= al; } else { ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; }
        }
        len = U[i * 4 + 3];
        x += ax * len; y += ay * len; z += az * len;
        q = { x: x, y: y, z: z };
        if (Es) {                                                              // 옮긴 점이 두상 안으로 들어가면 — 두피를 타고 가게(마디 길이 그대로)
          try {
            q2 = ellipsoidPushOut(q, Es.a, Es.b, Es.c, CY);
            if (q2 !== q) {
              var gx = q2.x / (Es.a * Es.a), gy = (q2.y - CY) / (Es.b * Es.b), gz = q2.z / (Es.c * Es.c), gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1, gd = (ax * gx + ay * gy + az * gz) / gl;
              if (gd < 0) {
                var hx = ax - gd * gx / gl, hy = ay - gd * gy / gl, hz = az - gd * gz / gl, hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
                if (hl > 1e-4) { q = { x: x - ax * len + hx / hl * len, y: y - ay * len + hy / hl * len, z: z - az * len + hz / hl * len }; q2 = ellipsoidPushOut(q, Es.a, Es.b, Es.c, CY); }
              }
              q = q2; x = q.x; y = q.y; z = q.z; st.pushed++;
            }
          } catch (e) {}
        }
        out[i] = q;
      }
      for (i = 1; i < m; i++) L += Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y, out[i].z - out[i - 1].z);
      st.strands++;
      try { if (p._rgKeep) out._rgKeep = true; } catch (e) {}
      s.pts = out;
      if (s.rg) { s.rg.L = L; s.rg.tipY = out[m - 1].y; }                      // v7과 같이 길이·끝 높이만 고침(뿌리 쪽 방향 값은 안 바뀜)
    }
    st.ms = now() - t0;
    return st;
  };

  /* ---------------------------------------------------------------------------------------------------------------
   * v3 — 연쇄 정렬
   * 칸 표: 뿌리 칸 × 길이 칸마다 13값 = 방향 합(x,y,z) · 마디 수 · 뿌리에서 본 자리 합(x,y,z) · 자리 2차 합(xx,yy,zz,xy,xz,yz)
   * ------------------------------------------------------------------------------------------------------------- */
  var RAWN = 13, MN = 10;
  function buildField3(strands, nb, ref, cTrim, coh) {
    var cell = NB.cell, bin = NB.bin, n = strands.length, map = new Map(), raw = [], keys = [], own = new Int32Array(n);
    var si, p, m, i, k, id, A, arc, ux, uy, uz, len, b, b0, b1, RF, rx, ry, rz, rn, rl, ox, oy, oz, o;
    for (si = 0; si < n; si++) {
      own[si] = -1; p = strands[si] && strands[si].pts; if (!p || p.length < 2) continue;
      k = keyOf(p[0], cell); if (k < 0) continue;
      id = map.get(k);
      if (id === undefined) { id = raw.length; map.set(k, id); raw.push(new Float32Array(nb * RAWN)); keys.push(k); }
      own[si] = id; A = raw[id]; arc = 0; m = p.length;
      RF = ref ? ref.F[ref.own[si]] : null;
      for (i = 1; i < m; i++) {
        ux = p[i].x - p[i - 1].x; uy = p[i].y - p[i - 1].y; uz = p[i].z - p[i - 1].z; len = Math.sqrt(ux * ux + uy * uy + uz * uz);
        if (!(len > 1e-9)) continue;
        ux /= len; uy /= len; uz /= len;
        ox = (p[i].x + p[i - 1].x) * 0.5 - p[0].x; oy = (p[i].y + p[i - 1].y) * 0.5 - p[0].y; oz = (p[i].z + p[i - 1].z) * 0.5 - p[0].z;
        b0 = Math.min(nb - 1, Math.floor(arc / bin)); arc += len; b1 = Math.min(nb - 1, Math.floor((arc - 1e-9) / bin));
        for (b = b0; b <= b1; b++) {
          if (RF) {
            o = b * RAWN; rx = RF[o]; ry = RF[o + 1]; rz = RF[o + 2]; rn = RF[o + 3]; rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
            if (!(rn >= NB.minN) || !(rl / rn >= coh) || (ux * rx + uy * ry + uz * rz) / rl < cTrim) continue;
          }
          o = b * RAWN;
          A[o] += ux; A[o + 1] += uy; A[o + 2] += uz; A[o + 3] += 1; A[o + 4] += ox; A[o + 5] += oy; A[o + 6] += oz; A[o + 7] += ox * ox; A[o + 8] += oy * oy; A[o + 9] += oz * oz; A[o + 10] += ox * oy; A[o + 11] += ox * oz; A[o + 12] += oy * oz;
        }
      }
    }
    var out = new Array(raw.length), dx, dy, dz, j, w, B, R, t, L = nb * RAWN;
    for (id = 0; id < raw.length; id++) {
      B = new Float32Array(L); k = keys[id];
      for (dz = -1; dz <= 1; dz++) for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
        j = map.get(k + dx + SP * (dy + SP * dz)); if (j === undefined) continue;
        w = WGT[Math.abs(dx) + Math.abs(dy) + Math.abs(dz)]; R = raw[j];
        for (t = 0; t < L; t++) if (R[t]) B[t] += w * R[t];
      }
      out[id] = B;
    }
    return { F: out, own: own, cells: raw.length };
  }
  /* 칸별 기준 — M[칸][길이 칸 × 10] = 이웃 방향(x,y,z) · cos(tol) · cos(full) · 쓸 수 있나 · 이웃 평균 자리(x,y,z) · 허용 폭(반지름) */
  function consensus3(strands, nb, P) {
    var f0 = buildField3(strands, nb, null, 0, P.coh), f1 = buildField3(strands, nb, f0, Math.cos(NB.trim * Math.PI / 180), P.coh);
    var M = new Array(f0.F.length), id, b, A, B, R, sx, sy, sz, cn, ml, n0, l0, R1, sig, tol, wid = P.full - P.tol, o, q, px, py, pz, v, lx, rad;
    for (id = 0; id < f0.F.length; id++) {
      A = f0.F[id]; B = f1.F[id]; R = M[id] = new Float32Array(nb * MN);
      for (b = 0; b < nb; b++) {
        o = b * RAWN; q = b * MN;
        n0 = A[o + 3]; if (!(n0 >= NB.minN)) continue;
        l0 = Math.sqrt(A[o] * A[o] + A[o + 1] * A[o + 1] + A[o + 2] * A[o + 2]);
        if (!(l0 / n0 >= P.coh)) continue;                                     // 이웃이 갈림(가르마·가마)
        sx = B[o]; sy = B[o + 1]; sz = B[o + 2]; cn = B[o + 3]; ml = Math.sqrt(sx * sx + sy * sy + sz * sz);
        if (!(cn >= NB.minN) || !(cn >= 0.5 * n0) || !(ml > 1e-6)) continue;
        R1 = Math.min(1, ml / cn); sig = Math.sqrt(Math.max(0, -2 * Math.log(Math.max(1e-6, R1)))) * 180 / Math.PI;
        tol = Math.max(P.tol, (NB.spreadK > 0 ? NB.spreadK : 0) * sig);
        R[q] = sx / ml; R[q + 1] = sy / ml; R[q + 2] = sz / ml;
        R[q + 3] = Math.cos(Math.min(170, tol) * Math.PI / 180); R[q + 4] = Math.cos(Math.min(175, tol + wid) * Math.PI / 180);
        R[q + 5] = 1;
        px = B[o + 4] / cn; py = B[o + 5] / cn; pz = B[o + 6] / cn;
        R[q + 6] = px; R[q + 7] = py; R[q + 8] = pz;
        // 이웃 자리의 퍼짐 — 결에 수직인 쪽만(결 방향으로 앞뒤 차이는 길이 차이지 뜬 것이 아님): 공분산 C에서 tr(C) − mᵀCm
        var mx = R[q], my = R[q + 1], mz = R[q + 2];
        var cxx = B[o + 7] / cn - px * px, cyy = B[o + 8] / cn - py * py, czz = B[o + 9] / cn - pz * pz, cxy = B[o + 10] / cn - px * py, cxz = B[o + 11] / cn - px * pz, cyz = B[o + 12] / cn - py * pz;
        v = cxx + cyy + czz - (mx * mx * cxx + my * my * cyy + mz * mz * czz + 2 * (mx * my * cxy + mx * mz * cxz + my * mz * cyz));
        lx = v > 0 ? Math.sqrt(v) : 0;
        rad = Math.max(NB.posMin + NB.posGrow * (b + 0.5) * NB.bin, NB.posK * lx);
        R[q + 9] = rad;
      }
    }
    return { M: M, own: f0.own, cells: f0.cells };
  }

  NB.runV3 = function (strands, CY, kMul) {
    var st = { v: 3, on: !!NB.on, skipped: '', n: strands ? strands.length : 0, strands: 0, segs: 0, pull: 0, rot: [], kept: 0, kinkRuns: 0, kinkSegs: 0, longRuns: 0, longSegs: 0,
      outBefore: 0, outAfter: 0, seen: 0, pushed: 0, cells: 0, kMul: kMul == null ? 1 : kMul, root: 0, ms: 0 };
    if (!NB.on || !strands || !strands.length) return st;
    if (!G.align) { st.skipped = 'REGROW.align=false'; return st; }
    if (kMul != null && !(kMul > 0.01)) { st.skipped = '곱슬 — 정렬 안 함(42번 alignCurlOff)'; return st; }
    var t0 = now();
    var tolD = num(G.alignTol, 12), fullD = num(G.alignFull, 40), flipD = num(G.alignFlip, 100);
    if (!(fullD > tolD + 1)) fullD = tolD + 1;
    var kc = (kMul == null ? 1 : Math.min(1, kMul)), K = num(G.alignK, 0.75) * kc;
    var rootKeep = Math.max(0, num(G.alignRoot, 0.15)), rootFade = Math.max(0, num(G.alignRootFade, 0.1));
    var cFlip = Math.cos(flipD * Math.PI / 180), tanMax = Math.tan(Math.max(0, Math.min(60, NB.pullMax)) * Math.PI / 180) * kc;
    var P = { tol: tolD, full: fullD, coh: num(G.alignCoh, 0.6) };
    st.root = rootKeep;
    var Es = null; try { Es = getScalpEllipsoid(); } catch (e) { Es = null; }
    if (!Es || !(Es.a > 0) || !(Es.b > 0) || !(Es.c > 0)) Es = null;
    if (!isFinite(CY)) CY = 0.15;
    var maxArc = 0, si, p, i, a, n = strands.length;
    for (si = 0; si < n; si++) { p = strands[si] && strands[si].pts; if (!p) continue; a = 0; for (i = 1; i < p.length; i++) a += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); if (a > maxArc) maxArc = a; }
    var nb = Math.max(4, Math.min(NB.maxBins | 0, Math.floor(maxArc / NB.bin) + 2)), bin = NB.bin;
    var fld = consensus3(strands, nb, P); st.cells = fld.cells;
    var U = new Float64Array(4 * 256), WR = new Float32Array(256), BI = new Int32Array(256), DT = new Float32Array(256), FL = new Uint8Array(256);

    for (si = 0; si < n; si++) {
      if (fld.own[si] < 0) continue;
      var s = strands[si]; p = s.pts; var m = p.length; if (m < 3) continue;
      if (U.length < m * 4) { U = new Float64Array(m * 4 + 128); WR = new Float32Array(m + 32); BI = new Int32Array(m + 32); DT = new Float32Array(m + 32); FL = new Uint8Array(m + 32); }
      var B = fld.M[fld.own[si]], arc = 0, last = m - 1, ux, uy, uz, len, wr, b, q;
      // ── 1) 원래 마디: 방향 · 길이 · 뿌리 보호 세기 · 길이 칸 · 이웃 결과의 내적
      for (i = 1; i < m; i++) {
        ux = p[i].x - p[i - 1].x; uy = p[i].y - p[i - 1].y; uz = p[i].z - p[i - 1].z; len = Math.sqrt(ux * ux + uy * uy + uz * uz); wr = 0; b = -1; FL[i] = 0; DT[i] = 1;
        if (len > 1e-9) {
          ux /= len; uy /= len; uz /= len;
          b = Math.min(nb - 1, Math.floor((arc + len * 0.5) / bin)); arc += len;
          wr = arc <= rootKeep ? 0 : (arc < rootKeep + rootFade ? (arc - rootKeep) / rootFade : 1);
          if (!B[b * MN + 5]) b = -1; else DT[i] = ux * B[b * MN] + uy * B[b * MN + 1] + uz * B[b * MN + 2];
        } else { ux = 0; uy = -1; uz = 0; len = 0; }
        U[i * 4] = ux; U[i * 4 + 1] = uy; U[i * 4 + 2] = uz; U[i * 4 + 3] = len; WR[i] = wr; BI[i] = b;
      }
      // ── 2) 반대 구간 가르기: 연달아 alignFlip° 넘게 반대인 마디 — 짧으면 1(폄) · 길면 2(거기서부터 끝까지 그대로)
      var stopAt = m, r0, rl, j;
      for (i = 1; i < m; i++) {
        if (!(WR[i] > 0) || BI[i] < 0 || !(DT[i] <= cFlip)) continue;
        r0 = i; rl = 0;
        while (i < m && WR[i] > 0 && (BI[i] < 0 || DT[i] <= cFlip)) { rl += U[i * 4 + 3]; i++; }   // 기준 없는 마디(BI < 0)는 구간을 끊지 않음
        while (i > r0 + 1 && BI[i - 1] < 0 && i < m) { i--; rl -= U[i * 4 + 3]; }                  // 다만 구간 끝에 붙은 기준 없는 마디는 뺌(가닥 끝까지 간 경우는 둠)
        if (rl <= NB.flipShort) { for (j = r0; j < i; j++) if (BI[j] >= 0) FL[j] = 1; st.kinkRuns++; st.kinkSegs += i - r0; }
        else { st.longRuns++; st.longSegs += i - r0; stopAt = r0; break; }
        i--;                                                                    // for의 i++와 맞춤
      }
      // ── 3) 연쇄: 뿌리에서부터, 이미 고쳐 이어 온 자리(x,y,z)에서 판정
      var x = p[0].x, y = p[0].y, z = p[0].z, lo = m, hi = 0, pdx = 0, pdy = -1, pdz = 0, R0x = p[0].x, R0y = p[0].y, R0z = p[0].z;
      var mx, my, mz, dot, tt, w, tx, ty, tz, tl, ex, ey, ez, el, em, rad, over, tn, cap, changed, ox0, oy0, oz0;
      for (i = 1; i < m; i++) {
        ux = U[i * 4]; uy = U[i * 4 + 1]; uz = U[i * 4 + 2]; len = U[i * 4 + 3]; wr = WR[i]; b = BI[i]; changed = false;
        if (wr > 0 && b >= 0 && len > 0) {
          q = b * MN; mx = B[q]; my = B[q + 1]; mz = B[q + 2]; rad = B[q + 9];
          // 진단: 고치기 전 이 마디가 이웃 폭 밖이었나
          ox0 = (p[i].x + p[i - 1].x) * 0.5 - R0x - B[q + 6]; oy0 = (p[i].y + p[i - 1].y) * 0.5 - R0y - B[q + 7]; oz0 = (p[i].z + p[i - 1].z) * 0.5 - R0z - B[q + 8];
          em = ox0 * mx + oy0 * my + oz0 * mz; ox0 -= em * mx; oy0 -= em * my; oz0 -= em * mz;
          st.seen++; if (ox0 * ox0 + oy0 * oy0 + oz0 * oz0 > rad * rad) st.outBefore++;
          if (i < stopAt) {
            dot = DT[i];
            if (FL[i]) {                                                        // 짧은 꺾임 — 이웃 결로 폄(지나온 방향과 섞어 뚝 꺾이지 않게)
              w = wr * kc; tx = pdx * (1 - w) + mx * w; ty = pdy * (1 - w) + my * w; tz = pdz * (1 - w) + mz * w; tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (tl > 1e-3) { ux = tx / tl; uy = ty / tl; uz = tz / tl; changed = true; }
            } else if (dot < B[q + 3]) {                                        // ① 방향
              tt = (B[q + 3] - dot) / Math.max(1e-6, B[q + 3] - B[q + 4]); if (tt > 1) tt = 1;
              w = K * tt * tt * (3 - 2 * tt) * wr;
              tx = ux + (mx - ux) * w; ty = uy + (my - uy) * w; tz = uz + (mz - uz) * w; tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (tl > 1e-3 && w > 0.01) {
                tx /= tl; ty /= tl; tz /= tl;
                st.segs++; if (st.segs % 13 === 0) st.rot.push(Math.acos(Math.max(-1, Math.min(1, ux * tx + uy * ty + uz * tz))) * 180 / Math.PI);
                ux = tx; uy = ty; uz = tz; changed = true;
              }
            }
            // ② 자리 — 이 마디를 이대로 놓았을 때의 가운데가 이웃 폭 밖이면 이웃 자리 쪽으로 기울임
            if (tanMax > 0) {
              ex = x + ux * len * 0.5 - R0x - B[q + 6]; ey = y + uy * len * 0.5 - R0y - B[q + 7]; ez = z + uz * len * 0.5 - R0z - B[q + 8];
              em = ex * mx + ey * my + ez * mz; ex -= em * mx; ey -= em * my; ez -= em * mz;   // 결 방향 성분은 뺌(앞뒤로 밀린 것은 길이 차이지 뜬 것이 아님)
              el = Math.sqrt(ex * ex + ey * ey + ez * ez);
              if (el > rad && el > 1e-6) {
                over = (el - rad) / Math.max(rad, 1e-4); if (over > 1) over = 1;
                tn = tanMax * over * (2 - over) * wr; cap = (el - rad) / len; if (tn > cap) tn = cap;   // 한 마디에 폭 안까지만(넘어가지 않게)
                if (tn > 0.003) {
                  tx = ux - tn * ex / el; ty = uy - tn * ey / el; tz = uz - tn * ez / el; tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
                  if (tl > 1e-3) { ux = tx / tl; uy = ty / tl; uz = tz / tl; st.pull++; changed = true; }
                }
              }
            }
          }
        }
        if (changed) { if (i < lo) lo = i; if (i > hi) hi = i; U[i * 4] = ux; U[i * 4 + 1] = uy; U[i * 4 + 2] = uz; }
        x += ux * len; y += uy * len; z += uz * len; if (len > 0) { pdx = ux; pdy = uy; pdz = uz; }
        if (wr > 0 && b >= 0 && len > 0) {                                      // 진단: 고친 뒤
          q = b * MN; mx = B[q]; my = B[q + 1]; mz = B[q + 2];
          ex = x - ux * len * 0.5 - R0x - B[q + 6]; ey = y - uy * len * 0.5 - R0y - B[q + 7]; ez = z - uz * len * 0.5 - R0z - B[q + 8];
          em = ex * mx + ey * my + ez * mz; ex -= em * mx; ey -= em * my; ez -= em * mz;
          if (ex * ex + ey * ey + ez * ez > B[q + 9] * B[q + 9] * 1.0201) st.outAfter++;
        }
      }
      if (lo >= m) continue;                                                   // 바뀐 마디 없음 — 가닥을 그대로 둠
      // ── 4) 다시 잇기: 첫 바뀐 마디 앞의 점은 같은 점 그대로(뿌리 보호 구간은 전부 여기 들어감)
      var out = new Array(m), s1 = Math.min(last, hi + 1), ax, ay, az, al, i1, L = 0, pt, q2;
      x = p[lo - 1].x; y = p[lo - 1].y; z = p[lo - 1].z;
      for (i = 0; i < lo; i++) out[i] = p[i];
      st.kept += lo;
      for (i = lo; i < m; i++) {
        ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2];
        if (i <= s1 && i > lo && WR[i] >= 1 && i < stopAt) {                    // 바뀐 구간은 이웃 마디와 한 번 고르게 — 뿌리 보호 밖 · 긴 반대 구간 앞에서만
          i1 = (i < last && i + 1 < stopAt) ? i + 1 : i;
          ax = U[(i - 1) * 4] + 2 * ax + U[i1 * 4]; ay = U[(i - 1) * 4 + 1] + 2 * ay + U[i1 * 4 + 1]; az = U[(i - 1) * 4 + 2] + 2 * az + U[i1 * 4 + 2];
          al = Math.sqrt(ax * ax + ay * ay + az * az);
          if (al > 1e-6) { ax /= al; ay /= al; az /= al; } else { ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; }
        }
        len = U[i * 4 + 3];
        x += ax * len; y += ay * len; z += az * len;
        pt = { x: x, y: y, z: z };
        if (Es) {                                                              // 두상 안으로 들어가면 두피를 타고 가게(마디 길이 그대로) — v2와 같음
          try {
            q2 = ellipsoidPushOut(pt, Es.a, Es.b, Es.c, CY);
            if (q2 !== pt) {
              var gx = q2.x / (Es.a * Es.a), gy = (q2.y - CY) / (Es.b * Es.b), gz = q2.z / (Es.c * Es.c), gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1, gd = (ax * gx + ay * gy + az * gz) / gl;
              if (gd < 0) {
                var hx = ax - gd * gx / gl, hy = ay - gd * gy / gl, hz = az - gd * gz / gl, hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
                if (hl > 1e-4) { pt = { x: x - ax * len + hx / hl * len, y: y - ay * len + hy / hl * len, z: z - az * len + hz / hl * len }; q2 = ellipsoidPushOut(pt, Es.a, Es.b, Es.c, CY); }
              }
              pt = q2; x = pt.x; y = pt.y; z = pt.z; st.pushed++;
            }
          } catch (e) {}
        }
        out[i] = pt;
      }
      for (i = 1; i < m; i++) L += Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y, out[i].z - out[i - 1].z);
      st.strands++;
      try { if (p._rgKeep) out._rgKeep = true; } catch (e) {}
      s.pts = out;
      if (s.rg) { s.rg.L = L; s.rg.tipY = out[m - 1].y; }
    }
    st.ms = now() - t0;
    return st;
  };
  NB.run = function (strands, CY, kMul) { return NB.chain ? NB.runV3(strands, CY, kMul) : NB.runV2(strands, CY, kMul); };

  /* 42번의 "다 기른 뒤" 자리에 끼움 — 뿌리 이웃 결 정렬 → (예전 그대로) v7 결 정렬 */
  var inner = G.alignStrands;
  G.alignStrands = function (strands, CY, kMul) {
    var st = null;
    try { st = NB.run(strands, CY, kMul); } catch (e) { st = { on: !!NB.on, err: String(e && e.message || e) }; console.warn(TAG + ' 실패(그대로 둠)', e); }
    S = NB.stats = st;
    try { console.log(NB.lines().join('\n')); } catch (e) {}
    return inner.apply(this, arguments);
  };

  NB.lines = function () {
    var s = S; if (!s) return [TAG + ' ' + (NB.on ? '대기 — 아직 다시 기른 머리가 없음' : '꺼짐')];
    if (s.err) return [TAG + ' ⚠ ' + s.err];
    if (!s.on) return [TAG + ' 꺼짐'];
    if (s.skipped) return [TAG + ' 건너뜀 — ' + s.skipped];
    var cm = 16.4; try { cm = modelCmPerUnit() || 16.4; } catch (e) {}
    var med = isFinite(qv(s.rot, 0.5)) ? qv(s.rot, 0.5).toFixed(1) : '0', p90 = isFinite(qv(s.rot, 0.9)) ? qv(s.rot, 0.9).toFixed(1) : '0';
    var tail = ' · 뿌리 칸 ' + s.cells + ' · ' + Math.round(s.ms) + 'ms — 끄기 NEIGHBOR_ALIGN.on=false 후 NEIGHBOR_ALIGN.rebuild()';
    if (s.v !== 3) return [TAG + ' (v2 동작) 가닥 ' + s.n + '개 중 돌린 것 ' + s.strands + '개(' + (s.n ? Math.round(s.strands / s.n * 100) : 0) + '%) · 마디 ' + s.segs +
      ' · 돌린 각 중앙값 ' + med + '° · 90% ' + p90 + '° · 세기 ×' + (+s.kMul).toFixed(2) + ' · 뿌리 ' + (s.root * cm).toFixed(1) + 'cm까지는 안 건드림 · 거의 반대라 그대로 둔 마디 ' + s.flipKept +
      ' · 이웃 자리에서 멀어 그대로 둔 마디 ' + s.farKept + tail];
    var pc = function (a) { return s.seen ? (a / s.seen * 100).toFixed(1) + '%' : '0%'; };
    return [TAG + ' (연쇄) 가닥 ' + s.n + '개 중 고친 것 ' + s.strands + '개(' + (s.n ? Math.round(s.strands / s.n * 100) : 0) + '%) · 방향으로 돌린 마디 ' + s.segs +
      '(돌린 각 중앙값 ' + med + '° · 90% ' + p90 + '°) · 이웃 자리 쪽으로 기울인 마디 ' + s.pull +
      ' · 편 꺾임 ' + s.kinkRuns + '곳(마디 ' + s.kinkSegs + ') · 길게 반대로 가서 그대로 둔 가닥 ' + s.longRuns + '개(마디 ' + s.longSegs + ')',
      '    이웃 폭 밖에 있던 마디 ' + s.outBefore + '(' + pc(s.outBefore) + ') → ' + s.outAfter + '(' + pc(s.outAfter) + ') / 판정한 마디 ' + s.seen +
      ' — 안 줄었으면 이 단계가 안 들은 것입니다(남은 것 = 뿌리 보호 구간에서 이미 벗어났거나 · 길게 반대로 간 가닥이거나 · pullMax로 못 따라간 것)',
      '    세기 ×' + (+s.kMul).toFixed(2) + ' · 뿌리 ' + (s.root * cm).toFixed(1) + 'cm까지는 안 건드림 · 폭 = 이웃 퍼짐 ×' + NB.posK + '(하한 ' + (NB.posMin * cm).toFixed(1) + 'cm) · 기울임 상한 ' + NB.pullMax +
      '° · 꺾임으로 보는 길이 ' + (NB.flipShort * cm).toFixed(1) + 'cm 이하 · v2 동작은 NEIGHBOR_ALIGN.chain=false' + tail];
  };
  /* 값을 바꾼 뒤 — 지금 머리를 다시 기름(마네킹 OFF일 때만) */
  NB.rebuild = function () {
    try {
      if (!G.on) { console.log(TAG + ' 마네킹이 켜져 있습니다 — 마네킹을 끄면 새 값으로 기릅니다'); return; }
      G.model = null; G.src = null; G.failedFor = null;
      if (typeof G.build === 'function') G.build();
    } catch (e) { console.warn(TAG + ' 다시 기르기 실패', e); }
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { if (G.on) L = L.concat(NB.lines()); } catch (e) {}
    return L;
  };
  console.log(TAG + ' 설치 — 다시 기른 머리를 다 기른 직후, 뿌리가 가까운 가닥을 기준으로 뿌리에서부터 연쇄로 결·자리를 맞춥니다(v3 · 뿌리 보호 그대로 · 그 다음 42번 결 정렬) · v2 동작 NEIGHBOR_ALIGN.chain=false. 끄기 NEIGHBOR_ALIGN.on=false 후 NEIGHBOR_ALIGN.rebuild()');
})();
