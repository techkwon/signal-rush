"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Switch } from "@/components/ui/switch";

type Lane = 0 | 1 | 2;
type RouteMode = "fast" | "balanced" | "safe";
type Screen = "intro" | "playing" | "result";
type EventKind = "gate" | "hazard" | "attenuation" | "booster" | "bottleneck" | "recovery" | "route";
type Option = { label: string; detail: string; delta: number; route?: RouteMode };
type Challenge = { type: EventKind; kicker: string; prompt: string; options: [Option, Option, Option] };
type Stage = { name: string; place: string; distance: string; payload: string; payloadSize: string; courseSeconds: number; color: string; accent: string; story: string; lesson: string; events: Challenge[] };
type StageStat = { name: string; start: number; end: number; lost: number; recovered: number; route: RouteMode };
type DecisionRecord = { stage: string; event: string; choice: string; detail: string; delta: number; points: number; route?: RouteMode };
type LeaderEntry = { id: number; player_name: string; score: number; fragments: number; grade: string; created_at: string };
type StageEnding = { world: string; code: string; title: string; line: string; lost: number; recovered: number; endFragments: number };
type StageReview = StageEnding & { stageScore: number; totalScore: number; startFragments: number; story: string };
type ArcadeKind = "orb" | "hazard" | "dodge";

type Engine = {
  spawnChallenge: (challenge: Challenge, accent: string, speed: number) => void;
  setWorld: (color: string, accent: string) => void;
  setLane: (lane: Lane) => void;
  setEnergy: (level: number, route: RouteMode) => void;
  setBoost: (active: boolean) => void;
  setPaused: (active: boolean) => void;
  triggerEffect: (delta: number, accent: string) => void;
  destroy: () => void;
};

const O = (label: string, detail: string, delta: number, route?: RouteMode): Option => ({ label, detail, delta, route });
const E = (type: EventKind, kicker: string, prompt: string, options: [Option, Option, Option]): Challenge => ({ type, kicker, prompt, options });

const stages: Stage[] = [
  {
    name: "내 방", place: "휴대폰 → 공유기", distance: "12 m", payload: "문자", payloadSize: "4 KB", courseSeconds: 2.8, color: "#75cfe3", accent: "#22f0c4",
    story: "짧은 생일 문장이 작은 전송 요정 ‘픽셀’로 깨어났다. 가장 가벼운 4 KB 문자부터 전송을 시작한다.",
    lesson: "가까운 거리도 벽과 전자기기의 간섭을 받는다.",
    events: [
      E("gate", "첫 신호", "공유기까지 어떤 신호를 탈까?", [O("5GHz 직선", "짧은 거리에서 빠르고 선명했다", 9), O("벽 두 개", "벽을 지날 때 신호가 크게 약해졌다", -13), O("2.4GHz 우회", "조금 느리지만 멀리까지 안정적이었다", 5)]),
      E("hazard", "전파 간섭", "전자레인지가 켜졌다. 어느 쪽으로 피할까?", [O("책상 아래", "전자파 간섭을 비켜 갔다", 0), O("전자레인지", "같은 주파수의 간섭을 정면으로 받았다", -18), O("문 쪽", "간섭은 줄었지만 문을 통과하며 약해졌다", -4)]),
      E("booster", "공유기 접속", "가장 안정적인 접속 위치를 찾아라.", [O("방 구석", "공유기에서 멀어 신호가 줄었다", -5), O("공유기 정면", "강한 신호로 잃은 조각을 보충했다", 12), O("닫힌 문", "문이 신호를 가로막았다", -7)]),
    ],
  },
  {
    name: "도시", place: "광케이블 → 교환기", distance: "28 km", payload: "이미지", payloadSize: "5 MB", courseSeconds: 3.2, color: "#7d6bc7", accent: "#e0c1ff",
    story: "문자에 생일 사진이 붙으며 데이터가 5 MB 이미지로 커졌다. 픽셀은 붐비는 도시 광케이블로 뛰어든다.",
    lesson: "빠른 회선도 사용자가 몰리면 대역폭 병목이 생긴다.",
    events: [
      E("bottleneck", "퇴근 시간", "어느 회선이 덜 붐빌까?", [O("상업 지구", "동시에 접속한 사람이 너무 많았다", -14), O("전용 회선", "넓은 대역폭으로 빠르게 통과했다", 7), O("주택가", "혼잡 때문에 일부 조각이 지연됐다", -6)]),
      E("hazard", "케이블 공사", "끊어진 구간을 피해 달려라.", [O("지하 관로", "보호된 관로로 안전하게 우회했다", 0), O("굴착 현장", "손상된 케이블에서 조각이 사라졌다", -17), O("옆 교환기", "짧게 우회하며 조금 약해졌다", -3)]),
      E("booster", "교환기", "어느 교환기에서 신호를 보강할까?", [O("구형 장비", "약하지만 신호를 다시 키웠다", 5), O("혼잡 회선", "대기열이 길어 조각이 빠졌다", -8), O("새 교환기", "깨끗한 신호로 크게 증폭됐다", 13)]),
    ],
  },
  {
    name: "데이터센터", place: "서버 보관 → 복제", distance: "1,420 km", payload: "음성", payloadSize: "25 MB", courseSeconds: 3.6, color: "#4f98d8", accent: "#b8ecff",
    story: "사진에 목소리가 더해져 25 MB 음성이 되었다. 서버 ‘루미’가 말한다. ‘사본을 찾으면 되돌릴 수 있어!’",
    lesson: "서버 복제와 캐시는 잃은 정보를 다시 보낼 수 있게 한다.",
    events: [
      E("bottleneck", "서버 대기열", "비어 있는 서버를 찾아라.", [O("서버 A", "요청이 몰려 오래 기다렸다", -10), O("서버 B", "여유 있는 서버가 바로 응답했다", 4), O("서버 C", "점검 중인 서버에 갇혔다", -15)]),
      E("recovery", "캐시 탐색", "영상 사본이 남은 캐시는 어디일까?", [O("오래된 캐시", "남아 있던 일부 조각을 되찾았다", 7), O("빈 캐시", "저장된 사본이 없었다", 0), O("최신 캐시", "최신 사본에서 많은 조각을 복구했다", 18)]),
      E("recovery", "서버 복제", "복제된 조각을 합칠 서버를 골라라.", [O("원본 서버", "원본에서 일부를 재전송했다", 9), O("복제 서버", "분산된 사본을 합쳐 크게 복구했다", 16), O("백업 대기", "백업을 기다리다 조각이 지연됐다", -5)]),
    ],
  },
  {
    name: "바다", place: "해저 케이블", distance: "10,248 km", payload: "동영상", payloadSize: "180 MB", courseSeconds: 4, color: "#0d8eb9", accent: "#7cf3ff",
    story: "사진과 목소리가 합쳐져 180 MB 동영상이 되었다. 픽셀은 더 무거운 조각을 품고 1만 km 해저 케이블로 들어간다.",
    lesson: "국제 인터넷의 대부분은 해저 케이블을 지나며 중계기가 약해진 빛을 되살린다.",
    events: [
      E("attenuation", "긴 감쇠", "중계기가 가까운 선로를 찾아라.", [O("깊은 해구", "중계기 없는 긴 구간에서 크게 약해졌다", -15), O("중계 선로", "가까운 중계기가 감쇠를 줄였다", -5), O("우회 케이블", "거리가 늘어 신호가 더 줄었다", -11)]),
      E("hazard", "해저 사고", "어선의 닻이 떨어진다. 어디로 피할까?", [O("바위 지대", "해저 지진의 흔들림을 받았다", -9), O("닻 아래", "닻이 케이블을 손상시켰다", -22), O("보호 관로", "단단한 관로가 케이블을 지켰다", 0)]),
      E("booster", "광 증폭기", "약해진 빛을 다시 키워라.", [O("고장 중계기", "증폭기가 작동하지 않았다", -7), O("광 증폭기", "빛 신호가 강하게 되살아났다", 17), O("낡은 중계기", "약하게나마 신호를 보강했다", 6)]),
      E("attenuation", "대양 횡단", "마지막 장거리 구간을 선택하라.", [O("직선 케이블", "가장 짧아 감쇠를 줄였다", -7), O("남쪽 우회", "먼 거리만큼 신호가 약해졌다", -14), O("북쪽 우회", "중간 거리의 감쇠를 견뎠다", -10)]),
    ],
  },
  {
    name: "하늘", place: "위성 중계", distance: "35,786 km", payload: "대용량 데이터", payloadSize: "1.2 GB", courseSeconds: 4.4, color: "#705eb3", accent: "#ffc1f5",
    story: "여러 장면과 고화질 정보가 합쳐져 1.2 GB 대용량 데이터가 되었다. 폭우 속에서 위성 각도를 맞춰야 한다.",
    lesson: "위성은 멀리 돌아가며 거리와 날씨, 안테나 각도의 영향을 받는다.",
    events: [
      E("attenuation", "궤도 선택", "가장 짧은 위성 경로는 어디일까?", [O("저궤도", "가까운 궤도로 감쇠를 줄였다", -6), O("정지궤도", "아주 먼 거리에서 신호가 약해졌다", -16), O("반대 궤도", "긴 우회로 조각이 줄었다", -12)]),
      E("hazard", "날씨 간섭", "폭우 구름을 피해 달려라.", [O("맑은 하늘", "날씨 간섭 없이 통과했다", 0), O("먹구름", "수분이 전파를 조금 약하게 했다", -8), O("폭우", "강한 비가 위성 신호를 크게 줄였다", -21)]),
      E("gate", "안테나 각도", "지상 안테나와 맞는 각도를 찾아라.", [O("18도", "안테나가 위성을 놓쳤다", -12), O("42도", "정확히 정렬되어 신호를 되찾았다", 12), O("77도", "일부 신호만 연결됐다", -3)]),
      E("recovery", "지상국 동기화", "대용량 조각을 다시 맞출 지상국은?", [O("혼잡 지상국", "동시 요청이 몰려 일부 조각이 빠졌다", -9), O("동기화 지상국", "분산된 조각의 순서를 다시 맞췄다", 14), O("먼 지상국", "우회 거리만큼 신호가 약해졌다", -6)]),
    ],
  },
  {
    name: "친구 동네", place: "기지국 → 친구 폰", distance: "2.6 km", payload: "실시간 스트리밍", payloadSize: "LIVE · 계속 증가", courseSeconds: 4.8, color: "#86bb59", accent: "#efff9c",
    story: "마지막에는 저장된 파일이 아니라 계속 커지는 실시간 스트리밍이 되었다. 픽셀은 끊김 없는 연결을 지키며 친구의 폰으로 달린다.",
    lesson: "마지막 연결과 재전송이 친구가 받는 영상의 완성도를 결정한다.",
    events: [
      E("gate", "마지막 기지국", "친구 집까지 안정적인 연결은?", [O("혼잡 Wi-Fi", "접속자가 몰려 조각이 빠졌다", -10), O("5G 기지국", "가까운 기지국이 빠르게 연결했다", 10), O("약한 LTE", "신호가 약해 일부가 사라졌다", -6)]),
      E("hazard", "빌딩 숲", "높은 건물이 신호를 가린다.", [O("건물 뒤", "건물이 신호를 막았다", -14), O("큰길", "시야가 열린 길로 안전하게 통과했다", 0), O("지하 주차장", "지하에서 신호가 크게 약해졌다", -18)]),
      E("recovery", "마지막 재전송", "도착 직전, 잃은 조각을 다시 요청할까?", [O("바로 재생", "남은 조각으로 바로 재생했다", 0), O("부분 요청", "빠르게 일부를 다시 받았다", 8), O("전체 확인", "검사 후 가능한 조각을 모두 복구했다", 15)]),
      E("bottleneck", "동시 시청", "실시간 영상이 몰린다. 어느 통로로 보낼까?", [O("공용 회선", "시청자가 몰려 대역폭이 부족해졌다", -16), O("전용 스트림", "전용 대역폭으로 끊김을 줄였다", 7), O("저화질 전환", "화질을 낮춰 일부 조각을 지켰다", -4)]),
      E("attenuation", "마지막 버퍼", "끊김 없이 재생할 버퍼 전략은?", [O("버퍼 없음", "조금만 흔들려도 재생이 끊겼다", -18), O("짧은 버퍼", "지연과 안정성을 균형 있게 지켰다", 6), O("너무 긴 버퍼", "도착은 안정적이지만 지연 중 일부가 빠졌다", -7)]),
    ],
  },
];

