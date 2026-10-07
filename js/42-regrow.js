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
    lenPct: 0.5, lenMul: 1.25,    // 짧은 머리 길이 상한 = 섹션별 원본 가닥 길이 중앙값 × 1.25
    longPct: 0.95, longMul: 1.3,  // 긴 머리(어깨 아래로 내려오는 가닥이 longShare 넘게 있음)는 넉넉히
    longShare: 0.1,
    inertia: 0.55,      // 직전 방향을 섞는 비율(0 = 사진 결 그대로)
    smooth: 2,          // 다 기른 뒤 고르게 펴는 횟수
    liftK: 2.2,         // 짧은 머리 길이 어림 = 뿌리 자리 두께 × 이 값
    // (2026-10-04h) 컬 재기 — 머리말 v4 참고
    curl: true,
    curlLo: 1.8, curlHi: 4.0,   // 결 꺾임(°/px) 이 구간을 컬 0 → curlMax로 (⚠ 합성 무늬로 잡은 어림값)
    curlMax: 90,                // 100이면 가닥 점 수가 3배(나선 11바퀴) — 90이면 2배쯤
    curlMin: 10,                // 이보다 작게 재지면 0(직모)으로 봄
    curlMinN: 20,               // 뷰의 표본 수가 이보다 많아야 믿음
    curlKeepShape: true,        // 잰 컬에서 겉모양이 사진과 같도록 편 길이를 미리 늘려 잡음
    // (2026-10-04i) 컬 굵기 — 머리말 v5 참고
    curlRadius: false,          // (2026-10-06r) 끔 — 켜면 컬이 죽음(웨이브 100 + 로드 ×1.29 = 곧은 막대). q에서 다시 켠 것은 잘못 읽은 것 — 머리말 v8 참고
    curlRk: 5, curlR0: 3.3,     // 컬 반경(px) = curlRk × (dHalf − curlR0)  (⚠ 합성 타래 무늬로 맞춘 어림)
    curlRminPx: 5,              // 이보다 작게는 구분 못 함(결 방향장의 창 크기)
    curlRodScaleMax: 3,         // 로드 최대를 넘길 수 있는 배수 상한
    minLenCm: 0.8,
    tapPx: 4,           // 머리 영역 판정 여유(800px 기준)
    gravity: 0.25,      // 두피 밖 구간에서 중력을 섞는 비율
    // (2026-10-04e) 뒷머리가 앞으로 쏠리는 것 막기 — 아래 backFix 설명 참고
    backFix: true,
    freeDepth: 0.6,     // 두피 밖 구간에서 사진 결이 지어낼 수 있는 깊이(카메라 쪽/반대쪽) 움직임 상한(가로·세로 움직임의 몇 배)
    backFrom: 0.1, backFull: 0.5,   // 두피를 벗어난 자리가 얼마나 뒤쪽인가(0 = 귀 옆 · 1 = 정뒤) — 이 구간에서 0→1로 막음
    // (2026-10-05k) 긴 머리는 목 아래에서 곧게 늘어뜨림 — 머리말 v6 참고
    hangDown: true,
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
    neck: true, neckMargin: 1.1,
    sliceMs: 30,
    seed: 20261003
  }, W.REGROW || {});
  var S = G.stats = null;

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
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
    var cams = [];
    probe.cams.forEach(function (c) {
      var mi = state.hairMasks && state.hairMasks[c.angle];
      if (!mi || !c.smp || !(c.iw > 0) || !(c.ih > 0)) return;
      var mw = mi.maskW || mi.w, mh = mi.maskH || mi.h;
      cams.push({ angle: c.angle, R: c.R, cx: c.cx, s: c.s, sy: c.sy, crownY: c.crownY, smp: c.smp, iw: c.iw, ih: c.ih,
        ori: mi.orientation || null, mw: mw, kx: mw / mi.w, ky: mh / mi.h, tap: Math.max(2, G.tapPx * c.iw / 800) });
    });
    if (!cams.length) return { err: '쓸 수 있는 사진 없음' };

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
    function vote(p) {
      var yes = 0, no = 0, i, cam, o;
      for (i = 0; i < cams.length; i++) {
        cam = cams[i]; o = proj(cam, p);
        if (o.ix < 0 || o.iy < 0 || o.ix >= cam.iw || o.iy >= cam.ih) continue;
        if (o.z < 0) {                               // 카메라 반대편
          if (p.y < yBody) continue;                 // 목·어깨에 가려졌을 수 있음(몸은 모델에 없음)
          if (behindSkull(cam, p)) continue;         // 두개골에 가림
        }
        if (hairAt(cam, o.ix, o.iy)) yes++; else no++;
      }
      return yes + no === 0 ? -1 : (yes >= no ? 1 : 0);
    }

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
    function flow(p, n, ref, flat) {
      var ax = 0, ay = 0, az = 0, wsum = 0, i, cam, o, R, ncx, ncy, ncz, sm, pol, dX, dY, dZ, mx, my, mz, l, w, dot;
      for (i = 0; i < cams.length; i++) {
        cam = cams[i]; if (!cam.ori) continue;
        R = cam.R;
        ncz = R[6] * n.x + R[7] * n.y + R[8] * n.z;
        if (ncz < G.minFacing) continue;
        o = proj(cam, p);
        if (o.ix < 0 || o.iy < 0 || o.ix >= cam.iw || o.iy >= cam.ih) continue;
        if (!(cam.smp.at(o.ix, o.iy) > 0)) continue;
        sm = sampleOrientation(cam.ori, o.ix * cam.kx, cam.mw, o.iy * cam.ky);
        if (!sm || !(sm.coherence >= G.minCoh)) continue;
        ncx = R[0] * n.x + R[1] * n.y + R[2] * n.z; ncy = R[3] * n.x + R[4] * n.y + R[5] * n.z;
        dX = Math.cos(sm.angle) * cam.s; dY = -Math.sin(sm.angle) * cam.sy;
        dZ = -(dX * ncx + dY * ncy) / ncz;
        l = Math.hypot(dX, dY);
        var zl = (flat && G.backFix) ? G.freeDepth : 3;                                     // 스치는 각에서 깊이가 터지는 것 막음(두피 밖은 더 좁게)
        if (Math.abs(dZ) > zl * l) dZ = (dZ < 0 ? -zl : zl) * l;
        mx = R[0] * dX + R[3] * dY + R[6] * dZ; my = R[1] * dX + R[4] * dY + R[7] * dZ; mz = R[2] * dX + R[5] * dY + R[8] * dZ;
        l = Math.hypot(mx, my, mz); if (!(l > 1e-12)) continue;
        mx /= l; my /= l; mz /= l;
        if (ref) dot = mx * ref.x + my * ref.y + mz * ref.z;
        else if (wsum > 0) dot = mx * ax + my * ay + mz * az;
        else { pol = 0; try { pol = flowPolarityFor(sm.angle, sm); } catch (e) {} dot = pol < 0 ? -1 : 1; }
        if (dot < 0) { mx = -mx; my = -my; mz = -mz; }
        w = ncz * ncz * sm.coherence;
        ax += w * mx; ay += w * my; az += w * mz; wsum += w;
      }
      l = Math.hypot(ax, ay, az);
      return l > 1e-9 ? { x: ax / l, y: ay / l, z: az / l } : null;
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
    // (2026-10-04d) 가닥 수 = 48번(STRAND_BUDGET.total · 기본 30,000). 없으면 예전처럼 사진 가닥 수.
    var total = (W.STRAND_BUDGET && W.STRAND_BUDGET.on !== false && W.STRAND_BUDGET.total > 0) ? W.STRAND_BUDGET.total : photo.strands.length;

    var st = { n: 0, stub: 0, skipped: 0, steps: 0, est: 0, stopMask: 0, stopCap: 0, stopMax: 0, free: 0, flipped: 0,
      backN: 0, backFwd: 0, backKeep: 0, backLen: [], neckPush: 0, hangN: 0, hangSteps: 0, stopTip: 0,
      len: [], kink: [], sec: {} };
    var down = { x: 0, y: -1, z: 0 };

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
      var bw = 0, myTip = null;                                             // backFix: 뒤쪽 정도(0~1) · 이 가닥이 내려갈 끝 높이
      var hangTip = null, hung = false;                                     // (v6) 곧게 내릴 끝 높이 · 곧게 내린 적 있음

      // 첫 방향과 앞뒤
      fl = flow(F, n, null);
      d = fl || down; if (!fl) estSteps++;
      dt = tangent(d, n) || tangent({ x: 0.3, y: -1, z: 0.2 }, n) || { x: 1, y: 0, z: 0 };
      var sgn;
      if (Math.abs(dt.y) > 0.3) sgn = dt.y < 0 ? 1 : -1;                    // 아래쪽
      else if (Math.abs(dt.z) > 0.3) sgn = dt.z < 0 ? 1 : -1;               // 수평이면 뒤쪽
      else sgn = dt.x * F.x >= 0 ? 1 : -1;                                  // 옆으로 흐르면 가운데 선 바깥쪽
      var r1 = room(F, n, dt, sgn);
      if (r1 < 2) { var r2 = room(F, n, dt, -sgn); if (r2 > r1) { sgn = -sgn; st.flipped++; } }
      prev = { x: dt.x * sgn, y: dt.y * sgn, z: dt.z * sgn };

      for (k = 0; k < G.maxSteps; k++) {
        steps++;
        if (!free) {
          // 두피 위 구간: 발은 두피면을 따라, 몸은 그 위 두께만큼 떠서
          fl = flow(P, n, prev); if (!fl) estSteps++;
          if (fl) fl = mixDir(prev, fl);
          dt = tangent(fl || prev, n) || prev;
          var F2 = onSurf({ x: F.x + dt.x * stp, y: F.y + dt.y * stp, z: F.z + dt.z * stp });
          if (offScalp(cellOf(F2))) {
            free = true; st.free++; prev = dt; k--; steps--;
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
          if (vote(P2) === 0) { if (++miss >= 2) { stop = 'mask'; break; } } else miss = 0;
          pts.push(P2); F = F2; n = n2; P = P2; s = s2; prev = tangent(dt, n2) || dt;
        } else {
          // 두피 밖 구간: 결 + 중력, 두상 안으로는 못 들어감
          var hangNow = hangTip != null && P.y < yBody;                     // (v6) 턱·목덜미 아래 — 사진 결을 안 읽고 곧게 아래로
          if (hangNow) {
            var hk = G.hangK, hx = prev.x * (1 - hk), hy = prev.y * (1 - hk) - hk, hz = prev.z * (1 - hk), hl = Math.hypot(hx, hy, hz) || 1;
            d = { x: hx / hl, y: hy / hl, z: hz / hl };
            if (!hung) { hung = true; st.hangN++; }
            st.hangSteps++;
          } else {
            var rr = Math.hypot(P.x, P.z), nc = rr > 1e-6 ? { x: P.x / rr, y: 0, z: P.z / rr } : n;
            fl = flow(P, nc, prev, true); if (!fl) estSteps++;
            d = fl ? mixDir(prev, fl) : prev;
            if (bw > 0 && d.z > 0) {                                          // 뒷머리는 앞으로 못 감
              var fz = d.z * (1 - bw), fl2 = Math.hypot(d.x, d.y, fz);
              d = fl2 > 0.2 ? { x: d.x / fl2, y: d.y / fl2, z: fz / fl2 } : down;
              st.backFwd++;
            }
            var gx = d.x * (1 - G.gravity), gy = d.y * (1 - G.gravity) - G.gravity, gz = d.z * (1 - G.gravity), gl = Math.hypot(gx, gy, gz) || 1;
            d = { x: gx / gl, y: gy / gl, z: gz / gl };
          }
          var Q = { x: P.x + d.x * stp, y: P.y + d.y * stp, z: P.z + d.z * stp };
          try { Q = ellipsoidPushOut(Q, Es.a * 1.02, Es.b * 1.02, Es.c * 1.02, CY); } catch (e) {}
          var Qn = G.neckPush(Q); if (Qn !== Q) { Q = Qn; st.neckPush++; }
          if (hangNow) {                                                    // 끝 높이까지는 사진과 상관없이 이어 감
            if (Q.y <= hangTip) { miss = 0; stop = 'tip'; break; }
            miss = 0;
            pts.push({ x: Q.x, y: Q.y, z: Q.z }); P = Q; s += stp; prev = d;
            if (s >= Lcap) { stop = 'cap'; break; }
            continue;
          }
          var vq = vote(Q);
          // 뒤 사진의 머리 끝 높이까지는 이어 감 — (2026-10-04g) 아래로 늘어지는 중이고 두상 폭 안쪽일 때만.
          // 실측: 위·옆으로 튀어 나간 가닥까지 이어 가서 머리 밖으로 큰 고리가 몇 가닥 생겼음.
          if (vq === 0 && myTip != null && Q.y > myTip && d.y < -0.5) {
            var fx = Q.x / (Es.a * 1.3), fz2 = Q.z / (Es.c * 1.3);
            if (fx * fx + fz2 * fz2 <= 1) { vq = 1; st.backKeep++; }
          }
          if (vq === 0) { if (++miss >= 2) { stop = 'mask'; break; } } else miss = 0;
          pts.push({ x: Q.x, y: Q.y, z: Q.z }); P = Q; s += stp; prev = d;
        }
        if (s >= Lcap) { stop = 'cap'; break; }
      }
      if (miss > 0) pts.length = Math.max(1, pts.length - miss);        // 머리 영역 밖으로 나간 꼬리는 버림
      if (pts.length < 3) { st.skipped++; (info.skipY[sec] || (info.skipY[sec] = [])).push(rootY); return null; }   // 사진에 머리가 없는 자리 — 그루터기를 억지로 세우지 않음
      (info.plantY[sec] || (info.plantY[sec] = [])).push(rootY);
      pts = smoothPts(pts);
      if (bw >= 0.5 || hung) { try { pts._rgKeep = true; } catch (e) {} }  // 조정 단계의 "사진 영역 밖 다듬기"가 이 가닥을 다시 자르지 않게
      var Larc = 0, ii; for (ii = 1; ii < pts.length; ii++) Larc += Math.hypot(pts[ii].x - pts[ii - 1].x, pts[ii].y - pts[ii - 1].y, pts[ii].z - pts[ii - 1].z);
      var qi = Math.min(pts.length - 1, 6), ex = pts[qi].x - pts[0].x, ey = pts[qi].y - pts[0].y, ez = pts[qi].z - pts[0].z, el = Math.hypot(ex, ey, ez) || 1;
      var rg = { t: tRoot, free: free, L: Larc, tipY: pts[pts.length - 1].y, dx: ex / el, dy: ey / el, dz: ez / el };
      if (stop === 'mask') st.stopMask++; else if (stop === 'cap') st.stopCap++; else if (stop === 'tip') st.stopTip++; else st.stopMax++;
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
            carry += wgt[cell] / wTot * total;
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
        var alK = 1; try { var pcA = G.photoCurl(); if (pcA && pcA.raw > 0 && G.alignCurlOff > 0) alK = clampN(1 - pcA.raw / G.alignCurlOff, 0, 1); } catch (e) { alK = 1; }
        var al = null; try { al = G.alignStrands(out, CY, alK); } catch (e) { console.warn(TAG + ' 결 정렬 실패(그대로 둠)', e); }
        var tv = []; for (var k = 0; k < NC; k++) if (known[k] === 1 && !offScalp(k)) tv.push(T[k] * cm);
        S = G.stats = {
          ms: Math.round(now() - t0), n: st.n, stub: st.stub, skipped: st.skipped, sec: st.sec,
          lenMed: q(st.len, 0.5) * cm, lenP90: q(st.len, 0.9) * cm, kinkMed: q(st.kink, 0.5), kinkP90: q(st.kink, 0.9),
          estPct: st.steps ? st.est / st.steps * 100 : 0, stopMask: st.stopMask, stopCap: st.stopCap, stopMax: st.stopMax, free: st.free, flipped: st.flipped,
          isLong: isLong, capTxt: Object.keys(cap).map(function (k) { return k + ' ' + n1(cap[k] * cm); }).join(' · '),
          tMed: q(tv, 0.5), tP90: q(tv, 0.9), tMeasured: tStat.measured, tFilled: tStat.filled, tZero: tStat.zero, cells: NC,
          cams: cams.map(function (c) { return c.angle; }).join(','),
          neckPush: st.neckPush, backFix: !!G.backFix, backN: st.backN, backFwd: st.backFwd, backKeep: st.backKeep, backLenMed: q(st.backLen, 0.5) * cm,
          align: al ? { on: al.on, skipped: !!al.skipped, kMul: al.kMul, strands: al.strands, segs: al.segs, rotMed: q(al.rot, 0.5), rotP90: q(al.rot, 0.9), trimmed: al.trimmed, trimCm: al.trimmed ? al.trimLen / al.trimmed * cm : 0, cells: al.cells, ms: Math.round(al.ms) } : null,
          backTipN: backTips.length, backTipCm: backTipOK ? (yTop - q(backTips, 0.5)) * cm : NaN,
          hang: !!hangTips, hangSrc: hangTips ? (hangTips === backTips ? '뒤 사진 가닥' : '전체 사진 가닥') : '', hangN: st.hangN, hangSteps: st.hangSteps, stopTip: st.stopTip,
          hangTipCm: hangTips ? [(yTop - q(hangTips, 0.75)) * cm, (yTop - q(hangTips, 0.25)) * cm] : null
        };
        return { strands: out, viewCal: photo.viewCal, yTop: photo.yTop, CY: photo.CY, field: photo.field || null, occ: photo.occ || null,
          grid: photo.grid, roots: photo.roots, mannequin: false, regrown: true, rgInfo: info };
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
    (function tick() {
      var f;
      try { f = B.step(G.sliceMs); }
      catch (e) {
        G.building = false; G.lastErr = String(e && e.message || e); G.failedFor = photo;
        console.warn(TAG + ' 기르다 실패 — 사진 가닥을 그대로 씁니다', e);
        try { if (typeof hideAI === 'function') hideAI(); } catch (x) {}
        if (cb) cb(false); return;
      }
      if (sub) sub.textContent = Math.round(f * 100) + '%';
      if (f < 1) return setTimeout(tick, 0);
      var model = null;
      try { model = B.finish(); } catch (e) { G.lastErr = String(e && e.message || e); }
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
      try { if (state.fade) state.fade.enabled = false; } catch (e) {}      // 페이드는 이미 머리에 들어 있음
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
  (function () {
    var pend = null;
    var oEx = W.extractHairMask;
    if (typeof oEx === 'function') W.extractHairMask = function () { pend = null; return oEx.apply(this, arguments); };
    var oF = W.computeHairOrientationField;
    if (typeof oF === 'function') W.computeHairOrientationField = function (px, mask, Wd, Hd) {
      pend = null;
      var f = oF.apply(this, arguments);
      try { if (f && f.angle && f.coherence) { var cs = curvStats(f.angle, f.coherence, mask, Wd, Hd); if (cs) pend = { w: Wd, h: Hd, cs: cs }; } } catch (e) { pend = null; }
      return f;
    };
    var oM = W.measureViewHairIdentity;
    if (typeof oM === 'function') W.measureViewHairIdentity = function (a) {
      var id = oM.apply(this, arguments);
      try {
        if (id && pend && a && pend.w === a.w && pend.h === a.h) { id.curlDHalf = pend.cs.dHalf; id.curlFlat = pend.cs.flat; id.curlC1 = pend.cs.c1; id.curlRn = pend.cs.n; }
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
        var rpx = G.curlRk * (id.curlDHalf - G.curlR0), floor = !(rpx > G.curlRminPx);
        if (floor) rpx = G.curlRminPx;
        out.rViews.push({ a: a, dHalf: id.curlDHalf, rpx: rpx, cm: rpx * cpp, floor: floor });
        rs.push(rpx * cpp);
      });
      if (!seen) out.rNote = '굵기를 잰 뷰가 없음(사진을 다시 분석하면 잽니다) — 웨이브 50';
      else if (!rs.length && flat) { out.rNote = '결이 끝까지 안 틀어짐(거의 직선) — 컬 0으로'; out.flatAll = true; if (flat === seen) { out.raw = 0; out.value = 0; } }
      else if (rs.length) {
        rs.sort(function (x, y) { return x - y; });
        out.rCm = rs.length % 2 ? rs[(rs.length - 1) / 2] : (rs[rs.length / 2 - 1] + rs[rs.length / 2]) / 2;
      } else out.rNote = '카메라 배율이 없어 cm로 못 바꿈 — 웨이브 50';
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
    var spec = { name: '', cut: cut, perm: { curl: pc.value, wave: pc.wave != null ? pc.wave : 50 }, styling: styling, globalCurl: pc.value, fade: fade, lenFallback: lenFallback, version: 1, source: 'regrow' };
    if (info.isLong) spec.tipAt = tipAt; else spec.lenCm = lenCm;
    return { spec: spec, isLong: info.isLong, raw: raw, tTopCm: tTop, part: part, bareShare: bareShare, order: order, curl: pc };
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
    L.push('  페이드: ' + (sp.fade.enabled ? '켜짐 · 높이 ' + sp.fade.height + '% · 가드 ' + sp.fade.guard + ' · 테이퍼 ' + sp.fade.taper + '% (가드·테이퍼는 기본값)' : '꺼짐') +
      ' · 옆·뒤에서 사진에 머리가 없던 뿌리 ' + Math.round(r.bareShare * 100) + '%');
    L.push('  뿌리 볼륨 ' + sp.styling.volume + ' (윗머리 두께 ' + n1(r.tTopCm) + 'cm) · 넘김 ' + (sp.styling.sweep > 0 ? '+' : '') + sp.styling.sweep + ' (' + (sp.styling.sweep > 15 ? '뒤로' : sp.styling.sweep < -15 ? '앞으로' : '중립') + ')');
    L.push('  가르마(재기만 — 스펙에는 아직 안 넣음): 위치 ' + (r.part.x > 0 ? '+' : '') + r.part.x.toFixed(1) + ' (두상 반폭 대비, 모델 x축) · 양쪽으로 갈라지는 정도 ' + Math.round(r.part.score * 100) + '% · 옆으로 흐르는 세기 ' + r.part.lateral.toFixed(2));
    var pc = r.curl || { value: 0, deg: null, views: [] };
    L.push('  컬 ' + pc.value + (pc.deg == null ? ' — 결 꺾임을 잰 뷰가 없어 0' :
      ' ← 결 꺾임 ' + pc.deg.toFixed(2) + '°/px(뷰 중앙값) · ' + pc.views.map(function (v) { return v.a + ' ' + v.v.toFixed(2) + (v.ok ? '' : '(표본 ' + v.n + ' — 안 씀)'); }).join(' · ') +
      ' · 환산 ' + G.curlLo + '~' + G.curlHi + '°/px → 0~' + G.curlMax + ' (어림값 — 직모 사진에서 컬이 잡히면 curlLo를 올릴 것)' + (G.curl ? '' : ' · 꺼짐(REGROW.curl=false) — 켜면 ' + pc.raw)) +
      (pc.value > 0 ? ' · 편 길이 = 보이는 길이 × ' + (1 / curlRemain(pc.value)).toFixed(2) : ''));
    if (pc.rViews && (pc.rViews.length || pc.rNote)) L.push('  컬 굵기 ' + (pc.rCm > 0 ? '반경 ' + pc.rCm.toFixed(1) + 'cm(뷰 중앙값) → ' + (G.curlRadius ? '웨이브 ' + pc.wave +
      (pc.rodScale > 1 ? ' + 로드 ×' + pc.rodScale.toFixed(2) + '(다시 기른 가닥에만)' : '') + (pc.rodCm ? ' · 로드 반경 ' + pc.rodCm.toFixed(1) + 'cm' : '') : '꺼짐(REGROW.curlRadius=false) — 웨이브 50') : (pc.rNote || '못 잼')) +
      (pc.rViews.length ? ' · ' + pc.rViews.map(function (v) { return v.a + ' ' + (v.flat ? '직선' : v.noScale ? 'dHalf ' + v.dHalf.toFixed(1) + 'px(배율 없음)' : v.cm.toFixed(1) + 'cm(dHalf ' + v.dHalf.toFixed(1) + 'px' + (v.floor ? ' — 하한, 이보다 잔 컬일 수 있음' : '') + ')'); }).join(' · ') : '') +
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
    L.push('  가닥 ' + s.n + '개(사진에 머리가 없어 안 심은 뿌리 ' + s.skipped + ') · ' + s.ms + 'ms · 사진 ' + s.cams);
    L.push('  뿌리 분포 — ' + secs);
    L.push('  길이 ' + n1(s.lenMed) + '/' + n1(s.lenP90) + 'cm(중앙값/p90) · 꺾임 ' + n1(s.kinkMed) + '°/' + n1(s.kinkP90) + '° · 결을 사진에서 못 읽고 이어 간 걸음 ' + n1(s.estPct) + '%');
    L.push('  길이 상한(' + (s.isLong ? '긴 머리 — 넉넉히' : '짧은 머리 — 섹션 중앙값×' + G.lenMul) + ') cm: ' + s.capTxt);
    L.push('  멈춘 이유 — 머리 영역 밖 ' + s.stopMask + ' · 길이 상한 ' + s.stopCap + ' · 걸음 수 상한 ' + s.stopMax + ' · 두피 밖으로 나가 늘어뜨린 가닥 ' + s.free + ' · 반대로 기른 뿌리(아래쪽에 머리 없음) ' + s.flipped);
    if (s.backFix) L.push('  뒷머리 앞쏠림 막기 — 뒤쪽에서 두피를 벗어난 가닥 ' + s.backN + '개(길이 중앙값 ' + n1(s.backLenMed) + 'cm) · 앞으로 가려던 걸음 ' + s.backFwd + '회 막음 · 뒤 사진 끝 높이까지 이어 간 걸음 ' + s.backKeep +
      (s.backTipN >= 20 ? ' · 뒤 사진 머리 끝 = 정수리에서 ' + n1(s.backTipCm) + 'cm 아래(가닥 ' + s.backTipN + '개 기준)' : ' · 뒤 사진 가닥이 적어(' + s.backTipN + ') 끝 높이 기준은 안 씀'));
    L.push('  곧게 늘어뜨리기(긴 머리 · 목 아래): ' + (!G.hangDown ? '꺼짐' : !s.isLong ? '짧은 머리라 안 씀' : !s.hang ? '끝 높이를 낼 사진 가닥이 모자라 안 씀' :
      '켜짐 — 곧게 내린 가닥 ' + s.hangN + '개(' + s.hangSteps + '걸음) · 끝 높이에서 멈춤 ' + s.stopTip + ' · 끝 높이 = 정수리에서 ' + n1(s.hangTipCm[0]) + '~' + n1(s.hangTipCm[1]) + 'cm 아래(' + s.hangSrc + '의 25~75%)'));
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

  console.log(TAG + ' 설치 — 마네킹 OFF = 다시 기른 원본 머리(+치수) · 마네킹 ON = 마네킹 모드. 콘솔: REGROW.lines().join("\\n") · REGROW.measureLines().join("\\n")');
})();
