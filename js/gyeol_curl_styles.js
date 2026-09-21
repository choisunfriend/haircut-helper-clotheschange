/* =====================================================================
 * GYEOL — 컬 스타일 2종 (사진 1: 남자 히피펌 / 사진 2: 웨이브 단발)
 * 형식: STYLE_SPECS(16-style-spec-diag.js) + STYLES(02-state-sections.js)
 * 길이는 tipAt(두상높이 대비 끝높이) — 컬이 걸린 "보이는 끝" 기준으로 역산됨
 * ===================================================================== */

/* ---------- A. 소스에 넣는 방법 ----------------------------------------
 * 1) 16-style-spec-diag.js 의 STYLE_SPECS 객체 안에 아래 두 키를 추가
 * 2) 02-state-sections.js 의 STYLES 배열에 아래 두 카드를 추가
 * 3) (선택) 06-ui-panels.js RECIPE_STYLES 배열에 두 id 추가 → 스펙 수치표에 표시
 * ------------------------------------------------------------------- */

const NEW_STYLE_SPECS = {
  // 사진 1 — 짧은 기장, 타이트한 잔컬, 정수리 볼륨, 눈썹 덮는 앞머리
  hippie_curl_men: {
    name: '남자 히피펌 · 잔컬 · 내린 앞머리',
    tipAt: { front: 0.44, crown: 0.34, temple: 0.55, side: 0.60, occipital: 0.82, nape: 0.93 },
    cut: {
      crown:     { technique: 'uniform',    elevation: 80, texture: 50, density: 90, curlDir: 0 },
      front:     { technique: 'uniform',    elevation: 30, texture: 55, density: 85, line: 60, curlDir: 0 },
      temple:    { technique: 'graduation', elevation: 45, texture: 45, density: 90, overdirection: 20, curlDir: 0 },
      side:      { technique: 'graduation', elevation: 45, texture: 40, density: 85, curlDir: 0 },
      occipital: { technique: 'graduation', elevation: 50, texture: 40, density: 90, curlDir: 0 },
      nape:      { technique: 'graduation', elevation: 30, texture: 35, density: 80, line: 70, curlDir: 0 }
    },
    perm: { curl: 72, wave: 18 },          // 강한 컬 + 가는 로드
    styling: { sweep: -45, volume: 75, flow: 0, part: 0, partAmt: 0, finish: 55, sleek: 0 },
    globalCurl: 72,
    color: '#2B2016'
  },

  // 사진 2 — 턱선 단발, 느슨한 굵은 웨이브, 눈썹~속눈썹 시스루뱅
  wavy_bob_seethrough: {
    name: '웨이브 단발 · 시스루뱅 · 굵은 컬',
    tipAt: { front: 0.50, crown: 0.72, temple: 0.92, side: 0.98, occipital: 1.00, nape: 1.03 },
    cut: {
      crown:     { technique: 'uniform',    elevation: 70, texture: 55, density: 88, curlDir: 0 },
      front:     { technique: 'uniform',    elevation: 15, texture: 70, density: 30, line: 50, curlDir: -10 },
      temple:    { technique: 'uniform',    elevation: 50, texture: 55, density: 70, overdirection: 35, curlDir: 10 },
      side:      { technique: 'uniform',    elevation: 45, texture: 60, density: 95, curlDir: 20 },
      occipital: { technique: 'uniform',    elevation: 45, texture: 55, density: 100, curlDir: 20 },
      nape:      { technique: 'graduation', elevation: 20, texture: 40, density: 100, line: 50, curlDir: 20 }
    },
    perm: { curl: 50, wave: 48 },          // 중간 컬 + 굵은 로드
    styling: { sweep: -15, volume: 60, flow: 20, part: 0, partAmt: 0, finish: 45, sleek: 0 },
    globalCurl: 50,
    color: '#2B2016'
  }
};

const NEW_STYLE_CARDS = [
  { id: 'hippie_curl_men', specId: 'hippie_curl_men', name: '남자 히피펌',
    tags: '잔컬 · 내린 앞머리 · 정수리 볼륨', length: 30, curl: 72, volume: 75, colorHex: '#2B2016' },
  { id: 'wavy_bob_seethrough', specId: 'wavy_bob_seethrough', name: '웨이브 단발',
    tags: '시스루뱅 · 굵은 컬 · 턱선', length: 70, curl: 50, volume: 60, colorHex: '#2B2016' }
];


/* ---------- B. 배포 없이 바로 써보기 (브라우저 콘솔에 붙여넣기) ----------
 * 커스텀 스타일 저장소(gyeol_customStyles)에 spec 을 실어 넣는다.
 * getStyleSpec 이 등록 스타일의 spec 도 찾으므로 프리셋과 같은 경로로 역산됨.
 * 카드는 '커스텀'으로 뜨고 삭제 버튼으로 지울 수 있다. 넣은 뒤 새로고침.
 * ------------------------------------------------------------------- */
function installCurlStylesToStorage() {
  const key = 'gyeol_customStyles';
  let list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
  for (const card of NEW_STYLE_CARDS) {
    const id = 'custom-' + card.id;
    if (list.some(s => s.id === id)) continue;
    list.push({ ...card, id, specId: id, isCustom: true, spec: NEW_STYLE_SPECS[card.specId] });
  }
  localStorage.setItem(key, JSON.stringify(list));
  console.log('[GYEOL] 컬 스타일 2종 등록 — 새로고침하세요');
}
// installCurlStylesToStorage();

/* 컬 크기를 더 실제 로드 cm 에 맞추고 싶으면 (전역 설정):
 *   setPermPreset('coil')  → 사진 1 (로드 0.8~1.8cm 구간, wave 값이 그 안에서 위치)
 *   setPermPreset('wave')  → 사진 2 (로드 1.8~3.2cm 구간)
 *   setPermPreset(null)    → 기본 */
