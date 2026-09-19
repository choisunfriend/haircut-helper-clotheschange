/* ==========================================================================
   21-body-base.js — 3D 결과보기의 "몸"
   ------------------------------------------------------------------------
   예전: 의상 에셋(Male_Suit.obj 등)이 몸과 옷을 통째로 들고 있었다.
         옷을 바꾸려면 몸까지 통째로 갈아끼워야 했고, 옷이 없으면 몸도 없었다.
   지금: 몸은 MakeHuman 표준 인체(base.obj · CC0) 하나로 고정하고,
         그 위에 의상 메쉬만 얹었다 벗겼다 한다.

   옷은 원본이 아니라 assets/fitted/의 conform 사본을 쓴다 — 기증받은 MakeClothes 에셋은
   만든 사람의 체형에 물려 있어서 우리 표준 체형에서는 팔·배가 옷을 뚫고 나왔다.
   tools/conform.py가 반입 단계에서 파고든 자리만 밀어내 맞춰 둔다(업체 옷도 같은 길로).

   좌표계 — assets의 MakeHuman 의상(suit3 · suit_dinner_jacket · fem_suit2 ·
   mens_elv_jeans2slf · mycenaean_tunic)은 전부 MakeClothes가 이 베이스 메쉬에
   맞춰 뽑은 것이라 배율 1 · 이동 0으로 그대로 맞는다. 옷을 더 넣을 때도
   MakeClothes로 뽑은 것이면 좌표를 건드릴 필요가 없다.

   앱 좌표(씬)로 세우는 규칙은 기존 loadOutfitMeshFromOBJ와 같다 —
   목 절단선이 getNeckBottomY()에 오고, 발바닥까지가 personBodyLenMesh()다.
   ========================================================================== */

const BODY_BASE = {
  'on': true,                                  // false면 예전 의상-바디 경로로 돌아간다
  'objUrl': './assets/body_makehuman.obj',
  'mtlUrl': null,                              // 색은 아래 skinHex로 준다(MTL은 참고용)
  'neckCutFrac': 0.9472,                       // 파일 안에서 목 절단선의 높이 비율
  'neckBandUnits': 0.25,                       // 목 중심(x·z)을 잴 띠 두께 — 절단선 위쪽
                                               // (0.3을 넘기면 턱이 딸려 들어와 몸이 뒤로 밀린다)
  'skinHex': '#C2A489',
  'clothOffset': 0.004,                        // z-파이팅만 막는 값(1단위=10cm).
                                               // 실제 여유는 반입 때 tools/conform.py가 이미 넣었다.
  'underOffset': 0.002,                        // 속/아래 겹(바지 등)
  'rack': true                                 // 3D 화면에 옷장 버튼을 띄운다
};

/* --------------------------------------------------------------- 옷장 */
/* parts: 아래에서 위 순서. under:true면 덜 띄운다(위에 겹쳐 입는 것). */
const BODY_GARMENTS = [
  { 'id': 'bg-suit', 'name': '슈트', 'colorHex': '#2A262A',
    'parts': [{ 'url': './assets/fitted/suit3.fitted.obj' }] },
  { 'id': 'bg-dinner', 'name': '재킷', 'colorHex': '#3A3A42',
    'parts': [{ 'url': './assets/fitted/suit_dinner_jacket.fitted.obj' }] },
  { 'id': 'bg-slim', 'name': '슬림 슈트', 'colorHex': '#4A3F46',
    'parts': [{ 'url': './assets/fitted/fem_suit2.fitted.obj' }] },
  { 'id': 'bg-tunic', 'name': '튜닉 + 청바지', 'colorHex': '#8C7A55',
    'parts': [{ 'url': './assets/fitted/mens_elv_jeans2slf.fitted.obj', 'under': true, 'colorHex': '#3E4E6B' },
              { 'url': './assets/fitted/mycenaean_tunic.fitted.obj' }] },
  { 'id': 'bg-jeans', 'name': '청바지', 'colorHex': '#3E4E6B',
    'parts': [{ 'url': './assets/fitted/mens_elv_jeans2slf.fitted.obj' }] },
  { 'id': 'bg-none', 'name': '맨몸', 'colorHex': null, 'parts': [] }
];

/* 추천 엔진(20-outfit-match.js)이 고른 OUTFIT_CATALOG 항목 → 옷장 칸.
   색은 추천 항목의 colorHex를 그대로 입힌다(에셋이 무지라 색이 곧 옷이다). */
