/* 65-view-align.js — 사진 맞춤 (2026-10-11a)
 * 사용자: "3D두상 만들듯이 서로 기준점으로 보정을 해서 맞추고, 정 안맞는 곳은 해당 면의 사진영역으로 결정해야지"
 *        "이건 안면사진처럼 정확해야 하는 게 아닌 '영역'이라서 지금 렌더링이 되고 있는 영역만 정하는 거니까, 해볼만해."
 * 잰 것(진단 파일 2개): 사진 네 장이 머리 위 끝을 서로 1~2cm 다르게 잡고 있음 → 겹치면(교집합) 가장 낮은 쪽으로 깎임.
 * 하는 일: 42번이 머리를 기르기 직전, 점유 프로브의 카메라(정수리 높이 crownY · 가운데 cx · 배율 s/sy)를 정면 기준으로 맞춤.
 *   ① 머리 위 끝 높이 — 카메라가 수평이면 어느 쪽에서 봐도 머리 꼭대기는 같은 높이
 *   ② 같은 높이의 폭 — 정면 폭 = 뒤 폭(뒤 배율), 왼쪽 앞뒤 폭 = 오른쪽 앞뒤 폭(둘의 가운데로)
 *   ③ 가운데 — 정면·뒤의 가운데와 옆 사진들의 앞뒤 가운데가 같은 3D 점(머리 단면의 중심)
 *   머리 위쪽 띠(꼭대기에서 두피 반높이의 10~50%)만 씀 — 늘어진 긴 머리·어깨가 기준을 흔들지 않게.
 *   정면은 얼굴 랜드마크로 맞춘 사진이라 그대로 둠(기준).
 * 되돌리기: VIEW_ALIGN.on=false 후 VIEW_ALIGN.undo() · 상태 VIEW_ALIGN.lines()
 */
