import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Tv,
  Award,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Target,
  FileText,
  Goal,
  Flag,
  AlertTriangle,
  Flame,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SimulationMeta {
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  refereeName: string;
  finalScore: string;
  totalShotsHome?: number;
  totalShotsAway?: number;
  possessionHome?: number;
  possessionAway?: number;
}

interface TimelineEvent {
  minute: number;
  half: "first" | "second" | string;
  speaker: "Agent 1" | "Agent 2" | "Agent 3" | string;
  speakerName: string;
  type: "kickoff" | "neutral" | "attack_home" | "attack_away" | "foul" | "card" | "goal_home" | "goal_away" | "save" | "substitution" | "whistle" | string;
  title: string;
  content: string;
  currentHomeScore: number;
  currentAwayScore: number;
}

interface SimulationData {
  simulationMeta: SimulationMeta;
  timeline: TimelineEvent[];
}

const PRESET_MOCKUPS = [
  {
    home: "阿根廷 (Agent 2)",
    away: "法國 (Agent 3)",
    topic: "重温卡塔爾世界盃巔峰對決，王者傳承之戰，攻防與神仙波互拉",
  },
  {
    home: "曼城 (Agent 2)",
    away: "皇家馬德里 (Agent 3)",
    topic: "歐聯準決賽兩回合縮影，極致傳控狂狂狂攻對決歐聯之王的閃電反擊防反",
  },
  {
    home: "利物浦 (Agent 2)",
    away: "曼聯 (Agent 3)",
    topic: "雙紅經典大戰，安菲爾德球場的史詩壓迫對決紅魔堅毅防守防反",
  },
];