const OUTFIT_TO_GARMENT = {
  'ot-charcoal-suit': 'bg-suit',
  'ot-slate-casual': 'bg-tunic',
  'ot-olive-longsleeve': 'bg-dinner',
  'ot-burgundy-shirt': 'bg-slim'
};

/* ------------------------------------------------------------ 불러오기 */
let _bodyBaseCache = null;        // {geoms:[BufferGeometry], box, cutY, neckCx, neckCz}
const _garmentCache = new Map();  // url|offset → [BufferGeometry]
let _bodyRig = null;              // 지금 씬에 서 있는 리그
let _bodyWornId = null;

function _loadOBJGroup(objUrl, mtlUrl) {
  return new Promise((resolve, reject) => {
    if (typeof THREE === 'undefined' || typeof THREE.OBJLoader !== 'function') {
      reject(new Error('OBJLoader가 없습니다')); return;
    }
    const go = (materials) => {
      const loader = new THREE.OBJLoader();
      if (materials) loader.setMaterials(materials);
      loader.load(encodeURI(objUrl), resolve, undefined, reject);
    };
    if (mtlUrl && typeof THREE.MTLLoader === 'function') {
      new THREE.MTLLoader().load(encodeURI(mtlUrl), m => { m.preload(); go(m); }, undefined, () => go(null));
    } else go(null);
  });
}

/* 위치가 같은 정점끼리 법선을 모아 부드럽게 만들고, 원하면 그만큼 부풀린다.
   — MakeClothes 에셋에는 법선이 없어서 그냥 쓰면 각져 보이고,
     몸이 옷을 뚫고 나오는 자리(무릎·가슴)는 이 부풀리기로 덮는다. */
function smoothInflateGeometry(geom, inflate) {
  const pos = geom.attributes && geom.attributes.position;
  if (!pos) return geom;
  const n = pos.count, acc = new Map();
  const key = i => (Math.round(pos.getX(i) * 1e4) / 1e4) + ',' +
                   (Math.round(pos.getY(i) * 1e4) / 1e4) + ',' +
                   (Math.round(pos.getZ(i) * 1e4) / 1e4);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(),
        ab = new THREE.Vector3(), ac = new THREE.Vector3(), fn = new THREE.Vector3();
  for (let t = 0; t + 2 < n; t += 3) {
    a.fromBufferAttribute(pos, t); b.fromBufferAttribute(pos, t + 1); c.fromBufferAttribute(pos, t + 2);
    fn.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    for (let k = 0; k < 3; k++) {
      const kk = key(t + k), v = acc.get(kk);
      if (v) { v[0] += fn.x; v[1] += fn.y; v[2] += fn.z; }
      else acc.set(kk, [fn.x, fn.y, fn.z]);
    }
  }
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = acc.get(key(i)) || [0, 1, 0];
    const L = Math.hypot(v[0], v[1], v[2]) || 1;
    const nx = v[0] / L, ny = v[1] / L, nz = v[2] / L;
    out[i * 3] = nx; out[i * 3 + 1] = ny; out[i * 3 + 2] = nz;
    if (inflate) pos.setXYZ(i, pos.getX(i) + nx * inflate, pos.getY(i) + ny * inflate, pos.getZ(i) + nz * inflate);
  }
  geom.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  pos.needsUpdate = true;
  geom.computeBoundingBox(); geom.computeBoundingSphere();
  return geom;
}

function _collectGeometries(group) {
  const geoms = [];
  group.traverse(o => { if (o.isMesh && o.geometry) geoms.push(o.geometry); });
  return geoms;
}

/* 몸을 한 번만 읽어 두고(파일 좌표 그대로) 절단선·목 중심을 잰다. */
async function loadBodyBaseMesh() {
  if (_bodyBaseCache) return _bodyBaseCache;
  const group = await _loadOBJGroup(BODY_BASE.objUrl, BODY_BASE.mtlUrl);
  const geoms = _collectGeometries(group);
  if (!geoms.length) throw new Error('몸 메쉬가 비어 있습니다');
  geoms.forEach(g => { if (!g.attributes.normal) smoothInflateGeometry(g, 0); });

  const box = new THREE.Box3().setFromObject(group);
  const cutY = box.min.y + BODY_BASE.neckCutFrac * (box.max.y - box.min.y);
  /* 목 중심 — 절단선 바로 위(순수한 목 구간)의 x·z 평균.
     이 점이 씬의 (0,0)에 와야 앱이 그리는 머리·목과 몸이 한 줄로 선다. */
  let sx = 0, sz = 0, cnt = 0;
  for (const g of geoms) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      if (y < cutY || y > cutY + BODY_BASE.neckBandUnits) continue;
      sx += p.getX(i); sz += p.getZ(i); cnt++;
    }
  }
  _bodyBaseCache = {
    'geoms': geoms, 'box': box, 'cutY': cutY,
    'neckCx': cnt ? sx / cnt : 0, 'neckCz': cnt ? sz / cnt : 0
  };
  console.log('[3D·몸] MakeHuman 표준 인체 로드 — 파일 높이 ' +
    (box.max.y - box.min.y).toFixed(2) + '단위 · 목 절단선 ' + cutY.toFixed(2) +
    ' · 목 중심 z ' + _bodyBaseCache.neckCz.toFixed(2));
  return _bodyBaseCache;
}

