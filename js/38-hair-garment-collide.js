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
    fillHoles: 2,
    restFrac: 0.01,     // 어깨 윗면에서 이보다 얕게 든 점은 위에 얹음(옷 높이 대비)
    sweepK: 4,          // 닿은 자리 위로 휘는 길이 = 밀린 거리 × 이 값
    sweepMaxFrac: 0.12, // 휘는 길이 상한(옷 높이 대비 · 넘어가면 이상한 가닥)
    sweepIter: 40,      // 펴기 반복 횟수(많을수록 매끈한 곡선)
    rootKeepPts: 3,     // 가닥 뿌리 쪽 이 점 수는 안 건드림
    minJumpFrac: 0.008, // 이보다 크게 옮겨진 첫 점부터 다듬기      // 빈 칸 메우기 반복 횟수(얇은 틈 사이로 빠지는 것 방지)
    log: false,
    stats: null,
  });

  const HAIR_RE = /hair|strand|braid|curl/i;
  const HAIR_EXCLUDE_RE = /hairpin|debug|mask/i;
  const GARMENT_RE = /^(bodyGarment|outfitLoadedOBJ)$/;
  const SKIN_RE = /^bodyBaseSkin$/;   // 맨살(반팔·원피스 목선 아래)도 막음 — 목 밑동 아래만

  const _v = new THREE.Vector3();
  const _inv = new THREE.Matrix4();

  function collect(scene) {
    const hair = [], garment = [];
    (function walk(o, inHair, inGarment, inSkin) {
      if (o.visible === false) return;
      const nm = o.name || '';
      if (HAIR_EXCLUDE_RE.test(nm)) inHair = false;
      else if (HAIR_RE.test(nm)) inHair = true;
      if (GARMENT_RE.test(nm)) inGarment = true;
      if (SKIN_RE.test(nm)) inSkin = true;
      const g = o.geometry;
      if (g && g.attributes && g.attributes.position) {
        if (inSkin && o.isMesh && !inGarment) {
          o.userData._hgcSkin = true; garment.push(o);
        } else if (inGarment && o.isMesh) {
          const mn = ((o.material && o.material.name) || '').toLowerCase();
          if (mn !== 'hair') garment.push(o);
        } else if (inHair && !inGarment && !inSkin && (o.isLine || o.isLineSegments || o.isMesh || o.isPoints)) {
          hair.push(o);
        }
      }
      const ch = o.children;
      for (let i = 0; i < ch.length; i++) walk(ch[i], inHair, inGarment, inSkin);
    })(scene, false, false, false);
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
  function neckCutY() {
    try { const y = getNeckBottomY(); return isFinite(y) ? y : null; } catch (e) { return null; }
  }
  function buildField(list) {
    const neckY = neckCutY();
    // 월드 좌표 정점 배열 + 바운딩 박스
    const meshes = [];
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const m of list) {
      const pos = m.geometry.attributes.position;
      const w = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        _v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        w[i * 3] = _v.x; w[i * 3 + 1] = _v.y; w[i * 3 + 2] = _v.z;
        if (m.userData._hgcSkin && (neckY == null || _v.y > neckY)) continue;
        if (_v.x < x0) x0 = _v.x; if (_v.x > x1) x1 = _v.x;
        if (_v.y < y0) y0 = _v.y; if (_v.y > y1) y1 = _v.y;
      }
      meshes.push({ w, index: m.geometry.index, count: pos.count, skin: !!m.userData._hgcSkin });
    }
    if (!isFinite(x0) || y1 <= y0) return null;
    const H = y1 - y0;
    const cell = H / CFG.gridN;
    const GW = Math.max(1, Math.ceil((x1 - x0) / cell) + 1);
    const GH = CFG.gridN + 1;
    const zMin = new Float32Array(GW * GH).fill(Infinity);
    const zMax = new Float32Array(GW * GH).fill(-Infinity);

    let zMinAll = Infinity, zMaxAll = -Infinity;
    function plot(x, y, z) {
      const cx = Math.round((x - x0) / cell), cy = Math.round((y - y0) / cell);
      if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) return;
      const k = cy * GW + cx;
      if (z < zMinAll) zMinAll = z; if (z > zMaxAll) zMaxAll = z;
      if (z < zMin[k]) zMin[k] = z;
      if (z > zMax[k]) zMax[k] = z;
    }
    let skinCap = Infinity;
    function tri(w, a, b, c) {
      if (Math.max(w[a * 3 + 1], w[b * 3 + 1], w[c * 3 + 1]) > skinCap) return;
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
      if (m.skin && neckY == null) continue;           // 목 높이를 모르면 맨살은 안 씀(머리 뿌리를 밀면 안 되니까)
      skinCap = m.skin ? neckY - H * 0.01 : Infinity;
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
    // 위에서 내려다본 윗면 높이(x·z 격자) — 어깨 위에 살짝 걸친 점은 위에 얹기 위함
    const z0 = zMinAll, GD = Math.max(1, Math.ceil((zMaxAll - zMinAll) / cell) + 1);
    const topY = new Float32Array(GW * GD).fill(-Infinity);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const k = y * GW + x; if (zMin[k] === Infinity) continue;
      const yy = y0 + y * cell;
      const a0 = Math.max(0, Math.round((zMin[k] - z0) / cell)), a1 = Math.min(GD - 1, Math.round((zMax[k] - z0) / cell));
      for (let z = a0; z <= a1; z++) { const t = z * GW + x; if (topY[t] < yy) topY[t] = yy; }
    }
    return { x0, y0, y1, z0, GD, topY, cell, GW, GH, zMin, zMax, H, margin: H * CFG.marginFrac };
  }

  // ---- 머리카락 밀어내기 ----
  /* 가닥 단위로 처리 —
     ① 한 가닥이 몸 안에 처음 들어갈 때 그 직전 점이 몸 가운데보다 앞이었으면 앞면, 아니면 등면으로 정하고 그 가닥은 끝까지 같은 쪽
        (점마다 따로 정하면 한 가닥이 앞뒤를 오가며 몸을 가로질러 가로줄·선반 모양이 생김)
     ② 어깨 윗면에 얕게 걸친 점은 앞/뒤로 보내지 않고 윗면 위에 얹음
     ③ 처음 크게 옮겨진 점부터 가닥을 거슬러 sweepFrac 길이만큼 z를 부드럽게 이어 꺾임을 없앰 */
  function cellOf(F, x, y) {
    if (y < F.y0 || y > F.y1) return -1;
    const cx = Math.round((x - F.x0) / F.cell), cy = Math.round((y - F.y0) / F.cell);
    if (cx < 0 || cy < 0 || cx >= F.GW || cy >= F.GH) return -1;
    const k = cy * F.GW + cx;
    return F.zMin[k] === Infinity ? -1 : k;
  }
  function topAt(F, x, z) {
    const cx = Math.round((x - F.x0) / F.cell), cz = Math.round((z - F.z0) / F.cell);
    if (cx < 0 || cz < 0 || cx >= F.GW || cz >= F.GD) return -Infinity;
    return F.topY[cz * F.GW + cx];
  }
  function buildStrands(obj, Wp, n) {
    const strands = [], alias = new Int32Array(n).fill(-1), eps2 = 1e-10;
    if (obj.isLineSegments) {
      let cur = null;
      for (let a = 0; a + 1 < n; a += 2) {
        const b = a + 1;
        if (cur) {
          const p = a - 1, dx = Wp[a * 3] - Wp[p * 3], dy = Wp[a * 3 + 1] - Wp[p * 3 + 1], dz = Wp[a * 3 + 2] - Wp[p * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < eps2) { alias[a] = p; cur.push(b); continue; }
        }
        cur = [a, b]; strands.push(cur);
      }
    } else if (obj.isLine) {
      const all = new Array(n); for (let i = 0; i < n; i++) all[i] = i; strands.push(all);
    } else {
      for (let i = 0; i < n; i++) strands.push([i]);
    }
    return { strands, alias };
  }
  function pushHair(obj, F) {
    const g = obj.geometry, pos = g.attributes.position;
    const ud = obj.userData;
    if (!ud._hgcOrig || ud._hgcVer !== pos.version || ud._hgcOrig.length !== pos.array.length) {
      ud._hgcOrig = new Float32Array(pos.array);
    } else {
      pos.array.set(ud._hgcOrig);
    }
    const arr = pos.array, orig = ud._hgcOrig, isize = pos.itemSize || 3, n = pos.count;
    obj.updateMatrixWorld(true);
    const M = obj.matrixWorld;
    _inv.copy(M).invert();
    const Wp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      _v.set(orig[i * isize], orig[i * isize + 1], orig[i * isize + 2]).applyMatrix4(M);
      Wp[i * 3] = _v.x; Wp[i * 3 + 1] = _v.y; Wp[i * 3 + 2] = _v.z;
    }
    const { strands, alias } = buildStrands(obj, Wp, n);
    const m = F.margin, restMax = F.H * CFG.restFrac, minJump = F.H * CFG.minJumpFrac;
    const NZ = new Float32Array(Wp), changed = new Uint8Array(n);
    let moved = 0, nStr = 0, nFront = 0, nBack = 0, nRest = 0, nSmooth = 0;
    for (const st of strands) {
      let side = 0, k0 = -1;
      for (let j = 0; j < st.length; j++) {
        const v = st[j], x = Wp[v * 3], y = Wp[v * 3 + 1], z = Wp[v * 3 + 2];
        const k = cellOf(F, x, y); if (k < 0) continue;
        const lo = F.zMin[k], hi = F.zMax[k];
        if (z <= lo - m || z >= hi + m) continue;
        if (!side) {
          const pv = j > 0 ? st[j - 1] : v;
          side = Wp[pv * 3 + 2] >= (lo + hi) / 2 ? 1 : -1;
          if (side > 0) nFront++; else nBack++;
          nStr++;
        }
        const tz = side > 0 ? hi + m : lo - m, dZ = Math.abs(tz - z);
        const top = topAt(F, x, z), dUp = top + m - y;
        if (dUp >= 0 && dUp < restMax && dUp < dZ) { NZ[v * 3 + 1] = top + m; changed[v] = 1; nRest++; moved++; continue; }
        NZ[v * 3 + 2] = tz; changed[v] = 1; moved++;
        if (k0 < 0 && dZ > minJump) k0 = j;
      }
      /* ③ 닿은 자리 위를 곡선으로 — 먼저 몸 겉면에 붙인 다음(위 ①②), 닿은 점은 고정하고 그 위쪽 점들을
         이웃 평균으로 여러 번 고르게 폄(라플라스 다듬기). 휘는 길이는 정해 둔 cm가 아니라 "얼마나 밀렸나(dZ)"에 비례:
         조금 밀린 가닥은 짧게, 많이 밀린 가닥은 길게 휨(sweepK × dZ · 뿌리 쪽 rootKeepPts 점은 안 건드림). */
      if (k0 > 0 && CFG.sweepK > 0) {
        const v0 = st[k0], dz0 = Math.abs(NZ[v0 * 3 + 2] - Wp[v0 * 3 + 2]);
        const L = Math.min(F.H * CFG.sweepMaxFrac, CFG.sweepK * dz0);
        let acc = 0, j1 = k0;
        const jMin = Math.max(1, CFG.rootKeepPts);   // 뿌리 몇 점은 고정(두피에 붙은 자리)
        for (let j = k0 - 1; j >= jMin; j--) {
          const a = st[j], b = st[j + 1];
          acc += Math.hypot(Wp[a * 3] - Wp[b * 3], Wp[a * 3 + 1] - Wp[b * 3 + 1], Wp[a * 3 + 2] - Wp[b * 3 + 2]);
          if (acc > L) break;
          j1 = j;
        }
        if (j1 < k0) {
          // j1-1(고정 · 원래 자리) ~ k0(고정 · 겉면) 사이를 펴기. 몸 안으로 다시 들어가면 겉면으로 되돌림
          const lo = j1, hi = k0 - 1, it = CFG.sweepIter;
          for (let r = 0; r < it; r++) {
            for (let j = lo; j <= hi; j++) {
              const a = st[j], pa = st[j - 1], na = st[j + 1];
              let z = (NZ[pa * 3 + 2] + NZ[na * 3 + 2]) * 0.5;
              const k = cellOf(F, NZ[a * 3], NZ[a * 3 + 1]);
              if (k >= 0) { const lo2 = F.zMin[k] - m, hi2 = F.zMax[k] + m; if (z > lo2 && z < hi2) z = side > 0 ? hi2 : lo2; }
              NZ[a * 3 + 2] = z; changed[a] = 1;
            }
          }
          nSmooth++;
        }
      }
    }
    for (let v = 0; v < n; v++) {
      const p = alias[v]; if (p < 0 || !changed[p]) continue;
      NZ[v * 3] = NZ[p * 3]; NZ[v * 3 + 1] = NZ[p * 3 + 1]; NZ[v * 3 + 2] = NZ[p * 3 + 2]; changed[v] = 1;
    }
    for (let v = 0; v < n; v++) {
      if (!changed[v]) continue;
      _v.set(NZ[v * 3], NZ[v * 3 + 1], NZ[v * 3 + 2]).applyMatrix4(_inv);
      const o = v * isize; arr[o] = _v.x; arr[o + 1] = _v.y; arr[o + 2] = _v.z;
    }
    pos.needsUpdate = true;
    ud._hgcVer = pos.version;
    if (g.boundingSphere) g.computeBoundingSphere();
    CFG._last = { strands: strands.length, touched: nStr, front: nFront, back: nBack, rest: nRest, smooth: nSmooth };
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

  /* three r128 은 render 를 prototype 이 아니라 생성자 안에서 인스턴스마다(this.render = …) 만든다.
     (v20261115a 는 prototype 만 고쳐서 한 번도 안 불렸음 — 그래서 아무 효과가 없었다.)
     → 생성자를 감싸 새로 만드는 렌더러마다 render 를 감싼다. */
  function hookRenderer(r) {
    if (!r || r.__hgcHooked || typeof r.render !== 'function') return r;
    const orig = r.render;
    r.render = function (scene, camera) {
      try { update(scene); } catch (e) { CFG.err = String(e && e.message || e); if (CFG.log) console.warn('[머리-옷 충돌] 실패', e); }
      return orig.apply(this, arguments);
    };
    r.__hgcHooked = true;
    CFG.renderers = (CFG.renderers || 0) + 1;
    return r;
  }
  CFG.hookRenderer = hookRenderer;
  const OrigWGL = THREE.WebGLRenderer;
  function WrappedWGL(params) {
    const r = new OrigWGL(params);
    return hookRenderer(r);
  }
  WrappedWGL.prototype = OrigWGL.prototype;
  try { THREE.WebGLRenderer = WrappedWGL; }
  catch (e) { console.warn('[머리-옷 충돌] THREE.WebGLRenderer 를 감쌀 수 없음', e); }
  if (THREE.WebGLRenderer !== WrappedWGL) {
    // 네임스페이스가 고정돼 있으면 prototype 쪽(신버전 three 대비)
    const pr = OrigWGL.prototype.render;
    if (typeof pr === 'function') OrigWGL.prototype.render = function (scene) {
      try { update(scene); } catch (e) { CFG.err = String(e && e.message || e); }
      return pr.apply(this, arguments);
    };
  }

  CFG.lines = function () {
    const s = CFG.stats;
    return ['[머리-옷 충돌] ' + (CFG.on ? '켜짐' : '꺼짐') + ' · 감싼 렌더러 ' + (CFG.renderers || 0) +
      (s ? ' · 직전: 머리 오브젝트 ' + s.hairObjects + ' · 밀어낸 정점 ' + s.pushedVerts + ' · 옷/몸 메시 ' + s.garments : ' · 아직 적용 안 됨') +
      (CFG._last ? ' · 가닥 ' + CFG._last.strands + ' 중 몸에 닿은 ' + CFG._last.touched + '(앞 ' + CFG._last.front + ' / 등 ' + CFG._last.back + ') · 어깨 위에 얹은 점 ' + CFG._last.rest + ' · 다듬은 가닥 ' + CFG._last.smooth : '') +
      (CFG.err ? ' ⚠ ' + CFG.err : '')];
  };
  console.log('[머리-옷 충돌] 설치(v20261115d) — 옷·몸 안에 든 머리 정점을 겉면 밖으로. 상태 HAIR_GARMENT_COLLIDE.lines() · 끄기 HAIR_GARMENT_COLLIDE.on=false');
})();
