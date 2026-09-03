export const stageDifficulties = [
  { label: "프롤로그", collisionDamage: 4, hazardRows: 1, spawnInterval: 2.8, speedBonus: 0, repairAmount: 4, repairChance: .15, rescueAmount: 0, criticalDamageScale: .6 },
  { label: "초급", collisionDamage: 10, hazardRows: 3, spawnInterval: 2.15, speedBonus: 1.2, repairAmount: 4, repairChance: .2, rescueAmount: 0, criticalDamageScale: 1 },
  { label: "중급", collisionDamage: 13, hazardRows: 3, spawnInterval: 1.9, speedBonus: 2.6, repairAmount: 5, repairChance: .28, rescueAmount: 0, criticalDamageScale: 1 },
  { label: "고급", collisionDamage: 14, hazardRows: 3, spawnInterval: 1.82, speedBonus: 3.4, repairAmount: 7, repairChance: .36, rescueAmount: 0, criticalDamageScale: .85 },
  { label: "대용량 안정", collisionDamage: 14, hazardRows: 3, spawnInterval: 1.8, speedBonus: 3.6, repairAmount: 12, repairChance: .48, rescueAmount: 25, criticalDamageScale: .75 },
  { label: "라이브 도전", collisionDamage: 15, hazardRows: 4, spawnInterval: 1.72, speedBonus: 4.2, repairAmount: 16, repairChance: .55, rescueAmount: 30, criticalDamageScale: .7 },
];

export const badEndings = [
  { code: "BAD END 01", title: "축하 문자가 사라졌다", story: "마지막 문자 조각이 전파 간섭 속에서 사라졌다. 친구의 알림창은 끝내 울리지 않았다." },
  { code: "BAD END 02", title: "사진이 깨진 채 멈췄다", story: "이미지 조각이 모두 손실되어 추억 사진을 열 수 없었다. 화면에는 빈 미리보기만 남았다." },
  { code: "BAD END 03", title: "목소리가 끊겨 버렸다", story: "복구할 음성 조각이 하나도 남지 않았다. 친구의 스피커에서는 짧은 잡음만 흘러나왔다." },
  { code: "BAD END 04", title: "영상 편지가 멈췄다", story: "해저망을 건너던 영상 조각이 모두 사라졌다. 재생 버튼은 첫 장면에서 움직이지 않았다." },
  { code: "BAD END 05", title: "추억 파일이 손상됐다", story: "대용량 파일의 마지막 조각까지 유실되었다. 친구는 손상된 파일을 다시 보내 달라고 답했다." },
  { code: "BAD END 06", title: "실시간 연결이 종료됐다", story: "화면과 음성의 마지막 신호가 끊겼다. 두 친구가 함께하던 실시간 생일 축하는 멈춰 버렸다." },
];

export const prologueGuides = [
  { eyebrow: "연습 1/4 · 움직이기", title: "좌우로 차선을 바꿔 보세요", body: "화면 아래 버튼, 방향키 또는 A·D 키로 픽셀을 움직일 수 있어요." },
  { eyebrow: "연습 2/4 · 수집하기", title: "빛나는 신호를 따라가세요", body: "밝게 빛나는 신호와 아이템이 보이면 같은 차선으로 이동해 모아 보세요." },
  { eyebrow: "연습 3/4 · 회피하기", title: "붉은 전파 간섭을 피하세요", body: "붉은 장애물과 다른 차선으로 이동하세요. 프롤로그에서는 충돌 피해가 작아요." },
  { eyebrow: "연습 4/4 · 선택하기", title: "질문과 표지판을 함께 읽으세요", body: "세 표지판의 조건을 비교하고 가장 안정적으로 데이터를 보낼 차선을 고르세요." },
];