const stageEndings = [
  { code: "TEXT SENT", title: "문자가 길을 열었다", line: "4 KB의 짧은 문장이 벽과 간섭을 뚫고 이미지가 달릴 더 넓은 길을 열었다." },
  { code: "IMAGE SENT", title: "사진이 도시를 건넜다", line: "5 MB 이미지가 혼잡한 교환기를 통과하며 데이터의 무게가 눈에 보이기 시작했다." },
  { code: "AUDIO SENT", title: "목소리가 복구됐다", line: "25 MB 음성 조각은 서버 사본을 만나 끊어진 친구의 목소리를 다시 이어 붙였다." },
  { code: "VIDEO SENT", title: "동영상이 바다를 건넜다", line: "180 MB 동영상은 1만 km 해저 케이블과 증폭기를 지나 더 큰 데이터가 되었다." },
  { code: "DATA SENT", title: "1.2 GB를 궤도에 올렸다", line: "대용량 데이터가 폭우와 긴 거리를 견디고 마지막 실시간 연결을 향해 내려왔다." },
  { code: "STREAM LIVE", title: "마음이 실시간으로 닿았다", line: "계속 커지는 스트리밍이 끊기지 않고 재생되며 긴 여정은 살아 있는 영상이 되었다." },
];

const routeChallenge: Challenge = E("route", "달리는 갈림길", "다음 세계까지 어떤 경로로 달릴까?", [
  O("빠른 길", "거리는 짧지만 다음 장애물이 빨라진다", -3, "fast"),
  O("균형 경로", "거리와 위험을 균형 있게 선택했다", -5, "balanced"),
  O("안전한 길", "멀리 돌아가지만 다음 장애물 피해가 줄어든다", -8, "safe"),
]);

const laneX = [-5.2, 0, 5.2];
const arcadeNames = [
  { orb: "깨끗한 신호", hazard: "전자파 간섭" },
  { orb: "여유 대역폭", hazard: "패킷 충돌" },
  { orb: "캐시 조각", hazard: "서버 오류" },
  { orb: "증폭 펄스", hazard: "해저 닻" },
  { orb: "정렬 신호", hazard: "폭우 간섭" },
  { orb: "마지막 연결", hazard: "건물 차폐" },
];
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const routeName = (route: RouteMode) => route === "fast" ? "빠른 길" : route === "safe" ? "안전한 길" : "균형 경로";
const pointsFor = (delta: number, kind: EventKind) => {
  if (kind === "route") return 65;
  if (delta >= 10) return 150;
  if (delta > 0) return 115;
  if (delta === 0) return 45;
  return -Math.min(90, 30 + Math.abs(delta) * 3);
};

function buildJourneyNovel(decisions: DecisionRecord[], stats: StageStat[], fragments: number) {
  const traveledWorlds = stages.slice(0, Math.max(1, stats.length));
  const chapters = traveledWorlds.map((world, index) => {
    const choices = decisions.filter((item) => item.stage === world.name && !item.route);
    const turningPoint = choices.reduce<DecisionRecord | null>((picked, item) => !picked || Math.abs(item.delta) > Math.abs(picked.delta) ? item : picked, null);
    const stat = stats[index];
    const result = stat ? stat.end < stat.start ? `${stat.start}개의 빛은 ${stat.end}개로 줄었지만` : `${stat.start}개의 빛은 ${stat.end}개로 더 선명해졌고` : "빛은 멈추지 않았고";
    const moment = turningPoint ? `‘${turningPoint.choice}’을 향해 몸을 던진 순간, ${turningPoint.detail}.` : `${world.place}의 길은 조용히 뒤로 흘러갔다.`;
    return `${index + 1}장. ${world.name}. ${world.story} 픽셀은 ${moment} ${result}, 작은 발은 다음 세계를 향해 다시 뛰었다.`;
  });
  const ending = fragments === 0
    ? `그러나 ${traveledWorlds.at(-1)?.name ?? "전송로"}에서 마지막 데이터 조각까지 사라졌다. 화면에는 아무것도 재생되지 않았다. 픽셀은 멈춘 길을 기억했다. 다음 전송에서는 더 안전한 경로를 골라야 한다.`
    : fragments >= 75
    ? `마침내 하람의 화면에 영상이 켜졌다. ${fragments}개의 조각이 웃음과 목소리를 이어 붙였다. 픽셀은 화면 가장자리에서 조용히 손을 흔들었다. 멀리 있다는 것은, 연결될 수 없다는 뜻이 아니었다.`
    : fragments >= 25
      ? `하람의 화면에는 ${fragments}개의 조각이 별처럼 흩어져 나타났다. 완벽한 영상은 아니었지만, 그 사이로 친구의 마음은 분명히 보였다. 하람은 사라진 문장을 상상하며 답장을 쓰기 시작했다.`
      : `화면에는 세 점과 희미한 빛만 남았다. 그래도 픽셀은 포기하지 않았다. 실패는 길이 사라진 것이 아니라, 다음 전송에서 다른 길을 고를 수 있다는 표시였으니까.`;
  return [...chapters, `마지막 장. 친구의 화면. ${ending}`];
}

function labelTexture(text: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(4,12,19,.94)";
  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.roundRect(20, 20, 984, 216, 38);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 76px Pretendard, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 512, 132, 900);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.Points)) return;
    child.geometry?.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
  });
}

function createCutePixel(accent: string) {
  const group = new THREE.Group();
  const cyan = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: .9, roughness: .22, metalness: .18 });
  const navy = new THREE.MeshStandardMaterial({ color: "#12344b", roughness: .36, metalness: .6 });
  const white = new THREE.MeshStandardMaterial({ color: "#efffff", emissive: "#bffff4", emissiveIntensity: .35 });
  const dark = new THREE.MeshStandardMaterial({ color: "#06131c", roughness: .25 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(.82, 20, 16), cyan);
  body.scale.set(1, 1.12, .82); body.position.y = 1.05; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.72, 20, 16), white);
  head.scale.set(1.05, .92, .9); head.position.y = 2.12; group.add(head);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.95, .32, .12), dark);
  visor.position.set(0, 2.13, -.63); group.add(visor);
  [-.26, .26].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), cyan);
    eye.position.set(x, 2.14, -.72); group.add(eye);
  });
  [-.34, .34].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.22, .55, 12), cyan);
    ear.position.set(x, 2.83, 0); ear.rotation.z = x < 0 ? -.24 : .24; group.add(ear);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.14, .48, 5, 10), navy);
    arm.position.set(x * 2.75, 1.2, 0); arm.rotation.z = x < 0 ? -.55 : .55; arm.userData.limb = "arm"; arm.userData.phase = x < 0 ? 0 : Math.PI; arm.userData.baseZ = arm.rotation.z; group.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .46, 5, 10), navy);
    leg.position.set(x * 1.25, .15, 0); leg.rotation.z = x < 0 ? -.16 : .16; leg.userData.limb = "leg"; leg.userData.phase = x < 0 ? Math.PI : 0; leg.userData.baseZ = leg.rotation.z; group.add(leg);
  });
  const pack = new THREE.Mesh(new THREE.CylinderGeometry(.48, .58, .34, 18), navy);
  pack.rotation.x = Math.PI / 2; pack.position.set(0, 1.15, .72); group.add(pack);
  const core = new THREE.Mesh(new THREE.TorusGeometry(.26, .08, 10, 24), cyan);
  core.position.set(0, 1.15, .94); group.add(core);
  [-.18, .18].forEach((x) => {
    const rearEye = new THREE.Mesh(new THREE.SphereGeometry(.075, 10, 8), white);
    rearEye.position.set(x, 1.18, 1.04); group.add(rearEye);
  });
  const antenna = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .36, 4, 8), navy);
  antenna.position.set(0, 2.83, .1); group.add(antenna);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), cyan);
  antennaTip.position.set(0, 3.13, .1); group.add(antennaTip);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 16), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .18, depthWrite: false, depthTest: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  aura.scale.set(1, 1.55, .72); aura.position.y = 1.35; group.add(aura);
  const runnerRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, .12, 10, 32), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .95 }));
  runnerRing.rotation.x = Math.PI / 2; runnerRing.position.y = -.06; group.add(runnerRing);
  group.scale.setScalar(1.45);
  group.position.set(0, .08, 6.1);
  return group;
}