export function generateLocalOfflineSimulation(hTeam: string, aTeam: string, topic: string): SimulationData {
  return {
    simulationMeta: {
      homeTeam: hTeam,
      awayTeam: aTeam,
      stadium: "智能防震模擬體育場 (離線備用)",
      refereeName: "Agent 1 (即時直播裁判官)",
      finalScore: "2 - 1",
      totalShotsHome: 15,
      totalShotsAway: 9,
      possessionHome: 56,
      possessionAway: 44
    },
    timeline: [
      {
        minute: 1,
        half: "first",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "kickoff",
        title: "大戰揭幕！哨音響起",
        content: `各位球迷觀眾朋友好！歡迎來到這場令人血脈賁張的經典重賽！主隊「${hTeam}」迎戰客隊「${aTeam}」。本場核心研判主題是：${topic}！主裁哨音響起，這場戰術與數據的終極對弈正式開打！`,
        currentHomeScore: 0,
        currentAwayScore: 0
      },
      {
        minute: 8,
        half: "first",
        speaker: "Agent 2",
        speakerName: `Agent 2 ${hTeam}攻勢意識體`,
        type: "attack_home",
        title: "高位猛攻，邊路撕裂傳中",
        content: `第一波試探性猛攻！${hTeam} 右路快速下底、大斜度吊傳，對準 ${aTeam} 肋部防線重錘，中路插上頭球攻門！差一點點越過門線！`,
        currentHomeScore: 0,
        currentAwayScore: 0
      },
      {
        minute: 15,
        half: "first",
        speaker: "Agent 3",
        speakerName: `Agent 3 ${aTeam}防反意識體`,
        type: "attack_away",
        title: "精準攔截，發動教科書式快速掠奪",
        content: `${aTeam} 防線展現極具進攻侵略性的中路大巴！成功卡死 ${hTeam} 邊路出球後迅速發動大腳身後反擊，前鋒直接挑射偏出！`,
        currentHomeScore: 0,
        currentAwayScore: 0
      },
      {
        minute: 22,
        half: "first",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "foul",
        title: "中場肉搏戰，人仰馬翻吹罰犯規",
        content: `兩隊中場白刃戰！一次激烈包夾鏟球，${aTeam} 中場被放倒在地，主裁判哨音響起，警告了主隊防守隊員。黃牌警告邊緣！`,
        currentHomeScore: 0,
        currentAwayScore: 0
      },
      {
        minute: 28,
        half: "first",
        speaker: "Agent 3",
        speakerName: `Agent 3 ${aTeam}防守大師`,
        type: "save",
        title: "門線立功！史詩級反攻撲救",
        content: "主隊一記任意球直接奔向死角，客隊門將騰空而起，單掌將球託出球門！這絕對是史詩級防守，力保大門不失！",
        currentHomeScore: 0,
        currentAwayScore: 0
      },
      {
        minute: 37,
        half: "first",
        speaker: "Agent 2",
        speakerName: `Agent 2 ${hTeam}核心狂攻`,
        type: "goal_home",
        title: "漂亮！主隊經典世界波首開紀錄 ⚽",
        content: `進球了！！！中路精妙短傳配合，${hTeam} 主力球員假動作扣過防守人，在禁區外起腳突施冷箭！皮球直接掛網底！主隊支持者全場歡呼！`,
        currentHomeScore: 1,
        currentAwayScore: 0
      },
      {
        minute: 45,
        half: "first",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "whistle",
        title: "半場戰罷！哨音吹響",
        content: `上半場傷停補時一分鐘結束，主裁判吹響半場哨音！目前主隊 1 - 0 領先。下半場戰術調整將更精彩！`,
        currentHomeScore: 1,
        currentAwayScore: 0
      },
      {
        minute: 46,
        half: "second",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "kickoff",
        title: "下半場開戰！戰火重燃",
        content: "下半場易邊再戰！目前主隊落實 1-0 優勢。客隊勢必發動更具威脅的前場壓迫！",
        currentHomeScore: 1,
        currentAwayScore: 0
      },
      {
        minute: 54,
        half: "second",
        speaker: "Agent 2",
        speakerName: `Agent 2 ${hTeam}強攻`,
        type: "substitution",
        title: "主隊搶佔先機，主動對位換人",
        content: "主隊率先做出換人調整，換下一名防守後腰，鞏固中場防線厚度，應對即將到來的高位空投轟炸。",
        currentHomeScore: 1,
        currentAwayScore: 0
      },
      {
        minute: 60,
        half: "second",
        speaker: "Agent 3",
        speakerName: `Agent 3 ${aTeam}防反`,
        type: "card",
        title: "戰術犯規！客隊防衛官怒領黃牌",
        content: "主隊前鋒得球後高速突衛，迫使客隊回追的防衛隊員不得不拉拽戰術犯規，主裁判果斷出示黃牌警告！",
        currentHomeScore: 1,
        currentAwayScore: 0
      },
      {
        minute: 68,
        half: "second",
        speaker: "Agent 3",
        speakerName: `Agent 3 ${aTeam}防反`,
        type: "goal_away",
        title: "冷靜大師！客隊偷襲反擊扳平 ⚽",
        content: `天啦！！！客隊真的扮豬吃老虎！趁主隊防線壓得過於靠前，${aTeam} 後防斷球後，兩腳傳遞一記精準長傳撕開主隊空檔！前鋒冷靜推射得手！`,
        currentHomeScore: 1,
        currentAwayScore: 1
      },
      {
        minute: 75,
        half: "second",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "neutral",
        title: "白熱化死鬥！場上充斥著火藥味",
        content: "比賽進入最後 15 分鐘，兩隊體能均達到臨界點。看台上球迷的吶喊聲地裂天崩！",
        currentHomeScore: 1,
        currentAwayScore: 1
      },
      {
        minute: 82,
        half: "second",
        speaker: "Agent 2",
        speakerName: `Agent 2 ${hTeam}熱血進攻`,
        type: "goal_home",
        title: "絕殺一擊！主隊門前鬼魅墊射 ⚽",
        content: `神奇的第二球！！！主隊角球開出，混戰之中，${hTeam} 敏銳搶到落點將球推入網角！全場尖叫！主隊再度取得領先！`,
        currentHomeScore: 2,
        currentAwayScore: 1
      },
      {
        minute: 90,
        half: "second",
        speaker: "Agent 1",
        speakerName: "Agent 1 (主裁判兼聯網主播)",
        type: "whistle",
        title: "全場結束！主隊成功捍衛主場榮耀",
        content: `傷停補時順利完結！隨主裁判長哨響起，終局哨響！這場激情四射的比賽最終比分為 2 - 1。感謝各位支持足球辯論沙盤模擬！`,
        currentHomeScore: 2,
        currentAwayScore: 1
      }
    ]
  };
}

