/* ==========================================================================
 * 53-comb3d.js — 3D 조정 화면의 빗질: 쓰다듬은 방향으로 결을 정렬
 *
 * 로드 위치: index.html 맨 끝(52-views360.js 다음).
 *
 * 왜 (2026-10-05 · 사용자): "원본 다시 만들기 결과는 괜찮은데 주변에 삐죽 튀어나온 잔머리가 있다. 원장들이 저 정도만 나와도
 *   괜찮긴 한데 손질은 가능해야 한다. 예전의 빗(comb) 기능을 다시 써 보자 — 예전에는 2D 화면이라 어려웠는데 지금은 확대·이동이
 *   되니까. 잔머리 부분을 결 방향으로 빗질하듯 쓰다듬으면 잔머리들의 결이 정렬되게."
 *
 * 예전 빗(17a COMB)과 다른 점:
 *   예전 것은 "밀기"입니다 — 쓰다듬은 만큼 그 자리의 머리를 통째로 옮기는 변위장. 잔머리와 그 밑의 머리가 같이 밀려서
 *   튀어나온 각도는 그대로 남습니다. 그리고 2D 화면 전용이라 3D 조정 화면(43)에서는 버튼을 숨겨 두었습니다.
 *   이번 것은 "정렬"입니다 — 붓 안을 지나는 가닥 마디의 방향을 쓰다듬은 방향으로 돌립니다(마디 길이는 그대로).
 *   이미 그 방향인 머리는 거의 안 변하고, 엇나간 잔머리만 눕습니다. 붓을 지난 뒤쪽은 모양 그대로 따라 옮겨집니다.
 *   ※ (2026-10-05e) 실제로는 몸통 머리까지 손가락 방향으로 돌아 머리가 쓸려 나갔습니다 → 지금은 "그 자리 머리의 결"에 맞춥니다(아래 e 참고).
 *
 * 어떻게:
 *   · [빗질] 버튼(조정 화면 왼쪽 위 · 3D 조정일 때만 보임)을 켜면 한 손가락 드래그가 회전 대신 빗질이 됩니다.
 *     두 손가락(이동·확대), 휠, Shift+드래그(이동), 확대 막대, 앞/옆/뒤 탭은 그대로 됩니다. 회전하려면 빗질을 끄거나 탭을 누릅니다.
 *   · 붓이 닿는 자리 = 손가락 아래에서 카메라에 가장 가까운 가닥 점(겉머리). 그 점을 중심으로 한 공(반지름 = 화면의 radiusPx)
 *     안의 가닥만 바뀝니다 — 머리 반대편은 안 건드립니다. 그래서 확대하면 붓이 작아져 세밀하게 됩니다.
 *   · 빗질은 "공간에 남는 표본"(중심·방향·반지름)으로 저장하고, 성긴 3D 격자(방향 장)에 칠해 둡니다. 가닥을 만들 때마다
 *     (17b _adjGeometry → combStrand3D 자리) 지나가는 칸의 방향으로 마디를 돌립니다. 그래서 길이·컬 슬라이더를 움직여도
 *     빗질한 자리는 남고, 빗질을 많이 해도 느려지지 않습니다. 같은 자리를 다시 빗으면 새 방향이 옛 방향을 덮습니다.
 *     뿌리 쪽 gripFrom 구간은 덜 움직입니다(뿌리는 두피에 붙어 있음).
 *   · [↶] = 마지막 한 획 되돌리기. 머리 모델이 바뀌면(다른 사진 · 마네킹 켬/끔 · 다시 기르기) 빗질은 지웁니다.
 *
 * (2026-10-05b) 폰에서 써 본 뒤 — 사용자: "정확히 어떻게 써야 할지 잘 안 잡힌다. 뿌리 기준으로 건드려야 하나? 빗질은 뜬 부분·헝클어진
 *   부분을 보고 거기를 정렬하는 것. 적용되는 구간을 정확히 알 수 있게 작은 빗 모양 하나 올려놔도 좋겠다."
 *   실측(진단): 획 68 · 표본 904 · 바뀐 가닥 5895/10000 · 다시 그리기 426ms. 화면에서는 손가락에 가려 어디가 바뀌는지 안 보였고,
 *   100% 근처에서는 붓(3cm 상한)이 화면에서 반지름 12px쯤이라 손가락보다 작았습니다. 빗은 자리에 잔물결(지그재그)도 생겼습니다.
 *   ① 빗 표시 — 붓이 닿는 자리에 점선 원(= 실제로 바뀌는 범위)과 작은 빗 그림을 띄웁니다. 빗살이 가리키는 쪽 = 머리가 눕는 방향.
 *      터치에서는 손가락에 가리지 않게 빗을 손가락 위쪽 touchOffset px에 둡니다(바뀌는 자리도 거기 — 손가락이 아니라 빗이 닿는 곳).
 *      빗질을 켜면 화면 가운데에 빗이 먼저 보이고, 마우스는 올려놓기만 해도 따라다닙니다.
 *   ② 잔물결 없애기 — 방향을 손가락의 직전 몇 px이 아니라 지나온 길 dirLagPx 뒤의 점에서 지금 점으로 잡고(손떨림 제거),
 *      가닥에 적용한 뒤 이웃 마디끼리 방향을 한 번 고르게 합니다.
 *   ③ 쓰다듬는 동안 다시 그리는 간격을 120 → 250ms(폰에서 한 번 그리는 데 0.4초라 계속 밀렸음). 손을 떼면 바로 한 번 더 그립니다.
 *   쓰는 법: 뿌리와는 상관없습니다. 뜬 머리·헝클어진 자리에 빗(원)을 올리고, 눕히고 싶은 방향으로 쓸어 주면 원 안의 겉머리만 그 방향으로 눕습니다.
 *
 * (2026-10-05c) 화면에 보이는 대로 빗기 — 사용자: "눈에 보이는 가닥을 정리하려고 빗을 움직이는데 3D로는 그 위치가 아닌 것 같다.
 *   뒤에만 빗질했는데 앞으로 돌려 보니 앞이 엉망이 됐다. 목 주변 가닥은 어떻게 정리할지 모르겠다. 2D로 보고 빗질한다는 걸 적용해야."
 *   예전: 붓 = "손가락 아래에서 카메라에 가장 가까운 가닥 점 하나"를 중심으로 한 3cm 공. 그런데
 *        · 윤곽 가장자리나 목 옆 틈에서는 가까운 쪽 머리가 없어서 반대편(앞머리) 점이 잡혔고 → 뒤에서 빗었는데 앞이 바뀜
 *        · 공은 그 한 점 주변만 덮어서, 원 안에 보이는데 깊이가 다른 가닥(튀어나온 잔머리)은 안 바뀜
 *   지금: 붓 = 화면의 원 그 자체. 원 안에 "보이는" 가닥 점(카메라 쪽 절반 — 두상 가운데보다 depthMargin 넘게 뒤에 있는 점은 제외)을
 *        전부 찾아, 그 점들이 있는 3D 자리마다 작게(dab) 방향을 칠합니다. 깊이가 서로 달라도 원 안에 보이면 다 빗깁니다.
 *        두상 반대편은 원 안에 겹쳐 보여도 건드리지 않습니다.
 *        칠하는 자리 = 그 점이 "빗기 전에 있던 자리". 가닥에 적용할 때 빗기 전 자리에서 방향 장을 읽기 때문입니다 —
 *        지금 보이는 자리에 칠하면, 이미 한 번 빗어서 옮겨진 가닥은 다음 빗질이 닿지 않았습니다(합성 테스트에서 확인).
 *        그래서 적용 결과에 빗기 전 점 배열(_pre)을 달아 두고, 50번(어깨)도 그 표시를 넘겨줍니다.
 *
 * (2026-10-05e) 빗으면 머리가 빠지던 것 — 사용자(영상): "comb 기능을 적용하면서 수정하고 있는데 머리가 빠진다."
 *   영상: 옆에서 보고 귀 높이에서 머리 끝까지 두 번 쓸어내리니 목 앞 옆머리가 사라지고 목이 드러남 · 아래에 꺾인 가닥이 삐져나옴.
 *   원인 ① 원 안의 "모든" 가닥 마디를 손가락 방향과 똑같이 돌렸습니다(여러 번 겹치면 세기 1). 손가락은 결과 정확히 나란할 수 없어서
 *          (영상에서는 20°쯤 뒤로 기움) 이미 가지런한 몸통 머리까지 그 각도로 돌고, 붓을 지난 아래쪽은 통째로 따라 옮겨져 옆머리 전체가 뒤로 쓸려 갔습니다.
 *          재현(이 파일 그대로 · 합성 머리 3,368가닥 · 같은 동작): 끝이 1cm 넘게 옮겨진 몸통 가닥 892(중앙 3.6cm · 최대 7.1cm) · 목 앞 옆머리 31%만 남음.
 *          정수리를 지나 쓸면 더 심했습니다(984~1,822가닥 · 최대 40cm) — 가르마·가마 양쪽 머리가 한쪽으로 넘어감.
 *        ② 손가락 방향은 화면 평면 안의 방향이라 둥근 두상에서는 두피 속을 향합니다. 정면·뒤에서 쓸면 가닥이 두상 속에 묻혔습니다(609~953가닥).
 *   지금: "결 따라 빗기"(grain) — 가닥을 손가락 방향이 아니라 그 자리 머리의 결에 맞춥니다.
 *     · 결 격자: 붓을 댈 때, 빗기 전 가닥들의 "큰 방향"(앞뒤 flowSmooth를 이은 현)을 flowCell 칸마다 더해 둡니다(42번 결 정렬과 같은 생각).
 *       빗기 전 자리로 만들므로 빗질을 해도 안 바뀌고, 머리 모양(길이·컬)이 바뀌면 다시 읽습니다.
 *     · 가닥에 적용할 때 마디마다 목표를 따로 정합니다:
 *         제 무리(이 가닥과 flowOwn° 안쪽으로 같이 흐르는 이웃이 충분함)가 있으면 그 결 → 몸통 머리는 사실상 제자리. 가르마 양쪽·겹친 층도 각자 제 쪽 결.
 *         제 무리가 없으면(= 잔머리) 손가락 쪽으로 흐르는 이웃의 결 → 이웃 전체의 결 → 주변에 머리가 없으면 두상 쪽으로 flowReach칸 들어가며 찾음 → 그래도 없으면 손가락 방향.
 *         결이 갈려 어느 쪽인지 정할 수 없는 자리의 잔머리는 그대로 둡니다.
 *     · 마디 하나가 아니라 가닥의 큰 방향이 목표에서 벗어난 만큼만 돌립니다(tolFrom° 안쪽은 안 건드림 · tolFull° 이상은 세기만큼).
 *       회전을 마디에 그대로 적용하므로 잔 컬·웨이브는 모양 그대로 남습니다(예전: 빗은 자리는 직모가 됨).
 *     · 두상·목: 다시 이을 때 두상 속으로 가는 마디는 면을 타고 눕히고, 목 기둥(42번 neckPush) 속 점은 밖으로. 빗기 전부터 안쪽이던 점(뿌리)은 그대로.
 *     · 그래서 손가락 방향은 "어느 쪽 결인가"를 고를 때와 주변에 머리가 없는 잔머리에만 쓰입니다. 결을 가로질러 쓸어도 머리가 넘어가지 않습니다(넘기기는 스타일 쪽에서).
 *   같은 합성 테스트: 영상 동작 → 옮겨진 몸통 가닥 0 · 목 앞 옆머리 100% · 정수리 → 0 · 두상 속 가닥 0 · 마디 길이 오차 0%.
 *     윤곽 밖으로 삐죽 나온 잔머리(정면에서 가장자리를 쓸어내림): 결에서 벗어난 각 중앙 89° → 6~10°.
 *   끄기: COMB3D.grain=false(손가락 방향 그대로) · COMB3D.collide=false 후 COMB3D.refresh()
 *
 * (2026-10-05f) 다듬을수록 더 흐트러지던 것 — 사용자(영상·진단): "comb 테스트 중인데 머리를 다듬을수록 더 흐트러진다."
 *   진단: 획 11 · 표본 217 · 바뀐 가닥 6102/9999(제 무리의 결로 본 마디 37,866). 영상: 가장자리를 쓸 때마다 가닥이 몸통과 나란히 윤곽 밖에 떠서 남고, 더 빗으면 더 늘어남.
 *   원인 ① 몸통 머리까지 돌렸습니다. 실제 머리는 다발이 비스듬히 엇갈려(굽이) 결에서 tolFrom° 넘게 벗어난 마디가 많은데, 그 마디만 골라 돌리면
 *          나갔다 돌아오던 균형이 깨져 그 아래 꼬리가 통째로 옆으로 밀립니다. 밀린 가닥은 결과는 나란해서 다시 빗어도 안 들어갑니다.
 *          재현(합성 머리 29,000가닥 · 굽이 있음 · 영상과 같은 동작 33획): 0.2cm 넘게 옮겨진 가닥 6,976 · 윤곽 밖에 그려진 가닥 길이 1,323 → 1,655cm
 *          (굽이를 1.8배로 하면 1,443 → 14,241cm). 굽이가 없는 매끈한 머리(예전 합성 테스트)에서는 안 나타났습니다.
 *        ② 50번(어깨)이 몸통에 닿은 가닥에 "빗기 전 자리"(_pre)를 안 달아서, 안 빗은 가닥은 어깨에 얹힌 뒤 자리로, 빗은 가닥은 얹히기 전 자리로 결·붓 자리를 읽었습니다.
 *   지금: · flyOnly — 몸통 머리 속 마디는 안 돌립니다. 몸통 밖으로 뜬 구간(주변 3×3×3칸 가닥 수가 적은 자리)만 결 쪽으로 돌립니다.
 *         · anchor — 빗기 전 자리가 몸통 속이던 점은 밀려도 anchorLen 안에 제자리로 돌아옵니다(잔머리 꼬리는 안 붙듦 → 그대로 눕음).
 *         · pullIn — 붓이 닿은 마디가 몸통 밖에 떠 있으면 몸통 쪽으로 조금 기울입니다(결과 나란한 채 떠 있는 가닥도 붙음).
 *         · 50번: 몸통에 닿은 가닥에 언제나 _pre(어깨 전 자리)를 답니다.
 *   같은 테스트: 옮겨진 가닥 664 · 윤곽 밖 길이 1,323 → 856cm(굽이 1.8배: 1,443 → 1,024cm) · 획을 더할수록 줄어듦.
 *   대신: 몸통 겉면에 붙어서 엇갈린 다발은 이제 빗어도 안 펴집니다(예전 동작: COMB3D.flyOnly=false). 붙들기 끄기: COMB3D.anchor=false 후 COMB3D.refresh()
 *
 * (2026-10-05g) 빗어도 잔머리가 거의 그대로이던 것 — 사용자(영상·진단): "comb 기능 다듬는 중. 좀 더 결을 잘 탈 수 있게."
 *   진단: 획 16 · 표본 288 · 바뀐 가닥 881/9999. 영상: 윤곽 옆에 뜬 가닥을 따라 여러 번 쓸어내려도 거의 그대로 · 뾰족하게 솟은 자리도 남음.
 *   재현(합성 머리 1만 가닥 · 잔머리 172 · 가장자리를 26획): 뒤에서 본 가장자리 밖 잔머리 길이 715 → 634cm(붓이 칠한 잔머리 점 571 중 504가 그대로).
 *   원인 ① 몸통 판정이 4cm 상자(결 칸 3×3×3)의 가닥 수라, 겉면에서 1~2cm 뜬 잔머리는 "몸통 속"으로 잡혀 flyOnly에 걸려 안 돌았습니다.
 *        ② 가닥이 pickStrands(8000)보다 많으면 붓 자리 찾기가 건너뛰며 씀(9,999가닥 → 둘 중 하나) → 건너뛴 가닥이 혼자 뜬 잔머리면 붓에 아예 안 걸림.
 *        ③ 결과 나란한 채 떠 있는 가닥은 pullIn(≈ 17°)만큼만 기울고, 결을 거슬러 솟은 마디는 세기만큼만 돌아 옆으로 삐죽 나온 채 남음.
 *   지금: "겉면 타기"(surf) —
 *     · 몸통 겉면 거리장: 잔칸(0.65cm)마다 지나는 가닥 수로 몸통 칸을 정하고(기준 밀도는 자리마다 · 얇은 한 겹도 몸통), 칸마다 몸통까지의 거리를 구해 둠.
 *       마디의 세기 = 붓이 칠한 세기 × 겉면에서 뜬 정도(flyFrom~flyFull). 몸통 속 마디는 0 → 몸통은 그대로.
 *     · 다시 걷기(applySurf): 세기가 있는 첫 마디부터, 지금까지 이어 온 자리에서 가장 가까운 겉면의 결을 읽어 그쪽으로 돌림(방향만 바꿈 · 마디 길이 그대로).
 *       떠 있으면 뜬 만큼 겉면 쪽으로 방향을 틂(settle · 누르는 계산이 아니라 방향을 트는 것). 결을 거슬러 선 마디는 통째로 결 방향으로. 뾰족한 꺾임은 폄(relax).
 *     · 붓: 건너뛰는 가닥도 뜬 점은 전부 붓 자리 찾기에 넣고, 자리가 dabMax를 넘어도 뜬 점의 자리는 안 버림.
 *     · 붙들기(anchor)는 옆으로 밀린 몫만 되돌림(가닥을 따라 내려간 몫까지 되돌리면 길이가 남아 가닥이 접혔음).
 *   끄기: COMB3D.surf=false 후 COMB3D.refresh() → (f)까지의 동작과 점 단위로 같음(합성 테스트에서 확인).
 *
 * (2026-10-05h) 벗어난 자리까지 거슬러 올라가기 — 사용자: "빗이 쓸어내리는 방향으로 디렉션을 바꾸고 주변 가닥과 나란히 정렬되면 되지 않나.
 *   결과 나란한데 떠 있다는 건 스트랜드 범위를 벗어난 것 → ①(벗어나는 구간)까지 포함해서 작업해 봐."
 *   잔머리 한 가닥 = ① 몸통에서 바깥으로 비스듬히 나가는 몇 마디 + ② 그 자리에서 결과 나란히 늘어진 긴 구간. 눈에 띄는 건 ②라서 ②를 빗는데,
 *   ②는 이미 결과 나란해서 방향 정렬로는 돌릴 것이 없고, 어긋난 ①은 붓이 안 닿은 위쪽에 있습니다.
 *   지금: reachBack — 붓이 뜬 구간에 닿으면 그 가닥을 뿌리 쪽으로 거슬러 올라가, 뜬 구간 전체와 ①(몸통 속에서 시작됐으면 결에서 divAngle° 넘게 벗어난 마디까지)을
 *        같은 세기로 정렬합니다. ①이 결대로 돌면 ②는 모양 그대로 몸통 쪽으로 따라 들어옵니다. 결대로 가는 몸통 마디부터는 마디마다 lead배로 줄어 곧 멈춤.
 *        잔머리 구간의 허용 각도 따로(flyTol 0~6° — 몸통은 이미 "뜬 정도"로 빠지므로 조금만 어긋나도 맞춤).
 *   합성 테스트(①보다 한참 아래의 ②만 6획): 가장자리 밖 잔머리 715cm → 예전 676 · 방향 정렬만(reachBack=false, settle=0) 654 · ①까지(settle=0) 178 · ①까지 + settle 78.
 *     전체 26획: 715 → 42cm(방향 정렬 + ①만으로는 149) · 건드린 잔머리의 최대 꺾임 p90 135° → 51° · 0.2cm 넘게 옮겨진 몸통 가닥 346/9,828(1cm 넘게 60 —
 *     겉면에서 0.5~1.8cm 떠 있던 겉층이 안쪽으로 내려앉은 것) · 새로 45° 넘게 꺾인 몸통 가닥 0 · 두상 속 점 0 · 마디 길이 오차 0%.
 *     몸통 위만 쓸면 0.2cm 넘게 옮겨진 가닥 4~69(1cm 넘게 0~4) · 같은 획을 두 번 해도 결과 같음 · 되돌리기하면 빗기 전 배열 그대로.
 *   끄기: COMB3D.reachBack=false(붓이 칠한 마디만) · COMB3D.settle=0(방향 정렬만 — 겉면 쪽으로 안 틂) 후 COMB3D.refresh()
 *   대신: 솟은 자리가 펴지면 그만큼 가닥이 아래로 내려가 밑단 아래로 1~2cm 나오는 끝이 생길 수 있습니다(길이는 안 바꿈).
 *         결 읽기에 거리장 만들기가 더해져 머리 모양이 바뀐 뒤 첫 빗질 때 한 번 더 걸립니다(합성 1만 가닥: 45 → 180ms쯤).
 *
 * (2026-10-05i) 뒤만 빗었는데 목·얼굴 앞으로 가닥이 나옴 — 사용자(폰 영상·진단): "이전보다 나아진 건 맞는데 그래도 뜨는 건 있네. 흔히 쓰는 빗처럼 빗겨지길 바라는데
 *   그렇게까진 안 되네. 뒤만 빗었는데 목덜미와 얼굴로 튀어나온 가닥들 — 두상 뚫은 거지?"
 *   폰 실측(h): 12획 · 표본 168 → 바뀐 가닥 2,378/9,999 · 세기가 걸린 마디 22,911(그중 붓이 안 닿았는데 거슬러 올라가 넣은 마디 14,934) · 붓 자리 찾기 준비 32 → 464ms.
 *   결과 화면: 뺨·턱을 가로지르는 가닥, 목 앞에서 지그재그로 꺾인 가닥(f까지의 영상에는 없던 것 — h가 만든 문제).
 *   원인(코드로 확인한 것 — 실제 가닥 데이터로 한 가닥씩 추적한 것은 아님):
 *     ① 붓이 깊이를 안 가렸음: 원 안이면 두상 가운데 깊이(+depthMargin)까지 전부 칠함. 뒤에서 빗으면 겉의 뒷머리 뒤에 겹쳐 있던 옆머리·목 옆 속머리·얼굴 옆 머리까지 칠해짐.
 *        f까지는 그 점들이 "몸통"이라 아무 일도 없었지만, g부터는 속머리가 성겨서 "뜬 점"으로 잡힘.
 *     ② 거슬러 올라가기(h)가 가닥을 만들 때 "붓이 안 칠한 마디"로도 세기를 퍼뜨림 → 그 가닥의 뜬 구간 전체(화면에 안 보이던 쪽 포함)가 움직임.
 *     ③ 겉면 쪽으로 트는 방향이 "가장 가까운 숱 많은 자리"였는데, 목 옆·얼굴 옆 가닥에게는 그게 목·얼굴 건너편 머리일 수 있음 → 가닥이 목·얼굴을 가로질러 감
 *        (목은 neckPush가 밀어내 지그재그, 얼굴은 두피 타원체 밖이라 막는 것이 없음).
 *     ④ "빽빽한 몸통에서 2cm 넘게 떨어진 자리에 2가닥이 같이 지나가면 몸통"(g의 얇은 자리 규칙) → 같이 뜬 잔머리 묶음이 몸통이 되어 안 빗김("그래도 뜨는 건 있네"의 한 원인으로 추정).
 *   지금:
 *     · 보이는 겉층만 빗음(depthLayer): 화면 칸(visCell px)마다 카메라에 가장 가까운 머리보다 2.5cm 넘게 뒤에 있는 점은 붓에 안 걸림 — 빗이 닿는 겉만.
 *     · 거슬러 올라가기는 붓 쪽에서: 붓에 "직접 걸린" 가닥만, 그 가닥을 따라 뿌리 쪽으로 칠함(뜬 점은 계속 · 몸통 속으로 reachIn점 · 카메라 반대편으로 넘어가면 멈춤).
 *       가닥을 만들 때는 칠해진 마디에만 세기를 올림(안 칠한 자리로 안 번짐).
 *     · 겉면 쪽으로 트는 것은: 내려앉을 자리가 두상 축 건너편이 아니고, 거기까지 가는 길이 두상·목 속을 안 지나고, settleReach(3cm) 안일 때만.
 *     · 안전 상한(maxMove): 어떤 점도 빗기 전 자리에서 6cm보다 멀리 안 감.
 *     · 몸통 = 두꺼운 속이 있는 덩어리와 이어진 칸(+ 두피 가까이 붙은 얇은 한 겹). 멀리 뜬 잔머리 묶음은 잔머리.
 *     · 결이 갈리는 자리(가르마·가마)에 뜬 가닥은 그대로 두지 않고 빗 방향으로 눕힘(partFinger).
 *     · 뜬 점 표시는 머리 모양이 바뀔 때 한 번만 계산(붓 자리 찾기 준비가 다시 수십 ms).
 *   합성 테스트(1만 가닥 + 목 + 목 옆 속머리·얼굴 옆 가닥 260개를 넣은 머리 · 뒤에서 아래쪽을 10획): 그 260가닥 중 0.5cm 넘게 옮겨진 가닥 — h 16개 → 지금 0개.
 *     바뀐 가닥 수 h 1,519 → 지금 760. 가장자리 26획: 가장자리 밖 잔머리 715 → 56cm(h 42 · f 634) · ②만 6획: 98cm(h 78 · f 676) · 몸통 위만 쓸면 0.2cm 넘게 옮겨진 가닥 3~21.
 *     합성 머리에서는 영상처럼 "얼굴을 가로지르는" 데까지는 재현하지 못했습니다(가려진 가닥이 움직이는 것까지만 재현) — 폰에서 확인이 필요합니다.
 *   끄기: COMB3D.depthLayer=0(깊이 안 가림) · COMB3D.reachBack=false · COMB3D.settle=0 · COMB3D.maxMove=0 · COMB3D.partFinger=false · 전부 예전으로 COMB3D.surf=false
 *
 * (2026-10-07j) 빗어 넘기기 — 사용자: "빗 기능을 가닥뿐만 아니라 머리 뭉치의 결도 변화시킬 수 있도록 해야 돼 — 말 그대로 '빗어 넘기기'도 할 수 있게.
 *   최소한의 수정부터 시작하지만, 꼭 필요할 거야." (다른 손님 스타일을 얹은 뒤 윗머리가 뜨는데 빗으로는 못 고쳤음)
 *   지금까지의 빗(정리)은 일부러 몸통 머리를 안 건드립니다(e·f). 그래서 뭉치째 방향을 바꿀 방법이 없었습니다.
 *   [넘기기] 버튼(빗질 버튼 옆)을 켜고 쓸면, 원 안에 보이는 머리(겉에서 sweepDepth 깊이까지 · 몸통 포함)가 쓴 방향으로 돕니다:
 *     · 획은 정리 획과 따로 모읍니다(C.sweeps · 방향 장도 따로). 가닥을 만들 때 정리(또는 곱슬의 가위 — 55번)를 먼저 하고 그 위에 넘기기를 겁니다.
 *       그래서 [빗질]은 예전과 한 점도 다르지 않고, 곱슬머리(55번이 빗을 가위로 바꾼 상태)에서도 넘기기는 듣습니다.
 *     · 마디가 아니라 가닥의 큰 방향(앞뒤 flowSmooth를 이은 현)을 쓴 방향으로 돌립니다 → 컬·웨이브는 모양 그대로 통째로 돕니다. 마디 길이도 그대로.
 *     · 뿌리 쪽 sweepGrip 구간은 덜 돕니다. 붓을 지난 아래쪽은 모양 그대로 따라 옮겨집니다(더 넘기려면 이어서 쓸어 주면 됨).
 *     · 쓴 방향은 화면 평면의 방향이라, 두피 가까이에서는 두상 면을 타는 방향으로 눕혀서 씁니다(sweepWrap) — 옆으로 쓸면 머리가 허공으로 뻗지 않고 두상을 감아 넘어감.
 *       두상·목 속으로는 못 들어갑니다(정리와 같은 막기). 얼굴 쪽은 안 막습니다(일부러 보내는 경우가 있으므로).
 *     · ↶는 정리·넘기기 가운데 마지막 한 획을 되돌립니다. 등록 스타일에는 아직 안 들어갑니다(이 손님 화면에서만).
 *   끄기: COMB3D.sweep=false 후 COMB3D.refresh() · 넘긴 것만 지우기: COMB3D.clearSweeps()
 *
 * 아직 안 되는 것 / 알아둘 것:
 *   · 등록 스타일에는 들어가지 않습니다(이 손님 화면에서만).
 *   · 쓰다듬는 동안 머리는 liveMs마다 다시 그립니다(가닥이 많으면 반 박자 늦게 따라옴).
 *   · 화면 쪽으로 곧장 튀어나온 잔머리는 화면에서 점으로 보여 붓에 조금만 걸립니다 — 옆에서 보이게 돌려 놓고 빗는 편이 잘 됩니다.
 *   · [빗질](정리)로는 머리를 다른 방향으로 넘길 수 없습니다(결 정렬만) — 넘기려면 [넘기기](j). 결이 갈리는 자리(가르마 바로 위)의 잔머리는 안 눕는 경우가 있습니다.
 *
 * 끄기: COMB3D.enabled=false; COMB3D.refresh() · 지우기: COMB3D.clear()
 * ========================================================================== */