function addLaneObject(container: THREE.Group, kind: EventKind, accent: string, lane: number) {
  const danger = new THREE.MeshStandardMaterial({ color: "#ff3158", emissive: "#ff173f", emissiveIntensity: 1.45, roughness: .35 });
  const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.15, roughness: .22, metalness: .18 });
  const steel = new THREE.MeshStandardMaterial({ color: "#244b5d", emissive: "#0b2633", emissiveIntensity: .3, roughness: .38, metalness: .42 });
  const white = new THREE.MeshStandardMaterial({ color: "#f4ffff", emissive: "#d7ffff", emissiveIntensity: .8, roughness: .18 });
  const warning = new THREE.MeshStandardMaterial({ color: "#ffc247", emissive: "#ff8a00", emissiveIntensity: 1.1, roughness: .32 });

  if (kind === "hazard") {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.72, 0), danger);
    core.position.y = 1.15; core.userData.spin = 2.8; container.add(core);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, .22, .28), danger);
      blade.position.y = 1.15; blade.rotation.z = i * Math.PI / 4; blade.userData.spin = i % 2 ? -2.2 : 2.2; container.add(blade);
    }
    const warningRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, .08, 8, 28), new THREE.MeshBasicMaterial({ color: "#ff9ab0", transparent: true, opacity: .9 }));
    warningRing.position.y = 1.15; warningRing.userData.pulse = true; container.add(warningRing);
  } else if (kind === "bottleneck") {
    [-1.05, 1.05].forEach((x) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(.75, 3.2, 1.35), warning);
      wall.position.set(x, 1.6, 0); container.add(wall);
      for (let y = .45; y < 3; y += .65) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(.82, .12, 1.4), danger);
        stripe.position.set(x, y, -.03); stripe.rotation.z = .22; container.add(stripe);
      }
    });
  } else if (kind === "booster") {
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.12 - i * .18, .11, 10, 32), i === 1 ? white : glow);
      ring.position.set(0, 1.35, i * .46); ring.userData.spin = 1.8 + i; container.add(ring);
    }
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.1, 4), white);
    arrow.position.y = 1.35; arrow.rotation.z = -Math.PI / 2; arrow.userData.pulse = true; container.add(arrow);
  } else if (kind === "recovery") {
    for (let i = 0; i < 3; i++) {
      const server = new THREE.Mesh(new THREE.BoxGeometry(2.15, .62, .9), steel);
      server.position.set(0, .42 + i * .7, 0); container.add(server);
      const light = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), glow);
      light.position.set(.78, .42 + i * .7, -.48); container.add(light);
    }
    const plusH = new THREE.Mesh(new THREE.BoxGeometry(1.05, .22, .18), white);
    const plusV = new THREE.Mesh(new THREE.BoxGeometry(.22, 1.05, .18), white);
    plusH.position.set(0, 2.72, -.05); plusV.position.copy(plusH.position); plusH.userData.pulse = true; plusV.userData.pulse = true; container.add(plusH, plusV);
  } else if (kind === "attenuation") {
    for (let i = 0; i < 4; i++) {
      const fadeMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .78 - i * .16 });
      const arc = new THREE.Mesh(new THREE.TorusGeometry(1.22, .09, 8, 30, Math.PI), fadeMaterial);
      arc.rotation.z = Math.PI; arc.position.set(0, 1.6, i * .55); container.add(arc);
      const left = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.7, .12), fadeMaterial); left.position.set(-1.22, .76, i * .55); container.add(left);
      const right = left.clone(); right.position.x = 1.22; container.add(right);
    }
    const weakCore = new THREE.Mesh(new THREE.SphereGeometry(.34, 14, 10), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .42 }));
    weakCore.position.y = 1.2; weakCore.userData.pulse = true; container.add(weakCore);
  } else {
    const gateColor = kind === "route" ? (lane === 0 ? "#ffb52e" : lane === 2 ? "#55d8ff" : accent) : accent;
    const gateMat = new THREE.MeshStandardMaterial({ color: gateColor, emissive: gateColor, emissiveIntensity: .95, roughness: .22 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(.26, 2.9, .36), steel); left.position.set(-1.22, 1.45, 0); container.add(left);
    const right = left.clone(); right.position.x = 1.22; container.add(right);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.72, .3, .36), gateMat); top.position.y = 2.82; container.add(top);
    if (kind === "route") {
      for (let i = 0; i < 2; i++) {
        const arrow = new THREE.Mesh(new THREE.ConeGeometry(.34 + i * .08, .8, 4), gateMat);
        arrow.position.set(0, .9 + i * .82, 0); arrow.rotation.z = -Math.PI / 2; arrow.userData.pulse = true; container.add(arrow);
      }
    } else {
      const signal = new THREE.Mesh(new THREE.SphereGeometry(.36, 14, 10), white);
      signal.position.y = 1.35; signal.userData.pulse = true; container.add(signal);
    }
  }
}

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const resolveRef = useRef<() => void>(() => {});
  const laneRef = useRef<Lane>(1);
  const fragmentsRef = useRef(100);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const routeRef = useRef<RouteMode>("balanced");
  const optionMapRef = useRef<[number, number, number]>([0, 1, 2]);
  const resolvingRef = useRef(false);
  const stageStartRef = useRef(100);
  const stageLostRef = useRef(0);
  const stageRecoveredRef = useRef(0);
  const stageScoreStartRef = useRef(0);
  const statsRef = useRef<StageStat[]>([]);
  const decisionsRef = useRef<DecisionRecord[]>([]);
  const nextTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<number | null>(null);
  const motionReducedRef = useRef(false);
  const boostRef = useRef(0);
  const boostActiveRef = useRef(false);
  const boostTimerRef = useRef<number | null>(null);
  const arcadeResolveRef = useRef<(kind: ArcadeKind) => void>(() => {});
  const arcadeToastTimerRef = useRef<number | null>(null);
  const terminatingRef = useRef(false);
  const reviewingRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [isRoute, setIsRoute] = useState(false);
  const [fragments, setFragments] = useState(100);
  const [score, setScore] = useState(0);
  const [route, setRoute] = useState<RouteMode>("balanced");
  const [progress, setProgress] = useState(0);
  const [radio, setRadio] = useState(stages[0].story);
  const [outcome, setOutcome] = useState<{ delta: number; points: number; combo: number; text: string } | null>(null);
  const [chapterFlash, setChapterFlash] = useState(false);
  const [stageEnding, setStageEnding] = useState<StageEnding | null>(null);
  const [stageReview, setStageReview] = useState<StageReview | null>(null);
  const [combo, setCombo] = useState(0);
  const [gameEffect, setGameEffect] = useState<"" | "boost" | "hit" | "dash">("");
  const [boostCharge, setBoostCharge] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [lostTotal, setLostTotal] = useState(0);
  const [recoveredTotal, setRecoveredTotal] = useState(0);
  const [stats, setStats] = useState<StageStat[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [resultStep, setResultStep] = useState<0 | 1 | 2>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [webglError, setWebglError] = useState(false);
  const [arcadeToast, setArcadeToast] = useState<{ kind: ArcadeKind; text: string } | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderLoading(true);
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("leaderboard");
      const data = await response.json() as { entries: LeaderEntry[] };
      setLeaderboard(data.entries ?? []);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderLoading(false);
    }
  }, []);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);

  useEffect(() => { motionReducedRef.current = motionReduced; }, [motionReduced]);
  useEffect(() => () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    if (boostTimerRef.current) window.clearTimeout(boostTimerRef.current);
    if (arcadeToastTimerRef.current) window.clearTimeout(arcadeToastTimerRef.current);
  }, []);

  const stage = stages[stageIndex];
  const challenge = isRoute ? routeChallenge : stage.events[eventIndex];
  const courseTotal = stage.events.length + (stageIndex < stages.length - 1 ? 1 : 0);
  const courseIndex = isRoute ? stage.events.length : eventIndex;
  const globalWave = [0, 4, 8, 12, 17, 21][stageIndex] + courseIndex;
  const speed = 11.5 + globalWave * .78 + (route === "fast" ? 3.5 : route === "safe" ? -1.5 : 0);

  const terminateAtZero = useCallback(() => {
    if (terminatingRef.current || reviewingRef.current) return;
    terminatingRef.current = true;
    resolvingRef.current = true;
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    if (boostTimerRef.current) window.clearTimeout(boostTimerRef.current);
    boostActiveRef.current = false; setBoostActive(false); engineRef.current?.setBoost(false);
    const completed: StageStat = { name: stage.name, start: stageStartRef.current, end: 0, lost: stageLostRef.current, recovered: stageRecoveredRef.current, route: routeRef.current };
    if (statsRef.current.at(-1)?.name !== stage.name) statsRef.current = [...statsRef.current, completed];
    setStats(statsRef.current);
    setFragments(0); setCombo(0); setOutcome(null); setArcadeToast(null); setGameEffect("hit");
    setStageEnding({ world: stage.name, code: "SIGNAL LOST", title: "전송이 완전히 끊겼다", line: `${stage.payload} 데이터가 0개가 되어 ${stage.name}에서 여정이 멈췄다.`, lost: completed.lost, recovered: completed.recovered, endFragments: 0 });
    setRadio("루미: “남은 데이터가 0이야. 이번 전송은 여기서 끝났어.”");
    nextTimerRef.current = window.setTimeout(() => { setStageEnding(null); setScreen("result"); }, 1100);
  }, [stage.name, stage.payload]);

  const move = useCallback((direction: -1 | 1) => {
    if (terminatingRef.current) return;
    const next = Math.max(0, Math.min(2, laneRef.current + direction)) as Lane;
    if (next === laneRef.current) return;
    laneRef.current = next;
    engineRef.current?.setLane(next);
    setGameEffect("dash"); window.setTimeout(() => setGameEffect(""), 160);
  }, []);

  const activateBoost = useCallback(() => {
    if (screen !== "playing" || terminatingRef.current || reviewingRef.current || boostActiveRef.current || boostRef.current < 100) return;
    boostRef.current = 0; boostActiveRef.current = true;
    setBoostCharge(0); setBoostActive(true); setGameEffect("boost");
    engineRef.current?.setBoost(true); engineRef.current?.triggerEffect(1, stage.accent);
    window.setTimeout(() => setGameEffect(""), 450);
    if (boostTimerRef.current) window.clearTimeout(boostTimerRef.current);
    boostTimerRef.current = window.setTimeout(() => {
      boostActiveRef.current = false; setBoostActive(false); engineRef.current?.setBoost(false);
    }, 2800);
  }, [screen, stage.accent]);

  const resolveArcade = useCallback((kind: ArcadeKind) => {
    if (screen !== "playing" || terminatingRef.current) return;
    if (kind === "orb") {
      scoreRef.current += boostActiveRef.current ? 40 : 20;
      comboRef.current = Math.min(9, comboRef.current + 1);
      boostRef.current = Math.min(100, boostRef.current + 6);
      setScore(scoreRef.current); setCombo(comboRef.current); setBoostCharge(boostRef.current);
      setArcadeToast({ kind, text: `${boostActiveRef.current ? "+40" : "+20"} · ${arcadeNames[stageIndex].orb}` });
      engineRef.current?.triggerEffect(1, stage.accent);
    } else if (kind === "hazard") {
      const damage = boostActiveRef.current ? 3 : 4;
      const nextFragments = clamp(fragmentsRef.current - damage);
      const applied = fragmentsRef.current - nextFragments;
      fragmentsRef.current = nextFragments;
      scoreRef.current = Math.max(0, scoreRef.current - 40);
      comboRef.current = 0;
      stageLostRef.current += applied;
      setFragments(nextFragments); setScore(scoreRef.current); setCombo(0); setLostTotal((value) => value + applied);
      setGameEffect("hit"); setArcadeToast({ kind, text: `−40 · ${arcadeNames[stageIndex].hazard} · 조각 −${applied}` });
      engineRef.current?.triggerEffect(-4, stage.accent);
      window.setTimeout(() => setGameEffect(""), 300);
      if (nextFragments === 0) terminateAtZero();
    } else {
      scoreRef.current += boostActiveRef.current ? 30 : 15;
      comboRef.current = Math.min(9, comboRef.current + 1);
      setScore(scoreRef.current); setCombo(comboRef.current);
      setArcadeToast({ kind, text: `${boostActiveRef.current ? "+30" : "+15"} · ${arcadeNames[stageIndex].hazard} 회피` });
    }
    if (arcadeToastTimerRef.current) window.clearTimeout(arcadeToastTimerRef.current);
    arcadeToastTimerRef.current = window.setTimeout(() => setArcadeToast(null), 560);
  }, [screen, stage.accent, stageIndex, terminateAtZero]);

  useEffect(() => { arcadeResolveRef.current = resolveArcade; }, [resolveArcade]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (screen !== "playing") return;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
      if (event.code === "Space") { event.preventDefault(); activateBoost(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activateBoost, move, screen]);

  useEffect(() => {
    if (screen !== "playing" || !mountRef.current) return;
    const mount = mountRef.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", precision: "highp", logarithmicDepthBuffer: true });
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(stage.color);
    scene.fog = new THREE.Fog(stage.color, 45, 145);
    const camera = new THREE.PerspectiveCamera(55, 1, .3, 160);
    camera.position.set(0, 6.35, 13.6);
    camera.lookAt(0, 1.45, -18);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;
    renderer.sortObjects = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = "three-canvas";
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight("#f1ffff", "#17485d", 4.4); scene.add(ambient);
    const key = new THREE.DirectionalLight("#ffffff", 6.2); key.position.set(-7, 13, 7); key.castShadow = true; scene.add(key);
    const rim = new THREE.PointLight(stage.accent, 38, 48); rim.position.set(0, 4, 2); scene.add(rim);

    const roadMat = new THREE.MeshStandardMaterial({ color: "#35596b", emissive: "#1b4350", emissiveIntensity: .5, roughness: .68, metalness: .12 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 220), roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -92); road.receiveShadow = true; scene.add(road);
    const railMat = new THREE.MeshStandardMaterial({ color: "#9bc7d5", emissive: stage.accent, emissiveIntensity: .18, metalness: .62, roughness: .28 });
    [-9.15, 9.15].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.38, .65, 220), railMat);
      rail.position.set(x, .32, -92); scene.add(rail);
    });

    const markings: THREE.Mesh[] = [];
    const markMat = new THREE.MeshBasicMaterial({ color: "#b7d9e2", transparent: true, opacity: .46, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    [-2.95, 2.95].forEach((x) => {
      for (let z = -112; z < 16; z += 6) {
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(.16, 2.8), markMat);
        mark.rotation.x = -Math.PI / 2; mark.position.set(x, .045, z); mark.renderOrder = 2; scene.add(mark); markings.push(mark);
      }
    });

    const sideProps: THREE.Mesh[] = [];
    for (let i = 0; i < 54; i++) {
      const height = 1.5 + (i % 6) * .75;
      const geometry = i % 3 === 0 ? new THREE.CylinderGeometry(.28, .48, height, 8) : new THREE.BoxGeometry(.8 + (i % 2) * .5, height, .8);
      const material = new THREE.MeshStandardMaterial({ color: i % 2 ? "#34768b" : "#56a5b5", emissive: stage.accent, emissiveIntensity: .17, roughness: .48 });
      const prop = new THREE.Mesh(geometry, material);
      prop.position.set((i % 2 ? 1 : -1) * (10.5 + (i % 4) * 1.8), height / 2, -112 + i * 3.1);
      scene.add(prop); sideProps.push(prop);
    }
    const worldRoot = new THREE.Group(); scene.add(worldRoot);
    const worldProps: THREE.Group[] = [];

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(360);
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = (Math.random() - .5) * 55;
      starPositions[i + 1] = 1 + Math.random() * 17;
      starPositions[i + 2] = -115 + Math.random() * 130;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: stage.accent, size: .12, transparent: true, opacity: .62 })); scene.add(stars);

    const speedLinePositions = new Float32Array(160 * 6);
    for (let i = 0; i < speedLinePositions.length; i += 6) {
      const x = (Math.random() - .5) * 30;
      const y = .5 + Math.random() * 12;
      const z = -120 + Math.random() * 135;
      speedLinePositions.set([x, y, z, x, y, z + 7 + Math.random() * 7], i);
    }
    const speedLineGeometry = new THREE.BufferGeometry();
    speedLineGeometry.setAttribute("position", new THREE.BufferAttribute(speedLinePositions, 3));
    const speedLineMaterial = new THREE.LineBasicMaterial({ color: stage.accent, transparent: true, opacity: .18, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    const speedLines = new THREE.LineSegments(speedLineGeometry, speedLineMaterial); scene.add(speedLines);

    const player = createCutePixel(stage.accent); player.traverse((part) => { if (part instanceof THREE.Mesh) { const materials = Array.isArray(part.material) ? part.material : [part.material]; part.castShadow = materials.every((material) => !material.transparent); part.receiveShadow = false; } }); scene.add(player);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: .35 }));
    shadow.scale.setScalar(1.55); shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, .018, 6.1); scene.add(shadow);

    let targetLane: Lane = laneRef.current;
    let activeGroup: THREE.Group | null = null;
    let challengeSpeed = speed;
    let worldSpeed = speed;
    let hit = false;
    let lastHud = 0;
    let animationId = 0;
    let elapsed = 0;
    let impactShake = 0;
    let targetFov = 55;
    let baseFov = 55;
    let speedMultiplier = 1;
    let arcadeClock = 3.8;
    let arcadePattern = 0;
    let energyLevel = 1;
    let builtWorldLevel = 0;
    let paused = false;
    let challengeStartZ = -54;
    let courseSeconds = stages[0].courseSeconds;
    const effects: { group: THREE.Group; life: number; material: THREE.MeshBasicMaterial }[] = [];
    const arcadeItems: { group: THREE.Group; kind: "orb" | "hazard"; lane: Lane; resolved: boolean }[] = [];
    const targetBackground = new THREE.Color(stage.color);
    const clock = new THREE.Clock();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    window.addEventListener("resize", resize);

    const removeChallenge = () => {
      if (!activeGroup) return;
      scene.remove(activeGroup);
      disposeObject(activeGroup);
      activeGroup = null;
    };

    const buildWorldLandmarks = (level: number, accent: string) => {
      while (worldRoot.children.length) { const child = worldRoot.children[0]; worldRoot.remove(child); disposeObject(child); }
      worldProps.length = 0;
      sideProps.forEach((prop) => { prop.visible = false; });
      const solid = new THREE.MeshStandardMaterial({ color: level === 4 ? "#14566e" : level === 5 ? "#766bb5" : "#3d7284", emissive: accent, emissiveIntensity: .16, roughness: .56 });
      const lit = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.05, roughness: .2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const pale = new THREE.MeshStandardMaterial({ color: "#eaffff", emissive: accent, emissiveIntensity: .32, roughness: .48, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      for (let i = 0; i < 9; i++) {
        [-1, 1].forEach((side) => {
          const prop = new THREE.Group();
          if (level === 1) {
            const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, .35, 2), solid); desk.position.y = 1.1; prop.add(desk);
            const screen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.05, .18), lit); screen.position.set(0, 1.75, 0); prop.add(screen);
            for (let r = 0; r < 2; r++) { const wifi = new THREE.Mesh(new THREE.TorusGeometry(.45 + r * .28, .045, 6, 22, Math.PI), lit); wifi.rotation.z = Math.PI; wifi.position.set(0, 2.55, 0); prop.add(wifi); }
          } else if (level === 2) {
            const height = 4 + (i % 4) * 1.4;
            const building = new THREE.Mesh(new THREE.BoxGeometry(3.3, height, 3.2), solid); building.position.y = height / 2; prop.add(building);
            for (let w = 0; w < 3; w++) { const window = new THREE.Mesh(new THREE.BoxGeometry(.38, .28, .08), lit); window.position.set(-.85 + w * .85, 1.4 + (i % 3) * .7, side < 0 ? 1.64 : -1.64); prop.add(window); }
          } else if (level === 3) {
            const rack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.7, 1.5), solid); rack.position.y = 2.85; prop.add(rack);
            for (let r = 0; r < 6; r++) { const line = new THREE.Mesh(new THREE.BoxGeometry(2.15, .12, .08), r % 2 ? lit : pale); line.position.set(0, .55 + r * .82, side < 0 ? .79 : -.79); prop.add(line); }
          } else if (level === 4) {
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 9.5, 14), solid); cable.rotation.x = Math.PI / 2; cable.position.y = .75; prop.add(cable);
            for (let b = 0; b < 4; b++) { const bubble = new THREE.Mesh(new THREE.SphereGeometry(.12 + b * .045, 10, 8), pale); bubble.position.set((b % 2) * .7, 1.2 + b * .65, -2 + b * 1.25); prop.add(bubble); }
            if (i % 3 === 0) { const repeater = new THREE.Mesh(new THREE.TorusGeometry(.82, .14, 10, 24), lit); repeater.position.y = .75; prop.add(repeater); }
          } else if (level === 5) {
            for (let c = 0; c < 4; c++) { const cloud = new THREE.Mesh(new THREE.SphereGeometry(1 + c * .12, 12, 9), pale); cloud.position.set((c - 1.5) * 1.15, 2 + (c % 2) * .55, 0); prop.add(cloud); }
            if (i % 2 === 0) { const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, .7, .7), solid); body.position.y = 4.5; prop.add(body); [-1, 1].forEach((x) => { const panel = new THREE.Mesh(new THREE.BoxGeometry(1.7, .08, .85), lit); panel.position.set(x * 1.35, 4.5, 0); prop.add(panel); }); }
          } else {
            const house = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.7, 3), solid); house.position.y = 1.35; prop.add(house);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.5, 4), pale); roof.position.y = 3.45; roof.rotation.y = Math.PI / 4; prop.add(roof);
            const window = new THREE.Mesh(new THREE.BoxGeometry(.85, .9, .08), lit); window.position.set(.65, 1.35, side < 0 ? 1.54 : -1.54); prop.add(window);
          }
          prop.position.set(side * (12 + (i % 3) * 1.2), 0, -110 + i * 15);
          worldRoot.add(prop); worldProps.push(prop);
        });
      }
      roadMat.color.set(level === 4 ? "#174d62" : level === 5 ? "#534c83" : level === 1 ? "#56717c" : "#35596b");
      railMat.emissive.set(accent);
    };

    const removeArcadeItem = (index: number) => {
      const item = arcadeItems[index];
      scene.remove(item.group); disposeObject(item.group); arcadeItems.splice(index, 1);
    };

    const spawnArcadeItem = (lane: Lane, kind: "orb" | "hazard", z = -30, size = 1) => {
      const group = new THREE.Group();
      if (kind === "orb") {
        const glow = new THREE.MeshStandardMaterial({ color: "#fff7a8", emissive: "#ffe44d", emissiveIntensity: 2.6, roughness: .12 });
        const orb = new THREE.Mesh(new THREE.SphereGeometry(.5, 18, 14), glow); group.add(orb);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.82, .095, 10, 28), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .9 }));
        ring.rotation.x = Math.PI / 2; group.add(ring);
      } else {
        const danger = new THREE.MeshStandardMaterial({ color: "#ff385f", emissive: "#ff173f", emissiveIntensity: 1.8, roughness: .28 });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.76, 0), danger); group.add(core);
        for (let i = 0; i < 4; i++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(.2, .8, 7), danger);
          spike.rotation.z = Math.PI / 2; spike.rotation.y = i * Math.PI / 2; spike.position.set(Math.cos(i * Math.PI / 2) * .76, 0, Math.sin(i * Math.PI / 2) * .76); group.add(spike);
        }
      }
      group.scale.setScalar(size);
      group.position.set(laneX[lane], kind === "orb" ? 1.15 : .85, z);
      scene.add(group); arcadeItems.push({ group, kind, lane, resolved: false });
    };

    const spawnArcadePattern = () => {
      const mode = (arcadePattern + energyLevel) % 5;
      const safeLane = Math.floor(Math.random() * 3) as Lane;
      if (mode === 0) {
        for (let i = 0; i < 3; i++) spawnArcadeItem(safeLane, "orb", -29 - i * 4.2, 1 - i * .08);
      } else if (mode === 1) {
        ([0, 1, 2] as Lane[]).forEach((lane) => spawnArcadeItem(lane, lane === safeLane ? "orb" : "hazard", -30));
      } else if (mode === 2) {
        const lanes = energyLevel < 3 ? [0, 1, 2] : [2, 0, 1, 2];
        lanes.forEach((lane, index) => spawnArcadeItem(lane as Lane, "orb", -29 - index * 4));
      } else if (mode === 3) {
        spawnArcadeItem(safeLane, "hazard", -30, 1.12);
        spawnArcadeItem(((safeLane + 1) % 3) as Lane, "orb", -34);
        spawnArcadeItem(((safeLane + 2) % 3) as Lane, "orb", -38);
      } else {
        const secondSafe = ((safeLane + 1) % 3) as Lane;
        ([0, 1, 2] as Lane[]).forEach((lane) => spawnArcadeItem(lane, lane === safeLane ? "orb" : "hazard", -30));
        ([0, 1, 2] as Lane[]).forEach((lane) => spawnArcadeItem(lane, lane === secondSafe ? "orb" : "hazard", -36));
      }
      if (routeRef.current === "fast") spawnArcadeItem(Math.floor(Math.random() * 3) as Lane, "hazard", -43, 1.08);
      if (routeRef.current === "safe") spawnArcadeItem(Math.floor(Math.random() * 3) as Lane, "orb", -43, .92);
      arcadePattern++;
    };

    const engine: Engine = {
      spawnChallenge(nextChallenge, accent, nextSpeed) {
        removeChallenge();
        hit = false;
        challengeSpeed = Math.min(nextSpeed, 23);
        worldSpeed = nextSpeed;
        const group = new THREE.Group();
        challengeStartZ = -Math.max(50, challengeSpeed * courseSeconds);
        group.position.z = challengeStartZ;
        const order = [0, 1, 2] as [number, number, number];
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
        optionMapRef.current = order;
        order.forEach((optionIndex, index) => {
          const option = nextChallenge.options[optionIndex];
          const laneGroup = new THREE.Group();
          laneGroup.position.x = laneX[index];
          addLaneObject(laneGroup, nextChallenge.type, accent, optionIndex);
          const texture = labelTexture(option.label, accent);
          const signMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .035, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.12), signMaterial);
          sign.position.set(0, 3.7, 0); sign.renderOrder = 10; laneGroup.add(sign);
          group.add(laneGroup);
        });
        group.traverse((part) => { if (part instanceof THREE.Mesh) { const materials = Array.isArray(part.material) ? part.material : [part.material]; part.castShadow = materials.every((material) => !material.transparent); } });
        activeGroup = group;
        scene.add(group);
        setProgress(0);
      },
      setWorld(color, accent) {
        targetBackground.set(color);
        key.color.set(accent); rim.color.set(accent);
        sideProps.forEach((prop) => ((prop.material as THREE.MeshStandardMaterial).emissive.set(accent)));
        (stars.material as THREE.PointsMaterial).color.set(accent);
        speedLineMaterial.color.set(accent);
      },
      setLane(nextLane) { targetLane = nextLane; },
      setEnergy(level, nextRoute) {
        energyLevel = level;
        courseSeconds = stages[level - 1].courseSeconds;
        if (builtWorldLevel !== level) { buildWorldLandmarks(level, stages[level - 1].accent); builtWorldLevel = level; }
        baseFov = [58, 60, 63, 66, 69, 72][level - 1] + (nextRoute === "fast" ? 3 : nextRoute === "safe" ? -1 : 0);
        targetFov = Math.min(82, baseFov + (boostActiveRef.current ? 7 : 0));
        speedLineMaterial.opacity = Math.min(.72, .12 + level * .085 + (nextRoute === "fast" ? .2 : 0));
        key.intensity = 3.2 + level * .55;
      },
      setBoost(active) {
        speedMultiplier = active ? 1.58 : 1;
        targetFov = Math.min(82, baseFov + (active ? 7 : 0));
        speedLineMaterial.opacity = active ? .95 : Math.min(.72, .12 + (stageIndex + 1) * .085 + (routeRef.current === "fast" ? .2 : 0));
      },
      setPaused(active) { paused = active; },
      triggerEffect(delta, accent) {
        impactShake = delta < 0 ? .6 : .18;
        const color = delta < 0 ? "#ff4568" : accent;
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, depthWrite: false });
        const group = new THREE.Group();
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(.75 + i * .28, .07, 8, 28), material);
          ring.rotation.x = Math.PI / 2; ring.position.y = .18 + i * .1; group.add(ring);
        }
        group.position.set(laneX[laneRef.current], .25, 5.35);
        scene.add(group); effects.push({ group, life: 1, material });
      },
      destroy() {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(animationId);
        removeChallenge();
        while (arcadeItems.length) removeArcadeItem(arcadeItems.length - 1);
        disposeObject(scene);
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
    engineRef.current = engine;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), .05);
      if (paused) { renderer.render(scene, camera); return; }
      elapsed += dt;
      const travel = challengeSpeed * speedMultiplier * dt;
      const worldTravel = worldSpeed * speedMultiplier * 1.8 * dt;
      markings.forEach((mark) => { mark.position.z += worldTravel; if (mark.position.z > 16) mark.position.z -= 132; });
      sideProps.forEach((prop) => { prop.position.z += worldTravel * .88; if (prop.position.z > 18) prop.position.z -= 136; });
      worldProps.forEach((prop) => { prop.position.z += worldTravel * .78; if (prop.position.z > 20) prop.position.z -= 135; });
      const positions = stars.geometry.attributes.position as THREE.BufferAttribute;
      const starArray = positions.array as Float32Array;
      for (let i = 2; i < starArray.length; i += 3) {
        starArray[i] += worldTravel * .48;
        if (starArray[i] > 15) starArray[i] = -115;
      }
      positions.needsUpdate = true;
      const lineAttribute = speedLines.geometry.attributes.position as THREE.BufferAttribute;
      const lineArray = lineAttribute.array as Float32Array;
      for (let i = 2; i < lineArray.length; i += 6) {
        lineArray[i] += worldTravel * 2.1; lineArray[i + 3] += worldTravel * 2.1;
        if (lineArray[i] > 18) { lineArray[i] -= 142; lineArray[i + 3] -= 142; }
      }
      lineAttribute.needsUpdate = true;

      arcadeClock -= dt;
      if (arcadeClock <= 0 && (!activeGroup || activeGroup.position.z < -31)) {
        spawnArcadePattern();
        const routePace = routeRef.current === "fast" ? -.14 : routeRef.current === "safe" ? .2 : 0;
        arcadeClock = Math.max(.9, 1.65 - energyLevel * .08 + routePace);
      }
      for (let i = arcadeItems.length - 1; i >= 0; i--) {
        const item = arcadeItems[i];
        item.group.position.z += worldTravel * 1.12;
        item.group.rotation.y += dt * (item.kind === "orb" ? 4.8 : 7.2);
        item.group.position.y += Math.sin(elapsed * 8 + i) * dt * .18;
        if (!item.resolved && item.group.position.z >= 4.7) {
          item.resolved = true;
          if (Math.abs(player.position.x - laneX[item.lane]) < 1.65) arcadeResolveRef.current(item.kind);
          else if (item.kind === "hazard") arcadeResolveRef.current("dodge");
        }
        if (item.group.position.z > 13) removeArcadeItem(i);
      }

      for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        effect.life -= dt * 1.8;
        effect.group.scale.multiplyScalar(1 + dt * 3.8);
        effect.group.position.y += dt * .7;
        effect.material.opacity = Math.max(0, effect.life);
        if (effect.life <= 0) { scene.remove(effect.group); disposeObject(effect.group); effects.splice(i, 1); }
      }

      const targetX = laneX[targetLane];
      player.position.x += (targetX - player.position.x) * Math.min(1, dt * 9);
      shadow.position.x += (targetX - shadow.position.x) * Math.min(1, dt * 9);
      player.position.y = .15 + Math.sin(elapsed * 10) * .08;
      player.rotation.z = (targetX - player.position.x) * -.045;
      player.rotation.y = Math.sin(elapsed * 3) * .035;
      player.traverse((part) => {
        if (!part.userData.limb) return;
        const stride = Math.sin(elapsed * (8 + energyLevel * .7) + part.userData.phase);
        part.rotation.z = part.userData.baseZ + stride * (part.userData.limb === "leg" ? .48 : .38);
      });
      const pulse = 1 + Math.sin(elapsed * 7) * .06;
      rim.intensity = 23 * pulse;

      if (activeGroup) {
        activeGroup.position.z += travel;
        activeGroup.traverse((part) => {
          if (part.userData.spin) part.rotation.z += dt * part.userData.spin;
          if (part.userData.pulse) { const scale = 1 + Math.sin(elapsed * 7) * .08; part.scale.setScalar(scale); }
        });
        const spatialProgress = clamp(((activeGroup.position.z - challengeStartZ) / (2 - challengeStartZ)) * 100);
        if (performance.now() - lastHud > 90) { setProgress(spatialProgress); lastHud = performance.now(); }
        if (!hit && activeGroup.position.z >= 2) {
          hit = true;
          laneRef.current = laneX.reduce((best, x, index) => Math.abs(player.position.x - x) < Math.abs(player.position.x - laneX[best]) ? index : best, 0) as Lane;
          resolveRef.current();
        }
        if (activeGroup.position.z > 17) removeChallenge();
      }

      const bg = scene.background as THREE.Color;
      bg.lerp(targetBackground, .025);
      scene.fog?.color.lerp(targetBackground, .025);
      if (!motionReducedRef.current) {
        const shake = impactShake > 0 ? (Math.random() - .5) * impactShake : 0;
        camera.position.x = Math.sin(elapsed * 1.7) * .08 + shake;
        camera.position.y = 6.35 + Math.sin(elapsed * 2.3) * .035 + shake * .35;
      } else { camera.position.x = 0; camera.position.y = 6.35; }
      impactShake = Math.max(0, impactShake - dt * 2.4);
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 3.5);
      camera.updateProjectionMatrix();
      camera.lookAt(0, 1.45, -18);
      renderer.render(scene, camera);
    };
    animate();
    return () => { engine.destroy(); engineRef.current = null; };
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing" || !engineRef.current) return;
    resolvingRef.current = false;
    engineRef.current.setWorld(stage.color, stage.accent);
    engineRef.current.setEnergy(stageIndex + 1, route);
    engineRef.current.spawnChallenge(challenge, stage.accent, speed);
  }, [challenge, route, screen, speed, stage.accent, stage.color, stageIndex]);

  const finishStage = useCallback((endFragments: number) => {
    const completed: StageStat = { name: stage.name, start: stageStartRef.current, end: endFragments, lost: stageLostRef.current, recovered: stageRecoveredRef.current, route: routeRef.current };
    statsRef.current = [...statsRef.current, completed];
    setStats(statsRef.current);
    return completed;
  }, [stage.name]);

  const resolveChallenge = useCallback(() => {
    if (resolvingRef.current || screen !== "playing") return;
    resolvingRef.current = true;
    const option = challenge.options[optionMapRef.current[laneRef.current]];

    if (isRoute) {
      const nextRoute = option.route ?? "balanced";
      const routeDelta = boostActiveRef.current ? Math.round(option.delta * .75) : option.delta;
      const nextFragments = clamp(fragmentsRef.current + routeDelta);
      const applied = nextFragments - fragmentsRef.current;
      const earnedPoints = pointsFor(option.delta, "route") * (boostActiveRef.current ? 2 : 1);
      fragmentsRef.current = nextFragments;
      scoreRef.current = Math.max(0, scoreRef.current + earnedPoints);
      routeRef.current = nextRoute;
      setFragments(nextFragments);
      setScore(scoreRef.current);
      setRoute(nextRoute);
      if (!boostActiveRef.current) { boostRef.current = Math.min(100, boostRef.current + 14); setBoostCharge(boostRef.current); }
      if (applied < 0) { stageLostRef.current += Math.abs(applied); setLostTotal((value) => value + Math.abs(applied)); }
      const record: DecisionRecord = { stage: stage.name, event: challenge.kicker, choice: option.label, detail: option.detail, delta: applied, points: earnedPoints, route: nextRoute };
      decisionsRef.current = [...decisionsRef.current, record];
      setDecisions(decisionsRef.current);
      setOutcome({ delta: applied, points: earnedPoints, combo: comboRef.current, text: `${option.label} · ${option.detail}` });
      engineRef.current?.triggerEffect(1, stage.accent);
      setGameEffect("boost"); window.setTimeout(() => setGameEffect(""), 360);
      setRadio(`픽셀: “${option.label}로 갈게! 멈추지 말고 다음 세계로!”`);
      if (nextFragments === 0) { terminateAtZero(); return; }
      nextTimerRef.current = window.setTimeout(() => {
        setOutcome(null);
        const completed = finishStage(nextFragments);
        const ending = stageEndings[stageIndex];
        reviewingRef.current = true;
        engineRef.current?.setPaused(true);
        setStageReview({ world: stage.name, ...ending, lost: completed.lost, recovered: completed.recovered, endFragments: nextFragments, startFragments: completed.start, stageScore: scoreRef.current - stageScoreStartRef.current, totalScore: scoreRef.current, story: stage.story });
        setRadio(`픽셀: “${ending.title}. 기록을 확인하면 다음 데이터로 갈 수 있어!”`);
      }, 420);
      return;
    }

    let delta = option.delta;
    if (routeRef.current === "fast") delta = delta < 0 ? Math.round(delta * 1.25) : Math.round(delta * .82);
    if (routeRef.current === "safe") delta = delta < 0 ? Math.round(delta * .72) : Math.round(delta * 1.2);
    if (boostActiveRef.current && delta < 0) delta = Math.round(delta * .75);
    const nextFragments = clamp(fragmentsRef.current + delta);
    const applied = nextFragments - fragmentsRef.current;
    const nextCombo = delta >= 0 ? Math.min(9, comboRef.current + 1) : 0;
    comboRef.current = nextCombo;
    const basePoints = pointsFor(delta, challenge.type);
    const routeScore = routeRef.current === "fast" ? (basePoints > 0 ? 1.35 : 1.2) : routeRef.current === "safe" ? (basePoints > 0 ? .8 : .7) : 1;
    const earnedPoints = Math.round(basePoints > 0 ? basePoints * (1 + nextCombo * .08) * routeScore * (boostActiveRef.current ? 2 : 1) : basePoints * routeScore);
    fragmentsRef.current = nextFragments;
    scoreRef.current = Math.max(0, scoreRef.current + earnedPoints);
    setFragments(nextFragments);
    setScore(scoreRef.current);
    setCombo(nextCombo);
    if (!boostActiveRef.current) {
      const bestDelta = Math.max(...challenge.options.map((item) => item.delta));
      const charge = option.delta === bestDelta ? 22 : option.delta >= 0 ? 8 : 0;
      boostRef.current = Math.min(100, boostRef.current + charge); setBoostCharge(boostRef.current);
    }
    if (applied < 0) { stageLostRef.current += Math.abs(applied); setLostTotal((value) => value + Math.abs(applied)); }
    if (applied > 0) { stageRecoveredRef.current += applied; setRecoveredTotal((value) => value + applied); }
    const record: DecisionRecord = { stage: stage.name, event: challenge.kicker, choice: option.label, detail: option.detail, delta: applied, points: earnedPoints };
    decisionsRef.current = [...decisionsRef.current, record];
    setDecisions(decisionsRef.current);
    setOutcome({ delta: applied, points: earnedPoints, combo: nextCombo, text: option.detail });
    engineRef.current?.triggerEffect(delta, stage.accent);
    setGameEffect(delta < 0 ? "hit" : "boost"); window.setTimeout(() => setGameEffect(""), 360);
    setRadio(applied < 0 ? `픽셀: “조각이 흩어졌어! ${option.detail}.”` : applied > 0 ? `루미: “좋아, ${option.detail}.”` : `픽셀: “${option.detail}. 계속 달리자!”`);

    if (nextFragments === 0) { terminateAtZero(); return; }

    nextTimerRef.current = window.setTimeout(() => {
      setOutcome(null);
      if (eventIndex < stage.events.length - 1) {
        setEventIndex((value) => value + 1);
      } else {
        if (stageIndex < stages.length - 1) {
          setIsRoute(true);
          setRadio("루미: “스테이지 마지막 갈림길이야. 지금 남은 조각을 보고 달리면서 골라!”");
        } else {
          const completed = finishStage(nextFragments);
          const ending = stageEndings[stageIndex];
          reviewingRef.current = true;
          engineRef.current?.setPaused(true);
          setStageReview({ world: stage.name, ...ending, lost: completed.lost, recovered: completed.recovered, endFragments: nextFragments, startFragments: completed.start, stageScore: scoreRef.current - stageScoreStartRef.current, totalScore: scoreRef.current, story: stage.story });
          setRadio(`픽셀: “${ending.title}. 마지막 기록을 확인해 줘!”`);
        }
      }
    }, 280);
  }, [challenge, eventIndex, finishStage, isRoute, screen, stage.events.length, stageIndex, terminateAtZero]);

  useEffect(() => { resolveRef.current = resolveChallenge; }, [resolveChallenge]);

  const startGame = () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    if (boostTimerRef.current) window.clearTimeout(boostTimerRef.current);
    laneRef.current = 1; fragmentsRef.current = 100; scoreRef.current = 0; comboRef.current = 0; boostRef.current = 0; boostActiveRef.current = false; routeRef.current = "balanced"; terminatingRef.current = false; reviewingRef.current = false;
    stageScoreStartRef.current = 0;
    stageStartRef.current = 100; stageLostRef.current = 0; stageRecoveredRef.current = 0; statsRef.current = []; decisionsRef.current = [];
    setFragments(100); setScore(0); setCombo(0); setBoostCharge(0); setBoostActive(false); setRoute("balanced"); setStageIndex(0); setEventIndex(0); setIsRoute(false); setProgress(0); setLostTotal(0); setRecoveredTotal(0); setStats([]); setDecisions([]); setOutcome(null); setStageEnding(null); setStageReview(null); setArcadeToast(null); setGameEffect(""); setRadio(stages[0].story); setChapterFlash(true); setWebglError(false); setResultStep(0); setPlayerName(""); setSubmitState("idle"); setSubmitMessage(""); setScreen("playing");
    window.setTimeout(() => setChapterFlash(false), 650);
  };

  const continueStage = () => {
    if (!stageReview) return;
    setStageReview(null);
    reviewingRef.current = false;
    if (stageIndex === stages.length - 1) {
      setScreen("result");
      return;
    }
    const nextStage = stageIndex + 1;
    stageStartRef.current = fragmentsRef.current;
    stageLostRef.current = 0;
    stageRecoveredRef.current = 0;
    stageScoreStartRef.current = scoreRef.current;
    setStageIndex(nextStage);
    setEventIndex(0);
    setIsRoute(false);
    setProgress(0);
    setChapterFlash(true);
    setRadio(stages[nextStage].story);
    engineRef.current?.setPaused(false);
    window.setTimeout(() => setChapterFlash(false), 650);
  };

  const grade = useMemo(() => {
    if (fragments >= 95) return { icon: "완벽", title: "마음이 온전히 도착했다", story: "영상이 끝까지 재생되자 하람은 웃다가 눈물을 닦았다. 픽셀은 마지막 조각 위에서 조용히 빛났다." };
    if (fragments >= 75) return { icon: "성공", title: "마음은 충분히 전해졌다", story: "영상은 한 번 끊겼지만 하람은 마지막 인사를 알아들었다. ‘멀리 있어도 우리는 연결되어 있어.’" };
    if (fragments >= 50) return { icon: "절반", title: "절반의 편지가 도착했다", story: "화면은 군데군데 깨졌지만 목소리는 남았다. 하람은 사라진 장면을 마음속으로 이어 붙였다." };
    if (fragments >= 25) return { icon: "조각", title: "몇 장면만 도착했다", story: "사진 몇 장과 웃음소리만 남았다. 하람이 메시지를 보냈다. ‘뒤에 뭐라고 했어?’" };
    if (fragments === 0) return { icon: "0", title: "전송이 완전히 끊겼다", story: "마지막 데이터 조각까지 사라지는 순간 게임이 종료됐다. 지나온 기록을 확인하고 더 안전한 경로로 다시 도전해 보자." };
    return { icon: "…", title: "세 점만 도착했다", story: "영상은 열리지 않았다. 하지만 픽셀은 사라지지 않았다. 다시 전송 버튼을 기다리며 작은 불빛으로 남았다." };
  }, [fragments]);

  const worstStage = stats.length ? stats.reduce((a, b) => a.lost > b.lost ? a : b) : null;
  const novel = useMemo(() => buildJourneyNovel(decisions, stats, fragments), [decisions, fragments, stats]);
  const feedback = useMemo(() => {
    const eventChoices = decisions.filter((item) => !item.route);
    const strongest = eventChoices.length ? eventChoices.reduce((a, b) => a.delta > b.delta ? a : b) : null;
    const riskiest = eventChoices.length ? eventChoices.reduce((a, b) => a.delta < b.delta ? a : b) : null;
    const safeRoutes = decisions.filter((item) => item.route === "safe").length;
    const fastRoutes = decisions.filter((item) => item.route === "fast").length;
    return [
      strongest ? { label: "가장 좋은 판단", title: `${strongest.stage} · ${strongest.choice}`, text: `${strongest.detail}. 조건을 읽고 전송에 유리한 길을 찾았습니다.` } : null,
      riskiest ? { label: "다시 생각할 판단", title: `${riskiest.stage} · ${riskiest.choice}`, text: `${riskiest.detail}. 다음에는 거리·간섭·혼잡 중 무엇이 원인이었는지 먼저 확인해 보세요.` } : null,
      { label: "경로 전략", title: fastRoutes > safeRoutes ? "속도를 우선한 주행" : safeRoutes > fastRoutes ? "안전을 우선한 주행" : "균형을 택한 주행", text: `빠른 길 ${fastRoutes}회, 안전한 길 ${safeRoutes}회였습니다. 조각이 많을 때는 짧은 길, 위태로울 때는 회복 기회가 많은 길이 유리합니다.` },
      { label: "다음 도전", title: worstStage ? `${worstStage.name}에서 손실 줄이기` : "조건을 끝까지 관찰하기", text: worstStage ? `${worstStage.name}에서 ${worstStage.lost}개를 잃었습니다. 이 세계의 표지판에서 감쇠·간섭·대역폭 조건을 다시 비교해 보세요.` : "각 표지판의 조건을 끝까지 읽고 경로를 선택해 보세요." },
    ].filter(Boolean) as { label: string; title: string; text: string }[];
  }, [decisions, worstStage]);

  const submitScore = async () => {
    const cleaned = playerName.trim();
    if (cleaned.length < 2 || cleaned.length > 12) {
      setSubmitState("error"); setSubmitMessage("이름은 2~12자로 입력해 주세요."); return;
    }
    try {
      setSubmitState("saving"); setSubmitMessage("");
      const response = await fetch("/api/leaderboard", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ playerName: cleaned, score, fragments, grade: grade.title }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "등록하지 못했습니다.");
      setSubmitState("saved"); setSubmitMessage("명예의 전당에 기록했습니다!");
      await loadLeaderboard();
    } catch (error) {
      setSubmitState("error"); setSubmitMessage(error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <main className={`signal-game ${motionReduced ? "reduced" : ""}`} style={{ "--accent": stage.accent, "--world": stage.color } as React.CSSProperties}
      onPointerDown={(event) => { if (screen === "playing" && !stageReview) pointerStartRef.current = event.clientX; }}
      onPointerUp={(event) => { if (screen !== "playing" || stageReview || pointerStartRef.current === null) return; const delta = event.clientX - pointerStartRef.current; if (Math.abs(delta) > 34) move(delta > 0 ? 1 : -1); pointerStartRef.current = null; }}>

      {screen === "intro" && <section className="story-intro">
        <header className="story-brand"><img className="brand-icon" src="/favicon.svg" alt="" /><div><b>시그널 러시</b><small>A THREE.JS STORY RUNNER</small></div></header>
        <div className="intro-story-copy">
          <div className="fight-title" aria-label="시그널 러시, 픽셀 대 전파 방해">
            <div className="title-burst" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <small>PIXEL <b>VS</b> INTERFERENCE</small>
            <h1><span>SIGNAL</span><i>×</i><em>RUSH</em></h1>
            <strong>시그널 러시</strong>
          </div>
          <p className="mission-tag">MISSION · 커지는 데이터의 조각 100개를 지켜라</p>
          <p>문자에서 이미지·음성·동영상·대용량 데이터·실시간 스트리밍까지. 데이터가 커질수록 코스도 길어집니다. 남은 조각이 0이 되면 전송은 즉시 끝납니다.</p>
          <button className="battle-start" onClick={startGame}><b>전송 배틀 시작</b><span>RUSH →</span></button>
          <small>방향키·A/D·스와이프로 이동 · 스페이스바로 충전된 부스트 사용</small>
        </div>
        <div className="pixel-portrait"><div className="portrait-glow" /><img src="/game/packet-squad.png" alt="귀여운 전송 요정 픽셀과 데이터 조각 친구들" /><div className="pixel-speech"><b>픽셀</b><span>“마지막 장면까지 내가 지킬게!”</span></div></div>
        <div className="story-route">{stages.map((item, index) => <div key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.payload}</b><small>{item.payloadSize} · {item.name}</small></div>)}</div>
        <aside className="honor-board"><div className="honor-title"><span>HALL OF SIGNAL</span><h2>명예의 전당</h2><small>점수 · 도착 조각 순</small></div><div className="honor-list">{leaderLoading ? <p>기록을 불러오는 중…</p> : leaderboard.length ? leaderboard.slice(0, 5).map((entry, index) => <div key={entry.id}><span>{index + 1}</span><b>{entry.player_name}</b><strong>{entry.score.toLocaleString()}점</strong><small>{entry.fragments}% 도착</small></div>) : <p>첫 번째 전송 기록의 주인공이 되어 보세요.</p>}</div></aside>
      </section>}

      {screen === "playing" && <section className={`live-runner energy-${stageIndex + 1} route-${route} ${gameEffect} ${boostActive ? "overdrive" : ""}`}>
        <div ref={mountRef} className="webgl-stage" aria-label="Three.js 3D 러너 게임 화면" />
        <div className="game-speed-lines" aria-hidden="true" /><div className="game-impact" aria-hidden="true" />
        <header className="live-topbar">
          <div className="live-brand"><img className="brand-icon" src="/favicon.svg" alt="" /><div><b>시그널 러시</b><small>PIXEL IS RUNNING</small></div></div>
          <div className="world-status"><small>CHAPTER {String(stageIndex + 1).padStart(2, "0")} · {stage.payloadSize}</small><b>{stage.payload}</b><span>{stage.name} · {stage.place} · {stage.distance}</span></div>
          <label className="live-motion"><span>흔들림 줄이기</span><Switch checked={motionReduced} onCheckedChange={setMotionReduced} aria-label="화면 흔들림 줄이기" /></label>
        </header>
        <div className={`fragment-hud ${fragments <= 20 ? "critical" : ""}`}><div><span>{stage.payload} 데이터</span><strong>{fragments}<small>/100</small></strong></div><div className="fragment-track"><i style={{ width: `${fragments}%` }} /></div><div className="payload-scale"><span>{stage.payloadSize}</span><b>관문당 {stage.courseSeconds.toFixed(1)}초</b></div><div className="run-score"><span>RUN SCORE</span><b>{score.toLocaleString()}</b></div><small>{routeName(route)} · {stage.lesson}</small></div>
        <div className="energy-hud"><small>DATA SCALE {String(stageIndex + 1).padStart(2, "0")}</small><strong>{stage.payload}</strong><div>{[0,1,2,3,4,5].map((item) => <i key={item} className={item <= stageIndex ? "on" : ""} />)}</div></div>
        {combo >= 2 && <div className="combo-hud"><span>CHAIN</span><strong>×{combo}</strong><small>연속 안정 전송</small></div>}
        <div className="challenge-hud"><span>STAGE {stageIndex + 1} · WAVE {courseIndex + 1}/{courseTotal} · {isRoute ? "ROUTE CHOICE" : challenge.kicker}</span><strong>{challenge.prompt}</strong><small>하나의 스테이지가 멈추지 않고 이어집니다</small><div className="approach-bar"><i style={{ width: `${progress}%` }} /></div><div className="stage-wave">{Array.from({ length: courseTotal }, (_, index) => <i key={index} className={index <= courseIndex ? "on" : ""} />)}</div></div>
        {chapterFlash && <div className="chapter-flash"><small>ROUND {String(stageIndex + 1).padStart(2, "0")} · {stage.payloadSize}</small><strong>{stage.payload}</strong><span>{stage.story}</span></div>}
        {outcome && <div className={`outcome-float ${outcome.delta < 0 ? "damage" : "recover"}`}><strong>{outcome.points > 0 ? "+" : ""}{outcome.points}점</strong><b>{outcome.delta > 0 ? `조각 +${outcome.delta}` : outcome.delta === 0 ? "조각 유지" : `조각 ${outcome.delta}`}</b>{outcome.combo >= 2 && <em>CHAIN ×{outcome.combo}</em>}<span>{outcome.text}</span></div>}
        {arcadeToast && <div className={`arcade-toast ${arcadeToast.kind}`}>{arcadeToast.text}</div>}
        {stageEnding && <div className={`stage-ending ending-${stageIndex + 1} ${stageEnding.code === "SIGNAL LOST" ? "ending-fail" : ""}`}><div className="ending-energy"><i /><i /><i /></div><small>{stageEnding.code === "SIGNAL LOST" ? "TRANSMISSION TERMINATED" : `CHAPTER ${String(stageIndex + 1).padStart(2, "0")} CLEAR`} · {stageEnding.code}</small><strong>{stageEnding.title}</strong><p>{stageEnding.line}</p><div><span>도착 조각 <b>{stageEnding.endFragments}</b></span><span>손실 <b>−{stageEnding.lost}</b></span><span>복구 <b>+{stageEnding.recovered}</b></span></div></div>}
        {stageReview && <div className={`stage-review review-stage-${stageIndex + 1}`} role="dialog" aria-modal="true" aria-labelledby="stage-review-title"><article><div className="review-kicker"><span>STAGE {String(stageIndex + 1).padStart(2, "0")} CLEAR</span><b>{stage.payload} · {stage.payloadSize}</b></div><h1 id="stage-review-title">{stageReview.title}</h1><p className="stage-story">{stageReview.story} {stageReview.line}</p><div className="stage-score-grid"><div><span>스테이지 점수</span><strong>+{stageReview.stageScore.toLocaleString()}</strong></div><div><span>누적 점수</span><strong>{stageReview.totalScore.toLocaleString()}</strong></div><div><span>데이터 조각</span><strong>{stageReview.startFragments} → {stageReview.endFragments}</strong></div></div><div className="stage-balance"><span>잃은 조각 <b>−{stageReview.lost}</b></span><span>되찾은 조각 <b>+{stageReview.recovered}</b></span><span>선택한 경로 <b>{routeName(route)}</b></span></div><button onClick={continueStage}><span>{stageIndex < stages.length - 1 ? `다음 스테이지 · ${stages[stageIndex + 1].payload} ${stages[stageIndex + 1].payloadSize}` : "최종 전송 결과 보기"}</span><b>→</b></button><small>점수와 이야기를 확인한 뒤에만 다음 스테이지로 진행합니다.</small></article></div>}
        <div className="radio-line" aria-live="polite"><div className="radio-avatar">P</div><p><small>PIXEL RADIO</small>{radio}</p></div>
        <div className="live-controls"><button onClick={() => move(-1)} aria-label="왼쪽으로 이동"><span>←</span><small>왼쪽</small></button><button className={`boost-button ${boostCharge >= 100 ? "ready" : ""}`} onClick={activateBoost} disabled={boostCharge < 100 || boostActive} style={{ "--boost": `${boostCharge * 3.6}deg` } as React.CSSProperties} aria-label={`부스트 ${boostCharge}%`}><b>{boostActive ? "ON" : `${boostCharge}%`}</b><small>{boostActive ? "OVERDRIVE" : boostCharge >= 100 ? "BOOST!" : "충전"}</small></button><button onClick={() => move(1)} aria-label="오른쪽으로 이동"><small>오른쪽</small><span>→</span></button></div>
        {webglError && <div className="webgl-error"><strong>3D 화면을 시작하지 못했습니다.</strong><span>브라우저의 하드웨어 가속을 켠 뒤 다시 시도해 주세요.</span><button onClick={startGame}>다시 시도</button></div>}
      </section>}

      {screen === "result" && <section className="result-review">
        <header className="review-top"><div className="live-brand"><img className="brand-icon" src="/favicon.svg" alt="" /><div><b>전송 기록</b><small>THE JOURNEY IS YOUR STORY</small></div></div><div className="review-progress">{["점수", "나의 이야기", "피드백"].map((label, index) => <div key={label} className={resultStep >= index ? "active" : ""}><span>{index + 1}</span><b>{label}</b></div>)}</div></header>

        {resultStep === 0 && <article className="score-review">
          <div className="score-hero"><span className="ending-mark">{grade.icon}</span><small>FINAL RUN SCORE</small><strong>{score.toLocaleString()}</strong><em>점</em><h1>{grade.title}</h1><p>{grade.story}</p><button onClick={() => setResultStep(1)}>다음 · 나의 이야기 읽기 <span>→</span></button></div>
          <div className="score-report"><div className="friend-screen"><div className="friend-face">H</div><strong>{fragments < 25 ? "…" : "생일 축하해, 하람!"}</strong><span>{fragments >= 50 ? "멀리 있어도 우리는 연결되어 있어." : "사라진 장면을 복구하는 중…"}</span><i style={{ width: `${fragments}%` }} /></div><div className="score-numbers"><div><span>도착한 조각</span><b>{fragments}<small>/100</small></b></div><div><span>잃은 조각</span><b>−{lostTotal}</b></div><div><span>되찾은 조각</span><b>+{recoveredTotal}</b></div></div><h2>여섯 세계 전송 기록</h2><div className="ending-list">{stats.map((item, index) => <div key={item.name} className={worstStage?.name === item.name ? "worst" : ""}><span>{index + 1}</span><b>{item.name}</b><i><em style={{ width: `${item.end}%` }} /></i><small>{item.start} → {item.end}</small></div>)}</div></div>
        </article>}

        {resultStep === 1 && <article className="novel-review"><div className="novel-cover"><span>YOUR SIGNAL NOVEL</span><h1>픽셀과<br />여섯 개의 세계</h1><p>내가 고른 길로 완성된 단 하나의 전송 이야기</p><strong>{playerName || "이름 없는 전송자"}</strong></div><div className="novel-pages"><header><small>도착률 {fragments}% · {score.toLocaleString()}점</small><h2>지구 반대편으로 보낸 마음</h2></header>{novel.map((paragraph, index) => <p key={index} className={index === novel.length - 1 ? "novel-ending" : ""}>{paragraph}</p>)}<button onClick={() => setResultStep(2)}>다음 · 선택 피드백 보기 <span>→</span></button></div></article>}

        {resultStep === 2 && <article className="feedback-review"><div className="feedback-copy"><span>MISSION DEBRIEF</span><h1>다음 전송은<br /><em>더 멀리 갑니다.</em></h1><p>정답을 외우는 대신, 이번에 고른 조건과 결과를 연결해 보세요.</p><div className="feedback-grid">{feedback.map((item, index) => <div key={item.label}><span>{String(index + 1).padStart(2, "0")} · {item.label}</span><h2>{item.title}</h2><p>{item.text}</p></div>)}</div></div><aside className="final-actions"><div className="rank-card"><small>FINAL RECORD</small><strong>{score.toLocaleString()}<em>점</em></strong><span>{fragments}% 도착 · {grade.icon}</span></div><div className="honor-submit"><h2>명예의 전당에 기록하기</h2><p>수업에서 알아볼 수 있는 이름이나 별명을 입력하세요.</p><div><input value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 12))} placeholder="이름 또는 별명" aria-label="명예의 전당 이름" disabled={submitState === "saved"} /><button onClick={submitScore} disabled={submitState === "saving" || submitState === "saved"}>{submitState === "saving" ? "기록 중…" : submitState === "saved" ? "기록 완료" : "등록"}</button></div>{submitMessage && <small className={submitState}>{submitMessage}</small>}</div><div className="final-leaderboard"><h2>명예의 전당 TOP 5</h2>{leaderboard.length ? leaderboard.slice(0, 5).map((entry, index) => <div key={entry.id} className={entry.player_name === playerName.trim() && entry.score === score ? "mine" : ""}><span>{index + 1}</span><b>{entry.player_name}</b><strong>{entry.score.toLocaleString()}</strong><small>{entry.fragments}%</small></div>) : <p>아직 등록된 기록이 없습니다.</p>}</div><button className="retry-button" onClick={startGame}>점수·이야기·피드백 확인 완료<br /><b>픽셀과 다시 달리기 ↻</b></button></aside></article>}
      </section>}
    </main>
  );
}