(function () {
  var W = window, TAG = '[사진 맞춤]';
  var VA = W.VIEW_ALIGN = Object.assign({ on: false /* (2026-10-11r) 원인 찾기 결과(직모 손님 · ?t=3,6,10,11) — 끔. 다시 켜기 VIEW_ALIGN.on=true */, ref: 'front', band: [0.1, 0.5], nBand: 6, maxShiftCm: 4, kMin: 0.85, kMax: 1.15, iters: 3, minRowPx: 3 }, W.VIEW_ALIGN || {});
  var last = null;
  function cmPerUnit() { try { return (typeof modelCmPerUnit === 'function' && modelCmPerUnit()) || 16.4; } catch (e) { return 16.4; } }
  function rowExt(c, iy) {                                  // 그 줄의 머리 픽셀 가로 범위(양끝 2%를 버림)
    if (iy < 0 || iy >= c.ih) return null;
    var xs = [], x, st = Math.max(1, c.iw / 400);
    for (x = 0; x < c.iw; x += st) if (c.smp.at(x, iy) > 0) xs.push(x);
    if (xs.length < VA.minRowPx) return null;
    var a = xs[Math.floor(xs.length * 0.02)], b = xs[Math.min(xs.length - 1, Math.floor(xs.length * 0.98))];
    return [a, b];
  }
  function topRow(c) {
    var y, st = Math.max(1, c.ih / 600);
    for (y = 0; y < c.ih; y += st) { var e = rowExt(c, y); if (e && e[1] - e[0] > c.iw * 0.04) return y; }
    return null;
  }
  function med(a) { if (!a.length) return NaN; a = a.slice().sort(function (x, y) { return x - y; }); return a[a.length >> 1]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  VA.align = function (photo, probe) {
    if (!VA.on || !probe || !probe.cams || probe._aligned === photo) return last;
    var cams = probe.cams.filter(function (c) { return c && c.smp && c.iw > 0 && c.ih > 0 && c.s > 0 && c.sy > 0 && c.R; });
    var F = cams.filter(function (c) { return c.angle === VA.ref; })[0];
    if (!F || cams.length < 2) return null;
    var yTop = photo.yTop, Es = null; try { Es = getScalpEllipsoid(); } catch (e) {}
    if (!(isFinite(yTop)) || !Es) return null;
    var cm = cmPerUnit(), rep = { at: new Date().toTimeString().slice(0, 8), views: {} };
    cams.forEach(function (c) { if (!c._al0) c._al0 = { cx: c.cx, crownY: c.crownY, s: c.s, sy: c.sy }; else { c.cx = c._al0.cx; c.crownY = c._al0.crownY; c.s = c._al0.s; c.sy = c._al0.sy; } });
    var tops = {}; cams.forEach(function (c) { tops[c.angle] = topRow(c); });
    if (tops[F.angle] == null) return null;
    var Yref = yTop - (tops[F.angle] - F.crownY) * F.sy;
    for (var it = 0; it < VA.iters; it++) {
      // ① 위 끝
      cams.forEach(function (c) { if (c === F || tops[c.angle] == null) return; c.crownY = tops[c.angle] - (yTop - Yref) / c.sy; });
      // ② ③ 띠에서 폭·가운데
      var M = {};
      cams.forEach(function (c) {
        var ws = [], ms = [], j, Y, iy, e;
        for (j = 0; j < VA.nBand; j++) {
          Y = Yref - (VA.band[0] + (VA.band[1] - VA.band[0]) * j / Math.max(1, VA.nBand - 1)) * Es.b;
          iy = c.crownY + (yTop - Y) / c.sy; e = rowExt(c, Math.round(iy)); if (!e) continue;
          var u0 = (e[0] - c.cx) * c.s, u1 = (e[1] - c.cx) * c.s; ws.push(u1 - u0); ms.push((u0 + u1) / 2);
        }
        M[c.angle] = { w: med(ws), m: med(ms), n: ws.length };
      });
      var mf = M[F.angle]; if (!mf || !(mf.n >= 2)) break;
      // 축: 그 사진의 가로축(R0)이 x쪽이면 정면·뒤 무리, z쪽이면 옆 무리
      var gx = [], gz = [];
      cams.forEach(function (c) { var m = M[c.angle]; if (!m || !(m.n >= 2)) return; (Math.abs(c.R[0]) >= Math.abs(c.R[2]) ? gx : gz).push(c); });
      // 배율: x무리는 정면 폭에, z무리는 서로의 가운데 폭에
      function setK(c, k) { var kt = clamp(c.s * k / c._al0.s, VA.kMin, VA.kMax); c.s = c._al0.s * kt; c.sy = c._al0.sy * kt; }   // 배율은 원래 값 대비 범위 안에서(되풀이해도 쌓이지 않게)
      gx.forEach(function (c) { if (c === F) return; setK(c, mf.w / M[c.angle].w); });
      if (gz.length) { var wz = 0; gz.forEach(function (c) { wz += M[c.angle].w; }); wz /= gz.length; gz.forEach(function (c) { setK(c, wz / M[c.angle].w); }); }
      // 가운데: 정면이 x를, 옆 무리(부호 맞춰)가 z를 정함 → 다른 사진은 그 점이 제 가운데에 오게 cx를 옮김
      var Cx = mf.m * F.R[0] + 0, Cz = 0;   // 정면 R0 ≈ (±1,0,0)
      if (gz.length) { var zs = gz.map(function (c) { return M[c.angle].m * (c.R[2] >= 0 ? 1 : -1); }); Cz = med(zs); }
      cams.forEach(function (c) {
        if (c === F) return; var m = M[c.angle]; if (!m || !(m.n >= 2)) return;
        var want = c.R[0] * Cx + c.R[2] * Cz, ixc = c.cx + m.m / c.s;        // 이 사진에서 지금 가운데 픽셀
        var cx2 = ixc - want / c.s, lim = VA.maxShiftCm / (c.s * cm);
        c.cx = clamp(cx2, c._al0.cx - lim, c._al0.cx + lim);
      });
    }
    cams.forEach(function (c) { if (c === F || tops[c.angle] == null) return; c.crownY = tops[c.angle] - (yTop - Yref) / c.sy; });   // 배율을 바꾼 뒤 위 끝을 한 번 더
    cams.forEach(function (c) {
      var o = c._al0, lim = VA.maxShiftCm / (c.s * cm);
      if (Math.abs(c.crownY - o.crownY) > lim) c.crownY = o.crownY + (c.crownY > o.crownY ? lim : -lim);
      rep.views[c.angle] = { dyCm: (c.crownY - o.crownY) * c.sy * cm, dxCm: (c.cx - o.cx) * c.s * cm, k: c.s / o.s, ref: c === F };
    });
    probe._aligned = photo; last = rep;
    try { console.log(VA.lines().join('\n')); } catch (e) {}
    return rep;
  };
  VA.undo = function () {
    try {
      var photo = state._hair3Dneutral, probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe);
      if (!probe || !probe.cams) return false;
      probe.cams.forEach(function (c) { if (c && c._al0) { c.cx = c._al0.cx; c.crownY = c._al0.crownY; c.s = c._al0.s; c.sy = c._al0.sy; } });
      probe._aligned = null; last = null; return true;
    } catch (e) { return false; }
  };
  VA.lines = function () {
    if (!last) return [TAG + ' ' + (VA.on ? '아직 안 맞춤' : '꺼짐')];
    var L = [TAG + ' ' + last.at + ' · 정면 기준(머리 위 끝 · 위쪽 띠의 폭 · 가운데) — 사진마다 옮긴 양'];
    Object.keys(last.views).forEach(function (a) { var v = last.views[a]; L.push('   ' + a + (v.ref ? ' (기준)' : '') + ' — 높이 ' + (v.dyCm >= 0 ? '+' : '') + v.dyCm.toFixed(2) + 'cm · 가로 ' + (v.dxCm >= 0 ? '+' : '') + v.dxCm.toFixed(2) + 'cm · 배율 ×' + v.k.toFixed(3)); });
    L.push('   되돌리기 VIEW_ALIGN.on=false; VIEW_ALIGN.undo() 후 다시 기르기');
    return L;
  };
  VA.status = function () { return last; };
  // 42번이 기르기 직전에
  var G = W.REGROW;
  if (G && typeof G.build === 'function') {
    var inner = G.build;
    G.build = function () {
      try { var photo = state._hair3Dneutral, probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe); if (photo && probe) VA.align(photo, probe); } catch (e) { console.warn(TAG + ' 실패 — 맞추지 않고 진행', e); }
      return inner.apply(this, arguments);
    };
  } else console.warn(TAG + ' REGROW.build가 없어 사진 맞춤을 못 겁니다');
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () { var L = ppl.apply(this, arguments) || []; try { VA.lines().forEach(function (x) { L.push(x); }); } catch (e) {} return L; };
  console.log(TAG + ' 설치 — 다시 기르기 직전에 옆·뒤 사진을 정면 기준으로 맞춤(머리 위 끝 · 폭 · 가운데) · 끄기 VIEW_ALIGN.on=false · 상태 VIEW_ALIGN.lines().join("\\n")');
})();
