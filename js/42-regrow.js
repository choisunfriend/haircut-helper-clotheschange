/* ==========================================================================
 * 42-regrow.js — 원본 결 → 3D: 뿌리부터 다시 기르기 (4장 버전 · v1)
 *
 * 로드 위치: index.html 맨 끝(41-original-asis.js 다음).
 *
 * 왜 (2026-10-03 실험):
 *   지금 방식은 사진에서 결을 따라 그은 긴 선 하나를 머리카락 한 올로 보고, 선의 위쪽 끝을 뿌리로 삼아
 *   머리 겉면에 걸쳐 놓습니다. 그래서
 *     · 뿌리가 크라운에 몰립니다(폼파두르: crown 68% · front 1% · temple 0% — 두피 면적은 crown 28%).
 *     · 짧은 옆머리를 정수리에서 난 9cm 가닥이 덮습니다(버섯 갓 모양).
 *     · 4면의 결을 하나로 합친 방향장을 따르게 하면 오히려 꺾입니다(꺾임 25° → 37°).
 *   긴 머리에서도 가닥이 얼굴을 가로지르고 지그재그였습니다.
 *
 * 무엇을:
 *   ① 뿌리 — 마네킹과 같은 방식으로 두피 전체에 심습니다(실측 뿌리밀도 × 셀 면적).
 *   ② 방향 — 4면을 미리 합치지 않습니다. 가닥이 한 걸음 나갈 때마다 지금 자리를 각 사진에 되비춰
 *      그 픽셀의 결 방향을 직접 읽고, 그 자리를 정면으로 보는 사진일수록 크게 칩니다.
 *      (그 사진 각도에서 보면 2D 원본 결과 같은 방향으로 흐르게 됩니다.)
 *   ③ 두께 — 두피에서 바깥으로 얼마나 떠 있는가는 사진 윤곽선으로 잽니다: 두피 셀마다 법선을 따라
 *      나가며 "이 점이 모든 사진에서 머리 영역 안인가"를 물어 처음 벗어나는 높이를 두께로 씁니다.
 *      어느 사진도 판정 못 하는 자리(정옆·뒤 일부)는 이웃 셀 값으로 메웁니다(추정).
 *   ④ 길이 — 사진의 머리 영역을 벗어나면 멈춥니다. 상한은 섹션별 원본 가닥 길이.
 *   ⑤ 방향의 앞뒤 — 2D 결은 선이라 앞뒤가 없습니다. 기본은 아래(중력) 쪽, 수평이면 뒤쪽·가르마 바깥쪽.
 *      그쪽으로 머리가 없으면(앞 헤어라인 아래 = 이마) 반대로 기릅니다 → 세운 앞머리.
 *   ⑥ 두피를 벗어나면(목덜미 아래·얼굴 쪽) 자유 낙하 구간 — 결을 따르되 중력을 섞고 두상 안으로 못 들어가게.
 *
 * 화면(2026-10-04 바뀜): 버튼 없음 — 마네킹 OFF면 자동으로 다시 기르고 치수를 재서 슬라이더에 넣습니다(아래 "버튼 없이 자동" 참고).
 *       (예전: 조정 화면 [다시 기르기] 버튼. 켜면 마네킹은 꺼지고 [원본 3D 그대로]가 켜집니다
 *       (조정 엔진의 기본 컬·커트가 섞이지 않은 결과를 먼저 보기 위해서).)
 *       진단 줄 [다시 기르기]에 뿌리 분포·길이·꺾임·추정 비율·멈춘 이유가 찍힙니다.
 *
 * 한계(v1): 측면 사진이 28~51°라 정옆·뒤의 두께는 추정이 섞입니다. 속머리(겉에서 안 보이는 층)는 겉 결을 따릅니다.
 *
 * v2 (2026-10-03b · 폼파두르 첫 실측: 뿌리 crown 68% → 30%로 정상화, 머리가 두상에 붙음. 남은 것 —
 *      꺾임 26.8°(가짜 두상에서는 3.8°) · 그루터기 4,227개가 페이드 자리에 주황 점선으로 보임 · 길이 상한에 걸린 가닥 34%)
 *   · 관성 — 매 걸음 사진 결을 그대로 따르지 않고 직전 방향과 섞습니다(사진 결의 픽셀 잡음이 가닥을 떨게 했음).
 *   · 다 기른 뒤 가닥을 한 번 고르게 폅니다(양 끝 고정).
 *   · 두께를 칸 단위로 뚝뚝 읽지 않고 이웃 칸과 보간합니다(칸 경계에서 높이가 계단처럼 튀던 것).
 *   · 사진에 머리가 없다고 나오는 자리의 뿌리는 억지로 그루터기를 세우지 않고 안 심습니다(페이드는 두피색 그대로).
 *   · 길이 상한 — 짧은 머리는 섹션별 원본 길이 중앙값 × 1.25, 어깨 아래로 내려오는 긴 머리는 넉넉히(p95 × 1.3).
 *
 * v3 (2026-10-03c) 스타일 숫자로 재기 — 다시 기른 머리에서 스타일 스펙(등록 스타일과 같은 형식)을 잽니다.
 *   [스타일 숫자 재기] 버튼 → 숫자를 보여 주고 → [이 숫자로 스타일 등록]. 등록된 스타일은 다른 손님에게
 *   기존 경로(applyStyleSpec — 그 손님 마네킹에서 같은 cm·끝 높이가 되도록 역산)로 걸립니다.
 *   무엇을 어떻게 재는가:
 *     · 긴 머리 — 섹션별 "끝 높이"(tipAt: 정수리에서 두상 높이의 몇 배 아래에서 끝나는가). 가닥이 사진의 머리 끝까지
 *       자랐으므로 그대로 믿습니다.
 *     · 짧은 머리 — 섹션별 길이 cm. 두피에 누운 가닥은 사진만으로 길이를 알 수 없어서(1cm 머리가 겹겹이 누운 것과
 *       10cm 머리가 누운 것이 겉에서 같아 보임) 그 자리의 두께로 어림합니다: 길이 ≈ 두께 × liftK(2.2).
 *       ⚠ 어림값입니다 — 등록 전에 숫자를 보고, 다른 손님에게 건 뒤 슬라이더로 고치는 것을 전제로 합니다.
 *     · 페이드 — 옆·뒤 아래쪽에서 "사진에 머리가 없어 안 심은 뿌리"가 차지하는 높이. 가드·테이퍼는 기본값.
 *     · 뿌리 볼륨 — 윗머리(크라운+프론트) 뿌리 자리의 두께(cm)에서. 35 + 10×cm (1.5cm = 50 중립, 3.5cm = 70).
 *     · 넘김 — 윗머리 가닥이 뒤로 흐르는 정도(+ 뒤로 · − 앞으로).
 *     · 가르마 — 위치·세기를 재서 보여 주기만 합니다(스펙에는 아직 안 넣음 — 좌우 부호를 실제 사진으로 확인한 뒤 넣을 것).
 *     · 컬 — (v4에서 잼 · 아래)
 *
 * v4 (2026-10-04h) 컬 재기 — 곱슬머리 사진을 다시 기르면 직모처럼 나왔습니다(실측: 앞머리가 눈까지 덮인 곱슬 단발 → 매끈한 바가지 머리).
 *   왜: 다시 기르기는 한 걸음 ≈0.4cm에 관성 55%로 결을 따라가고, 다 기른 뒤 두 번 폅니다. 지름 1~2cm짜리 컬은 이 걸음으로는
 *       따라갈 수 없어서 가닥은 "컬을 편 뼈대"만 남습니다. 그리고 컬 값은 재지 않고 0으로 넣었습니다.
 *   무엇을:
 *     · 재기 — 03a가 뷰마다 재 둔 "결이 꺾이는 정도"(curlDegPerPx: 결을 따라 6px 간 자리의 결 방향이 몇 도 달라졌나 ÷ 6)의
 *       뷰 중앙값을 컬 0~curlMax로 옮깁니다(curlLo 이하 = 0 · curlHi 이상 = curlMax · 사이는 직선).
 *       ⚠ curlLo·curlHi는 합성 무늬(직모 0.1 · 굵은 웨이브 2.5 · 곱슬 3.6~4.9 °/px)로 잡은 어림값입니다 — 실제 사진 몇 장의
 *         진단 줄([스타일 숫자] 컬 …)을 보고 고쳐야 합니다. 로드 굵기(웨이브)는 못 재서 기본값 50.
 *     · 보이기 — 잰 컬을 섹션 컬 슬라이더에 넣고, 가닥에는 기존 컬 엔진(curlStrand3D)으로 겁니다.
 *       컬을 주면 가닥이 그만큼 짧아지므로(나선), 잰 컬에서 겉모양이 사진과 같도록 가닥의 "편 길이"를 미리 늘려 잡습니다
 *       (사진에 보이는 길이 ÷ 남는 비율). 그래서 컬을 내리면 머리가 길어지고(펴짐), 올리면 짧아집니다.
 *     · 컬이 0으로 재진 머리(직모)는 예전과 똑같습니다(가닥을 손대지 않음).
 *   끄기: REGROW.curl=false 후 마네킹을 켰다 끄기.
 *
 * v5 (2026-10-04i) 컬 굵기 재기 — v4는 컬의 "세기"만 재고 굵기(로드)는 기본값 50이라, 굵은 컬 사진도 지름 1.5cm쯤의 잔 컬로 나왔습니다.
 *   재기: 사진을 분석할 때(결 방향장을 만든 직후) 결을 따라 걸어가며 "몇 px 가면 결 방향이 처음과 달라지는가"를 잽니다
 *        (방향 상관이 절반으로 떨어지는 거리 dHalf). 컬이 굵을수록 멀리 가야 달라집니다.
 *        컬 반경(px) ≈ curlRk × (dHalf − curlR0) — 타래 모양 합성 무늬(반경 12~60px)로 맞춘 식입니다(⚠ 어림). 
 *        결 방향장이 7px 창으로 뭉개져 있어서 반경 5px 미만은 구분하지 못합니다(270px짜리 사진이면 약 1cm 미만).
 *        px → cm는 그 뷰의 카메라 배율로 바꾸고, 뷰 중앙값을 씁니다.
 *   적용: 나선 반경 = 잰 컬 반경이 되도록 웨이브(로드 굵기) 슬라이더 값을 정합니다. 로드 최대(웨이브 100)로도 모자라면
 *        다시 기른 가닥에 한해 로드를 그 배수만큼 더 키웁니다(rodScale — 가닥을 줄여서 컬을 건 뒤 다시 키우는 방식).
 *        등록 스타일에는 웨이브 값만 들어갑니다(100을 넘는 몫은 안 들어감).
 *   끄기: REGROW.curlRadius=false (웨이브 50 · 배수 없음 = v4 동작)
 *
 * v6 (2026-10-05k) 긴 머리는 목 아래에서 그냥 곧게 늘어뜨림 — 사용자: "어깨 앞으로 머리를 내려야 할 필요가 있기 전까지는 그냥 아래로
 *   늘어뜨린 형태로. 복잡도만 높아진다. 어깨 앞으로 넘겨서 뒷머리가 구겨졌던 손님도 — 어차피 목덜미 아래까지 내려오는 머리니까 —
 *   일괄적으로 쭉 내려오도록."
 *   예전: 두피를 벗어난 뒤에도 사진의 결을 따라가서, 머리를 어깨 앞으로 넘긴 사진이면 가닥이 앞으로 감기려 하고(backFix가 막음)
 *        길이도 사진의 머리 영역이 정해서 뒤쪽이 들쭉날쭉 구겨졌습니다.
 *   지금(hangDown · 긴 머리만): 턱·목덜미 높이(yBody) 아래로 내려온 가닥은 사진 결을 읽지 않고 곧게 아래로 내립니다(hangK로 부드럽게 꺾음).
 *        끝 높이는 사진 가닥의 끝 높이 분포(뒤 사진 가닥이 20개 넘으면 그것 · 아니면 전체)의 25~75% 사이에서 가닥마다 뽑습니다.
 *        그 높이까지는 사진이 "머리 없음"이라 해도 이어 갑니다(섹션 길이 상한은 그대로 적용).
 *        어깨에 닿는 가닥은 50번이 전부 등 쪽으로 넘깁니다(50번 frontDrape=false).
 *   짧은 머리와, 긴 머리의 목 위쪽 구간은 예전 그대로입니다.
 *   끄기: REGROW.hangDown=false 후 마네킹을 켰다 끄기.
 *
 * v8 (2026-10-06n) 컬 굵기 적용을 끔(10/4 방식으로 되돌림) — 사용자(영상·콘솔): "왜 이 컬은 도로 컬이 죽어서 나와?"
 *   콘솔: 컬 75 · 컬 굵기 반경 1.3cm → 웨이브 100 + 로드 ×1.29. 화면: 컬이 아니라 곧은 막대가 사방으로 삐죽 나온 모양.
 *   원인: v5가 잰 반경에 맞추려고 웨이브를 100으로 올리고 로드를 1.29배 했는데, 실제 컬 엔진(14c 컬 묶음)은 로드가 굵어지면
 *        한 바퀴 간격이 훨씬 더 빨리 늘어납니다. 실제 엔진에 곧은 가닥을 넣어 재 보니(하네스 자 기준) 컬 75에서
 *        웨이브 50 = 한 바퀴 2cm · 17.7cm 가닥에 4.7바퀴 / 웨이브 100 = 한 바퀴 11cm · 1.9바퀴. 두 바퀴도 안 감기면 컬이 아니라 비스듬한 막대로 보입니다.
 *        v5의 환산식은 14번의 단순 나선을 가정한 것이라 이 엔진과 맞지 않았습니다.
 *   지금: curlRadius=false — 컬 값만 사진에서 재고 웨이브는 50(10/4에 컬로 보이던 상태). 반경은 재서 진단에만 찍습니다.
 *   다시 켜기: REGROW.curlRadius=true (실제 엔진에 맞춘 환산을 새로 만들기 전에는 권하지 않음)
 *
 *   (2026-10-06r) 컬 굵기 적용은 다시 껐습니다. q에서 "결 정렬만 꺼도 컬이 돌아왔다"고 보고 켰는데, 콘솔 기록을 대조하니 컬이 돌아온 그때(09:57)는
 *     파일이 이미 curlRadius=false(웨이브 50)였습니다. 굵기를 켠 q(웨이브 100 + 로드 ×1.29 · 결 정렬은 건너뜀)에서는 다시 막대가 됐습니다(16:26 영상).
 *     즉 컬이 살려면 둘 다 필요합니다: 굵기 적용 끔 + 곱슬머리는 결 정렬 안 함.
 *   (2026-10-06p) 그런데 굵기를 끈 것만으로는 부족했습니다 — 사용자: "REGROW.align=false로 하니까 돌아왔어."
 *     v7 결 정렬이 곱슬 사진의 뼈대를 나란히 펴 버린 것입니다(이 사진: 돌린 가닥 28,334 · 돌린 각 중앙값 23.8°. 직모 손님은 6.4°).
 *     곱슬머리의 뼈대는 일부러 엇갈려 있고 그 엇갈림이 컬의 부피를 만듭니다. → 사진에서 잰 컬이 alignCurlOff(40) 이상이면 정렬을 안 하고,
 *     그 아래는 세기를 비례해서 줄입니다.
 *
 * v7 (2026-10-05m) 기른 뒤 결 정렬 — 사용자: "머리는 결이 중요하다. 일부러 삐죽하게 하지 않는 이상 주변 머리와 한 방향으로 나란히 정렬된다.
 *   일일이 빗질하기 전에, 사진에서 읽힌 결과 일반적인 결 방향을 참고해서 방향을 잡아 둘 수 없나?"
 *   다시 기르기는 가닥을 하나씩 따로 길러서, 한 가닥이 결을 잘못 읽으면 그 가닥만 혼자 튑니다(이웃을 보지 않음).
 *   다 기른 뒤 한 번:
 *     ① 자리(alignCell ≈ 1.3cm 칸)마다 그 칸을 지나는 가닥들의 평균 방향(= 이웃들의 결)과 가닥 수를 냅니다.
 *        머리 겉면 밖으로 뜬 잔머리는 제 칸에 이웃이 없으므로, 두상 쪽으로 alignReach칸(≈ 4cm)까지 들어가며 가장 가까운 이웃 결을 씁니다.
 *     ② 가닥의 마디가 그 평균에서 alignTol° 넘게 벗어나면 평균 쪽으로 돌립니다(alignFull° 이상이면 alignK만큼 · 사이는 부드럽게).
 *        이미 나란한 마디는 안 건드립니다. 평균이 뚜렷하지 않은 칸(가르마·가마처럼 방향이 갈리는 자리 — 결집도 < alignCoh)과,
 *        평균과 거의 반대인 마디(alignFlip° 넘음)는 그대로 둡니다. 마디 길이는 그대로라 가닥 길이는 안 변합니다.
 *     ③ 혼자 나간 꼬리 — 끝까지 이웃이 없는 칸(가닥 수 ≤ strayMax)만 지나는 꼬리가 strayMinSeg 마디 넘으면 그 꼬리를 잘라 냅니다
 *        (머리 밖으로 크게 휘어 나간 고리 가닥).
 *   컬은 이 뼈대 위에 따로 얹히므로 잰 컬은 그대로 걸립니다.
 *   끄기: REGROW.align=false 후 마네킹을 켰다 끄기.
 *
 * 끄기: 버튼 또는 REGROW.on=false 후 REGROW.refresh()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[다시 기르기]';
  var G = W.REGROW = Object.assign({
    on: false, button: true,
    step: 0.022,        // 한 걸음(모델 단위 ≈ 0.4cm)
    maxSteps: 44,
    minFacing: 0.22,    // 이 사진이 그 자리를 이만큼은 정면으로 봐야 결을 읽음
    minCoh: 0.08,       // 결 또렷함 하한
    layerLo: 0.2, layerHi: 1.0,   // 가닥이 두께의 몇 %까지 뜨는가(가닥마다 무작위)
    tMax: 0.45,         // 두께 재기 상한(모델 단위 ≈ 9cm)
    tStep: 0.012,
    outlineCos: 0.3,    // 두께는 그 자리를 거의 옆에서(법선·카메라축 각 73° 이상) 보는 사진으로만 잼
    tFloor: 0.012,      // 두께 바닥(≈ 0.25cm)
    lenCap: false,      // (2026-10-11f) 길이 상한(섹션 중앙값 × lenMul) 끔 — 길이는 3D 머리 덩어리 밖·누운 머리 두께로 끝남. 걸음 폭 정하는 데만 씀(걸음 수는 3배까지)
    lenPct: 0.5, lenMul: 1.25,    // 짧은 머리 길이 상한 = 섹션별 원본 가닥 길이 중앙값 × 1.25
    longPct: 0.95, longMul: 1.3,  // 긴 머리(어깨 아래로 내려오는 가닥이 longShare 넘게 있음)는 넉넉히
    longShare: 0.1,
    sideLayStay: true,  // (2026-10-11p) 앞 헤어라인에서 옆으로 눕힌 가닥(10d)은 두피를 벗어나는 자리에서 끝 · 길이도 그 섹션 상한까지 — 길이 상한을 끈 뒤(11f) 관자놀이 밖 허공으로 뻗어 나가 옆머리에 가시가 되던 것. false = 예전(두피 밖으로 이어 감)
    stubCm: 1.2,        // (2026-10-10e) 안 뒤집은 얇은 자리(옆·목덜미 머리선)에 심는 짧은 머리 길이(cm) · 0 = 안 심음
    polDown: 2.5,       // (2026-10-10f) 두피 위에서 결(앞뒤 없는 선)의 앞뒤를 고를 때 비탈을 거꾸로 오르는 쪽에만 이만큼 벌점(비탈 기울기에 비례) — 한 번 위로 가면 계속 위로 가며 두상을 감던 것. 옆으로 흐르는 결(가마·가르마)은 안 건드림 · 0 = 예전(직전 방향만)
    glossSkip: true,    // (2026-10-10f) 광택 보정 — 머리색보다 많이 밝은 자리(광택 띠)에서 수평에 가까운 결은 안 읽음(광택 띠 가장자리를 결로 잘못 읽은 것) · false = 끔
    glossLo: 0.35,      // 광택 판정: (밝기 − 머리색 밝기) ÷ (255 − 머리색 밝기)가 이 값 이상
    glossFlat: 0.5,
    glossNbrKeep: false, // (2026-10-12b) 끔 — 광택 띠의 수평 결은 둘레와 같아도 안 읽음(직모 손님에서 798개가 살아 가닥이 옆으로 꺾임). 다시 켜기 true   // (2026-10-11s) 3·6번만 되돌림 — 이것은 12:25 그대로 · 끄기 false   // (2026-10-11q) 원인 찾기용 스위치 — false면 광택 띠의 수평 결을 둘레와 같아도 안 읽음(10f)
    secVol: true,        // (2026-10-11s) 3·6번만 되돌림 — 이것은 12:25 그대로 · 끄기 false   // (2026-10-11q) 원인 찾기용 스위치 — false면 섹션 부피(volShare/volPoint/weight)를 스펙에 안 넣음
    glossNbr: 8,        // (2026-10-10i) 둘레 결을 볼 거리(마스크 px)     // 수평에 가까움: |sin(결 각)| 이 값 미만(±30°)
    flipThickCm: 1.8,   // (2026-10-10g) 4 → 1.8 — 실측 앞쪽 뿌리 두께: 넘겨 세운 남자 앞머리 중앙값 2.3cm · 눕힌 여자 앞머리 1.0cm
    thinStopCm: 0.5, thinStopRoot: 1.2, thinStopAfter: 1.0,   // (2026-10-10j) 뿌리 두께가 thinStopRoot cm 이상인 가닥은 두께 thinStopCm 미만 자리(페이드)에 들어서면 멈춤(뿌리에서 thinStopAfter cm 지난 뒤) · 0 = 끔
    polSlopeLo: 0.35, polSlopeHi: 0.75,   // (2026-10-10i) 오르막 벌점은 비탈이 이 기울기(내리막 방향 길이 0~1) 사이에서 서서히 걸림 — 가마·정수리처럼 완만한 곳은 결 그대로 돎
    polThickLo: 0, polThickHi: 0,   // (2026-10-12b) 끔(둘 다 0 = 두께로 벌점을 안 풂) — 뿌리 두께 2.2cm 이상인 자리(직모 손님 옆·뒤)에서 벌점이 꺼져 가닥이 위로 거슬러 가던 것. 예전 값 1.4 / 2.2   // (2026-10-10g) 오르막 벌점을 뿌리 두께로 풂 — 이 cm 이하면 벌점 그대로 · 이 cm 이상(세운 머리·볼륨)이면 벌점 없음 · 사이는 서서히
    flipThickCm_note: 0,     // (2026-10-10c) 출발 방향 뒤집기(아래에 머리가 없으면 위로)는 뿌리 자리 머리 두께가 이 cm 이상일 때만 — 세운 앞머리. 얇으면(눕힌 머리·목덜미 짧은 머리) 안 뒤집음 · 0 = 예전처럼 늘 뒤집음
    trace: true,        // (2026-10-10b) 걸음 기록 — 기본 켬(시험판). 끄기 REGROW.trace=false · 켜면 가닥마다 걸음별로 무엇이 방향을 정했는지 남김(60번 내보내기에 실림) · 머리 모양은 그대로
    traceEvery: 25,     // 기록할 보통 가닥 표본 간격(두피 위에서 길이 상한까지 간 가닥은 전부)
    inertia: 0.55,      // 직전 방향을 섞는 비율(0 = 사진 결 그대로)
    smooth: 2,          // 다 기른 뒤 고르게 펴는 횟수
    liftK: 2.2,
    onScalpLen: true,   // (2026-10-11a) 짧은 머리: 두피 위로 누운 가닥은 뿌리 자리 두께 × liftK에서 끝(누운 머리는 기와처럼 겹쳐 사진에서 끝없이 이어 보임 — 걸어간 거리는 가닥 길이가 아님. 스펙 길이와 같은 잣대)         // 짧은 머리 길이 어림 = 뿌리 자리 두께 × 이 값
    // (2026-10-04h) 컬 재기 — 머리말 v4 참고
    curl: true,
    curlLo: 1.8, curlHi: 4.0,   // 결 꺾임(°/px) 이 구간을 컬 0 → curlMax로 (⚠ 합성 무늬로 잡은 어림값)
    curlMax: 90,                // 100이면 가닥 점 수가 3배(나선 11바퀴) — 90이면 2배쯤
    curlMin: 10,                // 이보다 작게 재지면 0(직모)으로 봄
    curlMinN: 20,               // 뷰의 표본 수가 이보다 많아야 믿음
    curlKeepShape: true,        // 잰 컬에서 겉모양이 사진과 같도록 편 길이를 미리 늘려 잡음
    // (2026-10-04i) 컬 굵기 — 머리말 v5 참고
    curlRadius: false,          // (2026-10-06r) 끔 — 켜면 컬이 죽음(웨이브 100 + 로드 ×1.29 = 곧은 막대). q에서 다시 켠 것은 잘못 읽은 것 — 머리말 v8 참고
    clumps: true, clumpWin: 17, clumpLift: 1.5, clumpMinPx: 25,   // (2026-10-10m) 곱슬 사진에서 타래 조각 찾기(61번이 3D 가닥을 조각대로 묶음)
    waveFromHelix: true, waveFromHelixBelow: 30, waveHelixPitchLo: 3, waveHelixPitchHi: 15, waveHelixRLo: 0.8, waveHelixRMaxK: 0.6, waveCurlLo: 40, waveCurlHi: 65,   // (2026-10-10p) 굵은 웨이브: 컬이 30 미만으로 잡혀도 나선 측정이 한 바퀴 3~15cm·반경 0.8cm 이상을 잡으면 컬 40~65(반경÷간격에 비례). 사용자: 이 정도(한 바퀴 7~8cm)면 "강한 펌은 아니지만 약한 펌도 아님" → 60대 · 더 굵은 미국식 웨이브(간격이 더 김)는 40~50대
    fadeOn: true,       // (2026-10-10l) 페이드를 잰 손님은 페이드 토글을 켜서 시작
    curlHelix: true,    // (2026-10-10m) 다시 켬(사용자: 타래 구현까지 한 다음에 판단) · 예전 메모: 실제 곱슬 사진(타래가 여러 방향으로 감김)에서 사진마다 0.6~1.1cm로 들쭉날쭉·정면은 못 잼 → 사진 전체 한 번이 아니라 부분마다 재는 방식으로 다시 만들 때까지 예전 어림식
    curlHelix_was: true, helixPeak: 0.3, helixBetaLo: 25, helixBetaHi: 78,   // (2026-10-10k) 나선 측정으로 컬 반경·한 바퀴 간격을 잼(쓸 조건: 반복 세기 · 가닥 기울기 범위) · false = 예전 어림식
    curlAmp: false, curlAmpK: 1.15, curlAmpWavy: 0.25,   // (2026-10-10j) 끔 — 실제 곱슬 사진에서 0.4cm로 작게 잼(큰 컬은 선이 타래 경계에서 끊겨 빠지고 잔물결만 남음) → 뽀글이. 고칠 때까지 예전 어림식   // (2026-10-10h) 컬 반경을 결 선의 흔들림 폭으로 직접 잼(합성 컬 진폭 3~25px에서 실제의 74~96% → ×1.15) · 흔들리는 선이 이 비율 이상일 때만 · false = 예전 어림식
    curlRk: 5, curlR0: 3.3,     // 컬 반경(px) = curlRk × (dHalf − curlR0)  (⚠ 합성 타래 무늬로 맞춘 어림)
    curlRminPx: 5,              // 이보다 작게는 구분 못 함(결 방향장의 창 크기)
    curlRodScaleMax: 3,         // 로드 최대를 넘길 수 있는 배수 상한
    minLenCm: 0.8,
    tapPx: 4,           // 머리 영역 판정 여유(800px 기준)
    gravity: 0.25,      // 두피 밖 구간에서 중력을 섞는 비율
    // (2026-10-04e) 뒷머리가 앞으로 쏠리는 것 막기 — 아래 backFix 설명 참고
    backFix: false,     // (2026-10-12r) 끔 — 사용자: "그거 꺼" (뒷머리 뒤로 넘기기 · 몸통에 자연스럽게 흘러내리기와 겹치면 안 됨) · 다시 켜기 REGROW.backFix=true
    backFix_was: true,  // (2026-10-11j) 다시 켬(사용자 선택 (가)) — 끄니 뒷머리가 몸통을 뚫고 앞으로 넘어옴(뒤 뿌리 → 몸 앞 1,278가닥). 몸통이 없는 동안은 이것이 뒷머리를 뒤에 둠
    backFoldAfter: true, backFoldFlat: false, backFoldDropCm: 6, backFoldRampCm: 6, backFoldBw: 0.25,   // (2026-10-12d) 뒷머리를 뒤에 두는 것을 "읽은 뒤"에 함 — 사용자: "읽을 때 뺄 필요는 없거든? 렌더링까지는 읽어서 한 뒤 처리 과정에서 뒤로 넘기는 걸로" · "뒷머리에서 나온 가닥들을 결 정리하는 식으로". 걷는 동안에는 앞으로 가는 것을 안 막고(사진대로 끝까지 읽음), 다 읽은 가닥에서 어깨 높이(턱·목덜미 높이에서 backFoldDropCm 아래)부터 backFoldRampCm에 걸쳐 서서히 두피를 벗어난 자리의 깊이까지 뒤로 옮김 → 귀~어깨 사이 옆머리는 사진 그대로. backFoldBw: 뒤쪽 정도가 이 값 이상이면 온전히 넘김. false = 예전(걷는 동안 막음)
    freeDepth: 0.6,     // 두피 밖 구간에서 사진 결이 지어낼 수 있는 깊이(카메라 쪽/반대쪽) 움직임 상한(가로·세로 움직임의 몇 배)
    backFrom: 0.1, backFull: 0.5,   // 두피를 벗어난 자리가 얼마나 뒤쪽인가(0 = 귀 옆 · 1 = 정뒤) — 이 구간에서 0→1로 막음
    // (2026-10-05k) 긴 머리는 목 아래에서 곧게 늘어뜨림 — 머리말 v6 참고
    hangDown: false,    // (2026-10-11f) 끔 — 긴 머리도 3D 머리 덩어리를 빠져나가는 곳에서 끝(곧게 늘어뜨려 끝 높이 맞추기 대신)
    hangK: 0.6,         // 한 걸음마다 아래 방향을 섞는 비율(클수록 빨리 곧아짐)
    // (2026-10-05m) 기른 뒤 결 정렬 — 머리말 v7 참고
    align: true,
    alignCell: 0.07,    // 이웃을 보는 칸 크기(모델 단위 ≈ 1.3cm)
    alignK: 0.75,       // 많이 벗어난 마디를 평균 쪽으로 돌리는 세기(0~1)
    alignTol: 12, alignFull: 40, alignFlip: 100,   // 도: 이 안쪽은 그대로 · 이 이상은 alignK만큼 · 이 넘게 반대면 안 건드림
    alignCoh: 0.6,      // 칸의 결집도(평균 벡터 길이)가 이보다 낮으면 그 칸은 기준으로 안 씀
    alignMin: 4,        // 칸을 지나는 가닥이 이만큼은 돼야 기준으로 씀
    alignReach: 3,      // 제 칸에 기준이 없으면 두상 쪽으로 이 칸 수까지 들어가며 이웃 결을 찾음(겉면 밖으로 뜬 잔머리)
    alignRoot: 0.15, alignRootFade: 0.1,   // 뿌리에서 이 길이(≈ 2.7cm)까지는 안 돌리고, 그 뒤 이 길이에 걸쳐 서서히(뿌리 볼륨을 눕히지 않게)
    strayTrim: true, strayMax: 1, strayMinSeg: 4, strayKeep: 1,   // 혼자 나간 꼬리 자르기
    alignCurlOff: 40,   // (2026-10-06p) 사진에서 잰 컬이 이 값 이상이면 결 정렬을 안 함(0~이 값 사이는 세기를 비례해서 줄임) · 0 = 컬과 무관하게 정렬
    // (2026-10-04g) 목 — 늘어뜨린 가닥이 목(과 그 아래 몸통 기둥) 안으로 못 들어가게. 화면에 보이는 목과 같은 치수.
    neck: false, neckMargin: 1.1,
    hullRule: 'front',  // (2026-10-11h) 사용자: "다수결방식에 정면을 참고하는 걸로" — 'front' = 다수결 + 정면이 1cm 넘게 밖이면 머리 아님 ·    // (2026-10-11g) 'tol' = 여유 둔 교집합: 그 자리를 보는 사진 중 하나라도 머리 영역에서 여유(정면 1 · 옆·뒤 1.5cm) 넘게 밖이면 머리 아님 — 예전 다수결은 2:2 동점도 머리로 쳐서 웨이브 손님 덩어리가 1.3배 컸음 · 'face' = 다수결 + 마주 보는 사진
    hullViews: ['front', 'left', 'right', 'back'], hullMarginCm: 1.0, hullMarginSideCm: 1.5, hullFacing: true, hullCellPx: 3,   // (2026-10-11b) 그 자리를 가장 정면으로 마주 보는 사진이 '밖'이라고 하면 밖(정면 1cm · 옆·뒤 1.5cm 여유) — 사용자: "정 안맞는 곳은 해당 면의 사진영역으로 결정" · 사진 맞춤은 65번   // (2026-10-11a) 껍질 = 사진들의 "교집합" — 이 사진들이 머리 영역 밖(여유 이 cm 넘게)이라고 하면 다른 사진이 머리라고 해도 머리 아님. 정면은 얼굴 랜드마크로 맞춘 사진이라 믿을 수 있음 · [] = 예전 다수결만
    tri3D: false, /* (2026-10-11r) 원인 찾기 결과 — 끔. 다시 켜기 REGROW.tri3D=true */ tri3DMinDeg: 35, tri3DPrior: 0.15,   // (2026-10-11a) 두피 밖 결의 3D 방향 = 두 장 이상의 사진 결이 만드는 평면들의 교선(깊이를 직전 걸음에서 물려받지 않음) · 시선축이 이 각 이상 벌어진 사진들일 때만
    volume: true, volCellCm: 0.6, volTight: true, volTightMinCurl: 30,   // (2026-10-11d) 3D 머리 덩어리 — 사진 네 장(마주 보는 사진 규칙)으로 칸마다 머리/아님을 한 번 정해 두고, 걷기·61번(마네킹 위 컬의 축 길이)이 같은 덩어리를 씀
    polNbr: true,       // (2026-10-11d) 뿌리 결이 옆으로 흐릴 때 앞뒤 방향을 "가운데 선 바깥"이 아니라 이웃 뿌리들의 방향으로(남자분 가운데 가르마의 원인)
    straightCurly: false, straightMode: 'path', straightWinK: 1.0, straightCurlMin: 40, straightPitchK: 0.5, straightDHalfK: 4, straightRMinPx: 5, straightRMaxPx: 40,   // (2026-10-10s) 곱슬 사진은 큰 흐름만 따라 직모 뼈대로 기름(컬은 61·14c가 그 위에 얹음) — 반경 = 한 바퀴 간격 × K (못 쟀으면 dHalf × K) · 사진 px
    sliceMs: 60,        // (2026-10-12e) 30 → 60: 화면에 양보하는 횟수를 반으로(폰에서 쉬는 시간이 얼마인지는 아래 진단 줄 '일한 시간/쉰 시간'으로 확인)
    waveField: true, waveCellCm: 0.8, waveMinN: 3,   // (2026-10-12e) 읽은 굴곡 장 — 곱슬·웨이브 사진에서 '읽은 길 − 편 길'을 자리(칸)마다 모아 둠. 61번이 PHOTO_CURL.readWave일 때 마네킹 가닥에 그대로 얹음 · 안 만들기 waveField=false
    sGrid: true, sGridK: 4,   // (2026-10-12l) 고른 결 미리 계산(속도) · 끄기 sGrid=false
    axisGabor: false, axisK: 0.5, axisRMinPx: 4, axisRMaxPx: 60, axisWinK: 1.0,   // (2026-10-12j) 축 = 방향 필터 파장으로 고른 결을 따라 걸음(아래 설명) · 끄기 axisGabor=false
    measureShare: 1, measureFull: ['front', 'temple'],   // (2026-10-12e) 기른 가닥은 재는 용도뿐(원본 = 마네킹 + 스펙)이라 measureFull 밖의 섹션은 이 비율만 기름 · 전부 기르기 measureShare=1
    seed: 20261003
  }, W.REGROW || {});
  var S = G.stats = null;

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }

  /* ────────────────────────────────────────────────────────────────────────
   * (2026-10-12e) 읽은 굴곡 장 — "읽은 결을 그대로 쓴다"의 그릇
   *   곱슬·웨이브 사진은 뼈대를 펴서 기릅니다(직모 뼈대). 그때 버려지던 '읽은 길 − 편 길'(= 사진에서 읽은 굴곡)을 편 길의 자리(칸)마다 모읍니다.
   *   굴곡은 가닥을 따라간 길이가 아니라 "자리"에 고정돼 있어서(옆 가닥과 마루가 나란함 — 타래) 결 표(길이 칸 평균)로는 지워지고, 자리 칸으로 모으면 남습니다.
   *     D  = 칸에 든 가닥들의 벗어남 평균(벡터) — 이웃 가닥이 같이 굽은 자리만 남고, 제각각인 자리(못 읽은 컬)는 서로 지워져 0에 가까워짐
   *     aC = 같이 굽은 크기(둘레 5칸에서 |ΣD| ÷ 표본 수 × √2) — "여기서 굴곡을 얼마나 읽었나"
   *   make(칸 크기, 범위) → add(읽은 길, 편 길) … → finish() → at(p, out): out.x/y/z = D, out.a = aC, out.k = 아는 정도(0~1)
   * ──────────────────────────────────────────────────────────────────────── */
  function makeWaveField(cell, bx, win) {
    var nx = Math.max(2, Math.ceil((bx.x1 - bx.x0) / cell)), ny = Math.max(2, Math.ceil((bx.y1 - bx.y0) / cell)), nz = Math.max(2, Math.ceil((bx.z1 - bx.z0) / cell)), NV = nx * ny * nz;
    if (!(NV > 0) || NV > 4e6) return null;
    var SX = new Float32Array(NV), SY = new Float32Array(NV), SZ = new Float32Array(NV), NN = new Float32Array(NV), nAdd = 0, nSmp = 0, minN = Math.max(1, G.waveMinN | 0);
    function arcOf(p) { var a = new Float64Array(p.length), i; for (i = 1; i < p.length; i++) a[i] = a[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y, p[i].z - p[i - 1].z); return a; }
    var F = {
      cell: cell, nx: nx, ny: ny, nz: nz, x0: bx.x0, y0: bx.y0, z0: bx.z0, known: 0, ampU: 0, cohMed: 0, strands: 0, samples: 0,
      add: function (raw, str) {
        if (!raw || !str || raw.length < 3 || str.length < 3) return;
        var ar = arcOf(raw), as = arcOf(str), Lr = ar[raw.length - 1], Ls = as[str.length - 1]; if (!(Lr > 0) || !(Ls > cell)) return;
        var ds = cell * 0.5, m = Math.ceil(Ls / ds), i, jr = 0, js = 0, t, tr, u, a, b, qx, qy, qz, ix, iy, iz, id;
        var PXs = new Float32Array(m + 1), PYs = new Float32Array(m + 1), PZs = new Float32Array(m + 1), CX = new Float64Array(m + 2), CYs = new Float64Array(m + 2), CZ = new Float64Array(m + 2);
        for (i = 0; i <= m; i++) {
          t = Math.min(Ls, i * ds); tr = t / Ls * Lr;
          while (js < str.length - 2 && as[js + 1] < t) js++;
          while (jr < raw.length - 2 && ar[jr + 1] < tr) jr++;
          a = str[js]; b = str[js + 1]; u = (t - as[js]) / Math.max(1e-12, as[js + 1] - as[js]); PXs[i] = a.x + (b.x - a.x) * u; PYs[i] = a.y + (b.y - a.y) * u; PZs[i] = a.z + (b.z - a.z) * u;
          a = raw[jr]; b = raw[jr + 1]; u = (tr - ar[jr]) / Math.max(1e-12, ar[jr + 1] - ar[jr]); qx = a.x + (b.x - a.x) * u; qy = a.y + (b.y - a.y) * u; qz = a.z + (b.z - a.z) * u;
          CX[i + 1] = CX[i] + (qx - PXs[i]); CYs[i + 1] = CYs[i] + (qy - PYs[i]); CZ[i + 1] = CZ[i] + (qz - PZs[i]);
        }
        // 굴곡만 남김 — 벗어남에서 한 바퀴 창(win) 평균을 뺌(편 길이 굽은 자리 안쪽으로 파고든 만큼 같은 큰 어긋남은 굴곡이 아님)
        var h = win > 0 ? Math.max(1, Math.round(win / 2 / ds)) : 0, lo, hi, c, dx, dy, dz;
        for (i = 1; i <= m; i++) {
          dx = CX[i + 1] - CX[i]; dy = CYs[i + 1] - CYs[i]; dz = CZ[i + 1] - CZ[i];
          if (h) { lo = Math.max(0, i - h); hi = Math.min(m, i + h); c = hi - lo + 1; dx -= (CX[hi + 1] - CX[lo]) / c; dy -= (CYs[hi + 1] - CYs[lo]) / c; dz -= (CZ[hi + 1] - CZ[lo]) / c; }
          ix = Math.floor((PXs[i] - F.x0) / cell); iy = Math.floor((PYs[i] - F.y0) / cell); iz = Math.floor((PZs[i] - F.z0) / cell);
          if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) continue;
          id = ix + nx * (iy + ny * iz); SX[id] += dx; SY[id] += dy; SZ[id] += dz; NN[id] += 1; nSmp++;
        }
        nAdd++;
      },
      finish: function () {
        var DX = new Float32Array(NV), DY = new Float32Array(NV), DZ = new Float32Array(NV), KN = new Uint8Array(NV), E1 = new Float32Array(NV), i, n;
        for (i = 0; i < NV; i++) { n = NN[i]; if (n >= minN) { DX[i] = SX[i] / n; DY[i] = SY[i] / n; DZ[i] = SZ[i] / n; KN[i] = 1; F.known++; } if (n > 0) E1[i] = SX[i] * SX[i] + SY[i] * SY[i] + SZ[i] * SZ[i]; }
        // 둘레 5칸 상자 평균(축마다 한 번씩) — E1 = |ΣD|² · N2 = n²
        var N2 = new Float32Array(NV); for (i = 0; i < NV; i++) N2[i] = NN[i] * NN[i];
        function box(A) {
          var T = new Float32Array(NV), x, y, z, k, s2, c, st, len, ax, o, lim;
          for (ax = 0; ax < 3; ax++) {
            st = ax === 0 ? 1 : ax === 1 ? nx : nx * ny; len = ax === 0 ? nx : ax === 1 ? ny : nz;
            for (o = 0; o < NV; o++) {
              c = ax === 0 ? o % nx : ax === 1 ? ((o / nx) | 0) % ny : (o / (nx * ny)) | 0; s2 = 0;
              for (k = -2; k <= 2; k++) { lim = c + k; if (lim < 0 || lim >= len) continue; s2 += A[o + k * st]; }
              T[o] = s2;
            }
            A.set(T);
          }
          return A;
        }
        box(E1); box(N2);
        var AC = new Float32Array(NV), amps = [];
        for (i = 0; i < NV; i++) if (N2[i] > 0) { AC[i] = Math.sqrt(2 * E1[i] / N2[i]); if (KN[i]) amps.push(AC[i]); }
        amps.sort(function (x, y) { return x - y; });
        F.ampU = amps.length ? amps[amps.length >> 1] : 0; F.ampHi = amps.length ? amps[Math.floor(amps.length * 0.9)] : 0;
        F.strands = nAdd; F.samples = nSmp; F.DX = DX; F.DY = DY; F.DZ = DZ; F.KN = KN; F.AC = AC;
        SX = SY = SZ = NN = null;
        return F;
      },
      /* 세 방향 선형 보간 — 모르는 칸은 0으로(가장자리에서 저절로 잦아듦) */
      at: function (px, py, pz, out) {
        var gx = (px - F.x0) / cell - 0.5, gy = (py - F.y0) / cell - 0.5, gz = (pz - F.z0) / cell - 0.5, x0 = Math.floor(gx), y0 = Math.floor(gy), z0 = Math.floor(gz), fx = gx - x0, fy = gy - y0, fz = gz - z0;
        var k, dx, dy, dz, w, id, X = 0, Y = 0, Z = 0, A = 0, K = 0, xx, yy, zz;
        for (k = 0; k < 8; k++) {
          dx = k & 1; dy = (k >> 1) & 1; dz = (k >> 2) & 1; xx = x0 + dx; yy = y0 + dy; zz = z0 + dz;
          if (xx < 0 || yy < 0 || zz < 0 || xx >= nx || yy >= ny || zz >= nz) continue;
          id = xx + nx * (yy + ny * zz); if (!F.KN[id]) continue;
          w = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy) * (dz ? fz : 1 - fz);
          X += w * F.DX[id]; Y += w * F.DY[id]; Z += w * F.DZ[id]; A += w * F.AC[id]; K += w;
        }
        out.x = X; out.y = Y; out.z = Z; out.a = A; out.k = K; return out;
      }
    };
    return F;
  }
  G._makeWaveField = makeWaveField;
  /* 지금 사진의 굴곡 장(없으면 null) — 61번이 씀 */
  G.waveField = function () { try { return (G.model && G.src === state._hair3Dneutral && G.model.waveField) || null; } catch (e) { return null; } };
  function q(a, f) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * f))]; }
  function n1(v) { return isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '?'; }

  /* (2026-10-04g) 목 기둥 밖으로 밀어내기 — 12a의 목 메쉬와 같은 치수(밑동 폭×깊이 cm ÷ 얼굴 환산자, 윗단 = 턱 + 0.12).
     목 아래(어깨·몸통)는 모양을 모르므로 같은 굵기의 기둥으로만 봅니다(어깨에 얹히는 것은 아직 아님). 47번(길이 늘리기)도 씁니다. */
  var neckMemo = null, neckAt = 0;
  function neckDims() {
    var t = now();
    if (neckMemo && t - neckAt < 1000) return neckMemo;
    neckAt = t; neckMemo = { ok: false };
    try {
      var fm = getFaceMetrics(), top = 0.15 - 0.7 * fm.heightFactor + NECK_SHAPE.topAboveChin, cm = 16.4;
      try { var r = faceRulerCmPerUnit(fm); if (r && r.x > 1) cm = r.x; } catch (e) {}
      var hw = NECK_SHAPE.baseWCm / 2 / cm, hd = NECK_SHAPE.baseDCm / 2 / cm;
      if (isFinite(top) && hw > 0.01 && hd > 0.01) neckMemo = { ok: true, top: top, hw: hw, hd: hd, back: NECK_SHAPE.napeFull || 1 };
    } catch (e) {}
    return neckMemo;
  }
  G.neckPush = function (p) {
    if (!G.neck) return p;
    var N = neckDims();
    if (!N.ok || !(p.y < N.top)) return p;
    var t = Math.min(1, (N.top - p.y) / 0.06), m = G.neckMargin * (0.7 + 0.3 * t);          // 윗단에서 턱이 지지 않게 서서히
    var hw = N.hw * m, hd = N.hd * m * (p.z < 0 ? N.back : 1);
    var e = p.x * p.x / (hw * hw) + p.z * p.z / (hd * hd);
    if (e >= 1) return p;
    if (e < 1e-6) return { x: p.x, y: p.y, z: -hd };                                        // 한가운데 — 뒤로
    var k = 1 / Math.sqrt(e);
    return { x: p.x * k, y: p.y, z: p.z * k };
  };

  /* ────────────────────────────────────────────────────────────────────────
   * 만들기
   * ────────────────────────────────────────────────────────────────────── */
  function makeBuilder(photo) {
    var probe = (photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe) || null;
    if (!probe || !probe.cams || !probe.cams.length) return { err: '점유 프로브 없음(HAIR_OCC3D가 꺼져 있거나 사진 정보가 없음)' };
    var roots = photo.roots, grid = photo.grid;
    if (!roots || !roots.ok || !grid) return { err: '뿌리밀도/격자 없음' };
    var Es = getScalpEllipsoid(), Eh = getHeadEllipsoid(), CY = photo.CY, yTop = photo.yTop;
    if (!Es || !(Es.a > 0) || !(Es.b > 0) || !(Es.c > 0)) return { err: '두피 타원체 없음' };
    var NT = roots.NT, NP = roots.NP, NC = NT * NP;
    var OFF = (typeof EST_OFFSCALP !== 'undefined') ? EST_OFFSCALP : 3;
    var bald = (typeof MANNEQUIN !== 'undefined' && MANNEQUIN.baldDen) || 0.08;
    var a2 = Es.a * Es.a, b2 = Es.b * Es.b, c2 = Es.c * Es.c;
    var yBody = CY - 0.7 * Es.b;

    // 사진별 카메라
    function lumOfCss(cs) {                                               // '#rrggbb' · 'rgb(r,g,b)' → 밝기(0~255) · 모르면 50
      try { var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(cs || ''), r, g, b;
        if (m) { r = parseInt(m[1], 16); g = parseInt(m[2], 16); b = parseInt(m[3], 16); } else { m = /(\d+)\D+(\d+)\D+(\d+)/.exec(cs || ''); if (!m) return 50; r = +m[1]; g = +m[2]; b = +m[3]; }
        return 0.299 * r + 0.587 * g + 0.114 * b; } catch (e) { return 50; }
    }
    var cams = [];
    probe.cams.forEach(function (c) {
      var mi = state.hairMasks && state.hairMasks[c.angle];
      if (!mi || !c.smp || !(c.iw > 0) || !(c.ih > 0)) return;
      var mw = mi.maskW || mi.w, mh = mi.maskH || mi.h;
      cams.push({ angle: c.angle, R: c.R, cx: c.cx, s: c.s, sy: c.sy, crownY: c.crownY, smp: c.smp, iw: c.iw, ih: c.ih,
        ori: mi.orientation || null, mw: mw, kx: mw / mi.w, ky: mh / mi.h, tap: Math.max(2, G.tapPx * c.iw / 800),
        rgb: mi.photoRGB || null, mh: mh, hairLum: lumOfCss(mi.avgColor) });
    });
    if (!cams.length) return { err: '쓸 수 있는 사진 없음' };
    // (2026-10-10s) 직모 뼈대 — 곱슬 사진이면 결을 한 바퀴보다 넓게 평균 내어 읽음(사진의 컬을 뼈대에 복사하지 않음 · 컬은 나중에 잰 값으로 얹음)
    var straightOn = false, straightNote = [], pitchCs = [], straightWinCm = 0;
    try {
      var pcS = G.straightCurly ? G.photoCurl() : null;
      if (pcS && pcS.raw >= G.straightCurlMin) {
        straightOn = true;
        cams.forEach(function (cam) {
          var mi = state.hairMasks && state.hairMasks[cam.angle], id = mi && mi.identity, r = 0, how = '';
          var hx = id && id.curlHelix;
          if (hx && hx.P >= 6 && hx.peak >= G.helixPeak) { r = hx.P * G.straightPitchK; how = 'P'; }
          else if (id && id.curlDHalf > 0) { r = id.curlDHalf * G.straightDHalfK; how = 'd'; }
          r = clampN(r || G.straightRMinPx * 2, G.straightRMinPx, G.straightRMaxPx);
          if (hx && hx.P >= 6 && hx.peak >= G.helixPeak) { var cppS = 0; try { cppS = cmPerMaskPx(cam.angle); } catch (e2) {} if (cppS > 0) pitchCs.push(hx.P * cppS / Math.max(0.3, Math.cos((hx.beta || 0) * Math.PI / 180))); }
          if (G.straightMode === 'field') cam.sR = r; straightNote.push(cam.angle + ' ' + r.toFixed(0) + 'px' + (how ? '(' + how + ')' : ''));
        });
      }
        if (straightOn) {                                                  // 한 바퀴 간격(cm) — 사진마다 잰 값의 중앙값 · 못 쟀으면 반경 × 2π · 그것도 없으면 2.5cm
          pitchCs.sort(function (x, y) { return x - y; });
          var pc0 = pitchCs.length ? pitchCs[pitchCs.length >> 1] : (pcS.rCm > 0 ? 2 * Math.PI * pcS.rCm * 0.5 : 2.5);
          straightWinCm = clampN(pc0 * G.straightWinK, 1.5, 20);   // 가닥을 따라 잰 한 바퀴 길이(= 간격 ÷ cos 기울기)
          straightNote.push('창 ' + straightWinCm.toFixed(1) + 'cm(' + (pitchCs.length ? '잰 한 바퀴 ' + pitchCs.length + '장' : '어림') + ')');
        }
    } catch (e) { straightOn = false; }
    /* (2026-10-12j) 축과 굴곡을 따로 — 사용자: "컬과 웨이브는 걸어간 길을 따라가면 근본적으로 문제가 생겨. 걷는 순간 벗어나기 때문에"
     *  곱슬·웨이브 사진(방향 필터 선이 굽어 있음)은 결을 "그 사진에서 잰 파장 × axisK" 반경으로 고르게 한 뒤 걸음(직모 뼈대 field 방식) → 굴곡에서 벗어날 일이 없는 큰 흐름(퍼짐·어깨 앞 흐름은 남음).
     *  편 길 창 = 방향 필터 파장 중앙값(예전: 잰 한 바퀴 — 웨이브 손님 11.3cm로 퍼짐까지 지움). 굴곡은 61번이 사진 선 값 그대로 얹음(68번 옮겨심기 뒤). */
    try {
      var WSg = (G.axisGabor && W.PHOTO_CURL && typeof W.PHOTO_CURL.waveShape === 'function') ? W.PHOTO_CURL.waveShape() : null;
      if (WSg && WSg.nAll > 0 && isFinite(WSg.lamCm) && WSg.lamCm > 1) {
        straightOn = true; straightNote = ['방향 필터 축'];
        cams.forEach(function (cam) {
          var mi = state.hairMasks && state.hairMasks[cam.angle], ws = mi && mi.identity && mi.identity.waveShape, lp = ws && ws.lamPx, cpp1 = 0;
          try { cpp1 = cmPerMaskPx(cam.angle); } catch (e3) {}
          if (!(lp > 0) && cpp1 > 0) lp = WSg.lamCm / cpp1;
          var r = clampN((lp || 0) * G.axisK * (cam.iw / Math.max(1, (mi && (mi.maskW || mi.w)) || cam.iw)), G.axisRMinPx, G.axisRMaxPx);
          cam.sR = r; straightNote.push(cam.angle + ' 반경 ' + r.toFixed(0) + 'px');
        });
        straightWinCm = clampN(WSg.lamCm * G.axisWinK, 1.5, 12);
        straightNote.push('창 ' + straightWinCm.toFixed(1) + 'cm(방향 필터 파장)');
      }
    } catch (e) {}
    var nStraight = 0, straightShrink = [];
    var WFb = null;                                                       // (2026-10-12e) 읽은 굴곡 장 — 편 가닥이 있을 때만
    if (straightOn && straightWinCm > 0 && G.waveField !== false && G.waveCellCm > 0) {
      try { var cmW = 18.6; try { cmW = modelCmPerUnit() || cmW; } catch (e3) {} var hw = Math.max(Eh.a, Eh.c) * 2.3;
        WFb = makeWaveField(G.waveCellCm / cmW, { x0: -hw, x1: hw, z0: -hw, z1: hw, y0: yTop - 62 / cmW, y1: yTop + 3 / cmW }, straightWinCm / cmW); } catch (e) { WFb = null; }
    }
    /* 걸어 간 길(사진 컬을 따라 구불구불)을 한 바퀴 창으로 평균 → 나선의 축 = 직모 뼈대. 뿌리는 그대로 · 창은 뿌리·끝에서 줄어듦 · 두피 속으로 들어간 점은 두피면으로 */
    function straightenPath(pts, Wu) {
      var n = pts.length, i, S = [0];
      if (n < 4 || !(Wu > 0)) return pts;
      for (i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z));
      var L = S[n - 1]; if (!(L > Wu * 0.5)) return pts;
      var ds = Math.min(Wu / 10, L / (n - 1)), m = Math.max(4, Math.ceil(L / ds) + 1), R = new Array(m), j = 0, t, u;
      for (i = 0; i < m; i++) {                                             // 호길이로 고르게 다시 찍음
        t = Math.min(L, i * ds); while (j < n - 2 && S[j + 1] < t) j++;
        u = (t - S[j]) / Math.max(1e-12, S[j + 1] - S[j]);
        R[i] = { x: pts[j].x + (pts[j + 1].x - pts[j].x) * u, y: pts[j].y + (pts[j + 1].y - pts[j].y) * u, z: pts[j].z + (pts[j + 1].z - pts[j].z) * u };
      }
      var P = new Float64Array(3 * (m + 1)); for (i = 0; i < m; i++) { P[3 * i + 3] = P[3 * i] + R[i].x; P[3 * i + 4] = P[3 * i + 1] + R[i].y; P[3 * i + 5] = P[3 * i + 2] + R[i].z; }
      var out = [R[0]], h = Math.max(1, Math.round(Wu / 2 / ds)), k, a, b, c, q, e;
      for (i = 1; i < m; i++) {
        k = Math.min(h, i, m - 1 - i); if (k < 1) { out.push(R[i]); continue; }
        a = i - k; b = i + k + 1; c = b - a;
        q = { x: (P[3 * b] - P[3 * a]) / c, y: (P[3 * b + 1] - P[3 * a + 1]) / c, z: (P[3 * b + 2] - P[3 * a + 2]) / c };
        e = q.x * q.x / a2 + (q.y - CY) * (q.y - CY) / b2 + q.z * q.z / c2;
        if (e < 1) { var kk = 1 / Math.sqrt(Math.max(1e-9, e)); q = { x: q.x * kk, y: CY + (q.y - CY) * kk, z: q.z * kk }; }
        out.push(q);
      }
      var o2 = [out[0]], st0 = L / (n - 1), acc = 0;                       // 원래 걸음 간격쯤으로 솎음
      for (i = 1; i < out.length; i++) { acc += Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y, out[i].z - out[i - 1].z); if (acc >= st0 * 0.999 || i === out.length - 1) { o2.push(out[i]); acc = 0; } }
      return o2.length >= 3 ? o2 : pts;
    }
    var SOFF = []; (function () { var k; SOFF.push([0, 0, 1]); for (k = 0; k < 8; k++) { var a = k * Math.PI / 4; SOFF.push([Math.cos(a), Math.sin(a), 0.8]); SOFF.push([0.5 * Math.cos(a + Math.PI / 8), 0.5 * Math.sin(a + Math.PI / 8), 0.9]); } })();
    function sampleOriRaw(cam, ix, iy) {
      var cx = 0, cy = 0, ws = 0, cs = 0, k, q, sm, w, x, y;
      for (k = 0; k < SOFF.length; k++) {
        q = SOFF[k]; x = ix + q[0] * cam.sR; y = iy + q[1] * cam.sR;
        if (x < 0 || y < 0 || x >= cam.iw || y >= cam.ih) continue;
        if (k && !(cam.smp.at(x, y) > 0)) continue;
        sm = sampleOrientation(cam.ori, x * cam.kx, cam.mw, y * cam.ky);
        if (!sm || !(sm.coherence > 0)) continue;
        w = q[2] * sm.coherence; cx += w * Math.cos(2 * sm.angle); cy += w * Math.sin(2 * sm.angle); ws += w; cs += q[2];
      }
      if (!(ws > 0)) return null;
      var R2 = Math.hypot(cx, cy) / ws;                       // 둘레 결이 한쪽으로 모이는 정도(0~1)
      return { angle: 0.5 * Math.atan2(cy, cx), coherence: (ws / cs) * R2 };
    }
    /* (2026-10-12l) 고른 결을 미리 한 번 계산해 둠 — 걸음마다 17자리를 읽던 것(기르기 18~35초) → 칸(반경 ÷ sGridK)마다 한 번 읽어 두고 걸음은 둘레 4칸을 섞기만 */
    function smoothGrid(cam) {
      var g = Math.max(2, cam.sR / (G.sGridK || 4)), gw = Math.ceil(cam.iw / g) + 1, gh = Math.ceil(cam.ih / g) + 1, N = gw * gh;
      var X = new Float32Array(N), Y = new Float32Array(N), C = new Float32Array(N), ok = new Uint8Array(N), i, j, k, r;
      for (j = 0; j < gh; j++) for (i = 0; i < gw; i++) {
        k = j * gw + i; if (!(cam.smp.at(i * g, j * g) > 0) && !(cam.smp.at(Math.min(cam.iw - 1, i * g + g / 2), Math.min(cam.ih - 1, j * g + g / 2)) > 0)) continue;
        r = sampleOriRaw(cam, i * g, j * g); if (!r) continue;
        ok[k] = 1; C[k] = r.coherence; X[k] = Math.cos(2 * r.angle) * r.coherence; Y[k] = Math.sin(2 * r.angle) * r.coherence;
      }
      return { g: g, gw: gw, gh: gh, X: X, Y: Y, C: C, ok: ok };
    }
    function sampleOri(cam, ix, iy) {
      if (!cam.sR) return sampleOrientation(cam.ori, ix * cam.kx, cam.mw, iy * cam.ky);
      if (G.sGrid === false) return sampleOriRaw(cam, ix, iy);
      var SG = cam.sG || (cam.sG = smoothGrid(cam)), fx = ix / SG.g, fy = iy / SG.g, i0 = Math.floor(fx), j0 = Math.floor(fy), u = fx - i0, v = fy - j0;
      if (i0 < 0 || j0 < 0 || i0 >= SG.gw - 1 || j0 >= SG.gh - 1) return null;
      var k = j0 * SG.gw + i0, ks = [k, k + 1, k + SG.gw, k + SG.gw + 1], ws4 = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v], x = 0, y = 0, c = 0, w = 0, t;
      for (t = 0; t < 4; t++) { var q = ks[t]; if (!SG.ok[q]) continue; x += ws4[t] * SG.X[q]; y += ws4[t] * SG.Y[q]; c += ws4[t] * SG.C[q]; w += ws4[t]; }
      if (!(w > 0.25)) return null;
      return { angle: 0.5 * Math.atan2(y, x), coherence: c / w };
    }

    // 난수(결정적)
    var seed = G.seed >>> 0;
    function rnd() { seed = (seed + 0x6D2B79F5) >>> 0; var t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

    function onSurf(p) {     // 중심에서 본 방향 그대로 두피 타원체 면으로
      var x = p.x, y = p.y - CY, z = p.z, k = 1 / Math.sqrt(Math.max(1e-12, x * x / a2 + y * y / b2 + z * z / c2));
      return { x: x * k, y: CY + y * k, z: z * k };
    }
    function normalAt(p) {
      var x = p.x / a2, y = (p.y - CY) / b2, z = p.z / c2, l = Math.hypot(x, y, z) || 1;
      return { x: x / l, y: y / l, z: z / l };
    }
    function cellOf(p) {     // 두피 격자 칸(행=극각, 열=방위)
      var cy = Math.max(-1, Math.min(1, (p.y - CY) / Es.b)), ph = Math.acos(cy), th = Math.atan2(p.x / Es.a, p.z / Es.c);
      var r = Math.max(0, Math.min(NP - 1, Math.floor(ph / Math.PI * NP)));
      var c = Math.floor((th + Math.PI) / (2 * Math.PI) * NT); c = ((c % NT) + NT) % NT;
      return r * NT + c;
    }
    function offScalp(i) { return !!(roots.est && roots.est[i] === OFF); }

    var pj = { ix: 0, iy: 0, z: 0 };
    function proj(cam, p) {
      var R = cam.R, x = p.x, y = p.y - CY, z = p.z;
      pj.ix = (R[0] * x + R[1] * y + R[2] * z) / cam.s + cam.cx;
      pj.iy = cam.crownY + (yTop - ((R[3] * x + R[4] * y + R[5] * z) + CY)) / cam.sy;
      pj.z = R[6] * x + R[7] * y + R[8] * z;
      return pj;
    }
    function hairAt(cam, ix, iy) {
      var t = cam.tap, s = cam.smp;
      return s.at(ix, iy) > 0 || s.at(ix - t, iy) > 0 || s.at(ix + t, iy) > 0 || s.at(ix, iy - t) > 0 || s.at(ix, iy + t) > 0;
    }
    function behindSkull(cam, p) {   // p에서 카메라 쪽으로 가는 길이 두개골에 막히는가
      var R = cam.R, dx = R[6], dy = R[7], dz = R[8], x = p.x, y = p.y - CY, z = p.z;
      var A = dx * dx / a2 + dy * dy / b2 + dz * dz / c2, B = 2 * (x * dx / a2 + y * dy / b2 + z * dz / c2), C = x * x / a2 + y * y / b2 + z * z / c2 - 0.96;
      var D = B * B - 4 * A * C;
      if (D <= 0) return false;
      return (-B + Math.sqrt(D)) / (2 * A) > 1e-4;
    }
    /* 이 점이 사진들에서 머리 영역인가. 1 = 머리 · 0 = 아님 · -1 = 어느 사진도 판정 못 함 */
    /* (2026-10-11a) 믿을 수 있는 사진의 "머리 영역에서 떨어진 거리"(사진 px) — 거리 지도(체스판 거리 · 3px 칸) */
    var hullN = 0, triN = 0;
    cams.forEach(function (cam) {
      if (!(G.hullViews && G.hullViews.indexOf(cam.angle) >= 0)) return;
      try {
        var cp = Math.max(1, G.hullCellPx * cam.iw / 800), gw = Math.ceil(cam.iw / cp), gh = Math.ceil(cam.ih / cp), D = new Float32Array(gw * gh), x, y, i;
        for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) D[y * gw + x] = cam.smp.at((x + 0.5) * cp, (y + 0.5) * cp) > 0 ? 0 : 1e9;
        for (y = 0; y < gh; y++) for (x = 0; x < gw; x++) { i = y * gw + x; if (x) D[i] = Math.min(D[i], D[i - 1] + 1); if (y) { D[i] = Math.min(D[i], D[i - gw] + 1); if (x) D[i] = Math.min(D[i], D[i - gw - 1] + 1.414); if (x < gw - 1) D[i] = Math.min(D[i], D[i - gw + 1] + 1.414); } }
        for (y = gh - 1; y >= 0; y--) for (x = gw - 1; x >= 0; x--) { i = y * gw + x; if (x < gw - 1) D[i] = Math.min(D[i], D[i + 1] + 1); if (y < gh - 1) { D[i] = Math.min(D[i], D[i + gw] + 1); if (x < gw - 1) D[i] = Math.min(D[i], D[i + gw + 1] + 1.414); if (x) D[i] = Math.min(D[i], D[i + gw - 1] + 1.414); } }
        var cmPx = cam.s * ((typeof modelCmPerUnit === 'function' && modelCmPerUnit()) || 16.4);   // 사진 1px이 몇 cm
        cam.hull = { D: D, gw: gw, gh: gh, cp: cp, lim: (cam.angle === 'front' ? G.hullMarginCm : G.hullMarginSideCm) / Math.max(1e-6, cmPx * cp) };
      } catch (e) { cam.hull = null; }
    });
    function hullOut(cam, ix, iy) { var h = cam.hull; if (!h) return false; var gx = Math.floor(ix / h.cp), gy = Math.floor(iy / h.cp); if (gx < 0 || gy < 0 || gx >= h.gw || gy >= h.gh) return true; return h.D[gy * h.gw + gx] > h.lim; }
    function voteRaw(p) {
      var yes = 0, no = 0, i, cam, o, bf = -2, bOut = false, farNo = 0, frontOut = false;
      var frx = p.x / Es.a, fry = (p.y - CY) / Es.b, frz = p.z / Es.c, frl = Math.sqrt(frx * frx + fry * fry + frz * frz) || 1;   // 이 자리의 바깥 방향(두피 타원 기준)
      for (i = 0; i < cams.length; i++) {
        cam = cams[i]; o = proj(cam, p);
        if (o.ix < 0 || o.iy < 0 || o.ix >= cam.iw || o.iy >= cam.ih) continue;
        if (o.z < 0) {                               // 카메라 반대편
          if (p.y < yBody) continue;                 // 목·어깨에 가려졌을 수 있음(몸은 모델에 없음)
          if (behindSkull(cam, p)) continue;         // 두개골에 가림
        }
        var isHair = hairAt(cam, o.ix, o.iy);
        if (isHair) yes++; else { no++; if (cam.hull && hullOut(cam, o.ix, o.iy)) { farNo++; if (cam.angle === 'front') frontOut = true; } }
        if (cam.hull) {
          if (G.hullFacing) { var fc = (cam.R[6] * frx + cam.R[7] * fry + cam.R[8] * frz) / frl; if (fc > bf) { bf = fc; bOut = !isHair && hullOut(cam, o.ix, o.iy); } }
          else if (!isHair && o.z >= 0 && hullOut(cam, o.ix, o.iy)) { hullN++; return 0; }
        }
      }
      if (G.hullRule === 'front') { if (yes + no === 0) return -1; if (frontOut) { hullN++; return 0; } return yes >= no ? 1 : 0; }   // (2026-10-11h) 다수결 + 정면 참고(정면이 1cm 넘게 밖이면 머리 아님)
      if (G.hullRule === 'tol') { if (yes + no === 0) return -1; if (farNo) { hullN++; return 0; } return yes > 0 ? 1 : 0; }   // (2026-10-11g) 여유 둔 교집합
      if (bOut) { hullN++; return 0; }                                      // 마주 보는 사진이 "밖"
      return yes + no === 0 ? -1 : (yes >= no ? 1 : 0);
    }

    /* (2026-10-11d) 3D 머리 덩어리 — vote()를 칸 중심마다 한 번 구해 둠 */
    var VOL = null;
    (function () {
      if (!G.volume) return;
      try {
        var t0v = now(), cmV = (typeof modelCmPerUnit === 'function' && modelCmPerUnit()) || 16.4, h = G.volCellCm / cmV;
        var x0 = -2.4 * Es.a, x1 = 2.4 * Es.a, z0 = -2.4 * Es.c, z1 = 2.4 * Es.c, y1 = CY + 1.4 * Es.b, y0 = Math.min(CY - 1.2 * Es.b, yTop - 75 / cmV);
        var nx = Math.ceil((x1 - x0) / h), ny = Math.ceil((y1 - y0) / h), nz = Math.ceil((z1 - z0) / h), A = new Int8Array(nx * ny * nz), i, j, k, idx = 0, inN = 0;
        for (j = 0; j < ny; j++) for (k = 0; k < nz; k++) for (i = 0; i < nx; i++) {
          var v = voteRaw({ x: x0 + (i + 0.5) * h, y: y0 + (j + 0.5) * h, z: z0 + (k + 0.5) * h });
          A[(j * nz + k) * nx + i] = v; if (v === 1) inN++;
        }
        VOL = { A: A, nx: nx, ny: ny, nz: nz, x0: x0, y0: y0, z0: z0, h: h, inN: inN, ms: Math.round(now() - t0v),
          at: function (p) { var a = Math.floor((p.x - this.x0) / this.h), b = Math.floor((p.y - this.y0) / this.h), c = Math.floor((p.z - this.z0) / this.h); if (a < 0 || b < 0 || c < 0 || a >= this.nx || b >= this.ny || c >= this.nz) return -2; return this.A[(b * this.nz + c) * this.nx + a]; } };
        G.vol = VOL; hullN = 0;
        // (2026-10-11i) 좁은 덩어리(여유 둔 교집합) — 마네킹 위 컬이 바깥으로 부푼 점을 당겨 넣는 경계로만 씀(61번). 걷기는 위의 덩어리(다수결 + 정면)
        var needTight = true; try { var pcT = G.photoCurl(); needTight = !!(pcT && Math.max(pcT.value || 0, pcT.raw || 0) >= (G.volTightMinCurl || 0)); } catch (eT) { needTight = true; }   // (2026-10-12a) 좁은 덩어리는 마네킹 위 컬(61번)만 씀 — 컬이 없는 손님은 안 만듦(폰에서 덩어리 시간 절반)
        G.volT = null;
        if (G.volTight && needTight) {
          var rule0 = G.hullRule, AT = new Int8Array(nx * ny * nz), tN = 0; G.hullRule = 'tol';
          try { for (j = 0; j < ny; j++) for (k = 0; k < nz; k++) for (i = 0; i < nx; i++) { var vt = voteRaw({ x: x0 + (i + 0.5) * h, y: y0 + (j + 0.5) * h, z: z0 + (k + 0.5) * h }); AT[(j * nz + k) * nx + i] = vt; if (vt === 1) tN++; } } finally { G.hullRule = rule0; }
          G.volT = { A: AT, nx: nx, ny: ny, nz: nz, x0: x0, y0: y0, z0: z0, h: h, inN: tN, at: VOL.at };
          VOL.tightN = tN; VOL.ms = Math.round(now() - t0v); hullN = 0;
        }
      } catch (e) { VOL = null; }
    })();
    function vote(p) { if (VOL) { var v = VOL.at(p); if (v !== -2) { if (v === 0) hullN++; return v; } } return voteRaw(p); }

    /* 두께 재기 전용 — 그 자리를 "옆에서"(윤곽선으로) 보는 사진만 묻는다.
       정면으로 보는 사진은 깊이를 못 재서 항상 "머리"라고 답하고, 비스듬히 보는 사진은 늦게 알아챈다
       (법선과 카메라 축이 이루는 각이 90°에서 벗어난 만큼 두께를 크게 잰다). 1 머리 · 0 아님 · -1 물어볼 사진 없음 */
    function voteOutline(p, n) {
      var yes = 0, i, cam, o, R, ncz;
      for (i = 0; i < cams.length; i++) {
        cam = cams[i]; R = cam.R;
        ncz = R[6] * n.x + R[7] * n.y + R[8] * n.z;
        if (Math.abs(ncz) > G.outlineCos) continue;
        o = proj(cam, p);
        if (o.ix < 0 || o.iy < 0 || o.ix >= cam.iw || o.iy >= cam.ih) continue;
        if (o.z < 0) { if (p.y < yBody) continue; if (behindSkull(cam, p)) continue; }
        if (hairAt(cam, o.ix, o.iy)) yes++; else return 0;
      }
      return yes ? 1 : -1;
    }

    /* 그 자리의 결 방향을 사진들에서 직접 읽어 3D 접선 방향으로. ref가 있으면 그쪽 부호로 맞춤 */
    var TRF = null;   // 걸음 기록: flow()가 이번에 쓴 사진들
    var glossN = 0, glossKeep = 0;   // 광택 띠라 안 읽은 결 표본 수
    var polW = 0;     // (2026-10-10d) 이번 걸음의 내리막 무게(두피 위 · 뒤집힌 뿌리 아님일 때만 G.polDown)
    function flow(p, n, ref, flat) {
      if (TRF) { TRF.nc = 0; TRF.best = -1; TRF.bw = 0; TRF.coh = 0; TRF.spr = 0; TRF.dirs = []; }
      var ax = 0, ay = 0, az = 0, wsum = 0, i, cam, o, R, ncx, ncy, ncz, sm, pol, dX, dY, dZ, mx, my, mz, l, w, dot;
      var TM = [0, 0, 0, 0, 0, 0, 0], TV = [];
      for (i = 0; i < cams.length; i++) {
        cam = cams[i]; if (!cam.ori) continue;
        R = cam.R;
        ncz = R[6] * n.x + R[7] * n.y + R[8] * n.z;
        var lowF = ncz < G.minFacing; if (lowF && !(flat && G.tri3D)) continue;
        o = proj(cam, p);
        if (o.ix < 0 || o.iy < 0 || o.ix >= cam.iw || o.iy >= cam.ih) continue;
        if (!(cam.smp.at(o.ix, o.iy) > 0)) continue;
        if (lowF && o.z < 0 && behindSkull(cam, p)) continue;
        sm = sampleOri(cam, o.ix, o.iy);
        if (!sm || !(sm.coherence >= G.minCoh)) continue;
        if (!cam.sR && G.glossSkip && cam.rgb && Math.abs(Math.sin(sm.angle)) < G.glossFlat) {   // (2026-10-10f) 광택 띠의 수평 결은 안 읽음
          var gx = Math.floor(o.ix * cam.kx), gy = Math.floor(o.iy * cam.ky);
          if (gx >= 0 && gy >= 0 && gx < cam.mw && gy < cam.mh) {
            var gi = (gy * cam.mw + gx) * 3, lu = 0.299 * cam.rgb[gi] + 0.587 * cam.rgb[gi + 1] + 0.114 * cam.rgb[gi + 2], gl = (lu - cam.hairLum) / Math.max(20, 255 - cam.hairLum);
            if (gl >= G.glossLo) {
              // (2026-10-10i) 둘레(위·아래·옆 glossNbr px)의 결과 같으면 진짜 결(넘겨 세운 앞머리처럼 옆으로 누운 밝은 머리) — 안 버림
              var agree = 0, seenN = 0, dn, nxp, nyp, smn;
              for (dn = 0; G.glossNbrKeep !== false && dn < 4; dn++) {
                nxp = o.ix + (dn === 0 ? G.glossNbr : dn === 1 ? -G.glossNbr : 0) / cam.kx; nyp = o.iy + (dn === 2 ? G.glossNbr : dn === 3 ? -G.glossNbr : 0) / cam.ky;
                var gx2 = Math.floor(nxp * cam.kx), gy2 = Math.floor(nyp * cam.ky); if (gx2 < 0 || gy2 < 0 || gx2 >= cam.mw || gy2 >= cam.mh) continue;
                var gi2 = (gy2 * cam.mw + gx2) * 3, lu2 = 0.299 * cam.rgb[gi2] + 0.587 * cam.rgb[gi2 + 1] + 0.114 * cam.rgb[gi2 + 2];
                if ((lu2 - cam.hairLum) / Math.max(20, 255 - cam.hairLum) >= G.glossLo) continue;   // 둘레도 밝으면 판단 안 함
                smn = sampleOrientation(cam.ori, nxp * cam.kx, cam.mw, nyp * cam.ky); if (!smn || !(smn.coherence >= G.minCoh)) continue;
                seenN++; var dd2 = Math.abs(((smn.angle - sm.angle) % Math.PI + Math.PI) % Math.PI); if (dd2 > Math.PI / 2) dd2 = Math.PI - dd2; if (dd2 < 0.52) agree++;
              }
              if (!(seenN >= 2 && agree * 2 >= seenN)) { glossN++; continue; }
              glossKeep++;
            }
          }
        }
        ncx = R[0] * n.x + R[1] * n.y + R[2] * n.z; ncy = R[3] * n.x + R[4] * n.y + R[5] * n.z;
        dX = Math.cos(sm.angle) * cam.s; dY = -Math.sin(sm.angle) * cam.sy;
        dZ = -(dX * ncx + dY * ncy) / ncz;
        l = Math.hypot(dX, dY);
        if (flat && G.tri3D) {                                               // (2026-10-11a) 사진마다 "이 방향을 품는 평면"(시선축 + 사진 결) — 여러 장이면 평면들의 교선 = 3D 방향
          var tax = R[0] * dX + R[3] * dY, tay = R[1] * dX + R[4] * dY, taz = R[2] * dX + R[5] * dY;
          var tmx = tay * R[8] - taz * R[7], tmy = taz * R[6] - tax * R[8], tmz = tax * R[7] - tay * R[6], tml = Math.sqrt(tmx * tmx + tmy * tmy + tmz * tmz);
          if (tml > 1e-9) { tmx /= tml; tmy /= tml; tmz /= tml; var tw = sm.coherence; TM[0] += tw * tmx * tmx; TM[1] += tw * tmx * tmy; TM[2] += tw * tmx * tmz; TM[3] += tw * tmy * tmy; TM[4] += tw * tmy * tmz; TM[5] += tw * tmz * tmz; TM[6] += tw; TV.push(R[6], R[7], R[8]); }
        }
        if (lowF) continue;
        var zl = (flat && G.backFix) ? G.freeDepth : 3;                                     // 스치는 각에서 깊이가 터지는 것 막음(두피 밖은 더 좁게)
        if (Math.abs(dZ) > zl * l) dZ = (dZ < 0 ? -zl : zl) * l;
        mx = R[0] * dX + R[3] * dY + R[6] * dZ; my = R[1] * dX + R[4] * dY + R[7] * dZ; mz = R[2] * dX + R[5] * dY + R[8] * dZ;
        l = Math.hypot(mx, my, mz); if (!(l > 1e-12)) continue;
        mx /= l; my /= l; mz /= l;
        if (ref) {
          dot = mx * ref.x + my * ref.y + mz * ref.z;
          if (polW > 0) {                                                   // (2026-10-10f) 오르막에만 벌점 — 내리막 = 아래(0,-1,0)를 이 자리 두피면에 놓은 방향(정수리처럼 평평한 곳은 짧아져 저절로 약해짐)
            var kd = -n.y, ddx = -kd * n.x, ddy = -1 - kd * n.y, ddz = -kd * n.z, b = mx * ddx + my * ddy + mz * ddz;
            var ddl = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz), sl = G.polSlopeHi > G.polSlopeLo ? Math.max(0, Math.min(1, (ddl - G.polSlopeLo) / Math.max(1e-6, G.polSlopeHi - G.polSlopeLo))) : 1;   // (2026-10-10i) 완만한 곳(정수리·가마)은 벌점을 풂
            // 두 쪽 점수: 이 쪽 = dot + polW·min(0, b) · 반대쪽 = −dot + polW·min(0, −b). 옆으로 흐르는 결(b≈0 · 가마·가르마)은 그대로, 비탈에서 거꾸로 오르는 쪽만 막음
            var pw = polW * sl * sl * (3 - 2 * sl);
            dot = (dot + pw * Math.min(0, b)) - (-dot + pw * Math.min(0, -b));
          }
        }
        else if (wsum > 0) dot = mx * ax + my * ay + mz * az;
        else { pol = 0; try { pol = flowPolarityFor(sm.angle, sm); } catch (e) {} dot = pol < 0 ? -1 : 1; }
        if (dot < 0) { mx = -mx; my = -my; mz = -mz; }
        w = ncz * ncz * sm.coherence;
        if (TRF) { TRF.nc++; if (w > TRF.bw) { TRF.bw = w; TRF.best = i; TRF.coh = sm.coherence; } TRF.dirs.push(mx, my, mz, w); }
        ax += w * mx; ay += w * my; az += w * mz; wsum += w;
      }
      l = Math.hypot(ax, ay, az);
      if (TRF && l > 1e-9 && TRF.dirs.length > 4) { var sp = 0, j2; for (j2 = 0; j2 < TRF.dirs.length; j2 += 4) { var c2 = (TRF.dirs[j2] * ax + TRF.dirs[j2 + 1] * ay + TRF.dirs[j2 + 2] * az) / l; var a2 = Math.acos(Math.max(-1, Math.min(1, c2))) * 57.3; if (a2 > sp) sp = a2; } TRF.spr = sp; }
      if (!(l > 1e-9)) return null;
      var rx = ax / l, ry = ay / l, rz = az / l;
      if (flat && G.tri3D && TV.length >= 6) {                               // 시선축이 충분히 다른 두 장 이상일 때만(한 장이면 깊이를 모름 — 예전 방식)
        var sep = 0, a1, b1; for (a1 = 0; a1 < TV.length; a1 += 3) for (b1 = a1 + 3; b1 < TV.length; b1 += 3) { var cv = Math.abs(TV[a1] * TV[b1] + TV[a1 + 1] * TV[b1 + 1] + TV[a1 + 2] * TV[b1 + 2]); if (1 - cv > sep) sep = 1 - cv; }
        if (sep > 1 - Math.cos(G.tri3DMinDeg * Math.PI / 180)) {
          var lam = G.tri3DPrior * TM[6], nx0 = n.x, ny0 = n.y, nz0 = n.z;   // 약한 기대: 바깥(n) 쪽으로는 안 감
          var m00 = TM[0] + lam * nx0 * nx0, m01 = TM[1] + lam * nx0 * ny0, m02 = TM[2] + lam * nx0 * nz0, m11 = TM[3] + lam * ny0 * ny0, m12 = TM[4] + lam * ny0 * nz0, m22 = TM[5] + lam * nz0 * nz0;
          var tr = m00 + m11 + m22, vx = rx, vy = ry, vz = rz, it;                // 가장 작은 고유벡터 = (tr·I − M)의 가장 큰 고유벡터(거듭제곱)
          for (it = 0; it < 12; it++) { var qx = tr * vx - (m00 * vx + m01 * vy + m02 * vz), qy = tr * vy - (m01 * vx + m11 * vy + m12 * vz), qz = tr * vz - (m02 * vx + m12 * vy + m22 * vz), ql = Math.sqrt(qx * qx + qy * qy + qz * qz); if (!(ql > 1e-12)) break; vx = qx / ql; vy = qy / ql; vz = qz / ql; }
          if (vx * rx + vy * ry + vz * rz < 0) { vx = -vx; vy = -vy; vz = -vz; }
          triN++;
          return { x: vx, y: vy, z: vz };
        }
      }
      return { x: rx, y: ry, z: rz };
    }
    function mixDir(prev, d) {       // 관성
      var a = G.inertia, x = prev.x * a + d.x * (1 - a), y = prev.y * a + d.y * (1 - a), z = prev.z * a + d.z * (1 - a), l = Math.hypot(x, y, z);
      return l > 1e-6 ? { x: x / l, y: y / l, z: z / l } : d;
    }
    function smoothPts(pts) {        // 양 끝 고정, 가운데만 이웃 평균 쪽으로
      var n = pts.length, it, i, out;
      if (n < 4 || !(G.smooth > 0)) return pts;
      for (it = 0; it < G.smooth; it++) {
        out = new Array(n); out[0] = pts[0]; out[n - 1] = pts[n - 1];
        for (i = 1; i < n - 1; i++) out[i] = { x: pts[i].x * 0.5 + (pts[i - 1].x + pts[i + 1].x) * 0.25, y: pts[i].y * 0.5 + (pts[i - 1].y + pts[i + 1].y) * 0.25, z: pts[i].z * 0.5 + (pts[i - 1].z + pts[i + 1].z) * 0.25 };
        pts = out;
      }
      for (i = 1; i < n; i++) { try { pts[i] = ellipsoidPushOut(pts[i], Es.a, Es.b, Es.c, CY); } catch (e) {} }
      return pts;
    }
    function tangent(d, n) {
      var k = d.x * n.x + d.y * n.y + d.z * n.z, x = d.x - k * n.x, y = d.y - k * n.y, z = d.z - k * n.z, l = Math.hypot(x, y, z);
      return l > 1e-6 ? { x: x / l, y: y / l, z: z / l } : null;
    }

    /* ③ 두께 지도 */
    var T = new Float32Array(NC), known = new Uint8Array(NC), tStat = { measured: 0, filled: 0, zero: 0 };
    function buildThickness() {
      var r, c, i, ph, th, sp, n, h, miss, last, v, got;
      for (r = 0; r < NP; r++) for (c = 0; c < NT; c++) {
        i = r * NT + c;
        if (offScalp(i)) { T[i] = 0; known[i] = 2; continue; }
        ph = (r + 0.5) / NP * Math.PI; th = (c + 0.5) / NT * 2 * Math.PI - Math.PI;
        sp = { x: Es.a * Math.sin(ph) * Math.sin(th), y: CY + Es.b * Math.cos(ph), z: Es.c * Math.sin(ph) * Math.cos(th) };
        n = normalAt(sp); miss = 0; last = 0; got = false;
        for (h = G.tStep; h <= G.tMax; h += G.tStep) {
          v = voteOutline({ x: sp.x + n.x * h, y: sp.y + n.y * h, z: sp.z + n.z * h }, n);
          if (v === 0) { if (++miss >= 2) { got = true; break; } }
          else { if (v === 1) last = h; miss = 0; }
        }
        if (got) { T[i] = last; known[i] = 1; tStat.measured++; if (last <= 0) tStat.zero++; }
        else known[i] = 0;                                   // 끝까지 안 벗어남 = 이 방향은 사진이 두께를 못 잼
      }
      // 못 잰 칸은 잰 이웃으로 메움
      var it, any, tmp = new Float32Array(NC), k2 = new Uint8Array(NC), dr, dc, rr, cc, j, sum, cnt;
      for (it = 0; it < 64; it++) {
        any = false; tmp.set(T); k2.set(known);
        for (r = 0; r < NP; r++) for (c = 0; c < NT; c++) {
          i = r * NT + c; if (known[i] !== 0) continue;
          sum = 0; cnt = 0;
          for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
            rr = r + dr; if (rr < 0 || rr >= NP) continue; cc = ((c + dc) % NT + NT) % NT; j = rr * NT + cc;
            if (known[j] === 1) { sum += T[j]; cnt++; }
          }
          if (cnt) { tmp[i] = sum / cnt; k2[i] = 1; tStat.filled++; any = true; }
        }
        T.set(tmp); known.set(k2);
        if (!any) break;
      }
      var fb = Math.max(G.tFloor, (Eh.a - Es.a + Eh.c - Es.c) / 2);
      for (i = 0; i < NC; i++) if (known[i] === 0) { T[i] = fb; known[i] = 1; tStat.filled++; }
      // 한 번 고르게(두피 안 칸끼리만)
      tmp.set(T);
      for (r = 0; r < NP; r++) for (c = 0; c < NT; c++) {
        i = r * NT + c; if (known[i] !== 1) continue;
        sum = 0; cnt = 0;
        for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
          rr = r + dr; if (rr < 0 || rr >= NP) continue; cc = ((c + dc) % NT + NT) % NT; j = rr * NT + cc;
          if (known[j] === 1) { var wgt = (dr === 0 && dc === 0) ? 4 : (dr === 0 || dc === 0) ? 2 : 1; sum += T[j] * wgt; cnt += wgt; }
        }
        tmp[i] = cnt ? sum / cnt : T[i];
      }
      for (i = 0; i < NC; i++) if (known[i] === 1) T[i] = Math.max(G.tFloor, Math.min(G.tMax, tmp[i]));
    }
    function thickAt(p) {            // 이웃 칸과 보간(두피 안 칸끼리만)
      var cy = Math.max(-1, Math.min(1, (p.y - CY) / Es.b)), fr = Math.acos(cy) / Math.PI * NP - 0.5, fc = (Math.atan2(p.x / Es.a, p.z / Es.c) + Math.PI) / (2 * Math.PI) * NT - 0.5;
      var r0 = Math.floor(fr), c0 = Math.floor(fc), tr = fr - r0, tc = fc - c0, sum = 0, wsum = 0, dr, dc, rr, cc, j, w;
      for (dr = 0; dr <= 1; dr++) for (dc = 0; dc <= 1; dc++) {
        rr = Math.max(0, Math.min(NP - 1, r0 + dr)); cc = ((c0 + dc) % NT + NT) % NT; j = rr * NT + cc;
        if (known[j] !== 1) continue;
        w = (dr ? tr : 1 - tr) * (dc ? tc : 1 - tc);
        sum += w * T[j]; wsum += w;
      }
      return wsum > 1e-6 ? sum / wsum : G.tFloor;
    }

    var info;
    /* 길이 상한·색 팔레트 — 원본 사진 가닥에서 */
    var lenBy = {}, colBy = {}, allLen = [];
    photo.strands.forEach(function (s) {
      var k = s.sec || 'crown', p = s.pts, L = 0, j;
      for (j = 1; j < p.length; j++) L += Math.hypot(p[j].x - p[j - 1].x, p[j].y - p[j - 1].y, p[j].z - p[j - 1].z);
      (lenBy[k] || (lenBy[k] = [])).push(L); allLen.push(L);
      if (s.color) { var cl = colBy[k] || (colBy[k] = []); if (cl.length < 400) cl.push(s.color); }
    });
    info = { isLong: false, skipY: {}, plantY: {} };
    var lowTips = 0;
    photo.strands.forEach(function (s) { if (s.pts[s.pts.length - 1].y < yBody) lowTips++; });
    var isLong = lowTips / Math.max(1, photo.strands.length) > G.longShare;
    var cPct = isLong ? G.longPct : G.lenPct, cMul = isLong ? G.longMul : G.lenMul;
    info.isLong = isLong;
    /* (2026-10-04e) backFix — 뒷머리(두피를 뒤쪽에서 벗어난 가닥)가 목을 감아 앞으로 쏠리는 것 막기
       실측: 앞·옆 사진에서 머리를 어깨 앞으로 넘긴 손님 → 목덜미 가닥이 전부 목 앞으로 감겨 가고 뒤는 목이 드러남.
       원인 ① 두피 밖 구간에서도 사진의 2D 결을 "두상을 감싼 면 위의 방향"으로 올려서, 뒤 사진 가장자리에서
              조금만 옆으로 흐르면 깊이(앞쪽) 움직임이 그 3배까지 붙었음 → 목을 감아 앞으로.
            ② 앞으로 간 자리는 앞·옆 사진(어깨 앞으로 넘긴 머리)이 "머리 맞음"이라고 해 줘서 계속 자람.
       고침 ① 두피 밖 구간은 깊이 움직임을 freeDepth배까지만.
            ② 뒤쪽에서 두피를 벗어난 가닥은 앞(z+)으로 못 감(뒤쪽일수록 강하게).
            ③ 그 가닥의 길이는 뒤 사진이 정함 — 뒤 사진에서 뜬 가닥들의 끝 높이까지는 다른 사진이 "머리 없음"이라 해도 이어 감. */
    var backTips = [], lowAll = [];
    if ((G.backFix || G.hangDown) && isLong) {
      photo.strands.forEach(function (s) { var ty = s.pts[s.pts.length - 1].y; if (ty < yBody) { lowAll.push(ty); if (s.srcAngle === 'back') backTips.push(ty); } });
      backTips.sort(function (x, y) { return x - y; });               // 낮은(긴) 것부터
      lowAll.sort(function (x, y) { return x - y; });
    }
    var backTipOK = backTips.length >= 20;
    var hangTips = (G.hangDown && isLong) ? (backTipOK ? backTips : (lowAll.length >= 20 ? lowAll : null)) : null;   // (v6) 곧게 내릴 끝 높이 분포
    var capAll = q(allLen, cPct) * cMul, cap = {};
    Object.keys(lenBy).forEach(function (k) { cap[k] = q(lenBy[k], cPct) * cMul; });
    function capFor(sec) { return cap[sec] > 0 ? cap[sec] : (capAll > 0 ? capAll : 0.5); }

    /* 뿌리 예산(마네킹과 같은 식: 밀도 × 셀 면적) */
    var yStep = (grid.yTopH - grid.yBot) / (grid.NY - 1);
    function bucketOfY(y) { return Math.min(grid.NY - 1, Math.max(0, Math.round((grid.yTopH - y) / yStep))); }
    var areas = null;
    try { areas = headSurfaceCellAreas(grid.hullW, grid.hullD, bucketOfY, CY, roots.b, NT, NP); } catch (e) { areas = null; }
    var wgt = new Float64Array(NC), wTot = 0, i;
    for (i = 0; i < NC; i++) {
      if (offScalp(i)) continue;
      var den = roots.den[i]; if (!(den > bald)) continue;
      wgt[i] = den * (areas ? areas[i] : 1); wTot += wgt[i];
    }
    if (!(wTot > 0)) return { err: '뿌리밀도가 전부 0' };
    /* (2026-10-12e) 재는 용도로만 기를 때는 덜 기름 — 화면의 원본 머리는 마네킹 + 스펙(58번)이라 기른 가닥은 결 표·길이·두께를 재는 데만 씀.
       실측(저장된 가닥을 솎아 결 표를 다시 만들어 비교 · 긴 웨이브·긴 직모): 앞·관자놀이는 그대로, 나머지 절반 → 표대로 만든 가닥의 차이 중앙값 0.1cm · 90% 0.3cm · 99% 1cm.
       1/3은 정수리 막다른 무리 판정이 빠지는 경우가 있어 절반까지만. 58번이 꺼져 있으면(기른 가닥을 그대로 보여 줌) 전부 기름. */
    var mShare = 1, kc = null;
    try { if (G.measureShare > 0 && G.measureShare < 1 && W.ORIG_MQ && W.ORIG_MQ.on !== false) mShare = G.measureShare; } catch (e) { mShare = 1; }
    if (mShare < 1) try {
      kc = new Float32Array(NC); var keepSec = G.measureFull || [], rr, cc2, phC, thC, FC, secC;
      for (i = 0; i < NC; i++) {
        if (!wgt[i]) continue;
        rr = i / NT | 0; cc2 = i % NT; phC = (rr + 0.5) / NP * Math.PI; thC = (cc2 + 0.5) / NT * 2 * Math.PI - Math.PI;
        FC = { x: Es.a * Math.sin(phC) * Math.sin(thC), y: CY + Es.b * Math.cos(phC), z: Es.c * Math.sin(phC) * Math.cos(thC) };
        secC = null; try { secC = resolveSection3D(FC, CY, Es.b); } catch (e) {}
        kc[i] = keepSec.indexOf(secC || 'crown') >= 0 ? 1 : mShare;
      }
    } catch (e) { kc = null; mShare = 1; }
    // (2026-10-04d) 가닥 수 = 48번(STRAND_BUDGET.total · 기본 30,000). 없으면 예전처럼 사진 가닥 수.
    var total = (W.STRAND_BUDGET && W.STRAND_BUDGET.on !== false && W.STRAND_BUDGET.total > 0) ? W.STRAND_BUDGET.total : photo.strands.length;

    var st = { n: 0, stub: 0, skipped: 0, steps: 0, est: 0, stopMask: 0, stopCap: 0, stopMax: 0, free: 0, flipped: 0,
      backN: 0, backFwd: 0, backKeep: 0, backLen: [], neckPush: 0, hangN: 0, hangSteps: 0, stopTip: 0,
      len: [], kink: [], sec: {} };
    var down = { x: 0, y: -1, z: 0 };

    var cmU = 18.6; try { cmU = modelCmPerUnit() || cmU; } catch (e) {}
    function room(F, n, dt, sgn) {       // 그 방향으로 몇 걸음까지 머리가 있나(짧게 내다봄)
      var k, f = F, nn = n, cnt = 0, d = { x: dt.x * sgn, y: dt.y * sgn, z: dt.z * sgn }, t2;
      for (k = 0; k < 4; k++) {
        f = onSurf({ x: f.x + d.x * G.step, y: f.y + d.y * G.step, z: f.z + d.z * G.step });
        nn = normalAt(f);
        if (vote({ x: f.x + nn.x * G.tFloor, y: f.y + nn.y * G.tFloor, z: f.z + nn.z * G.tFloor }) === 0) break;
        cnt++;
        t2 = tangent(d, nn); if (t2) d = t2;
      }
      return cnt;
    }

    /* (2026-10-11d) 뿌리 칸마다 결의 앞뒤를 미리 정함 — 또렷한 칸(아래·뒤로 흐름)은 그대로, 옆으로 흐린 칸은 이웃 칸들 쪽으로(되풀이해서 퍼뜨림) */
    var polMap = null, polStat = { sure: 0, nbr: 0, mid: 0 };
    if (G.polNbr) try {
      polMap = new Float32Array(NC * 4);                                    // x,y,z,상태(1 또렷 · 2 이웃으로 정함 · 0 모름)
      var rr, cc, ci2;
      for (rr = 0; rr < NP; rr++) for (cc = 0; cc < NT; cc++) {
        ci2 = rr * NT + cc; if (offScalp(ci2)) continue;
        var ph0 = (rr + 0.5) / NP * Math.PI, th0 = (cc + 0.5) / NT * 2 * Math.PI - Math.PI;
        var F0c = { x: Es.a * Math.sin(ph0) * Math.sin(th0), y: CY + Es.b * Math.cos(ph0), z: Es.c * Math.sin(ph0) * Math.cos(th0) }, n0c = normalAt(F0c);
        var f0 = flow(F0c, n0c, null); if (!f0) continue;
        var t0c = tangent(f0, n0c); if (!t0c) continue;
        var sg0 = 0;
        if (Math.abs(t0c.y) > 0.3) sg0 = t0c.y < 0 ? 1 : -1; else if (Math.abs(t0c.z) > 0.3) sg0 = t0c.z < 0 ? 1 : -1;
        polMap[ci2 * 4] = t0c.x * (sg0 || 1); polMap[ci2 * 4 + 1] = t0c.y * (sg0 || 1); polMap[ci2 * 4 + 2] = t0c.z * (sg0 || 1); polMap[ci2 * 4 + 3] = sg0 ? 1 : 0;
        if (sg0) polStat.sure++;
      }
      for (var pass = 0; pass < 12; pass++) {
        var changed = 0;
        for (ci2 = 0; ci2 < NC; ci2++) {
          if (polMap[ci2 * 4 + 3] !== 0 || (polMap[ci2 * 4] === 0 && polMap[ci2 * 4 + 1] === 0 && polMap[ci2 * 4 + 2] === 0)) continue;
          rr = ci2 / NT | 0; cc = ci2 % NT; var sum = 0, dr, dc;
          for (dr = -1; dr <= 1; dr++) for (dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue; var pr2 = rr + dr, pc2 = (cc + dc + NT) % NT; if (pr2 < 0 || pr2 >= NP) continue;
            var cj = pr2 * NT + pc2; if (polMap[cj * 4 + 3] === 0) continue;
            sum += polMap[ci2 * 4] * polMap[cj * 4] + polMap[ci2 * 4 + 1] * polMap[cj * 4 + 1] + polMap[ci2 * 4 + 2] * polMap[cj * 4 + 2];
          }
          if (Math.abs(sum) > 0.15) { if (sum < 0) { polMap[ci2 * 4] *= -1; polMap[ci2 * 4 + 1] *= -1; polMap[ci2 * 4 + 2] *= -1; } polMap[ci2 * 4 + 3] = 2; polStat.nbr++; changed++; }
        }
        if (!changed) break;
      }
    } catch (e) { polMap = null; }

    function grow(cellIdx) {
      var r = cellIdx / NT | 0, c = cellIdx % NT;
      var ph = (r + rnd()) / NP * Math.PI, th = (c + rnd()) / NT * 2 * Math.PI - Math.PI;
      var F = { x: Es.a * Math.sin(ph) * Math.sin(th), y: CY + Es.b * Math.cos(ph), z: Es.c * Math.sin(ph) * Math.cos(th) };
      var n = normalAt(F), u = G.layerLo + (G.layerHi - G.layerLo) * rnd();
      var sec = null; try { sec = resolveSection3D(F, CY, Es.b); } catch (e) {} sec = sec || 'crown';
      var Lcap = capFor(sec), ramp = Math.max(0.03, Math.min(0.12, 0.25 * Lcap));
      var stp = Math.max(G.step, Lcap / G.maxSteps);      // 긴 가닥은 걸음을 넓혀 걸음 수 상한에 안 걸리게
      var tRoot = thickAt(F), rootY = F.y;
      var pts = [{ x: F.x, y: F.y, z: F.z }], P = F, s = 0, prev = null, miss = 0, k, d, dt, fl, estSteps = 0, steps = 0, free = false, stop = 'max';
      var bw = 0, myTip = null, exitI = -1, exitY = 0, exitZ = 0;           // backFix: 뒤쪽 정도(0~1) · 이 가닥이 내려갈 끝 높이 · 두피를 벗어난 자리(점 번호·높이·깊이)
      var hangTip = null, hung = false;                                     // (v6) 곧게 내릴 끝 높이 · 곧게 내린 적 있음
      var sOn = 0, sFree = 0, nBack = 0, nNeck = 0, nEst = 0, TS = G.trace ? [] : null;   // (2026-10-10a) 걸음 기록
      function rec(ph, est, ex2) {                                          // 걸음 하나: [단계 0두피위 1두피밖 2곧게내림, 결 못읽음, 쓴 사진 수, 주로 쓴 사진, 그 사진 결 또렷함, 사진끼리 벌어진 각, 따로 막은 것(1 앞쏠림 2 목), 머리 영역 표, x,y,z]
        if (!TS) return; var f2 = TRF || {}; TS.push(ph, est ? 1 : 0, f2.nc || 0, f2.best == null ? -1 : f2.best, Math.round((f2.coh || 0) * 100), Math.round(f2.spr || 0), ex2 || 0);
      }
      if (TS) TRF = {};

      // 첫 방향과 앞뒤
      fl = flow(F, n, null);
      d = fl || down; if (!fl) estSteps++;
      dt = tangent(d, n) || tangent({ x: 0.3, y: -1, z: 0.2 }, n) || { x: 1, y: 0, z: 0 };
      var sgn;
      if (Math.abs(dt.y) > 0.3) sgn = dt.y < 0 ? 1 : -1;                    // 아래쪽
      else if (Math.abs(dt.z) > 0.3) sgn = dt.z < 0 ? 1 : -1;               // 수평이면 뒤쪽
      else if (polMap && polMap[cellIdx * 4 + 3] > 0) sgn = (dt.x * polMap[cellIdx * 4] + dt.y * polMap[cellIdx * 4 + 1] + dt.z * polMap[cellIdx * 4 + 2]) >= 0 ? 1 : -1;   // (2026-10-11d) 이웃 뿌리들의 방향
      else { sgn = dt.x * F.x >= 0 ? 1 : -1; polStat.mid++; }               // 이웃도 모름 — 예전처럼 가운데 선 바깥쪽
      var r1 = room(F, n, dt, sgn);
      var flip = 0, tCm0 = tRoot * cmU;
      var polK = G.polThickHi > G.polThickLo ? Math.max(0, Math.min(1, (G.polThickHi - tCm0) / (G.polThickHi - G.polThickLo))) : 1;   // (2026-10-10g) 두꺼운(세운) 자리는 오르막 허용
      if (r1 < 2) {
        var r2 = room(F, n, dt, -sgn);
        if (r2 > r1) {
          var tCm = tRoot * cmU;
          if (!(G.flipThickCm > 0) || tCm >= G.flipThickCm) { sgn = -sgn; st.flipped++; flip = 1; }
          else {                                                                     // (2026-10-10c) 얇은 자리 — 위로 안 뒤집음
            st.flipKept = (st.flipKept || 0) + 1; flip = 2;
            // (2026-10-10d) 아래로는 곧 머리가 끝나니(이마·목덜미) 두피를 따라 옆으로 눕힘 — 가르마 바깥쪽 · 앞이면 옆·뒤쪽. 옆으로도 자리가 없으면 아래 그대로(짧게)
            var sx = F.x >= 0 ? 1 : -1, sideD = tangent({ x: sx, y: -0.35, z: F.z > 0 ? -0.25 : 0 }, n);
            var frontRoot = F.z > 0 && Math.abs(Math.atan2(F.x, F.z)) < 0.87;          // 앞 헤어라인(±50°)만 옆으로 — 옆·목덜미는 아래로 짧게(구레나룻·목덜미 짧은 머리)
            if (frontRoot && sideD && room(F, n, sideD, 1) >= 2) { dt = sideD; sgn = 1; st.flipSide = (st.flipSide || 0) + 1; flip = 3; }
          }
        }
      }
      prev = { x: dt.x * sgn, y: dt.y * sgn, z: dt.z * sgn };

      for (k = 0; k < (G.lenCap ? G.maxSteps : G.maxSteps * 3); k++) {
        steps++;
        if (!free) {
          // 두피 위 구간: 발은 두피면을 따라, 몸은 그 위 두께만큼 떠서
          polW = (flip === 1) ? 0 : (G.polDown || 0) * polK; fl = flow(P, n, prev); polW = 0; if (!fl) { estSteps++; nEst++; }
          if (fl) fl = mixDir(prev, fl);
          dt = tangent(fl || prev, n) || prev;
          var F2 = onSurf({ x: F.x + dt.x * stp, y: F.y + dt.y * stp, z: F.z + dt.z * stp });
          if (offScalp(cellOf(F2))) {
            if (flip === 3 && G.sideLayStay) { stop = 'side'; st.sideEnd = (st.sideEnd || 0) + 1; break; }   // (2026-10-11p) 옆으로 눕힌 가닥은 두피 밖으로 안 나감
            free = true; st.free++; prev = dt; k--; steps--; exitI = pts.length - 1; exitY = P.y; exitZ = P.z;
            if (G.backFix) {                                                // 두피를 벗어난 자리가 얼마나 뒤쪽인가
              var ex = P.x / Es.a, ez = P.z / Es.c, eh = Math.hypot(ex, ez);
              var tb = eh > 1e-6 ? -ez / eh : 0, tt = Math.max(0, Math.min(1, (tb - G.backFrom) / Math.max(1e-6, G.backFull - G.backFrom)));
              bw = tt * tt * (3 - 2 * tt);
              if (bw >= 0.5) { st.backN++; if (backTipOK) myTip = backTips[Math.min(backTips.length - 1, Math.floor(backTips.length * (0.25 + 0.5 * rnd())))]; }
            }
            if (hangTips) hangTip = hangTips[Math.min(hangTips.length - 1, Math.floor(hangTips.length * (0.25 + 0.5 * rnd())))];
            continue;
          }
          var n2 = normalAt(F2), s2 = s + stp, h2 = u * thickAt(F2) * Math.min(1, s2 / ramp);
          var P2 = { x: F2.x + n2.x * h2, y: F2.y + n2.y * h2, z: F2.z + n2.z * h2 };
          var v2 = vote(P2); if (TS) { rec(0, !fl, 0); TS.push(v2 ? 1 : 0, P2.x, P2.y, P2.z); }
          // (2026-10-10j) 사진 윤곽으로 잰 머리 두께가 거의 없는 자리(페이드·짧게 민 옆·뒤)로는 위에서 내려온 긴 머리가 못 덮음 — 덮었다면 윤곽이 두꺼웠을 것
          if (G.thinStopCm > 0 && tCm0 >= G.thinStopRoot && s2 > G.thinStopAfter / cmU && thickAt(F2) * cmU < G.thinStopCm) { stop = 'mask'; st.thinStop = (st.thinStop || 0) + 1; break; }
          if (v2 === 0) { if (++miss >= 2) { stop = 'mask'; break; } } else miss = 0;
          if (G.onScalpLen && !isLong && s2 > Math.max(G.minLenCm / cmU, G.liftK * tRoot)) { stop = 'len'; st.lenThick = (st.lenThick || 0) + 1; pts.push(P2); break; }
          if (flip === 3 && G.sideLayStay && s2 >= Lcap) { stop = 'side'; st.sideEnd = (st.sideEnd || 0) + 1; pts.push(P2); break; }   // (2026-10-11p) 옆으로 눕힌 가닥의 길이 = 그 섹션 상한까지(10f 때와 같음)
          pts.push(P2); F = F2; n = n2; P = P2; s = s2; sOn += stp; prev = tangent(dt, n2) || dt;
        } else {
          // 두피 밖 구간: 결 + 중력, 두상 안으로는 못 들어감
          var hangNow = hangTip != null && P.y < yBody;                     // (v6) 턱·목덜미 아래 — 사진 결을 안 읽고 곧게 아래로
          var exB = 0;
          if (hangNow) {
            if (TRF) { TRF.nc = 0; TRF.best = -1; TRF.coh = 0; TRF.spr = 0; }
            var hk = G.hangK, hx = prev.x * (1 - hk), hy = prev.y * (1 - hk) - hk, hz = prev.z * (1 - hk), hl = Math.hypot(hx, hy, hz) || 1;
            d = { x: hx / hl, y: hy / hl, z: hz / hl };
            if (!hung) { hung = true; st.hangN++; }
            st.hangSteps++;
          } else {
            var rr = Math.hypot(P.x, P.z), nc = rr > 1e-6 ? { x: P.x / rr, y: 0, z: P.z / rr } : n;
            fl = flow(P, nc, prev, true); if (!fl) { estSteps++; nEst++; }
            d = fl ? mixDir(prev, fl) : prev;
            if (!G.backFoldAfter && bw > 0 && d.z > 0) {                      // 뒷머리는 앞으로 못 감 — (2026-10-12d) backFoldAfter면 여기서 안 막고 다 읽은 뒤 뒤로 넘김
              var fz = d.z * (1 - bw), fl2 = Math.hypot(d.x, d.y, fz);
              d = fl2 > 0.2 ? { x: d.x / fl2, y: d.y / fl2, z: fz / fl2 } : down;
              st.backFwd++; nBack++; exB = 1;
            }
            var gx = d.x * (1 - G.gravity), gy = d.y * (1 - G.gravity) - G.gravity, gz = d.z * (1 - G.gravity), gl = Math.hypot(gx, gy, gz) || 1;
            d = { x: gx / gl, y: gy / gl, z: gz / gl };
          }
          var Q = { x: P.x + d.x * stp, y: P.y + d.y * stp, z: P.z + d.z * stp };
          try { Q = ellipsoidPushOut(Q, Es.a * 1.02, Es.b * 1.02, Es.c * 1.02, CY); } catch (e) {}
          var Qn = G.neckPush(Q); if (Qn !== Q) { Q = Qn; st.neckPush++; nNeck++; exB = exB | 2; }
          if (hangNow) {                                                    // 끝 높이까지는 사진과 상관없이 이어 감
            if (Q.y <= hangTip) { miss = 0; stop = 'tip'; break; }
            miss = 0; if (TS) { rec(2, 0, exB); TS.push(1, Q.x, Q.y, Q.z); }
            pts.push({ x: Q.x, y: Q.y, z: Q.z }); P = Q; s += stp; sFree += stp; prev = d;
            if (G.lenCap && s >= Lcap) { stop = 'cap'; break; }
            continue;
          }
          var vq = vote(Q);
          // 뒤 사진의 머리 끝 높이까지는 이어 감 — (2026-10-04g) 아래로 늘어지는 중이고 두상 폭 안쪽일 때만.
          // 실측: 위·옆으로 튀어 나간 가닥까지 이어 가서 머리 밖으로 큰 고리가 몇 가닥 생겼음.
          if (vq === 0 && myTip != null && Q.y > myTip && d.y < -0.5) {
            var fx = Q.x / (Es.a * 1.3), fz2 = Q.z / (Es.c * 1.3);
            if (fx * fx + fz2 * fz2 <= 1) { vq = 1; st.backKeep++; }
          }
          if (TS) { rec(1, !fl, exB); TS.push(vq ? 1 : 0, Q.x, Q.y, Q.z); }
          if (vq === 0) { if (++miss >= 2) { stop = 'mask'; break; } } else miss = 0;
          pts.push({ x: Q.x, y: Q.y, z: Q.z }); P = Q; s += stp; sFree += stp; prev = d;
        }
        if (G.lenCap && s >= Lcap) { stop = 'cap'; break; }
      }
      if (miss > 0) pts.length = Math.max(1, pts.length - miss);        // 머리 영역 밖으로 나간 꼬리는 버림
      if (pts.length < 3 && flip === 2 && G.stubCm > 0) {                 // (2026-10-10e) 안 뒤집은 얇은 자리 — 짧은 머리로 심음(안 심으면 결 표가 이웃 칸의 긴 길이를 가져와 귀 옆이 길게 늘어짐)
        var sd = tangent(down, normalAt(pts[0])) || down, sl = G.stubCm / cmU, b0 = pts[0], nn0 = normalAt(b0), hh = 0.3 * thickAt(b0);
        pts = [b0, { x: b0.x + sd.x * sl * 0.5 + nn0.x * hh, y: b0.y + sd.y * sl * 0.5 + nn0.y * hh, z: b0.z + sd.z * sl * 0.5 + nn0.z * hh }, { x: b0.x + sd.x * sl + nn0.x * hh, y: b0.y + sd.y * sl + nn0.y * hh, z: b0.z + sd.z * sl + nn0.z * hh }];
        st.stub = (st.stub || 0) + 1; stop = 'mask';
      }
      if (pts.length < 3) { st.skipped++; (info.skipY[sec] || (info.skipY[sec] = [])).push(rootY); return null; }   // 사진에 머리가 없는 자리 — 그루터기를 억지로 세우지 않음
      (info.plantY[sec] || (info.plantY[sec] = [])).push(rootY);
      if (G.backFix && G.backFoldAfter && free && bw > 0 && exitI >= 0 && pts.length > exitI + 1) {   // (2026-10-12d) 다 읽은 뒤: 뒤쪽에서 나온 가닥을 어깨 아래에서 뒤로 넘김(위는 읽은 그대로)
        var fK = Math.max(0, Math.min(1, bw / Math.max(1e-6, G.backFoldBw))); fK = fK * fK * (3 - 2 * fK);
        var yF = Math.min(exitY, yBody - G.backFoldDropCm / cmU), rF = Math.max(1e-6, G.backFoldRampCm / cmU), movedF = 0, iF, pF, wF;
        var dzF = -1;                                                     // (2026-10-12q) 눌러 펴지 않고 통째로 뒤로 옮김 — 사용자: "어깨가 비고 · 뒷모습 아래쪽이 퍼지질 않고 일자"
        for (iF = exitI + 1; iF < pts.length; iF++) {                    //   예전: 어깨 아래 점마다 앞으로 나온 만큼을 지워(z → 두피 벗어난 깊이) 모든 가닥이 한 판으로 눌림 → 출렁임·퍼짐이 사라짐(이 손님 21,629가닥)
          pF = pts[iF]; if (!(pF.y < yF)) continue;                      //   지금: 어깨 높이에서 앞으로 나와 있던 만큼(dzF)만 아래 전체를 뒤로 평행 이동 → 가닥 모양·가닥끼리의 벌어짐은 그대로 · 예전 = REGROW.backFoldFlat=true
          if (dzF < 0) dzF = Math.max(0, pF.z - exitZ);
          wF = Math.min(1, (yF - pF.y) / rF); wF = fK * wF * wF * (3 - 2 * wF); if (!(wF > 1e-4)) continue;
          var zN = G.backFoldFlat ? (pF.z > exitZ ? pF.z - wF * (pF.z - exitZ) : pF.z) : pF.z - wF * dzF;
          if (zN === pF.z) continue;
          pts[iF] = { x: pF.x, y: pF.y, z: zN }; movedF++;
        }
        if (movedF) { st.foldN = (st.foldN || 0) + 1; st.foldPts = (st.foldPts || 0) + movedF; }
      }
      pts = smoothPts(pts);
      if (straightOn && straightWinCm > 0) {                              // (2026-10-10s) 곱슬 — 사진 컬을 뼈대에서 빼고 축만 남김
        var L0s = 0, L1s = 0, iS; for (iS = 1; iS < pts.length; iS++) L0s += Math.hypot(pts[iS].x - pts[iS - 1].x, pts[iS].y - pts[iS - 1].y, pts[iS].z - pts[iS - 1].z);
        var ptsS = straightenPath(straightenPath(pts, straightWinCm / cmU), straightWinCm / cmU);
        if (ptsS !== pts && WFb) { try { WFb.add(pts, ptsS); } catch (e) {} }
        if (ptsS !== pts) { for (iS = 1; iS < ptsS.length; iS++) L1s += Math.hypot(ptsS[iS].x - ptsS[iS - 1].x, ptsS[iS].y - ptsS[iS - 1].y, ptsS[iS].z - ptsS[iS - 1].z); if (L0s > 0) straightShrink.push(L1s / L0s); pts = ptsS; nStraight++; }
      }
      if (bw >= 0.5 || hung) { try { pts._rgKeep = true; } catch (e) {} }  // 조정 단계의 "사진 영역 밖 다듬기"가 이 가닥을 다시 자르지 않게
      var Larc = 0, ii; for (ii = 1; ii < pts.length; ii++) Larc += Math.hypot(pts[ii].x - pts[ii - 1].x, pts[ii].y - pts[ii - 1].y, pts[ii].z - pts[ii - 1].z);
      var qi = Math.min(pts.length - 1, 6), ex = pts[qi].x - pts[0].x, ey = pts[qi].y - pts[0].y, ez = pts[qi].z - pts[0].z, el = Math.hypot(ex, ey, ez) || 1;
      var rg = { t: tRoot, free: free, L: Larc, tipY: pts[pts.length - 1].y, dx: ex / el, dy: ey / el, dz: ez / el,
        flip: flip, stop: stop, sOn: sOn, sFree: sFree, nEst: nEst, nBack: nBack, nNeck: nNeck, steps: steps, cap: Lcap, stp: stp, cell: cellIdx, den: roots.den[cellIdx], est0: roots.est ? roots.est[cellIdx] : 0 };
      if (TS) { TRF = null; if ((!free && (stop === 'cap' || stop === 'max')) || (st.n % Math.max(1, G.traceEvery | 0) === 0)) rg.trace = new Float32Array(TS); }
      if (stop === 'mask') st.stopMask++; else if (stop === 'cap') st.stopCap++; else if (stop === 'tip') st.stopTip++; else if (stop === 'len' || stop === 'side') { } else st.stopMax++;
      if (bw >= 0.5) st.backLen.push(Larc);
      st.steps += steps; st.est += estSteps;

      var view = 'front'; try { view = viewOfRoot(F0(pts)); } catch (e) {}
      var pal = colBy[sec] || colBy.crown, color = pal && pal.length ? pal[rnd() * pal.length | 0] : '#2B2320', colors = null;
      try { colors = bakeStrandColors3D(pts, photo, view, color, null); } catch (e) { colors = null; }
      return { pts: pts, sec: sec, color: color, colors: colors, srcAngle: view, rootFacing: 0, regrown: true, rg: rg };
    }
    function F0(p) { return p[0]; }

    var out = [], cell = 0, carry = 0, t0 = now(), thickDone = false;
    return {
      total: total,
      /* budget ms만큼 일하고 진행률(0~1) 반환. 1이면 끝 */
      step: function (budget) {
        var t = now();
        if (!thickDone) { buildThickness(); thickDone = true; return 0.08; }
        while (cell < NC && now() - t < budget) {
          if (wgt[cell]) {
            carry += wgt[cell] / wTot * total * (kc ? kc[cell] : 1);
            var nRoots = Math.floor(carry); carry -= nRoots;
            for (var j = 0; j < nRoots; j++) {
              var sdd = grow(cell);
              if (!sdd) continue;
              out.push(sdd); st.n++;
              st.sec[sdd.sec] = (st.sec[sdd.sec] || 0) + 1;
              if (st.n % 7 === 0) {            // 통계 표본
                var p = sdd.pts, L = 0, turn = 0, turns = 0, i2;
                for (i2 = 1; i2 < p.length; i2++) {
                  var ax = p[i2].x - p[i2 - 1].x, ay = p[i2].y - p[i2 - 1].y, az = p[i2].z - p[i2 - 1].z, al = Math.hypot(ax, ay, az);
                  L += al;
                  if (i2 > 1 && al > 1e-9) {
                    var bx = p[i2 - 1].x - p[i2 - 2].x, by = p[i2 - 1].y - p[i2 - 2].y, bz = p[i2 - 1].z - p[i2 - 2].z, bl = Math.hypot(bx, by, bz);
                    if (bl > 1e-9) { turn += Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by + az * bz) / (al * bl)))); turns++; }
                  }
                }
                st.len.push(L); if (turns) st.kink.push(turn / turns * 180 / Math.PI);
              }
            }
          }
          cell++;
        }
        return cell >= NC ? 1 : 0.08 + 0.92 * cell / NC;
      },
      finish: function () {
        var cm = 1; try { cm = modelCmPerUnit() || 1; } catch (e) {}
        // (2026-10-06p) 곱슬머리는 결 정렬을 약하게/안 함 — 곱슬 사진의 뼈대는 일부러 엇갈려 있고, 나란히 펴면 컬이 죽어 보임(사용자: "align=false로 하니까 돌아왔어")
        var alK = 1; if (!straightOn) try { var pcA = G.photoCurl(); if (pcA && pcA.raw > 0 && G.alignCurlOff > 0) alK = clampN(1 - pcA.raw / G.alignCurlOff, 0, 1); } catch (e) { alK = 1; }
        var al = null; try { al = G.alignStrands(out, CY, alK); } catch (e) { console.warn(TAG + ' 결 정렬 실패(그대로 둠)', e); }
        var tv = []; for (var k = 0; k < NC; k++) if (known[k] === 1 && !offScalp(k)) tv.push(T[k] * cm);
        S = G.stats = {
          ms: Math.round(now() - t0), mShare: mShare, n: st.n, stub: st.stub, skipped: st.skipped, sec: st.sec,
          lenMed: q(st.len, 0.5) * cm, lenP90: q(st.len, 0.9) * cm, kinkMed: q(st.kink, 0.5), kinkP90: q(st.kink, 0.9),
          estPct: st.steps ? st.est / st.steps * 100 : 0, stopMask: st.stopMask, stopCap: st.stopCap, stopMax: st.stopMax, free: st.free, flipped: st.flipped, flipKept: st.flipKept || 0, flipSide: st.flipSide || 0, stubN: st.stub || 0, glossN: glossN, glossKeep: glossKeep, thinStop: st.thinStop || 0, sideEnd: st.sideEnd || 0,
          isLong: isLong, capTxt: Object.keys(cap).map(function (k) { return k + ' ' + n1(cap[k] * cm); }).join(' · '),
          tMed: q(tv, 0.5), tP90: q(tv, 0.9), tMeasured: tStat.measured, tFilled: tStat.filled, tZero: tStat.zero, cells: NC,
          cams: cams.map(function (c) { return c.angle; }).join(','), hullN: hullN, triN: triN, vol: VOL ? { n: VOL.nx * VOL.ny * VOL.nz, inN: VOL.inN, tN: VOL.tightN, ms: VOL.ms, cm: G.volCellCm } : null, pol: polStat, lenThick: st.lenThick || 0, hullV: cams.filter(function (c) { return c.hull; }).map(function (c) { return c.angle; }).join(','), straight: straightOn ? straightNote.join(' · ') + ' · 편 가닥 ' + nStraight + '개 · 길이 남음(축/걸은 길) 중앙값 ' + (straightShrink.length ? q(straightShrink, 0.5).toFixed(2) : '-') : '',
          neckPush: st.neckPush, backFoldAfter: !!G.backFoldAfter, foldN: st.foldN || 0, foldPts: st.foldPts || 0, backFix: !!G.backFix, backN: st.backN, backFwd: st.backFwd, backKeep: st.backKeep, backLenMed: q(st.backLen, 0.5) * cm,
          align: al ? { on: al.on, skipped: !!al.skipped, kMul: al.kMul, strands: al.strands, segs: al.segs, rotMed: q(al.rot, 0.5), rotP90: q(al.rot, 0.9), trimmed: al.trimmed, trimCm: al.trimmed ? al.trimLen / al.trimmed * cm : 0, cells: al.cells, ms: Math.round(al.ms) } : null,
          backTipN: backTips.length, backTipCm: backTipOK ? (yTop - q(backTips, 0.5)) * cm : NaN,
          hang: !!hangTips, hangSrc: hangTips ? (hangTips === backTips ? '뒤 사진 가닥' : '전체 사진 가닥') : '', hangN: st.hangN, hangSteps: st.hangSteps, stopTip: st.stopTip,
          hangTipCm: hangTips ? [(yTop - q(hangTips, 0.75)) * cm, (yTop - q(hangTips, 0.25)) * cm] : null
        };
        var WFf = null; try { if (WFb) { var tWf = now(); WFf = WFb.finish(); S.wf = { known: WFf.known, n: WFf.nx * WFf.ny * WFf.nz, ampCm: WFf.ampU * cm, ampHiCm: WFf.ampHi * cm, strands: WFf.strands, samples: WFf.samples, ms: Math.round(now() - tWf), cellCm: G.waveCellCm }; } } catch (e) { WFf = null; console.warn(TAG + ' 굴곡 장 만들기 실패(없이 진행)', e); }
        return { strands: out, viewCal: photo.viewCal, yTop: photo.yTop, CY: photo.CY, field: photo.field || null, occ: photo.occ || null,
          grid: photo.grid, roots: photo.roots, mannequin: false, regrown: true, rgInfo: info, waveField: WFf };
      }
    };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * 모델 바꿔 끼우기 — state.hair3Dneutral이 (마네킹이 꺼져 있고 REGROW.on이면) 다시 기른 모델을 돌려줌
   * ────────────────────────────────────────────────────────────────────── */
  var desc = null;
  try { desc = Object.getOwnPropertyDescriptor(state, 'hair3Dneutral'); } catch (e) {}
  if (!desc || !desc.get || !desc.set || !desc.configurable) { console.warn(TAG + ' state.hair3Dneutral 접근자를 못 찾아 건너뜀'); return; }
  G.model = null; G.src = null; G.building = false; G.lastErr = null;
  Object.defineProperty(state, 'hair3Dneutral', {
    enumerable: true, configurable: true,
    get: function () {
      var m = desc.get.call(this);
      if (!G.on || !m || m.mannequin) return m;
      if (G.model && G.src === this._hair3Dneutral) return G.model;
      if (!G.building && this._hair3Dneutral && G.failedFor !== this._hair3Dneutral) setTimeout(G.build, 0);   // 사진 모델이 새로 만들어졌으면 다시 기름
      return m;
    },
    set: function (v) { G.model = null; G.src = null; desc.set.call(this, v); }
  });

  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (typeof combRefresh === 'function') combRefresh(); else if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) { console.warn(TAG + ' 다시 그리기 실패', e); }
  }
  G.build = function (cb) {
    if (typeof cb !== 'function') cb = null;
    if (G.building) return;
    var photo = state._hair3Dneutral;
    if (!photo || !photo.strands || !photo.strands.length) { if (cb) cb(false); return; }
    try { if (typeof NEUTRAL_BUILD !== 'undefined' && NEUTRAL_BUILD.running) { setTimeout(function () { G.build(cb); }, 300); return; } } catch (e) {}
    var B;
    try { B = makeBuilder(photo); } catch (e) { B = { err: String(e && e.message || e) }; console.warn(TAG + ' 준비 실패', e); }
    if (!B || B.err) {
      G.lastErr = B ? B.err : '?'; G.failedFor = photo;
      console.warn(TAG + ' 못 기름 — ' + G.lastErr + ' · 사진 가닥을 그대로 씁니다');
      if (cb) cb(false); return;
    }
    G.building = true; G.lastErr = null;
    var sub = null;
    try { if (typeof showAI === 'function') { showAI('뿌리부터 다시 기르는 중…', '0%'); sub = document.getElementById('aiOverlaySub'); } } catch (e) {}
    var workMs = 0, slices = 0;
    (function tick() {
      var f, tW = now();
      try { f = B.step(G.sliceMs); workMs += now() - tW; slices++; }
      catch (e) {
        G.building = false; G.lastErr = String(e && e.message || e); G.failedFor = photo;
        console.warn(TAG + ' 기르다 실패 — 사진 가닥을 그대로 씁니다', e);
        try { if (typeof hideAI === 'function') hideAI(); } catch (x) {}
        if (cb) cb(false); return;
      }
      if (sub) sub.textContent = Math.round(f * 100) + '%';
      if (f < 1) return setTimeout(tick, 0);
      var model = null;
      var tF = now();
      try { model = B.finish(); } catch (e) { G.lastErr = String(e && e.message || e); }
      try { if (G.stats) { G.stats.workMs = Math.round(workMs); G.stats.finMs = Math.round(now() - tF); G.stats.slices = slices; } } catch (e) {}
      G.building = false;
      try { if (typeof hideAI === 'function') hideAI(); } catch (x) {}
      if (!model || !model.strands.length || state._hair3Dneutral !== photo) {
        if (!model || !model.strands.length) { G.failedFor = photo; G.lastErr = G.lastErr || '가닥 0개'; console.warn(TAG + ' 결과가 비었습니다 — 사진 가닥을 그대로 씁니다'); }
        if (cb) cb(false); return;
      }
      G.model = model; G.src = photo;
      console.log(G.lines().join('\n'));
      try { if (G.applyBaseline) G.applyBaseline(); } catch (e) { console.warn(TAG + ' 기준 값 넣기 실패', e); }
      redraw();
      if (cb) cb(true);
    })();
  };

  /* ────────────────────────────────────────────────────────────────────────
   * (2026-10-04) 버튼 없이 자동 — 마네킹 OFF = 다시 기른 원본 머리(+치수 재기) · 마네킹 ON = 마네킹 모드
   *   · [다시 기르기] [원본 3D 그대로] [스타일 숫자 재기] 버튼은 없앴습니다(사용자 요청).
   *   · 마네킹이 꺼져 있으면 항상 다시 기른 머리를 보여 주고, 다 기르면 바로 치수를 재서
   *     슬라이더에 넣습니다(뿌리 볼륨·넘김 = 잰 값 · 길이 = 지금 길이가 기준 · 컬 0 = 지금 결 그대로).
   *   · 그 상태가 "기준"입니다. 기준에서는 가닥을 손대지 않고(사진 결 그대로), 슬라이더를 움직인 만큼만
   *     가닥에 겁니다(길이 비율 · 컬/웨이브 · 볼륨 · 넘김 · 가르마 · 흐름 · 정돈) — 바로 조정할 수 있게.
   *   · 마네킹 ON으로 가면 마네킹 때 쓰던 슬라이더 값(과 걸려 있던 스타일)을 되돌립니다.
   * ────────────────────────────────────────────────────────────────────── */
  G.base = null;            // 기준(잰 값): { sections:{sec:{length,curl}}, sty:{sweep,volume}, src: 사진 모델 }
  G.mqSnap = null;          // 마네킹 모드에서 쓰던 값(되돌리기용)
  function mqOn() { try { return typeof MANNEQUIN !== 'undefined' && !!MANNEQUIN.on; } catch (e) { return false; } }
  function secOrder() { return (typeof SECTION_ORDER !== 'undefined') ? SECTION_ORDER : ['crown', 'front', 'temple', 'side', 'occipital', 'nape']; }
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function setTag(t) { try { var el = document.getElementById('adjustStyleTag'); if (el) el.textContent = t; } catch (e) {} }
  function rebuildPanel() {
    try { if (typeof buildGyPanel === 'function') buildGyPanel(); else if (typeof buildGyControls === 'function') buildGyControls(); } catch (e) { console.warn(TAG + ' 조정 패널 다시 그리기 실패', e); }
    try { if (typeof syncSliderUI === 'function') syncSliderUI(); } catch (e) {}
  }
  function summary(r) {     // 미리보기 꼬리표에 넣는 한 줄
    try {
      var sp = r.spec, top, side, back;
      var ct = (sp.perm && sp.perm.curl > 0) ? ' · 컬 ' + sp.perm.curl : '';
      if (r.isLong) return '원본 머리 · 치수 잼 — 긴 머리 · 볼륨 ' + sp.styling.volume + ' · 넘김 ' + (sp.styling.sweep > 0 ? '+' : '') + sp.styling.sweep + ct;
      top = sp.lenCm.crown != null ? sp.lenCm.crown : sp.lenCm.front; side = sp.lenCm.side != null ? sp.lenCm.side : sp.lenCm.temple;
      back = sp.lenCm.occipital != null ? sp.lenCm.occipital : sp.lenCm.nape;
      return '원본 머리 · 치수 잼 — 윗머리 ' + (top != null ? top : '?') + 'cm · 옆 ' + (side != null ? side : '?') + 'cm · 뒤 ' + (back != null ? back : '?') + 'cm · 볼륨 ' + sp.styling.volume + ct;
    } catch (e) { return '원본 머리 · 치수 잼'; }
  }
  /* 다시 기른 머리에서 잰 값을 슬라이더에 넣고 그 상태를 기준으로 삼음 */
  G.applyBaseline = function () {
    if (!G.on || mqOn()) return false;
    var photo = null; try { photo = state._hair3Dneutral; } catch (e) {}
    if (!photo) return false;
    if (G.base && G.base.src === photo) return true;                 // 이 머리에는 이미 넣었음(사용자가 움직인 값을 덮지 않음)
    var r = null; try { r = G.measure(); } catch (e) { console.warn(TAG + ' 치수 재기 실패', e); }
    var sty = null; try { sty = neutralStyling(); } catch (e) { sty = { sweep: 0, volume: 50, flow: 0, part: 0, partAmt: 0, finish: 50, sleek: 0 }; }
    if (r && r.spec && r.spec.styling) { sty.sweep = r.spec.styling.sweep; sty.volume = r.spec.styling.volume; }
    var curl0 = (r && r.spec && r.spec.perm && r.spec.perm.curl > 0) ? r.spec.perm.curl : 0;
    var rod0 = (curl0 > 0 && r && r.curl && r.curl.rodScale > 1) ? r.curl.rodScale : 1;
    var base = { rodScale: rod0, sections: {}, sty: { sweep: sty.sweep || 0, volume: typeof sty.volume === 'number' ? sty.volume : 50 }, src: photo, measured: r };
    try {
      secOrder().forEach(function (sec) {
        var d = {}; try { d = clone(SECTIONS[sec].defaults) || {}; } catch (e) {}
        d.curl = curl0;                                              // 사진에서 잰 컬(직모면 0 = 지금 결 그대로)
        if (curl0 > 0 && r && r.curl && typeof r.curl.wave === 'number') d.wave = r.curl.wave;   // 잰 컬 굵기
        state.sections[sec] = d;
        base.sections[sec] = { length: d.length, curl: curl0 };
      });
      state._globalCurl = curl0;
      var sbv = {}; (typeof ANGLES !== 'undefined' ? ANGLES : ['front', 'left', 'right', 'back']).forEach(function (a) { sbv[a] = Object.assign({}, sty); });
      state.stylingByView = sbv;
      try { if (typeof bindStylingToCurrentView === 'function') bindStylingToCurrentView(); } catch (e) {}
      // (2026-10-10l) 사용자: "페이드가 켜지면서 먹도록 해야 될 것 같아. 토글이 켜져야 페이드 조정이 되거든" — 사진에서 페이드를 잰 손님은 토글을 켜고 잰 높이·가드·테이퍼를 넣음(이어서 조정 가능) · 아니면 예전처럼 끔
      try {
        var fd = r && r.spec && r.spec.fade;
        if (state.fade) {
          if (G.fadeOn && fd && fd.enabled) { Object.assign(state.fade, { enabled: true, height: fd.height, guard: fd.guard, taper: fd.taper, blendWidth: fd.blendWidth }); base.fade = { height: fd.height }; }
          else state.fade.enabled = false;
        }
      } catch (e) {}
      try { state.specAppliedId = null; state._specUndo = null; if (typeof BRAID !== 'undefined') BRAID.on = false; } catch (e) {}
    } catch (e) { console.warn(TAG + ' 기준 값 넣기 실패', e); }
    G.base = base;
    rebuildPanel();
    setTag(r ? summary(r) : '원본 머리');
    if (r) console.log(G.measureLines(r).join('\n'));
    redraw();
    return true;
  };
  function atBase(sec, cur, sty) {
    var b = G.base; if (!b) return true;
    var bs = b.sections[sec] || {};
    return (cur.length === bs.length || typeof cur.length !== 'number') && (cur.curl || 0) === (bs.curl || 0) &&
      (sty.sweep || 0) === b.sty.sweep && (typeof sty.volume !== 'number' || sty.volume === b.sty.volume) &&
      !(sty.part) && !(sty.flow) && !(sty.sleek);
  }
  /* ── (v7) 기른 뒤 결 정렬 ───────────────────────────────────────────────── */
  G.alignStrands = function (strands, CY, kMul) {
    var st = { on: !!G.align, strands: 0, segs: 0, rot: [], trimmed: 0, trimLen: 0, cells: 0, ms: 0, kMul: kMul == null ? 1 : kMul };
    if (!G.align || !strands || !strands.length) return st;
    if (kMul != null && !(kMul > 0.01)) { st.skipped = true; return st; }      // 곱슬머리 — 정렬 안 함
    var t0 = now(), cell = G.alignCell, OFFA = 512, SP = 1024, map = new Map(), cap = 8192, nC = 0;
    var SX = new Float32Array(cap), SY = new Float32Array(cap), SZ = new Float32Array(cap), CN = new Float32Array(cap), NS = new Uint16Array(cap), LAST = new Int32Array(cap).fill(-1);
    function grow() { var c2 = cap * 2, a; a = new Float32Array(c2); a.set(SX); SX = a; a = new Float32Array(c2); a.set(SY); SY = a; a = new Float32Array(c2); a.set(SZ); SZ = a;
      a = new Float32Array(c2); a.set(CN); CN = a; a = new Uint16Array(c2); a.set(NS); NS = a; a = new Int32Array(c2).fill(-1); a.set(LAST); LAST = a; cap = c2; }
    function keyOf(x, y, z) {
      var a = Math.floor(x / cell) + OFFA, b = Math.floor(y / cell) + OFFA, c = Math.floor(z / cell) + OFFA;
      if (a < 0 || b < 0 || c < 0 || a >= SP || b >= SP || c >= SP) return -1;
      return a + SP * (b + SP * c);
    }
    var si, i, p, n, k, idx, ux, uy, uz, len;
    var yCap = (isFinite(CY) ? CY : 0.15) + 0.3, reach = Math.max(0, G.alignReach | 0);
    /* 그 자리의 "이웃 결" 칸. 제 칸에 기준이 없으면(머리 겉면 밖으로 뜬 잔머리) 두상 쪽으로 alignReach칸까지 들어가며 찾음 */
    function consensusAt(x, y, z) {
      var h, kk, id, ml, tx, ty, tz, tl;
      for (h = 0; h <= reach; h++) {
        kk = keyOf(x, y, z);
        id = kk < 0 ? undefined : map.get(kk);
        if (id !== undefined && NS[id] >= G.alignMin) {
          ml = Math.sqrt(SX[id] * SX[id] + SY[id] * SY[id] + SZ[id] * SZ[id]);
          if (ml / CN[id] >= G.alignCoh) return id;
        }
        tx = -x; ty = Math.min(y, yCap) - y; tz = -z; tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (!(tl > 1e-6)) break;
        x += tx / tl * cell; y += ty / tl * cell; z += tz / tl * cell;
      }
      return -1;
    }
    // ① 칸마다 평균 방향·가닥 수
    for (si = 0; si < strands.length; si++) {
      p = strands[si].pts; n = p.length;
      for (i = 1; i < n; i++) {
        ux = p[i].x - p[i - 1].x; uy = p[i].y - p[i - 1].y; uz = p[i].z - p[i - 1].z; len = Math.sqrt(ux * ux + uy * uy + uz * uz);
        if (!(len > 1e-9)) continue;
        k = keyOf((p[i].x + p[i - 1].x) * 0.5, (p[i].y + p[i - 1].y) * 0.5, (p[i].z + p[i - 1].z) * 0.5); if (k < 0) continue;
        idx = map.get(k);
        if (idx === undefined) { if (nC >= cap) grow(); idx = nC++; map.set(k, idx); }
        SX[idx] += ux / len; SY[idx] += uy / len; SZ[idx] += uz / len; CN[idx]++;
        if (LAST[idx] !== si) { LAST[idx] = si; if (NS[idx] < 65535) NS[idx]++; }
      }
    }
    st.cells = nC;
    var cTol = Math.cos(G.alignTol * Math.PI / 180), cFull = Math.cos(G.alignFull * Math.PI / 180), cFlip = Math.cos(G.alignFlip * Math.PI / 180), K = G.alignK * (kMul == null ? 1 : Math.min(1, kMul));
    var U = new Float64Array(4 * 256), alone = new Uint8Array(256);
    // ② 벗어난 마디 돌리기 ③ 혼자 나간 꼬리
    for (si = 0; si < strands.length; si++) {
      var s = strands[si]; p = s.pts; n = p.length; if (n < 3) continue;
      if (U.length < n * 4) { U = new Float64Array(n * 4 + 128); alone = new Uint8Array(n + 32); }
      var changed = false, lo = n, hi = 0, last = n - 1, arcA = 0;
      for (i = 1; i < n; i++) {
        ux = p[i].x - p[i - 1].x; uy = p[i].y - p[i - 1].y; uz = p[i].z - p[i - 1].z; len = Math.sqrt(ux * ux + uy * uy + uz * uz);
        alone[i] = 0; arcA += len;
        if (len > 1e-9) {
          ux /= len; uy /= len; uz /= len;
          var mxm = (p[i].x + p[i - 1].x) * 0.5, mym = (p[i].y + p[i - 1].y) * 0.5, mzm = (p[i].z + p[i - 1].z) * 0.5;
          k = keyOf(mxm, mym, mzm);
          var own = k < 0 ? undefined : map.get(k);
          idx = consensusAt(mxm, mym, mzm);
          if (idx < 0) { if (own === undefined || NS[own] <= G.strayMax) alone[i] = 1; }
          if (idx >= 0) {
            {
              var mx = SX[idx], my = SY[idx], mz = SZ[idx], ml = Math.sqrt(mx * mx + my * my + mz * mz);
              {
                mx /= ml; my /= ml; mz /= ml;
                var dot = ux * mx + uy * my + uz * mz;
                if (dot < cTol && dot > cFlip) {
                  var tt = (cTol - dot) / Math.max(1e-6, cTol - cFull); if (tt > 1) tt = 1;
                  var w = K * tt * tt * (3 - 2 * tt);
                  if (arcA < G.alignRoot + G.alignRootFade) w *= arcA <= G.alignRoot ? 0 : (arcA - G.alignRoot) / G.alignRootFade;   // 뿌리에서 솟는 구간(뿌리 볼륨)은 그대로
                  var tx = ux + (mx - ux) * w, ty = uy + (my - uy) * w, tz = uz + (mz - uz) * w, tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
                  if (tl > 1e-3 && w > 0.01) {
                    tx /= tl; ty /= tl; tz /= tl;
                    st.segs++; if (st.segs % 13 === 0) st.rot.push(Math.acos(Math.max(-1, Math.min(1, ux * tx + uy * ty + uz * tz))) * 180 / Math.PI);
                    ux = tx; uy = ty; uz = tz; changed = true; if (i < lo) lo = i; if (i > hi) hi = i;
                  }
                }
              }
            }
          }
        } else { ux = 0; uy = -1; uz = 0; len = 0; }
        U[i * 4] = ux; U[i * 4 + 1] = uy; U[i * 4 + 2] = uz; U[i * 4 + 3] = len;
      }
      // 꼬리: 끝에서부터 혼자인 마디가 이어진 길이
      var cut = n;
      if (G.strayTrim) {
        var run = 0; for (i = last; i >= 1 && alone[i]; i--) run++;
        if (run >= G.strayMinSeg && n - run + G.strayKeep >= 3) cut = n - run + G.strayKeep;
      }
      if (!changed && cut === n) continue;
      var out = new Array(cut), qx = p[0].x, qy = p[0].y, qz = p[0].z, s0 = Math.max(1, lo - 1), s1 = Math.min(last, hi + 1), ax, ay, az, al, i0, i1, L = 0;
      out[0] = p[0];
      for (i = 1; i < cut; i++) {
        ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2];
        if (changed && i >= s0 && i <= s1) {                              // 바뀐 구간은 이웃 마디와 한 번 고르게
          i0 = i > 1 ? i - 1 : i; i1 = i < last ? i + 1 : i;
          ax = U[i0 * 4] + 2 * ax + U[i1 * 4]; ay = U[i0 * 4 + 1] + 2 * ay + U[i1 * 4 + 1]; az = U[i0 * 4 + 2] + 2 * az + U[i1 * 4 + 2];
          al = Math.sqrt(ax * ax + ay * ay + az * az);
          if (al > 1e-6) { ax /= al; ay /= al; az /= al; } else { ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; }
        }
        len = U[i * 4 + 3]; L += len;
        qx += ax * len; qy += ay * len; qz += az * len;
        out[i] = { x: qx, y: qy, z: qz };
      }
      if (cut < n) { st.trimmed++; for (i = cut; i < n; i++) st.trimLen += U[i * 4 + 3]; }
      if (changed) st.strands++;
      try { if (p._rgKeep) out._rgKeep = true; } catch (e) {}
      s.pts = out;
      if (s.rg) { s.rg.L = L; s.rg.tipY = out[cut - 1].y; }
    }
    st.ms = now() - t0;
    return st;
  };

  /* 컬 c를 걸면 가닥이 차지하는 뼈대 길이 ÷ 가닥 길이 (14 curlStrand3D와 같은 식 — 로드 굵기와 무관) */
  function curlRemain(c) {
    var F = (typeof CURL3D_FIX !== 'undefined') ? CURL3D_FIX : { ampGamma: 1, radiusGamma: 0.5 };
    var a = Math.pow(Math.max(0, Math.min(100, c || 0)) / 100, F.ampGamma || 1), rr = Math.pow(a, F.radiusGamma || 1), h = 2.6 - 2.28 * a;
    return a > 0 ? h / Math.sqrt(rr * rr + h * h) : 1;
  }
  G.curlRemain = curlRemain;
  G.cmPerMaskPx = function (a) { try { return cmPerMaskPx(a); } catch (e) { return null; } };
  function scalePts(pts, k) { var o = new Array(pts.length), i, p; for (i = 0; i < pts.length; i++) { p = pts[i]; o[i] = { x: p.x * k, y: p.y * k, z: p.z * k }; } return o; }
  /* 끝 방향으로 점 하나를 덧대 호길이를 ratio배로 */
  function padArc(pts, ratio) {
    var n = pts.length; if (n < 2 || !(ratio > 1)) return pts;
    var L = 0, i; for (i = 1; i < n; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, pts[i].z - pts[i - 1].z);
    var a = pts[n - 2], t = pts[n - 1], dx = t.x - a.x, dy = t.y - a.y, dz = t.z - a.z, dl = Math.hypot(dx, dy, dz);
    if (!(L > 1e-9) || !(dl > 1e-9)) return pts;
    var add = L * (ratio - 1) / dl, out = pts.slice();
    out.push({ x: t.x + dx * add, y: t.y + dy * add, z: t.z + dz * add });
    return out;
  }
  /* 다시 기른 가닥: 기준에서 움직인 만큼만 */
  function adjustRegrown(s, lenOverride, styOverride) {
    var b = G.base; if (!b || b.src !== state._hair3Dneutral) return s.pts;
    var cur = (state.sections && state.sections[s.sec]) || {};
    var sty = (styOverride !== undefined ? styOverride : uniformStyling()) || stylingForRoot(s.pts[0]) || {};
    if (typeof lenOverride === 'number') cur = Object.assign({}, cur, { length: lenOverride });
    var bs = b.sections[s.sec] || {}, g = s.pts, C0 = bs.curl || 0;
    if (atBase(s.sec, cur, sty) && !(C0 > 0)) return s.pts;            // 직모 기준 — 손대지 않음
    var r = sectionLengthRatio(s.sec, cur.length) / (sectionLengthRatio(s.sec, bs.length) || 1);
    // 가닥(s.pts)은 컬을 편 뼈대 — 컬은 지금 슬라이더 값을 그대로 겁니다(기준이 직모면 예전의 "더한 만큼"과 같음)
    var curl = Math.max(0, cur.curl || 0), keep = G.curlKeepShape && C0 > 0, total = r, cover = r;
    if (keep) {
      total = r / curlRemain(C0);                                     // 편 길이 ÷ 뼈대 길이 (잰 컬에서 겉모양 = 사진)
      var used = total * curlRemain(curl);                            // 컬을 건 뒤 뼈대를 차지하는 길이 ÷ 뼈대 길이
      cover = used > 1.0005 ? used : Math.min(1, total);              // 뼈대를 실제로 늘리거나 줄일 비율
    }
    if (Math.abs(cover - 1) > 1e-6) g = lengthStrand3D(g, cover);
    var sweep = Math.max(-100, Math.min(100, (sty.sweep || 0) - b.sty.sweep));
    var vol = Math.max(0, Math.min(100, 50 + ((typeof sty.volume === 'number' ? sty.volume : 50) - b.sty.volume)));
    var part = sty.part || 0, spine = false;
    try { spine = typeof STYLE_ORDER !== 'undefined' && !!STYLE_ORDER.spineFirst; } catch (e) {}
    if (spine) { g = partStrand3D(g, part, curl, sty.partAmt); g = sweepStrand3D(g, sweep * sweepCurlScale(curl), curl, part, sty.partAmt); }
    if (keep && total > cover * 1.0005) g = padArc(g, total / cover);    // 호길이만 편 길이에 맞춤(덧댄 구간은 나선이 쓰지 않음)
    var ks = (C0 > 0 && b.rodScale > 1 && curl > 0) ? b.rodScale : 1;   // 로드 최대보다 굵은 컬 — 가닥을 줄여서 걸고 다시 키움
    if (ks > 1) g = scalePts(g, 1 / ks);
    g = curlStrand3D(g, curl, (typeof cur.wave === 'number' ? cur.wave : 50) / 100, typeof cur.curlDir === 'number' ? cur.curlDir : 0);
    if (ks > 1) g = scalePts(g, ks);
    if (keep) { if (curl > C0) g = gravityDroop3D(g, curl - C0); }     // 잰 컬까지는 사진에 이미 처져 있음 — 더한 만큼만
    else if (curl > 0) g = gravityDroop3D(g, curl);
    if (!spine) { g = partStrand3D(g, part, curl, sty.partAmt); g = sweepStrand3D(g, sweep, curl, part, sty.partAmt); }
    g = volumeStrand3D(g, vol, s.sec);
    g = flowCurlStrand3D(g, sty.flow || 0);
    g = sleekStrand3D(g, typeof sty.sleek === 'number' ? sty.sleek : 0);
    return g;
  }
  var prevAdj = W.adjustStrandGeom;
  if (typeof prevAdj === 'function') W.adjustStrandGeom = function (s, lenOverride, styOverride) {
    if (G.on && s && !s.mannequin && s.pts) {
      if (!s.regrown) return s.pts;                                  // 못 길렀을 때 — 사진 가닥을 손대지 않고 그대로
      try { return adjustRegrown(s, lenOverride, styOverride); } catch (e) { G.adjErr = String(e && e.message || e); return s.pts; }
    }
    return prevAdj.apply(this, arguments);
  };

  G.refresh = function () {
    if (G.on && !(G.model && G.src === state._hair3Dneutral)) { G.build(); return; }
    // (2026-10-04e) 이미 기준이 들어 있으면 바뀐 것이 없음 — 캐시를 흔들지 않고 다시 그리기만(예전: 조정 화면에 들어올 때마다 전부 다시 계산)
    var same = false; try { same = !!(G.on && G.base && G.base.src === state._hair3Dneutral); } catch (e) {}
    if (G.on) G.applyBaseline();
    if (same) { try { if (typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {} }
    else redraw();
  };
  /* 마네킹 상태에 맞춤 — 마네킹 OFF면 다시 기르기 켬 */
  G.sync = function () {
    var want = !mqOn();
    if (want === G.on) { if (want) G.refresh(); return; }
    if (want) {
      G.on = true; G.failedFor = null;
      try { if (W.ORIG_ASIS && W.ORIG_ASIS.on) W.ORIG_ASIS.on = false; } catch (e) {}
      setTag('원본 머리');
      console.log(TAG + ' 마네킹 OFF — 다시 기른 원본 머리');
      G.refresh();
    } else { G.on = false; }
  };
  try { var mqb = document.getElementById('mannequinBtn'); if (mqb) mqb.title = 'ON: 마네킹 모드(컬·스타일링을 지운 상태에서 시작) · OFF: 사진에서 다시 기른 원본 머리(치수 잼)'; } catch (e) {}
  G.toggle = function () { try { if (typeof toggleMannequin === 'function') toggleMannequin(); } catch (e) {} };   // 예전 콘솔 명령 호환

  // 마네킹을 끌 때: 마네킹에서 쓰던 값을 기억 · 켤 때: 되돌림
  var origToggleMq = W.toggleMannequin;
  if (typeof origToggleMq === 'function') W.toggleMannequin = function () {
    var wasOn = mqOn(), r;
    if (wasOn) {
      try { G.mqSnap = { sections: clone(state.sections), stylingByView: clone(state.stylingByView), fade: clone(state.fade), globalCurl: state._globalCurl, specId: state.specAppliedId || null }; } catch (e) { G.mqSnap = null; }
      G.base = null;                                                 // 다시 들어올 때 잰 값을 새로 넣음
    }
    r = origToggleMq.apply(this, arguments);
    if (wasOn && !mqOn()) G.sync();
    return r;
  };
  var origMq = W.mannequinReset;
  if (typeof origMq === 'function') W.mannequinReset = function () {
    var was = G.on, snap = G.mqSnap, r, inAdj = false;
    try { inAdj = currentScreen === 'adjust' && !state.pendingSpecId; } catch (e) {}
    if (!inAdj) snap = null;                                         // 스타일 화면에서 새 스타일을 고른 경우 — 예전 값을 되돌리지 않음
    G.on = false;
    if (was && snap) {
      try {
        state.sections = snap.sections;
        if (snap.fade && state.fade) Object.assign(state.fade, snap.fade);
        if (typeof snap.globalCurl === 'number') state._globalCurl = snap.globalCurl;
      } catch (e) {}
    }
    r = origMq.apply(this, arguments);
    if (was) {
      G.mqSnap = null; G.base = null;
      try { setTag((state.selectedStyle && state.selectedStyle.name) || '스타일 미선택'); } catch (e) {}
      rebuildPanel();
      if (snap && snap.specId && typeof applyStyleSpecAndRender === 'function') {
        setTimeout(function () { try { if (mqOn() && !state.specAppliedId) applyStyleSpecAndRender(snap.specId); } catch (e) { console.warn(TAG + ' 스타일 다시 걸기 실패', e); } }, 60);
      }
    }
    return r;
  };
  // 조정 화면에 들어올 때 — 마네킹이 꺼져 있으면(스타일을 안 골랐거나 껐으면) 바로 다시 기른 머리
  var origSetupAdj = W.setupAdjustScreen;
  if (typeof origSetupAdj === 'function') W.setupAdjustScreen = function () {
    var pending = null; try { pending = state.pendingSpecId; } catch (e) {}
    var r = origSetupAdj.apply(this, arguments);
    if (!pending) setTimeout(function () { try { if (currentScreen === 'adjust') G.sync(); } catch (e) {} }, 0);
    return r;
  };
  // 이 모드에서 [현재 모델을 스타일로 등록] = 잰 숫자로 등록(슬라이더를 안 움직였을 때)
  var origReg = W.registerCurrentAsStyle;
  if (typeof origReg === 'function') W.registerCurrentAsStyle = function () {
    if (G.on && !mqOn() && G.base && G.model && G.src === state._hair3Dneutral) {
      var moved = false;
      try {
        var sty = uniformStyling() || state.stylingByView[state.currentViewAngle] || {};
        secOrder().forEach(function (sec) { if (!atBase(sec, state.sections[sec] || {}, sty)) moved = true; });
      } catch (e) {}
      if (!moved) return G.register();
    }
    return origReg.apply(this, arguments);
  };

  /* ────────────────────────────────────────────────────────────────────────
   * 스타일 숫자로 재기
   * ────────────────────────────────────────────────────────────────────── */
  function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ── (v5) 컬 굵기: 결을 따라가며 방향 상관이 절반으로 떨어지는 거리 ─────────────────────────── */
  function curvStats(angle, coh, mask, Wd, Hd) {
    var minCoh = 0.2, dMax = 48, want = 4000, n = Wd * Hd, cnt = 0, i, d;
    for (i = 0; i < n; i++) if (mask[i] && coh[i] >= minCoh) cnt++;
    if (cnt < 200) return null;
    var stride = Math.max(1, Math.floor(cnt / want)), S = new Float64Array(dMax + 1), N = new Float64Array(dMax + 1), k = 0;
    for (i = 0; i < n; i++) {
      if (!mask[i] || coh[i] < minCoh) continue;
      if (k++ % stride) continue;
      var x0 = i % Wd, y0 = (i / Wd) | 0, t0 = angle[i], sg;
      for (sg = 1; sg >= -1; sg -= 2) {
        var x = x0 + 0.5, y = y0 + 0.5, ux = Math.cos(t0) * sg, uy = Math.sin(t0) * sg;
        for (d = 1; d <= dMax; d++) {
          x += ux; y += uy;
          var xi = x | 0, yi = y | 0; if (xi < 0 || yi < 0 || xi >= Wd || yi >= Hd) break;
          var j = yi * Wd + xi; if (!mask[j]) break;
          var t = angle[j], vx = Math.cos(t), vy = Math.sin(t);
          if (vx * ux + vy * uy < 0) { vx = -vx; vy = -vy; }
          ux = vx; uy = vy;
          if (coh[j] < minCoh) continue;
          S[d] += Math.cos(2 * (t - t0)); N[d]++;
        }
      }
    }
    if (!(N[1] > 50)) return null;
    var c1 = S[1] / N[1], dHalf = null, prev = c1;
    if (!(c1 > 0.2)) return { c1: c1, dHalf: null, n: N[1], flat: false };
    for (d = 2; d <= dMax; d++) {
      if (!(N[d] > 50)) break;
      var c = S[d] / N[d];
      if (c <= 0.5 * c1) { dHalf = (d - 1) + (prev - 0.5 * c1) / Math.max(1e-9, prev - c); break; }
      prev = c;
    }
    return { c1: c1, dHalf: dHalf, n: N[1], flat: dHalf == null };      // flat: 끝까지 가도 안 달라짐(거의 직선)
  }
  G.curvStats = curvStats;
  function curlAmp(angle, coh, mask, Wd, Hd) {      // (2026-10-10h) 사진 결을 따라 선을 그어 그 선이 옆으로 흔들리는 폭(진폭) = 컬 반경(px) · 흔들림 한 번 길이 = 한 바퀴 간격
    var minCoh = 0.2, Lh = 160, want = 1200, n = Wd * Hd, cnt = 0, i, k;
    for (i = 0; i < n; i++) if (mask[i] && coh[i] >= minCoh) cnt++;
    if (cnt < 300) return null;
    var stride = Math.max(1, Math.floor(cnt / want)), amps = [], lams = [], tried = 0, waved = 0, kk = 0;
    var PX = new Float64Array(2 * Lh + 1), PY = new Float64Array(2 * Lh + 1); var CX = new Float64Array(2 * Lh + 2), CY2 = new Float64Array(2 * Lh + 2);
    function trace(x0, y0, t0, sg, out, off) {      // 한쪽으로 따라감 → 몇 점 갔나
      var x = x0 + 0.5, y = y0 + 0.5, ux = Math.cos(t0) * sg, uy = Math.sin(t0) * sg, d;
      for (d = 1; d <= Lh; d++) {
        x += ux; y += uy;
        var xi = x | 0, yi = y | 0; if (xi < 0 || yi < 0 || xi >= Wd || yi >= Hd) return d - 1;
        var j = yi * Wd + xi; if (!mask[j] || coh[j] < minCoh * 0.5) return d - 1;
        var t = angle[j], vx = Math.cos(t), vy = Math.sin(t);
        if (vx * ux + vy * uy < 0) { vx = -vx; vy = -vy; }
        ux = 0.5 * ux + 0.5 * vx; uy = 0.5 * uy + 0.5 * vy; var ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        out(off + sg * d, x, y);
      }
      return Lh;
    }
    function dev(a, b, Wn) {                          // 이동 평균 뼈대에서 벗어난 거리(부호) → [진폭, 파장, 부호 바뀜 수]
      var m = b - a + 1, h = Math.max(2, Wn >> 1), s, dv = [], sum = 0, ch = 0, prev = 0;
      for (s = a; s <= b; s++) { CX[s + 1] = CX[s] + PX[s]; CY2[s + 1] = CY2[s] + PY[s]; }
      for (s = a + h; s <= b - h; s++) {
        var mx = (CX[s + h + 1] - CX[s - h]) / (2 * h + 1), my = (CY2[s + h + 1] - CY2[s - h]) / (2 * h + 1);
        var tx = PX[Math.min(b, s + h)] - PX[Math.max(a, s - h)], ty = PY[Math.min(b, s + h)] - PY[Math.max(a, s - h)], tl = Math.hypot(tx, ty) || 1;
        var e = ((PX[s] - mx) * (-ty) + (PY[s] - my) * tx) / tl; dv.push(e);
      }
      if (dv.length < 20) return null;
      var mean = 0; dv.forEach(function (e) { mean += e; }); mean /= dv.length;
      dv.forEach(function (e) { e -= mean; sum += Math.abs(e); var sgn = e > 0 ? 1 : -1; if (prev && sgn !== prev) ch++; prev = sgn; });
      return [sum / dv.length * Math.PI / 2, ch > 0 ? 2 * dv.length / ch : 1e9, ch];
    }
    for (i = 0; i < n; i++) {
      if (!mask[i] || coh[i] < minCoh) continue;
      if (kk++ % stride) continue;
      var x0 = i % Wd, y0 = (i / Wd) | 0, t0 = angle[i];
      PX[Lh] = x0 + 0.5; PY[Lh] = y0 + 0.5;
      var put = function (idx, x, y) { PX[idx] = x; PY[idx] = y; };
      var f = trace(x0, y0, t0, 1, put, Lh), bk = trace(x0, y0, t0, -1, put, Lh);
      var a = Lh - bk, b = Lh + f; if (b - a < 50) continue;
      tried++;
      var r1 = dev(a, b, 40); if (!r1) continue;
      var Wn = Math.max(12, Math.min(120, Math.round(r1[1] || 40))), r2 = dev(a, b, Wn) || r1;
      if (r2[2] >= 3 && r2[0] >= 1.5) { waved++; amps.push(r2[0]); lams.push(r2[1]); }
    }
    if (tried < 50) return null;
    amps.sort(function (p, q) { return p - q; }); lams.sort(function (p, q) { return p - q; });
    var med = amps.length ? amps[amps.length >> 1] : 0, lam = lams.length ? lams[lams.length >> 1] : 0;
    return { ampPx: med, lamPx: lam, n: amps.length, tried: tried, wavy: waved / tried };
  }
  G.curlAmpFn = curlAmp;
  /* (2026-10-10k) 나선 측정 — 사진 속 곱슬은 가닥이 아니라 타래(나선)의 앞면만 보임 → 결 선은 반 바퀴마다 끊김.
     대신: 머리 영역 밝기의 자기상관(FFT)에서 축 방향 반복 = 한 바퀴 간격 P · 가닥이 축에서 기운 각의 봉우리 β(나선 앞면 가운데)
     → 나선 중심 반경 Rc = P·tanβ/2π · 타래 지름 ≈ 2·Rc·1.8. 실제 나선 타래를 비춰 그린 무늬(지름 12~40px · 간격 16~60px)에서 지름 오차 2~14% · 간격은 정확.
     직모(가닥이 축과 거의 직각으로 나옴 β>78°)·반복이 약하면 안 씀. */
// 나선 측정: 머리 영역 밝기의 자기상관(FFT)에서 한 바퀴 간격 P(축 방향 반복)와 가닥 기울기 β → 지름 D = P·tanβ/π
function hxFft(re,im,n,inv){for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
 for(let len=2;len<=n;len<<=1){const a=2*Math.PI/len*(inv?1:-1),wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let j=0;j<len/2;j++){const ur=re[i+j],ui=im[i+j],vr=re[i+j+len/2]*cr-im[i+j+len/2]*ci,vi=re[i+j+len/2]*ci+im[i+j+len/2]*cr;re[i+j]=ur+vr;im[i+j]=ui+vi;re[i+j+len/2]=ur-vr;im[i+j+len/2]=ui-vi;const nr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=nr;}}}
 if(inv)for(let i=0;i<n;i++){re[i]/=n;im[i]/=n;}}
