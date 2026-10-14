/* ==========================================================================
 * 60-photo-check.js — 원본 대조: 지금 화면의 3D 머리를 원본 사진의 머리 윤곽과 겹쳐 보기
 *
 * 로드 위치: index.html 맨 끝(59-flow-spec.js 다음). 다른 파일은 고치지 않습니다.
 *
 * 왜 (2026-10-07 · 사용자): "다른 사람들 테스트해 보니 긴 머리 직모가 아니라서 역시 좀 다르네 … 원본 사진이랑 대조하는 작업 등을 시행하면 나아지려나."
 *   "이번엔 원본 대조 한번 걸었으면 좋겠어."
 *   지금까지는 3D 머리가 사진과 얼마나 같은지 눈으로만 봤습니다. 다시 기르기(42)는 가닥의 "뼈대"를 사진의 머리 영역 안에서 멈추지만,
 *   그 뒤에 얹는 컬·볼륨·결 정렬·빗질은 사진을 다시 보지 않습니다. 어디가 얼마나 다른지 재는 것이 먼저입니다.
 *
 * 무엇을:
 *   ① 대조 — 조정 화면의 [원본 대조] 버튼. 지금 그려진 가닥(computeAdjustedHair3DStrands의 결과 그대로)을 사진마다 그 사진의 카메라
 *      (13b 점유 프로브의 카메라 — 42번 다시 기르기가 쓰는 것과 같은 것 · 360 세트면 52번이 넣은 카메라 포함)로 비춰 윤곽을 만들고,
 *      사진의 머리 영역(03a 마스크)과 칸(사진 가로 cols칸) 단위로 비교합니다.
 *        빨강 = 넘침: 3D에는 머리가 있는데 사진에는 없는 자리(허용 여유 tolCm 밖)
 *        파랑 = 빔  : 사진에는 머리가 있는데 3D에는 없는 자리
 *      사진마다 겹침(IoU)·넘침·빔 비율과, 윤곽의 위/아래/좌/우 끝이 사진보다 몇 cm 나갔는지(+)·모자란지(−)를 냅니다.
 *      카메라 반대편에 있으면서 두개골에 가리거나 턱 아래(몸에 가릴 수 있는 자리)인 점은 비교에서 뺍니다(42번의 머리 영역 투표와 같은 규칙).
 *   ② 윤곽 밖 잘라내기(선택 · 기본 꺼짐) — 패널의 [윤곽 밖 잘라내기]. 켜면 가닥에서 "어느 사진에서든 머리 영역 밖(여유 trimTolCm)"으로
 *      trimOut 넘게 나갔거나 밖에서 끝난 꼬리(trimTail 이상)를 그 자리에서 자릅니다. 조정 화면과 3D 결과 화면이 같은 규칙을 거칩니다.
 *      스타일이 걸려 있는 동안(다른 스타일은 원본과 다른 것이 당연)과 길이 슬라이더를 원본 기준에서 늘렸을 때는 자르지 않습니다.
 *      사진·모델이 바뀌면 꺼집니다.
 *   ③ 진단 [원본 대조] — 마지막으로 대조한 숫자.
 *
 * (2026-10-07b) 결 대조 · 결 맞추기 — 사용자: "원본 대조로 두 사진을 겹쳐 놓고 디렉션하고 크게 벗어나는 뭉치들은 조정되는 건 안 돼? 자동으로?"
 *   ④ 결 대조 — 사진마다 03a가 읽어 둔 결 방향(42번 다시 기르기가 가닥을 기를 때 읽는 그 값)과, 그 사진 각도에서 보이는 겉층 가닥의 "큰 방향"
 *      (앞뒤 dirSmooth를 이은 현 — 컬·웨이브는 방향으로 안 침)을 칸마다 비교합니다. 사진의 결이 또렷하고(dirCoh 이상) 3D 가닥도 그 칸에서 한쪽으로
 *      모여 있는(dir3Coh 이상) 칸만 비교합니다. dirWarn° 넘게 어긋났고 이웃 칸도 같이 어긋난(= 뭉치) 칸을 노랑으로 표시합니다.
 *      결은 "선"이라 앞뒤가 없습니다 — 어긋남은 0~90°.
 *   ⑤ 결 맞추기(선택 · 기본 꺼짐) — 패널의 [결 맞추기]. 노랑 칸을 지나는 마디(겉에서 dirFixLayer 깊이까지)를, 그 사진에서 봤을 때 사진의 결과 나란해지도록 그 사진의 시선 축 둘레로 돌립니다
 *      (가닥의 큰 방향만 맞춤 → 컬 모양·마디 길이는 그대로 · 붓을 지난 아래쪽은 모양 그대로 따라 옮겨짐 · 뿌리 쪽 dirGrip은 덜 돎 · 두상·목 속으로는 못 들어감).
 *      한 마디가 여러 사진에 걸리면 그 마디를 가장 옆에서(덜 비스듬히) 보는 사진을 씁니다. 가닥을 다 만든 뒤(빗질까지 한 뒤) 한 번 돕니다 — 잘라내기보다 먼저.
 *      스타일이 걸려 있는 동안은 쉽니다. 사진·모델이 바뀌면 꺼집니다. 등록 스타일에는 아직 안 들어갑니다.
 *      ⚠ 합성 머리로만 확인했습니다. 사진 결의 또렷함(coherence) 눈금은 실제 사진에서 본 적이 없어 dirCoh는 어림값입니다 — 진단 줄의 "비교한 칸 수"가 너무 적거나
 *        엉뚱한 자리가 돌면 그 줄을 보고 조정합니다.
 *
 * 알아둘 것:
 *   · 윤곽 대조는 겉 테두리만 봅니다. 결 대조는 사진의 결이 또렷한 자리만 봅니다(곱슬처럼 잘게 엇갈린 자리는 비교에서 빠짐).
 *   · 컬 모양·가르마 위치가 사진과 같은지는 이 대조로 알 수 없습니다.
 *   · 카메라 맞춤(각도·배율)이 틀린 사진은 통째로 어긋나 보입니다 — 한 사진만 넘침·빔이 한쪽으로 쏠려 있으면 머리가 아니라 그 사진의 맞춤 문제일 수 있습니다.
 *   · "빔"은 고쳐 주지 않습니다(보여 주기만). 머리를 더 심거나 늘리는 것은 다음 단계입니다.
 *   · 잘라내기는 엄격합니다: 한 사진에서만 밖이어도 자릅니다(보이는 것과 같게 하려고). 맞춤이 틀린 사진이 있으면 그 방향이 과하게 깎일 수 있으니
 *     대조 그림을 먼저 보고 켜세요. 특정 사진을 빼려면 PHOTO_CHECK.skip=['v90', …].
 *
 * 끄기: PHOTO_CHECK.on=false · 잘라내기만 끄기 PHOTO_CHECK.setTrim(false) · 결 맞추기만 끄기 PHOTO_CHECK.setFixDir(false) · 결 대조 표시 끄기 PHOTO_CHECK.dir=false
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[원본 대조]';
  var P = W.PHOTO_CHECK = Object.assign({
    on: true,
    exportCols: 480,    // (2026-10-10a) 내보내기에 싣는 사진 칸(머리 영역·결) — 경계를 보려고 비교 칸보다 촘촘히
    cols: 200,          // 비교 칸: 사진 가로를 이 수로 나눔(800px 사진이면 칸 4px)
    tolCm: 0.6,         // 넘침·빔으로 치지 않는 여유(윤곽선 근처의 이 두께는 같다고 봄)
    extRun: 3,          // 윤곽 끝(위/아래/좌/우)을 잴 때 그 줄에 머리 칸이 이만큼은 있어야 끝으로 침(한두 가닥은 무시)
    skip: [],           // 대조·잘라내기에서 뺄 사진(angle 이름)
    trim: false,        // 윤곽 밖 잘라내기
    trimTolCm: 1.0,     // 잘라낼 때의 여유(대조보다 넉넉히)
    trimOut: 0.08,      // 밖으로 이 길이(모델 단위 ≈ 1.5cm) 넘게 나가면 나간 자리에서 자름(나갔다 돌아오는 고리 포함)
    trimTail: 0.03,     // 밖에서 끝난 꼬리가 이 길이(≈ 0.6cm) 이상이면 자름
    keepPts: 3,
    // (b) 결 대조 · 결 맞추기
    dir: true,          // 결 대조(표시)
    fixDir: false,      // 결 맞추기
    dirCoh: 0.2,        // 사진 결의 또렷함이 이 이상인 칸만(어림값)
    dir3Coh: 0.5,       // 그 칸의 3D 가닥들이 한쪽으로 모인 정도(0~1)가 이 이상인 칸만
    dirMinSeg: 3,       // 그 칸에 겉층 마디가 이만큼은 있어야
    dirWarn: 30,        // 도: 이 넘게 어긋난 칸을 표시·맞춤
    dirNbr: 4,          // 둘레 3×3칸 중 어긋난 칸이 (자기 포함) 이만큼은 돼야 뭉치로 봄
    dirScalp: 1.25,     // 두피 타원체의 이 배수 안쪽 마디는 두피 법선 둘레로 돌림(누운 머리) · 밖은 사진의 시선 축 둘레로
    dirNormMin: 0.35,   // …단, 그 법선이 사진 시선과 이루는 cos가 이 이상일 때만(너무 비스듬하면 시선 축으로)
    dirLayer: 0.13,     // 겉층: 그 칸에서 카메라에 가장 가까운 머리보다 이만큼(≈ 2.5cm) 안쪽까지
    dirFixLayer: 0.3,   // 결 맞추기가 닿는 깊이(≈ 5.7cm) — 대조는 겉층만 보지만, 맞출 때는 그 아래 속머리도 같이 돌림(사진으로는 겉 결만 알 수 있음)
    dirSample: 6000,    // 결을 읽는 데 쓰는 가닥 수 상한(넘으면 건너뛰며 읽음 — 칸의 방향만 알면 되므로) · 돌리는 것은 전부
    dirFore: 0.5,       // 그 사진에서 이 비율보다 짧게 보이는(시선 쪽으로 누운) 마디는 비교·맞춤에서 뺌
    dirSmooth: 0.2,     // 가닥의 큰 방향을 재는 길이(앞뒤로 ≈ 3.7cm씩)
    dirSegTol: 15,      // 도: 노랑 칸 안이라도 제 큰 방향이 사진 결에서 이 안쪽인 마디는 안 돌림
    dirGain: 1,         // 어긋난 각의 이 비율만큼 돌림
    dirGrip: 0.12,      // 가닥의 앞 12%(뿌리 쪽)는 덜 돎
    lenSlack: 3         // 길이 슬라이더가 원본 기준보다 이 넘게 길어진 섹션이 있으면 잘라내기를 쉼
  }, W.PHOTO_CHECK || {});
  var S = P.stats = { at: null, views: [], strands: 0, ms: 0, err: null, trimCut: 0, trimLen: 0, trimMs: 0, trimWhy: '', fixStr: 0, fixSeg: 0, fixMs: 0, fixWhy: '', fixPush: 0 };
  var ver = 0;

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }

  /* ────────────────────────────────────────────────────────────────────────
   * 계산(화면·앱 상태와 무관 — 합성 테스트에서 그대로 부름)
   *   cams: [{angle, R[9], cx, s, sy, crownY, smp:{at(ix,iy)}, iw, ih}] · env: {CY, yTop, a, b, c(두피 타원체), cm(모델 단위당 cm)}
   * ────────────────────────────────────────────────────────────────────── */
  function prepCam(cam, env, cfg, tolCm) {
    var cols = Math.max(40, cfg.cols | 0), cell = cam.iw / cols, gw = cols, gh = Math.max(1, Math.ceil(cam.ih / cell)), N = gw * gh, M = new Uint8Array(N), x, y, n = 0;
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) if (cam.smp.at((x + 0.5) * cell, (y + 0.5) * cell) > 0) { M[y * gw + x] = 1; n++; }
    var cellCm = cell * cam.s * env.cm, tol = Math.max(1, Math.round(tolCm / Math.max(1e-6, cellCm)));
    return { cam: cam, cell: cell, gw: gw, gh: gh, M: M, nPhoto: n, cellCm: cellCm, tol: tol, MD: dilate(M, gw, gh, tol) };
  }
  function dilate(A, gw, gh, r) {            // 네모 팽창(가로·세로 따로)
    if (!(r > 0)) return A;
    var N = gw * gh, T = new Uint8Array(N), O = new Uint8Array(N), x, y, k, run;
    for (y = 0; y < gh; y++) { run = -1e9; for (x = 0; x < gw; x++) { if (A[y * gw + x]) run = x; if (x - run <= r) T[y * gw + x] = 1; }
      run = 1e9; for (x = gw - 1; x >= 0; x--) { if (A[y * gw + x]) run = x; if (run - x <= r) T[y * gw + x] = 1; } }
    for (x = 0; x < gw; x++) { run = -1e9; for (y = 0; y < gh; y++) { k = y * gw + x; if (T[k]) run = y; if (y - run <= r) O[k] = 1; }
      run = 1e9; for (y = gh - 1; y >= 0; y--) { k = y * gw + x; if (T[k]) run = y; if (run - y <= r) O[k] = 1; } }
    return O;
  }
  /* 점을 그 사진에 비춤 → o[0]=ix, o[1]=iy · 돌려주는 값: 1 보임 · 0 판정에서 뺌(반대편이면서 두개골에 가리거나 턱 아래) */
  function project(cam, env, px, py, pz, o) {
    var R = cam.R, x = px, y = py - env.CY, z = pz;
    o[0] = (R[0] * x + R[1] * y + R[2] * z) / cam.s + cam.cx;
    o[1] = cam.crownY + (env.yTop - ((R[3] * x + R[4] * y + R[5] * z) + env.CY)) / cam.sy;
    if (R[6] * x + R[7] * y + R[8] * z < 0) {
      if (py < env.yBody) return 0;
      var dx = R[6], dy = R[7], dz = R[8];
      var A = dx * dx / env.a2 + dy * dy / env.b2 + dz * dz / env.c2, B = 2 * (x * dx / env.a2 + y * dy / env.b2 + z * dz / env.c2), C = x * x / env.a2 + y * y / env.b2 + z * z / env.c2 - 0.96;
      var D = B * B - 4 * A * C;
      if (D > 0 && (-B + Math.sqrt(D)) / (2 * A) > 1e-4) return 0;
    }
    return 1;
  }
  function mkEnv(env) {
    return { CY: env.CY, yTop: env.yTop, a2: env.a * env.a, b2: env.b * env.b, c2: env.c * env.c, yBody: env.CY - 0.7 * env.b, cm: env.cm > 0 ? env.cm : 19 };
  }
  function extent(A, gw, gh, run) {         // 머리 칸이 run개 이상인 첫/마지막 줄·칸
    var rows = new Int32Array(gh), cols = new Int32Array(gw), x, y, e = { top: -1, bottom: -1, left: -1, right: -1 };
    for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) if (A[y * gw + x]) { rows[y]++; cols[x]++; }
    for (y = 0; y < gh; y++) if (rows[y] >= run) { e.top = y; break; }
    for (y = gh - 1; y >= 0; y--) if (rows[y] >= run) { e.bottom = y; break; }
    for (x = 0; x < gw; x++) if (cols[x] >= run) { e.left = x; break; }
    for (x = gw - 1; x >= 0; x--) if (cols[x] >= run) { e.right = x; break; }
    return e;
  }
  function compare(strands, cams, env0, cfg) {
    var env = mkEnv(env0), out = [], o = [0, 0], ci, si, k, j;
    for (ci = 0; ci < cams.length; ci++) {
      var pc = prepCam(cams[ci], env, cfg, cfg.tolCm), cam = pc.cam, gw = pc.gw, gh = pc.gh, cell = pc.cell, H = new Uint8Array(gw * gh), nPts = 0;
      for (si = 0; si < strands.length; si++) {
        var pts = strands[si] && (strands[si].pts || strands[si]); if (!pts || pts.length < 2) continue;
        var v0 = project(cam, env, pts[0].x, pts[0].y, pts[0].z, o), x0 = o[0], y0 = o[1], v1, x1, y1;
        for (k = 1; k < pts.length; k++) {
          v1 = project(cam, env, pts[k].x, pts[k].y, pts[k].z, o); x1 = o[0]; y1 = o[1];
          if (v0 && v1) {
            var n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / (cell * 0.7)));
            for (j = 0; j <= n; j++) {
              var gx = Math.floor((x0 + (x1 - x0) * j / n) / cell), gy = Math.floor((y0 + (y1 - y0) * j / n) / cell);
              if (gx >= 0 && gy >= 0 && gx < gw && gy < gh) H[gy * gw + gx] = 1;
            }
            nPts++;
          }
          v0 = v1; x0 = x1; y0 = y1;
        }
      }
      // 가닥 사이 빈칸 메우기(한 칸 부풀렸다 줄임) → 3D 머리의 덩어리
      var Hc = erode(dilate(H, gw, gh, 1), gw, gh, 1), HD = dilate(Hc, gw, gh, pc.tol);
      var OV = new Uint8Array(gw * gh), UN = new Uint8Array(gw * gh), nH = 0, nO = 0, nU = 0, nI = 0, nUni = 0, M = pc.M, MD = pc.MD;
      for (k = 0; k < gw * gh; k++) {
        if (Hc[k]) nH++;
        if (Hc[k] && M[k]) nI++;
        if (Hc[k] || M[k]) nUni++;
        if (Hc[k] && !MD[k]) { OV[k] = 1; nO++; }
        if (M[k] && !HD[k]) { UN[k] = 1; nU++; }
      }
      var eM = extent(M, gw, gh, cfg.extRun), eH = extent(Hc, gw, gh, cfg.extRun), cc = pc.cellCm, ccy = cell * cam.sy * env.cm;
      var ok = eM.top >= 0 && eH.top >= 0;
      out.push({ angle: cam.angle, gw: gw, gh: gh, cell: cell, cellCm: cc, M: M, H: Hc, over: OV, under: UN, nPhoto: pc.nPhoto, nHair: nH, nOver: nO, nUnder: nU,
        iou: nUni ? nI / nUni : 0, overPct: pc.nPhoto ? nO / pc.nPhoto : 0, underPct: pc.nPhoto ? nU / pc.nPhoto : 0, segs: nPts,
        ext: ok ? { top: (eM.top - eH.top) * ccy, bottom: (eM.bottom >= gh - 2) ? null : (eH.bottom - eM.bottom) * ccy, left: (eM.left - eH.left) * cc, right: (eH.right - eM.right) * cc } : null });
    }
    return out;
  }
  function erode(A, gw, gh, r) {
    var N = gw * gh, I = new Uint8Array(N), k; for (k = 0; k < N; k++) I[k] = A[k] ? 0 : 1;
    var D = dilate(I, gw, gh, r); for (k = 0; k < N; k++) D[k] = D[k] ? 0 : 1;
    return D;
  }
  /* 잘라내기: 가닥마다 자를 점 번호(안 자르면 길이) — pcs: prepCam 결과들(여유 = trimTolCm) */
  function cutIndex(pts, pcs, env, cfg, o) {
    var m = pts.length, k, ci, runStart = -1, runLen = 0, out, pc, gx, gy, p, q;
    for (k = 1; k < m; k++) {
      p = pts[k]; out = false;
      for (ci = 0; ci < pcs.length; ci++) {
        pc = pcs[ci];
        if (!project(pc.cam, env, p.x, p.y, p.z, o)) continue;
        gx = Math.floor(o[0] / pc.cell); gy = Math.floor(o[1] / pc.cell);
        if (gx < 0 || gy < 0 || gx >= pc.gw || gy >= pc.gh) continue;       // 사진 밖은 판정 못 함
        if (!pc.MD[gy * pc.gw + gx]) { out = true; break; }
      }
      if (out) {
        if (runStart < 0) { runStart = k; runLen = 0; }
        q = pts[k - 1]; runLen += Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) + (p.z - q.z) * (p.z - q.z));
        if (runLen >= cfg.trimOut) return Math.max(cfg.keepPts, runStart);
      } else runStart = -1;
    }
    if (runStart >= 0 && runLen >= cfg.trimTail) return Math.max(cfg.keepPts, runStart);
    return m;
  }
  /* ── 결 대조 ── cam.dirAt(ix, iy) → [각(화면 오른쪽 0 · 위쪽 +, 선이라 π마다 같음), 또렷함] 또는 null */
  var HALF = Math.PI / 2;
  function wrapHalf(d) { while (d > HALF) d -= Math.PI; while (d <= -HALF) d += Math.PI; return d; }
  function dirPrep(strands, cams, env0, cfg) {
    var env = env0.a2 ? env0 : mkEnv(env0), out = [], o = [0, 0], ci, si, k, stepS = Math.max(1, Math.ceil(strands.length / Math.max(500, cfg.dirSample || 6000)));
    for (ci = 0; ci < cams.length; ci++) {
      var cam = cams[ci]; if (typeof cam.dirAt !== 'function') continue;
      var cols = Math.max(40, cfg.cols | 0), cell = cam.iw / cols, gw = cols, gh = Math.max(1, Math.ceil(cam.ih / cell)), N = gw * gh, R = cam.R;
      var Z = new Float32Array(N).fill(-1e9), C2 = new Float32Array(N), S2 = new Float32Array(N), NN = new Uint16Array(N), pass, pts, p, q, A, B, n, hw, L, zc, gx, gy, id, cx, cy, cz, cl, px2, py2, pl, th;
      for (pass = 0; pass < 2; pass++) for (si = 0; si < strands.length; si += stepS) {
        pts = strands[si] && (strands[si].pts || strands[si]); if (!pts || pts.length < 3) continue;
        n = pts.length;
        if (pass) { L = 0; for (k = 1; k < n; k++) L += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y, pts[k].z - pts[k - 1].z); hw = L > 0 ? Math.round(cfg.dirSmooth / (L / (n - 1))) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16; }
        for (k = 1; k < n; k++) {
          p = pts[k]; q = pts[k - 1];
          var mx = (p.x + q.x) * 0.5, my = (p.y + q.y) * 0.5, mz = (p.z + q.z) * 0.5;
          if (!project(cam, env, mx, my, mz, o)) continue;
          gx = Math.floor(o[0] / cell); gy = Math.floor(o[1] / cell); if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
          id = gy * gw + gx; zc = R[6] * mx + R[7] * (my - env.CY) + R[8] * mz;
          if (!pass) { if (zc > Z[id]) Z[id] = zc; continue; }
          if (zc < Z[id] - cfg.dirLayer) continue;
          A = pts[k - 1 - hw < 0 ? 0 : k - 1 - hw]; B = pts[k + hw > n - 1 ? n - 1 : k + hw];
          cx = B.x - A.x; cy = B.y - A.y; cz = B.z - A.z; cl = Math.sqrt(cx * cx + cy * cy + cz * cz); if (!(cl > 1e-9)) continue;
          px2 = (R[0] * cx + R[1] * cy + R[2] * cz) / cam.s; py2 = (R[3] * cx + R[4] * cy + R[5] * cz) / cam.sy; pl = Math.sqrt(px2 * px2 + py2 * py2);
          if (pl * Math.sqrt(cam.s * cam.sy) < cfg.dirFore * cl) continue;        // 시선 쪽으로 누운 마디
          th = Math.atan2(py2, px2);
          C2[id] += Math.cos(2 * th); S2[id] += Math.sin(2 * th); if (NN[id] < 65535) NN[id]++;
        }
      }
      var TP = new Float32Array(N).fill(NaN), DL = new Float32Array(N).fill(NaN), FL = new Uint8Array(N), compared = 0, degs = [], cohs = [], warn = cfg.dirWarn * Math.PI / 180, x, y, d, pd, r3;
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        id = y * gw + x; if (NN[id] < cfg.dirMinSeg) continue;
        r3 = Math.sqrt(C2[id] * C2[id] + S2[id] * S2[id]) / NN[id]; if (r3 < cfg.dir3Coh) continue;
        pd = cam.dirAt((x + 0.5) * cell, (y + 0.5) * cell); if (!pd) continue;
        cohs.push(pd[1]); if (!(pd[1] >= cfg.dirCoh)) continue;
        d = wrapHalf(pd[0] - 0.5 * Math.atan2(S2[id], C2[id]));
        compared++; degs.push(Math.abs(d)); DL[id] = d;
        if (Math.abs(d) >= warn) { FL[id] = 1; TP[id] = pd[0]; }
      }
      // 뭉치만: 둘레 3×3에 어긋난 칸이 dirNbr개 이상
      var MIS = new Uint8Array(N), off = 0, a, b, c2n;
      for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
        id = y * gw + x; if (!FL[id]) continue; c2n = 0;
        for (b = -1; b <= 1; b++) for (a = -1; a <= 1; a++) { if (x + a < 0 || y + b < 0 || x + a >= gw || y + b >= gh) continue; if (FL[id + b * gw + a]) c2n++; }
        if (c2n >= cfg.dirNbr) { MIS[id] = 1; off++; } else TP[id] = NaN;
      }
      degs.sort(function (u, v) { return u - v; }); cohs.sort(function (u, v) { return u - v; });
      out.push({ cam: cam, angle: cam.angle, cell: cell, gw: gw, gh: gh, Z: Z, TP: TP, MIS: MIS, compared: compared, off: off,
        medDeg: degs.length ? degs[degs.length >> 1] * 180 / Math.PI : null, cohMed: cohs.length ? cohs[cohs.length >> 1] : null, cohSeen: cohs.length });
    }
    return out;
  }
  /* 결 맞추기: 가닥 하나 → 새 점 배열(안 바뀌면 같은 배열). dps = dirPrep 결과 */
  var RB = new Float64Array(3 * 64), UB = new Float64Array(4 * 64);
  function fixStrand(pts, dps, env, cfg, o, st) {
    var n = pts.length, last = n - 1, k, ci, p, q, A, B, L = 0, hw, changed = false, lo = n, hi = 0;
    if (n < 3 || !dps.length) return pts;
    if (RB.length < n * 3) { RB = new Float64Array(n * 3 + 96); UB = new Float64Array(n * 4 + 128); }
    var R = RB, U = UB, sx, sy, sz, len;
    for (k = 1; k < n; k++) { p = pts[k]; q = pts[k - 1]; sx = p.x - q.x; sy = p.y - q.y; sz = p.z - q.z; len = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (len > 1e-9) { U[k * 4] = sx / len; U[k * 4 + 1] = sy / len; U[k * 4 + 2] = sz / len; } else { U[k * 4] = 0; U[k * 4 + 1] = -1; U[k * 4 + 2] = 0; }
      U[k * 4 + 3] = len; L += len; }
    hw = L > 0 ? Math.round(cfg.dirSmooth / (L / last)) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16;
    var tol = cfg.dirSegTol * Math.PI / 180, grip = cfg.dirGrip;
    for (k = 1; k < n; k++) {
      R[k * 3] = 0; R[k * 3 + 1] = 0; R[k * 3 + 2] = 0;
      if (!(U[k * 4 + 3] > 1e-9)) continue;
      p = pts[k]; q = pts[k - 1];
      var mx = (p.x + q.x) * 0.5, my = (p.y + q.y) * 0.5, mz = (p.z + q.z) * 0.5, best = 0, bd = 0, bc = null, cx, cy, cz, cl;
      A = pts[k - 1 - hw < 0 ? 0 : k - 1 - hw]; B = pts[k + hw > last ? last : k + hw];
      cx = B.x - A.x; cy = B.y - A.y; cz = B.z - A.z; cl = Math.sqrt(cx * cx + cy * cy + cz * cz); if (!(cl > 1e-9)) continue;
      for (ci = 0; ci < dps.length; ci++) {
        var dp = dps[ci], cam = dp.cam, Rc = cam.R;
        if (!project(cam, env, mx, my, mz, o)) continue;
        var gx = Math.floor(o[0] / dp.cell), gy = Math.floor(o[1] / dp.cell); if (gx < 0 || gy < 0 || gx >= dp.gw || gy >= dp.gh) continue;
        var id = gy * dp.gw + gx, tp = dp.TP[id]; if (tp !== tp) continue;                                // NaN = 맞출 칸 아님
        if (Rc[6] * mx + Rc[7] * (my - env.CY) + Rc[8] * mz < dp.Z[id] - cfg.dirFixLayer) continue;         // 겉에서 dirFixLayer 깊이까지(속머리는 겉 결을 따름)
        var px2 = (Rc[0] * cx + Rc[1] * cy + Rc[2] * cz) / cam.s, py2 = (Rc[3] * cx + Rc[4] * cy + Rc[5] * cz) / cam.sy, f = Math.sqrt(px2 * px2 + py2 * py2) * Math.sqrt(cam.s * cam.sy) / cl;
        if (f < cfg.dirFore || f <= best) continue;
        var d = wrapHalf(tp - Math.atan2(py2, px2)); if (Math.abs(d) < tol) continue;
        best = f; bd = d; bc = Rc;
      }
      if (!bc) continue;
      var w = cfg.dirGain, t = k / last; if (grip > 0 && t < grip) w *= t / grip;
      var ang = bd * w; if (Math.abs(ang) < 0.003) continue;
      // 돌리는 축: 두피에 누운 머리는 두피 법선 둘레로만 돌 수 있음 → 법선 둘레로, 화면에서 그만큼 돌아 보이도록 각을 키움(법선이 시선과 이루는 cos로 나눔).
      //   두피에서 뜬 머리(dirScalp 밖)나 법선이 시선과 너무 비스듬한 자리는 그 사진의 시선 축 둘레로(화면에서 반시계가 +).
      var axx = bc[6], axy = bc[7], axz = bc[8], yyn = my - env.CY, een = Math.sqrt(mx * mx / env.a2 + yyn * yyn / env.b2 + mz * mz / env.c2);
      if (een < cfg.dirScalp) {
        var nnx = mx / env.a2, nny = yyn / env.b2, nnz = mz / env.c2, nnl = Math.sqrt(nnx * nnx + nny * nny + nnz * nnz);
        if (nnl > 1e-9) { nnx /= nnl; nny /= nnl; nnz /= nnl; var cc = nnx * bc[6] + nny * bc[7] + nnz * bc[8];
          if (Math.abs(cc) >= cfg.dirNormMin) { axx = nnx; axy = nny; axz = nnz; ang = ang / cc; if (ang > HALF) ang = HALF; else if (ang < -HALF) ang = -HALF; } }
      }
      R[k * 3] = axx * ang; R[k * 3 + 1] = axy * ang; R[k * 3 + 2] = axz * ang;
      changed = true; if (k < lo) lo = k; if (k > hi) hi = k; if (st) st.seg++;
    }
    if (!changed) return pts;
    var s0 = Math.max(1, lo - 1), s1 = Math.min(last, hi + 1), j, o0x, o0y, o0z, c0x, c0y, c0z;
    j = (s0 > 1 ? s0 - 1 : s0) * 3; o0x = R[j]; o0y = R[j + 1]; o0z = R[j + 2];
    for (k = s0; k <= s1; k++) {                                           // 회전을 이웃 마디끼리 한 번 고르게
      j = k * 3; c0x = R[j]; c0y = R[j + 1]; c0z = R[j + 2];
      if (k < last) { R[j] = (o0x + 2 * c0x + R[j + 3]) * 0.25; R[j + 1] = (o0y + 2 * c0y + R[j + 4]) * 0.25; R[j + 2] = (o0z + 2 * c0z + R[j + 5]) * 0.25; }
      else { R[j] = (o0x + 3 * c0x) * 0.25; R[j + 1] = (o0y + 3 * c0y) * 0.25; R[j + 2] = (o0z + 3 * c0z) * 0.25; }
      o0x = c0x; o0y = c0y; o0z = c0z;
    }
    var out = new Array(n), a2 = env.a2, b2 = env.b2, c2 = env.c2, hcy = env.CY, lift = 1.02, NK = env.neck || null;
    var ax, ay, az, kx, ky, kz, cs, sn, kd, tx, ty, tz, ex, ey, ez, yy, fl, ee, nx, ny, nz, nl, dn, sl, kk, pt, r, og;
    for (k = 0; k < s0; k++) out[k] = pts[k];
    var qx = pts[s0 - 1].x, qy = pts[s0 - 1].y, qz = pts[s0 - 1].z;
    for (k = s0; k < n; k++) {
      ax = U[k * 4]; ay = U[k * 4 + 1]; az = U[k * 4 + 2]; len = U[k * 4 + 3];
      if (k <= s1) {
        kx = R[k * 3]; ky = R[k * 3 + 1]; kz = R[k * 3 + 2]; ang = Math.sqrt(kx * kx + ky * ky + kz * kz);
        if (ang > 1e-5) { kx /= ang; ky /= ang; kz /= ang; cs = Math.cos(ang); sn = Math.sin(ang); kd = (kx * ax + ky * ay + kz * az) * (1 - cs);
          tx = ax * cs + (ky * az - kz * ay) * sn + kx * kd; ty = ay * cs + (kz * ax - kx * az) * sn + ky * kd; tz = az * cs + (kx * ay - ky * ax) * sn + kz * kd; ax = tx; ay = ty; az = tz; }
      }
      ex = qx + ax * len; ey = qy + ay * len; ez = qz + az * len;
      if (len > 1e-9) {                                                    // 두상 속으로는 못 들어감(원래 안쪽이던 점은 그 깊이까지)
        og = pts[k]; yy = og.y - hcy; fl = Math.sqrt(og.x * og.x / a2 + yy * yy / b2 + og.z * og.z / c2); if (fl > lift) fl = lift;
        yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
        if (ee < fl - 1e-6) {
          yy = qy - hcy; nx = qx / a2; ny = yy / b2; nz = qz / c2; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nl > 1e-9) { nx /= nl; ny /= nl; nz /= nl; dn = ax * nx + ay * ny + az * nz;
            if (dn < 0) { tx = ax - dn * nx; ty = ay - dn * ny; tz = az - dn * nz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz); if (sl > 1e-3) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; } } }
          yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
          if (ee < fl - 1e-6 && ee > 1e-9) { kk = fl / ee; ex *= kk; ey = hcy + yy * kk; ez *= kk; tx = ex - qx; ty = ey - qy; tz = ez - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; } }
          if (st) st.push++;
        }
      }
      pt = { x: ex, y: ey, z: ez };
      if (NK && len > 1e-9) { try { r = NK(pt); if (r && r !== pt && NK(pts[k]) === pts[k]) { tx = r.x - qx; ty = r.y - qy; tz = r.z - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz); if (sl > 1e-9) pt = { x: qx + tx / sl * len, y: qy + ty / sl * len, z: qz + tz / sl * len }; } } catch (e4) {} }
      qx = pt.x; qy = pt.y; qz = pt.z; out[k] = pt;
    }
    return out;
  }
  P._core = { dirPrep: dirPrep, fixStrand: fixStrand, compare: compare, prepCam: prepCam, cutIndex: cutIndex, mkEnv: mkEnv, project: project, dilate: dilate };

  /* ────────────────────────────────────────────────────────────────────────
   * 앱 쪽
   * ────────────────────────────────────────────────────────────────────── */
  var dirCamMemo = new WeakMap();
  function photoModel() { try { return state._hair3Dneutral || null; } catch (e) { return null; } }
  function getCams() {
    try {
      var photo = photoModel(), probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe);
      if (!probe || !probe.cams) return [];
      var list = probe.cams.filter(function (c) { return c && c.smp && c.iw > 0 && c.ih > 0 && c.s > 0 && c.sy > 0 && P.skip.indexOf(c.angle) < 0; });
      return list.map(function (c) {
        var mi = state.hairMasks && state.hairMasks[c.angle], ori = mi && mi.orientation;
        if (!ori || typeof sampleOrientation !== 'function') return c;
        var hit = dirCamMemo.get(c); if (hit && hit.ori === ori) return hit.cam;
        var mw = mi.maskW || mi.w, mh = mi.maskH || mi.h, kx = mw / mi.w, ky = mh / mi.h, smp = c.smp, ret = [0, 0];
        var cam = Object.assign({}, c, { dirAt: function (ix, iy) {
          if (!(smp.at(ix, iy) > 0)) return null;
          var sm = null; try { sm = sampleOrientation(ori, ix * kx, mw, iy * ky); } catch (e) { sm = null; }
          if (!sm || !isFinite(sm.angle) || !isFinite(sm.coherence)) return null;
          ret[0] = -sm.angle; ret[1] = sm.coherence; return ret;          // 사진 각은 화면 아래가 + → 위가 +로
        } });
        dirCamMemo.set(c, { ori: ori, cam: cam });
        return cam;
      });
    } catch (e) { return []; }
  }
  function getEnv() {
    try {
      var photo = photoModel(), E = (typeof getScalpEllipsoid === 'function') ? getScalpEllipsoid() : null;
      if (!photo || !E || !(E.a > 0) || !isFinite(photo.CY) || !isFinite(photo.yTop)) return null;
      var cm = 0; try { cm = (typeof modelCmPerUnit === 'function') ? modelCmPerUnit() : (state.cmPerUnit || 0); } catch (e2) {}
      return { CY: photo.CY, yTop: photo.yTop, a: E.a, b: E.b, c: E.c, cm: cm > 0 ? cm : 19 };
    } catch (e) { return null; }
  }
  function styleOn() {
    try { if (state.specAppliedId && state.specAppliedId !== '__original__') return true; } catch (e) {}
    try { if (W.FLOW_SPEC && W.FLOW_SPEC.nativeState && W.FLOW_SPEC.nativeState.id) return true; } catch (e) {}
    return false;
  }
  function lengthened() {                    // 길이 슬라이더를 원본 기준보다 늘렸나(다시 기른 머리에서만 알 수 있음)
    try {
      var G = W.REGROW, b = G && G.base && G.base.sections, k; if (!b) return false;
      for (k in b) if (state.sections[k] && isFinite(b[k].length) && +state.sections[k].length > +b[k].length + P.lenSlack) return true;
    } catch (e) {}
    return false;
  }
  var NAMES = { front: '정면', left: '왼쪽', right: '오른쪽', back: '뒤' };
  function nameOf(a) {
    if (NAMES[a]) return NAMES[a];
    var m = /^v(m?)(\d+)$/.exec(a || ''); return m ? '360 ' + (m[1] ? '−' : '+') + m[2] + '°' : String(a);
  }
  var ORDER = ['front', 'left', 'right', 'back'];
  function sortViews(v) { return v.slice().sort(function (p, q) { var i = ORDER.indexOf(p.angle), j = ORDER.indexOf(q.angle); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); }); }

  P.run = function () {
    S.err = null;
    try {
      var cams = getCams(), env = getEnv();
      if (!cams.length || !env) { S.err = '사진 카메라가 없음(사진 분석 전이거나 점유 프로브가 꺼져 있음)'; S.views = []; return null; }
      var list = computeAdjustedHair3DStrands();
      if (!list || !list.length) { S.err = '가닥이 없음'; S.views = []; return null; }
      var t0 = now(), res = sortViews(compare(list, cams, env, P));
      if (P.dir) { try { dirPrep(list, cams, env, P).forEach(function (d) { var v = res.filter(function (x) { return x.angle === d.angle; })[0]; if (v) v.dir = { MIS: d.MIS, compared: d.compared, off: d.off, medDeg: d.medDeg, cohMed: d.cohMed, cohSeen: d.cohSeen }; }); } catch (eD) { S.err = '결 대조 실패: ' + (eD && eD.message || eD); } }
      S.ms = now() - t0; S.views = res; S.strands = list.length; S.at = new Date().toTimeString().slice(0, 8);
      S.style = styleOn(); S.trimOn = !!(P.trim && trimActive()); if (P.fixDir) fixActive();
      try { console.log(P.lines().join('\n')); } catch (e2) {}
      return res;
    } catch (e) { S.err = String(e && e.message || e); S.views = []; return null; }
  };
  function f1(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1); }
  function viewText(v) {
    var t = nameOf(v.angle) + ' — 겹침 ' + Math.round(v.iou * 100) + '% · 넘침 ' + (v.overPct * 100).toFixed(1) + '% · 빔 ' + (v.underPct * 100).toFixed(1) + '%';
    if (v.ext) t += ' · 윤곽 끝(cm · +는 3D가 더 나감) 위 ' + f1(v.ext.top) + ' / 아래 ' + (v.ext.bottom == null ? '사진 밖' : f1(v.ext.bottom)) + ' / 사진 왼쪽 ' + f1(v.ext.left) + ' / 사진 오른쪽 ' + f1(v.ext.right);
    if (v.dir) t += ' · 결: 비교한 칸 ' + v.dir.compared + ' · 어긋난 뭉치 칸 ' + v.dir.off + (v.dir.compared ? '(' + (v.dir.off / v.dir.compared * 100).toFixed(1) + '%)' : '') + (v.dir.medDeg != null ? ' · 어긋남 중앙 ' + v.dir.medDeg.toFixed(0) + '°' : '') +
      (v.dir.cohMed != null ? ' · 사진 결 또렷함 중앙 ' + v.dir.cohMed.toFixed(2) + '(칸 ' + v.dir.cohSeen + ')' : '');
    else if (P.dir) t += ' · 결: 이 사진은 결 정보 없음';
    return t;
  }
  P.lines = function () {
    var L = [];
    if (!S.at && !S.err) { L.push(TAG + ' 아직 안 함 — 조정 화면의 [원본 대조] 버튼 · 윤곽 밖 잘라내기 ' + (P.trim ? '켜짐' : '꺼짐')); return L; }
    if (S.err) { L.push(TAG + ' ⚠ ' + S.err); return L; }
    L.push(TAG + ' ' + S.at + ' · 가닥 ' + S.strands + '개 · 사진 ' + S.views.length + '장 · ' + Math.round(S.ms) + 'ms · 여유 ' + P.tolCm + 'cm · 비율은 사진의 머리 넓이 대비' +
      (S.style ? ' · ⚠ 스타일이 걸려 있음(원본과 다른 것이 당연)' : '') +
      ' · 윤곽 밖 잘라내기 ' + (P.trim ? (S.trimWhy ? '쉼(' + S.trimWhy + ')' : '켜짐 — 자른 가닥 ' + S.trimCut + '개 · 잘라 낸 길이 합 ' + Math.round(S.trimLen * (getEnv() ? getEnv().cm : 19)) + 'cm · ' + Math.round(S.trimMs) + 'ms') : '꺼짐') +
      ' · 결 맞추기 ' + (P.fixDir ? (S.fixWhy ? '쉼(' + S.fixWhy + ')' : '켜짐 — 돌린 가닥 ' + S.fixStr + '개(마디 ' + S.fixSeg + ' · 두상에 막혀 눕힌 마디 ' + S.fixPush + ') · ' + Math.round(S.fixMs) + 'ms · 기준 ' + P.dirWarn + '° · 사진 결 또렷함 ' + P.dirCoh + ' 이상') : '꺼짐'));
    S.views.forEach(function (v) { L.push('   ' + viewText(v)); });
    return L;
  };

  /* ── 잘라내기 ── */
  function trimActive() {
    S.trimWhy = '';
    if (!P.on || !P.trim) return false;
    if (styleOn()) { S.trimWhy = '스타일이 걸려 있음'; return false; }
    if (lengthened()) { S.trimWhy = '길이를 원본보다 늘림'; return false; }
    return true;
  }
  var memo = new WeakMap(), trimModel = null;
  function trimList(list) {
    var hit = memo.get(list); if (hit && hit.ver === ver) return hit.out;
    var cams = getCams(), env0 = getEnv(); if (!cams.length || !env0 || !list || !list.length) return list;
    var t0 = now(), env = mkEnv(env0), pcs = cams.map(function (c) { return prepCam(c, env, P, P.trimTolCm); }), o = [0, 0];
    var n = list.length, out = new Array(n), i, e, p, cut, k, nc = 0, len = 0;
    for (i = 0; i < n; i++) {
      e = list[i]; p = e && e.pts; out[i] = e;
      if (!p || p.length <= P.keepPts) continue;
      cut = cutIndex(p, pcs, env, P, o);
      if (cut >= p.length) continue;
      for (k = cut; k < p.length; k++) len += Math.hypot(p[k].x - p[k - 1].x, p[k].y - p[k - 1].y, p[k].z - p[k - 1].z);
      var np = p.slice(0, cut);
      try { np._pre = (p._pre && p._pre.length === p.length) ? p._pre.slice(0, cut) : np; } catch (e2) {}
      var ne = Object.assign({}, e, { pts: np });
      try { if (e.colors && e.colors.length === p.length) ne.colors = e.colors.slice(0, cut); if (e.srcColors && e.srcColors.length === p.length) ne.srcColors = e.srcColors.slice(0, cut); } catch (e3) {}
      out[i] = ne; nc++;
    }
    S.trimCut = nc; S.trimLen = len; S.trimMs = now() - t0;
    memo.set(list, { ver: ver, out: out });
    return out;
  }
  /* ── 결 맞추기 ── */
  function fixActive() {
    S.fixWhy = '';
    if (!P.on || !P.fixDir) return false;
    if (styleOn()) { S.fixWhy = '스타일이 걸려 있음'; return false; }
    return true;
  }
  var fmemo = new WeakMap();
  function fixList(list) {
    var hit = fmemo.get(list); if (hit && hit.ver === ver) return hit.out;
    var cams = getCams().filter(function (c) { return typeof c.dirAt === 'function'; }), env0 = getEnv(); if (!cams.length || !env0 || !list || !list.length) return list;
    var t0 = now(), env = mkEnv(env0), dps = dirPrep(list, cams, env, P).filter(function (d) { return d.off > 0; }), o = [0, 0], st = { seg: 0, push: 0 };
    try { env.neck = (W.REGROW && typeof W.REGROW.neckPush === 'function') ? W.REGROW.neckPush : null; } catch (e) { env.neck = null; }
    var n = list.length, out = list, i, e, p, np, nc = 0;
    if (dps.length) {
      out = new Array(n);
      for (i = 0; i < n; i++) {
        e = list[i]; p = e && e.pts; out[i] = e;
        if (!p || p.length < 3) continue;
        np = fixStrand(p, dps, env, P, o, st);
        if (np === p) continue;
        try { np._pre = p._pre || p; } catch (e2) {}                       // 빗기 전 자리(53번 붓이 여기에 칠함)는 그대로 넘김
        out[i] = Object.assign({}, e, { pts: np }); nc++;
      }
    }
    S.fixStr = nc; S.fixSeg = st.seg; S.fixPush = st.push; S.fixMs = now() - t0;
    fmemo.set(list, { ver: ver, out: out });
    return out;
  }
  var origCA = W.computeAdjustedHair3DStrands;
  if (typeof origCA === 'function') W.computeAdjustedHair3DStrands = function () {
    var list = origCA.apply(this, arguments);
    try {
      if (P.trim || P.fixDir) {
        var m = photoModel();
        if (trimModel && m !== trimModel) { P.trim = false; P.fixDir = false; trimModel = null; ver++; syncUi(); return list; }      // 사진·모델이 바뀜 → 끔
        if (P.fixDir && fixActive()) list = fixList(list);                 // 결 맞추기 먼저, 그다음 잘라내기
        if (P.trim && trimActive()) list = trimList(list);
      }
    } catch (e) { S.err = String(e && e.message || e); }
    return list;
  };
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () {
    var s = origFS.apply(this, arguments);
    try { return s + '|pc' + (P.on && (P.trim || P.fixDir) ? ver + (styleOn() ? 's' : ((P.trim ? (lengthened() ? 'l' : 't') : '') + (P.fixDir ? 'd' : ''))) : 0); } catch (e) { return s; }
  };
  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof currentScreen !== 'undefined' && currentScreen === 'adjust' && typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  }
  P.setFixDir = function (v) {
    P.fixDir = (v == null) ? !P.fixDir : !!v; trimModel = (P.trim || P.fixDir) ? photoModel() : null; ver++;
    redraw(); syncUi();
    return P.fixDir;
  };
  P.setTrim = function (v) {
    P.trim = (v == null) ? !P.trim : !!v; trimModel = (P.trim || P.fixDir) ? photoModel() : null; ver++;
    redraw(); syncUi();
    return P.trim;
  };
  P.refresh = function () { ver++; redraw(); };

  /* ────────────────────────────────────────────────────────────────────────
   * (2026-10-08c) 진단 데이터 내보내기 — 영상과 진단 글만으로는 "어느 가닥이 왜 따로 노는가"를 짐작으로만 고칠 수 있었습니다
   *   (사용자: "뜬 머리가 아직 있고, 할 때마다 바뀌어"). 지금 이 손님의 머리 데이터를 파일 하나로 저장해 보내면, 같은 데이터를 그대로 돌려서 원인을 찾을 수 있습니다.
   *   담는 것: 두상 치수 · 다시 기른 가닥(점은 하나 걸러) · 마네킹 뿌리 · 지금 걸린 결 표 · 지금 화면에 그려진 가닥 · 사진별 카메라 값과 머리 영역·결(칸 단위) · 섹션/스타일링 값 · 빗질 획 수.
   *   안 담는 것: 사진 원본 · 얼굴(머리 영역의 윤곽과 결 방향만 칸 단위로 들어갑니다).
   *   형식: 'GYDBG1\n' + 머리말 길이(uint32 LE) + 머리말(JSON) + 묶음들(머리말의 parts에 자리·형식). 브라우저가 되면 gzip.
   * ────────────────────────────────────────────────────────────────────── */
  var QS = 8192;                               // 좌표 → int16 배율(±4 모델 단위)
  function q16(v) { v = Math.round(v * QS); return v < -32767 ? -32767 : v > 32767 ? 32767 : v; }
  function packStrands(list, stride, secIdx) {
    var n = list.length, cnt = new Uint16Array(n), sec = new Uint8Array(n), fl = new Uint8Array(n), tot = 0, i, k, p, m, keep;
    for (i = 0; i < n; i++) { p = list[i] && list[i].pts; m = p ? p.length : 0; keep = m ? (stride > 1 ? Math.floor((m - 1) / stride) + 1 + ((m - 1) % stride ? 1 : 0) : m) : 0; if (keep > 65535) keep = 65535; cnt[i] = keep; tot += keep; }
    var D = new Int16Array(tot * 3), o = 0, e, w;
    for (i = 0; i < n; i++) {
      e = list[i]; p = e && e.pts; if (!p) continue; m = p.length; w = 0;
      for (k = 0; k < m && w < cnt[i]; k += stride) { D[o++] = q16(p[k].x); D[o++] = q16(p[k].y); D[o++] = q16(p[k].z); w++; }
      if (w < cnt[i]) { D[o++] = q16(p[m - 1].x); D[o++] = q16(p[m - 1].y); D[o++] = q16(p[m - 1].z); w++; }      // 끝점은 꼭
      sec[i] = secIdx ? secIdx(e.sec) : 255; fl[i] = (e.mannequin ? 1 : 0) | (e.fringe ? 2 : 0) | (e.regrown ? 4 : 0);
    }
    return { cnt: cnt, sec: sec, fl: fl, D: D.subarray(0, o) };
  }
  P.buildExport = function () {
    var parts = [], bufs = [], off = 0, G = W.REGROW, FSx = W.FLOW_SPEC, C3 = W.COMB3D, env = getEnv(), cams = getCams();
    function add(name, arr, extra) { var u = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength); parts.push(Object.assign({ name: name, off: off, len: u.length, type: arr.constructor.name }, extra || {})); bufs.push(u); off += u.length; if (off % 2) { bufs.push(new Uint8Array(1)); off++; } }
    var order = []; try { order = SECTION_ORDER.slice(); } catch (e) {}
    function secIdx(s) { var i = order.indexOf(s); return i < 0 ? 255 : i; }
    var H = { magic: 'GYDBG', v: 1, at: new Date().toISOString(), ua: (typeof navigator !== 'undefined' ? navigator.userAgent : ''), qs: QS, env: env, sections: null, styling: null, order: order, notes: [] };
    try { H.sections = JSON.parse(JSON.stringify(state.sections)); H.styling = JSON.parse(JSON.stringify(state.stylingByView || state.styling || null)); H.fade = state.fade || null; H.view = state.currentViewAngle; } catch (e) {}
    try { H.mq = !!MANNEQUIN.on; H.specApplied = state.specAppliedId || null; H.curl = state._globalCurl; } catch (e) {}
    try { H.native = FSx && FSx.nativeState ? { id: FSx.nativeState.id, shaped: FSx.nativeState.shaped } : null; } catch (e) {}
    try { H.comb = C3 ? { samples: C3.samples.length, sweeps: C3.sweeps ? C3.sweeps.length : 0, level: C3.sweepLevel } : null; } catch (e) {}
    try { H.cfg = FSx ? JSON.parse(JSON.stringify(FSx, function (k, v) { return (typeof v === 'function' || k === 'stats' || k === '_core' || k === 'nativeState' || k === '_st') ? undefined : v; })) : null; } catch (e) {}
    try { H.pc = { trim: P.trim, fixDir: P.fixDir }; } catch (e) {}
    // 다시 기른 가닥(점은 하나 걸러)
    try { if (G && G.model && G.model.strands && G.model.strands.length) { var rg = packStrands(G.model.strands, 2, secIdx); add('rg.cnt', rg.cnt); add('rg.sec', rg.sec); add('rg.pts', rg.D, { stride: 2 }); H.regrown = { n: G.model.strands.length, on: !!G.on, CY: G.model.CY }; } else H.notes.push('다시 기른 모델 없음'); } catch (e) { H.notes.push('rg: ' + e.message); }
    // (2026-10-10a) 다시 기른 가닥마다 멈춘 이유·두피 위/밖 길이 등(42번 rg) + 걸음 기록(REGROW.trace를 켜고 기른 경우) + 사진에서 잰 뿌리 밀도
    try {
      if (G && G.model && G.model.strands && G.model.strands.length) {
        var ms = G.model.strands, nm = ms.length, STOP = { mask: 1, cap: 2, tip: 3, max: 4 }, MI = new Uint8Array(nm * 4), MF = new Float32Array(nm * 8), tr = [], trIdx = [], trLen = 0, j3, g3;
        for (j3 = 0; j3 < nm; j3++) {
          g3 = ms[j3] && ms[j3].rg; if (!g3) continue;
          MI[j3 * 4] = STOP[g3.stop] || 0; MI[j3 * 4 + 1] = g3.free ? 1 : 0; MI[j3 * 4 + 2] = g3.est0 | 0; MI[j3 * 4 + 3] = g3.trace ? 1 : 0;
          MF[j3 * 8] = g3.sOn || 0; MF[j3 * 8 + 1] = g3.sFree || 0; MF[j3 * 8 + 2] = g3.cap || 0; MF[j3 * 8 + 3] = g3.stp || 0;
          MF[j3 * 8 + 4] = g3.nEst || 0; MF[j3 * 8 + 5] = g3.nBack || 0; MF[j3 * 8 + 6] = g3.nNeck || 0; MF[j3 * 8 + 7] = typeof g3.den === 'number' ? g3.den : -1;
          if (g3.trace && trLen < 6e6) { tr.push(g3.trace); trIdx.push(j3, g3.trace.length); trLen += g3.trace.length; }
        }
        var MT = new Float32Array(nm), MP = new Uint8Array(nm); for (j3 = 0; j3 < nm; j3++) { g3 = ms[j3] && ms[j3].rg; if (!g3) continue; MT[j3] = typeof g3.t === 'number' ? g3.t : -1; MP[j3] = g3.flip | 0; }
        add('rg.mi', MI); add('rg.mf', MF); add('rg.t', MT); add('rg.flip', MP);
        H.rgMeta = { mi: 'stop(1영역밖 2길이상한 3끝높이 4걸음상한),free,est0,traced', mf: 'sOn,sFree,cap,stp,nEst,nBack,nNeck,den', t: '뿌리 자리 두께(모델 단위)', flip: '0 안 뒤집음 1 뒤집음 2 얇아서 안 뒤집음(아래 그대로) 3 얇아서 옆으로 눕힘', traced: tr.length,
          trace: '걸음마다 11값: 단계(0두피위 1두피밖 2곧게내림),결못읽음,쓴사진수,주로쓴사진(0..),결또렷함%,사진끼리벌어진각°,막음(1앞쏠림 2목),머리영역표,x,y,z' };
        if (tr.length) { var TA = new Float32Array(trLen), o3 = 0; tr.forEach(function (a) { TA.set(a, o3); o3 += a.length; }); add('rg.trace', TA); add('rg.traceIdx', new Uint32Array(trIdx)); }
        try { var cfgG = {}; Object.keys(G).forEach(function (k) { var v = G[k]; if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') cfgG[k] = v; }); H.regrowCfg = cfgG; } catch (e) {}
      }
      var ro = state._hair3Dneutral && state._hair3Dneutral.roots;
      if (ro && ro.den) { add('roots.den', new Float32Array(ro.den)); if (ro.est) add('roots.est', new Uint8Array(ro.est)); H.roots = { NT: ro.NT, NP: ro.NP, b: ro.b }; }
    } catch (e) { H.notes.push('rgMeta: ' + e.message); }
    // 지금 모델(마네킹이면 마네킹 뿌리) — 뿌리만
    try {
      var cur = state.hair3Dneutral;
      if (cur && cur.strands && cur.strands.length) {
        var nR = cur.strands.length, R = new Int16Array(nR * 3), rs = new Uint8Array(nR), rf = new Uint8Array(nR), i2, s2, p0;
        for (i2 = 0; i2 < nR; i2++) { s2 = cur.strands[i2]; p0 = s2 && s2.pts && s2.pts[0]; if (!p0) continue; R[i2 * 3] = q16(p0.x); R[i2 * 3 + 1] = q16(p0.y); R[i2 * 3 + 2] = q16(p0.z); rs[i2] = secIdx(s2.sec); rf[i2] = (s2.mannequin ? 1 : 0) | (s2.fringe ? 2 : 0) | (s2.regrown ? 4 : 0); }
        add('cur.root', R); add('cur.sec', rs); add('cur.fl', rf); H.current = { n: nR, mannequin: !!cur.mannequin, CY: cur.CY };
      }
    } catch (e) { H.notes.push('cur: ' + e.message); }
    // 지금 걸린 결 표
    try { var fl = FSx && FSx.active ? FSx.active() : null; if (fl && fl.d) { H.flow = { v: fl.v, cs: fl.cs, bin: fl.bin, lmax: fl.lmax, n: fl.n }; var enc = new TextEncoder().encode(fl.d); add('flow.d', enc, { enc: 'base64-text' }); } else H.notes.push('걸린 결 표 없음'); } catch (e) { H.notes.push('flow: ' + e.message); }
    // 이 손님의 다시 기른 가닥에서 뽑은 표(걸린 표와 다를 수 있음 — 다른 스타일이 걸려 있을 때)
    try { var fo = FSx && FSx.fromRegrown ? FSx.fromRegrown() : null; if (fo && fo.d && !(H.flow && fl && fo.d === fl.d)) { H.flowOwn = { v: fo.v, cs: fo.cs, bin: fo.bin, lmax: fo.lmax, n: fo.n }; add('flowOwn.d', new TextEncoder().encode(fo.d), { enc: 'base64-text' }); } else if (fo && fo.d) H.flowOwn = 'same'; } catch (e) { H.notes.push('flowOwn: ' + e.message); }
    try { var sp = (typeof getStyleSpec === 'function' && state.specAppliedId) ? getStyleSpec(state.specAppliedId) : null; if (sp) H.spec = { base: sp.base || null, flowBase: sp.flowBase || null, flowLen: sp.flowLen || null, tipAt: sp.tipAt || null, lenCm: sp.lenCm || null, styling: sp.styling || null, perm: sp.perm || null }; } catch (e) {}
    // 지금 화면에 그려진 가닥(빗질·맞추기·자르기까지 한 것)
    try { var list = computeAdjustedHair3DStrands(); if (list && list.length) { var dr = packStrands(list, 1, secIdx); add('draw.cnt', dr.cnt); add('draw.sec', dr.sec); add('draw.fl', dr.fl); add('draw.pts', dr.D); H.drawn = { n: list.length }; } } catch (e) { H.notes.push('draw: ' + e.message); }
    // 사진별 카메라 · 머리 영역 · 결(칸 단위)
    try {
      H.cams = [];
      cams.forEach(function (c, ci) {
        var cols = Math.max(40, (P.exportCols || P.cols) | 0), cell = c.iw / cols, gw = cols, gh = Math.max(1, Math.ceil(c.ih / cell)), M = new Uint8Array(gw * gh), A = new Int8Array(gw * gh), K = new Uint8Array(gw * gh), x, y, d;
        for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) {
          if (c.smp.at((x + 0.5) * cell, (y + 0.5) * cell) > 0) M[y * gw + x] = 1;
          if (typeof c.dirAt === 'function') { d = c.dirAt((x + 0.5) * cell, (y + 0.5) * cell); if (d) { A[y * gw + x] = Math.max(-127, Math.min(127, Math.round(wrapHalf(d[0]) / HALF * 127))); K[y * gw + x] = Math.max(0, Math.min(255, Math.round(d[1] * 255))); } }
        }
        H.cams.push({ angle: c.angle, R: Array.prototype.slice.call(c.R), cx: c.cx, s: c.s, sy: c.sy, crownY: c.crownY, iw: c.iw, ih: c.ih, gw: gw, gh: gh, cell: cell, hasDir: typeof c.dirAt === 'function' });
        add('cam' + ci + '.mask', M); add('cam' + ci + '.ang', A, { scale: 'x/127*90deg' }); add('cam' + ci + '.coh', K, { scale: 'x/255' });
      });
    } catch (e) { H.notes.push('cams: ' + e.message); }
    H.parts = parts;
    var hj = new TextEncoder().encode(JSON.stringify(H)), pad = (4 - (7 + 4 + hj.length) % 4) % 4, head = new Uint8Array(7 + 4 + hj.length + pad), total = head.length + off;
    head.set(new TextEncoder().encode('GYDBG1\n'), 0); new DataView(head.buffer).setUint32(7, hj.length + pad, true); head.set(hj, 11);
    for (var z = 0; z < pad; z++) head[11 + hj.length + z] = 32;
    var out = new Uint8Array(total), o2 = head.length; out.set(head, 0);
    bufs.forEach(function (b) { out.set(b, o2); o2 += b.length; });
    return { bytes: out, header: H };
  };
  /* 파일로 저장(되면 gzip) — 돌려주는 값: Promise<{name, size, gz}> */
  P.exportData = function () {
    var ex = P.buildExport(), d = new Date(), pad2 = function (v) { return (v < 10 ? '0' : '') + v; };
    var base = 'gyeol-debug-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes());
    function save(blob, name, gz) {
      var a = document.createElement('a'), url = URL.createObjectURL(blob);
      a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click();
      setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 4000);
      var info = { name: name, size: blob.size, gz: gz };
      console.log(TAG + ' 진단 데이터 저장 — ' + name + ' · ' + (blob.size / 1048576).toFixed(1) + 'MB · 다시 기른 가닥 ' + (ex.header.regrown ? ex.header.regrown.n : 0) + ' · 그려진 가닥 ' + (ex.header.drawn ? ex.header.drawn.n : 0) + ' · 사진 ' + (ex.header.cams ? ex.header.cams.length : 0) + '장' + (ex.header.notes.length ? ' · ⚠ ' + ex.header.notes.join(' / ') : ''));
      try { if (typeof showToast === 'function') showToast(T('저장했습니다: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + 'MB) — 내려받기 폴더에서 이 파일을 보내 주세요', 'Saved: ' + name + ' (' + (blob.size / 1048576).toFixed(1) + 'MB) — send this file from your Downloads folder')); } catch (e) {}
      return info;
    }
    try {
      if (typeof CompressionStream === 'function') {
        var cs = new Blob([ex.bytes]).stream().pipeThrough(new CompressionStream('gzip'));
        return new Response(cs).blob().then(function (b) { return save(new Blob([b], { type: 'application/octet-stream' }), base + '.gydbg.gz', true); },
          function () { return save(new Blob([ex.bytes], { type: 'application/octet-stream' }), base + '.gydbg', false); });
      }
    } catch (e) {}
    return Promise.resolve(save(new Blob([ex.bytes], { type: 'application/octet-stream' }), base + '.gydbg', false));
  };

  /* ── 화면 ── */
  var btn = null, panel = null, imgCache = {};
  function lang() { try { return uiLang === 'ko' ? 'ko' : 'en'; } catch (e) { return 'ko'; } }
  function T(ko, en) { return lang() === 'ko' ? ko : en; }
  function syncUi() {
    try {
      if (btn) btn.style.display = (P.on && getCams().length) ? '' : 'none';
      if (panel) { var b = panel.querySelector('#pcTrimBtn'); if (b) { b.textContent = P.trim ? T('윤곽 밖 잘라내기 ON', 'Trim outside outline ON') : T('윤곽 밖 잘라내기 OFF', 'Trim outside outline OFF'); b.style.background = P.trim ? '#c9874a' : '#3a322b'; }
        var d = panel.querySelector('#pcDirBtn'); if (d) { d.textContent = P.fixDir ? T('결 맞추기 ON', 'Match grain ON') : T('결 맞추기 OFF', 'Match grain OFF'); d.style.background = P.fixDir ? '#c9874a' : '#3a322b'; } }
    } catch (e) {}
  }
  function loadImg(angle, cb) {
    var src = null; try { src = state.shots && state.shots[angle]; } catch (e) {}
    if (!src || typeof src !== 'string') return cb(null);
    var c = imgCache[angle]; if (c && c.src === src) return cb(c.img);
    var im = new Image(); im.onload = function () { imgCache[angle] = { src: src, img: im }; cb(im); }; im.onerror = function () { cb(null); }; im.src = src;
  }
  function drawView(cv, v, cam) {
    // 머리가 있는 자리만 잘라서 크게(사진·3D 머리를 합친 범위 + 여유)
    var x, y, k, bx0 = v.gw, by0 = v.gh, bx1 = -1, by1 = -1;
    for (y = 0; y < v.gh; y++) for (x = 0; x < v.gw; x++) if (v.M[y * v.gw + x] || v.H[y * v.gw + x]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
    if (bx1 < 0) { bx0 = 0; by0 = 0; bx1 = v.gw - 1; by1 = v.gh - 1; }
    var mg = Math.max(4, Math.round(0.08 * Math.max(bx1 - bx0, by1 - by0)));
    bx0 = Math.max(0, bx0 - mg); by0 = Math.max(0, by0 - mg); bx1 = Math.min(v.gw - 1, bx1 + mg); by1 = Math.min(v.gh - 1, by1 + mg);
    var bw = bx1 - bx0 + 1, bh = by1 - by0 + 1, W0 = 360, sc = W0 / bw, Hh = Math.round(bh * sc);
    cv.width = W0; cv.height = Hh; cv.style.width = '100%';
    var g = cv.getContext('2d');
    function cellRect(cx, cy) { g.fillRect((cx - bx0) * sc, (cy - by0) * sc, sc + 0.5, sc + 0.5); }
    function overlay(hasImg) {
      if (!hasImg) { g.fillStyle = '#2b2622'; g.fillRect(0, 0, W0, Hh); g.fillStyle = '#8d8478'; for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) if (v.M[y * v.gw + x]) cellRect(x, y); }
      else { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, W0, Hh); }
      for (y = by0; y <= by1; y++) for (x = bx0; x <= bx1; x++) {
        k = y * v.gw + x;
        if (v.dir && v.dir.MIS[k]) { g.fillStyle = 'rgba(255,214,60,0.85)'; cellRect(x, y); }
        else if (v.over[k]) { g.fillStyle = 'rgba(235,60,50,0.85)'; cellRect(x, y); }
        else if (v.under[k]) { g.fillStyle = 'rgba(50,130,245,0.80)'; cellRect(x, y); }
        else if (v.H[k] && !v.M[k]) { g.fillStyle = 'rgba(235,60,50,0.25)'; cellRect(x, y); }      // 여유 안쪽의 넘침(옅게)
        else if (v.H[k] && v.M[k] && ((x > 0 && !v.H[k - 1]) || (x < v.gw - 1 && !v.H[k + 1]) || (y > 0 && !v.H[k - v.gw]) || (y < v.gh - 1 && !v.H[k + v.gw]))) { g.fillStyle = 'rgba(255,255,255,0.55)'; cellRect(x, y); }   // 3D 윤곽선
      }
    }
    loadImg(v.angle, function (im) {
      var ok = false;
      try {
        if (im && cam && Math.abs((im.naturalWidth / im.naturalHeight) / (cam.iw / cam.ih) - 1) < 0.03) {
          var kx = im.naturalWidth / v.gw, ky = im.naturalHeight / (cam.ih / v.cell);
          g.drawImage(im, bx0 * kx, by0 * ky, bw * kx, bh * ky, 0, 0, W0, Hh); ok = true;
        }
      } catch (e) { ok = false; }
      overlay(ok);
    });
  }
  function render() {
    if (!panel) return;
    var body = panel.querySelector('#pcBody'), head = panel.querySelector('#pcHead'), res = P.run(), cams = getCams();
    body.innerHTML = '';
    if (!res) { head.textContent = TAG + ' ' + (S.err || ''); return; }
    var worst = res.slice().sort(function (a, b) { return (b.overPct + b.underPct) - (a.overPct + a.underPct); })[0];
    var avg = res.reduce(function (s, v) { return s + v.iou; }, 0) / res.length;
    head.textContent = T('사진 ' + res.length + '장 평균 겹침 ' + Math.round(avg * 100) + '% · 가장 다른 사진: ' + nameOf(worst.angle) + (S.style ? ' · ⚠ 스타일이 걸려 있어 원본과 다른 것이 당연합니다' : '') + (P.trim && S.trimWhy ? ' · 잘라내기 쉼(' + S.trimWhy + ')' : '') + (P.fixDir && !S.fixWhy ? ' · 결 맞추기로 돌린 가닥 ' + S.fixStr + '개' : '') + (P.fixDir && S.fixWhy ? ' · 결 맞추기 쉼(' + S.fixWhy + ')' : ''),
      res.length + ' photos · mean overlap ' + Math.round(avg * 100) + '% · most different: ' + worst.angle + (S.style ? ' · ⚠ a style is applied' : ''));
    res.forEach(function (v) {
      var card = document.createElement('div'); card.style.cssText = 'background:#1f1b18;border-radius:8px;padding:6px;';
      var cv = document.createElement('canvas'); cv.style.cssText = 'display:block;border-radius:5px;';
      var cap = document.createElement('div'); cap.style.cssText = 'font-size:11px;line-height:1.45;color:#e8dfd2;margin-top:5px;';
      var e = v.ext;
      cap.innerHTML = '<b>' + nameOf(v.angle) + '</b> · ' + T('겹침', 'overlap') + ' ' + Math.round(v.iou * 100) + '%<br><span style="color:#ff8a80">' + T('넘침', 'over') + ' ' + (v.overPct * 100).toFixed(1) + '%</span> · <span style="color:#8ab4ff">' + T('빔', 'missing') + ' ' + (v.underPct * 100).toFixed(1) + '%</span>' +
        (v.dir ? '<br><span style="color:#ffd63c">' + T('결 어긋난 뭉치', 'grain off') + ' ' + (v.dir.compared ? (v.dir.off / v.dir.compared * 100).toFixed(1) : '0') + '%</span> <span style="color:#9d9284">(' + T('비교한 칸', 'cells compared') + ' ' + v.dir.compared + ')</span>' : '') +
        (e ? '<br>' + T('위', 'top') + ' ' + f1(e.top) + ' · ' + T('아래', 'bottom') + ' ' + (e.bottom == null ? '–' : f1(e.bottom)) + ' · ' + T('좌', 'L') + ' ' + f1(e.left) + ' · ' + T('우', 'R') + ' ' + f1(e.right) + ' cm' : '');
      card.appendChild(cv); card.appendChild(cap); body.appendChild(card);
      drawView(cv, v, cams.filter(function (c) { return c.angle === v.angle; })[0]);
    });
    syncUi();
  }
  P.open = function () {
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'photoCheckPanel';
      panel.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(10,8,7,0.88);overflow:auto;padding:12px;box-sizing:border-box;font-family:inherit;';
      panel.innerHTML = '<div style="max-width:1180px;margin:0 auto;">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;">' +
        '<b style="color:#f3e9da;font-size:15px;">' + T('원본 대조', 'Compare with photos') + '</b>' +
        '<span style="font-size:12px;color:#d8cdbd;"><span style="color:#ff8a80">■</span> ' + T('넘침 — 3D에만 있는 머리', 'over — hair only in 3D') + ' &nbsp;<span style="color:#8ab4ff">■</span> ' + T('빔 — 사진에만 있는 머리', 'missing — hair only in photo') + ' &nbsp;<span style="color:#ffd63c">■</span> ' + T('결 어긋남 — 사진과 방향이 ' + P.dirWarn + '° 넘게 다른 뭉치', 'grain off by more than ' + P.dirWarn + '°') + ' &nbsp;<span style="color:#fff">▯</span> ' + T('3D 윤곽선', '3D outline') + ' · ' + T('좌/우는 사진에서 본 방향 · +는 3D가 더 나감', 'L/R as seen in the photo · + = 3D sticks out') + '</span>' +
        '<span style="flex:1"></span>' +
        '<button id="pcExportBtn" type="button" style="border:0;border-radius:6px;padding:7px 10px;background:#2f4a66;color:#fff;font-size:12px;cursor:pointer;">' + T('진단 데이터 저장', 'Save debug data') + '</button>' +
        '<button id="pcDirBtn" type="button" style="border:0;border-radius:6px;padding:7px 10px;color:#fff;font-size:12px;cursor:pointer;"></button>' +
        '<button id="pcTrimBtn" type="button" style="border:0;border-radius:6px;padding:7px 10px;color:#fff;font-size:12px;cursor:pointer;"></button>' +
        '<button id="pcAgainBtn" type="button" style="border:0;border-radius:6px;padding:7px 10px;background:#3a322b;color:#fff;font-size:12px;cursor:pointer;">' + T('다시 대조', 'Re-run') + '</button>' +
        '<button id="pcCloseBtn" type="button" style="border:0;border-radius:6px;padding:7px 12px;background:#6b5d50;color:#fff;font-size:12px;cursor:pointer;">' + T('닫기', 'Close') + '</button>' +
        '</div><div id="pcHead" style="font-size:12px;color:#f0c9a0;margin-bottom:8px;"></div>' +
        '<div id="pcBody" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;"></div></div>';
      document.body.appendChild(panel);
      panel.querySelector('#pcCloseBtn').addEventListener('click', function () { P.close(); });
      panel.querySelector('#pcAgainBtn').addEventListener('click', function () { render(); });
      panel.querySelector('#pcTrimBtn').addEventListener('click', function () { P.setTrim(); render(); });
      panel.querySelector('#pcDirBtn').addEventListener('click', function () { P.setFixDir(); render(); });
      panel.querySelector('#pcExportBtn').addEventListener('click', function () { var b = this; b.disabled = true; b.textContent = T('저장하는 중…', 'Saving…'); Promise.resolve().then(function () { return P.exportData(); }).then(function () {}, function (e) { console.warn(TAG + ' 진단 데이터 저장 실패', e); }).then(function () { b.disabled = false; b.textContent = T('진단 데이터 저장', 'Save debug data'); }); });
    }
    panel.style.display = 'block';
    render();
  };
  P.close = function () { if (panel) panel.style.display = 'none'; };
  try {
    var bar = document.querySelector('#screen-adjust .mode-bar'), mq = document.getElementById('mannequinBtn');
    if (bar) {
      btn = document.createElement('button'); btn.id = 'photoCheckBtn'; btn.type = 'button';
      if (mq && mq.className) btn.className = mq.className;
      btn.textContent = '원본 대조'; btn.title = '지금 화면의 머리를 원본 사진의 머리 윤곽과 겹쳐 봅니다';
      btn.addEventListener('click', function () { P.open(); });
      bar.appendChild(btn); syncUi();
    }
  } catch (e) { console.warn(TAG + ' 버튼 만들기 실패', e); }
  try {
    if (typeof I18N !== 'undefined') {
      Object.assign(I18N, { '원본 대조': 'Compare photos', '지금 화면의 머리를 원본 사진의 머리 윤곽과 겹쳐 봅니다': 'Overlay the current hair on the hair outline of the original photos' });
      try { _i18nSubKeys = null; } catch (e) {}
      try { if (typeof applyUiLang === 'function') applyUiLang(); } catch (e) {}
    }
  } catch (e) {}
  var origRAF = W.renderAdjustFrame;
  if (typeof origRAF === 'function') W.renderAdjustFrame = function () { var r = origRAF.apply(this, arguments); try { syncUi(); } catch (e) {} return r; };
  var oAct = W.activateScreen;
  if (typeof oAct === 'function') W.activateScreen = function () { var r = oAct.apply(this, arguments); try { if (arguments[0] !== 'adjust') P.close(); syncUi(); } catch (e) {} return r; };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { P.lines().forEach(function (x) { L.push(x); }); } catch (e) {}
    return L;
  };
  console.log(TAG + ' 설치 — 조정 화면의 [원본 대조]: 지금 머리를 사진의 머리 윤곽과 겹쳐 넘침(빨강)·빔(파랑)을 보여 줍니다. 결이 사진과 크게 다른 뭉치는 노랑. 콘솔에서 PHOTO_CHECK.run() · 결 맞추기 PHOTO_CHECK.setFixDir(true) · 윤곽 밖 잘라내기 PHOTO_CHECK.setTrim(true)');
})();