async function loadGarmentGeometries(part) {
  const offset = part.under ? BODY_BASE.underOffset : BODY_BASE.clothOffset;
  const key = part.url + '|' + offset;
  if (_garmentCache.has(key)) return _garmentCache.get(key);
  const group = await _loadOBJGroup(part.url, part.mtlUrl || null);
  const geoms = _collectGeometries(group);
  geoms.forEach(g => smoothInflateGeometry(g, offset));
  _garmentCache.set(key, geoms);
  return geoms;
}

/* ------------------------------------------------------------ 리그 조립 */
function _skinMaterial(clipPlane) {
  const m = new THREE.MeshStandardMaterial({
    'color': new THREE.Color(BODY_BASE.skinHex), 'roughness': 0.88, 'metalness': 0
  });
  if (clipPlane) { m.clippingPlanes = [clipPlane]; m.clipShadows = true; }
  return m;
}

function _clothMaterial(colorHex, clipPlane) {
  const m = new THREE.MeshStandardMaterial({
    'color': new THREE.Color(colorHex || '#7A7F88'), 'roughness': 0.82, 'metalness': 0,
    'side': THREE.DoubleSide
  });
  if (clipPlane) { m.clippingPlanes = [clipPlane]; m.clipShadows = true; }
  return m;
}

function getBodyGarment(id) {
  return BODY_GARMENTS.find(g => g.id === id) || null;
}

function garmentIdForOutfit(item) {
  if (!item) return BODY_GARMENTS[0].id;
  return OUTFIT_TO_GARMENT[item.id] || BODY_GARMENTS[0].id;
}

/* 옷 한 벌을 리그 안에 넣는다(기존 옷은 버린다). */
async function _mountGarment(rig, def, colorHex) {
  const clip = rig.userData.clipPlane;
  const old = rig.getObjectByName('bodyGarment');
  if (old) {
    rig.remove(old);
    if (typeof disposeObject3D === 'function') disposeObject3D(old);
  }
  const holder = new THREE.Group();
  holder.name = 'bodyGarment';
  rig.add(holder);
  if (!def || !def.parts || !def.parts.length) { _bodyWornId = def ? def.id : null; return holder; }
  for (const part of def.parts) {
    let geoms;
    try { geoms = await loadGarmentGeometries(part); }
    catch (e) { console.warn('[3D·옷] 불러오기 실패 — 건너뜁니다: ' + part.url, e); continue; }
    const mat = _clothMaterial(part.colorHex || colorHex || def.colorHex, clip);
    geoms.forEach(g => holder.add(new THREE.Mesh(g, mat)));
  }
  _bodyWornId = def.id;
  return holder;
}

/* 몸 + 옷을 앱 좌표에 세운 그룹을 돌려준다.
   loadOutfitMeshMeasured와 자리가 같아서 18-perf-i18n-boot.js는 이걸 그대로 add하면 된다. */
