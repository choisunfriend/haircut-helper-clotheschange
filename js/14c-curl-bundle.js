/* 14c-curl-bundle.js
 * 펌 웨이브를 "가닥 단위"가 아니라 "로드(와인딩) 단위"로 묶어서 적용한다.
 *
 * 문제: 기존 curlStrand3D()는 가닥마다 자기 뿌리 위치에서 프레임(u,v)을 만들고
 *       자기 스파인을 따라 평행이송하면서 나선을 감았다. 뿌리 위치·컷 길이·
 *       곡률이 조금씩 다르면 이웃 가닥의 프레임과 위상이 갈라지고, 나선반경이
 *       가닥 간격의 절반을 넘는 순간 서로를 통과한다 → 화면에서 X자 교차.
 *
 * 해법: 두피 위에서 로드 지름만큼 격자를 끊어 "번들"을 만들고, 번들마다
 *       축(axis) · 프레임(u,v) · 위상(phase)을 한 번만 정한다. 같은 번들의
 *       가닥은 호길이 s에 대해 "완전히 같은 변위 d(s)"를 받으므로 번들 전체가
 *       평행이동한다. 평행이동은 순서를 바꾸지 않으므로 교차가 원리적으로 없다.
 *       (실제 펌도 로드 하나에 감긴 패널이 통째로 같은 나선을 그린다.)
 */

const CURL_BUNDLE = {
  on: true,
  rodK: 1.0,         // 번들 폭 = 로드 지름 × rodK (1.0 = 로드 실치수)
  // 나선 크기. 1 모델단위 = 180mm(두상 반폭 0.417단위 ≈ 75mm 기준).
  // rodR 0.02~0.07단위 = 로드 반경 3.6~12.6mm = 지름 7~25mm — 실제 로드와 맞다.
  // 코일 반경은 감긴 로드의 반경을 넘을 수 없으므로 rodScale은 1을 넘기면 안 된다.
  // 호길이 10.6cm 기준 기하학적 바퀴수 = 106mm / (π×지름) = 1.3~4.7바퀴.
  rodScale: 1.0,     // 나선반경 배율 (≤1 유지)
  pitchScale: 0.3,   // 피치 배율 — 이걸 낮춰야 바퀴수가 기하학적 상한에 붙는다
phaseStep: 0.55,   // 이웃 번들끼리 벌어지는 위상 (rad) — 판이 갈라져 보이는 정도
  phaseJitter: 0.35, // 번들 위상에 섞는 난수 폭 (rad)
  ramp: 0.12,        // 뿌리 쪽에서 진폭이 0→1 되는 구간 (스파인 길이 비율)
  minSamples: 24,
  maxSamples: 400,
  debug: false,
};

const _curlBundleCache = new Map();
let _curlBundleGen = -1;
let _curlBundleStats = { bundles: 0, strands: 0, R: 0, pitch: 0, turnSum: 0, turnN: 0 };

function _cbGen() {
  try { return (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.gen) | 0; } catch (e) { return 0; }
}

function _cbHash(a, b, c) {
  let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; h ^= h >>> 16;
  return h / 4294967296;
}

/* 뿌리 위치 → 두피 격자 칸(번들 좌표). 칸 한 변 = 로드 지름. */
function curlBundleCell(root, rodR) {
  let E = null;
  try { E = getHeadEllipsoid(); } catch (e) { return null; }
  if (!E || !(E.a > 0) || !(E.b > 0) || !(E.c > 0)) return null;

  const x = root.x, y = root.y - SCALP_CENTER_Y, z = root.z;
  const r = Math.hypot(x, y, z);
  if (!(r > 1e-9)) return null;

  const rMean = (E.a + E.b + E.c) / 3;
  const rod = Math.max(1e-4, rodR * 2 * CURL_BUNDLE.rodK);

  const phi = Math.acos(Math.max(-1, Math.min(1, y / r)));   // 0=정수리
  const theta = Math.atan2(x, z);                             // 0=뒤통수 중앙
  const shrink = Math.max(0.25, Math.sin(phi));               // 정수리에서 칸이 무한히 좁아지는 것 방지

  const su = theta * rMean * shrink;  // 두피 위 가로 호길이
  const sv = phi * rMean;             // 두피 위 세로 호길이

  const i = Math.floor(su / rod), j = Math.floor(sv / rod);
  // 칸 중심을 3D 방향으로 되돌린다 (번들 공통 기준 방향)
  const phiC = ((j + 0.5) * rod) / rMean;
  const shrinkC = Math.max(0.25, Math.sin(phiC));
  const thetaC = ((i + 0.5) * rod) / (rMean * shrinkC);
  return {
    i, j, rod,
    ref: { x: Math.sin(thetaC) * Math.sin(phiC), y: Math.cos(phiC), z: Math.cos(thetaC) * Math.sin(phiC) },
  };
}

