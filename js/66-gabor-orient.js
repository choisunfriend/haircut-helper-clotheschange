/* 66-gabor-orient.js — 결 읽기를 방향 필터(가버 묶음)로 (2026-10-11b)
 * 사용자: "어차피 차이가 없으면 방향필터로 가두면 실사사진갔을 때 효과를 볼거잖아?"
 * 지금(04번): 구조 텐서 — 주변 7×7 밝기 기울기를 평균 내서 방향을 구함. 직모엔 맞지만 가는 가닥·곱슬에선 여러 방향이 섞여 흐려짐.
 * 바꾼 것: 머리카락 한 올 굵기에 맞춘 "가는 선 필터"를 n방향(기본 16)으로 돌려 대 보고, 가장 크게 반응한 방향을 그 자리의 결로.
 *   그 뒤 믿을 만한(반응이 뚜렷한) 자리의 결로 둘레를 한 번 다듬음(이중각 평균). 머리 영역(mask) 픽셀만 계산.
 *   생성 사진(머리 영역 400px 남짓)에서는 지금 방식과 방향 차이 중앙값 4~6°(같은 결과) — 실사 고해상도에서 한 올 단위 결이 잡히는 쪽.
 *   coherence(결의 또렷함)는 뒤쪽 문턱값들이 지금 방식에 맞춰져 있어 04번 값을 그대로 씀. 방향(angle)만 바꿈.
 * (2026-10-12c) 시간 줄이기 — 사용자: "끝까지 건너뛰지 않고 가는 게 낫겠다. 그 횟수를 줄여서 시간을 줄이자."
 *   픽셀은 전부 계산(stride 1) · 방향 16 → 12(가장 센 방향과 양옆 반응으로 사이 각을 어림 interp) · 필터 칸 중 0에 가까운 칸(최대의 2% 미만)은 빼고 곱함(prune).
 *   합성 무늬(직모·웨이브·곱슬)에서 약 1.9배 빠르고 결 방향 차이 중앙 0.6~1.1° · 컬·웨이브 측정값(직선 판정·기울기·파장·진폭)은 거의 같음. 8방향 이하는 웨이브 기울기가 57° → 67°로 달라져 안 씀.
 *   예전대로: GABOR_ORIENT.n=16; .interp=false; .prune=0
 * 이 파일은 42번보다 먼저 올려야 함(42번이 이 함수를 감싸서 컬을 잼). 끄기 GABOR_ORIENT.on=false
 */