async function buildBodyBaseRig(outfitItem, widthFactor, bodyLenMesh) {
  const base = await loadBodyBaseMesh();
  const neckY = typeof getNeckBottomY === 'function' ? getNeckBottomY() : -1.15;
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), neckY);

  const rig = new THREE.Group();
  rig.name = 'bodyBaseRig';
  rig.userData.clipPlane = clip;

  const skin = _skinMaterial(clip);
  const bodyHolder = new THREE.Group();
  bodyHolder.name = 'bodyBaseSkin';
  base.geoms.forEach(g => bodyHolder.add(new THREE.Mesh(g, skin)));
  rig.add(bodyHolder);

  /* 두신 배율 — 발바닥~목 절단선이 personBodyLenMesh()가 되도록 */
  const bodyLenFile = base.cutY - base.box.min.y;
  let target = bodyLenMesh;
  if (!(isFinite(target) && target > 0.5)) target = typeof personBodyLenMesh === 'function' ? personBodyLenMesh() : null;
  if (!(isFinite(target) && target > 0.5)) {
    target = 4;
    console.warn('[3D·비율] 두상 자가 없어 폴백 4.0단위로 세웁니다 — 이 경우에만 두신이 상수에서 벗어납니다.');
  }
  const wf = isFinite(widthFactor) && widthFactor > 0 ? widthFactor : 1;
  const widthMode = (typeof OUTFIT_MESH_SOURCE !== 'undefined' &&
    (OUTFIT_MESH_SOURCE.widthMode || (OUTFIT_MESH_SOURCE.widthUniform ? 'uniform' : 'off'))) || 'off';
  const s = target / (bodyLenFile || 1) * (widthMode === 'uniform' ? wf : 1);
  const sx = widthMode === 'xz' ? wf : 1;

  rig.scale.set(s * sx, s, s * sx);
  rig.position.set(-base.neckCx * s * sx, neckY - base.cutY * s, -base.neckCz * s * sx);

  const def = getBodyGarment(garmentIdForOutfit(outfitItem));
  await _mountGarment(rig, def, outfitItem && outfitItem.colorHex);

  rig.updateMatrixWorld(true);
  _bodyRig = rig;
  console.log('[3D·몸] 표준 인체 ×' + s.toFixed(3) + ' · 발바닥 y ' +
    (neckY - (base.cutY - base.box.min.y) * s).toFixed(2) + ' · 목 절단 y ' + neckY.toFixed(2) +
    ' · 옷 ' + (def ? def.name : '없음'));
  return rig;
}

/* 18-perf-i18n-boot.js가 부르는 자리 — 실패하면 예전 의상-바디 경로로 돌아간다. */
async function buildBody3DForOutfit(outfitItem, widthFactor, bodyLenMesh) {
  if (BODY_BASE.on) try {
    const rig = await buildBodyBaseRig(outfitItem, widthFactor, bodyLenMesh);
    try {
      const open = typeof measureGarmentNeckOpening === 'function' ? measureGarmentNeckOpening(rig) : null;
      if (open) { _garmentNeckOpening = open; }
      else console.log('[3D·목] 몸의 목둘레가 옷깃 실측 범위 밖 — 예전(두개골 클램프) 경로로 세웁니다');
    } catch (e) { console.warn('[3D·목] 목둘레 실측 예외:', e); }
    try { buildBodyGarmentRack(); } catch (e) { console.warn('[3D·옷] 옷장 UI 실패:', e); }
    return rig;
  } catch (e) {
    console.warn('[3D·몸] 표준 인체 실패 — 예전 의상-바디 에셋으로 폴백:', e);
  }
  return loadOutfitMeshMeasured(outfitItem, widthFactor, bodyLenMesh);
}

/* ------------------------------------------------------------ 갈아입기 */
async function wearBodyGarment(id) {
  if (!_bodyRig) { if (typeof showToast === 'function') showToast('3D 화면에서 먼저 몸을 세워주세요'); return false; }
  const def = getBodyGarment(id);
  if (!def) return false;
  const rec = (typeof state !== 'undefined' && state.aiOutfitRecommendation && state.aiOutfitRecommendation.item) || null;
  const tint = rec && garmentIdForOutfit(rec) === id ? rec.colorHex : null;
  await _mountGarment(_bodyRig, def, tint);
  buildBodyGarmentRack();
  const tag = document.getElementById('model3dTag');
  if (tag && def) tag.textContent = tag.textContent.replace(/ · 옷:.*$/, '') + ' · 옷: ' + def.name;
  return true;
}

function buildBodyGarmentRack() {
  if (!BODY_BASE.rack) return;
  const host = document.getElementById('model3dViewport');
  if (!host) return;
  let rack = document.getElementById('bodyGarmentRack');
  if (!rack) {
    rack = document.createElement('div');
    rack.id = 'bodyGarmentRack';
    rack.className = 'bb-rack';
    host.appendChild(rack);
  }
  rack.innerHTML = '';
  for (const def of BODY_GARMENTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    if (def.id === _bodyWornId) b.classList.add('on');
    if (def.colorHex) b.style.borderLeft = '6px solid ' + def.colorHex;
    b.addEventListener('click', () => wearBodyGarment(def.id));
    rack.appendChild(b);
  }
}

/* 손님이 바뀌면 리그 참조를 놓는다(에셋 캐시는 남긴다 — 다시 읽을 필요가 없다). */
function resetBodyBase() {
  _bodyRig = null; _bodyWornId = null;
  const rack = document.getElementById('bodyGarmentRack');
  if (rack) rack.remove();
}