/* 번들 하나의 나선 파라미터를 정한다(캐시). 같은 칸의 첫 가닥이 축을 정한다. */
function curlBundleField(root, pts, curl, waveNorm, curlDir) {
  const rodR = curlRodRadius(waveNorm);
  const cell = curlBundleCell(root, rodR);
  if (!cell) return null;

  const gen = _cbGen();
  if (gen !== _curlBundleGen) {
    _curlBundleCache.clear();
    _curlBundleGen = gen;
    _curlBundleStats = { bundles: 0, strands: 0, R: 0, pitch: 0, turnSum: 0, turnN: 0 };
  }
  const id = cell.i + '|' + cell.j + '|' + curl.toFixed(1) + '|' + waveNorm.toFixed(3) + '|' + (curlDir | 0);
  const hit = _curlBundleCache.get(id);
  _curlBundleStats.strands++;
  if (hit) return hit;

  const amp01 = Math.pow(Math.max(0, Math.min(100, curl)) / 100, CURL3D_FIX.ampGamma);
  const R = rodR * Math.pow(amp01, CURL3D_FIX.radiusGamma) * CURL_BUNDLE.rodScale;
  const pitch = rodR * (2.6 - 2.28 * amp01) * CURL_BUNDLE.pitchScale;
  const turnLen = Math.sqrt(R * R + pitch * pitch) || 1e-4;
  if (!(R > 1e-9) || !(pitch > 1e-9)) return null;

  // 축: 이 번들을 대표하는 뿌리→끝 방향
  const tip = pts[pts.length - 1];
  let ax = { x: tip.x - root.x, y: tip.y - root.y, z: tip.z - root.z };
  let axL = Math.hypot(ax.x, ax.y, ax.z);
  if (!(axL > 1e-9)) { ax = { x: 0, y: -1, z: 0 }; axL = 1; }
  ax = { x: ax.x / axL, y: ax.y / axL, z: ax.z / axL };

  // u축: 번들 중심의 바깥 방향을 축에 수직으로 투영
  const cands = [cell.ref, { x: 0, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }];
  let u = null;
  for (const c of cands) {
    const d = c.x * ax.x + c.y * ax.y + c.z * ax.z;
    const p = { x: c.x - d * ax.x, y: c.y - d * ax.y, z: c.z - d * ax.z };
    const pl = Math.hypot(p.x, p.y, p.z);
    if (pl > 1e-6) { u = { x: p.x / pl, y: p.y / pl, z: p.z / pl }; break; }
  }
  if (!u) return null;
  const v = {
    x: ax.y * u.z - ax.z * u.y,
    y: ax.z * u.x - ax.x * u.z,
    z: ax.x * u.y - ax.y * u.x,
  };

  // 위상: 이웃 번들끼리 조금씩만 어긋나게 (완전 난수면 다시 갈라져 보인다)
  const jitter = (_cbHash(cell.i, cell.j, 7) - 0.5) * 2 * CURL_BUNDLE.phaseJitter;
  const phase = (Math.max(-100, Math.min(100, curlDir || 0)) / 100) * Math.PI
              + (cell.i + cell.j * 0.5) * CURL_BUNDLE.phaseStep + jitter;

  // 뿌리 램프 기준 길이도 번들 공통으로 고정
  const refArc = arcLength3D(pts);
  const refSpine = refArc * (pitch / turnLen);

  const field = { cell, R, pitch, turnLen, u, v, phase, rampLen: Math.max(1e-6, refSpine * CURL_BUNDLE.ramp) };
  if (_curlBundleCache.size > 20000) { _curlBundleCache.clear(); _curlBundleStats = { bundles: 0, strands: 0, R: 0, pitch: 0, turnSum: 0, turnN: 0 }; }
  _curlBundleCache.set(id, field);
  _curlBundleStats.bundles++, _curlBundleStats.R = R, _curlBundleStats.pitch = pitch;
  return field;
}

const _curlStrand3D_perStrand = curlStrand3D;

