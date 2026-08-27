"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";

type Lane = 0 | 1 | 2;
type RouteMode = "balanced" | "fast" | "safe";
type Screen = "intro" | "stageIntro" | "playing" | "route" | "result";
type EventOption = { label: string; detail: string; delta: number };
type TrackEvent = { type: "gate" | "hazard" | "attenuation" | "booster" | "bottleneck" | "recovery"; kicker: string; prompt: string; options: [EventOption, EventOption, EventOption] };
type Stage = { emoji: string; name: string; place: string; lesson: string; color: string; accent: string; distance: string; events: TrackEvent[] };
type StageStat = { name: string; start: number; end: number; lost: number; recovered: number; route: RouteMode };

const E = (type: TrackEvent["type"], kicker: string, prompt: string, options: [EventOption, EventOption, EventOption]): TrackEvent => ({ type, kicker, prompt, options });
const O = (label: string, detail: string, delta: number): EventOption => ({ label, detail, delta });

const stages: Stage[] = [
  {
    emoji: "📱", name: "내 방", place: "휴대폰 → 공유기", lesson: "가까운 거리도 벽과 전자기기의 간섭을 받아요.", color: "#061d2b", accent: "#4fffd2", distance: "12 m",
    events: [
      E("gate", "갈림 게이트", "공유기까지 어떤 신호를 탈까?", [O("5GHz 직선", "빠르고 선명", 9), O("벽 두 개", "신호 감쇠", -13), O("2.4GHz 우회", "멀리까지 안정", 5)]),
      E("hazard", "전파 간섭", "전자레인지가 켜졌다! 빈 통로로 피하자.", [O("책상 아래", "간섭 회피", 0), O("전자레인지", "강한 간섭", -18), O("문 쪽", "약한 간섭", -4)]),
      E("booster", "신호 증폭", "공유기의 가장 강한 신호를 잡아라.", [O("구석", "신호 약함", -5), O("공유기 정면", "조각 회복", 12), O("닫힌 문", "벽 감쇠", -7)]),
    ],
  },
  {
    emoji: "🏙", name: "도시", place: "광케이블 → 교환기", lesson: "빠른 길도 사용자가 몰리면 대역폭 병목이 생겨요.", color: "#160d31", accent: "#a884ff", distance: "28 km",
    events: [
      E("bottleneck", "대역폭 병목", "퇴근 시간, 어느 통로가 덜 붐빌까?", [O("상업 지구", "트래픽 폭주", -14), O("전용 회선", "넓은 대역폭", 7), O("주택가", "보통 혼잡", -6)]),
      E("hazard", "공사 구간", "끊어진 케이블을 피해 우회하자.", [O("지하 관로", "안전", 0), O("굴착 현장", "케이블 손상", -17), O("옆 교환기", "짧은 우회", -3)]),
      E("booster", "교환기 부스터", "가장 가까운 교환기에서 신호를 보강하자.", [O("구형 장비", "소폭 회복", 5), O("혼잡 회선", "대기 발생", -8), O("새 교환기", "강한 증폭", 13)]),
    ],
  },
  {
    emoji: "☁️", name: "데이터센터", place: "서버 보관 → 복제", lesson: "서버와 캐시는 잃은 정보를 다시 보내 줄 수 있어요.", color: "#071834", accent: "#62bdff", distance: "1,420 km",
    events: [
      E("bottleneck", "서버 대기열", "요청이 몰렸다. 비어 있는 서버를 찾자.", [O("서버 A", "대기 82%", -10), O("서버 B", "대기 14%", 4), O("서버 C", "점검 중", -15)]),
      E("recovery", "캐시 발견", "영상 사본이 남아 있는 캐시를 선택하자.", [O("오래된 캐시", "일부 복구", 7), O("빈 캐시", "사본 없음", 0), O("최신 캐시", "조각 재전송", 18)]),
      E("recovery", "서버 복제", "중복 저장된 영상 조각을 합치자.", [O("원본 서버", "일반 복구", 9), O("복제 서버", "대량 복구", 16), O("백업 대기", "시간 지연", -5)]),
    ],
  },
  {
    emoji: "🌊", name: "바다", place: "해저 케이블", lesson: "인터넷의 대부분은 위성이 아니라 바다 밑 케이블을 지나가요.", color: "#001927", accent: "#00d9ff", distance: "10,248 km",
    events: [
      E("attenuation", "긴 감쇠 구간", "1만 km 해저 케이블. 중계기가 가까운 선로는?", [O("깊은 해구", "긴 무중계 구간", -15), O("중계 선로", "감쇠 최소", -5), O("우회 케이블", "거리 증가", -11)]),
      E("hazard", "해저 사고", "어선의 닻이 떨어진다!", [O("바위 지대", "지진 위험", -9), O("닻 낙하", "케이블 손상", -22), O("보호 관로", "안전 통과", 0)]),
      E("booster", "해저 중계기", "약해진 빛 신호를 다시 키우자.", [O("고장 중계기", "증폭 실패", -7), O("광 증폭기", "강한 회복", 17), O("낡은 중계기", "약한 회복", 6)]),
      E("attenuation", "대양 횡단", "마지막 장거리 구간을 견뎌라.", [O("직선 케이블", "짧은 감쇠", -7), O("남쪽 우회", "긴 감쇠", -14), O("북쪽 우회", "중간 감쇠", -10)]),
    ],
  },
  {
    emoji: "🛰️", name: "하늘", place: "위성 중계", lesson: "위성은 멀리 돌아가고, 폭우와 각도에 영향을 받아요.", color: "#130c2e", accent: "#ff88ef", distance: "35,786 km",
    events: [
      E("attenuation", "우주 감쇠", "가장 짧은 위성 경로를 골라라.", [O("저궤도", "짧은 거리", -6), O("정지궤도", "아주 먼 거리", -16), O("반대 궤도", "긴 우회", -12)]),
      E("hazard", "날씨 간섭", "폭우 구름이 몰려온다.", [O("맑은 하늘", "깨끗한 신호", 0), O("먹구름", "약한 감쇠", -8), O("폭우", "강한 감쇠", -21)]),
      E("gate", "위성 각도", "지상 안테나와 맞는 각도를 찾자.", [O("18°", "각도 불일치", -12), O("42°", "정확히 정렬", 12), O("77°", "부분 연결", -3)]),
    ],
  },
  {
    emoji: "🏘️", name: "친구 동네", place: "기지국 → 친구 폰", lesson: "마지막 연결과 재전송이 편지의 완성도를 결정해요.", color: "#192113", accent: "#cfff68", distance: "2.6 km",
    events: [
      E("gate", "마지막 기지국", "친구 집까지 가장 안정적인 연결은?", [O("혼잡 Wi-Fi", "접속자 많음", -10), O("5G 기지국", "빠른 연결", 10), O("약한 LTE", "신호 부족", -6)]),
      E("hazard", "골목 장애물", "높은 건물이 신호를 가린다.", [O("건물 뒤", "신호 차단", -14), O("큰길", "시야 확보", 0), O("지하 주차장", "강한 감쇠", -18)]),
      E("recovery", "마지막 재전송", "도착 직전, 잃은 조각을 한 번 더 요청하자.", [O("건너뛰기", "바로 재생", 0), O("부분 요청", "일부 복구", 8), O("전체 확인", "최대 복구", 15)]),
    ],
  },
];

