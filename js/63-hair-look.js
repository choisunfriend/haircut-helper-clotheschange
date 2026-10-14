/* 63-hair-look.js — 3D 결과 화면 머리의 실사감(빛) (2026-10-10b)
 *
 * 사용자: "머리에 실사감을 주기 위해서 우리 앱에서 할 수 있는 거 넣어봐" · "가닥 결의 실제 느낌은 우리 앱이 강한데 왜 실사감이 안 날까"
 * 원인(지금 그리는 법): 가닥 = 색만 칠한 선. 음영은 24번이 색에 한 번 구워 둔 것(안쪽 어둡게 + 정면에서 본 결 하이라이트 하나)이라
 *   화면을 돌려도 광택이 따라 움직이지 않고, 광택 띠가 하나뿐이며, 가닥 끝이 뭉툭합니다.
 * 지금: 머리 선을 빛을 계산하는 재질로 바꿉니다(가닥 모양·색·가닥 수는 그대로).
 *   ① 결 방향 광택 두 줄(머리카락 반사 모형) — 결과 직각으로 길게 늘어진 띠. 하얗고 날카로운 띠(뿌리 쪽으로 조금 밀림) + 머리색이 섞인 흐린 띠(끝 쪽으로).
 *      빛은 화면 기준(왼쪽 위 앞) — 머리를 돌리면 광택이 결을 따라 흘러갑니다. 매끈한 머리의 "천사 고리".
 *   ② 결 방향 확산광 — 빛과 결이 직각일수록 밝음(머리카락은 원통이라 면처럼 비치지 않음).
 *   ③ 다발 안쪽 그림자 — 24번이 구운 안쪽 어둡게는 그대로 쓰고, 겉면 가닥에만 광택이 실림(안쪽 가닥은 광택이 약함).
 *   ④ 테두리 빛 — 화면 가장자리(실루엣)의 가닥이 살짝 밝게(역광 느낌).
 *   ⑤ 가닥 끝 — 끝으로 갈수록 살짝 투명하고 밝게(가늘어지는 끝).
 *   ⑥ 24번이 구운 정면 하이라이트는 끔(두 번 겹치지 않게).
 * 끄기: HAIR_LOOK.on = false 후 3D 화면 다시 들어가기 · 바로 비교 HAIR_LOOK.toggle()
 * 세기: HAIR_LOOK.spec1 / spec2 / rim / tipFade  (바꾼 뒤 HAIR_LOOK.refresh())
 * 넣는 자리: index.html에서 62-dialog-lang.js 다음
 */