/* 덮어쓰기: 번들 단위 나선 */
curlStrand3D = function (pts, curl, waveNorm, curlDir) {
  if (!CURL_BUNDLE.on) return _curlStrand3D_perStrand(pts, curl, waveNorm, curlDir);
  if (!pts || pts.length < 3 || !(curl > 0)) return pts;

  const arc = arcLength3D(pts);
  if (arc < 1e-5) return pts;

  const root = pts[0];
  const f = curlBundleField(root, pts, curl, waveNorm, curlDir);
  if (!f) return _curlStrand3D_perStrand(pts, curl, waveNorm, curlDir);

  // 이 가닥이 쓸 스파인 길이(컬로 줄어든 만큼)
  const spineLen = arc * (f.pitch / f.turnLen);
  const totalAngle = arc / f.turnLen;
  const turns = totalAngle / (2 * Math.PI);
  _curlBundleStats.turnSum += turns, _curlBundleStats.turnN++;
  const N = Math.max(CURL_BUNDLE.minSamples, Math.min(CURL_BUNDLE.maxSamples, Math.ceil(turns * 14) + 2));

  // 가닥 자신의 호길이 테이블
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + _v3len(_v3sub(pts[i], pts[i - 1])));

  // 번들 안 미세 변주 (0이면 완전히 같은 판)
  const hs = _cbHash(Math.round(root.x * 9973), Math.round(root.y * 9973), Math.round(root.z * 9973));
  const rMul = 1 + (hs - 0.5) * 2 * CURL_BUNDLE.microAmp;
  const pAdd = (hs - 0.5) * 2 * CURL_BUNDLE.microPhase;

  const out = [pts[0]];
  for (let k = 1; k <= N; k++) {
    const s = spineLen * (k / N);
    const p = _pointAtArc(pts, cum, s);
    const th = f.phase + pAdd + s / f.pitch;
    const rad = f.R * rMul * Math.min(1, s / f.rampLen);
    const c = Math.cos(th) * rad, d = Math.sin(th) * rad;
    out.push({
      x: p.x + f.u.x * c + f.v.x * d,
      y: p.y + f.u.y * c + f.v.y * d,
      z: p.z + f.u.z * c + f.v.z * d,
    });
  }
  return out;
};

function curlBundleHarness() {
  const st = _curlBundleStats;
  let a = 0;
  try { a = getHeadEllipsoid().a; } catch (e) {}
  const pctR = a > 0 ? (st.R / a * 100) : 0;
  const turns = st.turnN ? st.turnSum / st.turnN : 0;
  const perBundle = st.bundles ? st.strands / st.bundles : 0;

  const lines = [];
  lines.push('[펌·번들] ' + (CURL_BUNDLE.on ? 'ON' : 'OFF')
    + ' · 번들 ' + st.bundles + '개 / 가닥 ' + st.strands + '개'
    + ' · 번들당 평균 ' + perBundle.toFixed(1) + '가닥');
  lines.push('  나선반경 <b>' + pctR.toFixed(0) + '%</b> (두상 반폭 대비) · 가닥당 <b>' + turns.toFixed(2) + '바퀴</b>'
    + ' · 배율 rodScale ' + CURL_BUNDLE.rodScale + ' / pitchScale ' + CURL_BUNDLE.pitchScale);
  lines.push('  읽는 법 — 반경은 로드 굵기(웨이브 폭 슬라이더), 바퀴수는 <b>호길이 ÷ 로드 둘레</b>로 정해집니다.'
    + ' 머리가 짧으면 큰 로드로는 바퀴수가 안 나옵니다 — 그때는 웨이브 폭을 <b>낮춰야</b> 합니다.');
  if (!st.bundles) lines.push('  ⚠ 컬이 걸린 섹션이 없습니다(전부 curl 0) — 컬 슬라이더를 올리고 다시 부르십시오.');
  else {
    if (pctR < 5) lines.push('  ⚠ 반경이 5% 미만이라 직모와 구분이 안 됩니다 — 컬을 올리거나 웨이브 폭을 키우십시오(rodScale은 1을 넘기지 말 것: 코일이 로드보다 굵어집니다).');
    if (turns < 1) lines.push('  ⚠ 가닥당 1바퀴 미만이라 웨이브가 아니라 한 번 꺾인 선으로 보입니다 — 웨이브 폭을 낮추거나 CURL_BUNDLE.pitchScale을 낮추십시오.');
    if (turns > 5) lines.push('  ⚠ 너무 촘촘해서 뭉개집니다 — 웨이브 폭을 키우거나 pitchScale을 올리십시오.');
    if (perBundle < 2) lines.push('  ⚠ 번들당 1~2가닥이면 묶임 효과가 없습니다 — 웨이브 폭(로드 사이즈)이나 CURL_BUNDLE.rodK를 키우십시오.');
  }
  lines.push('  끄고 비교: CURL_BUNDLE.on=false 후 슬라이더를 살짝 움직이면 다시 그립니다.');
  console.log(lines.join('\\n'));
  return { bundles: st.bundles, perBundle: +perBundle.toFixed(1), radiusPct: +pctR.toFixed(1), turns: +turns.toFixed(2) };
}