function hxFft2(re,im,n,inv){const rr=new Float64Array(n),ri=new Float64Array(n);for(let y=0;y<n;y++){for(let x=0;x<n;x++){rr[x]=re[y*n+x];ri[x]=im[y*n+x];}hxFft(rr,ri,n,inv);for(let x=0;x<n;x++){re[y*n+x]=rr[x];im[y*n+x]=ri[x];}}
 for(let x=0;x<n;x++){for(let y=0;y<n;y++){rr[y]=re[y*n+x];ri[y]=im[y*n+x];}hxFft(rr,ri,n,inv);for(let y=0;y<n;y++){re[y*n+x]=rr[y];im[y*n+x]=ri[y];}}}
function helixMeasure(rgba,mask,W,H,angle,coh,opt){opt=opt||{};const n=opt.n||256;
 // 1) 밝기 · 머리 영역 안만 · 저주파 뺌
 const L=new Float32Array(W*H);for(let i=0;i<W*H;i++)L[i]=0.299*rgba[i*4]+0.587*rgba[i*4+1]+0.114*rgba[i*4+2];
 // 머리 영역의 중심에서 n×n(사진이 작으면 줄임)
 let sx=0,sy=0,c=0;for(let i=0;i<W*H;i++)if(mask[i]){sx+=i%W;sy+=(i/W)|0;c++;}if(c<2000)return null;const cx=Math.round(sx/c),cy=Math.round(sy/c);
 const re=new Float64Array(n*n),im=new Float64Array(n*n),wm=new Float64Array(n*n);let mean=0,mc=0;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const X=cx-n/2+x,Y=cy-n/2+y;if(X<0||Y<0||X>=W||Y>=H)continue;const i=Y*W+X;if(!mask[i])continue;mean+=L[i];mc++;}mean/=Math.max(1,mc);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const X=cx-n/2+x,Y=cy-n/2+y;if(X<0||Y<0||X>=W||Y>=H)continue;const i=Y*W+X;if(!mask[i])continue;const hw=(0.5-0.5*Math.cos(2*Math.PI*x/n))*(0.5-0.5*Math.cos(2*Math.PI*y/n));re[y*n+x]=(L[i]-mean)*hw;wm[y*n+x]=hw;}
 // 2) 자기상관 = |FFT|² 역변환 (영역 모양 효과는 창 자기상관으로 나눔)
 hxFft2(re,im,n,false);for(let i=0;i<n*n;i++){re[i]=re[i]*re[i]+im[i]*im[i];im[i]=0;}hxFft2(re,im,n,true);
 const wr=Float64Array.from(wm),wi=new Float64Array(n*n);hxFft2(wr,wi,n,false);for(let i=0;i<n*n;i++){wr[i]=wr[i]*wr[i]+wi[i]*wi[i];wi[i]=0;}hxFft2(wr,wi,n,true);
 const A=(dx,dy)=>{const x=(dx+n)%n,y=(dy+n)%n,k=y*n+x;return wr[k]>1e-6*wr[0]?re[k]/wr[k]:0;};const A0=A(0,0);
 // 3) 가는 결 방향(β 재기용) — 사진 결의 중앙값(두 배 각)
 let ca=0,sa=0;for(let i=0;i<W*H;i+=3)if(mask[i]&&coh[i]>0.3){ca+=coh[i]*Math.cos(2*angle[i]);sa+=coh[i]*Math.sin(2*angle[i]);}const fine=0.5*Math.atan2(sa,ca);
 // 4) 중심을 뺀 가장 센 자기상관 봉우리 = 한 바퀴 옮김(P) — 반경 rmin..rmax에서
 const rmin=opt.rmin||6,rmax=opt.rmax||Math.min(110,n/2-4);let best=-1e18,bx=0,by=0;
 for(let dy=0;dy<=rmax;dy++)for(let dx=-rmax;dx<=rmax;dx++){const r=Math.hypot(dx,dy);if(r<rmin||r>rmax)continue;if(dy===0&&dx<0)continue;
  const v=A(dx,dy);if(v<=best)continue;// 봉우리인지(이웃보다 큼)
  let pk=true;for(let ey=-1;ey<=1&&pk;ey++)for(let ex=-1;ex<=1;ex++){if(!ex&&!ey)continue;if(A(dx+ex,dy+ey)>v){pk=false;break;}}if(pk){best=v;bx=dx;by=dy;}}
 const P=Math.hypot(bx,by),axis=Math.atan2(by,bx);
 // 가닥이 축에서 기운 각의 분포(또렷함 무게) — 가장 많은 각(봉우리) = 나선 앞면 가운데의 기울기
 const hb=new Float64Array(91);for(let i=0;i<W*H;i+=2){if(!mask[i]||!(coh[i]>0.3))continue;let d=Math.abs(((angle[i]-axis)%Math.PI+Math.PI)%Math.PI);if(d>Math.PI/2)d=Math.PI-d;hb[Math.min(90,Math.round(d*57.3))]+=coh[i];}
 const sm=new Float64Array(91);for(let k=0;k<=90;k++){let s2=0,w2=0;for(let j=-4;j<=4;j++){const q=k+j;if(q<0||q>90)continue;const ww=5-Math.abs(j);s2+=hb[q]*ww;w2+=ww;}sm[k]=s2/w2;}
 let bk=12;for(let k=12;k<=88;k++)if(sm[k]>sm[bk])bk=k;const beta=bk/57.3;
 const Rc=P*Math.tan(beta)/(2*Math.PI),D=2*Rc*(opt.tubeK||1.8);
 return {P,D,Rc,beta:beta*57.3,axis:axis*57.3,fine:fine*57.3,peak:best/A0,bx,by};}


  G.helixMeasureFn = helixMeasure;

  /* (2026-10-10m) 타래 조각 찾기 — 곱슬 사진에서 타래는 밝은 겉면과 그 사이 어두운 틈으로 갈림.
     머리 영역 안에서 둘레(17px)보다 밝은 부분을 이어진 조각으로 묶음 → 조각 하나 = 앞으로 드러난 타래의 반 바퀴(C·S자).
     실측(곱슬 여자분 사진 4장): 조각 57~95개 · 폭 중앙값 7~9px(≈1cm). 61번이 이 조각으로 3D 가닥을 한 타래로 묶음. */
  function clumpFind(px, mask, Wd, Hd) {
    var N = Wd * Hd, L = new Float32Array(N), T = new Float32Array(N), i, x, y, k;
    for (i = 0; i < N; i++) L[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    for (var pass = 0; pass < 2; pass++) {                                   // [1 2 1] 두 번 = 살짝 흐림
      for (y = 0; y < Hd; y++) for (x = 0; x < Wd; x++) { k = y * Wd + x; T[k] = (L[k] * 2 + L[x > 0 ? k - 1 : k] + L[x < Wd - 1 ? k + 1 : k]) / 4; }
      for (y = 0; y < Hd; y++) for (x = 0; x < Wd; x++) { k = y * Wd + x; L[k] = (T[k] * 2 + T[y > 0 ? k - Wd : k] + T[y < Hd - 1 ? k + Wd : k]) / 4; }
    }
    var I = new Float64Array((Wd + 1) * (Hd + 1)), r = G.clumpWin >> 1;   // 적분 영상 → 둘레 평균
    for (y = 0; y < Hd; y++) { var row = 0; for (x = 0; x < Wd; x++) { row += L[y * Wd + x]; I[(y + 1) * (Wd + 1) + x + 1] = I[y * (Wd + 1) + x + 1] + row; } }
    var B = new Uint8Array(N);
    for (y = 0; y < Hd; y++) for (x = 0; x < Wd; x++) {
      k = y * Wd + x; if (!mask[k]) continue;
      var x0 = Math.max(0, x - r), x1 = Math.min(Wd, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(Hd, y + r + 1);
      var m = (I[y1 * (Wd + 1) + x1] - I[y0 * (Wd + 1) + x1] - I[y1 * (Wd + 1) + x0] + I[y0 * (Wd + 1) + x0]) / ((x1 - x0) * (y1 - y0));
      if (L[k] > m + G.clumpLift) B[k] = 1;
    }
    var E2 = new Uint8Array(N);                                              // 열기(깎고 다시 키움) — 실오라기 연결 끊기
    for (y = 1; y < Hd - 1; y++) for (x = 1; x < Wd - 1; x++) { k = y * Wd + x; if (B[k] && B[k - 1] && B[k + 1] && B[k - Wd] && B[k + Wd]) E2[k] = 1; }
    for (i = 0; i < N; i++) B[i] = 0;
    for (y = 1; y < Hd - 1; y++) for (x = 1; x < Wd - 1; x++) { k = y * Wd + x; if (E2[k] || E2[k - 1] || E2[k + 1] || E2[k - Wd] || E2[k + Wd]) B[k] = 1; }
    var lab = new Int16Array(N), n = 0, st = [], ws = [], sizes = [], CLEN = [0], CW = [0];
    for (i = 0; i < N; i++) {
      if (!B[i] || lab[i]) continue;
      if (n >= 32000) break;
      n++; var comp = [i]; lab[i] = n; st.length = 0; st.push(i);
      while (st.length) { var c = st.pop(), cx = c % Wd; var nb = [cx > 0 ? c - 1 : -1, cx < Wd - 1 ? c + 1 : -1, c - Wd, c + Wd]; for (var j = 0; j < 4; j++) { var q = nb[j]; if (q < 0 || q >= N || !B[q] || lab[q]) continue; lab[q] = n; st.push(q); comp.push(q); } }
      if (comp.length < G.clumpMinPx) { comp.forEach(function (q2) { lab[q2] = -1; }); n--; continue; }
      var sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; comp.forEach(function (q2) { var qx = q2 % Wd, qy = (q2 / Wd) | 0; sx += qx; sy += qy; sxx += qx * qx; syy += qy * qy; sxy += qx * qy; });
      var cn = comp.length, mx = sx / cn, my = sy / cn, a = sxx / cn - mx * mx, b2 = sxy / cn - mx * my, d = syy / cn - my * my, tr = a + d, det = a * d - b2 * b2, l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var l1 = tr - l2; ws.push(4 * Math.sqrt(Math.max(l2, 1e-6))); sizes.push(cn); CLEN[n] = 4 * Math.sqrt(Math.max(l1, 1e-6)); CW[n] = 4 * Math.sqrt(Math.max(l2, 1e-6));
    }
    for (i = 0; i < N; i++) if (lab[i] < 0) lab[i] = 0;
    ws.sort(function (p1, p2) { return p1 - p2; });
    return { lab: lab, n: n, W: Wd, H: Hd, wMed: ws.length ? ws[ws.length >> 1] : 0, len: Float32Array.from(CLEN), wid: Float32Array.from(CW) };
  }
  G.clumpFindFn = clumpFind;
  var CLUMPS = new WeakMap();                                               // 사진 분석값(identity) → 조각 지도(저장소에 안 들어가게 따로 둠)
  G.clumpsFor = function (angle) { try { var mi = state.hairMasks && state.hairMasks[angle], id = mi && mi.identity; return id ? (CLUMPS.get(id) || null) : null; } catch (e) { return null; } };

  (function () {
    var pend = null;
    var oEx = W.extractHairMask;
    if (typeof oEx === 'function') W.extractHairMask = function () { pend = null; return oEx.apply(this, arguments); };
    var oF = W.computeHairOrientationField;
    if (typeof oF === 'function') W.computeHairOrientationField = function (px, mask, Wd, Hd) {
      pend = null;
      var f = oF.apply(this, arguments);
      try { if (f && f.angle && f.coherence) { var cs = curvStats(f.angle, f.coherence, mask, Wd, Hd); if (cs) { pend = { w: Wd, h: Hd, cs: cs }; if (G.curlAmp) { try { pend.amp = curlAmp(f.angle, f.coherence, mask, Wd, Hd); } catch (e2) {} }
            if (G.clumps && px && px.length === Wd * Hd * 4) { try { pend.clumps = clumpFind(px, mask, Wd, Hd); } catch (e4) {} }
            if (G.curlHelix && px && px.length === Wd * Hd * 4) { try { pend.helix = helixMeasure(px, mask, Wd, Hd, f.angle, f.coherence, { n: Math.min(Wd, Hd) >= 300 ? 256 : 128 }); } catch (e3) {} } } } } catch (e) { pend = null; }
      return f;
    };
    var oM = W.measureViewHairIdentity;
    if (typeof oM === 'function') W.measureViewHairIdentity = function (a) {
      var id = oM.apply(this, arguments);
      try {
        if (id && pend && a && pend.w === a.w && pend.h === a.h) { id.curlDHalf = pend.cs.dHalf; id.curlFlat = pend.cs.flat; id.curlC1 = pend.cs.c1; id.curlRn = pend.cs.n; if (pend.helix) { id.curlHelix = pend.helix; }
        if (pend.clumps) { CLUMPS.set(id, pend.clumps); id.curlClumpN = pend.clumps.n; id.curlClumpW = pend.clumps.wMed; try { console.log(TAG + ' 타래 조각 — ' + pend.clumps.n + '개 · 폭 중앙값 ' + pend.clumps.wMed.toFixed(1) + 'px(' + pend.clumps.W + '×' + pend.clumps.H + ')'); } catch (e5) {} }
        if (pend.amp) { id.curlAmpPx = pend.amp.ampPx; id.curlLamPx = pend.amp.lamPx; id.curlWavy = pend.amp.wavy; id.curlAmpN = pend.amp.n; } }
      } catch (e) {}
      pend = null;
      return id;
    };
  })();
  /* 뷰의 마스크 1px이 몇 cm인가(그 뷰의 카메라 배율) */
  function cmPerMaskPx(angle) {
    try {
      var photo = state._hair3Dneutral, probe = (photo && photo.occ && photo.occ.probe) || (state.hairOcc3D && state.hairOcc3D.probe);
      var cam = probe && probe.cams && probe.cams.filter(function (c) { return c.angle === angle; })[0];
      var mi = state.hairMasks && state.hairMasks[angle];
      if (!cam || !(cam.s > 0) || !mi) return null;
      var kx = (mi.maskW || mi.w) / (mi.w || mi.maskW || 1);
      return cam.s * (modelCmPerUnit() || 16.4) / (kx || 1);
    } catch (e) { return null; }
  }
  /* 사진의 결 꺾임 → 컬 값. 뷰마다 03a가 재 둔 curlDegPerPx의 중앙값 */
  G.photoCurl = function () {
    var views = [], vals = [];
    (typeof ANGLES !== 'undefined' ? ANGLES : ['front', 'left', 'right', 'back']).forEach(function (a) {
      var mi = state.hairMasks && state.hairMasks[a], id = mi && mi.identity;
      if (!id || id.curlDegPerPx == null || !isFinite(id.curlDegPerPx)) return;
      var ok = id.curlN > G.curlMinN;
      views.push({ a: a, v: id.curlDegPerPx, n: id.curlN || 0, ok: ok });
      if (ok) vals.push(id.curlDegPerPx);
    });
    if (!vals.length) return { value: 0, deg: null, views: views };
    vals.sort(function (x, y) { return x - y; });
    var deg = vals.length % 2 ? vals[(vals.length - 1) / 2] : (vals[vals.length / 2 - 1] + vals[vals.length / 2]) / 2;
    var v = Math.round(G.curlMax * clampN((deg - G.curlLo) / Math.max(1e-6, G.curlHi - G.curlLo), 0, 1));
    if (v < G.curlMin) v = 0;
    var out = { value: G.curl ? v : 0, raw: v, deg: deg, views: views, wave: 50, rodScale: 1, rCm: null, rViews: [], rNote: '' };
    // (v5) 컬 굵기
    try {
      var rs = [], flat = 0, seen = 0;
      (typeof ANGLES !== 'undefined' ? ANGLES : ['front', 'left', 'right', 'back']).forEach(function (a) {
        var mi = state.hairMasks && state.hairMasks[a], id = mi && mi.identity;
        if (!id || !(id.curlRn > 200) || (id.curlDHalf == null && !id.curlFlat)) return;
        seen++;
        if (id.curlFlat) { flat++; out.rViews.push({ a: a, flat: true }); return; }
        var cpp = cmPerMaskPx(a); if (!(cpp > 0)) { out.rViews.push({ a: a, dHalf: id.curlDHalf, noScale: true }); return; }
        var rpx = G.curlRk * (id.curlDHalf - G.curlR0), floor = !(rpx > G.curlRminPx), how = 'dHalf';
        // (2026-10-10h) 사진 결을 따라 그은 선의 흔들림 폭(진폭)으로 직접 잰 반경 — 흔들리는 선이 충분하면 이것을 씀
        var hx = id.curlHelix, hxOk = G.curlHelix && hx && hx.peak >= G.helixPeak && hx.beta >= G.helixBetaLo && hx.beta <= G.helixBetaHi && hx.P >= 6 && hx.D > 2;
        if (hxOk) { rpx = hx.D / 2; floor = false; how = 'helix'; }
        else if (G.curlAmp && id.curlAmpPx > 0 && id.curlWavy >= G.curlAmpWavy && id.curlAmpN >= 60) { rpx = id.curlAmpPx * G.curlAmpK; floor = false; how = 'amp'; }
        else if (floor) rpx = G.curlRminPx;
        out.rViews.push({ a: a, dHalf: id.curlDHalf, rpx: rpx, cm: rpx * cpp, floor: floor, how: how, pitchCm: hxOk ? hx.P * cpp : null, beta: hxOk ? hx.beta : null, hxPeak: hx ? hx.peak : null, wavy: id.curlWavy, lamCm: id.curlLamPx ? id.curlLamPx * cpp : null });
        rs.push(rpx * cpp);
      });
      if (!seen) out.rNote = '굵기를 잰 뷰가 없음(사진을 다시 분석하면 잽니다) — 웨이브 50';
      else if (!rs.length && flat) { out.rNote = '결이 끝까지 안 틀어짐(거의 직선) — 컬 0으로'; out.flatAll = true; if (flat === seen) { out.raw = 0; out.value = 0; } }
      else if (rs.length) {
        rs.sort(function (x, y) { return x - y; });
        out.rCm = rs.length % 2 ? rs[(rs.length - 1) / 2] : (rs[rs.length / 2 - 1] + rs[rs.length / 2]) / 2;
      } else out.rNote = '카메라 배율이 없어 cm로 못 바꿈 — 웨이브 50';
      // (2026-10-10o) 굵은 웨이브(물결 펌) — 결 꺾임(°/px)이 낮아 컬 0으로 잡히지만, 나선 측정이 큰 반복(한 바퀴 3~15cm)을 잡으면 웨이브로 봄
      try {
        var hv = out.rViews.filter(function (v) { return v.how === 'helix' && v.pitchCm >= G.waveHelixPitchLo && v.pitchCm <= G.waveHelixPitchHi && v.cm >= G.waveHelixRLo && (!(G.waveHelixRMaxK > 0) || v.cm <= G.waveHelixRMaxK * v.pitchCm); });   // (2026-10-12c) 반경이 한 바퀴 간격보다 큰 값은 웨이브가 아님(직모 정면 사진이 반경 8.3cm·간격 7.2cm로 통과해 컬 65가 들어갔음)
        if (G.waveFromHelix && out.value < G.waveFromHelixBelow && hv.length >= 1) {
          var ps = hv.map(function (v) { return v.pitchCm; }).sort(function (x, y) { return x - y; }), rr = hv.map(function (v) { return v.cm; }).sort(function (x, y) { return x - y; });
          var pm = ps[ps.length >> 1], rm = rr[rr.length >> 1];
          out.waveHelix = { pitchCm: pm, rCm: rm, views: hv.length, was: out.value };
          out.value = out.raw = Math.round(Math.max(G.waveCurlLo, Math.min(G.waveCurlHi, G.waveCurlLo + (G.waveCurlHi - G.waveCurlLo) * Math.min(1, rm / Math.max(0.5, pm) * 2))));
          out.rCm = rm; out.pitchCm = pm;
        }
      } catch (e) {}
      if (G.curlRadius && out.rCm > 0 && out.value > 0) {
        var cm = modelCmPerUnit() || 16.4, FX = (typeof CURL3D_FIX !== 'undefined') ? CURL3D_FIX : { ampGamma: 1, radiusGamma: 0.5 };
        var amp = Math.pow(out.value / 100, FX.ampGamma || 1), need = (out.rCm / cm) / Math.pow(amp, FX.radiusGamma || 1);   // 필요한 로드 반경(모델 단위)
        var rMin = (typeof CURL3D_R_MIN !== 'undefined') ? CURL3D_R_MIN : 0.02, rMax = (typeof CURL3D_R_MAX !== 'undefined') ? CURL3D_R_MAX : 0.07;
        out.wave = Math.round(clampN((need - rMin) / (rMax - rMin), 0, 1) * 100);
        out.rodScale = need > rMax ? Math.min(G.curlRodScaleMax, need / rMax) : 1;
        out.rodCm = need * cm;
      }
    } catch (e) { out.rNote = '굵기 재기 실패: ' + (e && e.message || e); }
    return out;
  };
  G.measure = function () {
    var m = G.model;
    if (!m || G.src !== state._hair3Dneutral || !m.strands || !m.strands.length) return null;
    var info = m.rgInfo || { isLong: false, skipY: {}, plantY: {} };
    var cm = 1; try { cm = modelCmPerUnit() || 1; } catch (e) {}
    var hr = null; try { hr = headHeightRef(); } catch (e) {}
    var order = (typeof SECTION_ORDER !== 'undefined') ? SECTION_ORDER : ['crown', 'front', 'temple', 'side', 'occipital', 'nape'];
    var by = {}; m.strands.forEach(function (s) { if (s.rg) (by[s.sec] || (by[s.sec] = [])).push(s); });
    var lenCm = {}, tipAt = {}, raw = {}, lenFallback = {}, cut = {};
    order.forEach(function (sec) {
      lenFallback[sec] = 50;
      try {
        var d = JSON.parse(JSON.stringify(SECTIONS[sec].defaults)); delete d.length; delete d.curl; delete d.wave; delete d.color; cut[sec] = d;
      } catch (e) { cut[sec] = {}; }
      var a = by[sec] || []; if (a.length < 8) return;
      raw[sec] = { n: a.length, growCm: q(a.map(function (s) { return s.rg.L * cm; }), 0.5), thickCm: q(a.map(function (s) { return s.rg.t * cm; }), 0.5),
        freePct: Math.round(a.filter(function (s) { return s.rg.free; }).length / a.length * 100) };
      // ④ 부피 재기 — 이 섹션 두께(머리 표면에서 뜬 정도), 끝쪽 퍼짐, 처짐
      try {
        var flare = [], drop = [];
        a.forEach(function (s) {
          var P = s.pts, n = P.length; if (n < 4) return;
          var mid = P[n >> 1], tip = P[n - 1], r0 = P[0];
          var rM = Math.sqrt(mid.x * mid.x + mid.z * mid.z), rT = Math.sqrt(tip.x * tip.x + tip.z * tip.z);
          flare.push((rT - rM) * cm);
          var L = s.rg.L || 1; drop.push(clampN((r0.y - tip.y) / L, -1, 1));
        });
        raw[sec].flareCm = flare.length ? +q(flare, 0.5).toFixed(2) : 0;
        raw[sec].drop = drop.length ? +q(drop, 0.5).toFixed(2) : 0;
      } catch (e) {}
      if (info.isLong) {
        if (hr) tipAt[sec] = +((hr.yTop - q(a.map(function (s) { return s.rg.tipY; }), 0.5)) / hr.H).toFixed(3);
      } else {
        lenCm[sec] = +q(a.map(function (s) {
          return (s.rg.free ? s.rg.L : Math.min(s.rg.L, Math.max(G.minLenCm / cm, G.liftK * s.rg.t))) * cm;
        }), 0.5).toFixed(1);
      }
    });
    // 뿌리 볼륨 · 넘김 · 가르마 — 윗머리에서
    var top = (by.crown || []).concat(by.front || []);
    var tTop = top.length ? q(top.map(function (s) { return s.rg.t * cm; }), 0.5) : 1.5;
    var volume = Math.round(clampN(35 + 10 * tTop, 20, 95));
    // ④ 섹션 부피 → volShare/volPoint/weight (SB.map 거꾸로 — 전체 volume이 윗머리 두께를 맡고, 섹션은 그 비율만)
    var K0 = { crown: 1, front: .85, temple: .7, side: .75, occipital: .85, nape: .5 };
    try { var vk = (CFG.VOLUME3D() || {}).secK; if (vk) K0 = vk; } catch (e) {}
    var kTop = ((K0.crown || 1) + (K0.front || 1)) / 2, volRaw = {};
    order.forEach(function (sec) {
      var R = raw[sec]; if (!R || !(tTop > 0)) return;
      var share = 50 * (R.thickCm / tTop) * kTop / (K0[sec] || 1);
      var point = 50 + 25 * (R.flareCm || 0);                 // 끝이 1cm 더 벌어지면 +25
      var weight = 50 + 50 * ((R.drop || 0) - 0.6) / 0.4;     // 끝이 곧게 처질수록 무거움
      volRaw[sec] = { volShare: Math.round(share), volPoint: Math.round(point), weight: Math.round(weight) };
      if (G.secVol === false) return;
      cut[sec].volShare = Math.round(clampN(share, 0, 100));
      cut[sec].volPoint = Math.round(clampN(point, 0, 100));
      cut[sec].weight = Math.round(clampN(weight, 0, 100));
    });
    var swSum = 0; top.forEach(function (s) { swSum += -s.rg.dz; });
    var sweep = top.length ? Math.round(clampN(100 * swSum / top.length, -100, 100)) : 0;
    var part = { x: 0, score: 0, lateral: 0 };
    try {
      var E = getScalpEllipsoid(), best = -1, bx = 0, k, x0, okW, totW, lat = 0;
      top.forEach(function (s) { lat += Math.abs(s.rg.dx); }); lat = top.length ? lat / top.length : 0;
      for (k = -6; k <= 6; k++) {
        x0 = k / 10 * E.a; okW = 0; totW = 0;
        top.forEach(function (s) {
          var w = Math.abs(s.rg.dx); totW += w;
          if ((s.pts[0].x - x0) * s.rg.dx > 0) okW += w;      // 가르마 바깥쪽으로 흐르는가
        });
        if (totW > 0 && okW / totW > best) { best = okW / totW; bx = k / 10; }
      }
      part = { x: bx, score: best, lateral: lat };
    } catch (e) {}
    // 페이드
    var low = ['side', 'nape', 'occipital', 'temple'], nSkip = 0, nPlant = 0, vs = [];
    low.forEach(function (sec) {
      var sk = info.skipY[sec] || [], pl = info.plantY[sec] || [], all = sk.concat(pl);
      nSkip += sk.length; nPlant += pl.length;
      if (!all.length) return;
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
      if (!(hi > lo)) return;
      sk.forEach(function (y) { vs.push((y - lo) / (hi - lo)); });
    });
    var bareShare = nSkip + nPlant ? nSkip / (nSkip + nPlant) : 0;
    var fade = { enabled: false, guard: 1, height: 35, blendWidth: 40, disc: 0, taper: 0 };
    if (!info.isLong && bareShare > 0.12 && vs.length > 20) {
      fade = { enabled: true, guard: 1, height: Math.round(clampN(100 * q(vs, 0.8) + 10, 10, 95)), blendWidth: 40, disc: 0, taper: 60 };
    }
    var styling = {}; try { styling = neutralStyling(); } catch (e) { styling = { sweep: 0, volume: 50, flow: 0, part: 0, partAmt: 0, finish: 50, sleek: 0 }; }
    styling.sweep = sweep; styling.volume = volume;
    var pc = { value: 0, deg: null, views: [] }; try { pc = G.photoCurl(); } catch (e) {}
    var spec = { name: '', cut: cut, perm: { curl: pc.value, wave: pc.wave != null ? pc.wave : 50, rCm: pc.rCm > 0 ? +pc.rCm : null, pitchCm: (function () { try { var ps = (pc.rViews || []).filter(function (v) { return v.pitchCm > 0; }).map(function (v) { return v.pitchCm; }).sort(function (x, y) { return x - y; }); return ps.length ? (ps.length % 2 ? ps[ps.length >> 1] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2) : (pc.pitchCm > 0 ? pc.pitchCm : null); } catch (e) { return null; } })() }, styling: styling, globalCurl: pc.value, fade: fade, lenFallback: lenFallback, version: 1, source: 'regrow' };
    if (info.isLong) spec.tipAt = tipAt; else spec.lenCm = lenCm;
    return { spec: spec, isLong: info.isLong, raw: raw, volRaw: volRaw, tTopCm: tTop, part: part, bareShare: bareShare, order: order, curl: pc };
  };
  G.measureLines = function (r) {
    r = r || G.measure();
    if (!r) return ['[스타일 숫자] 다시 기른 모델이 없습니다 — 마네킹을 끄면 원본 머리를 다시 기릅니다'];
    var sp = r.spec, L = ['[스타일 숫자] 다시 기른 머리에서 잰 값 (' + (r.isLong ? '긴 머리 — 끝 높이로 저장' : '짧은 머리 — 길이 cm로 저장') + ')'];
    if (r.isLong) {
      L.push('  끝 높이(정수리에서 두상 높이의 몇 배 아래 · 1.00 ≈ 턱): ' + r.order.filter(function (k) { return sp.tipAt[k] != null; }).map(function (k) { return k + ' ' + sp.tipAt[k].toFixed(2); }).join(' · '));
    } else {
      L.push('  길이 cm(어림 — 두께×' + G.liftK + ' 또는 기른 길이 중 짧은 쪽): ' + r.order.filter(function (k) { return sp.lenCm[k] != null; }).map(function (k) { return k + ' ' + sp.lenCm[k]; }).join(' · '));
    }
    L.push('  참고 — 섹션별 [기른 길이 cm / 뿌리 자리 두께 cm / 두피 밖으로 늘어진 가닥 %]: ' + r.order.filter(function (k) { return r.raw[k]; }).map(function (k) {
      return k + ' ' + n1(r.raw[k].growCm) + '/' + n1(r.raw[k].thickCm) + '/' + r.raw[k].freePct + '%'; }).join(' · '));
    if (r.volRaw) L.push('  섹션 부피 [volShare/volPoint/weight] (괄호 = 막대 0~100 밖이라 잘린 원래 값): ' + r.order.filter(function (k) { return r.volRaw[k]; }).map(function (k) {
      var c = sp.cut[k], v = r.volRaw[k], f = function (key) { return c[key] + (c[key] !== v[key] ? '(' + v[key] + ')' : ''); };
      return k + ' ' + f('volShare') + '/' + f('volPoint') + '/' + f('weight') + ' ←두께 ' + n1(r.raw[k].thickCm) + 'cm·끝퍼짐 ' + r.raw[k].flareCm + 'cm·처짐 ' + r.raw[k].drop; }).join(' · '));
    L.push('  페이드: ' + (sp.fade.enabled ? '켜짐 · 높이 ' + sp.fade.height + '% · 가드 ' + sp.fade.guard + ' · 테이퍼 ' + sp.fade.taper + '% (가드·테이퍼는 기본값)' : '꺼짐') +
      ' · 옆·뒤에서 사진에 머리가 없던 뿌리 ' + Math.round(r.bareShare * 100) + '%');
    L.push('  뿌리 볼륨 ' + sp.styling.volume + ' (윗머리 두께 ' + n1(r.tTopCm) + 'cm) · 넘김 ' + (sp.styling.sweep > 0 ? '+' : '') + sp.styling.sweep + ' (' + (sp.styling.sweep > 15 ? '뒤로' : sp.styling.sweep < -15 ? '앞으로' : '중립') + ')');
    L.push('  가르마(재기만 — 스펙에는 아직 안 넣음): 위치 ' + (r.part.x > 0 ? '+' : '') + r.part.x.toFixed(1) + ' (두상 반폭 대비, 모델 x축) · 양쪽으로 갈라지는 정도 ' + Math.round(r.part.score * 100) + '% · 옆으로 흐르는 세기 ' + r.part.lateral.toFixed(2));
    var pc = r.curl || { value: 0, deg: null, views: [] };
    L.push('  컬 ' + pc.value + (pc.deg == null ? ' — 결 꺾임을 잰 뷰가 없어 0' :
      ' ← 결 꺾임 ' + pc.deg.toFixed(2) + '°/px(뷰 중앙값) · ' + pc.views.map(function (v) { return v.a + ' ' + v.v.toFixed(2) + (v.ok ? '' : '(표본 ' + v.n + ' — 안 씀)'); }).join(' · ') +
      ' · 환산 ' + G.curlLo + '~' + G.curlHi + '°/px → 0~' + G.curlMax + ' (어림값 — 직모 사진에서 컬이 잡히면 curlLo를 올릴 것)' + (G.curl ? '' : ' · 꺼짐(REGROW.curl=false) — 켜면 ' + pc.raw)) +
      (pc.value > 0 ? ' · 편 길이 = 보이는 길이 × ' + (1 / curlRemain(pc.value)).toFixed(2) : '') + (pc.waveHelix ? ' · 굵은 웨이브로 봄(나선 측정 ' + pc.waveHelix.views + '장 · 한 바퀴 ' + pc.waveHelix.pitchCm.toFixed(1) + 'cm · 반경 ' + pc.waveHelix.rCm.toFixed(1) + 'cm · 예전 컬 ' + pc.waveHelix.was + ')' : ''));
    if (pc.rViews && (pc.rViews.length || pc.rNote)) L.push('  컬 굵기 ' + (pc.rCm > 0 ? '반경 ' + pc.rCm.toFixed(1) + 'cm(뷰 중앙값) → ' + (G.curlRadius ? '웨이브 ' + pc.wave +
      (pc.rodScale > 1 ? ' + 로드 ×' + pc.rodScale.toFixed(2) + '(다시 기른 가닥에만)' : '') + (pc.rodCm ? ' · 로드 반경 ' + pc.rodCm.toFixed(1) + 'cm' : '') : '꺼짐(REGROW.curlRadius=false) — 웨이브 50') : (pc.rNote || '못 잼')) +
      (pc.rViews.length ? ' · ' + pc.rViews.map(function (v) { return v.a + ' ' + (v.flat ? '직선' : v.noScale ? 'dHalf ' + v.dHalf.toFixed(1) + 'px(배율 없음)' : v.cm.toFixed(1) + 'cm(' + (v.how === 'helix' ? '나선 측정 · 한 바퀴 간격 ' + v.pitchCm.toFixed(1) + 'cm · 가닥 기울기 ' + Math.round(v.beta) + '° · 반복 세기 ' + v.hxPeak.toFixed(2) + ' · ' : '') + (v.how === 'amp' ? '결 선 흔들림 폭으로 잼 · 흔들리는 선 ' + Math.round((v.wavy || 0) * 100) + '%' + (v.lamCm ? ' · 한 바퀴 길이 ' + v.lamCm.toFixed(1) + 'cm' : '') + ' · ' : '') + 'dHalf ' + v.dHalf.toFixed(1) + 'px' + (v.floor ? ' — 하한, 이보다 잔 컬일 수 있음' : '') + ')'); }).join(' · ') : '') +
      ' · 식: 반경px = ' + G.curlRk + '×(dHalf−' + G.curlR0 + ') (어림)');
    return L;
  };
  G.register = function () {
    var r = G.measure();
    if (!r) { try { showToast('원본 머리를 아직 못 쟀어요 — 마네킹을 끄고 잠시 기다려 주세요'); } catch (e) {} return null; }
    var name = null; try { name = prompt((typeof tUI === 'function' ? tUI : function (x) { return x; })('이 스타일 이름을 입력하세요 (원본 머리에서 잰 숫자로 등록)'), ''); } catch (e) {}
    if (!name || !name.trim()) return null;
    name = name.trim();
    var id = 'custom-' + Date.now(), sections = {}, sbv = {};
    r.order.forEach(function (sec) { try { sections[sec] = Object.assign({}, SECTIONS[sec].defaults, { curl: r.spec.perm.curl }); } catch (e) {} });
    try { (typeof ANGLES !== 'undefined' ? ANGLES : []).forEach(function (a) { sbv[a] = Object.assign({}, r.spec.styling); }); } catch (e) {}
    r.spec.name = name;
    var color = '#2A1B12'; try { color = (state.hairMasks.front && state.hairMasks.front.avgColor) || color; } catch (e) {}
    var stl = { id: id, specId: id, spec: r.spec, name: name, tags: '원본에서 잼', isCustom: true, sections: sections, styling: Object.assign({}, r.spec.styling),
      stylingByView: sbv, globalCurl: r.spec.perm.curl, length: 50, curl: r.spec.perm.curl, volume: r.spec.styling.volume, colorHex: color };
    try {
      STYLES.push(stl);
      if (typeof saveCustomStylesToStorage === 'function') saveCustomStylesToStorage();
      if (typeof buildStyleGrid === 'function') buildStyleGrid();
      if (typeof showToast === 'function') showToast('스타일로 등록했어요: ' + name);
      console.log(TAG + ' 스타일 등록 "' + name + '"\n' + G.measureLines(r).join('\n'));
    } catch (e) { console.warn(TAG + ' 스타일 등록 실패', e); return null; }
    return stl;
  };
  var mbox = null;
  G.showMeasure = function () {
    var r = G.measure(), text = G.measureLines(r).join('\n');
    console.log(text);
    try {
      var host = document.querySelector('#screen-adjust .adjust-preview'); if (!host) return;
      if (!mbox) {
        mbox = document.createElement('div');
        mbox.style.cssText = 'position:absolute;left:8px;right:8px;top:70px;bottom:56px;z-index:80;background:rgba(0,0,0,0.9);color:#0f0;font:11px/1.6 monospace;padding:8px;border-radius:6px;white-space:pre-wrap;overflow:auto;';
        host.appendChild(mbox);
      }
      mbox.textContent = '';
      var bar = document.createElement('div'); bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;';
      var mk = function (label, fn) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.style.cssText = 'min-height:30px;padding:4px 12px;border-radius:8px;border:1px solid #0f0;background:#062a06;color:#0f0;font:600 12px monospace;';
        b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); }); return b;
      };
      if (r) bar.appendChild(mk('이 숫자로 스타일 등록', function () { if (G.register()) mbox.style.display = 'none'; }));
      bar.appendChild(mk('복사', function (b) {
        try { navigator.clipboard.writeText(text).then(function () { b.textContent = '복사됨 ✓'; setTimeout(function () { b.textContent = '복사'; }, 1500); }, function () { b.textContent = '복사 실패'; }); } catch (e) { b.textContent = '복사 실패'; }
      }));
      bar.appendChild(mk('닫기', function () { mbox.style.display = 'none'; }));
      mbox.appendChild(bar); mbox.appendChild(document.createTextNode(text));
      mbox.style.display = 'block';
    } catch (e) {}
  };
  G.lines = function () {
    var s = G.stats, L = ['[다시 기르기] ' + (G.on ? '켜짐' : '꺼짐') + (G.building ? ' · 만드는 중' : '') + (G.model && G.src === state._hair3Dneutral ? ' · 모델 있음' : ' · 모델 없음') + (G.lastErr ? ' · ⚠ ' + G.lastErr : '')];
    if (!s) return L;
    var tot = s.n || 1, secs = Object.keys(s.sec).map(function (k) { return k + ' ' + Math.round(s.sec[k] / tot * 100) + '%'; }).join(' · ');
    L.push('  가닥 ' + s.n + '개(사진에 머리가 없어 안 심은 뿌리 ' + s.skipped + ') · ' + s.ms + 'ms' + (s.workMs != null ? '(걷기에 일한 시간 ' + s.workMs + ' · 마무리 ' + s.finMs + ' · 사이사이 쉰 시간 ' + Math.max(0, s.ms - s.workMs - s.finMs) + ' — ' + s.slices + '번 나눠 함)' : '') + (s.mShare < 1 ? ' · 재는 용도라 ' + (G.measureFull || []).join('·') + ' 밖은 ' + Math.round(s.mShare * 100) + '%만 기름(전부 REGROW.measureShare=1)' : '') + ' · 사진 ' + s.cams);
    L.push('  뿌리 분포 — ' + secs);
    L.push('  길이 ' + n1(s.lenMed) + '/' + n1(s.lenP90) + 'cm(중앙값/p90) · 꺾임 ' + n1(s.kinkMed) + '°/' + n1(s.kinkP90) + '° · 결을 사진에서 못 읽고 이어 간 걸음 ' + n1(s.estPct) + '%');
    L.push('  길이 상한(' + (s.isLong ? '긴 머리 — 넉넉히' : '짧은 머리 — 섹션 중앙값×' + G.lenMul) + ') cm: ' + s.capTxt);
    L.push('  멈춘 이유 — 머리 영역 밖 ' + s.stopMask + ' · 길이 상한 ' + s.stopCap + ' · 걸음 수 상한 ' + s.stopMax + ' · 두피 밖으로 나가 늘어뜨린 가닥 ' + s.free + ' · 반대로 기른 뿌리(아래쪽에 머리 없음 · 두께 ' + G.flipThickCm + 'cm 이상) ' + s.flipped + ' · 얇아서 안 뒤집은 뿌리 ' + (s.flipKept || 0) + '(그중 앞 헤어라인에서 옆으로 눕힌 ' + (s.flipSide || 0) + ' · 짧게 심은 ' + (s.stubN || 0) + (G.sideLayStay ? ' · 옆으로 눕힌 가닥을 두피 끝·섹션 길이에서 끝냄 ' + (s.sideEnd || 0) : '') + ')' + ' · 비탈 거꾸로 오르기 벌점 ' + G.polDown + (G.polThickHi > G.polThickLo ? '(뿌리 두께 ' + G.polThickLo + '~' + G.polThickHi + 'cm에서 풀림)' : '(두께로 안 풂)') + (G.glossSkip ? ' · 페이드(두께 없는 자리) 앞에서 멈춘 가닥 ' + (s.thinStop || 0) + ' · 광택 띠라 안 읽은 결 ' + (s.glossN || 0) + '(둘레와 같아 살린 것 ' + (s.glossKeep || 0) + ')' : ''));
    if (s.backFix) L.push('  뒷머리 앞쏠림 막기 — ' + (s.backFoldAfter ? '읽을 때는 안 막음 · 다 읽은 뒤 어깨 아래에서 뒤로 넘긴 가닥 ' + (s.foldN || 0) + '개(옮긴 점 ' + (s.foldPts || 0) + ' · 끄기 REGROW.backFoldAfter=false) · ' : '') + '뒤쪽에서 두피를 벗어난 가닥 ' + s.backN + '개(길이 중앙값 ' + n1(s.backLenMed) + 'cm) · 앞으로 가려던 걸음 ' + s.backFwd + '회 막음 · 뒤 사진 끝 높이까지 이어 간 걸음 ' + s.backKeep +
      (s.backTipN >= 20 ? ' · 뒤 사진 머리 끝 = 정수리에서 ' + n1(s.backTipCm) + 'cm 아래(가닥 ' + s.backTipN + '개 기준)' : ' · 뒤 사진 가닥이 적어(' + s.backTipN + ') 끝 높이 기준은 안 씀'));
    L.push('  곧게 늘어뜨리기(긴 머리 · 목 아래): ' + (!G.hangDown ? '꺼짐' : !s.isLong ? '짧은 머리라 안 씀' : !s.hang ? '끝 높이를 낼 사진 가닥이 모자라 안 씀' :
      '켜짐 — 곧게 내린 가닥 ' + s.hangN + '개(' + s.hangSteps + '걸음) · 끝 높이에서 멈춤 ' + s.stopTip + ' · 끝 높이 = 정수리에서 ' + n1(s.hangTipCm[0]) + '~' + n1(s.hangTipCm[1]) + 'cm 아래(' + s.hangSrc + '의 25~75%)'));
    L.push('  3D 머리 덩어리: ' + (s.vol ? s.vol.cm + 'cm 칸 ' + s.vol.n + '개 중 머리 ' + s.vol.inN + '개(좁은 덩어리 ' + (s.vol.tN != null ? s.vol.tN : '-') + ') · ' + s.vol.ms + 'ms (걷기·마네킹 위 컬이 같이 씀 · 끄기 REGROW.volume=false)' : '안 씀'));
    L.push('  뿌리 결 앞뒤: ' + (s.pol ? '또렷한 칸 ' + s.pol.sure + ' · 이웃 칸 따라 정한 칸 ' + s.pol.nbr + ' · 둘 다 아니라 가운데 선 바깥쪽으로 정한 가닥 ' + s.pol.mid + ' (끄기 REGROW.polNbr=false)' : '예전 규칙'));
    L.push('  누운 머리 길이(짧은 머리 · 두께×' + G.liftK + '에서 끝): ' + (G.onScalpLen ? (s.isLong ? '긴 머리라 안 씀' : '끝낸 가닥 ' + (s.lenThick || 0) + '개 (끄기 REGROW.onScalpLen=false)') : '꺼짐'));
    L.push('  두피 밖 3D 방향(사진 두 장 이상의 결로 깊이까지): ' + (G.tri3D ? '켜짐 — 그렇게 정한 걸음 ' + (s.triN || 0) + '회 (끄기 REGROW.tri3D=false)' : '꺼짐'));
    L.push('  껍질(사진 교집합): ' + (s.hullV ? s.hullV + ' 중 그 자리를 마주 보는 사진이 머리 영역에서 ' + G.hullMarginCm + '(정면)·' + G.hullMarginSideCm + '(옆·뒤)cm 넘게 밖이라 덩어리 밖인 걸음(덩어리를 쓰면 다른 이유로 밖인 것도 포함) ' + (s.hullN || 0) + '회 — 다른 사진이 머리라고 해도 멈춤 (예전: 다수결 · 끄기 REGROW.hullViews=[])' : '안 씀(다수결)'));
    L.push('  직모 뼈대(곱슬 사진 · 큰 흐름만 따라 기름 · 컬은 그 위에 얹음): ' + (s.straight ? '켜짐 — ' + s.straight + ' (끄기 REGROW.straightCurly=false)' : '안 씀'));
    if (s.wf) L.push('  읽은 굴곡 장(편 길에서 벗어난 만큼을 자리마다 모음): ' + s.wf.cellCm + 'cm 칸 ' + s.wf.n + '개 중 아는 칸 ' + s.wf.known + ' · 가닥 ' + s.wf.strands + '개(표본 ' + s.wf.samples + ') · 이웃과 같이 굽은 크기 중앙값 ' + (+s.wf.ampCm).toFixed(2) + 'cm / 위쪽 10% ' + (+s.wf.ampHiCm).toFixed(2) + 'cm · ' + s.wf.ms + 'ms (마네킹에 얹기 = 주소 끝에 ?rw=1 또는 PHOTO_CURL.readWave=true)');
    L.push('  결 정렬(기른 뒤): ' + (!s.align || !s.align.on ? '꺼짐' : s.align.skipped ? '곱슬머리라 안 함(잰 컬이 ' + G.alignCurlOff + ' 이상 · REGROW.alignCurlOff=0이면 컬과 무관하게 정렬)' : '켜짐' + (s.align.kMul < 0.999 ? '(컬이 있어 세기 ×' + s.align.kMul.toFixed(2) + ')' : '') + ' — 이웃 결에서 벗어나 돌린 가닥 ' + s.align.strands + '개(마디 ' + s.align.segs + '개 · 돌린 각 중앙값 ' + n1(s.align.rotMed) + '° / p90 ' + n1(s.align.rotP90) +
      '°) · 혼자 나간 꼬리 자름 ' + s.align.trimmed + '개(평균 ' + n1(s.align.trimCm) + 'cm) · 칸 ' + s.align.cells + ' · ' + s.align.ms + 'ms'));
    L.push('  목: ' + (G.neck ? '켜짐 — 목 안으로 들어가려던 걸음 ' + (s.neckPush || 0) + '회 밖으로 밀어냄' : '꺼짐'));
    L.push('  두께(두피→머리 겉면) 중앙값 ' + n1(s.tMed) + 'cm · p90 ' + n1(s.tP90) + 'cm · 윤곽선으로 잰 칸 ' + s.tMeasured + ' · 이웃으로 메운 칸(추정) ' + s.tFilled + ' · 두께 0으로 잰 칸 ' + s.tZero + ' / 전체 ' + s.cells);
    return L;
  };
  /* (2026-10-04e) backFix로 뒤로 늘어뜨린 가닥은 조정 단계의 "사진 영역 밖 다듬기"를 건너뜀
     (그 다듬기는 앞·옆 사진까지 섞어 판정해서, 어깨 앞으로 머리를 넘긴 사진이면 목 뒤 가닥을 다시 잘라 냄) */
  var origTrim = W.trimStrandToOccupancy3D;
  if (typeof origTrim === 'function') W.trimStrandToOccupancy3D = function (pts, probe, stats, opts) {
    if ((G.backFix || G.hangDown) && opts && opts.srcPts && opts.srcPts._rgKeep) return pts;
    return origTrim.apply(this, arguments);
  };

  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try { L = L.concat(G.lines()); } catch (e) {}
    try { if (G.on && G.model) L = L.concat(G.measureLines()); } catch (e) {}
    if (G.adjErr) L.push('[다시 기르기] ⚠ 조정 실패: ' + G.adjErr);
    return L;
  };

  console.log(TAG + ' 설치 — 마네킹 OFF = 다시 기른 원본 머리(+치수) · 마네킹 ON = 마네킹 모드. 콘솔: REGROW.lines().join("\\n") · REGROW.measureLines().join("\\n")' + (G.trace ? ' · 걸음 기록 켜짐(v20261012e — 내보내기에 실림 · 끄기 REGROW.trace=false)' : ' · 걸음 기록 꺼짐'));
})();