(function () {
  'use strict';
  var W = window, TAG = '[머리 빛]';
  var HL = W.HAIR_LOOK = Object.assign({
    on: true,
    light: [-0.45, 0.75, 0.55],   // 화면 기준 빛 방향(왼쪽 위 앞)
    // (2026-10-10b) 사용자: "머리가 너무 글리스하다 — 저 정도 광택(생성 사진의 남자 머리)만 있으면 될 것 같아" → 넓고 은은한 광택으로 낮춤
    diffuse: 0.45,                // 결 방향 확산광 세기(나머지는 고른 빛)
    spec1: 0.2, pow1: 36, shift1: 0.12,     // 하얀 띠(예전 0.55 · 90 — 젖은 듯 반짝였음)
    spec2: 0.12, pow2: 12, shift2: -0.10,   // 머리색 띠(예전 0.35 · 22)
    rim: 0.08, rimPow: 3,
    tipFade: 0.3, tipFrom: 0.8,   // 끝 투명(0~1) · 가닥 길이의 이 비율부터
    outerOnly: 0.75,              // 광택을 겉면 가닥에 몰기(0 = 안쪽도 같은 광택)
    pollMs: 400
  }, W.HAIR_LOOK || {});
  var S = HL.stats = { upgraded: 0, last: null, err: null, verts: 0, strands: 0 };
  if (typeof THREE === 'undefined') { console.warn(TAG + ' THREE가 없어 건너뜀'); return; }

  // ⑥ 24번이 색에 굽는 정면 하이라이트 끄기(안쪽 어둡게·밝기 상한은 그대로)
  function muteBaked() {
    try {
      var SB = W.STYLE_BASE; if (!SB) return;
      if (SB.shade && SB.shade.spec > 0 && HL.on) { HL._bakedSpec = SB.shade.spec; SB.shade.spec = 0; }
      if (SB.active && SB.active.shade && SB.active.shade.spec > 0 && HL.on) { SB.active.shade.spec = 0; }
    } catch (e) {}
  }
  muteBaked();

  var VS = [
    'attribute vec3 color;', 'attribute vec3 tng;', 'attribute vec2 hl;',   // hl.x = 뿌리0~끝1 · hl.y = 겉면 정도 0~1
    'uniform vec3 uCenter;',
    'varying vec3 vCol; varying vec3 vT; varying vec3 vN; varying vec3 vV; varying vec2 vHl;',
    'void main(){',
    '  vec4 mv = modelViewMatrix * vec4(position,1.0);',
    '  vT = normalize((modelViewMatrix * vec4(tng,0.0)).xyz);',
    '  vN = normalize((modelViewMatrix * vec4(position - uCenter,0.0)).xyz);',
    '  vV = normalize(-mv.xyz); vCol = color; vHl = hl;',
    '  gl_Position = projectionMatrix * mv;',
    '}'].join('\n');
  var FS = [
    'uniform vec3 uL; uniform float uDiff, uS1, uP1, uSh1, uS2, uP2, uSh2, uRim, uRimP, uTip, uTipFrom, uOuter;',
    'varying vec3 vCol; varying vec3 vT; varying vec3 vN; varying vec3 vV; varying vec2 vHl;',
    'float kk(vec3 T, vec3 H, float p){ float d = dot(T,H); return pow(sqrt(max(0.0,1.0-d*d)), p); }',
    'void main(){',
    '  vec3 T = normalize(vT), N = normalize(vN), V = normalize(vV), L = normalize(uL);',
    '  vec3 H = normalize(L + V);',
    '  float tl = dot(T,L), dif = sqrt(max(0.0,1.0-tl*tl));',
    '  float outer = mix(1.0, vHl.y, uOuter);',
    '  vec3 T1 = normalize(T + N*uSh1), T2 = normalize(T + N*uSh2);',
    '  float face = clamp(dot(N,L)*0.5+0.5, 0.0, 1.0);',
    '  float s1 = kk(T1,H,uP1) * uS1 * outer * face;',
    '  float s2 = kk(T2,H,uP2) * uS2 * outer * face;',
    '  float rim = pow(1.0 - clamp(abs(dot(N,V)),0.0,1.0), uRimP) * uRim * outer;',
    '  vec3 base = vCol * ((1.0-uDiff) + uDiff * dif * (0.55 + 0.45*face));',
    '  vec3 c = base + vec3(s1) * vec3(1.0,0.97,0.92) + s2 * (vCol*1.6 + vec3(0.06,0.04,0.02)) + rim * (vCol + vec3(0.25,0.22,0.2));',
    '  float tip = smoothstep(uTipFrom, 1.0, vHl.x);',
    '  c = mix(c, c*1.15 + vec3(0.02), tip*0.5);',
    '  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0 - tip*uTip);',
    '}'].join('\n');

  function uniforms() {
    var c = { x: 0, y: typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15, z: 0 };
    return {
      uCenter: { value: new THREE.Vector3(c.x, c.y, c.z) }, uL: { value: new THREE.Vector3(HL.light[0], HL.light[1], HL.light[2]) },
      uDiff: { value: HL.diffuse }, uS1: { value: HL.spec1 }, uP1: { value: HL.pow1 }, uSh1: { value: HL.shift1 },
      uS2: { value: HL.spec2 }, uP2: { value: HL.pow2 }, uSh2: { value: HL.shift2 }, uRim: { value: HL.rim }, uRimP: { value: HL.rimPow },
      uTip: { value: HL.tipFade }, uTipFrom: { value: HL.tipFrom }, uOuter: { value: HL.outerOnly }
    };
  }
  // 가닥 결·뿌리→끝 자리·겉면 정도 — 선분 쌍(LineSegments)에서: 앞 선분의 끝 = 이 선분의 시작이면 같은 가닥
  function addAttrs(g) {
    var P = g.attributes.position, n = P.count, a = P.array, T = new Float32Array(n * 3), HLa = new Float32Array(n * 2), i, j;
    var cy = typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15, E = null;
    try { E = getHeadEllipsoid(); } catch (e) { E = { a: 0.4, b: 0.6, c: 0.5 }; }
    // 가닥 묶기
    var starts = [0], s;
    for (s = 2; s + 1 < n; s += 2) {
      var px = a[(s - 1) * 3], py = a[(s - 1) * 3 + 1], pz = a[(s - 1) * 3 + 2];
      if (Math.abs(px - a[s * 3]) + Math.abs(py - a[s * 3 + 1]) + Math.abs(pz - a[s * 3 + 2]) > 1e-6) starts.push(s);
    }
    starts.push(n);
    // 겉면 정도: 방향 칸마다 가장 바깥 반지름 대비(24번과 같은 생각)
    var NT = 36, NP = 18, rho = new Float32Array(n), bin = new Int32Array(n), bmax = new Float32Array(NT * NP);
    for (i = 0; i < n; i++) {
      var dx = a[i * 3] / E.a, dy = (a[i * 3 + 1] - cy) / E.b, dz = a[i * 3 + 2] / E.c, r = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      var th = Math.atan2(dx, dz), ph = Math.acos(Math.max(-1, Math.min(1, dy / r)));
      var bi = Math.min(NP - 1, (ph / Math.PI * NP) | 0) * NT + Math.min(NT - 1, ((th + Math.PI) / (2 * Math.PI) * NT) | 0);
      rho[i] = r; bin[i] = bi; if (r > bmax[bi]) bmax[bi] = r;
    }
    for (j = 0; j + 1 < starts.length; j++) {
      var b0 = starts[j], b1 = starts[j + 1], L = 0, acc = 0, k;
      for (k = b0; k + 1 < b1; k += 2) L += Math.hypot(a[(k + 1) * 3] - a[k * 3], a[(k + 1) * 3 + 1] - a[k * 3 + 1], a[(k + 1) * 3 + 2] - a[k * 3 + 2]);
      L = L || 1e-9;
      for (k = b0; k + 1 < b1; k += 2) {
        var tx = a[(k + 1) * 3] - a[k * 3], ty = a[(k + 1) * 3 + 1] - a[k * 3 + 1], tz = a[(k + 1) * 3 + 2] - a[k * 3 + 2], tl = Math.hypot(tx, ty, tz) || 1e-9;
        T[k * 3] = T[(k + 1) * 3] = tx / tl; T[k * 3 + 1] = T[(k + 1) * 3 + 1] = ty / tl; T[k * 3 + 2] = T[(k + 1) * 3 + 2] = tz / tl;
        HLa[k * 2] = acc / L; acc += tl; HLa[(k + 1) * 2] = acc / L;
      }
    }
    for (i = 0; i < n; i++) { var bm = bmax[bin[i]]; HLa[i * 2 + 1] = bm > 1.02 ? Math.max(0, Math.min(1, (rho[i] - 1) / (bm - 1))) : 1; }
    g.setAttribute('tng', new THREE.BufferAttribute(T, 3));
    g.setAttribute('hl', new THREE.BufferAttribute(HLa, 2));
    S.verts = n; S.strands = starts.length - 1;
  }
  function upgrade(obj) {
    if (!obj || !obj.geometry || !obj.geometry.attributes.position || !obj.geometry.attributes.color) return false;
    try {
      addAttrs(obj.geometry);
      obj.userData._hlOld = obj.material;
      obj.material = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: uniforms(), transparent: HL.tipFade > 0, depthWrite: true });
      obj.material.userData = { hairLook: true };
      obj.userData._hlGeo = obj.geometry.uuid + ':' + obj.geometry.attributes.color.version;
      S.upgraded++; S.last = new Date().toTimeString().slice(0, 8);
      if (S.upgraded === 1) console.log(TAG + ' 3D 머리에 빛 계산 재질을 입힘 — 가닥 ' + S.strands + '개 · 결 광택 두 줄·결 확산광·테두리 빛·끝 투명 · 비교 HAIR_LOOK.toggle()');
      return true;
    } catch (e) { S.err = String(e && e.message || e); console.warn(TAG + ' 재질 바꾸기 실패', e); return false; }
  }
  function revert(obj) { if (obj && obj.userData._hlOld) { obj.material = obj.userData._hlOld; obj.userData._hlOld = null; obj.userData._hlGeo = null; } }
  function hairObj() { try { return (typeof model3D !== 'undefined' && model3D && model3D.headGroup) ? model3D.headGroup.getObjectByName('adjustedHair') : null; } catch (e) { return null; } }
  function tick() {
    var o = hairObj(); if (!o) return;
    var mine = o.material && o.material.userData && o.material.userData.hairLook;
    if (HL.on) {
      muteBaked();
      var sig = o.geometry && o.geometry.attributes.color ? o.geometry.uuid + ':' + o.geometry.attributes.color.version : '';
      if (!mine || o.userData._hlGeo !== sig) { if (mine) revert(o); upgrade(o); }
    } else if (mine) revert(o);
  }
  setInterval(tick, HL.pollMs);
  HL.refresh = function () { var o = hairObj(); if (o && o.material && o.material.userData && o.material.userData.hairLook) { revert(o); } tick(); };
  HL.toggle = function (v) { HL.on = typeof v === 'boolean' ? v : !HL.on; if (!HL.on) { try { var SB = W.STYLE_BASE; if (SB && SB.shade && HL._bakedSpec) SB.shade.spec = HL._bakedSpec; } catch (e) {} } tick(); return HL.on; };
  HL.lines = function () { return [TAG + ' ' + (HL.on ? '켜짐' : '꺼짐') + ' · 입힌 횟수 ' + S.upgraded + (S.last ? '(' + S.last + ')' : '') + ' · 가닥 ' + S.strands + ' · 하얀 띠 ' + HL.spec1 + ' · 머리색 띠 ' + HL.spec2 + ' · 테두리 ' + HL.rim + ' · 끝 투명 ' + HL.tipFade + (S.err ? ' · ⚠ ' + S.err : '')]; };
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () { var L = ppl.apply(this, arguments) || []; try { HL.lines().forEach(function (x) { L.push(x); }); } catch (e) {} return L; };
  console.log(TAG + ' 설치 — 3D 결과 화면 머리에 결 방향 광택·확산광·테두리 빛·끝 투명을 입힙니다(모양은 그대로). 비교 HAIR_LOOK.toggle() · 끄기 HAIR_LOOK.on=false');
})();