const eventNames: Record<TrackEvent["type"], string> = { gate: "갈림 게이트", hazard: "피해야 할 것", attenuation: "감쇠 구간", booster: "부스터", bottleneck: "좁은 관문", recovery: "복구 지점" };
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const routeLabel = (route: RouteMode) => route === "fast" ? "빠른 길" : route === "safe" ? "안전한 길" : "기본 경로";
const eventAsset = (type: TrackEvent["type"]) => type === "hazard" || type === "bottleneck" ? "/game/interference-cluster.png" : "/game/relay-booster.png";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [stageIndex, setStageIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);
  const [lane, setLane] = useState<Lane>(1);
  const [fragments, setFragments] = useState(100);
  const [progress, setProgress] = useState(100);
  const [motionReduced, setMotionReduced] = useState(false);
  const [route, setRoute] = useState<RouteMode>("balanced");
  const [stats, setStats] = useState<StageStat[]>([]);
  const [lostTotal, setLostTotal] = useState(0);
  const [recoveredTotal, setRecoveredTotal] = useState(0);
  const [flash, setFlash] = useState<{ delta: number; label: string } | null>(null);
  const [lastChoice, setLastChoice] = useState("");
  const stageStart = useRef(100);
  const stageLost = useRef(0);
  const stageRecovered = useRef(0);
  const resolved = useRef(false);
  const laneRef = useRef<Lane>(1);
  const fragmentsRef = useRef(100);
  const stage = stages[stageIndex];
  const currentEvent = stage.events[eventIndex];
  const effectiveDuration = route === "fast" ? 5000 : route === "safe" ? 8000 : 6500;

  const adjustedDelta = useCallback((raw: number) => {
    if (route === "fast") return raw < 0 ? Math.round(raw * 1.25) : Math.round(raw * .8);
    if (route === "safe") return raw < 0 ? Math.round(raw * .72) : Math.round(raw * 1.2);
    return raw;
  }, [route]);

  const finishEvent = useCallback(() => {
    if (resolved.current || screen !== "playing") return;
    resolved.current = true;
    const choice = currentEvent.options[laneRef.current];
    const delta = adjustedDelta(choice.delta);
    const currentFragments = fragmentsRef.current;
    const nextFragments = clamp(currentFragments + delta);
    const applied = nextFragments - currentFragments;
    if (applied < 0) { setLostTotal(v => v + Math.abs(applied)); stageLost.current += Math.abs(applied); }
    else if (applied > 0) { setRecoveredTotal(v => v + applied); stageRecovered.current += applied; }
    fragmentsRef.current = nextFragments;
    setFragments(nextFragments);
    setLastChoice(choice.label);
    setFlash({ delta: applied, label: choice.detail });
    window.setTimeout(() => {
      setFlash(null);
      if (eventIndex < stage.events.length - 1) {
        setEventIndex(v => v + 1); setProgress(100); resolved.current = false;
      } else {
        setStats(prev => [...prev, { name: stage.name, start: stageStart.current, end: nextFragments, lost: stageLost.current, recovered: stageRecovered.current, route }]);
        setScreen(stageIndex === stages.length - 1 ? "result" : "route");
      }
    }, motionReduced ? 850 : 1150);
  }, [adjustedDelta, currentEvent, eventIndex, motionReduced, route, screen, stage.events.length, stage.name, stageIndex]);

  useEffect(() => {
    if (screen !== "playing") return;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const next = Math.max(0, 100 - ((performance.now() - started) / effectiveDuration) * 100);
      setProgress(next);
      if (next <= 0) { window.clearInterval(timer); finishEvent(); }
    }, 40);
    return () => window.clearInterval(timer);
  }, [effectiveDuration, eventIndex, finishEvent, screen]);

  const move = useCallback((direction: -1 | 1) => setLane(current => {
    const next = clamp(current + direction) as Lane;
    laneRef.current = next;
    return next;
  }), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (screen !== "playing") return;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(-1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, screen]);

  const startStage = () => {
    const entryLoss = route === "fast" ? 3 : route === "safe" ? 8 : 0;
    stageStart.current = fragments; stageLost.current = entryLoss; stageRecovered.current = 0;
    if (entryLoss) {
      const next = clamp(fragmentsRef.current - entryLoss);
      fragmentsRef.current = next;
      setFragments(next);
      setLostTotal(v => v + entryLoss);
    }
    setEventIndex(0); laneRef.current = 1; setLane(1); setProgress(100); resolved.current = false; setScreen("playing");
  };
  const chooseRoute = (choice: RouteMode) => { setRoute(choice); setStageIndex(v => v + 1); setScreen("stageIntro"); };
  const restart = () => {
    setScreen("intro"); setStageIndex(0); setEventIndex(0); laneRef.current = 1; setLane(1); fragmentsRef.current = 100; setFragments(100); setProgress(100); setRoute("balanced"); setStats([]); setLostTotal(0); setRecoveredTotal(0); setFlash(null); setLastChoice("");
    stageStart.current = 100; stageLost.current = 0; stageRecovered.current = 0; resolved.current = false;
  };
  const grade = useMemo(() => {
    if (fragments >= 95) return { icon: "🏆", title: "완벽한 전송", story: "영상이 끝까지 재생된다. 친구가 웃다가 운다." };
    if (fragments >= 75) return { icon: "🥇", title: "거의 다 도착", story: "영상이 한 번 끊겼다가 이어진다. 친구는 다 알아들었다." };
    if (fragments >= 50) return { icon: "🥈", title: "절반의 편지", story: "소리만 들리고 화면은 군데군데 깨져 있다." };
    if (fragments >= 25) return { icon: "🥉", title: "조각난 편지", story: "사진 몇 장만 떴다. 친구가 되묻는다. “뒤에 뭐라고 했어?”" };
    return { icon: "💔", title: "닿지 못했다", story: "친구의 화면에는 … 세 점만 도착했다." };
  }, [fragments]);
  const worstStage = stats.length ? stats.reduce((a, b) => a.lost > b.lost ? a : b) : null;

  return (
    <main className={`game-shell ${motionReduced ? "reduce-motion" : ""}`} style={{ "--world": stage.color, "--accent": stage.accent } as React.CSSProperties}>
      <header className="topbar">
        <div className="brand" aria-label="시그널 러시"><span className="brand-mark">SR</span><span><b>시그널 러시</b><small>VIDEO LETTER PROTOCOL</small></span></div>
        <label className="motion-toggle"><span>화면 흔들림 줄이기</span><Switch checked={motionReduced} onCheckedChange={setMotionReduced} aria-label="화면 흔들림 줄이기" className="motion-switch" /></label>
      </header>

      {screen === "intro" && <section className="intro-screen">
        <div className="intro-copy">
          <p className="eyebrow">지구 반대편까지 · 6개의 세계 · 1개의 영상 편지</p>
          <h1>네가 지키는 만큼,<br /><em>마음이 도착한다.</em></h1>
          <p className="intro-lead">전학 간 친구의 생일. 영상 편지를 이루는 정보 조각 100개가 지금 출발합니다. 경로를 고르고 간섭을 피해서, 가능한 많은 조각을 친구의 폰까지 보내세요.</p>
          <div className="intro-actions"><button className="primary-button" onClick={() => setScreen("stageIntro")}>전송 시작 <span>→</span></button><span className="key-guide"><kbd>←</kbd><kbd>→</kbd> 또는 화면 버튼으로 이동</span></div>
        </div>
        <div className="transmission-card" aria-label="전송 미리보기"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="earth-core"><span className="friend-pin">친구</span><span className="home-pin">나</span><i className="signal-dot" /></div><div className="packet-readout"><span>출발 정보량</span><strong>100<small>조각</small></strong><div className="packet-line"><i /></div></div></div>
        <div className="world-strip" aria-label="여섯 세계">{stages.map((item, index) => <div key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><b>{item.emoji} {item.name}</b><small>{item.place}</small></div>)}</div>
      </section>}

      {screen === "stageIntro" && <section className="chapter-screen">
        <div className="chapter-number">CHAPTER {String(stageIndex + 1).padStart(2, "0")}</div><div className="chapter-symbol">{stage.emoji}</div><h1>{stage.name}</h1><p className="chapter-place">{stage.place} · {stage.distance}</p><p className="chapter-lesson">{stage.lesson}</p>
        {route !== "balanced" && <div className={`route-badge ${route}`}>{routeLabel(route)} 선택 · 진입 감쇠 {route === "fast" ? "−3" : "−8"}</div>}
        <button className="primary-button" onClick={startStage}>이 세계로 진입 <span>→</span></button><div className="chapter-progress">{stages.map((item, index) => <i key={item.name} className={index <= stageIndex ? "active" : ""} />)}</div>
      </section>}

      {screen === "playing" && <section className={`runner-screen ${flash && flash.delta < 0 ? "impact" : ""}`}>
        <div className="hud"><div className="hud-chapter"><span>{stage.emoji}</span><div><small>CH {stageIndex + 1} · {stage.place}</small><strong>{stage.name}</strong></div></div><div className="fragment-meter"><div><span>도착 중인 정보</span><strong>{fragments}<small>/100 조각</small></strong></div><div className="meter-track"><i style={{ width: `${fragments}%` }} /></div></div><div className="route-mini"><small>현재 경로</small><strong>{routeLabel(route)}</strong></div></div>
        <div className="event-banner"><span>{eventNames[currentEvent.type]} · 상황을 읽고 판단하세요</span><strong>{currentEvent.prompt}</strong><small>효과는 통과한 뒤에 공개됩니다</small><div className="decision-timer"><i style={{ width: `${progress}%` }} /></div></div>
        <div className="runner-viewport"><div className="world-label">{stage.emoji} {currentEvent.kicker}</div><div className="horizon-glow" /><div className="track-grid"><div className="center-line one" /><div className="center-line two" /></div>
          <div className="gate-row" style={{ "--approach": `${progress}` } as React.CSSProperties}>{currentEvent.options.map((option, index) => <div key={option.label} className={`gate-card ${lane === index ? "selected" : ""}`}><div className="choice-formation"><img src={eventAsset(currentEvent.type)} alt="" /><i /><i /><i /></div><strong>{option.label}</strong><small>결과 비공개</small></div>)}</div>
          <div className={`signal-runner lane-${lane}`}><img src="/game/packet-squad.png" alt="영상 편지를 나르는 데이터 조각 팀" /><span>영상 편지</span></div>{flash && <div className={`result-flash ${flash.delta >= 0 ? "good" : "bad"}`}><strong>{flash.delta > 0 ? `+${flash.delta}` : flash.delta === 0 ? "안전 통과" : flash.delta}</strong><span>{flash.label} · {lastChoice}</span></div>}
        </div>
        <div className="runner-controls"><button onClick={() => move(-1)} disabled={lane === 0} aria-label="왼쪽으로 이동">←<span>왼쪽</span></button><p>빛나는 정보 덩어리를<br /><strong>원하는 통로로 이동</strong></p><button onClick={() => move(1)} disabled={lane === 2} aria-label="오른쪽으로 이동"><span>오른쪽</span>→</button></div>
      </section>}

      {screen === "route" && <section className="route-screen">
        <div className="route-context"><span>{stage.emoji} CHAPTER {stageIndex + 1} 통과</span><strong>{fragments}개의 정보 조각이 남았다.</strong><p>{stageIndex === 2 ? "바다 앞이다. 케이블은 짧고 곧지만 어선이 많다." : `${stages[stageIndex + 1].name}로 향하는 두 경로가 열렸다. 지금 가진 조각을 보고 판단하자.`}</p></div><h1>다음 경로를 선택하세요</h1>
        <div className="route-cards"><button className="route-card fast" onClick={() => chooseRoute("fast")}><div className="route-icon">⚡</div><span>FAST ROUTE</span><h2>빠른 길</h2><p>거리가 짧아 진입 감쇠는 적지만, 판단 시간이 짧고 충돌 피해가 커집니다.</p><ul><li><b>−3</b> 진입 감쇠</li><li><b>5초</b> 판단 시간</li><li><b>×1.25</b> 장애물 피해</li></ul><em>조각이 넉넉할 때 유리 →</em></button>
          <button className="route-card safe" onClick={() => chooseRoute("safe")}><div className="route-icon">🛡️</div><span>SAFE ROUTE</span><h2>안전한 길</h2><p>멀리 돌아 진입 감쇠는 크지만, 중계기가 많고 장애물 피해가 작습니다.</p><ul><li><b>−8</b> 진입 감쇠</li><li><b>8초</b> 판단 시간</li><li><b>×1.2</b> 회복 효과</li></ul><em>조각이 위태로울 때 유리 →</em></button></div><p className="route-hint">정답은 하나가 아닙니다. 현재 정보량과 다음 세계의 성격을 함께 보세요.</p>
      </section>}

      {screen === "result" && <section className="result-screen">
        <div className="result-hero"><div className="final-video" aria-label={`영상 편지 ${fragments}% 복구 화면`}><div className="video-top"><span>수신한 영상 편지</span><i>● RECOVERED {fragments}%</i></div><div className="mosaic">{Array.from({ length: 20 }).map((_, index) => <i key={index} className={index < Math.round(fragments / 5) ? "visible" : "broken"} style={{ "--delay": `${index * .04}s` } as React.CSSProperties} />)}<div className="friend-message"><span>🎂</span><strong>{fragments < 25 ? "…" : "생일 축하해!"}</strong><small>{fragments >= 50 ? "멀리 있어도 우리는 연결되어 있어." : "신호를 복구하는 중…"}</small></div></div></div>
          <div className="grade-card"><span className="grade-icon">{grade.icon}</span><p>도착률 {fragments}%</p><h1>{grade.title}</h1><blockquote>{grade.story}</blockquote><div className="result-numbers"><div><span>잃은 조각</span><b>−{lostTotal}</b></div><div><span>되찾은 조각</span><b>+{recoveredTotal}</b></div></div></div></div>
        <div className="journey-report"><div className="report-title"><div><span>전송 경로 되짚기</span><h2>정보는 어디서 가장 많이 사라졌을까?</h2></div><p>총 이동 거리 <b>약 47,000 km</b></p></div><div className="journey-list">{stats.map((item, index) => <div key={item.name} className={worstStage?.name === item.name ? "worst" : ""}><span className="journey-node">{stages[index].emoji}</span><div className="journey-name"><small>CH {index + 1}</small><strong>{item.name}</strong><em>{routeLabel(item.route)}</em></div><div className="journey-bar"><i style={{ width: `${item.end}%` }} /><span>{item.start} → {item.end}</span></div><div className="journey-delta"><b>−{item.lost}</b><em>+{item.recovered}</em></div></div>)}</div>{worstStage && <p className="learning-note"><span>발견!</span> 가장 많이 잃은 곳은 <b>{worstStage.name}</b>입니다. 거리·간섭·대역폭 중 어떤 원인이었는지 경로를 떠올려 보세요.</p>}</div>
        <div className="result-footer"><p>네 편지는 바다 밑 1만 km와 여섯 개의 통신 세계를 지나 친구에게 도착했습니다.</p><button className="primary-button" onClick={restart}>다시 전송하기 <span>↻</span></button></div>
      </section>}
    </main>
  );
}
