/*
 * 31-hippie-wave-eyeguard.js
 *
 * (1) 눈 가림 공통 원인 수정 — "EYE_GUARD"
 *     스타일 스펙을 적용하면 applyStyleSpecAndRender → mannequinReset()이 마네킹을 켜고,
 *     앞머리는 MQ_FRINGE 규칙으로 심기/잘립니다. 여기서 네 가지가 겹쳐 앞머리가 눈을 덮었습니다.
 *       a. MQ_FRINGE.tipFaceFrac 기본값 0 = 심는 앞머리 끝이 "눈높이"(CY) 그 자체.
 *       b. fringeLineY()의 바닥(lineFloorFaceFrac 0.4) = 눈 아래로 눈~턱의 40%까지 허용.
 *       c. 길이 역산(solveSectionLengthForTipY → measureSectionTipY → adjustStrandGeom) 동안
 *          fringeLineY()가 "시험 길이"가 아닌 state.sections[sec].length(이전 값)를 읽음.
 *          → 역산할 때 본 앞머리선과, 확정 길이로 다시 그린 앞머리선이 달라서 결과가 더 내려감.
 *       d. 스펙 tipAt.front 0.46~0.52 — headHeightRef 기준 0.5 = 두상 타원 중심 = 눈높이.
 *          (눈썹 ≈ 0.41, 윗눈꺼풀 ≈ 0.465) 즉 목표 자체가 눈 위/눈 한가운데였음.
 *       + 역산 뒤에 도는 after(컬 줄이기)·sweep(앞으로 넘김)·gravityDroop이 끝을 더 내림.
 *     고친 것
 *       - 기본 앞머리 끝: 눈높이 → 눈썹~윗눈꺼풀 사이(defaultTipFaceFrac). 프로필이 직접 정하면 그 값.
 *       - 역산 중엔 시험 길이로 앞머리선을 계산(역산 ↔ 최종 일치).
 *     [2026-10-01 제거] 앞머리선 바닥 강제(fringeLineY 클램프), 눈 상자 트림(eyeBoxTrim),
 *       front 옆선 상한 트림(frontSideCap)은 모두 삭제했습니다.
 *       원칙: 렌더 단계에서 가닥을 몰래 자르지 않는다. 얼굴을 가리면 그 스타일의
 *       길이(tipAt)·커트·가르마·넘김 같은 시술 값으로 고친다.
 *       대신 FACE_COVER_CHECK가 최종 가닥이 얼굴(눈 상자)에 들어가는지 세기만 하고
 *       어느 섹션을 고쳐야 하는지 콘솔과 진단 패널에 알려줍니다(자르지 않음).
 *
 * (2) Men's Hippie Perm → 레퍼런스(미디엄 S웨이브 · 시스루 앞머리 · 둥근 볼륨)로 재조정.
 */