interface MatchSimulatorProps {
  initialHomeTeam?: string;
  initialAwayTeam?: string;
  initialFocusTopic?: string;
  autoTriggerKey?: string;
  provider?: string;
  model?: string;
}

export default function MatchSimulator({
  initialHomeTeam = "阿根廷",
  initialAwayTeam = "法國",
  initialFocusTopic = "傳統宿敵，互不相讓的防守反擊與高位逼搶對攻戰",
  autoTriggerKey = "",
  provider = "gemini",
  model = "gemini-1.5-flash"
}: MatchSimulatorProps) {
  const [homeTeam, setHomeTeam] = useState(initialHomeTeam);
  const [awayTeam, setAwayTeam] = useState(initialAwayTeam);
  const [focusTopic, setFocusTopic] = useState(initialFocusTopic);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Simulated match data
  const [simResults, setSimResults] = useState<SimulationData | null>(null);
  
  // Game Play states
  const [currentMin, setCurrentMin] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(300); // ms per simulated tick
  const [halfFilter, setHalfFilter] = useState<"all" | "first" | "second">("all");
  const [speakerFilter, setSpeakerFilter] = useState<"all" | "Agent 1" | "Agent 2" | "Agent 3">("all");
  
  const [goalShowcase, setGoalShowcase] = useState<string | null>(null);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  // Sync props and trigger autostart if autoTriggerKey changes
  useEffect(() => {
    if (initialHomeTeam) setHomeTeam(initialHomeTeam);
    if (initialAwayTeam) setAwayTeam(initialAwayTeam);
    if (initialFocusTopic) setFocusTopic(initialFocusTopic);

    if (autoTriggerKey) {
      const runTrigger = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        setSimResults(null);
        setCurrentMin(0);
        setIsPlaying(false);

        try {
          const response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              homeTeam: initialHomeTeam,
              awayTeam: initialAwayTeam,
              focusTopic: initialFocusTopic,
              provider: provider,
              model: model
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `模擬伺服器出錯 (${response.status})`);
          }

          const data = await response.json();
          setSimResults(data);
          
          setCurrentMin(0);
          setTimeout(() => {
            setIsPlaying(true);
          }, 500);

        } catch (e: any) {
          console.warn("Simulation API failed, falling back to offline simulation engine:", e);
          setErrorMsg("⚠️ 由於 API 在線連線受限，系統已無縫切換到『離線模擬引擎』為您即時跑完直播！");
          const fallbackSim = generateLocalOfflineSimulation(initialHomeTeam, initialAwayTeam, initialFocusTopic);
          setSimResults(fallbackSim);
          setCurrentMin(0);
          setTimeout(() => {
            setIsPlaying(true);
          }, 600);
        } finally {
          setIsLoading(false);
        }
      };
      runTrigger();
    }
  }, [autoTriggerKey, initialHomeTeam, initialAwayTeam, initialFocusTopic]);

  // Trigger auto scroll to bottom on new event
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMin, simResults]);

  // Clock mechanism
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && simResults) {
      timer = setInterval(() => {
        setCurrentMin((prev) => {
          const next = prev + 1;
          
          // Check if there is an event at this specific minute
          const event = simResults.timeline.find(e => e.minute === next);
          
          // If there is an event and it's a GOAL, trigger showcase overlay
          if (event) {
            if (event.type === "goal_home") {
              setGoalShowcase(`⚽ GOAL!!! ${simResults.simulationMeta.homeTeam} 進球了！ [比分 ${event.currentHomeScore} - ${event.currentAwayScore}]`);
              setTimeout(() => setGoalShowcase(null), 3000);
            } else if (event.type === "goal_away") {
              setGoalShowcase(`⚽ GOAL!!! ${simResults.simulationMeta.awayTeam} 進球了！ [比分 ${event.currentHomeScore} - ${event.currentAwayScore}]`);
              setTimeout(() => setGoalShowcase(null), 3000);
            }
          }

          if (next >= 90) {
            setIsPlaying(false);
            return 90;
          }
          return next;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simResults, playbackSpeed]);

  const handleStartSimulate = async () => {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setErrorMsg("請完整輸入主隊與客隊名稱");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSimResults(null);
    setCurrentMin(0);
    setIsPlaying(false);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam,
          awayTeam,
          focusTopic,
          provider: provider,
          model: model
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `模擬伺服器出錯 (${response.status})`);
      }

      const data = await response.json();
      setSimResults(data);
      
      // Auto start playback
      setCurrentMin(0);
      setTimeout(() => {
        setIsPlaying(true);
      }, 500);

    } catch (e: any) {
      console.warn("Manual Simulation API failed, invoking offline engine fallback:", e);
      setErrorMsg("⚠️ 由於 API 在線連線受限，系統已無縫切換到『離線模擬引擎』為您即時跑完直播！");
      const fallbackSim = generateLocalOfflineSimulation(homeTeam, awayTeam, focusTopic);
      setSimResults(fallbackSim);
      setCurrentMin(0);
      setTimeout(() => {
        setIsPlaying(true);
      }, 600);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPreset = (p: typeof PRESET_MOCKUPS[0]) => {
    // Strip agent text tags for API
    const cleanHome = p.home.replace(" (Agent 2)", "");
    const cleanAway = p.away.replace(" (Agent 3)", "");
    setHomeTeam(cleanHome);
    setAwayTeam(cleanAway);
    setFocusTopic(p.topic);
  };

  // Filtered timeline events to show based on clock tick
  const displayedEvents = simResults
    ? simResults.timeline
        .filter(e => e.minute <= currentMin)
        .filter(e => {
          if (halfFilter === "first") return e.minute <= 45;
          if (halfFilter === "second") return e.minute > 45;
          return true;
        })
        .filter(e => {
          if (speakerFilter === "all") return true;
          return e.speaker === speakerFilter;
        })
    : [];

  // Current real-time score during simulation based on current min
  const getCurrentScore = () => {
    if (!simResults) return { home: 0, away: 0 };
    const pastEvents = simResults.timeline.filter(e => e.minute <= currentMin);
    if (pastEvents.length === 0) return { home: 0, away: 0 };
    // fetch scores from last event
    const lastEvent = pastEvents[pastEvents.length - 1];
    return {
      home: lastEvent.currentHomeScore,
      away: lastEvent.currentAwayScore
    };
  };

  const scores = getCurrentScore();

  // Find latest active event to show what is happening in stylized field
  const getLatestActiveEvent = () => {
    if (!simResults) return null;
    const history = simResults.timeline.filter(e => e.minute <= currentMin);
    return history.length > 0 ? history[history.length - 1] : null;
  };

  const latestEvent = getLatestActiveEvent();

  // Color coordinate maps for speaker badges
  const getSpeakerStyle = (speaker: string) => {
    if (speaker === "Agent 1") {
      return {
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        label: "Agent 1 (裁判兼主播)"
      };
    }
    if (speaker === "Agent 2") {
      return {
        bg: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        label: "Agent 2 (主隊攻勢)"
      };
    }
    return {
      bg: "bg-teal-500/10 border-teal-500/30 text-teal-400",
      label: "Agent 3 (客隊防反)"
    };
  };

  // Icon selector based on timeline type
  const getEventIcon = (type: string) => {
    switch (type) {
      case "kickoff":
        return <Activity className="w-4.5 h-4.5 text-zinc-400" />;
      case "goal_home":
      case "goal_away":
        return <Goal className="w-4.5 h-4.5 text-emerald-400 animate-bounce" />;
      case "card":
        return <Award className="w-4.5 h-4.5 text-amber-400" />;
      case "foul":
        return <AlertTriangle className="w-4.5 h-4.5 text-red-400" />;
      case "save":
        return <Target className="w-4.5 h-4.5 text-indigo-400" />;
      case "substitution":
        return <Users className="w-4.5 h-4.5 text-purple-400" />;
      case "whistle":
        return <Volume2 className="w-4.5 h-4.5 text-yellow-500" />;
      default:
        return <Tv className="w-4.5 h-4.5 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Simulation Info Intro Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="font-display font-bold text-base text-zinc-100 flex items-center gap-2">
          <Tv className="w-5 h-5 text-emerald-400" />
          多智能體實況足球模擬沙盤 (Agent Simulation Arena)
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          <strong>分工體系：</strong> Agent 1 擔任「主裁判 & 現場直播員」進行無私哨聲與流程帶動；Agent 2 掌控「主隊」高位攻勢；Agent 3 主導「客隊」精算鐵壁防反及爭議評估。全方位推演精彩的上下半場 1 到 90 分鐘實況。
        </p>
      </div>

      {/* Input Setup Arena Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Play Config Section */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-805 rounded-2xl p-5.5 space-y-4">
          <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
            STEP 1: 冠亞軍球隊及戰研主題設定
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold block">主隊名稱 (Agent 2 - 攻勢本體)</label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="基本寫法：阿根廷"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-bold block">客隊名稱 (Agent 3 - 防守反擊)</label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="基本寫法：法國"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-bold block">戰術對弈主線 / 重點主題</label>
            <input
              type="text"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="例如：主隊高空起球猛攻，客隊鐵大巴伺機中後場致命反擊"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">
              * 點擊右下角「發動」將結合 Gemini 生成整場戰術對沖代碼
            </span>

            <button
              onClick={handleStartSimulate}
              disabled={isLoading}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-4 h-4 animate-pulse text-zinc-950" />
              {isLoading ? "智能體部署沙洲中..." : "⚡ 啟動 3-Agent 模擬比賽"}
            </button>
          </div>
        </div>

        {/* Quick Presets Selection */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-xs tracking-wider text-zinc-300 uppercase mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              模擬經典對弈組合
            </h3>

            <div className="space-y-2.5">
              {PRESET_MOCKUPS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(p)}
                  className="w-full text-left p-3 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 rounded-xl transition duration-200 text-xs block group"
                >
                  <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors block">
                    {p.home} <span className="text-zinc-500 text-[10px]">對</span> {p.away}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5 italic">
                    {p.topic}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-800/80 pt-3 text-[10px] text-zinc-500 italic">
            * 提示：僅供學術大數據預測愛好者技術交流，不作實踐投注引導。
          </div>
        </div>

      </div>

      {/* ERROR MSG */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-4.5 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SIMULATOR CORE BOARD */}
      {simResults && (
        <div className="space-y-6">
          
          {/* Real-time SCOREBOARD visualizer */}
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"></div>

            {/* Showcase goal alert popup inside card */}
            <AnimatePresence>
              {goalShowcase && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center text-center z-20 px-4"
                >
                  <Goal className="w-12 h-12 text-emerald-400 animate-bounce" />
                  <h3 className="font-display font-black text-2xl text-emerald-300 tracking-wide mt-2 animate-pulse">
                    ⚽ GOAL!!! 進球了！
                  </h3>
                  <p className="text-sm text-zinc-200 font-semibold mt-1 leading-normal">
                    {goalShowcase}
                  </p>
                  <span className="text-[10px] text-emerald-500 uppercase font-mono tracking-widest mt-3.5">
                    Agent 1 (裁判) 判定：進球完全有效！
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stadium / Info Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-850 pb-4">
              <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">
                  LIVE 沙盤主播
                </span>
                <span>球場：{simResults.simulationMeta.stadium || "AI 運動科技競技場"}</span>
                <span className="hidden md:inline">|</span>
                <span className="hidden md:inline">裁判官：{simResults.simulationMeta.refereeName || "Agent 1 (AI 裁判部長)"}</span>
              </div>

              {/* Ticker Play Status */}
              <div className="flex items-center space-x-3 text-xs shrink-0">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-zinc-300 font-bold">
                  {currentMin === 90 ? (
                    <span className="text-red-400 font-black">🏁 全場結束 90’</span>
                  ) : currentMin === 0 ? (
                    <span className="text-zinc-500">準備開球 00’</span>
                  ) : currentMin <= 45 ? (
                    <span>上半場 <span className="text-emerald-400 font-bold">{currentMin}’</span></span>
                  ) : (
                    <span>下半場 <span className="text-emerald-400 font-bold">{currentMin}’</span></span>
                  )}
                </span>
              </div>
            </div>

            {/* Giant Scoreboard */}
            <div className="py-8 flex items-center justify-between max-w-2xl mx-auto gap-6">
              
              {/* Home Team */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-200 font-display font-black text-lg mx-auto shadow-sm">
                  {homeTeam.charAt(0)}
                </div>
                <h4 className="font-bold text-sm md:text-base mt-2.5 text-zinc-100 truncate">
                  {simResults.simulationMeta.homeTeam}
                </h4>
                <p className="text-[10px] text-blue-400 font-semibold font-mono uppercase tracking-widest mt-0.5">
                  Agent 2 (進攻方)
                </p>
              </div>

              {/* Real-time score display */}
              <div className="text-center shrink-0">
                <div className="bg-zinc-950 border border-zinc-850 px-6.5 py-4 rounded-2xl inline-block shadow-inner">
                  <div className="font-display font-black text-3xl md:text-4xl text-zinc-100 tracking-widest font-mono flex items-center justify-center gap-3">
                    <span>{scores.home}</span>
                    <span className="text-zinc-600 font-light select-none text-xl">:</span>
                    <span>{scores.away}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-[9px] bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded font-mono text-zinc-400">
                    全場終局: {simResults.simulationMeta.finalScore}
                  </span>
                </div>
              </div>

              {/* Away Team */}
              <div className="text-center flex-1">
                <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-200 font-display font-black text-lg mx-auto shadow-sm">
                  {awayTeam.charAt(0)}
                </div>
                <h4 className="font-bold text-sm md:text-base mt-2.5 text-zinc-100 truncate">
                  {simResults.simulationMeta.awayTeam}
                </h4>
                <p className="text-[10px] text-teal-400 font-semibold font-mono uppercase tracking-widest mt-0.5">
                  Agent 3 (防守反擊)
                </p>
              </div>

            </div>

            {/* Playback simulation controls panel */}
            <div className="bg-zinc-950 p-4.5 rounded-2xl border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Play / Pause Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentMin >= 90}
                  className={`p-2.5 px-4 rounded-xl font-bold font-mono text-xs text-zinc-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition ${
                    isPlaying ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                      暫停廣播
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                      {currentMin === 0 ? "開球直播" : "繼續比賽"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentMin(0);
                    setIsPlaying(false);
                  }}
                  className="p-2.5 px-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl hover:bg-zinc-800 hover:text-zinc-100 transition cursor-pointer"
                  title="重置比賽"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar of game 1-90 */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>賽程進度線</span>
                  <span>90 分鐘 (全場)</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 border border-zinc-850 rounded-full relative overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(currentMin / 90) * 100}%` }}
                  ></div>
                  
                  {/* Half time marker dot */}
                  <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-zinc-700" title="中場結束"></div>
                </div>
              </div>

              {/* Playback speed selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">時間流速 :</span>
                {[
                  { label: "0.2s 狂飆", ms: 100 },
                  { label: "0.5s 快進", ms: 300 },
                  { label: "1.2s 常速", ms: 800 }
                ].map((speed) => (
                  <button
                    key={speed.ms}
                    onClick={() => setPlaybackSpeed(speed.ms)}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded border transition cursor-pointer ${
                      playbackSpeed === speed.ms
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-mono"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>

            </div>

            {/* Stylized tactical 2D soccer field display (Fun Dynamic Visual) */}
            <div className="mt-4 border border-zinc-850 bg-emerald-950/20 rounded-2xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 relative">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-display">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  實況模擬場地 (Dynamic Field Indicators)
                </h4>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  反映當前球權控方、射門熱度及戰術重疊。
                </p>
              </div>

              {/* Dynamic status depending on latest Event */}
              <div className="flex-1 max-w-md w-full bg-zinc-950/80 border border-zinc-850 p-3 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-805 rounded-lg text-xs font-bold font-mono">
                  {currentMin}’
                </div>
                <div className="text-left text-xs min-w-0 flex-1">
                  {latestEvent ? (
                    <>
                      <div className="font-semibold text-zinc-200 uppercase truncate flex items-center gap-1.5">
                        {getEventIcon(latestEvent.type)}
                        <span>{latestEvent.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {latestEvent.content}
                      </p>
                    </>
                  ) : (
                    <p className="text-zinc-600 italic">等待裁判笛聲吹響...</p>
                  )}
                </div>
              </div>

              {/* Animated tactical widget */}
              <div className="w-28 shrink-0 flex items-center justify-between border border-zinc-900/60 bg-zinc-950 p-2.5 rounded-xl font-mono text-[10px] text-zinc-400">
                <div className="text-center">
                  <span className="block text-[8px] text-zinc-500 uppercase">射門(主)</span>
                  <span className="font-bold text-blue-400">{simResults.simulationMeta.totalShotsHome || 12} 次</span>
                </div>
                <div className="w-0.5 h-6 bg-zinc-850"></div>
                <div className="text-center">
                  <span className="block text-[8px] text-zinc-500 uppercase">射門(客)</span>
                  <span className="font-bold text-teal-400">{simResults.simulationMeta.totalShotsAway || 8} 次</span>
                </div>
              </div>

            </div>

          </div>

          {/* Filtering control labels for minute record lists */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4">
            
            {/* Filter 1: Half time divider tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 text-xs">
              {[
                { label: "整場直播 (All)", value: "all" },
                { label: "上半場 (1-45’)", value: "first" },
                { label: "下半場 (46-90’)", value: "second" }
              ].map((half) => (
                <button
                  key={half.value}
                  onClick={() => setHalfFilter(half.value as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    halfFilter === half.value
                      ? "bg-zinc-850 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {half.label}
                </button>
              ))}
            </div>

            {/* Filter 2: Speaker role filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] text-zinc-500 uppercase mr-1 font-mono">觀看視角:</span>
              {[
                { label: "所有言論", value: "all" },
                { label: "Agent 1 (主播/裁判)", value: "Agent 1" },
                { label: "Agent 2 (主隊戰意)", value: "Agent 2" },
                { label: "Agent 3 (客隊反撲)", value: "Agent 3" }
              ].map((speaker) => (
                <button
                  key={speaker.value}
                  onClick={() => setSpeakerFilter(speaker.value as any)}
                  className={`px-2.5 py-1.5 rounded-lg border transition text-[11px] font-semibold cursor-pointer ${
                    speakerFilter === speaker.value
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {speaker.label}
                </button>
              ))}
            </div>

          </div>

          {/* Text-commentary Broadcast Scrolling log */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-3xl p-6.5 max-h-[600px] overflow-y-auto space-y-4">
            <h3 className="font-display font-semibold text-xs tracking-wider text-zinc-400 uppercase flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-emerald-400" />
              實時文字直播流記錄 (Minute Live Records)
            </h3>

            {displayedEvents.length === 0 ? (
              <div className="py-20 text-center text-zinc-600 space-y-2.5">
                <Clock className="w-10 h-10 mx-auto text-zinc-700 animate-pulse" />
                <p className="text-xs">等待哨聲吹響... 請在上方點擊「開球直播」開始模擬。</p>
              </div>
            ) : (
              displayedEvents.map((event, index) => {
                const spStyle = getSpeakerStyle(event.speaker);
                const isGoal = event.type?.includes("goal");
                const isCard = event.type === "card";
                const isFoul = event.type === "foul";

                return (
                  <div
                    key={index}
                    className={`border rounded-2xl p-4.5 transition duration-200 transform hover:-translate-y-0.5 ${
                      isGoal 
                        ? "bg-emerald-950/20 border-emerald-500/40 shadow-md"
                        : isCard
                        ? "bg-amber-950/10 border-amber-500/30"
                        : isFoul
                        ? "bg-red-950/10 border-red-950/40"
                        : "bg-zinc-950/55 border-zinc-850/85 hover:border-zinc-800"
                    }`}
                  >
                    {/* Event top meta list */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-905 pb-2.5 mb-2.5">
                      <div className="flex items-center space-x-2.5">
                        {/* Minute Ticker */}
                        <div className={`p-1 px-2 text-xs font-mono font-black rounded-lg ${
                          isGoal 
                            ? "bg-emerald-500 text-zinc-950" 
                            : "bg-zinc-900 border border-zinc-750 text-emerald-400"
                        }`}>
                          {event.minute}’
                        </div>
                        
                        {/* Halftime label */}
                        <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {event.half === "first" ? "上半場" : "下半場"}
                        </span>

                        {/* Speaker Identity */}
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${spStyle.bg}`}>
                          {event.speakerName || spStyle.label}
                        </span>
                      </div>

                      {/* Current tactical score display */}
                      <span className="text-[11px] font-mono font-bold bg-zinc-900/90 border border-zinc-800 px-2.5 py-0.5 rounded text-zinc-300">
                        目前比分 {event.currentHomeScore} : {event.currentAwayScore}
                      </span>
                    </div>

                    {/* Event Title with Action icon */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-block shrink-0">{getEventIcon(event.type)}</span>
                      <h4 className={`text-xs font-bold tracking-wide uppercase ${
                        isGoal 
                          ? "text-emerald-400 text-sm" 
                          : isCard
                          ? "text-amber-400"
                          : isFoul
                          ? "text-red-400"
                          : "text-zinc-200"
                      }`}>
                        {event.title}
                      </h4>
                    </div>

                    {/* Commentary block content */}
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pl-1 shadow-sm font-sans">
                      {event.content}
                    </p>

                  </div>
                );
              })
            )}

            <div ref={timelineEndRef} />
          </div>

          {/* Post game statistics summaries block */}
          {currentMin >= 90 && (
            <div className="border border-amber-500/20 bg-amber-500/[0.01] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                  賽後終場報告 (Full-time Analysis)
                </span>
                <h4 className="font-display font-bold text-zinc-100 text-sm">
                  Agent 1 裁判代表：嗶- 嗶- 嗶！全場比賽正式結束
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  主裁判 Agent 1 已向三方委員會提交了完整的技術與紀律統計報告。本次多智能體比賽大數據已存檔。兩支隊伍展現了極佳的戰術抗震性與攻門能力，請球迷讀者保持理性，切記<strong>「僅供研討論壇交流，遠離非法賭博」</strong>！
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-850 p-4.5 rounded-2xl text-center shrink-0 min-w-[140px] space-y-1">
                <span className="text-[10px] text-zinc-500 block">終場比分決算</span>
                <span className="font-display font-black text-2xl text-amber-500 font-mono tracking-widest block">
                  {simResults.simulationMeta.finalScore}
                </span>
                <span className="text-[9px] text-zinc-600 block font-light">
                  主裁判 Agent 1 核發
                </span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
