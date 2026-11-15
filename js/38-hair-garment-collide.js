/*
 * 38-hair-garment-collide.js
 * 머리카락이 옷(재킷·셔츠 등) 안으로 파고드는 문제 보정.
 *
 * 렌더 직전에 장면을 살펴서
 *   - 옷 메시(bodyGarment / outfitLoadedOBJ) 를 월드 좌표 XY 격자에 래스터화해
 *     칸마다 앞면(maxZ)·뒷면(minZ) 깊이를 기록하고,
 *   - 머리카락(adjustedHair / hairStrands / braided… 등) 정점이 그 두께 안에 들어가 있으면
 *     가까운 겉면 바깥(margin 만큼)으로 밀어낸다.
 * 옷이나 머리 지오메트리가 바뀔 때만 다시 계산하고, 원본 좌표를 보관해 두어
 * 옷을 갈아입어도 누적 변형이 생기지 않는다.
 *
 * 끄기: window.HAIR_GARMENT_COLLIDE.on = false
 */
(function () {
  if (typeof THREE === 'undefined' || !THREE.WebGLRenderer) return;

  const CFG = (window.HAIR_GARMENT_COLLIDE = {
    on: true,
    gridN: 220,        // 옷 높이 방향 격자 칸 수
    marginFrac: 0.006, // 옷 높이 대비 겉면에서 띄울 거리
    fillHoles: 2,      // 빈 칸 메우기 반복 횟수(얇은 틈 사이로 빠지는 것 방지)
    log: false,
    stats: null,
  });

  const HAIR_RE = /hair|strand|braid|curl/i;
  const HAIR_EXCLUDE_RE = /hairpin|debug|mask/i;
  const GARMENT_RE = /^(bodyGarment|outfitLoadedOBJ)$/;

  const _v = new THREE.Vector3();
  const _inv = new THREE.Matrix4();

  function collect(scene) {
    const hair = [], garment = [];
    (function walk(o, inHair, inGarment) {
      if (o.visible === false) return;
      const nm = o.name || '';
      if (HAIR_EXCLUDE_RE.test(nm)) inHair = false;
      else if (HAIR_RE.test(nm)) inHair = true;
      if (GARMENT_RE.test(nm)) inGarment = true;
      const g = o.geometry;
      if (g && g.attributes && g.attributes.position) {
        if (inGarment && o.isMesh) {
          const mn = ((o.material && o.material.name) || '').toLowerCase();
          if (mn !== 'hair') garment.push(o);
        } else if (inHair && !inGarment && (o.isLine || o.isLineSegments || o.isMesh || o.isPoints)) {
          hair.push(o);
        }
      }
      const ch = o.children;
      for (let i = 0; i < ch.length; i++) walk(ch[i], inHair, inGarment);
    })(scene, false, false);
    return { hair, garment };
  }

  function garmentKey(list) {
    let k = '';
    for (const m of list) {
      const e = m.matrixWorld.elements;
      k += m.geometry.uuid + ':' + m.geometry.attributes.position.version + ':' +
        e[12].toFixed(4) + ',' + e[13].toFixed(4) + ',' + e[14].toFixed(4) + ',' + e[0].toFixed(4) + ',' + e[5].toFixed(4) + '|';
    }
    return k;
  }

  // ---- 옷 깊이 격자 만들기 ----
  function buildField(list) {
    // 월드 좌표 정점 배열 + 바운딩 박스
    const meshes = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const m of list) {
      const pos = m.geometry.attributes.position;
      const w = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        w[i * 3] = _v.x; w[i * 3 + 1] = _v.y; w[i * 3 + 2] = _v.z;
        if (_v.x < x0) x0 = _v.x; if (_v.x > x1) x1 = _v.x;
        if (_v.y < y0) y0 = _v.y; if (_v.y > y1) y1 = _v.y;
      }
      meshes.push({ w, index: m.geometry.index, count: pos.count });
    }
    if (!isFinite(x0) || y1 <= y0) return null;
    const H = y1 - y0;
    const cell = H / CFG.gridN;
    const GW = Math.max(1, Math.ceil((x1 - x0) / cell) + 1);
    const GH = CFG.gridN + 1;
    const zMin = new Float32Array(GW * GH).fill(Infinity);
    const zMax = new Float32Array(GW * GH).fill(-Infinity);

    function plot(x, y, z) {
      const cx = Math.round((x - x0) / cell), cy = Math.round((y - y0) / cell);
      if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return;
      const k = cy * GW + cx;
      if (z < zMin[k]) zMin[k] = z;
      if (z > zMax[k]) zMax[k] = z;
    }
    function tri(w, a, b, c) {
      const ax = w[a * 3], ay = w[a * 3 + 1], az = w[a * 3 + 2];
      const bx = w[b * 3], by = w[b * 3 + 1], bz = w[b * 3 + 2];
      const cx = w[c * 3], cy = w[c * 3 + 1], cz = w[c * 3 + 2];
      // 삼각형 크기에 비례해 바리센트릭 샘플링(칸 크기의 절반 간격)
      const L = Math.max(Math.hypot(bx - ax, by - ay), Math.hypot(cx - ax, cy - ay), Math.hypot(cx - bx, cy - by));
      const n = Math.min(64, Math.max(1, Math.ceil(L / (cell * 0.5))));
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n - i; j++) {
          const u = i / n, v = j / n, t = 1 - u - v;
          plot(ax * t + bx * u + cx * v, ay * t + by * u + cy * v, az * t + bz * u + cz * v);
        }
      }
    }
    for (const m of meshes) {
      if (m.index) {
        const ix = m.index.array;
        for (let i = 0; i + 2 < ix.length; i += 3) tri(m.w, ix[i], ix[i + 1], ix[i + 2]);
      } else {
        for (let i = 0; i + 2 < m.count; i += 3) tri(m.w, i, i + 1, i + 2);
      }
    }
    // 빈 칸 메우기(이웃 4칸 중 2칸 이상 차 있으면 이웃 값으로)
    for (let it = 0; it < CFG.fillHoles; it++) {
      const nMin = zMin.slice(), nMax = zMax.slice();
      for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) {
        const k = y * GW + x;
        if (zMin[k] !== Infinity) continue;
        let c = 0, lo = Infinity, hi = -Infinity;
        for (const d of [k - 1, k + 1, k - GW, k + GW]) {
          if (zMin[d] === Infinity) continue;
          c++; if (zMin[d] < lo) lo = zMin[d]; if (zMax[d] > hi) hi = zMax[d];
        }
        if (c >= 2) { nMin[k] = lo; nMax[k] = hi; }
      }
      zMin.set(nMin); zMax.set(nMax);
    }
    return { x0, y0, y1, cell, GW, GH, zMin, zMax, margin: H * CFG.marginFrac };
  }

  // ---- 머리카락 밀어내기 ----
  function pushHair(obj, F) {
    const g = obj.geometry, pos = g.attributes.position;
    const ud = obj.userData;
    // 앱이 새로 쓴 좌표면 원본으로 보관, 우리가 마지막으로 쓴 그대로면 보관본에서 복원
    if (!ud._hgcOrig || ud._hgcVer !== pos.version || ud._hgcOrig.length !== pos.array.length) {
      ud._hgcOrig = new Float32Array(pos.array);
    } else {
      pos.array.set(ud._hgcOrig);
    }
    const arr = pos.array, orig = ud._hgcOrig;
    obj.updateMatrixWorld(true);
    const M = obj.matrixWorld;
    _inv.copy(M).invert();
    let moved = 0;
    const isize = pos.itemSize || 3;
    for (let i = 0; i < pos.count; i++) {
      const o = i * isize;
      _v.set(orig[o], orig[o + 1], orig[o + 2]).applyMatrix4(M);
      if (_v.y < F.y0 || _v.y > F.y1) continue;
      const cx = Math.round((_v.x - F.x0) / F.cell), cy = Math.round((_v.y - F.y0) / F.cell);
      if (cx < 0 || cy < 0 || cx >= F.GW || cy >= F.GH) continue;
      const k = cy * F.GW + cx;
      const lo = F.zMin[k], hi = F.zMax[k];
      if (lo === Infinity) continue;
      const a = lo - F.margin, b = hi + F.margin;
      if (_v.z <= a || _v.z >= b) continue;
      _v.z = (_v.z - a < b - _v.z) ? a : b; // 가까운 겉면 쪽으로
      _v.applyMatrix4(_inv);
      arr[o] = _v.x; arr[o + 1] = _v.y; arr[o + 2] = _v.z;
      moved++;
    }
    pos.needsUpdate = true;
    ud._hgcVer = pos.version;
    if (g.boundingSphere) g.computeBoundingSphere();
    return moved;
  }

  function restoreHair(obj) {
    const ud = obj.userData, pos = obj.geometry.attributes.position;
    if (ud._hgcOrig && ud._hgcVer === pos.version && ud._hgcOrig.length === pos.array.length) {
      pos.array.set(ud._hgcOrig);
      pos.needsUpdate = true;
    }
    ud._hgcOrig = null; ud._hgcVer = -1;
  }

  let field = null, fieldKey = null;

  function update(scene) {
    if (!scene || !scene.isScene) return;
    const { hair, garment } = collect(scene);
    if (!CFG.on || !garment.length) {
      for (const h of hair) if (h.userData._hgcOrig) { restoreHair(h); h.userData._hgcGarment = null; }
      return;
    }
    scene.updateMatrixWorld();
    const gk = garmentKey(garment);
    if (gk !== fieldKey) { field = buildField(garment); fieldKey = gk; }
    if (!field) return;
    let total = 0, done = 0;
    for (const h of hair) {
      const ud = h.userData, pos = h.geometry.attributes.position;
      const hk = gk + '#' + h.matrixWorld.elements.join(',');
      if (ud._hgcVer === pos.version && ud._hgcGarment === hk) continue; // 변경 없음
      total += pushHair(h, field);
      ud._hgcGarment = hk;
      done++;
    }
    if (done) {
      CFG.stats = { hairObjects: done, pushedVerts: total, garments: garment.length };
      if (CFG.log) console.log('[머리-옷 충돌] 밀어낸 정점', total, '/ 머리 오브젝트', done);
    }
  }

  const origRender = THREE.WebGLRenderer.prototype.render;
  THREE.WebGLRenderer.prototype.render = function (scene, camera) {
    try { update(scene); } catch (e) { if (CFG.log) console.warn('[머리-옷 충돌] 실패', e); }
    return origRender.call(this, scene, camera);
  };
})();