(function () {
  'use strict';

  var W = window;
  var TAG = '[앞머리 길이]';

  var EYE_GUARD = W.EYE_GUARD = Object.assign({
    on: true,
    // 얼굴 계측 단위: faceH = 눈~턱 길이(_mqFaceH). 음수 = 눈 위.
    defaultTipFaceFrac: -0.14, // 프로필이 tipFaceFrac을 안 정했을 때 심는 앞머리 끝(눈썹과 윗눈꺼풀 사이)
    fixSolveLength: true,      // 역산 중 fringeLineY가 시험 길이를 쓰게
    // 아래 값은 FACE_COVER_CHECK(검사 전용)가 쓰는 얼굴 상자 — 자르는 데 쓰지 않음
    boxTopFaceFrac: -0.06,     // 상자 윗선(윗눈꺼풀)
    boxBotFaceFrac: 0.3,       // 상자 아랫선(광대)
    boxHalfXFrac: 0.75,        // 얼굴 반폭 대비 상자 반폭
    zBackFrac: 0.22
  }, W.EYE_GUARD || {});

  // headHeightRef()는 첫 줄에서 state.hair3Dneutral 게터를 읽는다. 마네킹이 비어 있으면 게터가
  // buildMannequinHair3D()를 부르고, 빌드가 앞머리를 심느라 mqFringeTipY(= 이 파일의 래퍼)를 부르면
  // 다시 headHeightRef → 게터 → 빌드 … 무한 재귀(사이드파트 멈춤의 원인).
  // 같은 식을 게터를 거치지 않고 계산한다(마네킹 CY = 원본 CY).
  function safeHeadRef() {
    var s = st();
    if (!s) return null;
    var h = s.hair3Dmannequin || s._hair3Dneutral;
    var E = null;
    try { E = getHeadEllipsoid(); } catch (e) {}
    if (!h || !E || !(E.b > 1e-6)) return null;
    var CY = h.CY != null ? h.CY : (typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15);
    return { yTop: CY + E.b, H: 2 * E.b };
  }

  function has(name) { return typeof W[name] === 'function'; }
  function st() { return typeof state !== 'undefined' ? state : null; }
  function mqOn() { return typeof MANNEQUIN !== 'undefined' && !!MANNEQUIN.on; }

  function currentStyleId() {
    var s = st();
    return EYE_GUARD._applying || (s && s.specAppliedId) || null;
  }
  // 스타일이 스스로 정한 앞머리 길이(tipAt.front). 심는 앞머리 끝을 이 높이에 맞추는 데만 씀.
  function frontTarget() {
    var id = currentStyleId(), spec = null;
    try { spec = id ? getStyleSpec(id) : null; } catch (e) {}
    if (!spec || spec.eyeGuard === false || !spec.tipAt || typeof spec.tipAt.front !== 'number') return null;
    return spec.tipAt.front;
  }
  function active() { return EYE_GUARD.on && mqOn() && frontTarget() != null; }
  function profileSetsTip() {
    var sb = W.STYLE_BASE;
    var p = sb && sb.active;
    return !!(p && p.config && p.config.MQ_FRINGE && typeof p.config.MQ_FRINGE.tipFaceFrac === 'number');
  }

  // ── 기하 캐시(모델·얼굴 프로필이 바뀔 때만 다시 계산) ──
  var _geo = null;
  function geom() {
    var s = st();
    if (!s) return null;
    var h = s._hair3Dneutral || null;
    var prof = null;
    try { prof = has('getFaceProfile') ? getFaceProfile() : null; } catch (e) {}
    if (_geo && _geo.h === h && _geo.prof === prof) return _geo.v;
    var v = null;
    try {
      var E = getHeadEllipsoid();
      if (E && E.a > 0 && E.b > 0 && E.c > 0) {
        var CY = h && isFinite(h.CY) ? h.CY : (typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15);
        var fh = has('_mqFaceH') ? _mqFaceH(CY, E) : E.b / 0.633 * 0.7;
        if (fh > 0) {
          var halfX = prof && prof.halfX > 0 ? prof.halfX : E.a * 0.95;
          v = {
            E: E, CY: CY, fh: fh, prof: prof,
            topY: CY - EYE_GUARD.boxTopFaceFrac * fh,
            botY: CY - EYE_GUARD.boxBotFaceFrac * fh,
            xHalf: halfX * EYE_GUARD.boxHalfXFrac,
            zBack: EYE_GUARD.zBackFrac * E.c
          };
        }
      }
    } catch (e) { v = null; }
    _geo = { h: h, prof: prof, v: v };
    return v;
  }

  // 가닥 하나가 얼굴 상자(윗눈꺼풀~광대, 눈 폭, 얼굴 앞)에 들어가는지 — 검사만 함
  function coversFace(pts, g) {
    if (!pts || pts.length < 2 || !g) return false;
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i];
      if (!(p.y < g.topY) || !(p.y > g.botY) || !(Math.abs(p.x) < g.xHalf)) continue;
      var zf = g.prof ? g.prof.zAt(p.y) : g.E.c;
      if (p.z > zf - g.zBack) return true;
    }
    return false;
  }

  // 스타일별 수치 보정(데이터). 눈높이(0.5)에 걸려 있던 기존 스펙 목표를 눈썹~눈꺼풀로.
  // 제한이 아니라 스타일 값 자체를 고친 것 — 스타일마다 여기서 바꾸면 됩니다.
  var STYLE_TUNES = W.STYLE_TUNES = Object.assign({
    layered_bob_hush:    { tipAt: { front: 0.45 } },  // 원래 0.52(specPatch)
    wavy_bob_seethrough: { tipAt: { front: 0.44 } },  // 원래 0.5
    side_part_perm:      { tipAt: { front: 0.43 } }   // 원래 0.46
  }, W.STYLE_TUNES || {});

  // ── 래핑 ──
  function wrap(name, make) {
    var f = W[name];
    if (typeof f !== 'function' || f.__eyeGuard) {
      if (typeof f !== 'function') console.warn(TAG + ' ' + name + ' 없음 — 건너뜀');
      return;
    }
    var g = make(f);
    g.__eyeGuard = true;
    W[name] = g;
  }

  // a. 심는 앞머리 끝
  wrap('mqFringeTipY', function (orig) {
    return function (cy) {
      var y = orig.apply(this, arguments);
      if (y == null || !active() || profileSetsTip()) return y;
      var g = geom();
      // 심는 앞머리 끝 = 스타일 목표(tipAt.front) 높이
      var t = frontTarget(), ref = null;
      try { ref = safeHeadRef(); } catch (e) {}
      if (t != null && ref) return ref.yTop - t * ref.H;
      return g ? cy - EYE_GUARD.defaultTipFaceFrac * g.fh : y;
    };
  });

  // c. 역산 중 시험 길이 (자르기 없음)
  wrap('adjustStrandGeom', function (orig) {
    return function (strand, len) {
      var s = st();
      var restore = null;
      if (EYE_GUARD.on && EYE_GUARD.fixSolveLength && strand && strand.mannequin &&
          typeof len === 'number' && s && s.sections &&
          (strand.sec === 'front' || strand.sec === 'crown') && s.sections[strand.sec] &&
          s.sections[strand.sec].length !== len) {
        restore = [s.sections[strand.sec], s.sections[strand.sec].length];
        restore[0].length = len;
      }
      var out;
      try { out = orig.apply(this, arguments); }
      finally { if (restore) restore[0].length = restore[1]; }
      return out;
    };
  });

  // e. 모든 스타일 공통 기본값 (히피펌에서 효과 본 것) — 프로필이 직접 정하면 그 값이 우선
  //    · MANNEQUIN.lenPct 0.9 : 섹션 최장(어깨·옷 따라간 이상치) 대신 90백분위 → 긴 끄트머리 방지
  //    · MQ_FRINGE.crownAllAround false : 크라운을 뒤까지 눈썹선에서 자르지 않음 → 크라운 역산 "못 풂" 방지
  var COMMON_DEFAULTS = W.STYLE_COMMON_DEFAULTS = Object.assign({
    on: true,
    MANNEQUIN: { lenPct: 0.9 },
    MQ_FRINGE: { crownAllAround: false }
  }, W.STYLE_COMMON_DEFAULTS || {});
  function applyCommonDefaults(id) {
    if (!COMMON_DEFAULTS.on) return;
    var sb = W.STYLE_BASE, cfg = (sb && sb.active && sb.active.config) || {};
    var tgt = {
      MANNEQUIN: typeof MANNEQUIN !== 'undefined' ? MANNEQUIN : null,
      MQ_FRINGE: typeof MQ_FRINGE !== 'undefined' ? MQ_FRINGE : null
    };
    var rebuild = false, set = [];
    for (var obj in tgt) {
      if (!tgt[obj] || !COMMON_DEFAULTS[obj]) continue;
      for (var key in COMMON_DEFAULTS[obj]) {
        if (cfg[obj] && key in cfg[obj]) continue;          // 프로필이 정함
        if (tgt[obj][key] === COMMON_DEFAULTS[obj][key]) continue;
        tgt[obj][key] = COMMON_DEFAULTS[obj][key];
        set.push(obj + '.' + key + '=' + COMMON_DEFAULTS[obj][key]);
        if (obj === 'MANNEQUIN') rebuild = true;           // 길이 원료가 바뀜 → 뿌리 다시 심기
      }
    }
    if (rebuild) { var s = st(); if (s) s.hair3Dmannequin = null; }
    if (set.length) console.log(TAG + ' 공통 기본값 ' + id + ': ' + set.join(' · ') +
      ' (끄기 STYLE_COMMON_DEFAULTS.on=false)');
  }

  // d. 스펙 tipAt.front 상한 + 적용 중 스타일 id 표시
  wrap('applyStyleSpec', function (orig) {
    return function (id) {
      var spec = null;
      try { spec = getStyleSpec(id); } catch (e) {}
      var tune = STYLE_TUNES[id];
      if (spec && tune && tune.tipAt) {
        spec.tipAt = Object.assign({}, spec.tipAt, tune.tipAt);   // specPatch 뒤에 덮음
      }
      if (spec && spec.tipAt && spec.tipAt.front > 0.46 && spec.tipAt.front < 0.56 && spec.eyeGuard !== false) {
        console.warn(TAG + ' ' + id + ' tipAt.front ' + spec.tipAt.front +
          ' — 눈높이(0.5) 근처 목표입니다. 눈썹 0.41 · 윗눈꺼풀 0.465 · 눈 아래로 덮을 거면 0.55↑');
      }
      applyCommonDefaults(id);
      EYE_GUARD._applying = id;
      _geo = null;
      FACE_COVER_CHECK.pendingId = id;
      try { return orig.apply(this, arguments); }
      finally { EYE_GUARD._applying = null; }
    };
  });

  // ── 얼굴 가림 검사: FACE_COVER_CHECK (자르지 않고 세기만) ──
  // 최종 조정 가닥(computeAdjustedHair3DStrands 결과)이 얼굴 상자에 들어가면
  // 섹션별로 세서 알려줍니다. 고치는 건 스펙(길이·커트·가르마·넘김)에서.
  var FACE_COVER_CHECK = W.FACE_COVER_CHECK = Object.assign({
    on: true,
    warnFrac: 0.01,    // 섹션 가닥의 1% 넘게 들어가면 경고
    last: null,
    pendingId: null
  }, W.FACE_COVER_CHECK || {});

  wrap('computeAdjustedHair3DStrands', function (orig) {
    return function () {
      var out = orig.apply(this, arguments);
      if (!FACE_COVER_CHECK.on || !FACE_COVER_CHECK.pendingId || !out || !out.length) return out;
      var id = FACE_COVER_CHECK.pendingId;
      FACE_COVER_CHECK.pendingId = null;          // 스타일 적용 후 첫 최종 결과에서 한 번만
      try {
        var g = geom();
        if (!g) return out;
        var by = {}, n = {};
        for (var i = 0; i < out.length; i++) {
          var sgm = out[i], sec = sgm.sec || '?';
          n[sec] = (n[sec] || 0) + 1;
          if (coversFace(sgm.pts, g)) by[sec] = (by[sec] || 0) + 1;
        }
        var bad = [];
        for (var k in by) if (by[k] / n[k] > FACE_COVER_CHECK.warnFrac) bad.push(k + ' ' + by[k] + '/' + n[k]);
        FACE_COVER_CHECK.last = { id: id, by: by, n: n, bad: bad, at: Date.now() };
        if (bad.length) console.warn('[얼굴 가림] ' + id + ' — 얼굴을 덮는 섹션: ' + bad.join(' · ') +
          '\n    → 자르지 않았습니다. 이 스타일 스펙에서 해당 섹션의 tipAt을 줄이거나(짧게),' +
          ' 가르마(partAmt)·넘김(sweep)·curlDir·overdirection으로 얼굴 밖으로 보내세요.');
        else console.log('[얼굴 가림] ' + id + ' — 얼굴 가림 없음');
      } catch (e) { console.warn('[얼굴 가림] 검사 실패', e); }
      return out;
    };
  });

  var _ppl = W.perfPanelLines;
  if (typeof _ppl === 'function') {
    W.perfPanelLines = function () {
      var lines = _ppl.apply(this, arguments) || [];
      var L = FACE_COVER_CHECK.last;
      lines.push(!L ? '[얼굴 가림] 아직 검사 안 함(스타일 적용 후 표시)' :
        '[얼굴 가림] ' + L.id + ' — ' + (L.bad.length ? '⚠ ' + L.bad.join(' · ') + ' (스펙에서 길이/시술로 수정)' : '없음'));
      return lines;
    };
  }

  // ── (2) Men's Hippie Perm 재조정 ──
  var HIPPIE = 'hippie_curl_men';
  if (typeof STYLE_SPECS !== 'undefined') {
    STYLE_SPECS[HIPPIE] = {
      name: "Men's hippie perm · Loose S-waves · See-through fringe",
      // 0.5 = 눈높이, 1.0 ≈ 턱선
      tipAt: {
        front: 0.43,     // 눈썹~윗눈꺼풀
        crown: 0.40,     // 크라운 레이어가 이마로 떨어져 앞머리와 섞임
        temple: 0.52,    // 광대 위
        side: 0.60,      // 귀를 반쯤 덮음
        occipital: 0.80,
        nape: 0.95       // 목덜미 · 살짝 뻗침
      },
      cut: {
        crown:     { technique: 'uniform',    elevation: 80, texture: 60, density: 90, curlDir: -10 },
        front:     { technique: 'uniform',    elevation: 25, texture: 70, density: 70, line: 55, curlDir: -30 },
        temple:    { technique: 'graduation', elevation: 45, texture: 60, density: 85, overdirection: 20, curlDir: 10 },
        side:      { technique: 'graduation', elevation: 40, texture: 55, density: 85, curlDir: 25 },
        occipital: { technique: 'uniform',    elevation: 50, texture: 55, density: 90, curlDir: 20 },
        nape:      { technique: 'graduation', elevation: 25, texture: 50, density: 80, line: 60, curlDir: 30 }
      },
      perm: { curl: 55, wave: 62 },   // 이전 72/18 = 가는 로드 스프링 컬
      styling: { sweep: -12, volume: 70, flow: 10, part: 12, partAmt: 0, finish: 55, sleek: 0 },
      globalCurl: 55,
      color: '#2B2016'
    };
  }
  if (typeof STYLES !== 'undefined') {
    var st0 = STYLES.find(function (s) { return s && s.id === HIPPIE; });
    if (st0) {
      st0.tags = 'Loose S-waves · See-through fringe · Rounded volume';
      st0.length = 45;
      st0.curl = 55;
      st0.volume = 72;
    }
  }
  if (W.STYLE_BASE && typeof W.STYLE_BASE.addProfile === 'function' && !W.STYLE_BASE.profiles[HIPPIE]) {
    W.STYLE_BASE.addProfile(HIPPIE, {
      label: "Men's hippie perm · Loose S-waves",
      config: {
        CURL_BUNDLE: { rodThickCm: 4.5, pitchThick: 2.4, relax: 1.3, microAmp: 0.03, microPhase: 0.18 },
        CURL3D_FIX: { ampGamma: 0.8 },
        VOLUME3D: { AMP: 0.17 },
        MANNEQUIN: { lenPct: 0.9 },   // 섹션 최장(=어깨·옷 따라간 이상치) 대신 90백분위
        MQ_FRINGE: { tipFaceFrac: -0.16, crownAllAround: false }
      },
      volBase: 1,
      shade: { ao: 0.44, lumCap: 1.3, spec: 0.2, specPow: 55 }
    });
  }

  // ── 정수리 숱 채움: CROWN_FILL ──
  // ROOT_EVEN은 "셀 면적 × 옆·뒤 중앙값 × boost(×frontBoost)"를 목표로 셀을 채웁니다.
  //   · 정수리 셀은 극각 격자라 면적이 아주 작아(로그: 정수리 셀 1/20) 배수를 올려도 목표 자체가 작고,
  //   · frontBoost는 방위 56° 안(앞쪽)만 봅니다 — 정수리 한가운데는 앞/옆/뒤 셀이 뒤섞인 자리,
  //   · 이미 목표를 채운 셀은 건너뜁니다(frontMinFill).
  //   · 그리고 이 값들은 마네킹을 다시 만들 때만 반영됩니다(콘솔에서 값만 바꾸면 그대로).
  // 여기서는 두피 타원면의 "실제 면적"으로 밀도를 다시 재서, 정수리 칸이 옆·뒤 기준 밀도 × mul보다
  // 성기면 가장 가까운 가닥을 복제해 채웁니다.
  var CROWN_FILL = W.CROWN_FILL = Object.assign({
    on: true,
    mul: 1.0,        // 정수리 목표 밀도 = 옆·뒤 기준 × mul  (setCrownFill(1.5) 로 올림)
    phiMax: 0.75,    // 정수리로 볼 범위(극각, rad)
    NP: 24, NT: 32,  // 면적 재는 격자
    maxAddFrac: 0.6, // 전체 가닥 대비 추가 상한
    maxSrcDist: 2.5  // 복제 원본이 칸 크기의 몇 배 이내여야 하나(멀면 대머리 자리로 보고 안 채움)
  }, W.CROWN_FILL || {});

  function crownFill(h) {
    if (!CROWN_FILL.on || !h || !h.strands || !h.strands.length) return h;
    var S = null;
    try { S = getScalpEllipsoid(); } catch (e) {}
    if (!S) return h;
    var CY = isFinite(h.CY) ? h.CY : (typeof SCALP_CENTER_Y !== 'undefined' ? SCALP_CENTER_Y : 0.15);
    var NP = CROWN_FILL.NP, NT = CROWN_FILL.NT, dP = Math.PI / NP, dT = 2 * Math.PI / NT;
    function pos(ph, th) {
      return { x: S.a * Math.sin(ph) * Math.sin(th), y: CY + S.b * Math.cos(ph), z: S.c * Math.sin(ph) * Math.cos(th) };
    }
    function area(ip, it) { // 칸 중심에서 |r_phi × r_theta| dphi dtheta
      var ph = (ip + 0.5) * dP, th = (it + 0.5) * dT - Math.PI, e = 1e-4;
      var p0 = pos(ph, th), p1 = pos(ph + e, th), p2 = pos(ph, th + e);
      var ax = p1.x - p0.x, ay = p1.y - p0.y, az = p1.z - p0.z, bx = p2.x - p0.x, by = p2.y - p0.y, bz = p2.z - p0.z;
      var cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
      return Math.sqrt(cx * cx + cy * cy + cz * cz) / (e * e) * dP * dT;
    }
    function cellOf(p) {
      var ph = Math.acos(Math.max(-1, Math.min(1, (p.y - CY) / S.b)));
      var th = Math.atan2(p.x / S.a, p.z / S.c);
      var ip = Math.min(NP - 1, Math.floor(ph / dP)), it = Math.min(NT - 1, Math.floor((th + Math.PI) / dT));
      return ip * NT + it;
    }
    var bins = new Array(NP * NT);
    for (var i = 0; i < h.strands.length; i++) {
      var st0 = h.strands[i];
      if (!st0 || !st0.pts || !st0.pts.length) continue;
      var c = cellOf(st0.pts[0]);
      (bins[c] || (bins[c] = [])).push(st0);
    }
    // 기준: 극각 0.9~1.6(옆·뒤 중간 높이), 가닥 있는 칸의 면적당 밀도 중앙값
    var ref = [];
    for (var ip = 0; ip < NP; ip++) {
      var phc = (ip + 0.5) * dP;
      if (phc < 0.9 || phc > 1.6) continue;
      for (var it = 0; it < NT; it++) {
        var b = bins[ip * NT + it];
        if (b && b.length >= 3) ref.push(b.length / area(ip, it));
      }
    }
    if (ref.length < 8) return h;
    ref.sort(function (a, b) { return a - b; });
    var refD = ref[ref.length >> 1] * CROWN_FILL.mul;
    var cap = Math.round(h.strands.length * CROWN_FILL.maxAddFrac);
    var added = 0, cells = 0, skipped = 0, seed = 97531;
    function rnd() { seed = seed * 1103515245 + 12345 & 2147483647; return seed / 2147483647; }
    for (ip = 0; ip < NP && added < cap; ip++) {
      if ((ip + 0.5) * dP > CROWN_FILL.phiMax) break;
      for (it = 0; it < NT && added < cap; it++) {
        var A = area(ip, it), have = (bins[ip * NT + it] || []).length, want = Math.round(refD * A);
        if (have >= want) continue;
        // 복제 원본 후보: 이 칸 + 이웃 칸
        var pool = [];
        for (var dp = -1; dp <= 1; dp++) for (var dt = -1; dt <= 1; dt++) {
          var jp = ip + dp; if (jp < 0 || jp >= NP) continue;
          var bb = bins[jp * NT + ((it + dt) % NT + NT) % NT];
          if (bb) pool = pool.concat(bb);
        }
        if (!pool.length) { skipped++; continue; }
        var cellSize = Math.sqrt(A);
        cells++;
        for (var k = have; k < want && added < cap; k++) {
          var q = pos((ip + rnd()) * dP, (it + rnd()) * dT - Math.PI);
          var best = null, bd = Infinity;
          for (var m = 0; m < pool.length; m++) {
            var r = pool[m].pts[0], d = (r.x - q.x) * (r.x - q.x) + (r.y - q.y) * (r.y - q.y) + (r.z - q.z) * (r.z - q.z);
            if (d < bd) { bd = d; best = pool[m]; }
          }
          if (!best || Math.sqrt(bd) > CROWN_FILL.maxSrcDist * cellSize + 1e-6) { skipped++; break; }
          var r0 = best.pts[0], ox = q.x - r0.x, oy = q.y - r0.y, oz = q.z - r0.z;
          var nw = Object.assign({}, best, {
            pts: best.pts.map(function (p) { return { x: p.x + ox, y: p.y + oy, z: p.z + oz }; }),
            _crownAdded: true
          });
          if (best.colors && best.colors.slice) nw.colors = best.colors.slice();
          h.strands.push(nw);
          added++;
        }
      }
    }
    console.log(TAG + ' [정수리 채움] 기준 밀도(옆·뒤 중앙) ×' + CROWN_FILL.mul + ' · 모자란 칸 ' + cells +
      '개에 ' + added + '가닥 추가' + (skipped ? ' · 원본이 멀어 건너뛴 칸 ' + skipped : '') +
      ' · 끄기 CROWN_FILL.on=false');
    return h;
  }
  wrap('mannequinEvenRoots', function (orig) {
    return function () { return crownFill(orig.apply(this, arguments)); };
  });

  W.setCrownFill = function (k) {
    CROWN_FILL.mul = Math.max(0.5, Math.min(3, +k || 1));
    var s = st();
    if (s) s.hair3Dmannequin = null;
    try { if (typeof ADJ_CACHE !== 'undefined') ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof combRefresh === 'function') combRefresh(); } catch (e) {}
    return CROWN_FILL.mul;
  };

  // ── 숱 손잡이: setHairDensity(1.5) ──
  // 3D 뿌리 수(ROOT_EVEN.boost·maxAddFrac)와 2D 화면에 그리는 가닥 상한(HAIR3D_RENDER.targetMul)을
  // 같이 올립니다. 2D 정면 화면은 "원본 결 보기 가닥 수 × targetMul"에서 잘리므로
  // 뿌리만 늘리면 3D에서만 빽빽해지고 2D에서는 솎기만 늘어납니다.
  var _dBase = null;
  W.setHairDensity = function (k) {
    k = Math.max(0.5, Math.min(3, +k || 1));
    var re = W.ROOT_EVEN;
    var hr = typeof HAIR3D_RENDER !== 'undefined' ? HAIR3D_RENDER : null;
    if (!_dBase) _dBase = {
      boost: re ? re.boost : 1.2, maxAdd: re ? re.maxAddFrac : 1.2, mul: hr ? hr.targetMul : 1.5
    };
    if (re) { re.boost = _dBase.boost * k; re.maxAddFrac = _dBase.maxAdd * k; }
    if (hr) hr.targetMul = _dBase.mul * k;
    var s = st();
    if (s) s.hair3Dmannequin = null;             // 뿌리 다시 심기
    try { if (typeof ADJ_CACHE !== 'undefined') ADJ_CACHE.bump(); } catch (e) {}
    _geo = null;
    try { if (typeof combRefresh === 'function') combRefresh(); } catch (e) {}
    console.log(TAG + ' 숱 ×' + k + ' — ROOT_EVEN.boost ' + (re && re.boost.toFixed(2)) +
      ' · maxAddFrac ' + (re && re.maxAddFrac.toFixed(2)) + ' · HAIR3D_RENDER.targetMul ' +
      (hr && hr.targetMul.toFixed(2)) + ' (되돌리기 setHairDensity(1))');
    return k;
  };

  console.log(TAG + ' 설치 — 앞머리 기본 끝 ' + EYE_GUARD.defaultTipFaceFrac +
    ' · 가닥 자르기 없음(얼굴 가림은 FACE_COVER_CHECK가 검사만 함)');
})();