(function () {
  'use strict';
  var W = window, TAG = '[빗질 3D]';
  var C = W.COMB3D = Object.assign({
    enabled: true,
    on: false,          // 빗질 모드(버튼)
    radiusPx: 30,       // 붓 반지름(화면 px)
    maxRadius: 0.16,    // 붓 반지름 상한(모델 단위 ≈ 3cm) — 축소해 놓고 빗어도 한 번에 머리 전체가 눕지 않게
    cell: 0.025,        // 방향 장 격자 칸(모델 단위 ≈ 0.45cm)
    pickPx: 22,         // 손가락 아래 이 안쪽에서 가장 가까운(카메라 쪽) 가닥 점을 붓 중심으로
    strength: 0.6,      // 한 표본이 방향을 돌리는 세기(0~1) — 여러 번 쓰다듬으면 쌓임
    falloff: 1.4,       // 붓 가장자리로 갈수록 약하게
    gripFrom: 0.12,     // 가닥의 앞 12%(뿌리 쪽)는 덜 움직임
    spacing: 0.35,      // 붓 반지름의 이 비율만큼 움직일 때마다 표본 하나
    minMovePx: 3,
    maxSamples: 1500,
    dab: 0.045,         // 보이는 점마다 칠하는 작은 공의 반지름(모델 단위 ≈ 0.8cm)
    dabCell: 0.03,      // 보이는 점을 이 크기의 3D 칸마다 하나로 줄임(≈ 0.5cm)
    dabMax: 1500,       // 표본 하나가 칠하는 자리 수 상한(넘으면 건너뛰며 고름)
    depthMargin: 0.2,   // 두상 가운데보다 이만큼(≈ 3.5cm) 넘게 뒤에 있는 점은 안 빗음(반대편 머리)
    liveMs: 250,        // 쓰다듬는 동안 다시 그리는 간격
    dirLagPx: 22,       // 방향 = 지나온 길에서 이만큼 뒤의 점 → 지금 점(손떨림 제거)
    touchOffset: 52,    // 터치: 빗을 손가락 위쪽 이 px에 둠(손가락에 안 가리게) · 0 = 손가락 바로 아래
    indicator: true,    // 빗 표시(점선 원 + 빗 그림)
    // (2026-10-05e) 결 따라 빗기 — 가닥을 손가락 방향이 아니라 "그 자리 머리의 결"에 맞춤. 손가락 방향은 결이 갈리는 자리에서 어느 쪽 결인지 고를 때와, 주변에 머리가 없는 잔머리에만 씀
    grain: true,
    flowCell: 0.07,     // 결을 읽는 칸(모델 단위 ≈ 1.3cm · 42번 결 정렬과 같은 크기) — 그 칸과 이웃 칸(3×3×3)을 지나는 가닥들의 큰 방향
    flowSmooth: 0.2,    // 가닥의 "큰 방향"을 재는 길이(앞뒤로 ≈ 3.7cm씩) — 이보다 잔 컬·웨이브는 방향으로 안 침(그래서 빗어도 안 펴짐)
    flowMin: 24,        // 이웃 칸들에 가닥이 적어도 이만큼은 지나가야 "머리가 있다"고 봄(가닥 8000개 기준 · 적으면 비례해서 낮춤)
    flowNear: 2,        // 그리고 몸통 머리의 보통 칸(가닥이 가장 많이 사는 밀도) 가닥 수의 이 배수는 돼야 함 — 겉으로 뜬 잔머리들끼리의 방향이 결이 되지 않게
    flowDense: 0.2,     // 보통 칸의 이 비율 넘게 빽빽한 칸 = 몸통 머리(그 칸의 결과 나란한 마디는 바로 통과)
    flowShare: 1,       // 이웃 머리 가운데 이 가닥과 같은 쪽으로 흐르는 무리가 (flowNear 기준의) 이 비율은 돼야 "제 무리"로 침
    flowOwn: 55,        // 도: 이 가닥의 큰 방향에서 이 안쪽으로 흐르는 이웃 = 제 무리(가르마 양쪽·겹친 층은 각자 제 무리를 따름 → 안 움직임)
    flowFinger: 60,     // 도: 제 무리가 없는 가닥(잔머리)은, 손가락 방향에서 이 안쪽으로 흐르는 이웃 머리의 결을 따름
    flowCoh: 0.6,       // 그것도 없으면 이웃 전체의 결 — 결집도(평균 벡터 길이)가 이보다 낮으면(결이 갈리는 자리) 안 건드림
    flowReach: 3,       // 주변에 머리가 없으면(겉면 밖으로 멀리 뜬 꼬리) 두상 쪽으로 이 칸 수까지 들어가며 결을 찾음 · 그래도 없으면 손가락 방향
    tolFrom: 12, tolFull: 28,  // 도: 가닥의 큰 방향이 목표에서 이 안쪽으로만 벗어나 있으면 안 건드림 · 이 이상이면 세기만큼 돌림(사이는 서서히)
    collide: true,      // 빗은 가닥이 두상·목 안으로 못 들어가게
    // (2026-10-05f) 몸통 머리는 제자리에 — 빗은 뒤 아래쪽이 통째로 밀려 윤곽 밖으로 나가던 것을 막음(머리말 f 참고)
    anchor: true,
    flyOnly: true,      // 몸통 밖으로 뜬 구간(잔머리)만 돌림 — 몸통 속 마디는 결에서 벗어나 있어도 그대로(끄면 몸통의 엇갈린 다발도 펴지만 아래쪽이 밀림)
    anchorLen: 0.13,    // 밀린 가닥이 제자리로 돌아오는 길이(모델 단위 ≈ 2.5cm) — 짧을수록 단단히 붙듦
    bodyFull: 8,        // 주변(3×3×3칸) 가닥 수가 보통 칸의 이 배수면 "몸통 머리 속"(flowNear배 이하는 몸통 밖 = 잔머리 · 사이는 서서히)
    pullIn: 0.3,        // 몸통 밖에 뜬 채로 빗긴 마디를 몸통 쪽으로 기울이는 정도(≈ 17°) · 0 = 끔
    headLift: 1.02,     // 두피 타원체의 이 배수 껍질 밖에 둠(42번 다시 기르기와 같은 값)
    // (2026-10-05g) 겉면 타기 — 몸통인지 잔머리인지를 "몸통 겉면에서 얼마나 떠 있나"(잔칸 거리장)로 가리고, 빗은 잔머리를 겉면까지 내려 앉힘(머리말 g 참고)
    surf: true,
    surfThr: 0.3,       // 잔칸(flowCell의 절반 ≈ 0.65cm)을 지나는 가닥 수가 몸통 보통 칸의 이 비율은 돼야 "빽빽한 몸통"
    surfNbr: 6,         // 몸통 후보: 둘레 26칸 중 이만큼은 같이 기준을 넘어야 함(한 줄로 지나가는 잔머리 묶음 제외)
    surfCore: 12,       // 몸통의 "속": 둘레 26칸 중 이만큼이 후보인 칸. 속과 이어진 후보만 몸통
    surfHead: 1.15,     // 속과 안 이어진 후보라도 두상 타원체의 이 배수 안(≈ 두피에서 1.5cm)에 있으면 몸통(이마·옆의 얇은 한 겹)
    flyFrom: 0.02, flyFull: 0.05,     // 겉면(가장 바깥 몸통 칸의 가운데)에서 이만큼(≈ 0.4cm) 안쪽은 몸통(안 돌림) · 이만큼(≈ 0.95cm) 넘게 뜨면 온전히 잔머리(사이는 서서히)
    depthLayer: 0.13,   // (i) 붓에 걸리는 깊이: 화면의 그 자리에서 카메라에 가장 가까운 머리보다 이만큼(≈ 2.5cm) 넘게 뒤에 있는 점은 안 빗음(겉층만) · 0 = 예전처럼 두상 가운데 깊이까지 전부
    visCell: 4,         // 그 "가장 가까운 깊이"를 재는 화면 칸(px)
    partFinger: true,   // (i) 결이 갈리는 자리(가르마·가마)에 뜬 가닥은 빗 방향으로 눕힘(예전: 그대로 둠 → 정수리에 뜬 고리가 남음)
    reachIn: 4,         // 거슬러 올라갈 때 몸통 속으로 들어간 뒤 더 칠하는 점 수(벗어나기 시작한 마디가 몸통 속에 있음)
    reachBack: true,    // (h) 붓이 뜬 구간에만 닿아도 그 가닥이 몸통에서 벗어난 자리까지 거슬러 올라가 같이 정렬(머리말 h 참고) · false = 붓이 칠한 마디만
    divAngle: 15,       // 도: 거슬러 올라갈 때, 몸통 속 마디가 그 자리 결에서 이 넘게 벗어나 있으면 아직 "벗어나는 구간"으로 봄
    flyTol: 0, flyTolFull: 6,   // 도: 겉면 타기에서 쓰는 허용 각 — 몸통은 "겉면에서 뜬 정도"로 이미 빼므로, 잔머리 구간은 조금만 벗어나도 맞춤(tolFrom/tolFull은 surf=false일 때만)
    lead: 0.6,          // 잔머리가 몸통에서 벗어나기 시작하는 마디(아직 겉면 근처)도 뒤 마디 세기의 이 비율만큼 같이 돌림 — 꺾여 나가는 자리가 남지 않게
    settle: 0.7,        // 빗긴 마디가 겉면보다 떠 있으면 한 마디에 이만큼(마디 길이의 배수 ≈ 35°)까지 겉면 쪽으로 내려 앉힘 · 0 = 끔
    maxMove: 0.32,      // (i) 안전 상한: 어떤 점도 빗기 전 자리에서 이만큼(≈ 6cm)보다 멀리 안 감 · 0 = 끔
    settleReach: 0.16,  // (i) 겉면에서 이만큼(≈ 3cm)보다 멀리 뜬 마디는 겉면 쪽으로 안 틂 — 멀리 있는 숱 많은 자리로 끌려가지 않게(방향 정렬·①은 그대로)
    settleGain: 0.6,    // 한 마디에 뜬 거리의 이 비율씩 다가감(1 = 한 번에 — 겉면의 들쭉날쭉을 그대로 따라 잔물결이 생김)
    ease: 0.5,          // 목표 방향에 직전 마디 방향을 이만큼 섞음(잔물결 제거) · 0 = 끔
    relax: 2,           // 빗긴 구간의 뾰족한 꺾임을 고르게 펴는 횟수(마디 길이는 그대로) · 0 = 끔
    pickStrands: 8000,  // 붓 자리 찾기에 쓰는 가닥 수 상한(넘으면 건너뛰며 씀)
    // (2026-10-07j) 빗어 넘기기 — 원 안의 머리(몸통 포함)를 쓴 방향으로 돌림(머리말 j 참고)
    sweep: true,
    mode: 'tidy',       // 'tidy' = 정리(잔머리를 결에 맞춤 — 지금까지의 빗) · 'sweep' = 넘기기
    sweepStrength: 0.6, // 한 표본이 돌리는 세기(겹쳐 쓸면 1까지 쌓임)
    sweepGrip: 0.12,    // 가닥의 앞 12%(뿌리 쪽)는 덜 돎
    sweepTol: 3,        // 도: 큰 방향이 쓴 방향에서 이 안쪽이면 안 건드림
    sweepDepth: 0.2,    // 넘기기 붓에 걸리는 깊이(≈ 3.8cm — 뭉치의 속까지 같이 넘어가게 · 정리는 depthLayer 2.5cm)
    sweepWrap: true,    // 두피 가까이에서는 쓴 방향을 두상 면을 타는 방향으로 눕혀 씀
    wrapNear: 1.15, wrapFar: 1.5   // 두피 타원체의 이 배수 안쪽은 온전히 면을 탐 · 이 배수 밖은 쓴 방향 그대로(사이는 서서히)
  }, W.COMB3D || {});
  C.sweeps = [];        // (j) 넘기기 표본 — 모양은 samples와 같음
  if (C.mode !== 'sweep') C.mode = 'tidy';
  C.samples = [];       // {dabs: Float32Array[x,y,z,w …], m, dx,dy,dz, k, g}
  var S = C.stats = { strokes: 0, touched: 0, _t: 0, ms: 0, pickMs: 0, pickPts: 0, pickFly: 0, pickHidden: 0, reached: 0, dabs: 0, seen: 0, tOwn: 0, tSide: 0, tAll: 0, tReach: 0, tFinger: 0, tSkip: 0, _to: 0, _ts: 0, _ta: 0, _tr: 0, _tf: 0, _tk: 0, pushed: 0, neck: 0, _pu: 0, _nk: 0, anch: 0, pin: 0, _an: 0, _pi: 0, fly: 0, _fl: 0, up: 0, _up: 0, clamp: 0, _cl: 0, surfRef: 0, surfCells: 0, flowRef: 0, flowCells: 0, flowMs: 0, err: null };
  var ver = 0, gid = 0, modelRef = null;
  S._sw = 0; S._swp = 0; S.swept = 0; S.sweptPush = 0; S.sweepStrokes = 0;

  function now() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function scr() { try { return currentScreen; } catch (e) { return ''; } }
  function m3() { try { return (model3D && model3D.initialized) ? model3D : null; } catch (e) { return null; } }
  function a3on() { try { return !!(W.ADJUST3D && W.ADJUST3D.on); } catch (e) { return false; } }
  function usable() { return !!(C.enabled && a3on() && scr() === 'adjust' && m3()); }

  /* ────────────────────────────────────────────────────────────────────────
   * ① 적용 — 표본을 "방향 장"(성긴 3D 격자)에 칠해 두고, 가닥은 지나가는 칸의 방향으로 돌림
   *    처음에는 표본을 하나씩 순서대로 가닥에 적용했는데(표본 223개 · 가닥 2천 개에 150ms, 표본 10배면 1.2초),
   *    표본 수만큼 느려져서 격자로 바꿨습니다 — 가닥 하나당 점 수만큼만 조회하므로 빗질을 많이 해도 느려지지 않습니다.
   *    칸의 값 V = 방향들의 섞인 벡터(새 빗질이 옛 것을 a만큼 덮음). |V| = 그 칸의 세기(반대 방향 빗질은 서로 지움).
   * ────────────────────────────────────────────────────────────────────── */
  var F = null, fDone = 0, fEpoch = 0, epoch = 0;     // F: 격자 · fDone: 격자에 칠한 표본 수 · epoch: 되돌리기/지우기 때 올림
  var OFF = 512, SPAN = 1024;
  function newField() { return { map: new Map(), V: new Float32Array(3 * 4096), n: 0, mn: [Infinity, Infinity, Infinity], mx: [-Infinity, -Infinity, -Infinity] }; }
  function splatPoint(f, x, y, z, r, k, dx, dy, dz) {
    var cell = C.cell, r2 = r * r, x0 = Math.floor((x - r) / cell), x1 = Math.floor((x + r) / cell), y0 = Math.floor((y - r) / cell), y1 = Math.floor((y + r) / cell),
      z0 = Math.floor((z - r) / cell), z1 = Math.floor((z + r) / cell), a, b, c, key, i, d2, w, V;
    if (x0 < -OFF || y0 < -OFF || z0 < -OFF || x1 >= OFF || y1 >= OFF || z1 >= OFF) return;
    for (c = z0; c <= z1; c++) { var ez = (c + 0.5) * cell - z;
      for (b = y0; b <= y1; b++) { var ey = (b + 0.5) * cell - y;
        for (a = x0; a <= x1; a++) { var ex = (a + 0.5) * cell - x;
          d2 = ex * ex + ey * ey + ez * ez; if (d2 >= r2) continue;
          w = k * Math.min(1, 1.6 * (1 - Math.sqrt(d2) / r)); if (w < 0.004) continue;      // 가운데는 고르게, 가장자리만 약하게
          key = (a + OFF) + SPAN * ((b + OFF) + SPAN * (c + OFF));
          i = f.map.get(key);
          if (i === undefined) {
            i = f.n++; f.map.set(key, i);
            if (i * 3 + 3 > f.V.length) { var nv = new Float32Array(f.V.length * 2); nv.set(f.V); f.V = nv; }
          }
          V = f.V; i *= 3;
          V[i] = V[i] * (1 - w) + dx * w; V[i + 1] = V[i + 1] * (1 - w) + dy * w; V[i + 2] = V[i + 2] * (1 - w) + dz * w;
        }
      }
    }
    if (x - r < f.mn[0]) f.mn[0] = x - r; if (y - r < f.mn[1]) f.mn[1] = y - r; if (z - r < f.mn[2]) f.mn[2] = z - r;
    if (x + r > f.mx[0]) f.mx[0] = x + r; if (y + r > f.mx[1]) f.mx[1] = y + r; if (z + r > f.mx[2]) f.mx[2] = z + r;
  }
  function splat(f, s) {
    var D = s.dabs, m = s.m, j, r = C.dab;
    for (j = 0; j < m; j++) splatPoint(f, D[j * 4], D[j * 4 + 1], D[j * 4 + 2], r, s.k * D[j * 4 + 3], s.dx, s.dy, s.dz);
  }
  function syncField() {
    var n = C.samples.length;
    if (!F || fEpoch !== epoch || fDone > n) { F = newField(); fDone = 0; fEpoch = epoch; }
    for (; fDone < n; fDone++) splat(F, C.samples[fDone]);
    return n ? F : null;
  }
  var F2 = null, f2Done = 0, f2Epoch = 0;             // (j) 넘기기 방향 장
  function syncSweep() {
    var n = C.sweeps.length;
    if (!F2 || f2Epoch !== epoch || f2Done > n) { F2 = newField(); f2Done = 0; f2Epoch = epoch; }
    for (; f2Done < n; f2Done++) splat(F2, C.sweeps[f2Done]);
    return n ? F2 : null;
  }
  /* 두상(두피 타원체 · 가운데 높이) — 가닥마다 다시 재지 않게 잠깐 기억(47번과 같은 방식) */
  var headMemo = null, headAt = -1e9, headKey = null;
  function headShape() {
    var key = null, t = now();
    try { key = state._hair3Dneutral || state.hair3Dneutral || null; } catch (e) {}
    if (headMemo !== null && key === headKey && t - headAt < 400) return headMemo || null;
    var E = null, cy = 0;
    try { E = (typeof getScalpEllipsoid === 'function') ? getScalpEllipsoid() : getHeadEllipsoid(); } catch (e) { E = null; }
    try { var m = state.hair3Dneutral; if (m && isFinite(m.CY)) cy = m.CY; else if (typeof SCALP_CENTER_Y !== 'undefined') cy = SCALP_CENTER_Y; } catch (e) {}
    headMemo = (E && E.a > 0 && E.b > 0 && E.c > 0 && isFinite(cy)) ? { a2: E.a * E.a, b2: E.b * E.b, c2: E.c * E.c, cy: cy } : false;
    headAt = t; headKey = key;
    return headMemo || null;
  }
  var buf = new Float64Array(4 * 256), rbuf = new Float64Array(3 * 256), wbuf = new Float64Array(256), pbuf = new Float64Array(256), kbuf = new Int32Array(256);
  var DEG = Math.PI / 180;
  /* 그 자리에서 이 가닥이 따를 결 → GT(길이 1). 제 칸과 이웃 칸(3×3×3)의 머리를 봄.
     돌려주는 값: 1 = 제 무리(이 가닥과 같은 쪽으로 흐르는 이웃) · 2 = 손가락 쪽으로 흐르는 이웃 · 3 = 이웃 전체 · 0 = 주변에 머리가 없음 · −1 = 결이 갈려 정할 수 없음
     (s = 이 가닥의 큰 방향 · f = 손가락 방향 · cOwn/cFin = 같은 쪽으로 치는 각의 cos) */
  /* (2026-10-05f) 그 자리가 몸통 머리 속인가: 0 = 밖(잔머리 자리) … 1 = 속 */
  /* (2026-10-05g) 몸통 겉면까지의 거리(모델 단위 · 몸통 속 = 0) — 잔칸 거리장을 세 방향으로 이어 읽음 */
  function distAt(d, x, y, z) {
    var u = (x - d.x0) * d.inv - 0.5, v = (y - d.y0) * d.inv - 0.5, w = (z - d.z0) * d.inv - 0.5, i = Math.floor(u), j = Math.floor(v), k = Math.floor(w);
    if (i < 0 || j < 0 || k < 0 || i >= d.mx - 1 || j >= d.my - 1 || k >= d.mz - 1) return d.far;
    var fu = u - i, fv = v - j, fk = w - k, D = d.D, o = i + d.mx * (j + d.my * k), sy = d.mx, sz = d.mx * d.my;
    var c00 = D[o] + (D[o + 1] - D[o]) * fu, c10 = D[o + sy] + (D[o + sy + 1] - D[o + sy]) * fu, c01 = D[o + sz] + (D[o + sz + 1] - D[o + sz]) * fu, c11 = D[o + sz + sy] + (D[o + sz + sy + 1] - D[o + sz + sy]) * fu;
    c00 += (c10 - c00) * fv; c01 += (c11 - c01) * fv;
    return c00 + (c01 - c00) * fk;
  }
  /* 그 자리에서 몸통 쪽(거리가 줄어드는 쪽) 방향 → DG(길이 1). 돌려주는 값 = 기울기 크기(0이면 방향 없음) */
  var DG = new Float64Array(3);
  function towardBody(d, x, y, z) {
    var h = d.h, gx = distAt(d, x - h, y, z) - distAt(d, x + h, y, z), gy = distAt(d, x, y - h, z) - distAt(d, x, y + h, z), gz = distAt(d, x, y, z - h) - distAt(d, x, y, z + h), l = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (!(l > 1e-9)) return 0;
    DG[0] = gx / l; DG[1] = gy / l; DG[2] = gz / l; return l / (2 * h);
  }
  function bodyAt(fw, x, y, z) {
    var a = Math.floor((x - fw.x0) * fw.inv), b = Math.floor((y - fw.y0) * fw.inv), c = Math.floor((z - fw.z0) * fw.inv);
    if (a < 0 || b < 0 || c < 0 || a >= fw.nx || b >= fw.ny || c >= fw.nz) return 0;
    var v = (fw.GA[a + fw.nx * (b + fw.ny * c)] - fw.bLo) / (fw.bHi - fw.bLo);
    return v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
  }
  var GT = new Float64Array(3);
  function grainAt(fw, x, y, z, sx, sy, sz, fx, fy, fz, cOwn, cFin) {
    var ci = Math.floor((x - fw.x0) * fw.inv), cj = Math.floor((y - fw.y0) * fw.inv), ck = Math.floor((z - fw.z0) * fw.inv), a, b, c, o, gn, gm, gx, gy, gz, l;
    var ox = 0, oy = 0, oz = 0, on = 0, px = 0, py = 0, pz = 0, pn = 0, ax = 0, ay = 0, az = 0, an = 0, GN = fw.GN, GM = fw.GM, GX = fw.GX, GY = fw.GY, GZ = fw.GZ, nx = fw.nx, ny = fw.ny, nz = fw.nz;
    for (c = ck - 1; c <= ck + 1; c++) { if (c < 0 || c >= nz) continue;
      for (b = cj - 1; b <= cj + 1; b++) { if (b < 0 || b >= ny) continue;
        for (a = ci - 1; a <= ci + 1; a++) { if (a < 0 || a >= nx) continue;
          o = a + nx * (b + ny * c); gn = GN[o]; if (!gn) continue;
          an += gn; gm = GM[o]; if (!(gm > 1e-6)) continue;
          gx = GX[o]; gy = GY[o]; gz = GZ[o]; ax += gx; ay += gy; az += gz;
          if (gx * sx + gy * sy + gz * sz > cOwn * gm) { ox += gx; oy += gy; oz += gz; on += gn; }
          if (gx * fx + gy * fy + gz * fz > cFin * gm) { px += gx; py += gy; pz += gz; pn += gn; }
        }
      }
    }
    if (an < fw.near) return 0;
    var need = fw.near * C.flowShare;
    if (on >= need) { l = Math.sqrt(ox * ox + oy * oy + oz * oz); if (l > 1e-6) { GT[0] = ox / l; GT[1] = oy / l; GT[2] = oz / l; return 1; } }
    if (pn >= need) { l = Math.sqrt(px * px + py * py + pz * pz); if (l > 1e-6) { GT[0] = px / l; GT[1] = py / l; GT[2] = pz / l; return 2; } }
    l = Math.sqrt(ax * ax + ay * ay + az * az);
    if (l > 1e-6 && l / an >= C.flowCoh) { GT[0] = ax / l; GT[1] = ay / l; GT[2] = az / l; return 3; }
    return -1;
  }
  /* ────────────────────────────────────────────────────────────────────────
   * (2026-10-05g) 겉면 타기 — 붓이 칠한 "잔머리 구간"을 몸통 겉면 위의 결을 따라 다시 걷게 함
   *   마디마다: 세기 = 붓이 칠한 세기 × 그 마디가 (빗기 전에) 몸통 겉면에서 뜬 정도.  몸통 속 마디는 세기 0 → 그대로.
   *   세기가 있는 마디는, 지금까지 다시 이어 온 자리(q)에서 가장 가까운 몸통 겉면의 결을 읽어 그쪽으로 돌리고,
   *   q가 겉면보다 떠 있으면 뜬 만큼 겉면 쪽으로 방향을 틉니다(한 마디에 settle×길이까지). 그래서 빗긴 구간은 겉면에 내려앉아 결을 탑니다.
   *   붓이 안 닿은 뒤쪽은 빗기 전 방향 그대로 이어집니다(모양 그대로 따라 옮겨짐).
   * ────────────────────────────────────────────────────────────────────── */
  function applySurf(g, f, FW) {
    var SF = FW.DF, n = g.length, last = n - 1, cell = C.cell, map = f.map, V = f.V, U = buf, CB = rbuf, WB = wbuf, PB = pbuf, KB = kbuf;
    var i, p, q0, a, b, c, k, w, t, vx, vy, vz, sx, sy, sz, sl, len, L = 0, lo = n, hi = 0, dv;
    var px = g[0].x, py = g[0].y, pz = g[0].z, d0 = SF.d0, dW = 1 / (SF.d1 - SF.d0);
    // ① 마디 방향·길이
    for (i = 1; i < n; i++) {
      p = g[i];
      sx = p.x - px; sy = p.y - py; sz = p.z - pz; len = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (len > 1e-9) { U[i * 4] = sx / len; U[i * 4 + 1] = sy / len; U[i * 4 + 2] = sz / len; } else { U[i * 4] = 0; U[i * 4 + 1] = -1; U[i * 4 + 2] = 0; }
      U[i * 4 + 3] = len; L += len;
      px = p.x; py = p.y; pz = p.z;
    }
    // ② 세기: 붓이 칠한 세기(PB) × 겉면에서 뜬 정도 → WB
    for (i = 1; i < n; i++) {
      WB[i] = 0; PB[i] = 0; KB[i] = -1;
      if (!(U[i * 4 + 3] > 1e-9)) continue;
      p = g[i]; q0 = g[i - 1];
      sx = (p.x + q0.x) * 0.5; sy = (p.y + q0.y) * 0.5; sz = (p.z + q0.z) * 0.5;
      a = Math.floor(sx / cell) + OFF; b = Math.floor(sy / cell) + OFF; c = Math.floor(sz / cell) + OFF;
      if (a < 0 || b < 0 || c < 0 || a >= SPAN || b >= SPAN || c >= SPAN) continue;
      k = map.get(a + SPAN * (b + SPAN * c));
      if (k === undefined) continue;
      vx = V[k * 3]; vy = V[k * 3 + 1]; vz = V[k * 3 + 2]; w = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (!(w > 0.01)) continue;
      t = i / last; if (t < C.gripFrom) w *= t / C.gripFrom;
      if (w > 1) w = 1;
      KB[i] = k; PB[i] = w;
      if (C.flyOnly) { dv = (distAt(SF, sx, sy, sz) - d0) * dW; w *= dv <= 0 ? 0 : dv >= 1 ? 1 : dv * dv * (3 - 2 * dv); }
      WB[i] = w;
    }
    // 잔머리가 몸통에서 벗어나기 시작하는 마디(아직 겉면 근처라 세기가 0에 가까움)도 같이 — 안 그러면 꺾여 나가는 자리가 그대로 남음
    if (C.reachBack) {
      // (2026-10-05h) 벗어난 자리까지 거슬러 올라가기 — 붓이 뜬 구간(②: 몸통 밖에서 결과 나란히 늘어진 부분)에만 닿아도,
      //   그 가닥이 몸통에서 벗어나기 시작한 구간(①: 바깥으로 비스듬히 나간 몇 마디)까지 같은 세기로 정렬함.
      //   ①이 결대로 돌면 그 뒤는 모양 그대로 몸통 쪽으로 따라 들어옴. 몸통 속으로 들어가면 마디마다 lead배로 줄어 곧 멈춤(뿌리 쪽 gripFrom은 그대로 적용).
      var carry = 0, kc = -1, fb, gm, uv, cDiv = Math.cos(Math.max(1, C.divAngle) * DEG);
      for (i = last; i >= 1; i--) {
        w = WB[i];
        if (w > carry) { carry = w; kc = KB[i]; continue; }
        if (!(carry > 0.05) || !(U[i * 4 + 3] > 1e-9)) continue;
        if (!(PB[i] > 0.01)) { carry *= 0.5; continue; }                   // (i) 붓이 칠한 마디에만(거슬러 올라가는 칠은 붓 쪽에서 그 가닥을 따라 함) — 안 칠한 자리로는 안 번짐
        p = g[i]; q0 = g[i - 1];
        dv = (distAt(SF, (p.x + q0.x) * 0.5, (p.y + q0.y) * 0.5, (p.z + q0.z) * 0.5) - d0) * dW; fb = dv > 0;
        if (!fb) {
          // 몸통 속: 이 마디가 아직 그 자리 결에서 벗어나 있으면(= ①이 몸통 속에서 시작된 부분) 줄이지 않고 계속 올라감. 결대로 가는 마디부터는 마디마다 lead배로 줄여 곧 멈춤
          a = Math.floor(((p.x + q0.x) * 0.5 - FW.x0) * FW.inv); b = Math.floor(((p.y + q0.y) * 0.5 - FW.y0) * FW.inv); c = Math.floor(((p.z + q0.z) * 0.5 - FW.z0) * FW.inv); k = 0;
          if (a >= 0 && b >= 0 && c >= 0 && a < FW.nx && b < FW.ny && c < FW.nz) {
            a += FW.nx * (b + FW.ny * c);
            if (FW.GN[a] >= FW.dense && FW.GM[a] >= 0.85 * FW.GN[a] && FW.GX[a] * U[i * 4] + FW.GY[a] * U[i * 4 + 1] + FW.GZ[a] * U[i * 4 + 2] < cDiv * FW.GM[a]) k = 1;
          }
          if (!k) carry *= C.lead;
        }
        t = i / last; gm = t < C.gripFrom ? t / C.gripFrom : 1; uv = carry * gm;
        if (uv > w) { WB[i] = uv; if (KB[i] < 0) KB[i] = kc; S._up++; }
      }
    } else if (C.lead > 0) for (i = last - 1; i >= 1; i--) { w = WB[i + 1] * C.lead; if (w > PB[i]) w = PB[i]; if (w > WB[i]) WB[i] = w; }
    for (i = 1; i < n; i++) if (WB[i] > 0.01) { if (i < lo) lo = i; hi = i; }
    if (lo > hi) return g;
    // ③ 큰 방향(앞뒤 hw 마디를 이은 현 가운데 이 마디와 가장 나란한 것) — 잔 컬·웨이브는 모양 그대로 통째로 돌리려고
    var hw = L > 0 ? Math.round(C.flowSmooth / (L / last)) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16;
    var A, B, ax, ay, az, tx, ty, tz, cl, dot, th;
    for (i = lo; i <= hi; i++) {
      if (!(WB[i] > 0.01)) continue;
      p = g[i]; q0 = g[i - 1];
      A = g[i - 1 - hw < 0 ? 0 : i - 1 - hw]; B = g[i + hw > last ? last : i + hw];
      ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2];
      sx = B.x - A.x; sy = B.y - A.y; sz = B.z - A.z; sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (sl > 1e-9) { sx /= sl; sy /= sl; sz /= sl; dot = sx * ax + sy * ay + sz * az; } else { sx = ax; sy = ay; sz = az; dot = 1; }
      tx = p.x - A.x; ty = p.y - A.y; tz = p.z - A.z; cl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (cl > 1e-9) { th = (tx * ax + ty * ay + tz * az) / cl; if (th > dot) { dot = th; sx = tx / cl; sy = ty / cl; sz = tz / cl; } }
      tx = B.x - q0.x; ty = B.y - q0.y; tz = B.z - q0.z; cl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (cl > 1e-9) { th = (tx * ax + ty * ay + tz * az) / cl; if (th > dot) { dot = th; sx = tx / cl; sy = ty / cl; sz = tz / cl; } }
      CB[i * 3] = sx; CB[i * 3 + 1] = sy; CB[i * 3 + 2] = sz;
    }
    // ④ 다시 걷기 — 처음 세기가 있는 마디부터 끝까지
    var t0 = Math.max(0, C.flyTol) * DEG, t1 = Math.max(t0 + 1e-3, C.flyTolFull * DEG), cOwn = Math.cos(C.flowOwn * DEG), cFin = Math.cos(C.flowFinger * DEG), reach = Math.max(0, C.flowReach | 0);
    var HD = headShape(), HDc = C.collide ? HD : null, NK = null, lift = C.headLift > 0 ? C.headLift : 1.02, yCap = (HD ? HD.cy : 0.15) + 0.3, dT = d0 * 0.5;
    var a2 = 1, b2 = 1, c2 = 1, hcy = 0, K0 = Math.cos(40 * DEG), K1 = Math.cos(80 * DEG), NKs = null, PT = { x: 0, y: 0, z: 0 }, mvMax = C.maxMove > 0 ? C.maxMove : 0;
    try { NKs = (W.REGROW && typeof W.REGROW.neckPush === 'function') ? W.REGROW.neckPush : null; } catch (e6) { NKs = null; }
    if (HDc) { a2 = HDc.a2; b2 = HDc.b2; c2 = HDc.c2; hcy = HDc.cy; try { NK = (W.REGROW && typeof W.REGROW.neckPush === 'function') ? W.REGROW.neckPush : null; } catch (e3) { NK = null; } }
    var out = new Array(n), qx = g[lo - 1].x, qy = g[lo - 1].y, qz = g[lo - 1].z, ex, ey, ez, moved = 0;
    var lx = 0, ly = 0, lz = 0, hasL = false, de, gl, bx, by, bz, steer, mpx, mpy, mpz, fx, fy, fz, fl, code, hh, nx, ny, nz, nl, cin, gd, gpl, kk, du, wr, fr, ang, cx, cy, cz, cs, sn, kd, o, pt, r, yy, ee, flr, dn, e02;
    if (lo > 1) { lx = U[(lo - 1) * 4]; ly = U[(lo - 1) * 4 + 1]; lz = U[(lo - 1) * 4 + 2]; hasL = U[(lo - 1) * 4 + 3] > 1e-9; }
    for (i = 0; i < lo; i++) out[i] = g[i];
    for (i = lo; i < n; i++) {
      ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; len = U[i * 4 + 3];
      w = i <= hi ? WB[i] : 0;
      if (w > 0.01 && len > 1e-9) {
        S._fl++;
        k = KB[i] * 3; fx = V[k]; fy = V[k + 1]; fz = V[k + 2]; fl = Math.sqrt(fx * fx + fy * fy + fz * fz); fx /= fl; fy /= fl; fz /= fl;      // 손가락 방향
        // 지금 자리(q)에서 몸통 겉면까지: 거리 de · 방향 b
        de = distAt(SF, qx, qy, qz); steer = false; mpx = qx; mpy = qy; mpz = qz; gl = 0;
        if (de > 1e-4 && de < SF.far && (gl = towardBody(SF, qx, qy, qz)) > 0.2) {
          bx = DG[0]; by = DG[1]; bz = DG[2];
          // (i) 가장 가까운 몸통이 두상·목 건너편이면(목 옆·얼굴 옆에 늘어진 가닥에게 "가장 가까운 숱 많은 자리"가 반대쪽 머리일 때) 그쪽은 못 감:
          //     내려앉을 자리가 두상 축의 반대편이거나, 거기까지 가는 길(가운데·끝)이 두상 속·목 속이면 이 마디는 제자리의 결만 봄.
          //     h에서는 이 확인 없이 틀어서, 가닥이 목·얼굴을 가로질러 앞으로 나왔습니다(사용자 영상).
          sx = qx + bx * de; sy = qy + by * de; sz = qz + bz * de; hh = 1;
          if (qx * sx + qz * sz < 0) hh = 0;
          else if (HD) {
            yy = sy - HD.cy; if (sx * sx / HD.a2 + yy * yy / HD.b2 + sz * sz / HD.c2 < 1) hh = 0;
            else { yy = (qy + sy) * 0.5 - HD.cy; if ((qx + sx) * (qx + sx) * 0.25 / HD.a2 + yy * yy / HD.b2 + (qz + sz) * (qz + sz) * 0.25 / HD.c2 < 1) hh = 0; }
          }
          if (hh && NKs) { try { PT.x = sx; PT.y = sy; PT.z = sz; if (NKs(PT) !== PT) hh = 0; else { PT.x = (qx + sx) * 0.5; PT.y = (qy + sy) * 0.5; PT.z = (qz + sz) * 0.5; if (NKs(PT) !== PT) hh = 0; } } catch (e5) {} }
          if (!hh) gl = 0;
          else { mpx = sx; mpy = sy; mpz = sz; }                           // 결은 내려앉을 자리(겉면)에서 읽음
          // 두상 안쪽이 아닌 쪽(옆·바깥)에 있는 몸통으로는 안 당김 — 얇은 앞머리·머리 끝이 옆의 숱 많은 쪽으로 쏠리지 않게
          nx = -qx; ny = qy > yCap ? yCap - qy : 0; nz = -qz; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          cin = nl > 1e-6 ? (bx * nx + by * ny + bz * nz) / nl : 1;
          steer = hh === 1 && C.settle > 0 && de > dT && de <= C.settleReach && cin > 0.2;      // settleReach보다 멀리 뜬 가닥은 안 당김(방향만 맞춤)
        }
        // 이 가닥이 따를 결: 제 무리(지금까지 걸어온 방향과 같이 흐르는 이웃) → 손가락 쪽 이웃 → 이웃 전체 → (주변에 머리가 없으면) 두상 쪽에서 찾음 → 손가락 방향
        if (hasL) { sx = lx; sy = ly; sz = lz; } else { sx = CB[i * 3]; sy = CB[i * 3 + 1]; sz = CB[i * 3 + 2]; }
        code = grainAt(FW, mpx, mpy, mpz, sx, sy, sz, fx, fy, fz, cOwn, cFin);
        if (code === 0) {
          // 겉면 자리의 머리가 성기면(머리 끝·가장자리) 몸통 속으로 더 들어가며 찾음: 몸통 쪽 방향을 알면 그쪽으로, 모르면 두상 쪽으로
          for (hh = 1; hh <= reach; hh++) {
            if (gl > 0.2) { cx = bx; cy = by; cz = bz; cl = 1; }
            else { cx = -mpx; cy = (mpy < yCap ? 0 : yCap - mpy); cz = -mpz; cl = Math.sqrt(cx * cx + cy * cy + cz * cz); if (!(cl > 1e-6)) break; }
            mpx += cx / cl * FW.fc; mpy += cy / cl * FW.fc; mpz += cz / cl * FW.fc;
            code = grainAt(FW, mpx, mpy, mpz, sx, sy, sz, fx, fy, fz, cOwn, cFin);
            if (code !== 0) { if (code > 0) code = 4; break; }
          }
        }
        // 머리 끝: 끝내 결을 못 찾았고 몸통이 이 마디의 뒤쪽(지나온 쪽)에만 있으면 밑단 아래로 늘어진 끝 — 옆에 기댈 결이 없으니 그대로 둠(손가락 방향으로 꺾지 않음)
        if (code === 0 && gl > 0.2 && bx * ax + by * ay + bz * az < -0.6) code = -2;
        if (code === -1) { S._tk++; if (C.partFinger) code = 0; }          // −1: 결이 갈리는 자리(가르마·가마) — 뜬 가닥은 빗이 지나가는 방향을 따름(빗으로 넘기는 쪽). partFinger=false면 그대로 둠
        if (code < 0) {}
        else {
          if (code === 0) { tx = fx; ty = fy; tz = fz; S._tf++; }
          else { tx = GT[0]; ty = GT[1]; tz = GT[2]; if (code === 1) S._to++; else if (code === 2) S._ts++; else if (code === 3) S._ta++; else S._tr++; }
          hh = 0;
          if (steer) {                                                     // 뜬 만큼 겉면 쪽으로 틂(결과 나란한 채 떠 있는 가닥도 내려앉음). 결과 나란한 쪽(머리 끝 아래·위)으로는 안 당김
            gd = bx * tx + by * ty + bz * tz; cx = bx - gd * tx; cy = by - gd * ty; cz = bz - gd * tz; gpl = Math.sqrt(cx * cx + cy * cy + cz * cz);
            if (gpl > 0.3) {
              kk = C.settleGain * (de - dT) / len; if (kk > C.settle) kk = C.settle; kk *= (cin >= 0.6 ? 1 : (cin - 0.2) / 0.4) / gpl;      // 한 번에 다 내리면 겉면 칸의 들쭉날쭉을 따라 잔물결이 생김 → 뜬 거리의 settleGain배씩
              tx += cx * kk; ty += cy * kk; tz += cz * kk; sl = Math.sqrt(tx * tx + ty * ty + tz * tz); tx /= sl; ty /= sl; tz /= sl; S._pi++; hh = 1;
            }
          }
          if (hasL && C.ease > 0 && lx * tx + ly * ty + lz * tz > 0) {       // 목표를 직전 마디 방향과 섞어 고르게(칸마다 결·거리가 조금씩 달라 생기는 잔물결 제거)
            tx += lx * C.ease; ty += ly * C.ease; tz += lz * C.ease; sl = Math.sqrt(tx * tx + ty * ty + tz * tz); tx /= sl; ty /= sl; tz /= sl;
          }
          du = ax * tx + ay * ty + az * tz;
          if (du < 0) {
            // 결을 거슬러 선 마디(뾰족하게 솟은 잔머리): 반만 돌리면 옆으로 삐죽 나온 채 남음 → 세기가 웬만하면 결 방향으로 통째로, 약하면 그대로
            wr = w <= 0.15 ? 0 : w >= 0.4 ? 1 : (w - 0.15) / 0.25; wr = wr * wr * (3 - 2 * wr);
            if (wr > 0.5) { sx = ax * (1 - wr) + tx * wr; sy = ay * (1 - wr) + ty * wr; sz = az * (1 - wr) + tz * wr; sl = Math.sqrt(sx * sx + sy * sy + sz * sz); if (sl > 0.2) { ax = sx / sl; ay = sy / sl; az = sz / sl; } else { ax = tx; ay = ty; az = tz; } }
          } else {
            // 큰 방향이 목표에서 벗어난 만큼 돌림(tolFrom° 안쪽은 그대로) — 회전을 마디에 그대로 적용하므로 잔 컬은 남음
            sx = CB[i * 3]; sy = CB[i * 3 + 1]; sz = CB[i * 3 + 2];
            if (sx * ax + sy * ay + sz * az < 0.5) { sx = ax; sy = ay; sz = az; }      // 현이 이 마디와 60° 넘게 다르면(꺾이는 자리) 마디 자체를 기준으로
            dot = sx * tx + sy * ty + sz * tz; if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
            th = Math.acos(dot);
            if (th > t0 || (hh && th > 0.01)) {                              // 겉면 쪽으로 트는 중이면 허용 각 없이(안 그러면 겉면 0.3~0.5cm 앞에서 멈춤)
              fr = (hh || th >= t1) ? 1 : (th - t0) / (t1 - t0); if (fr < 1) fr = fr * fr * (3 - 2 * fr);
              ang = th * fr * w;
              cx = sy * tz - sz * ty; cy = sz * tx - sx * tz; cz = sx * ty - sy * tx; cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
              if (ang >= 0.003 && cl > 1e-4) {                               // 축 둘레로 ang만큼(로드리게스)
                cx /= cl; cy /= cl; cz /= cl; cs = Math.cos(ang); sn = Math.sin(ang); kd = (cx * ax + cy * ay + cz * az) * (1 - cs);
                sx = ax * cs + (cy * az - cz * ay) * sn + cx * kd; sy = ay * cs + (cz * ax - cx * az) * sn + cy * kd; sz = az * cs + (cx * ay - cy * ax) * sn + cz * kd;
                ax = sx; ay = sy; az = sz;
              }
            }
          }
        }
        // 빗긴 구간에 남은 뾰족한 꺾임 펴기: 바로 앞 마디와 40° 넘게 꺾이면 앞 마디 쪽으로(80° 이상이면 relax×세기만큼). 완만한 굽이·컬은 그대로
        if (C.relax > 0 && hasL) {
          dot = ax * lx + ay * ly + az * lz;
          if (dot < K0) {
            fr = dot <= K1 ? 1 : (K0 - dot) / (K0 - K1); fr = fr * fr * (3 - 2 * fr) * w * (C.relax > 1 ? 1 : C.relax);
            sx = ax + (lx - ax) * fr; sy = ay + (ly - ay) * fr; sz = az + (lz - az) * fr; sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
            if (sl > 0.2) { ax = sx / sl; ay = sy / sl; az = sz / sl; }
          }
        }
      }
      ex = qx + ax * len; ey = qy + ay * len; ez = qz + az * len;
      o = g[i];
      if (mvMax > 0 && len > 1e-9) {
        // (i) 안전 상한 — 어떤 점도 빗기 전 자리에서 maxMove(≈ 6cm)보다 멀리 가지 않음. 넘으면 그 안으로 당기고 마디 길이를 다시 맞춤.
        //     빗 한 번에 가닥이 두상·목을 돌아 반대편으로 넘어가는 일을 막는 마지막 울타리(정상적인 눕힘은 몇 cm 안).
        sx = ex - o.x; sy = ey - o.y; sz = ez - o.z; e02 = sx * sx + sy * sy + sz * sz;
        if (e02 > mvMax * mvMax) {
          kk = mvMax / Math.sqrt(e02); tx = o.x + sx * kk - qx; ty = o.y + sy * kk - qy; tz = o.z + sz * kk - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
          if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; S._cl++; }
        }
      }
      if (C.anchor && len > 1e-9) {
        // 붙들기 — 빗기 전 자리가 몸통 속이던 점은 제자리 쪽으로(앞에서 잔머리 구간이 눕으면서 뒤쪽 몸통 구간이 따라 밀린 것을 되돌림).
        //   안쪽(두상 쪽)으로 들어간 것은 안 되돌림 — 겉면에 내려앉히는 것과 싸우지 않게. 잔머리(몸통 밖이던 점)는 붙들지 않음.
        sx = ex - o.x; sy = ey - o.y; sz = ez - o.z; e02 = sx * sx + sy * sy + sz * sz;
        if (e02 > 1e-10) {
          dv = (distAt(SF, o.x, o.y, o.z) - d0) * dW; dv = dv <= 0 ? 1 : dv >= 1 ? 0 : 1 - dv * dv * (3 - 2 * dv);
          if (dv > 0 && !(w > 0.01)) {
            kk = len / (C.anchorLen > 0.01 ? C.anchorLen : 0.13); if (kk > 0.5) kk = 0.5; kk *= dv;
            // 가닥을 따라 밀린 몫(앞에서 솟은 자리가 펴지면 뒤쪽은 그만큼 아래로 내려감)은 되돌리지 않음 — 되돌리면 길이가 남아 가닥이 접힘. 옆으로 밀린 몫만.
            dot = sx * U[i * 4] + sy * U[i * 4 + 1] + sz * U[i * 4 + 2]; sx -= dot * U[i * 4]; sy -= dot * U[i * 4 + 1]; sz -= dot * U[i * 4 + 2];
            tx = ex - sx * kk - qx; ty = ey - sy * kk - qy; tz = ez - sz * kk - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; S._an++; }
          }
        }
      }
      if (HDc && len > 1e-9) {
        // 두상: 빗기 전부터 겉면보다 안쪽이던 점(뿌리 등)은 그 깊이까지만 허용
        yy = o.y - hcy; flr = Math.sqrt(o.x * o.x / a2 + yy * yy / b2 + o.z * o.z / c2); if (flr > lift) flr = lift;
        yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
        if (ee < flr - 1e-6) {
          yy = qy - hcy; nx = qx / a2; ny = yy / b2; nz = qz / c2; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nl > 1e-9) {
            nx /= nl; ny /= nl; nz /= nl; tx = (ex - qx) / len; ty = (ey - qy) / len; tz = (ez - qz) / len; dn = tx * nx + ty * ny + tz * nz;
            if (dn < 0) {                                                  // 안쪽 성분을 빼고 면을 타고 눕힘
              tx -= dn * nx; ty -= dn * ny; tz -= dn * nz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (sl < 0.35) { q0 = g[i - 1]; tx = (o.x - q0.x) / len; ty = (o.y - q0.y) / len; tz = (o.z - q0.z) / len; dn = tx * nx + ty * ny + tz * nz; if (dn < 0) { tx -= dn * nx; ty -= dn * ny; tz -= dn * nz; } sl = Math.sqrt(tx * tx + ty * ty + tz * tz); }
              if (sl > 1e-3) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
            }
          }
          yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
          if (ee < flr - 1e-6 && ee > 1e-9) {                              // 안전망: 겉면으로 밀어내고 마디 길이를 다시 맞춤
            kk = flr / ee; ex *= kk; ey = hcy + yy * kk; ez *= kk;
            tx = ex - qx; ty = ey - qy; tz = ez - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
          }
          S._pu++;
        }
      }
      pt = { x: ex, y: ey, z: ez };
      if (NK && len > 1e-9) {
        try {
          r = NK(pt);
          if (r && r !== pt && NK(o) === o) {
            tx = r.x - qx; ty = r.y - qy; tz = r.z - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { pt = { x: qx + tx / sl * len, y: qy + ty / sl * len, z: qz + tz / sl * len }; S._nk++; }
          }
        } catch (e4) {}
      }
      if (len > 1e-9) { lx = (pt.x - qx) / len; ly = (pt.y - qy) / len; lz = (pt.z - qz) / len; hasL = true; }
      sx = pt.x - o.x; sy = pt.y - o.y; sz = pt.z - o.z; e02 = sx * sx + sy * sy + sz * sz; if (e02 > moved) moved = e02;
      qx = pt.x; qy = pt.y; qz = pt.z;
      out[i] = pt;
    }
    if (!(moved > 1e-12)) return g;                                        // 닿았지만 이미 결대로 누워 있던 가닥
    S._t++;
    try { out._pre = g._pre || g; } catch (e2) {}
    return out;
  }
  function applySamples(g) {
    if (!C.enabled || !C.samples.length || !g || g.length < 2) return g;
    var f = syncField(); if (!f || !f.n) return g;
    var n = g.length, i, p, mn = f.mn, mx = f.mx, any = false;
    for (i = 0; i < n; i++) { p = g[i]; if (p.x >= mn[0] && p.x <= mx[0] && p.y >= mn[1] && p.y <= mx[1] && p.z >= mn[2] && p.z <= mx[2]) { any = true; break; } }
    if (!any) return g;
    if (buf.length < n * 4) { buf = new Float64Array(n * 4 + 128); rbuf = new Float64Array(n * 3 + 96); wbuf = new Float64Array(n + 32); pbuf = new Float64Array(n + 32); kbuf = new Int32Array(n + 32); }
    if (C.grain && C.surf && flowMemo && flowMemo.flow && flowMemo.flow.DF) return applySurf(g, f, flowMemo.flow);      // (g) 겉면 타기
    var cell = C.cell, map = f.map, V = f.V, last = n - 1, changed = false, U = buf, R = rbuf;          // U: 마디 i(점 i−1 → i)의 [ux,uy,uz,길이] · R: 그 마디를 돌릴 회전(축×각)
    var px = g[0].x, py = g[0].y, pz = g[0].z, lo = n, hi = 0, L = 0, len, sx, sy, sz, sl;
    // ① 마디 방향·길이
    for (i = 1; i < n; i++) {
      p = g[i];
      sx = p.x - px; sy = p.y - py; sz = p.z - pz; len = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (len > 1e-9) { U[i * 4] = sx / len; U[i * 4 + 1] = sy / len; U[i * 4 + 2] = sz / len; } else { U[i * 4] = 0; U[i * 4 + 1] = -1; U[i * 4 + 2] = 0; }
      U[i * 4 + 3] = len; L += len;
      px = p.x; py = p.y; pz = p.z;
    }
    // ② 마디마다: 그 칸의 목표 방향 쪽으로 가닥의 "큰 방향"(앞뒤 hw 마디를 이은 현)을 돌리는 회전을 구함.
    //    마디 하나의 방향이 아니라 큰 방향을 보므로 — 이미 나란한 머리는 안 움직이고(tolFrom 안쪽), 잔 컬·웨이브는 모양 그대로 통째로 돕니다.
    var hw = L > 0 ? Math.round(C.flowSmooth / (L / last)) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16;
    var t0 = Math.max(0, C.tolFrom) * DEG, t1 = Math.max(t0 + 1e-3, C.tolFull * DEG);
    var A, B, q0, a, b, c, k, vx, vy, vz, vl, w, t, tx, ty, tz, dot, th, fr, ang, cx, cy, cz, cl, ax, ay, az;
    // 결 격자(붓을 댈 때 빗기 전 가닥들로 만들어 둔 것). 없으면(grain=false) 손가락 방향이 그대로 목표.
    var FW = (C.grain && flowMemo && flowMemo.flow) ? flowMemo.flow : null, HD0 = null, code, hh, mpx, mpy, mpz, o0, gnn, gmm, reach = Math.max(0, C.flowReach | 0);
    var WB = wbuf, AFW = (C.anchor && flowMemo && flowMemo.flow && flowMemo.flow.GA) ? flowMemo.flow : null;
    var cT0 = Math.cos(t0), cOwn = Math.cos(C.flowOwn * DEG), cFin = Math.cos(C.flowFinger * DEG), yCap = 0.45;
    if (FW) { HD0 = headShape(); yCap = (HD0 ? HD0.cy : 0.15) + 0.3; }
    for (i = 1; i < n; i++) {
      R[i * 3] = 0; R[i * 3 + 1] = 0; R[i * 3 + 2] = 0; WB[i] = 0;
      if (!(U[i * 4 + 3] > 1e-9)) continue;
      p = g[i]; q0 = g[i - 1];
      a = Math.floor((p.x + q0.x) * 0.5 / cell) + OFF; b = Math.floor((p.y + q0.y) * 0.5 / cell) + OFF; c = Math.floor((p.z + q0.z) * 0.5 / cell) + OFF;
      if (a < 0 || b < 0 || c < 0 || a >= SPAN || b >= SPAN || c >= SPAN) continue;
      k = map.get(a + SPAN * (b + SPAN * c));
      if (k === undefined) continue;
      k *= 3; vx = V[k]; vy = V[k + 1]; vz = V[k + 2]; vl = Math.sqrt(vx * vx + vy * vy + vz * vz); w = vl;
      if (!(w > 0.01)) continue;
      t = i / last; if (t < C.gripFrom) w *= t / C.gripFrom;
      if (w > 1) w = 1;
      if (AFW && C.flyOnly) { w *= 1 - bodyAt(AFW, (p.x + q0.x) * 0.5, (p.y + q0.y) * 0.5, (p.z + q0.z) * 0.5); if (!(w > 0.01)) continue; }   // 몸통 머리 속 마디는 안 돌림 — 몸통 밖으로 뜬 구간만
      WB[i] = w;
      if (AFW && C.pullIn > 0 && bodyAt(AFW, p.x, p.y, p.z) < 0.5) { changed = true; if (i < lo) lo = i; if (i > hi) hi = i; }   // 몸통 밖에 뜬 마디 — 결과 나란해도 몸통 쪽으로 붙임
      // 큰 방향 = 뒤쪽 현(i−1−hw → i) · 앞쪽 현(i−1 → i+hw) · 가운데 현 중 이 마디와 가장 나란한 것.
      //   가운데 현만 쓰면 잔머리가 꺾여 나가는 자리에서 꺾이기 전(몸통)과 후(삐죽 나온 꼬리)가 섞여, 몸통 쪽은 괜히 돌고 꼬리는 덜 돕니다.
      A = g[i - 1 - hw < 0 ? 0 : i - 1 - hw]; B = g[i + hw > last ? last : i + hw];
      ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2];
      sx = B.x - A.x; sy = B.y - A.y; sz = B.z - A.z; sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (sl > 1e-9) { sx /= sl; sy /= sl; sz /= sl; dot = sx * ax + sy * ay + sz * az; } else { sx = ax; sy = ay; sz = az; dot = 1; }
      tx = p.x - A.x; ty = p.y - A.y; tz = p.z - A.z; cl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (cl > 1e-9) { th = (tx * ax + ty * ay + tz * az) / cl; if (th > dot) { dot = th; sx = tx / cl; sy = ty / cl; sz = tz / cl; } }
      tx = B.x - q0.x; ty = B.y - q0.y; tz = B.z - q0.z; cl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (cl > 1e-9) { th = (tx * ax + ty * ay + tz * az) / cl; if (th > dot) { dot = th; sx = tx / cl; sy = ty / cl; sz = tz / cl; } }
      tx = vx / vl; ty = vy / vl; tz = vz / vl;                            // 손가락 방향
      if (FW) {
        // 목표 = 이 자리 머리의 결. 가닥마다 따로 정함: 제 무리가 있으면 그 결(가르마 양쪽·겹친 층은 각자 제 쪽 → 몸통 머리는 안 움직임),
        //   제 무리가 없는 가닥(잔머리)은 손가락 쪽으로 흐르는 이웃의 결 → 이웃 전체의 결 → (주변에 머리가 없으면) 두상 쪽으로 들어가며 찾고 → 손가락 방향.
        mpx = (p.x + q0.x) * 0.5; mpy = (p.y + q0.y) * 0.5; mpz = (p.z + q0.z) * 0.5;
        a = Math.floor((mpx - FW.x0) * FW.inv); b = Math.floor((mpy - FW.y0) * FW.inv); c = Math.floor((mpz - FW.z0) * FW.inv);
        if (a >= 0 && b >= 0 && c >= 0 && a < FW.nx && b < FW.ny && c < FW.nz) {      // 빠른 길: 빽빽하고 결이 뚜렷한 칸에서 그 결과 나란한 마디 = 몸통 머리 → 통과
          o0 = a + FW.nx * (b + FW.ny * c); gnn = FW.GN[o0]; gmm = FW.GM[o0];
          if (gnn >= FW.dense && gmm >= 0.85 * gnn && FW.GX[o0] * sx + FW.GY[o0] * sy + FW.GZ[o0] * sz >= cT0 * gmm) continue;
        }
        code = grainAt(FW, mpx, mpy, mpz, sx, sy, sz, tx, ty, tz, cOwn, cFin);
        if (code === 0) {
          for (hh = 1; hh <= reach; hh++) {
            cx = -mpx; cy = (mpy < yCap ? 0 : yCap - mpy); cz = -mpz; cl = Math.sqrt(cx * cx + cy * cy + cz * cz); if (!(cl > 1e-6)) break;
            mpx += cx / cl * FW.fc; mpy += cy / cl * FW.fc; mpz += cz / cl * FW.fc;
            code = grainAt(FW, mpx, mpy, mpz, sx, sy, sz, tx, ty, tz, cOwn, cFin);
            if (code !== 0) { if (code > 0) code = 4; break; }
          }
        }
        if (code < 0) { S._tk++; continue; }                               // 결이 갈리는 자리(가르마·가마)의 잔머리 — 어느 쪽인지 정할 수 없어 그대로 둠
        if (code === 0) S._tf++;                                           // 주변에 머리가 없음 → 손가락 방향
        else { tx = GT[0]; ty = GT[1]; tz = GT[2]; if (code === 1) S._to++; else if (code === 2) S._ts++; else if (code === 3) S._ta++; else S._tr++; }
      }
      dot = sx * tx + sy * ty + sz * tz; if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
      th = Math.acos(dot);
      if (th <= t0) continue;                                              // 이미 그 방향 — 안 건드림
      fr = th >= t1 ? 1 : (th - t0) / (t1 - t0); if (fr < 1) fr = fr * fr * (3 - 2 * fr);
      ang = th * fr * w; if (ang < 0.003) continue;
      cx = sy * tz - sz * ty; cy = sz * tx - sx * tz; cz = sx * ty - sy * tx; cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (cl < 1e-4) {                                                     // 목표와 거의 정반대 — 아무 수직축으로
        if (Math.abs(sx) < 0.9) { cx = 0; cy = sz; cz = -sy; } else { cx = -sz; cy = 0; cz = sx; }
        cl = Math.sqrt(cx * cx + cy * cy + cz * cz); if (!(cl > 1e-9)) continue;
      }
      ang /= cl; R[i * 3] = cx * ang; R[i * 3 + 1] = cy * ang; R[i * 3 + 2] = cz * ang;
      changed = true; if (i < lo) lo = i; if (i > hi) hi = i;
    }
    if (!changed) return g;
    // ③ 회전을 이웃 마디끼리 한 번 고르게 — 칸마다 방향이 조금씩 달라 생기는 잔물결을 없앰(방향이 아니라 회전을 고르게 하므로 컬은 그대로)
    var s0 = Math.max(1, lo - 1), s1 = Math.min(last, hi + 1), o0x, o0y, o0z, c0x, c0y, c0z, j;
    j = (s0 > 1 ? s0 - 1 : s0) * 3; o0x = R[j]; o0y = R[j + 1]; o0z = R[j + 2];
    for (i = s0; i <= s1; i++) {
      j = i * 3; c0x = R[j]; c0y = R[j + 1]; c0z = R[j + 2];
      if (i < last) { R[j] = (o0x + 2 * c0x + R[j + 3]) * 0.25; R[j + 1] = (o0y + 2 * c0y + R[j + 4]) * 0.25; R[j + 2] = (o0z + 2 * c0z + R[j + 5]) * 0.25; }
      else { R[j] = (o0x + 3 * c0x) * 0.25; R[j + 1] = (o0y + 3 * c0y) * 0.25; R[j + 2] = (o0z + 3 * c0z) * 0.25; }
      o0x = c0x; o0y = c0y; o0z = c0z;
    }
    // ④ 다시 잇기 — 바뀐 첫 마디부터 끝까지(그 앞은 빗기 전과 같은 점). 마디 길이는 그대로.
    //    두상·목 안으로는 못 들어감: 빗기 전부터 겉면보다 안쪽이던 점(뿌리 등)은 그 깊이까지만 허용.
    var out = new Array(n), HD = C.collide ? headShape() : null, NK = null, lift = C.headLift > 0 ? C.headLift : 1.02;
    var a2 = 1, b2 = 1, c2 = 1, hcy = 0, kx, ky, kz, cs, sn, kd, ex, ey, ez, ee, fl, o, kk, pt, r, yy, nx, ny, nz, nl, dn;
    if (HD) { a2 = HD.a2; b2 = HD.b2; c2 = HD.c2; hcy = HD.cy; try { NK = (W.REGROW && typeof W.REGROW.neckPush === 'function') ? W.REGROW.neckPush : null; } catch (e3) { NK = null; } }
    for (i = 0; i < s0; i++) out[i] = g[i];
    var qx = g[s0 - 1].x, qy = g[s0 - 1].y, qz = g[s0 - 1].z;
    for (i = s0; i < n; i++) {
      ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; len = U[i * 4 + 3];
      if (i <= s1) {
        kx = R[i * 3]; ky = R[i * 3 + 1]; kz = R[i * 3 + 2]; ang = Math.sqrt(kx * kx + ky * ky + kz * kz);
        if (ang > 1e-5) {                                                  // 축 k 둘레로 ang만큼 돌림(로드리게스)
          kx /= ang; ky /= ang; kz /= ang; cs = Math.cos(ang); sn = Math.sin(ang); kd = (kx * ax + ky * ay + kz * az) * (1 - cs);
          tx = ax * cs + (ky * az - kz * ay) * sn + kx * kd; ty = ay * cs + (kz * ax - kx * az) * sn + ky * kd; tz = az * cs + (kx * ay - ky * ax) * sn + kz * kd;
          ax = tx; ay = ty; az = tz;
        }
      }
      ex = qx + ax * len; ey = qy + ay * len; ez = qz + az * len;
      if (AFW && len > 1e-9) {
        // (2026-10-05f) ⓐ 붙들기 — 빗기 전 자리가 몸통 속이던 점은 제자리 쪽으로 되돌림.
        //    두상 바깥쪽(겉으로 뜨는) 성분은 언제나, 옆으로 밀린 성분은 새 자리가 몸통을 벗어날 때만. 잔머리(몸통 밖이던 점)는 붙들지 않음 → 그대로 눕음.
        o = g[i]; var e0x = ex - o.x, e0y = ey - o.y, e0z = ez - o.z, e02 = e0x * e0x + e0y * e0y + e0z * e0z, bo = 0, bn = 1;
        if (e02 > 1e-10) {
          bo = bodyAt(AFW, o.x, o.y, o.z);
          if (bo > 0) {
            var kap = len / (C.anchorLen > 0.01 ? C.anchorLen : 0.13); if (kap > 0.5) kap = 0.5; kap *= bo;
            nx = o.x; ny = o.y > yCap ? o.y - yCap : 0; nz = o.z; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (nl > 1e-9) { nx /= nl; ny /= nl; nz /= nl; } else { nx = 0; ny = 1; nz = 0; }
            bn = bodyAt(AFW, ex, ey, ez);
            var en = e0x * nx + e0y * ny + e0z * nz, kt = kap * (1 - bn), ktU = C.flyOnly ? kap : (WB[i] > 0.01 ? kt : Math.max(kt, kap * 0.5));   // 붓이 안 닿은 구간은 옆으로 밀린 것도 서서히 제자리로
            var cxx = -(en * nx * kap + (e0x - en * nx) * ktU), cyy = -(en * ny * kap + (e0y - en * ny) * ktU), czz = -(en * nz * kap + (e0z - en * nz) * ktU);
            var cmag = Math.sqrt(cxx * cxx + cyy * cyy + czz * czz), cmax = 0.5 * len; if (cmag > cmax) { cxx *= cmax / cmag; cyy *= cmax / cmag; czz *= cmax / cmag; }
            tx = ex + cxx - qx; ty = ey + cyy - qy; tz = ez + czz - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; S._an++; }
          }
        }
        // ⓑ 몸통 쪽으로 — 붓이 닿은 마디가 몸통 밖에 떠 있고, 두상 쪽으로 flowReach칸 안에 몸통이 있으면 그쪽으로 기울임(나란히 뜬 채 남지 않게)
        if (C.pullIn > 0 && WB[i] > 0.01 && bo < 0.5) {
          bn = bodyAt(AFW, ex, ey, ez);
          if (bn < 1) {
            nx = -ex; ny = ey > yCap ? yCap - ey : 0; nz = -ez; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (nl > 1e-6) {
              nx /= nl; ny /= nl; nz /= nl; var found = false, hq;
              for (hq = 1; hq <= reach + 1; hq++) if (bodyAt(AFW, ex + nx * AFW.fc * hq, ey + ny * AFW.fc * hq, ez + nz * AFW.fc * hq) >= 0.5) { found = true; break; }
              if (found) {
                var pk2 = C.pullIn * WB[i] * (1 - bn);
                tx = (ex - qx) / len + nx * pk2; ty = (ey - qy) / len + ny * pk2; tz = (ez - qz) / len + nz * pk2; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; S._pi++; }
              }
            }
          }
        }
      }
      if (HD && len > 1e-9) {
        o = g[i]; yy = o.y - hcy;
        fl = Math.sqrt(o.x * o.x / a2 + yy * yy / b2 + o.z * o.z / c2); if (fl > lift) fl = lift;
        yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
        if (ee < fl - 1e-6) {
          // 이 마디가 두상 속으로 들어감 → 발(직전 점)에서 안쪽 성분을 빼고 면을 타고 눕힘(볼록한 면이라 면을 따라 한 걸음 가면 밖)
          yy = qy - hcy; nx = qx / a2; ny = yy / b2; nz = qz / c2; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nl > 1e-9) {
            nx /= nl; ny /= nl; nz /= nl; dn = ax * nx + ay * ny + az * nz;
            if (dn < 0) {
              tx = ax - dn * nx; ty = ay - dn * ny; tz = az - dn * nz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (sl < 0.35) {                                             // 두피에 거의 수직으로 누른 방향(눕힐 쪽이 없음) → 이 마디는 빗기 전 방향으로
                q0 = g[i - 1]; tx = (o.x - q0.x) / len; ty = (o.y - q0.y) / len; tz = (o.z - q0.z) / len;
                dn = tx * nx + ty * ny + tz * nz; if (dn < 0) { tx -= dn * nx; ty -= dn * ny; tz -= dn * nz; }
                sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              }
              if (sl > 1e-3) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
            }
          }
          // 안전망: 그래도 속이면 겉면으로 밀어내고 마디 길이를 다시 맞춤
          yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
          if (ee < fl - 1e-6 && ee > 1e-9) {
            kk = fl / ee; ex *= kk; ey = hcy + yy * kk; ez *= kk;
            tx = ex - qx; ty = ey - qy; tz = ez - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
          }
          S._pu++;
        }
      }
      pt = { x: ex, y: ey, z: ez };
      if (NK && len > 1e-9) {                                              // 목 기둥 — 빗기 전에 밖에 있던 점만 · 밀어낸 뒤 마디 길이를 다시 맞춤
        try {
          r = NK(pt);
          if (r && r !== pt && NK(g[i]) === g[i]) {
            tx = r.x - qx; ty = r.y - qy; tz = r.z - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { pt = { x: qx + tx / sl * len, y: qy + ty / sl * len, z: qz + tz / sl * len }; S._nk++; }
          }
        } catch (e4) {}
      }
      qx = pt.x; qy = pt.y; qz = pt.z;
      out[i] = pt;
    }
    S._t++;
    try { out._pre = g._pre || g; } catch (e2) {}                         // 빗기 전 자리(붓은 여기에 칠함 — 아래 buildPick 참고)
    return out;
  }
  C._apply = applySamples;
  /* 진단용: 그 자리 칸에 칠해진 목표 방향 × 세기(없으면 null) */
  C._cell = function (x, y, z) {
    var f = syncField(); if (!f) return null;
    var k = f.map.get((Math.floor(x / C.cell) + OFF) + SPAN * ((Math.floor(y / C.cell) + OFF) + SPAN * (Math.floor(z / C.cell) + OFF)));
    return k === undefined ? null : [f.V[k * 3], f.V[k * 3 + 1], f.V[k * 3 + 2]];
  };

  /* 진단용: 그 자리가 몸통 겉면에서 얼마나 떠 있나(모델 단위 · 몸통 속 0 · 거리장이 없으면 null) */
  C._dist = function (x, y, z) { return (flowMemo && flowMemo.flow && flowMemo.flow.DF) ? distAt(flowMemo.flow.DF, x, y, z) : null; };

  /* ────────────────────────────────────────────────────────────────────────
   * (2026-10-07j) 빗어 넘기기 — cur: 지금 점(정리까지 한 것) · pre: 빗기 전 점(붓은 여기에 칠함 → 방향 장도 여기서 읽음)
   *   마디마다 가닥의 큰 방향을 쓴 방향으로 돌리는 회전을 구해(세기 = 칠해진 세기 × 뿌리 잡기) 이웃끼리 한 번 고르게 한 뒤 다시 이음.
   *   몸통·잔머리를 안 가립니다(넘기기는 뭉치째 돌리는 것). 두상·목 속으로는 못 들어감.
   * ────────────────────────────────────────────────────────────────────── */
  function applySweep(cur, pre) {
    if (!C.enabled || !C.sweep || !C.sweeps.length || !cur || cur.length < 2) return cur;
    var f = syncSweep(); if (!f || !f.n) return cur;
    var n = cur.length, i, p, q0, mn = f.mn, mx = f.mx, any = false;
    if (!pre || pre.length !== n) pre = cur;
    for (i = 0; i < n; i++) { p = pre[i]; if (p.x >= mn[0] && p.x <= mx[0] && p.y >= mn[1] && p.y <= mx[1] && p.z >= mn[2] && p.z <= mx[2]) { any = true; break; } }
    if (!any) return cur;
    if (buf.length < n * 4) { buf = new Float64Array(n * 4 + 128); rbuf = new Float64Array(n * 3 + 96); wbuf = new Float64Array(n + 32); pbuf = new Float64Array(n + 32); kbuf = new Int32Array(n + 32); }
    var cell = C.cell, map = f.map, V = f.V, last = n - 1, U = buf, R = rbuf, changed = false, lo = n, hi = 0, L = 0;
    var px = cur[0].x, py = cur[0].y, pz = cur[0].z, sx, sy, sz, sl, len;
    for (i = 1; i < n; i++) {
      p = cur[i]; sx = p.x - px; sy = p.y - py; sz = p.z - pz; len = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (len > 1e-9) { U[i * 4] = sx / len; U[i * 4 + 1] = sy / len; U[i * 4 + 2] = sz / len; } else { U[i * 4] = 0; U[i * 4 + 1] = -1; U[i * 4 + 2] = 0; }
      U[i * 4 + 3] = len; L += len; px = p.x; py = p.y; pz = p.z;
    }
    var hw = L > 0 ? Math.round(C.flowSmooth / (L / last)) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16;
    var HD = headShape(), a2 = 1, b2 = 1, c2 = 1, hcy = 0, wn = C.wrapNear, wf = Math.max(C.wrapFar, wn + 1e-3), grip = C.sweepGrip, tol = Math.max(0, C.sweepTol) * DEG;
    if (HD) { a2 = HD.a2; b2 = HD.b2; c2 = HD.c2; hcy = HD.cy; }
    var a, b, c, k, vx, vy, vz, vl, w, t, tx, ty, tz, A, B, dot, th, ang, cx, cy, cz, cl, nx, ny, nz, nl, dn, ee, yy, kk, mxx, myy, mzz;
    for (i = 1; i < n; i++) {
      R[i * 3] = 0; R[i * 3 + 1] = 0; R[i * 3 + 2] = 0;
      if (!(U[i * 4 + 3] > 1e-9)) continue;
      p = pre[i]; q0 = pre[i - 1];
      a = Math.floor((p.x + q0.x) * 0.5 / cell) + OFF; b = Math.floor((p.y + q0.y) * 0.5 / cell) + OFF; c = Math.floor((p.z + q0.z) * 0.5 / cell) + OFF;
      if (a < 0 || b < 0 || c < 0 || a >= SPAN || b >= SPAN || c >= SPAN) continue;
      k = map.get(a + SPAN * (b + SPAN * c)); if (k === undefined) continue;
      k *= 3; vx = V[k]; vy = V[k + 1]; vz = V[k + 2]; vl = Math.sqrt(vx * vx + vy * vy + vz * vz); w = vl;
      if (!(w > 0.01)) continue;
      t = i / last; if (grip > 0 && t < grip) w *= t / grip;
      if (w > 1) w = 1;
      tx = vx / vl; ty = vy / vl; tz = vz / vl;
      p = cur[i]; q0 = cur[i - 1];
      if (HD && C.sweepWrap) {                                            // 두피 가까이: 쓴 방향에서 두상 면에 수직인 몫을 뺌(면을 타고 넘어가게)
        mxx = (p.x + q0.x) * 0.5; myy = (p.y + q0.y) * 0.5 - hcy; mzz = (p.z + q0.z) * 0.5;
        ee = Math.sqrt(mxx * mxx / a2 + myy * myy / b2 + mzz * mzz / c2);
        if (ee < wf) {
          nx = mxx / a2; ny = myy / b2; nz = mzz / c2; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nl > 1e-9) {
            nx /= nl; ny /= nl; nz /= nl; kk = ee <= wn ? 1 : (wf - ee) / (wf - wn); dn = (tx * nx + ty * ny + tz * nz) * kk;
            sx = tx - dn * nx; sy = ty - dn * ny; sz = tz - dn * nz; sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
            if (sl < 0.2) continue;                                       // 두피에 거의 수직으로 쓴 것 — 눕힐 쪽이 없음
            tx = sx / sl; ty = sy / sl; tz = sz / sl;
          }
        }
      }
      A = cur[i - 1 - hw < 0 ? 0 : i - 1 - hw]; B = cur[i + hw > last ? last : i + hw];
      sx = B.x - A.x; sy = B.y - A.y; sz = B.z - A.z; sl = Math.sqrt(sx * sx + sy * sy + sz * sz);
      if (sl > 1e-9) { sx /= sl; sy /= sl; sz /= sl; } else { sx = U[i * 4]; sy = U[i * 4 + 1]; sz = U[i * 4 + 2]; }
      dot = sx * tx + sy * ty + sz * tz; if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
      th = Math.acos(dot); if (th <= tol) continue;
      ang = th * w; if (ang < 0.003) continue;
      cx = sy * tz - sz * ty; cy = sz * tx - sx * tz; cz = sx * ty - sy * tx; cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (cl < 1e-4) {                                                     // 거의 정반대 — 두상 바깥을 지나 돌게(두상이 없으면 아무 수직축)
        nx = p.x; ny = HD ? p.y - hcy : 0; nz = p.z;
        cx = sy * nz - sz * ny; cy = sz * nx - sx * nz; cz = sx * ny - sy * nx; cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
        if (cl < 1e-6) { if (Math.abs(sx) < 0.9) { cx = 0; cy = sz; cz = -sy; } else { cx = -sz; cy = 0; cz = sx; } cl = Math.sqrt(cx * cx + cy * cy + cz * cz); }
        if (!(cl > 1e-9)) continue;
      }
      ang /= cl; R[i * 3] = cx * ang; R[i * 3 + 1] = cy * ang; R[i * 3 + 2] = cz * ang;
      changed = true; if (i < lo) lo = i; if (i > hi) hi = i;
    }
    if (!changed) return cur;
    var s0 = Math.max(1, lo - 1), s1 = Math.min(last, hi + 1), o0x, o0y, o0z, c0x, c0y, c0z, j;
    j = (s0 > 1 ? s0 - 1 : s0) * 3; o0x = R[j]; o0y = R[j + 1]; o0z = R[j + 2];
    for (i = s0; i <= s1; i++) {                                           // 회전을 이웃 마디끼리 한 번 고르게(잔물결 제거 · 컬은 그대로)
      j = i * 3; c0x = R[j]; c0y = R[j + 1]; c0z = R[j + 2];
      if (i < last) { R[j] = (o0x + 2 * c0x + R[j + 3]) * 0.25; R[j + 1] = (o0y + 2 * c0y + R[j + 4]) * 0.25; R[j + 2] = (o0z + 2 * c0z + R[j + 5]) * 0.25; }
      else { R[j] = (o0x + 3 * c0x) * 0.25; R[j + 1] = (o0y + 3 * c0y) * 0.25; R[j + 2] = (o0z + 3 * c0z) * 0.25; }
      o0x = c0x; o0y = c0y; o0z = c0z;
    }
    var out = new Array(n), CH = (C.collide && HD) ? HD : null, NK = null, lift = C.headLift > 0 ? C.headLift : 1.02;
    var ax, ay, az, kx, ky, kz, cs, sn, kd, ex, ey, ez, fl, o, pt, r;
    if (CH) { try { NK = (W.REGROW && typeof W.REGROW.neckPush === 'function') ? W.REGROW.neckPush : null; } catch (e3) { NK = null; } }
    for (i = 0; i < s0; i++) out[i] = cur[i];
    var qx = cur[s0 - 1].x, qy = cur[s0 - 1].y, qz = cur[s0 - 1].z;
    for (i = s0; i < n; i++) {
      ax = U[i * 4]; ay = U[i * 4 + 1]; az = U[i * 4 + 2]; len = U[i * 4 + 3];
      if (i <= s1) {
        kx = R[i * 3]; ky = R[i * 3 + 1]; kz = R[i * 3 + 2]; ang = Math.sqrt(kx * kx + ky * ky + kz * kz);
        if (ang > 1e-5) {
          kx /= ang; ky /= ang; kz /= ang; cs = Math.cos(ang); sn = Math.sin(ang); kd = (kx * ax + ky * ay + kz * az) * (1 - cs);
          tx = ax * cs + (ky * az - kz * ay) * sn + kx * kd; ty = ay * cs + (kz * ax - kx * az) * sn + ky * kd; tz = az * cs + (kx * ay - ky * ax) * sn + kz * kd;
          ax = tx; ay = ty; az = tz;
        }
      }
      ex = qx + ax * len; ey = qy + ay * len; ez = qz + az * len;
      if (CH && len > 1e-9) {                                              // 두상 속으로는 못 들어감 — 넘기기 전부터 안쪽이던 점(뿌리 등)은 그 깊이까지만
        o = cur[i]; yy = o.y - hcy;
        fl = Math.sqrt(o.x * o.x / a2 + yy * yy / b2 + o.z * o.z / c2); if (fl > lift) fl = lift;
        yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
        if (ee < fl - 1e-6) {
          yy = qy - hcy; nx = qx / a2; ny = yy / b2; nz = qz / c2; nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nl > 1e-9) {
            nx /= nl; ny /= nl; nz /= nl; dn = ax * nx + ay * ny + az * nz;
            if (dn < 0) {
              tx = ax - dn * nx; ty = ay - dn * ny; tz = az - dn * nz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
              if (sl > 1e-3) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
            }
          }
          yy = ey - hcy; ee = Math.sqrt(ex * ex / a2 + yy * yy / b2 + ez * ez / c2);
          if (ee < fl - 1e-6 && ee > 1e-9) {
            kk = fl / ee; ex *= kk; ey = hcy + yy * kk; ez *= kk;
            tx = ex - qx; ty = ey - qy; tz = ez - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) { ex = qx + tx / sl * len; ey = qy + ty / sl * len; ez = qz + tz / sl * len; }
          }
          S._swp++;
        }
      }
      pt = { x: ex, y: ey, z: ez };
      if (NK && len > 1e-9) {
        try {
          r = NK(pt);
          if (r && r !== pt && NK(cur[i]) === cur[i]) {
            tx = r.x - qx; ty = r.y - qy; tz = r.z - qz; sl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (sl > 1e-9) pt = { x: qx + tx / sl * len, y: qy + ty / sl * len, z: qz + tz / sl * len };
          }
        } catch (e4) {}
      }
      qx = pt.x; qy = pt.y; qz = pt.z; out[i] = pt;
    }
    S._sw++;
    try { out._pre = cur._pre || pre; } catch (e2) {}
    return out;
  }
  C._sweep = applySweep;

  var prevComb = W.combStrand3D;
  W.combStrand3D = function (g) {
    var r = typeof prevComb === 'function' ? prevComb.apply(this, arguments) : g;
    if (!C.samples.length && !C.sweeps.length) return r;
    var o = r;
    if (C.samples.length) { try { o = applySamples(r); } catch (e) { S.err = String(e && e.message || e); o = r; } }
    if (C.sweeps.length) { try { o = applySweep(o, r); } catch (e) { S.err = String(e && e.message || e); } }      // (j) 정리 다음에 넘기기 — 방향 장은 빗기 전 자리(r)에서 읽음
    return o;
  };
  /* 머리 모델이 바뀌면 빗질을 지움(다른 사진 · 마네킹 켬/끔 · 다시 기르기) */
  function checkModel() {
    var m = null; try { m = state.hair3Dneutral; } catch (e) {}
    if (m !== modelRef) { modelRef = m; if (C.samples.length || C.sweeps.length) { C.samples.length = 0; C.sweeps.length = 0; ver++; epoch++; syncBtn(); } }
  }
  var origCA = W.computeAdjustedHair3DStrands;
  if (typeof origCA === 'function') W.computeAdjustedHair3DStrands = function () {
    try { checkModel(); S._t = 0; S._pu = 0; S._nk = 0; S._an = 0; S._pi = 0; S._fl = 0; S._up = 0; S._cl = 0; S._to = S._ts = S._ta = S._tr = S._tf = S._tk = 0; S._sw = 0; S._swp = 0; } catch (e) {}
    var t0 = now(), out = origCA.apply(this, arguments);
    try {                                                                 // 빗질이 있는데 머리 모양(길이·컬 등)이 바뀌었으면 결을 다시 읽어 둠(전체 목록을 만든 호출에서만)
      if (C.grain && C.samples.length && out && out.length && !arguments[0] && !(arguments[1] > 1) && modelRef) {
        var fmB = flowMemo; flowGrid(out, Math.max(1, Math.ceil(out.length / C.pickStrands)), modelRef);
        if (fmB && fmB !== flowMemo && typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump();      // 방금 목록은 옛 결로 만든 것 → 다음 호출에서 새로
      }
    } catch (eF) {}
    if (S._sw > 0) { S.swept = S._sw; S.sweptPush = S._swp; if (!(S._t > 0)) S.ms = now() - t0; } else if (!C.sweeps.length) { S.swept = 0; S.sweptPush = 0; }
    if (S._t > 0 || S._tk > 0) { S.touched = S._t; S.ms = now() - t0; S.pushed = S._pu; S.neck = S._nk; S.anch = S._an; S.pin = S._pi; S.fly = S._fl; S.up = S._up; S.clamp = S._cl; S.tOwn = S._to; S.tSide = S._ts; S.tAll = S._ta; S.tReach = S._tr; S.tFinger = S._tf; S.tSkip = S._tk; }          // 캐시에서 나온 호출은 세지 않음
    return out;
  };
  // 서명 — 빗질이 바뀌면 미리 만든 헤어도 다시
  var origFS = W.adjFilterSig;
  if (typeof origFS === 'function') W.adjFilterSig = function () { return origFS.apply(this, arguments) + '|cb' + ver; };
  function redraw() {
    try { if (typeof ADJ_CACHE !== 'undefined' && ADJ_CACHE.bump) ADJ_CACHE.bump(); } catch (e) {}
    try { if (scr() === 'adjust' && typeof renderAdjustFrame === 'function') renderAdjustFrame(); } catch (e) {}
  }
  C.refresh = function () { ver++; epoch++; redraw(); syncBtn(); };
  C.clear = function () { if (!C.samples.length && !C.sweeps.length) return; C.samples.length = 0; C.sweeps.length = 0; ver++; epoch++; S.strokes = 0; S.sweepStrokes = 0; redraw(); syncBtn(); };
  C.clearSweeps = function () { if (!C.sweeps.length) return; C.sweeps.length = 0; ver++; epoch++; S.sweepStrokes = 0; redraw(); syncBtn(); };
  C.undo = function () {                    // 정리·넘기기 가운데 마지막 한 획
    var ga = C.samples.length ? C.samples[C.samples.length - 1].g : -1, gb = C.sweeps.length ? C.sweeps[C.sweeps.length - 1].g : -1;
    if (ga < 0 && gb < 0) return;
    var A = gb > ga ? C.sweeps : C.samples, g = Math.max(ga, gb);
    while (A.length && A[A.length - 1].g === g) A.pop();
    ver++; epoch++; redraw(); syncBtn();
  };

  /* ────────────────────────────────────────────────────────────────────────
   * ② 붓 자리 찾기 — 화면의 손가락 아래에서 카메라에 가장 가까운 가닥 점
   * ────────────────────────────────────────────────────────────────────── */
  function hairObject() {
    var m = m3(), found = null; if (!m) return null;
    m.headGroup.traverse(function (o) { if (!found && (o.isLineSegments || o.isLine) && o.geometry) found = o; });
    return found || m.headGroup;
  }
  /* ── 결 격자 ── 빗기 전 가닥들의 "큰 방향"(앞뒤 flowSmooth를 이은 현)을 자리(flowCell 칸)마다 가닥당 한 번씩 더해 둠.
     빗기 전 자리로 만들기 때문에 빗질을 해도 안 바뀝니다 → 머리 모양(모델·길이·컬)이 그대로면 다시 만들지 않고 씀. */
  var flowMemo = null;
  /* (2026-10-05g) 거리 변환(앞·뒤 두 번 훑기 · 이웃 26칸): 값이 0인 칸(몸통)까지의 거리를 칸마다 구함. 격자 가장자리 한 겹은 건드리지 않음(늘 빈 칸 — 여유 한 칸을 두고 만든 격자) */
  function chamfer(D, mx, my, mz, h) {
    var w1 = h, w2 = h * 1.41421356, w3 = h * 1.7320508, sxy = mx * my, pass, sg, ia, ib, ic, o, v, t, r0, r1, r2;
    for (pass = 0; pass < 2; pass++) {
      sg = pass ? -1 : 1;
      for (ic = pass ? mz - 2 : 1; ic >= 1 && ic <= mz - 2; ic += sg) for (ib = pass ? my - 2 : 1; ib >= 1 && ib <= my - 2; ib += sg) {
        r0 = mx * (ib + my * ic); r1 = r0 - sg * sxy; r2 = r0 - sg * mx;
        for (ia = pass ? mx - 2 : 1; ia >= 1 && ia <= mx - 2; ia += sg) {
          o = r0 + ia; v = D[o]; if (v === 0) continue;
          // 이미 훑은 쪽 13칸: 앞 층 9칸 + 같은 층 앞 줄 3칸 + 같은 줄 앞 1칸
          o = r1 + ia;
          t = D[o] + w1; if (t < v) v = t;
          t = D[o - 1] + w2; if (t < v) v = t; t = D[o + 1] + w2; if (t < v) v = t; t = D[o - mx] + w2; if (t < v) v = t; t = D[o + mx] + w2; if (t < v) v = t;
          t = D[o - mx - 1] + w3; if (t < v) v = t; t = D[o - mx + 1] + w3; if (t < v) v = t; t = D[o + mx - 1] + w3; if (t < v) v = t; t = D[o + mx + 1] + w3; if (t < v) v = t;
          o = r2 + ia;
          t = D[o] + w1; if (t < v) v = t; t = D[o - 1] + w2; if (t < v) v = t; t = D[o + 1] + w2; if (t < v) v = t;
          t = D[r0 + ia - sg] + w1; if (t < v) v = t;
          D[r0 + ia] = v;
        }
      }
    }
  }
  function flowGrid(list, stepS, model) {
    var t0 = now(), i, k, pp, q, np, acc = 0, fpStep = Math.max(1, Math.floor(list.length / 97));
    for (i = 0; i < list.length; i += fpStep) {                                    // 지문: 가닥 몇 개의 끝점(빗기 전)과 점 수
      pp = list[i].pts; if (!pp || !pp.length) continue; if (pp._pre && pp._pre.length === pp.length) pp = pp._pre;
      q = pp[pp.length - 1]; acc += q.x * 1.3 + q.y * 2.1 + q.z * 3.7 + pp.length;
    }
    var fp = list.length + ':' + stepS + ':' + acc.toFixed(4) + ':' + C.flowCell + ':' + C.flowSmooth + ':' + C.flowMin + ':' + C.flowNear + ':' + C.flowDense + ':' + (C.surf ? C.surfThr + '/' + C.surfNbr + '/' + C.surfCore + '/' + C.surfHead + '/' + C.flyFrom + '/' + C.flyFull : 'x');
    if (flowMemo && flowMemo.fp === fp && flowMemo.model === model) return flowMemo.flow;
    if (flowMemo && flowMemo.flow) { ver++; S.flowRebuilt = (S.flowRebuilt || 0) + 1; }      // 머리 모양이 바뀌어 결을 다시 읽음 → 빗질 결과도 다음에 다시 계산
    var fc = C.flowCell > 0.01 ? C.flowCell : 0.07, b0x = Infinity, b0y = Infinity, b0z = Infinity, b1x = -Infinity, b1y = -Infinity, b1z = -Infinity, used = 0;
    for (i = 0; i < list.length; i += stepS) {
      pp = list[i].pts; if (!pp) continue; if (pp._pre && pp._pre.length === pp.length) pp = pp._pre;
      used++;
      for (k = 0; k < pp.length; k += 2) { q = pp[k]; if (q.x < b0x) b0x = q.x; if (q.x > b1x) b1x = q.x; if (q.y < b0y) b0y = q.y; if (q.y > b1y) b1y = q.y; if (q.z < b0z) b0z = q.z; if (q.z > b1z) b1z = q.z; }
    }
    var flow = null;
    if (b1x >= b0x && isFinite(b0x + b1x + b0y + b1y + b0z + b1z)) {
      var cyF = isFinite(model.CY) ? model.CY : 0, lim = 64 * fc;                   // 멀리 튄 점 하나 때문에 격자가 커지지 않게(두상 가운데에서 ±64칸)
      b0x = Math.max(b0x, -lim) - fc; b1x = Math.min(b1x, lim) + fc; b0y = Math.max(b0y, cyF - lim) - fc; b1y = Math.min(b1y, cyF + lim) + fc; b0z = Math.max(b0z, -lim) - fc; b1z = Math.min(b1z, lim) + fc;
      var nx = Math.floor((b1x - b0x) / fc) + 1, ny = Math.floor((b1y - b0y) / fc) + 1, nz = Math.floor((b1z - b0z) / fc) + 1, nn = nx * ny * nz;
      if (nx > 0 && ny > 0 && nz > 0) {
        var GX = new Float32Array(nn), GY = new Float32Array(nn), GZ = new Float32Array(nn), GN = new Uint16Array(nn), GL = new Int32Array(nn).fill(-1), inv = 1 / fc;
        var hw, arc, na, u0, u1, qa, qb, fx, fy, fz, fl, gi, gj, gk, gc, stride;
        for (i = 0; i < list.length; i += stepS) {
          pp = list[i].pts; if (!pp) continue; if (pp._pre && pp._pre.length === pp.length) pp = pp._pre;
          np = pp.length; if (np < 2) continue;
          arc = 0; na = np - 1 < 8 ? np - 1 : 8; u0 = pp[0];                        // 마디 길이는 앞쪽 몇 마디로 어림
          for (k = 1; k <= na; k++) { u1 = pp[k]; arc += Math.sqrt((u1.x - u0.x) * (u1.x - u0.x) + (u1.y - u0.y) * (u1.y - u0.y) + (u1.z - u0.z) * (u1.z - u0.z)); u0 = u1; }
          arc /= na;
          hw = arc > 0 ? Math.round(C.flowSmooth / arc) : 1; if (!(hw >= 1)) hw = 1; else if (hw > 16) hw = 16;
          stride = arc > 0 ? Math.floor(fc * 0.8 / arc) : 1; if (!(stride >= 1)) stride = 1; else if (stride > 6) stride = 6;   // 칸보다 촘촘히 찍을 필요 없음
          for (k = 0; k < np; k += stride) {
            q = pp[k];
            gi = (q.x - b0x) * inv | 0; gj = (q.y - b0y) * inv | 0; gk = (q.z - b0z) * inv | 0;
            if (!(q.x >= b0x && q.y >= b0y && q.z >= b0z && gi < nx && gj < ny && gk < nz)) continue;
            gc = gi + nx * (gj + ny * gk); if (GL[gc] === i) continue;              // 가닥당·칸당 한 번
            qa = pp[k - hw < 0 ? 0 : k - hw]; qb = pp[k + hw >= np ? np - 1 : k + hw];
            fx = qb.x - qa.x; fy = qb.y - qa.y; fz = qb.z - qa.z; fl = Math.sqrt(fx * fx + fy * fy + fz * fz); if (!(fl > 1e-9)) continue;
            GL[gc] = i; if (GN[gc] < 65535) GN[gc]++; GX[gc] += fx / fl; GY[gc] += fy / fl; GZ[gc] += fz / fl;
          }
        }
        // 몸통 머리의 보통 밀도 = 가닥 점이 가장 많이 사는 칸의 가닥 수(칸을 가닥 수로 가중한 중앙값) — 겉으로 뜬 잔머리 칸(1~몇 가닥)에 끌려가지 않음
        var gv = [], gs = 0, ga = 0, ref = 1; for (k = 0; k < nn; k++) if (GN[k]) { gv.push(GN[k]); gs += GN[k]; }
        gv.sort(function (x, y) { return x - y; });
        for (k = 0; k < gv.length; k++) { ga += gv[k]; if (ga * 2 >= gs) { ref = gv[k]; break; } }
        var mn = Math.max(6, Math.round(C.flowMin * Math.min(1, used / 8000)));
        var GM = new Float32Array(nn); for (k = 0; k < nn; k++) if (GN[k]) GM[k] = Math.sqrt(GX[k] * GX[k] + GY[k] * GY[k] + GZ[k] * GZ[k]);
        // (2026-10-05f) 몸통 격자: 칸마다 이웃 3×3×3칸의 가닥 수(축마다 한 번씩 더함)
        var GA = new Float32Array(nn), GT2 = new Float32Array(nn), ia, ib, ic, oo, sm;
        for (ic = 0; ic < nz; ic++) for (ib = 0; ib < ny; ib++) for (ia = 0; ia < nx; ia++) { oo = ia + nx * (ib + ny * ic); sm = GN[oo]; if (ia > 0) sm += GN[oo - 1]; if (ia < nx - 1) sm += GN[oo + 1]; GT2[oo] = sm; }
        for (ic = 0; ic < nz; ic++) for (ib = 0; ib < ny; ib++) for (ia = 0; ia < nx; ia++) { oo = ia + nx * (ib + ny * ic); sm = GT2[oo]; if (ib > 0) sm += GT2[oo - nx]; if (ib < ny - 1) sm += GT2[oo + nx]; GA[oo] = sm; }
        for (ic = 0; ic < nz; ic++) for (ib = 0; ib < ny; ib++) for (ia = 0; ia < nx; ia++) { oo = ia + nx * (ib + ny * ic); sm = GA[oo]; if (ic > 0) sm += GA[oo - nx * ny]; if (ic < nz - 1) sm += GA[oo + nx * ny]; GT2[oo] = sm; }
        var nearV = Math.max(mn, C.flowNear * ref);
        // (2026-10-05g) 몸통 겉면 거리장 — 잔칸(결 칸의 절반)마다 지나는 가닥 수를 세어 "몸통 칸"을 정하고, 칸마다 가장 가까운 몸통 칸까지의 거리를 구해 둠.
        //   예전 몸통 판정(둘레 3×3×3 결 칸 = 4cm 상자의 가닥 수)은 겉면에서 1~2cm 뜬 잔머리도 몸통으로 봐서 안 빗겼습니다.
        var DF = null;
        if (C.surf) {
          var h = fc * 0.5, hinv = 1 / h, mx = nx * 2, my = ny * 2, mz = nz * 2, mm = mx * my * mz;
          if (mm > 0 && mm <= 3e6) {
            var FN = new Uint16Array(mm), FL = new Int32Array(mm).fill(-1), sub, tq, px0, py0, pz0, sgl, fo, fx0, fy0, fz0;
            for (i = 0; i < list.length; i += stepS) {
              pp = list[i].pts; if (!pp) continue; if (pp._pre && pp._pre.length === pp.length) pp = pp._pre;
              np = pp.length;
              for (k = 0; k < np; k++) {
                q = pp[k]; sub = 0;
                if (k + 1 < np) { u1 = pp[k + 1]; px0 = u1.x - q.x; py0 = u1.y - q.y; pz0 = u1.z - q.z; sgl = Math.sqrt(px0 * px0 + py0 * py0 + pz0 * pz0); sub = Math.floor(sgl / (h * 0.9)); if (sub > 12) sub = 12; }
                for (tq = 0; tq <= sub; tq++) {                               // 마디가 잔칸보다 길면 사이도 찍음
                  fx0 = sub ? q.x + px0 * tq / (sub + 1) : q.x; fy0 = sub ? q.y + py0 * tq / (sub + 1) : q.y; fz0 = sub ? q.z + pz0 * tq / (sub + 1) : q.z;
                  gi = (fx0 - b0x) * hinv | 0; gj = (fy0 - b0y) * hinv | 0; gk = (fz0 - b0z) * hinv | 0;
                  if (!(fx0 >= b0x && fy0 >= b0y && fz0 >= b0z && gi < mx && gj < my && gk < mz)) continue;
                  fo = gi + mx * (gj + my * gk); if (FL[fo] === i) continue;      // 가닥당·칸당 한 번
                  FL[fo] = i; if (FN[fo] < 65535) FN[fo]++;
                }
              }
            }
            FL = null;
            var fv2 = [], fs2 = 0, fa2 = 0, refF = 1; for (k = 0; k < mm; k++) if (FN[k]) { fv2.push(FN[k]); fs2 += FN[k]; }
            fv2.sort(function (x, y) { return x - y; });
            for (k = 0; k < fv2.length; k++) { fa2 += fv2[k]; if (fa2 * 2 >= fs2) { refF = fv2[k]; break; } }
            var thrF = Math.max(2, Math.round(C.surfThr * refF)), BM = new Uint8Array(mm), sxy = mx * my, bodyCells = 0, nbNeed = Math.max(0, C.surfNbr | 0), cnt, da, db, dc;
            // 기준 밀도는 자리마다: 둘레 ±2칸(≈ 3.3cm 상자)에서 "가닥 점이 보통 겪는 밀도"(Σ수²/Σ수) × surfThr.
            //   머리 전체의 한 값으로 자르면 정수리처럼 층이 얇은 자리의 겉층이 잔머리로 잡히고(빗으면 몸통이 움직임),
            //   낮춰 잡으면 숱 많은 자리 곁에 둘씩 뜬 가닥이 몸통으로 잡힙니다(빗어도 안 눕음) — 둘 다 합성 테스트에서 확인.
            var v1, v2, cF, a0, a1, b0, b1, c0, c1, ro;
            for (ic = 0; ic < mz; ic++) for (ib = 0; ib < my; ib++) for (ia = 0; ia < mx; ia++) {
              oo = ia + mx * (ib + my * ic); if (FN[oo] < 2) continue;              // 후보 칸에서만 셈
              a0 = ia > 2 ? ia - 2 : 0; a1 = ia < mx - 3 ? ia + 2 : mx - 1; b0 = ib > 2 ? ib - 2 : 0; b1 = ib < my - 3 ? ib + 2 : my - 1; c0 = ic > 2 ? ic - 2 : 0; c1 = ic < mz - 3 ? ic + 2 : mz - 1; v1 = 0; v2 = 0;
              for (dc = c0; dc <= c1; dc++) for (db = b0; db <= b1; db++) { ro = mx * (db + my * dc); for (da = a0; da <= a1; da++) { cF = FN[ro + da]; v1 += cF; v2 += cF * cF; } }
              if (FN[oo] * v1 >= C.surfThr * v2) BM[oo] = 1;
            }
            // (2026-10-05i) 몸통 = "두꺼운 속이 있는 덩어리"와 이어진 칸.
            //   ① 후보: 위 기준을 넘고 둘레 26칸 중 surfNbr칸 이상이 같이 넘는 칸(한 줄로 지나가는 잔머리 묶음은 이웃이 2~4칸뿐이라 빠짐)
            //   ② 속: 둘레에 surfCore칸 이상이 후보인 칸. 속에서 출발해 후보를 따라(2칸 틈은 건너) 번져 닿는 칸이 몸통.
            //   ③ 안 닿은 후보 가운데 두상 겉면 가까이(타원체 surfHead배 안) 붙어 있는 칸도 몸통(이마·옆머리의 얇은 한 겹).
            //   h에서는 "빽빽한 몸통에서 2cm 넘게 떨어진 자리에 2가닥이 같이 지나가면 몸통"이라 했는데, 그러면 멀리 뜬 잔머리 묶음이 몸통이 되어 빗어도 그대로였습니다(사용자: "그래도 뜨는 건 있네").
            var DD = new Float32Array(mm), BIG = 1e6, NBc = new Uint8Array(mm), nCore = Math.max(1, C.surfCore | 0), stack = [], sp, o2, HDs = headShape(), ev, hN = C.surfHead > 1 ? C.surfHead : 1.15, yv, xv, zv;
            for (ic = 0; ic < mz; ic++) for (ib = 0; ib < my; ib++) for (ia = 0; ia < mx; ia++) {
              oo = ia + mx * (ib + my * ic); DD[oo] = BIG; if (!BM[oo]) continue;
              cnt = 0;
              for (dc = -1; dc <= 1; dc++) { if (ic + dc < 0 || ic + dc >= mz) continue;
                for (db = -1; db <= 1; db++) { if (ib + db < 0 || ib + db >= my) continue;
                  for (da = -1; da <= 1; da++) { if (ia + da < 0 || ia + da >= mx || (!da && !db && !dc)) continue; if (BM[oo + da + mx * db + sxy * dc]) cnt++; } } }
              NBc[oo] = cnt;
            }
            for (k = 0; k < mm; k++) if (BM[k] && NBc[k] >= nCore) { BM[k] = 3; stack.push(k); }      // 속
            while (stack.length) {
              oo = stack.pop(); ia = oo % mx; ib = ((oo - ia) / mx) % my; ic = (oo - ia - mx * ib) / sxy;
              for (dc = -2; dc <= 2; dc++) { if (ic + dc < 0 || ic + dc >= mz) continue;
                for (db = -2; db <= 2; db++) { if (ib + db < 0 || ib + db >= my) continue;
                  for (da = -2; da <= 2; da++) { if (ia + da < 0 || ia + da >= mx) continue;
                    o2 = oo + da + mx * db + sxy * dc; if (BM[o2] === 1 && NBc[o2] >= nbNeed) { BM[o2] = 3; stack.push(o2); } } } }
            }
            for (ic = 0; ic < mz; ic++) for (ib = 0; ib < my; ib++) for (ia = 0; ia < mx; ia++) {
              oo = ia + mx * (ib + my * ic); if (!BM[oo]) continue;
              if (BM[oo] !== 3) {
                if (!HDs) { if (NBc[oo] < nbNeed) continue; }                       // 두상 모양을 모르면 후보는 다 몸통(예전처럼)
                else {
                  if (NBc[oo] < 2) continue;
                  xv = b0x + (ia + 0.5) * h; yv = b0y + (ib + 0.5) * h - HDs.cy; zv = b0z + (ic + 0.5) * h; ev = Math.sqrt(xv * xv / HDs.a2 + yv * yv / HDs.b2 + zv * zv / HDs.c2);
                  if (!(ev <= hN)) continue;
                }
              }
              DD[oo] = 0; bodyCells++;
            }
            NBc = null;
            if (bodyCells) {
              chamfer(DD, mx, my, mz, h);
              var farD = 8 * h; for (k = 0; k < mm; k++) if (DD[k] > farD) DD[k] = farD;
              DF = { D: DD, h: h, inv: hinv, x0: b0x, y0: b0y, z0: b0z, mx: mx, my: my, mz: mz, far: farD - 1e-6, d0: Math.max(0, C.flyFrom), d1: Math.max(C.flyFrom + 1e-3, C.flyFull), ref: refF, thr: thrF, cells: bodyCells };
            }
          }
        }
        flow = { DF: DF, fc: fc, inv: inv, x0: b0x, y0: b0y, z0: b0z, nx: nx, ny: ny, nz: nz, GX: GX, GY: GY, GZ: GZ, GN: GN, GM: GM, GA: GT2, bLo: nearV, bHi: Math.max(nearV * 1.5, C.bodyFull * ref), ref: ref, cells: gv.length, dense: Math.max(2, C.flowDense * ref), near: nearV };
      }
    }
    flowMemo = { fp: fp, model: model, flow: flow };
    S.flowRef = flow ? flow.ref : 0; S.flowCells = flow ? flow.cells : 0; S.surfRef = flow && flow.DF ? flow.DF.ref : 0; S.surfCells = flow && flow.DF ? flow.DF.cells : 0; S.flowMs = now() - t0;
    return flow;
  }
  /* (2026-10-05i) 점마다 "몸통 겉면에서 떠 있나" 표시 — 빗기 전 자리로 재므로 머리 모양(결 격자)이 그대로면 다시 안 잼.
     예전(h)에는 붓을 댈 때마다 건너뛰는 가닥의 모든 점을 두 번씩 쟀습니다(폰 실측: 붓 자리 찾기 준비 32 → 464ms). */
  var floatMemo = null;
  function floatFlags(list, DF) {
    var fm = flowMemo, i, k, pp, tot = 0, off = new Int32Array(list.length + 1);
    for (i = 0; i < list.length; i++) { off[i] = tot; pp = list[i].pts; if (pp) tot += pp.length; }
    off[list.length] = tot;
    if (floatMemo && floatMemo.fm === fm && floatMemo.n === list.length && floatMemo.tot === tot) return floatMemo;
    var F = new Uint8Array(tot), o = 0, d0 = DF.d0, cnt = 0;
    for (i = 0; i < list.length; i++) {
      pp = list[i].pts; if (!pp) continue; if (pp._pre && pp._pre.length === pp.length) pp = pp._pre;
      for (k = 0; k < pp.length; k++, o++) if (distAt(DF, pp[k].x, pp[k].y, pp[k].z) > d0) { F[o] = 1; cnt++; }
    }
    floatMemo = { fm: fm, n: list.length, tot: tot, F: F, off: off, cnt: cnt };
    return floatMemo;
  }
  var pick = null;
  function buildPick() {
    var m = m3(); if (!m) return null;
    var t0 = now(), model = null; try { model = state.hair3Dneutral; } catch (e) {}
    if (!model || !model.strands || !model.strands.length) return null;
    var list = null;
    try { list = computeAdjustedHair3DStrands(); } catch (e) { list = null; }      // 화면에 그린 것과 같은 목록(이미 계산돼 있음)
    if (!list || !list.length) return null;
    var stepS = Math.max(1, Math.ceil(list.length / C.pickStrands));
    var obj = hairObject(), cam = m.camera, cv = m.renderer.domElement, rect = cv.getBoundingClientRect();
    m.scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
    var M = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(obj.matrixWorld), e = M.elements;
    if (C.grain) { try { flowGrid(list, stepS, model); } catch (eF) { S.err = String(eF && eF.message || eF); } }      // (2026-10-05e) 결 격자 준비(머리 모양이 그대로면 다시 안 만듦)
    // (2026-10-05g) 가닥이 pickStrands보다 많으면 건너뛰며 쓰는데(조정 화면 9,999가닥 → 둘 중 하나), 건너뛴 가닥이 혼자 뜬 잔머리면 붓에 아예 안 걸렸습니다
    //   → 건너뛰는 가닥도 "몸통 겉면에서 뜬 점"은 전부 붓 자리 찾기에 넣습니다.
    var DFp = (C.surf && C.grain && flowMemo && flowMemo.flow && flowMemo.flow.DF) ? flowMemo.flow.DF : null, FM = null, total = 0, i, k, extra = 0, o;
    if (DFp) { try { FM = floatFlags(list, DFp); } catch (eG) { FM = null; DFp = null; S.err = String(eG && eG.message || eG); } }
    for (i = 0; i < list.length; i++) {
      if (!list[i].pts) continue;
      if (i % stepS === 0) { total += list[i].pts.length; continue; }
      if (FM) for (o = FM.off[i], k = FM.off[i + 1]; o < k; o++) total += FM.F[o];
    }
    var SX = new Float32Array(total), SY = new Float32Array(total), SW = new Float32Array(total), PX = new Float32Array(total), PY = new Float32Array(total), PZ = new Float32Array(total);
    var SI = FM ? new Int32Array(total) : null, SK = FM ? new Int32Array(total) : null, FL = FM ? new Uint8Array(total) : null;
    var cell = Math.max(8, C.pickPx), gw = Math.ceil(rect.width / cell) + 1, gh = Math.ceil(rect.height / cell) + 1, head = new Int32Array(gw * gh).fill(-1), next = new Int32Array(total), n = 0;
    for (i = 0; i < list.length; i++) {
      var pts = list[i].pts; if (!pts) continue;
      var whole = i % stepS === 0; if (!whole && !FM) continue;
      var pre = (pts._pre && pts._pre.length === pts.length) ? pts._pre : pts;      // 빗질로 옮겨지기 전 자리
      o = FM ? FM.off[i] : 0;
      for (k = 0; k < pts.length; k++) {
        if (!whole) { if (!FM.F[o + k]) continue; extra++; }                        // 건너뛰는 가닥은 뜬 점만
        var p = pts[k], w = e[3] * p.x + e[7] * p.y + e[11] * p.z + e[15];
        if (!(w > 1e-6)) continue;
        var sx = ((e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12]) / w * 0.5 + 0.5) * rect.width, sy = (1 - ((e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13]) / w * 0.5 + 0.5)) * rect.height;
        if (sx < 0 || sy < 0 || sx >= rect.width || sy >= rect.height) continue;
        var b = (sy / cell | 0) * gw + (sx / cell | 0);
        SX[n] = sx; SY[n] = sy; SW[n] = w; PX[n] = pre[k].x; PY[n] = pre[k].y; PZ[n] = pre[k].z; next[n] = head[b]; head[b] = n;
        if (FM) { SI[n] = i; SK[n] = k; FL[n] = FM.F[o + k]; }
        n++;
      }
    }
    // 화면 → 모델 방향: 카메라의 오른쪽·위 벡터를 머리 객체 좌표로
    var inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
    var right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).transformDirection(inv), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1).transformDirection(inv);
    // 두상 가운데의 깊이 — 이보다 depthMargin 넘게 뒤에 있는 점은 반대편 머리
    var cyH = isFinite(model.CY) ? model.CY : 0, wC = e[7] * cyH + e[15], wMax = wC + C.depthMargin;
    // (2026-10-05i) 보이는 겉층만 — 화면의 visCell px 칸마다 카메라에 가장 가까운 점의 깊이를 재고, 그보다 depthLayer(≈ 2.5cm) 넘게 뒤에 있는 점은 붓에 안 걸림.
    //   예전에는 원 안이면 두상 가운데 깊이까지 전부 걸렸습니다 → 뒤에서 빗는데 그 뒤에 겹쳐 있던 옆머리·목 옆 머리·얼굴 옆 머리까지 칠해짐(사용자 영상: "뒤만 빗었는데 목덜미와 얼굴로 가닥이 튀어나옴").
    var VIS = null, hidden = 0;
    var dLay = (C.mode === 'sweep' && C.sweep) ? C.sweepDepth : C.depthLayer;      // (j) 넘기기는 뭉치의 속까지
    if (FM && dLay > 0) {
      var vc = Math.max(2, C.visCell), vw = Math.ceil(rect.width / vc) + 1, vh = Math.ceil(rect.height / vc) + 1, ZM = new Float32Array(vw * vh).fill(Infinity), vi;
      for (i = 0; i < n; i++) { vi = (SY[i] / vc | 0) * vw + (SX[i] / vc | 0); if (SW[i] < ZM[vi]) ZM[vi] = SW[i]; }
      VIS = new Uint8Array(n);
      for (i = 0; i < n; i++) { if (SW[i] <= ZM[(SY[i] / vc | 0) * vw + (SX[i] / vc | 0)] + dLay) VIS[i] = 1; else if (SW[i] <= wMax) hidden++; }
    }
    S.pickMs = now() - t0; S.pickPts = n; S.pickFly = extra; S.pickHidden = hidden;
    return { sweep: (C.mode === 'sweep' && C.sweep), DF: DFp, FM: FM, list: list, e: e, wMax: wMax, SX: SX, SY: SY, SW: SW, PX: PX, PY: PY, PZ: PZ, SI: SI, SK: SK, FL: FL, VIS: VIS, head: head, next: next, cell: cell, gw: gw, gh: gh, rect: rect, right: right, up: up,
      perPx: function (w) { return 2 * w * Math.tan(cam.fov * Math.PI / 360) / rect.height; } };
  }
  function pickAt(pk, x, y, rad) {
    var c = pk.cell, bx = x / c | 0, by = y / c | 0, span = Math.ceil(rad / c), best = -1, bw = Infinity, r2 = rad * rad, a, b, i, VIS = pk.VIS;
    for (b = by - span; b <= by + span; b++) { if (b < 0 || b >= pk.gh) continue;
      for (a = bx - span; a <= bx + span; a++) { if (a < 0 || a >= pk.gw) continue;
        for (i = pk.head[b * pk.gw + a]; i >= 0; i = pk.next[i]) {
          if (pk.SW[i] > pk.wMax || (VIS && !VIS[i])) continue;            // 반대편 머리 · 겉층 뒤에 가린 머리
          var dx = pk.SX[i] - x, dy = pk.SY[i] - y; if (dx * dx + dy * dy > r2) continue;
          if (pk.SW[i] < bw) { bw = pk.SW[i]; best = i; }
        }
      }
    }
    return best;
  }
  /* 화면의 원(반지름 rad px) 안에 보이는 가닥 점 전부 → [x,y,z,가중] 묶음. 너무 많으면 건너뛰며 고름 */
  var gatherBuf = new Int32Array(8192);
  function gather(pk, x, y, rad) {
    var c = pk.cell, bx = x / c | 0, by = y / c | 0, span = Math.ceil(rad / c), r2 = rad * rad, a, b, i, n = 0, VIS = pk.VIS;
    for (b = by - span; b <= by + span; b++) { if (b < 0 || b >= pk.gh) continue;
      for (a = bx - span; a <= bx + span; a++) { if (a < 0 || a >= pk.gw) continue;
        for (i = pk.head[b * pk.gw + a]; i >= 0; i = pk.next[i]) {
          if (pk.SW[i] > pk.wMax || (VIS && !VIS[i])) continue;
          var dx = pk.SX[i] - x, dy = pk.SY[i] - y; if (dx * dx + dy * dy > r2) continue;
          if (n >= gatherBuf.length) { var nb = new Int32Array(gatherBuf.length * 2); nb.set(gatherBuf); gatherBuf = nb; }
          gatherBuf[n++] = i;
        }
      }
    }
    if (!n) return null;
    // 3D 칸(dabCell)마다 점 하나만 — 머리가 빽빽한 자리와 혼자 떠 있는 잔머리가 같은 세기로 칠해지게(점 수에 비례하지 않게)
    //   uniq 값 = [x, y, z, 가중, 꼭 남길 자리인가(뜬 점·거슬러 올라간 점)]
    var dc = C.dabCell, uniq = new Map(), k, key, wgt, ddx, ddy, prev, FL = pk.FL, nf = 0, touched = null, tv;
    function put(px, py, pz, wg, keep) {
      key = (Math.floor(px / dc) + 2048) + 4096 * ((Math.floor(py / dc) + 2048) + 4096 * (Math.floor(pz / dc) + 2048));
      prev = uniq.get(key);
      if (prev === undefined) { uniq.set(key, [px, py, pz, wg, keep]); if (keep) nf++; }
      else { if (wg > prev[3]) { prev[0] = px; prev[1] = py; prev[2] = pz; prev[3] = wg; } if (keep && !prev[4]) { prev[4] = 1; nf++; } }
    }
    for (k = 0; k < n; k++) {
      i = gatherBuf[k];
      ddx = pk.SX[i] - x; ddy = pk.SY[i] - y; wgt = Math.pow(1 - Math.sqrt(ddx * ddx + ddy * ddy) / rad, C.falloff);
      put(pk.PX[i], pk.PY[i], pk.PZ[i], wgt, FL ? FL[i] : 0);
      if (FL && FL[i] && C.reachBack && !pk.sweep) {                                    // 붓에 걸린 뜬 점 → 그 가닥을 기억(가장 끝 쪽 점 · 가장 큰 가중)
        if (!touched) touched = new Map();
        tv = touched.get(pk.SI[i]);
        if (tv === undefined) touched.set(pk.SI[i], [pk.SK[i], wgt]); else { if (pk.SK[i] > tv[0]) tv[0] = pk.SK[i]; if (wgt > tv[1]) tv[1] = wgt; }
      }
    }
    // (2026-10-05i) 벗어난 자리까지 거슬러 올라가기 — 붓에 "직접 걸린" 가닥만, 칠할 때 그 가닥을 따라 뿌리 쪽으로:
    //   뜬 점은 계속, 몸통 속으로 들어가면 reachIn점 더 가고 멈춤. 카메라 반대편(두상 가운데보다 뒤)으로 넘어가면 멈춤.
    //   (h에서는 가닥을 만들 때 붓이 안 닿은 자리까지 세기를 퍼뜨려서, 옆 가닥·반대편까지 번졌습니다 — 폰 실측: 12획에 9,999가닥 중 2,378가닥이 바뀜)
    var reached = 0;
    if (touched && pk.FM) {
      var e = pk.e, FMF = pk.FM.F, FMo = pk.FM.off, lim = Math.max(0, C.reachIn | 0);
      touched.forEach(function (v, si) {
        var pts = pk.list[si].pts, pre = (pts._pre && pts._pre.length === pts.length) ? pts._pre : pts, o = FMo[si], inB = 0, j, p;
        for (j = v[0] - 1; j >= 1; j--) {
          p = pts[j]; if (e[3] * p.x + e[7] * p.y + e[11] * p.z + e[15] > pk.wMax) break;
          if (FMF[o + j]) inB = 0; else if (++inB > lim) break;
          put(pre[j].x, pre[j].y, pre[j].z, v[1], 1); reached++;
        }
      });
    }
    // 자리가 dabMax보다 많으면 건너뛰며 고름 — 뜬 점·거슬러 올라간 점은 전부 남기고 몸통 속 점만 건너뜀
    var m0 = uniq.size, step = 1, j = 0, q = 0;
    if (m0 > C.dabMax) step = Math.max(1, Math.ceil((m0 - nf) / Math.max(1, C.dabMax - nf)));
    var D = new Float32Array((nf + Math.ceil((m0 - nf) / step) + 1) * 4);
    uniq.forEach(function (v) {
      if (!v[4] && (q++ % step)) return;
      D[j * 4] = v[0]; D[j * 4 + 1] = v[1]; D[j * 4 + 2] = v[2]; D[j * 4 + 3] = v[3]; j++;
    });
    return { dabs: D, m: j, seen: n, reached: reached };
  }

  /* ────────────────────────────────────────────────────────────────────────
   * ③ 손가락 — 빗질 모드에서 한 손가락 드래그
   * ────────────────────────────────────────────────────────────────────── */
  var stroke = null, pass = false, ptrs = new Map(), synth = false, liveT = 0, liveTimer = null;
  function onCanvas(e) { var m = m3(); return !!(m && e.target === m.renderer.domElement && m.container && m.container.id === 'adjust3dHost'); }
  function live() {
    if (liveTimer) return;
    var wait = Math.max(0, C.liveMs - (now() - liveT));
    liveTimer = setTimeout(function () { liveTimer = null; liveT = now(); redraw(); }, wait);
  }
  /* 지나온 길에서 dirLagPx 뒤의 점 → 지금 점 = 빗질 방향(화면) */
  function lagDir(st, x, y) {
    var tr = st.trail, n = tr.length, acc = 0, i;
    for (i = n - 2; i >= 0; i -= 2) {
      acc += Math.hypot((i + 2 < n ? tr[i + 2] : x) - tr[i], (i + 3 < n ? tr[i + 3] : y) - tr[i + 1]);
      if (acc >= C.dirLagPx) break;
    }
    if (i < 0) i = 0;
    return [x - tr[i], y - tr[i + 1]];
  }
  function addSample(x, y) {
    var st = stroke, pk = st.pk; if (!pk) return;
    var mvx = x - st.lx, mvy = y - st.ly, mv = Math.sqrt(mvx * mvx + mvy * mvy);
    if (mv < C.minMovePx) return;
    var ld = lagDir(st, x, y);
    st.trail.push(x, y); if (st.trail.length > 240) st.trail.splice(0, 120);
    var ll = Math.hypot(ld[0], ld[1]) || 1;                               // 방향만(길이 1) — 직전 방향과 섞어 손떨림을 한 번 더 누름
    if (st.vx === 0 && st.vy === 0) { st.vx = ld[0] / ll; st.vy = ld[1] / ll; }
    else { st.vx = st.vx * 0.7 + ld[0] / ll * 0.3; st.vy = st.vy * 0.7 + ld[1] / ll * 0.3; }
    // 원의 크기: 원 안에서 가장 가까운 점의 깊이로(상한 maxRadius)
    var i = pickAt(pk, x, y, C.radiusPx);
    if (i >= 0) st.w = pk.SW[i];
    var rPx = st.w > 0 ? Math.min(C.maxRadius, C.radiusPx * pk.perPx(st.w)) / pk.perPx(st.w) : null;
    showMark(x, y, rPx, Math.atan2(st.vy, st.vx));
    st.lx = x; st.ly = y;
    if (rPx == null) return;                                              // 아직 머리 위를 지난 적 없음
    var dx = pk.right.x * st.vx - pk.up.x * st.vy, dy = pk.right.y * st.vx - pk.up.y * st.vy, dz = pk.right.z * st.vx - pk.up.z * st.vy, dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!(dl > 1e-9)) return;
    if (st.has && Math.hypot(x - st.sx, y - st.sy) < C.spacing * rPx) return;        // 원 반지름의 spacing만큼 움직일 때마다 한 번
    var gth = gather(pk, x, y, rPx);
    if (!gth) return;                                                     // 원 안에 보이는 머리가 없음
    if (C.samples.length + C.sweeps.length >= C.maxSamples) { if (!st.full) { st.full = true; try { showToast(lang() === 'ko' ? '빗질이 너무 많아요 — ↶로 되돌리거나 지워 주세요' : 'Too many comb strokes — undo or clear some'); } catch (e) {} } return; }
    if (pk.sweep) C.sweeps.push({ dabs: gth.dabs, m: gth.m, dx: dx / dl, dy: dy / dl, dz: dz / dl, k: C.sweepStrength, g: st.g });      // (j) 넘기기 획은 따로
    else C.samples.push({ dabs: gth.dabs, m: gth.m, dx: dx / dl, dy: dy / dl, dz: dz / dl, k: C.strength, g: st.g });
    st.sx = x; st.sy = y; st.has = true; st.n++; S.dabs = gth.m; S.seen = gth.seen; S.reached = gth.reached || 0;
    ver++; live();
  }
  function endStroke() {
    var st = stroke; stroke = null;
    if (!st) return;
    if (st.n) { if (st.sweep) S.sweepStrokes = (S.sweepStrokes || 0) + 1; else S.strokes++; if (liveTimer) { clearTimeout(liveTimer); liveTimer = null; } redraw(); }
    syncBtn();
  }
  function onDown(e) {
    if (synth || !C.on || !usable() || !onCanvas(e)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (pass) return;
    if (stroke) {                           // 두 번째 손가락 — 빗질을 멈추고 두 손가락을 화면 조작(이동·확대)에 넘김
      var first = stroke.id, fp = ptrs.get(first);
      endStroke(); pass = true;
      if (fp) { try { synth = true; e.target.dispatchEvent(new PointerEvent('pointerdown', { pointerId: first, clientX: fp.x, clientY: fp.y, bubbles: true, isPrimary: true, button: 0, pointerType: fp.type || 'touch' })); } catch (x) {} synth = false; }
      return;
    }
    if (e.button !== 0 || e.shiftKey) return;        // Shift+드래그·가운데/오른쪽 버튼 = 이동(그대로)
    var pk = null; try { pk = buildPick(); } catch (x) { S.err = String(x && x.message || x); }
    if (!pk) return;
    var rc = pk.rect, oy = e.pointerType === 'touch' ? C.touchOffset : 0, x0 = e.clientX - rc.left, y0 = e.clientY - rc.top - oy;
    stroke = { sweep: !!pk.sweep, id: e.pointerId, pk: pk, oy: oy, lx: x0, ly: y0, vx: 0, vy: 0, trail: [x0, y0], has: false, n: 0, g: ++gid, cx: 0, cy: 0, cz: 0, sx: 0, sy: 0, sz: 0, w: 0 };
    var i0 = pickAt(pk, x0, y0, C.radiusPx);
    if (i0 >= 0) stroke.w = pk.SW[i0];
    showMark(x0, y0, i0 >= 0 ? Math.min(C.maxRadius, C.radiusPx * pk.perPx(pk.SW[i0])) / pk.perPx(pk.SW[i0]) : null, null);
    e.stopPropagation();
  }
  function onMove(e) {
    if (ptrs.has(e.pointerId)) { var q = ptrs.get(e.pointerId); q.x = e.clientX; q.y = e.clientY; }
    if (!stroke && C.on && !pass && e.pointerType === 'mouse' && usable() && onCanvas(e)) {      // 마우스: 올려놓기만 해도 빗이 따라다님
      var r0 = e.target.getBoundingClientRect(); showMark(e.clientX - r0.left, e.clientY - r0.top, null, null);
    }
    if (!stroke || e.pointerId !== stroke.id) return;
    e.stopPropagation();
    var rc = stroke.pk.rect, oy = stroke.oy, ev = (typeof e.getCoalescedEvents === 'function') ? e.getCoalescedEvents() : null;
    if (ev && ev.length > 1) { for (var i = 0; i < ev.length; i++) addSample(ev[i].clientX - rc.left, ev[i].clientY - rc.top - oy); }
    else addSample(e.clientX - rc.left, e.clientY - rc.top - oy);
  }
  function onUp(e) {
    ptrs.delete(e.pointerId);
    if (stroke && e.pointerId === stroke.id) endStroke();
    if (!ptrs.size) pass = false;
  }
  document.addEventListener('pointerdown', onDown, true);
  W.addEventListener('pointermove', onMove, true);
  W.addEventListener('pointerup', onUp, true);
  W.addEventListener('pointercancel', onUp, true);

  /* ────────────────────────────────────────────────────────────────────────
   * 빗 표시 — 점선 원(실제로 바뀌는 범위) + 작은 빗(빗살이 가리키는 쪽 = 머리가 눕는 방향)
   * ────────────────────────────────────────────────────────────────────── */
  var mark = null, markR = 14;
  function restRadiusPx() {                 // 붓 자리를 아직 못 찾았을 때: 머리 가운데 깊이 기준
    try {
      var m = m3(), rect = m.renderer.domElement.getBoundingClientRect(), dist = MODEL3D_VIEW.base ? MODEL3D_VIEW.base.dist / MODEL3D_VIEW.zoom : m.camera.position.length();
      var pp = 2 * dist * Math.tan(m.camera.fov * Math.PI / 360) / rect.height;
      return Math.min(C.maxRadius, C.radiusPx * pp) / pp;
    } catch (e) { return C.radiusPx; }
  }
  function ensureMark() {
    var m = m3(); if (!m || !m.container || m.container.id !== 'adjust3dHost') return null;
    if (mark && mark.parentNode === m.container) return mark;
    mark = document.createElement('div'); mark.id = 'comb3dMark';
    mark.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none;display:none;';
    mark.innerHTML = '<svg width="120" height="120" viewBox="-60 -60 120 120" style="position:absolute;left:-60px;top:-60px;overflow:visible">' +
      '<circle id="comb3dRing" r="14" fill="rgba(201,135,74,0.10)" stroke="#fff" stroke-width="2.5" opacity="0.9"/>' +
      '<circle id="comb3dRing2" r="14" fill="none" stroke="#c9874a" stroke-width="1.5" stroke-dasharray="4 3"/>' +
      '<g id="comb3dGlyph"><g transform="translate(0,0)">' +
      '<rect x="-13" y="-8" width="26" height="6" rx="2" fill="#c9874a" stroke="#1a1410" stroke-width="1"/>' +
      [-10.5, -7, -3.5, 0, 3.5, 7, 10.5].map(function (x) { return '<rect x="' + (x - 0.9) + '" y="-2.5" width="1.8" height="10" rx="0.8" fill="#c9874a" stroke="#1a1410" stroke-width="0.6"/>'; }).join('') +
      '</g></g></svg>';
    m.container.appendChild(mark);
    return mark;
  }
  /* (x,y) = 그림판 안 좌표 · rPx = 실제 반지름(px · null이면 직전 값) · ang = 빗질 방향(rad · null이면 아래) */
  function showMark(x, y, rPx, ang) {
    if (!C.indicator) return;
    var el = ensureMark(); if (!el) return;
    if (rPx != null && isFinite(rPx)) markR = Math.max(4, rPx);
    el.style.display = 'block';
    el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    try {
      el.querySelector('#comb3dRing').setAttribute('r', markR.toFixed(1)); el.querySelector('#comb3dRing2').setAttribute('r', markR.toFixed(1));
      // 빗살이 진행 방향을 가리키게(빗 그림은 빗살이 +y) — 화면 각도 ang에서 90° 뺌
      var deg = ang == null ? 0 : ang * 180 / Math.PI - 90;
      el.querySelector('#comb3dGlyph').setAttribute('transform', 'rotate(' + deg.toFixed(1) + ')');
    } catch (e) {}
  }
  function hideMark() { if (mark) mark.style.display = 'none'; }
  function restMark() {                      // 빗질을 켰을 때: 화면 가운데에 빗을 보여 둠
    try {
      var m = m3(); if (!m || !C.on) { hideMark(); return; }
      var rect = m.renderer.domElement.getBoundingClientRect();
      showMark(rect.width / 2, rect.height / 2, restRadiusPx(), null);
    } catch (e) {}
  }
  C._mark = function () { return mark; };

  /* ────────────────────────────────────────────────────────────────────────
   * ④ 버튼
   * ────────────────────────────────────────────────────────────────────── */
  function lang() { try { return uiLang === 'ko' ? 'ko' : 'en'; } catch (e) { return 'ko'; } }
  var btn = null, undoBtn = null, sweepBtn = null;
  function syncBtn() {
    try {
      if (!btn) return;
      var show = C.enabled && a3on(), sw = C.on && C.mode === 'sweep' && C.sweep;
      btn.style.display = show ? '' : 'none';
      btn.classList.toggle('on', !!C.on && !sw);
      btn.textContent = (C.on && !sw) ? '빗질 ON' : '빗질 OFF';
      if (sweepBtn) { sweepBtn.style.display = show && C.sweep ? '' : 'none'; sweepBtn.classList.toggle('on', !!sw); sweepBtn.textContent = sw ? '넘기기 ON' : '넘기기 OFF'; }
      undoBtn.style.display = show && C.on ? '' : 'none';
      undoBtn.disabled = !(C.samples.length || C.sweeps.length);
      if (mark) { var r2 = mark.querySelector('#comb3dRing2'); if (r2) r2.setAttribute('stroke', sw ? '#3b82c4' : '#c9874a'); }
      var m = m3(); if (m && m.container && m.container.id === 'adjust3dHost') m.renderer.domElement.style.cursor = C.on ? 'crosshair' : '';
    } catch (e) {}
  }
  C.toggle = function (v, mode) {           // mode: 'tidy'(기본) | 'sweep' — 다른 쪽이 켜져 있으면 그쪽으로 바꿈
    mode = (mode === 'sweep' && C.sweep) ? 'sweep' : 'tidy';
    if (v == null) v = !(C.on && C.mode === mode);
    if (stroke) endStroke();
    C.on = !!v; if (C.on) C.mode = mode;
    syncBtn();
    if (C.on && mode === 'sweep') {
      restMark(); syncBtn();
      try { showToast(lang() === 'ko' ? '넘기고 싶은 머리에 빗(원)을 올리고 보낼 방향으로 쓸어 주세요 — 원 안의 머리가 뭉치째 그 방향으로 넘어갑니다 · 이어서 쓸면 더 넘어가요 · ↶ 되돌리기'
        : 'Put the comb (circle) on the hair and stroke the way you want it to go — the whole bundle inside the circle turns that way · keep stroking to carry it further · ↶ undo'); } catch (e) {}
    } else if (C.on) {
      restMark(); syncBtn();
      try { showToast(lang() === 'ko' ? '뜬 머리에 빗(원)을 올리고 결대로 쓸어 주세요 — 주변 머리의 결에 맞춰 눕습니다 · 빗은 손가락 조금 위에 있어요 · 두 손가락: 이동·확대'
        : 'Put the comb (circle) on the flyaways and sweep along the hair — they lie down into the surrounding flow · the comb sits just above your finger · two fingers: move / zoom'); } catch (e) {}
    } else hideMark();
  };
  try {
    var bar = document.querySelector('#screen-adjust .mode-bar'), mq = document.getElementById('mannequinBtn');
    if (bar) {
      btn = document.createElement('button'); btn.id = 'comb3dBtn'; btn.type = 'button';
      if (mq && mq.className) btn.className = mq.className;
      btn.title = '켜면 한 손가락 드래그가 빗질이 됩니다 — 잔머리를 결 방향으로 쓰다듬어 눕힙니다';
      btn.addEventListener('click', function () { C.toggle(); });
      undoBtn = document.createElement('button'); undoBtn.id = 'comb3dUndoBtn'; undoBtn.type = 'button';
      if (mq && mq.className) undoBtn.className = mq.className;
      undoBtn.textContent = '↶'; undoBtn.title = '마지막 빗질 한 획 되돌리기';
      undoBtn.addEventListener('click', function () { C.undo(); });
      sweepBtn = document.createElement('button'); sweepBtn.id = 'comb3dSweepBtn'; sweepBtn.type = 'button';
      if (mq && mq.className) sweepBtn.className = mq.className;
      sweepBtn.title = '켜면 한 손가락 드래그가 빗어 넘기기가 됩니다 — 원 안의 머리가 뭉치째 쓴 방향으로 넘어갑니다';
      sweepBtn.addEventListener('click', function () { C.toggle(null, 'sweep'); });
      bar.appendChild(btn); bar.appendChild(sweepBtn); bar.appendChild(undoBtn);
      syncBtn();
    }
  } catch (e) { console.warn(TAG + ' 버튼 만들기 실패', e); }
  try {
    if (typeof I18N !== 'undefined') {
      Object.assign(I18N, { '빗질 ON': 'Comb ON', '빗질 OFF': 'Comb OFF', '넘기기 ON': 'Sweep ON', '넘기기 OFF': 'Sweep OFF',
        '켜면 한 손가락 드래그가 빗어 넘기기가 됩니다 — 원 안의 머리가 뭉치째 쓴 방향으로 넘어갑니다': 'When on, a one-finger drag sweeps — the whole bundle inside the circle turns the way you stroke',
        '켜면 한 손가락 드래그가 빗질이 됩니다 — 잔머리를 결 방향으로 쓰다듬어 눕힙니다': 'When on, a one-finger drag combs — stroke flyaways along the hair flow to lay them down',
        '마지막 빗질 한 획 되돌리기': 'Undo the last comb stroke' });
      try { _i18nSubKeys = null; } catch (e) {}
      try { if (typeof applyUiLang === 'function') applyUiLang(); } catch (e) {}
    }
  } catch (e) {}
  // 화면·모드가 바뀌면 버튼 맞춤 · 조정 화면을 떠나면 빗질 모드는 끔
  ['activateScreen', 'toggleMannequin', 'mannequinReset'].forEach(function (name) {
    var o = W[name]; if (typeof o !== 'function') return;
    W[name] = function () {
      var r = o.apply(this, arguments);
      try { if (name === 'activateScreen' && arguments[0] !== 'adjust' && C.on) { C.on = false; if (stroke) endStroke(); hideMark(); } syncBtn(); } catch (e) {}
      return r;
    };
  });
  var oApplyV = W.model3dApplyView;
  if (typeof oApplyV === 'function') W.model3dApplyView = function () {
    var r = oApplyV.apply(this, arguments);
    try { if (C.on && !stroke && mark && mark.style.display !== 'none') { markR = Math.max(4, restRadiusPx()); mark.querySelector('#comb3dRing').setAttribute('r', markR.toFixed(1)); mark.querySelector('#comb3dRing2').setAttribute('r', markR.toFixed(1)); } } catch (e) {}
    return r;
  };
  var origRAF = W.renderAdjustFrame;
  if (typeof origRAF === 'function') W.renderAdjustFrame = function () { var r = origRAF.apply(this, arguments); try { syncBtn(); } catch (e) {} return r; };

  /* ────────────────────────────────────────────────────────────────────────
   * ⑤ 진단
   * ────────────────────────────────────────────────────────────────────── */
  var ppl = W.perfPanelLines;
  if (typeof ppl === 'function') W.perfPanelLines = function () {
    var L = ppl.apply(this, arguments) || [];
    try {
      L.push(TAG + ' ' + (C.enabled ? (C.on ? '켜짐(빗질 모드)' : '대기') : '꺼짐') + ' · 획 ' + S.strokes + ' · 표본 ' + C.samples.length + '/' + C.maxSamples +
        ' · 넘기기 ' + (C.sweep ? (C.on && C.mode === 'sweep' ? '켜짐' : '대기') + ' — 획 ' + (S.sweepStrokes || 0) + ' · 표본 ' + C.sweeps.length + ' · 직전에 넘어간 가닥 ' + (S.swept || 0) + '(두상에 막혀 눕힌 마디 ' + (S.sweptPush || 0) + ') · 방향 장 ' + (F2 ? F2.n : 0) + '칸' : '꺼짐(COMB3D.sweep=false)') +
        ' · 직전에 바뀐 가닥 ' + S.touched + ' · 가닥 만들기 ' + Math.round(S.ms) + 'ms(빗질 포함) · 붓 자리 찾기 준비 ' + Math.round(S.pickMs) + 'ms(점 ' + S.pickPts + ') · 직전 표본이 칠한 점 ' + S.dabs + '(원 안에 보인 점 ' + S.seen + ')' +
        ' · 방향 장 ' + (F ? F.n : 0) + '칸 · 붓 ' + C.radiusPx + 'px(상한 ' + C.maxRadius + ' · 지금 화면에서 ' + Math.round(markR) + 'px) · 세기 ' + C.strength + ' · 터치 빗 위치 손가락 위 ' + C.touchOffset + 'px' + (S.err ? ' · ⚠ ' + S.err : ''));
      L.push('  결 따라 빗기 ' + (C.grain ? (flowMemo && flowMemo.flow ? '켜짐 — 결 칸 ' + S.flowCells + ' · 몸통 머리 보통 밀도 칸당 ' + S.flowRef + '가닥 · 결 읽기 ' + Math.round(S.flowMs) + 'ms' : '켜짐(아직 결을 안 읽음 — 빗을 대면 읽음)') : '꺼짐(손가락 방향 그대로)') +
        ' · 직전에 본 마디의 목표: 제 무리의 결 ' + S.tOwn + ' / 손가락 쪽 이웃의 결 ' + S.tSide + ' / 이웃 전체의 결 ' + S.tAll + ' / 두상 쪽에서 찾은 결 ' + S.tReach + ' / 손가락 방향(주변에 머리 없음) ' + S.tFinger + ' / 결이 갈려 그대로 둠 ' + S.tSkip +
        ' · 허용 각 ' + C.tolFrom + '~' + C.tolFull + '° · ' + (C.collide ? '두상에 막혀 눕힌 마디 ' + S.pushed + ' / 목 밖으로 민 점 ' + S.neck : '두상 막기 꺼짐') +
        ' · ' + (C.anchor ? '몸통 붙들기 켜짐 — 제자리로 되돌린 점 ' + S.anch + ' / 몸통 쪽으로 기울인 마디 ' + S.pin : '몸통 붙들기 꺼짐'));
      L.push('  겉면 타기 ' + (C.surf ? (flowMemo && flowMemo.flow && flowMemo.flow.DF ? '켜짐 — 몸통 칸 ' + S.surfCells + '(잔칸 보통 밀도 ' + S.surfRef + '가닥) · 뜬 점 ' + (floatMemo ? floatMemo.cnt + '/' + floatMemo.tot : '-') +
        ' · 직전에 세기가 걸린 잔머리 마디 ' + S.fly + ' · 그중 거슬러 올라가 세기를 올린 마디 ' + S.up + (C.reachBack ? '(직전 표본이 가닥을 따라 올라가며 칠한 점 ' + S.reached + ')' : '(거슬러 올라가기 꺼짐)') +
        ' · 겉면 쪽으로 튼 마디 ' + S.pin + (C.settle > 0 ? '' : '(꺼짐 — 방향 정렬만)') + ' · 6cm 상한에 걸린 점 ' + S.clamp +
        ' · 붓 자리 찾기: 따로 넣은 뜬 점 ' + (S.pickFly || 0) + ' / 겉층 뒤라 뺀 점 ' + (S.pickHidden || 0) + (C.depthLayer > 0 ? '' : '(깊이 안 가림)') : (C.grain ? '켜짐(아직 거리장 없음 — 빗을 대면 만듦)' : '꺼짐(결 따라 빗기가 꺼져 있음)')) : '꺼짐(예전 방식)'));
    } catch (e) {}
    return L;
  };

  console.log(TAG + ' 설치 — 3D 조정 화면에서 [빗질]을 켜고 잔머리를 결 방향으로 쓰다듬으면 그 방향으로 눕습니다 · [넘기기]를 켜고 쓸면 원 안의 머리가 뭉치째 그 방향으로 넘어갑니다. 지우기 COMB3D.clear() · 되돌리기 COMB3D.undo()');
})();
