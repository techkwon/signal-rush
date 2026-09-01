export const stageDifficulties = [
  { label: "입문", collisionDamage: 8, hazardRows: 2, spawnInterval: 2.4, speedBonus: 0 },
  { label: "초급", collisionDamage: 10, hazardRows: 3, spawnInterval: 2.15, speedBonus: 1.2 },
  { label: "중급", collisionDamage: 13, hazardRows: 3, spawnInterval: 1.9, speedBonus: 2.6 },
  { label: "고급", collisionDamage: 16, hazardRows: 4, spawnInterval: 1.68, speedBonus: 4.2 },
  { label: "매우 어려움", collisionDamage: 19, hazardRows: 5, spawnInterval: 1.5, speedBonus: 5.9 },
  { label: "최종 위기", collisionDamage: 22, hazardRows: 6, spawnInterval: 1.35, speedBonus: 7.8 },
];

export const badEndings = [
  { code: "BAD END 01", title: "축하 문자가 사라졌다", story: "마지막 문자 조각이 전파 간섭 속에서 사라졌다. 친구의 알림창은 끝내 울리지 않았다." },
  { code: "BAD END 02", title: "사진이 깨진 채 멈췄다", story: "이미지 조각이 모두 손실되어 추억 사진을 열 수 없었다. 화면에는 빈 미리보기만 남았다." },
  { code: "BAD END 03", title: "목소리가 끊겨 버렸다", story: "복구할 음성 조각이 하나도 남지 않았다. 친구의 스피커에서는 짧은 잡음만 흘러나왔다." },
  { code: "BAD END 04", title: "영상 편지가 멈췄다", story: "해저망을 건너던 영상 조각이 모두 사라졌다. 재생 버튼은 첫 장면에서 움직이지 않았다." },
  { code: "BAD END 05", title: "추억 파일이 손상됐다", story: "대용량 파일의 마지막 조각까지 유실되었다. 친구는 손상된 파일을 다시 보내 달라고 답했다." },
  { code: "BAD END 06", title: "실시간 연결이 종료됐다", story: "화면과 음성의 마지막 신호가 끊겼다. 두 친구가 함께하던 실시간 생일 축하는 멈춰 버렸다." },
];