(function () {
  var W = window, TAG = '[결 방향 필터]';
  var GO = W.GABOR_ORIENT = Object.assign({ on: true, replace: true, stride: 1, prune: 0.02, interp: true, n: 12, lambda: 4, refine: true, stats: { calls: 0, ms: 0, px: 0, dMed: null } }, W.GABOR_ORIENT || {});
  var inner = W.computeHairOrientationField;
  if (typeof inner !== 'function') { console.warn(TAG + ' computeHairOrientationField 없음 — 안 걸림'); return; }
  var KC = {};
  function kernels(lam, n) {
    var key = lam + '|' + n; if (KC[key]) return KC[key];
    var sig = lam * 0.5, r = Math.max(2, Math.ceil(3 * sig)), sz = 2 * r + 1, gam = 0.5, out = [], k, x, y;
    for (k = 0; k < n; k++) {
      var t = k * Math.PI / n, ct = Math.cos(t), st = Math.sin(t), K = new Float32Array(sz * sz), sum = 0, i = 0;
      for (y = -r; y <= r; y++) for (x = -r; x <= r; x++) {
        var xr = x * ct + y * st, yr = -x * st + y * ct;
        var v = Math.exp(-(xr * xr + gam * gam * yr * yr) / (2 * sig * sig)) * Math.cos(2 * Math.PI * xr / lam);
        K[i++] = v; sum += v;
      }
      var mean = sum / (sz * sz); for (i = 0; i < K.length; i++) K[i] -= mean;
      out.push(K);
    }
    return (KC[key] = { K: out, r: r, sz: sz });
  }
  function sparse(KK, Wd) {                                               // (2026-10-12c) 필터 칸 중 값이 거의 0인 칸(가장 큰 값의 prune 미만)을 빼 둠 — 모든 픽셀을 계산하되 곱셈 수를 줄임
    if (!(GO.prune > 0)) return null;
    var key = 'sp' + GO.prune + '|' + Wd; if (KK[key]) return KK[key];
    var out = [], r = KK.r, sz = KK.sz, k, x, y;
    for (k = 0; k < KK.K.length; k++) {
      var K = KK.K[k], mx = 0, i, o = [], w = [], drop = 0;
      for (i = 0; i < K.length; i++) if (Math.abs(K[i]) > mx) mx = Math.abs(K[i]);
      for (y = -r, i = 0; y <= r; y++) for (x = -r; x <= r; x++, i++) { if (Math.abs(K[i]) >= GO.prune * mx) { o.push(y * Wd + x); w.push(K[i]); } else drop += K[i]; }
      var fix = drop / w.length; for (i = 0; i < w.length; i++) w[i] += fix;      // 뺀 칸의 합을 남은 칸에 고르게(합 0 유지 — 밝기만 다른 자리에 반응하지 않게)
      out.push({ o: Int32Array.from(o), w: Float32Array.from(w) });
    }
    KK.taps = out[0].o.length;
    return (KK[key] = out);
  }
  function gray(px, n) { var g = new Float32Array(n), i, j; for (i = 0, j = 0; i < n; i++, j += 4) g[i] = (0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2]) / 255; return g; }
  function blur(a, Wd, Hd, sig) {                                          // 가우시안(분리) — 다듬기용
    var r = Math.max(1, Math.ceil(2.5 * sig)), k = new Float32Array(2 * r + 1), s = 0, i, x, y;
    for (i = -r; i <= r; i++) { k[i + r] = Math.exp(-i * i / (2 * sig * sig)); s += k[i + r]; } for (i = 0; i < k.length; i++) k[i] /= s;
    var t = new Float32Array(Wd * Hd), o = new Float32Array(Wd * Hd);
    for (y = 0; y < Hd; y++) for (x = 0; x < Wd; x++) { var v = 0; for (i = -r; i <= r; i++) { var xx = x + i; if (xx < 0) xx = 0; else if (xx >= Wd) xx = Wd - 1; v += k[i + r] * a[y * Wd + xx]; } t[y * Wd + x] = v; }
    for (y = 0; y < Hd; y++) for (x = 0; x < Wd; x++) { var v2 = 0; for (i = -r; i <= r; i++) { var yy = y + i; if (yy < 0) yy = 0; else if (yy >= Hd) yy = Hd - 1; v2 += k[i + r] * t[yy * Wd + x]; } o[y * Wd + x] = v2; }
    return o;
  }
  /* (2026-10-11b) 결을 따라 선을 그어 모양을 잼 — 사용자: "방향필터가 있는데 이거 구분해서 해야돼?"
   *  선마다: 굽는 방향이 번갈아 바뀌면 S자(웨이브), 한쪽으로만 계속 굽으면 고리(컬). 고리 정도 = |굽은 각의 합| ÷ 굽은 각 크기의 합(0 = S자 · 1 = 고리)
   *  파장 = 선 길이 × 2 ÷ 굽는 방향이 바뀐 횟수 · 진폭 = 선이 제 평균선(파장 폭)에서 벗어난 거리의 90% 값 ÷ 0.988   (사진 px) */
  GO.shapeStep = 10; GO.shapeMaxLen = 260; GO.shapeMinLen = 40;
  function shapeOf(ang, mask, Wd, Hd, rr) {
    var st = GO.shapeStep, lines = [], x0, y0;
    function trace(x, y, sgn) {
      var P = [], pdx = 0, pdy = 0, k;
      for (k = 0; k < GO.shapeMaxLen; k++) {
        var xi = x | 0, yi = y | 0; if (xi < rr || yi < rr || xi >= Wd - rr || yi >= Hd - rr) break;
        var id = yi * Wd + xi; if (!mask[id]) break;
        var t = ang[id], dx = Math.cos(t), dy = Math.sin(t);
        if (k === 0) { dx *= sgn; dy *= sgn; } else if (dx * pdx + dy * pdy < 0) { dx = -dx; dy = -dy; }
        if (k > 0 && dx * pdx + dy * pdy < 0.5) break;                     // 한 걸음에 60° 넘게 꺾이면(잡음) 멈춤
        P.push(x, y); x += dx; y += dy; pdx = dx; pdy = dy;
      }
      return P;
    }
    for (y0 = st; y0 < Hd - st; y0 += st) for (x0 = st; x0 < Wd - st; x0 += st) {
      if (!mask[y0 * Wd + x0]) continue;
      var a = trace(x0 + 0.5, y0 + 0.5, 1), b = trace(x0 + 0.5, y0 + 0.5, -1), P = [], i;
      for (i = b.length - 2; i >= 2; i -= 2) P.push(b[i], b[i + 1]);
      for (i = 0; i < a.length; i += 2) P.push(a[i], a[i + 1]);
      var n = P.length / 2; if (n < GO.shapeMinLen) continue;
      // 굽은 각(4px 간격 방향 차)
      var th = [], j; for (j = 4; j < n; j += 2) th.push(Math.atan2(P[j * 2 + 1] - P[(j - 4) * 2 + 1], P[j * 2] - P[(j - 4) * 2]));
      var kap = []; for (j = 1; j < th.length; j++) { var dd = th[j] - th[j - 1]; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; kap.push(dd); }
      var sm = []; for (j = 0; j < kap.length; j++) { var s2 = 0, c2 = 0, q; for (q = Math.max(0, j - 2); q <= Math.min(kap.length - 1, j + 2); q++) { s2 += kap[q]; c2++; } sm.push(s2 / c2); }
      var sAbs = 0, sSig = 0, flips = 0, last = 0; for (j = 0; j < sm.length; j++) { sAbs += Math.abs(sm[j]); sSig += sm[j]; if (Math.abs(sm[j]) > 0.02) { var sg = sm[j] > 0 ? 1 : -1; if (last && sg !== last) flips++; last = sg; } }
      var straight = sAbs < 0.6;
      var lam = flips > 0 ? 2 * n / flips : NaN;
      // 진폭: 파장 폭 이동 평균선에서 벗어난 거리
      var amp = NaN; if (isFinite(lam) && lam > 6 && lam < n) { var hw = Math.max(2, Math.round(lam / 2)), devs = []; for (j = hw; j < n - hw; j += 2) { var mx = 0, my = 0, c3 = 0, q2; for (q2 = j - hw; q2 <= j + hw; q2++) { mx += P[q2 * 2]; my += P[q2 * 2 + 1]; c3++; } devs.push(Math.hypot(P[j * 2] - mx / c3, P[j * 2 + 1] - my / c3)); } devs.sort(function (u, v) { return u - v; }); if (devs.length) amp = devs[Math.min(devs.length - 1, Math.floor(devs.length * 0.9))] / 0.988; }   // 90%(사인의 꼭대기 근처) — 뿌리 쪽 곧은 구간에 끌려 작게 재지 않게
      var cyS = 0, cxS = 0; for (j = 0; j < n; j++) { cxS += P[j * 2]; cyS += P[j * 2 + 1]; }
      lines.push({ n: n, straight: straight, loop: sAbs > 1e-6 ? Math.abs(sSig) / sAbs : 0, lam: lam, amp: amp, cx: cxS / n, cy: cyS / n });
    }
    function med(a) { a = a.filter(function (v) { return isFinite(v); }).sort(function (u, v) { return u - v; }); return a.length ? a[a.length >> 1] : NaN; }
    var bent = lines.filter(function (l) { return !l.straight; });
    // (2026-10-12i) 중앙값만이 아니라 선 하나하나를 넘김 — [머리 위→아래 자리 0~1, 가로 자리 0~1, 파장px, 진폭px, 고리 정도, 곧은 선이면 1]
    var yMn = Hd, yMx = 0, xMn = Wd, xMx = 0, q3; for (q3 = 0; q3 < Wd * Hd; q3 += 2) if (mask[q3]) { var yy3 = (q3 / Wd) | 0, xx3 = q3 - yy3 * Wd; if (yy3 < yMn) yMn = yy3; if (yy3 > yMx) yMx = yy3; if (xx3 < xMn) xMn = xx3; if (xx3 > xMx) xMx = xx3; }
    var dy3 = Math.max(1, yMx - yMn), dx3 = Math.max(1, xMx - xMn);
    var all = lines.map(function (l) { return [(l.cy - yMn) / dy3, (l.cx - xMn) / dx3, l.lam, l.amp, l.loop, l.straight ? 1 : 0]; });
    return { all: all, hairTopPx: yMn, hairBotPx: yMx, lines: lines.length, bent: bent.length, straightFrac: lines.length ? 1 - bent.length / lines.length : 1,
      loop: med(bent.map(function (l) { return l.loop; })), lamPx: med(bent.map(function (l) { return l.lam; })), ampPx: med(bent.map(function (l) { return l.amp; })) };
  }
  // 사진마다 identity에 붙임(42번의 컬 재기와 같은 자리)
  var oMI = W.measureViewHairIdentity;
  if (typeof oMI === 'function') W.measureViewHairIdentity = function (a) {
    var id = oMI.apply(this, arguments);
    try { if (id && GO.last && a && GO.last.w === a.w && GO.last.h === a.h) { id.waveShape = GO.last.shape; } } catch (e) {}
    return id;
  };
  W.computeHairOrientationField = function (px, mask, Wd, Hd) {
    var f = inner.apply(this, arguments);
    if (!GO.on || !f || !f.angle || !px || px.length < Wd * Hd * 4 || !mask) return f;
    try {
      var t0 = performance.now(), N = Wd * Hd, g = gray(px, N), KK = kernels(GO.lambda, GO.n), r = KK.r, sz = KK.sz, n = GO.n;
      var SP = sparse(KK, Wd), RV = new Float32Array(n), ang = new Float32Array(N), conf = new Float32Array(N), idx, x, y, k, i, j, cnt = 0;
      var sd = (GO.refine && GO.stride > 1) ? (GO.stride | 0) : 1;         // 다듬기를 끄면 메울 방법이 없으니 전부 계산
      for (y = r; y < Hd - r; y += sd) for (x = r; x < Wd - r; x += sd) {
        idx = y * Wd + x; if (!mask[idx]) continue;
        var best = -1, bk = 0, sumR = 0;
        for (k = 0; k < n; k++) {
          var v = 0;
          if (SP) { var so = SP[k].o, sw = SP[k].w, sn = so.length; for (i = 0; i < sn; i++) v += sw[i] * g[idx + so[i]]; }   // 0에 가까운 칸은 빼고 곱함
          else { var K = KK.K[k], ki = 0; for (j = -r; j <= r; j++) { var row = (y + j) * Wd + x - r; for (i = 0; i < sz; i++) v += K[ki++] * g[row + i]; } }
          v = v < 0 ? -v : v; RV[k] = v; sumR += v; if (v > best) { best = v; bk = k; }
        }
        var bo = 0;
        if (GO.interp) { var vL = RV[(bk + n - 1) % n], vR = RV[(bk + 1) % n], den = vL - 2 * best + vR; if (den < -1e-12) { bo = 0.5 * (vL - vR) / den; if (bo > 0.5) bo = 0.5; else if (bo < -0.5) bo = -0.5; } }   // 가장 센 방향과 양옆 반응으로 사이 각을 어림(방향 수를 줄여도 각이 계단지지 않게)
        ang[idx] = (bk + bo) * Math.PI / n + Math.PI / 2; conf[idx] = best > 1e-9 ? (best - sumR / n) / best : 0; cnt++;
      }
      if (GO.refine) {                                                   // 믿을 만한 자리의 결로 둘레를 한 번 다듬음
        var C2 = new Float32Array(N), S2 = new Float32Array(N);
        for (idx = 0; idx < N; idx++) if (mask[idx]) { C2[idx] = Math.cos(2 * ang[idx]) * conf[idx]; S2[idx] = Math.sin(2 * ang[idx]) * conf[idx]; }
        C2 = blur(C2, Wd, Hd, GO.lambda * 0.6); S2 = blur(S2, Wd, Hd, GO.lambda * 0.6);
        for (idx = 0; idx < N; idx++) if (mask[idx]) { if (sd > 1 && C2[idx] === 0 && S2[idx] === 0) { ang[idx] = f.angle[idx]; } else ang[idx] = 0.5 * Math.atan2(S2[idx], C2[idx]); }   // 둘레에 계산한 자리가 하나도 없으면(가장자리 한 줄) 예전 방식 값
      }
      try { GO.last = { w: Wd, h: Hd, shape: shapeOf(ang, mask, Wd, Hd, r) }; } catch (e2) { GO.last = null; }
      var A = f.angle, diffs = [];
      for (idx = 0; idx < N; idx++) {
        if (!mask[idx] || (idx % Wd) < r || (idx % Wd) >= Wd - r || idx < r * Wd || idx >= (Hd - r) * Wd) continue;
        var a = ang[idx]; while (a > Math.PI / 2) a -= Math.PI; while (a <= -Math.PI / 2) a += Math.PI;
        if ((idx & 63) === 0) { var dd = Math.abs(a - A[idx]); if (dd > Math.PI / 2) dd = Math.PI - dd; diffs.push(dd * 57.3); }
        if (GO.replace !== false) A[idx] = a;                               // 방향만 바꿈(coherence는 04번 값) · (2026-10-11c) replace=false면 결 읽기는 예전 방식 그대로(모양 재기만)
      }
      diffs.sort(function (p, q) { return p - q; });
      GO.stats.calls++; GO.stats.ms = Math.round(performance.now() - t0); GO.stats.px = cnt; GO.stats.dMed = diffs.length ? diffs[diffs.length >> 1] : null;
      console.log(TAG + ' ' + Wd + '×' + Hd + ' · 머리 픽셀 ' + cnt + ' · ' + n + '방향 · ' + GO.stats.ms + 'ms · 예전 방식과 방향 차이 중앙 ' + (GO.stats.dMed != null ? GO.stats.dMed.toFixed(1) + '°' : '-'));
    } catch (e) { console.warn(TAG + ' 실패 — 예전 방식 그대로', e); }
    return f;
  };
  console.log(TAG + ' 설치 — 사진 결을 ' + GO.n + '방향 가는 선 필터로 읽음(파장 ' + GO.lambda + 'px) · 끄기 GABOR_ORIENT.on=false');
})();
