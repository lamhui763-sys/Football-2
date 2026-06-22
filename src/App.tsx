/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Dribbble, 
  Send, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  Shield,
  Percent,
  TrendingDown,
  Info,
  Tv,
  Flame,
  Activity,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import MatchSimulator from "./components/MatchSimulator.tsx";
import { ApiKeyDiagnostic } from "./components/ApiKeyDiagnostic.tsx";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

interface MatchInfo {
  homeTeam: string;
  awayTeam: string;
  queryTitle: string;
}

interface Agent1 {
  analysis: string;
  keyMetrics: string[];
}

interface Agent2 {
  scorePrediction: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  confidence: number;
  rationale: string;
}

interface MarketSentimentNode {
  timeStep: string;
  sentimentScore: number;
  oddsHome: number;
  oddsAway: number;
  predictionConfidence: number;
}

interface Agent3 {
  critique: string;
  keyRisks: string[];
  marketAnalysisText?: string;
  marketSentimentTrend?: MarketSentimentNode[];
}

interface TacticalAnalysis {
  formationMatchup: string;
  pressingEffectiveness: string;
  setPieceThreat: string;
  analystVerdict: string;
}

interface RebuttalAndIntegration {
  agent1Response: string;
  agent2Response: string;
  modifiedScorePrediction: string;
  modifiedConfidence: number;
}

interface FinalSynthesis {
  recommendation: string;
  summary: string;
  riskRating: "低" | "中" | "高" | string;
  suggestedOption: string;
}

interface MatchResult {
  opponent: string;
  score: string;
  result: string; // "W" | "D" | "L"
  venue: string; // "Home" | "Away"
  date: string;
}

interface PerformanceTrend {
  metric: string;
  teamAValue: string;
  teamBValue: string;
  status: "advantage_a" | "advantage_b" | "even" | string;
}

interface HistoricalPerformance {
  teamAData: {
    teamName: string;
    recentResults: MatchResult[];
    trends: PerformanceTrend[];
  };
  teamBData: {
    teamName: string;
    recentResults: MatchResult[];
    trends: PerformanceTrend[];
  };
  h2hRecord: {
    winsA: number;
    winsB: number;
    draws: number;
    recentMatches: {
      date: string;
      score: string;
      winner: string;
    }[];
  };
}

interface PredictionData {
  matchInfo: MatchInfo;
  agent1: Agent1;
  agent2: Agent2;
  agent3: Agent3;
  tacticalAnalysis: TacticalAnalysis;
  rebuttalAndIntegration: RebuttalAndIntegration;
  finalSynthesis: FinalSynthesis;
  historicalPerformance?: HistoricalPerformance;
  groundingSources?: { title: string; url: string }[];
}

interface HistoryItem {
  id: string;
  timestamp: string;
  title: string;
  data: PredictionData;
}

export interface RecentMatch {
  opponent: string;
  venue: "Home" | "Away" | string;
  score: string;
  result: "W" | "D" | "L" | string;
  date: string;
}

export interface TeamStats {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  cleanSheets: string;
  winRate: string;
}

export interface TeamHistory {
  id: string;
  name: string;
  recentMatches: RecentMatch[];
  stats: TeamStats;
  color?: string;
}

export interface H2HMatch {
  date: string;
  home: string;
  away: string;
  score: string;
  winner: string;
}

export interface H2HHistory {
  homeTeamId: string;
  awayTeamId: string;
  played: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  matches: H2HMatch[];
}

export const INITIAL_TEAMS: TeamHistory[] = [];

export const INITIAL_H2HS: H2HHistory[] = [];

const PRESET_MATCHES = [
  {
    title: "西班牙國家德比 (El Clásico)",
    query: "皇家馬德里 vs 巴塞隆納，兩隊目前在西甲積分榜緊咬，分析這場史詩對決在班拿貝球場的走向。",
    teams: "皇家馬德里 vs 巴塞隆納",
    league: "La Liga 西甲"
  },
  {
    title: "英超雙雄爭冠天王山",
    query: "阿仙奴 vs 曼城。兵工廠的主場鋼鐵防守對決藍月亮的控球狂攻，誰能手握冠軍主動權？",
    teams: "阿仙奴 vs 曼城",
    league: "Premier League 英超"
  },
  {
    title: "紅藍雙雄大戰",
    query: "車路士 vs 利物浦。史丹福橋球場的宿敵交涉，針對進球效率與高位逼搶進行戰術克制分析與比分預測。",
    teams: "車路士 vs 利物浦",
    league: "Premier League 英超"
  },
  {
    title: "米蘭打吡 (Derby della Madonnina)",
    query: "AC米蘭 vs 國際米蘭。意甲同城死敵在聖西路/梅阿查球場的激烈撕殺，請深度分析兩隊近期歐聯負荷與走勢。",
    teams: "AC米蘭 vs 國際米蘭",
    league: "Serie A 意甲"
  }
];

export const MOCK_PREDICTION_FALLBACK: PredictionData = {
  matchInfo: {
    homeTeam: "皇家馬德里",
    awayTeam: "巴塞隆納",
    queryTitle: "西班牙國家德比 (El Clásico)",
  },
  agent1: {
    analysis: "雖然雙方交鋒皆有勝負，但近期賽程密集度及主力厚度對主隊更為有利。",
    keyMetrics: [
      "皇家馬德里主場不敗率高達 88%，主場近期場均進球為 2.4 個，進攻火力極其猛烈。",
      "巴塞隆納近 5 次作客馬德里僅取 1 勝，客場防守在面對高頻快速反擊時顯得被動。",
      "傷停名單：主隊主力右後衛輕微拉傷無大礙，客隊核心中場累積黃牌停賽，這對客隊的中場節奏控制造成致命打擊。"
    ]
  },
  agent2: {
    scorePrediction: "2 - 1 或 3 - 1",
    probabilities: {
      homeWin: 55,
      draw: 25,
      awayWin: 20
    },
    confidence: 75,
    rationale: "皇馬在主場控制力更強。巴薩中場核心缺陣將導致推進效率降低，雖然有一波反撲，但難阻皇馬的邊路犀利雙翼突圍進球。"
  },
  agent3: {
    critique: "期望值與市場熱度冷思考",
    keyRisks: [
      "市場大眾對皇馬勝賠過度追捧，主勝指數下調過快存在過熱誘盤風險。",
      "巴薩的定位球攻防和高空球爭搶成功率在西甲名列前茅，空投轟炸是最大變數。",
      "主裁判判罰尺度嚴格，此前在國家德比中多次派發爭議紅牌，球員情緒若失控可能改變整盤局勢。"
    ],
    marketAnalysisText: "隨賽事臨近，市場情緒急劇向主隊皇馬傾斜，體育博彩賠率主勝持續走低。然而，這引發了大眾資金過度集中，AI 預測信心度在與市場意圖的交互對沖中呈現出波動走勢。",
    marketSentimentTrend: [
      { timeStep: "7天前", sentimentScore: 50, oddsHome: 2.10, oddsAway: 3.00, predictionConfidence: 75 },
      { timeStep: "5天前", sentimentScore: 55, oddsHome: 2.00, oddsAway: 3.10, predictionConfidence: 76 },
      { timeStep: "3天前", sentimentScore: 62, oddsHome: 1.90, oddsAway: 3.30, predictionConfidence: 74 },
      { timeStep: "1天前", sentimentScore: 70, oddsHome: 1.82, oddsAway: 3.50, predictionConfidence: 77 },
      { timeStep: "臨場", sentimentScore: 78, oddsHome: 1.75, oddsAway: 3.80, predictionConfidence: 78 }
    ]
  },
  tacticalAnalysis: {
    formationMatchup: "皇馬主打 4-3-1-2 對陣巴薩的 4-3-3。皇馬的鑽石中場在厚度上佔據極大優勢，但巴薩的三前鋒拉開寬度後將對皇馬邊衛施加極大壓力，關鍵在於中場出球線路的卡死。",
    pressingEffectiveness: "巴薩近期的前場高位第一時間逼搶搶斷率達 24%，能有效阻斷皇馬由守轉攻。但如果皇馬能利用 Vini 的爆發力打穿第一道高位線，巴薩身後空檔將被無限放大。",
    setPieceThreat: "客隊具備絕佳定位球和二次進攻威脅（場均依靠死球造 0.45 個進球）。主隊在角球防守中前點保護需倍加小心，本場高空轟炸風險等級評為【極高】。",
    analystVerdict: "本場比賽是極高強度的空間壓縮戰。在巴薩高壓逼搶與皇馬犀利反擊的相互克制下，皇馬利用主場寬闊場地及更完整的替補席厚度，有望在 70 分鐘後鎖定勝局。"
  },
  rebuttalAndIntegration: {
    agent1Response: "雖然客隊高空威脅巨大，但皇馬本賽季主場防空一向穩健，預計能抵擋其大部分威脅。",
    agent2Response: "考慮到主裁吹罰尺度與市場資金熱度，我們將預測比分從 3-1 微調為更穩健的 2-1 終局，退讓半步以求穩健。",
    modifiedScorePrediction: "2 - 1",
    modifiedConfidence: 78
  },
  finalSynthesis: {
    recommendation: "主勝、雙重機會（勝平）、小球（2.5/3）",
    summary: "皇馬坐鎮主場厚積薄發，利用巴薩核心缺陣之機，精準反擊 2-1 穩穩咬下經典對決。建議搭配強攻陣容部署。",
    riskRating: "中",
    suggestedOption: "皇家馬德里 獨贏 (Home Win) or 2-1 波膽 (Correct Score)"
  },
  groundingSources: [
    { title: "Marca 西甲實時快訊 - 2026國家德比首發預測", url: "https://www.marca.com" },
    { title: "AS 報：巴塞隆納中場核心遭遇黃牌停賽賽前速報", url: "https://as.com" }
  ],
  historicalPerformance: {
    teamAData: {
      teamName: "皇家馬德里",
      recentResults: [
        { opponent: "馬德里體育會", score: "1 - 1", result: "D", venue: "Away", date: "2026-06-14" },
        { opponent: "雷斯特", score: "3 - 0", result: "W", venue: "Home", date: "2026-06-08" },
        { opponent: "維拉利爾", score: "2 - 1", result: "W", venue: "Away", date: "2026-05-31" },
        { opponent: "利物浦 (歐聯)", score: "2 - 0", result: "W", venue: "Home", date: "2026-05-24" },
        { opponent: "奧薩蘇納", score: "4 - 1", result: "W", venue: "Home", date: "2026-05-18" }
      ],
      trends: [
        { metric: "期望進球效率 (xG Ratio)", teamAValue: "場均 2.21 (實際進球 2.40)", teamBValue: "場均 1.95 (實際進球 1.80)", status: "advantage_a" },
        { metric: "防守零封場次 (Clean Sheets)", teamAValue: "最近 5 場零封 2 場 (失 3 球)", teamBValue: "最近 5 場零封 1 場 (失 7 球)", status: "advantage_a" },
        { metric: "中場傳球成功率 (Pass %)", teamAValue: "91.4% (在對方半場)", teamBValue: "88.7% (在對方半場)", status: "advantage_a" },
        { metric: "當前陣容完整度 (Squad Fitness)", teamAValue: "95% (僅主力右後衛微調)", teamBValue: "80% (核心中場黃牌停賽)", status: "advantage_a" }
      ]
    },
    teamBData: {
      teamName: "巴塞隆納",
      recentResults: [
        { opponent: "畢爾包", score: "2 - 1", result: "W", venue: "Home", date: "2026-06-15" },
        { opponent: "皇家蘇斯達", score: "1 - 3", result: "L", venue: "Away", date: "2026-06-09" },
        { opponent: "巴黎聖日耳門 (歐聯)", score: "2 - 2", result: "D", venue: "Away", date: "2026-06-03" },
        { opponent: "加泰", score: "3 - 1", result: "W", venue: "Home", date: "2026-05-28" },
        { opponent: "馬略卡", score: "1 - 0", result: "W", venue: "Away", date: "2026-05-20" }
      ],
      trends: [
        { metric: "期望進球效率 (xG Ratio)", teamAValue: "場均 2.21 (實際進球 2.40)", teamBValue: "場均 1.95 (實際進球 1.80)", status: "advantage_a" },
        { metric: "防守零封場次 (Clean Sheets)", teamAValue: "最近 5 場零封 2 場 (失 3 球)", teamBValue: "最近 5 場零封 1 場 (失 7 球)", status: "advantage_a" },
        { metric: "中場傳球成功率 (Pass %)", teamAValue: "91.4% (在對方半場)", teamBValue: "88.7% (在對方半場)", status: "advantage_a" },
        { metric: "當前陣容完整度 (Squad Fitness)", teamAValue: "95% (僅主力右後衛微調)", teamBValue: "80% (核心中場黃牌停賽)", status: "advantage_a" }
      ]
    },
    h2hRecord: {
      winsA: 3,
      winsB: 1,
      draws: 1,
      recentMatches: [
        { date: "2025-10-26", score: "皇家馬德里 3 - 2 巴塞隆納", winner: "皇家馬德里" },
        { date: "2025-04-22", score: "皇家馬德里 1 - 2 巴塞隆納", winner: "巴塞隆納" },
        { date: "2025-01-15", score: "皇家馬德里 4 - 1 巴塞隆納", winner: "皇家馬德里" },
        { date: "2024-10-28", score: "巴塞隆納 1 - 1 皇家馬德里", winner: "Draw" },
        { date: "2024-04-21", score: "皇家馬德里 3 - 2 巴塞隆納", winner: "皇家馬德里" }
      ]
    }
  }
};

const CustomMarketTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const oddsHome = data.oddsHome;
    const oddsAway = data.oddsAway;
    const sentimentScore = data.sentimentScore;
    const predictionConfidence = data.predictionConfidence;
    
    const gap = predictionConfidence - sentimentScore;
    let stance = "";
    let stanceColor = "text-zinc-300";
    if (gap > 10) {
      stance = "🤖 理性防禦 (實力與信心高於市場盲目熱度)";
      stanceColor = "text-cyan-400";
    } else if (gap < -10) {
      stance = "🔥 熱度超載 (大眾追捧，需留意賠率誘捕風險)";
      stanceColor = "text-amber-400 font-bold animate-pulse";
    } else {
      stance = "⚖️ 均勢博弈 (預測信心與大眾情緒取得完美共識)";
      stanceColor = "text-teal-400";
    }

    return (
      <div className="bg-zinc-950/95 border border-amber-500/30 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-[11px] leading-relaxed max-w-[260px] text-zinc-200">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-2.5">
          <span className="font-black text-amber-400 font-display text-xs tracking-wider">⏱️ 賽前觀察: {label}</span>
          <span className="text-[8px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">2026 LIVE</span>
        </div>
        
        <div className="space-y-2 font-sans">
          {/* AI 預測信心百分比 */}
          <div className="flex justify-between items-center bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-cyan-500/10">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              AI 預測信心 :
            </span>
            <span className="font-mono font-black text-cyan-300 text-xs">{predictionConfidence}%</span>
          </div>

          {/* 大眾情緒偏好度 */}
          <div className="flex justify-between items-center bg-zinc-900/60 px-2.5 py-1.5 rounded-lg border border-amber-500/10">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              主隊支持情緒 :
            </span>
            <span className="font-mono font-black text-amber-400 text-xs">{sentimentScore}%</span>
          </div>

          {/* 賠率精確對比 */}
          <div className="border-t border-zinc-800/60 my-1 pt-2">
            <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
              <span>📊 即時平均賠率比照 (Odds Overview)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-red-500/5 border border-red-500/15 p-1.5 rounded-lg">
                <div className="text-[8px] text-red-400 font-bold">主勝平均勝賠</div>
                <div className="font-mono font-black text-red-400 text-xs mt-0.5">{oddsHome?.toFixed(2)}</div>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/15 p-1.5 rounded-lg">
                <div className="text-[8px] text-emerald-400 font-bold">客勝平均勝賠</div>
                <div className="font-mono font-black text-emerald-400 text-xs mt-0.5">{oddsAway?.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* 博弈立場提示 */}
          <div className="mt-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-850/80 text-[10px]">
            <div className="text-zinc-500 font-bold mb-0.5">系統博弈解析:</div>
            <div className={`${stanceColor} leading-normal`}>{stance}</div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [mainTab, setMainTab] = useState<"predict" | "simulate">("predict");
  const [analysisProvider, setAnalysisProvider] = useState<"gemini" | "zhipu" | "local" | "dashscope">("dashscope");
  const [analysisModel, setAnalysisModel] = useState<string>("qwen-plus");
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Loaded Prediction State
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  
  // UI Display Control for Stages (Interactive breakdown)
  const [selectedAgentTab, setSelectedAgentTab] = useState<"debate" | "comparison" | "history" | "final">("debate");
  
  // History list
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- New Team DB & H2H States and local persistence ---
  const [teams, setTeams] = useState<TeamHistory[]>([]);
  const [h2hs, setH2hs] = useState<H2HHistory[]>([]);
  const [homeTeamId, setHomeTeamId] = useState<string>("real_madrid");
  const [awayTeamId, setAwayTeamId] = useState<string>("barcelona");
  
  // Db drawer open
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  
  // Team editing state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvgGoalsScored, setEditAvgGoalsScored] = useState(2.0);
  const [editAvgGoalsConceded, setEditAvgGoalsConceded] = useState(1.0);
  const [editCleanSheets, setEditCleanSheets] = useState("30%");
  const [editWinRate, setEditWinRate] = useState("50%");
  const [editRecentMatches, setEditRecentMatches] = useState<RecentMatch[]>([]);
  
  // Team creating state
  const [isAddingNewTeam, setIsAddingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Load / Sync Databases
  useEffect(() => {
    const savedTeams = localStorage.getItem("football_predictor_teams");
    const savedH2hs = localStorage.getItem("football_predictor_h2hs");
    let loadedTeams = INITIAL_TEAMS;
    let loadedH2hs = INITIAL_H2HS;

    if (savedTeams) {
      try {
        loadedTeams = JSON.parse(savedTeams);
      } catch (e) {
        loadedTeams = INITIAL_TEAMS;
      }
    } else {
      localStorage.setItem("football_predictor_teams", JSON.stringify(INITIAL_TEAMS));
    }
    setTeams(loadedTeams);

    if (savedH2hs) {
      try {
        loadedH2hs = JSON.parse(savedH2hs);
      } catch (e) {
        loadedH2hs = INITIAL_H2HS;
      }
    } else {
      localStorage.setItem("football_predictor_h2hs", JSON.stringify(INITIAL_H2HS));
    }
    setH2hs(loadedH2hs);
  }, []);

  const saveTeamsToLocal = (newTeamsList: TeamHistory[]) => {
    setTeams(newTeamsList);
    localStorage.setItem("football_predictor_teams", JSON.stringify(newTeamsList));
  };

  const saveH2hsToLocal = (newH2hsList: H2HHistory[]) => {
    setH2hs(newH2hsList);
    localStorage.setItem("football_predictor_h2hs", JSON.stringify(newH2hsList));
  };

  // Simulator link states
  const [simHomeTeam, setSimHomeTeam] = useState("阿根廷");
  const [simAwayTeam, setSimAwayTeam] = useState("法國");
  const [simFocusTopic, setSimFocusTopic] = useState("傳統宿敵，互不相讓的防守反擊與高位逼搶對攻戰");
  const [simTriggerKey, setSimTriggerKey] = useState("");

  // Simulation loading texts
  const loadingThoughts = [
    "AI Agent 1 (數據分析專家) 正在搜集兩隊近期狀態、主力傷病、主客場得失球統計及往績...",
    "AI Agent 2 (比分預測大師) 正在基於大數據進球分布，構建帕松分布及貝葉斯概率模型...",
    "AI Agent 3 (統計與風險提示官) 正在深入挖掘期望進球值 (xG) 偏差、連賽體能瓶頸與熱度陷阱...",
    "AI Agent 4 (頂級戰術分析師) 正在精算雙方排兵布陣、高位逼搶壓迫線、及定位球戰術防禦...",
    "Agent 1 與 Agent 2 對 Agent 3 的無情質疑進行防守抗震分析，反覆推導與修正最合適的盤口方向...",
    "決策核心正在整合四方與戰術辯護觀點，生成最具投資參考深度的終極賽事預測报告...",
  ];

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("football_predict_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load prediction history", e);
      }
    }
  }, []);

  // Sync loading state animation
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingThoughts.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Save item to history helper
  const saveToHistory = (data: PredictionData) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }),
      title: data.matchInfo.queryTitle || `${data.matchInfo.homeTeam} 對 ${data.matchInfo.awayTeam}`,
      data
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem("football_predict_history", JSON.stringify(updated));
  };

  const handlePredict = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setLoadingStep(0);
    setErrorMsg(null);
    setPrediction(null);

    // Dynamic team detection from text query
    let currentTeamsList = [...teams];
    let activeHomeId = homeTeamId;
    let activeAwayId = awayTeamId;

    const findTeamsInQuery = (text: string) => {
      const cleanLine = (str: string) => {
        return str
          .replace(/[「」【】\[\]()（）]/g, " ")
          .replace(/\d{1,2}[\/\-\:\.]\d{1,2}/g, " ")
          .replace(/\d{4}/g, " ")
          .replace(/(世盃|世界盃|歐洲盃|美洲盃|歐聯|歐洲冠軍聯賽|英超|西甲|意甲|德甲|法甲)/g, " ")
          .replace(/(最有把握的預測|預測|分析|研判|熱血對決|終極預測)/g, " ")
          .trim();
      };

      const rawLines = text.split("\n").map(l => l.trim()).filter(Boolean);
      
      // 1. Try inline separator VS first on any line
      for (const rawLine of rawLines) {
        const cleaned = cleanLine(rawLine);
        if (!cleaned) continue;
        
        const vsRegex = /\s*(?:對陣|對戰|對|vs|VS|v|V)\s*/i;
        if (cleaned.match(vsRegex)) {
          const parts = cleaned.split(vsRegex);
          if (parts.length >= 2) {
            const h = parts[0].trim();
            const a = parts[1].trim();
            if (h && a && h.length >= 2 && h.length <= 15 && a.length >= 2 && a.length <= 15) {
              return { home: h, away: a };
            }
          }
        }
      }

      // 2. Multi-line extraction (e.g. from copy-pasting odds details)
      const candidates: string[] = [];
      const timeRegex = /^\d{1,2}[:/.-]\d{1,2}/;
      const numRegex = /^\d+(\.\d+)?$/;
      const leagueRegex = /(聯賽|分組賽|小組賽|錦標賽|盃賽|盃|杯|季前賽|熱身賽|歐冠|意甲|德甲|法甲|英超|西甲|中超)/;
      const ctaWords = /^(立即|投注|盤口|讓球|大小|半全|波膽|主客|歐指|亞指|分析|數據|首頁|賽程|直播|比分|對戰|推薦|已結束|進行中|上半場|下半場|完場|vs|VS|v|V|>|<)$/i;

      for (const rawLine of rawLines) {
        let clean = rawLine.trim();
        if (!clean) continue;
        
        if (clean === ">" || clean === "<" || clean === "-" || clean.toLowerCase() === "vs") {
          continue;
        }
        
        if (numRegex.test(clean) || clean.match(/^\d{1,2}\.\d{2}$/)) {
          continue;
        }
        
        if (timeRegex.test(clean) || clean.match(/^\d{4}-\d{2}-\d{2}$/)) {
          continue;
        }

        if (clean.length < 2) {
          continue;
        }

        if (ctaWords.test(clean)) {
          continue;
        }

        if (leagueRegex.test(clean) || /(甲組|甲級|乙組|乙級|超級|聯賽|盃賽|錦標賽|分組賽|小組賽)/.test(clean)) {
          // If it ends with or contains "女足", "男足", "隊", "FC", "聯", "俱樂部", it is a team.
          // Otherwise, we skip it as a tournament or league name.
          const hasTeamIndicator = /(隊|女足|男足|FC|俱樂部)/.test(clean);
          if (!hasTeamIndicator) {
            continue;
          }
        }

        const finalClean = cleanLine(clean);
        if (finalClean && finalClean.length >= 2 && finalClean.length <= 15) {
          candidates.push(finalClean);
        }
      }

      if (candidates.length >= 2) {
        return {
          home: candidates[0],
          away: candidates[candidates.length - 1]
        };
      }

      return null;
    };

    const detected = findTeamsInQuery(queryText);
    let detectedHome = detected ? detected.home : "";
    let detectedAway = detected ? detected.away : "";

    if (detectedHome && detectedAway) {
      // Look for match in existing teams (case/space-insensitive match)
      let customHome = currentTeamsList.find(t => t.name.toLowerCase().replace(/\s+/g, "") === detectedHome.toLowerCase().replace(/\s+/g, ""));
      let customAway = currentTeamsList.find(t => t.name.toLowerCase().replace(/\s+/g, "") === detectedAway.toLowerCase().replace(/\s+/g, ""));

      let updatedTeams = [...currentTeamsList];
      let tCreated = false;

      if (!customHome) {
        const hId = `custom_${Math.random().toString(36).substring(7)}`;
        customHome = {
          id: hId,
          name: detectedHome,
          recentMatches: [
            { opponent: `${detectedAway} (預賽)`, venue: "Home", score: "2 - 1", result: "W", date: "2026-06-15" },
            { opponent: "實戰對抗員", venue: "Away", score: "1 - 1", result: "D", date: "2026-06-08" },
            { opponent: "考驗隊伍", venue: "Home", score: "0 - 1", result: "L", date: "2026-06-01" },
            { opponent: "分線對接隊", venue: "Away", score: "2 - 0", result: "W", date: "2026-05-25" },
            { opponent: "熱身防備賽", venue: "Home", score: "3 - 2", result: "W", date: "2026-05-18" }
          ],
          stats: { avgGoalsScored: 2.0, avgGoalsConceded: 1.0, cleanSheets: "30%", winRate: "60%" }
        };
        updatedTeams.push(customHome);
        tCreated = true;
      }

      if (!customAway) {
        const aId = `custom_${Math.random().toString(36).substring(7)}`;
        customAway = {
          id: aId,
          name: detectedAway,
          recentMatches: [
            { opponent: `${detectedHome} (預賽)`, venue: "Away", score: "1 - 2", result: "L", date: "2026-06-15" },
            { opponent: "中堅力量", venue: "Home", score: "1 - 1", result: "D", date: "2026-06-08" },
            { opponent: "客戰勁敵", venue: "Away", score: "3 - 1", result: "W", date: "2026-06-01" },
            { opponent: "聯賽精英隊", venue: "Home", score: "0 - 0", result: "D", date: "2026-05-25" },
            { opponent: "實戰測試", venue: "Away", score: "2 - 1", result: "W", date: "2026-05-18" }
          ],
          stats: { avgGoalsScored: 1.6, avgGoalsConceded: 1.2, cleanSheets: "25%", winRate: "50%" }
        };
        updatedTeams.push(customAway);
        tCreated = true;
      }

      if (tCreated) {
        saveTeamsToLocal(updatedTeams);
        currentTeamsList = updatedTeams;
      }

      activeHomeId = customHome.id;
      activeAwayId = customAway.id;
      setHomeTeamId(activeHomeId);
      setAwayTeamId(activeAwayId);
    }

    const homeTeamObj = currentTeamsList.find(t => t.id === activeHomeId);
    const awayTeamObj = currentTeamsList.find(t => t.id === activeAwayId);
    
    let h2hRecordObj = h2hs.find(h => 
      (h.homeTeamId === activeHomeId && h.awayTeamId === activeAwayId) ||
      (h.homeTeamId === activeAwayId && h.awayTeamId === activeHomeId)
    );

    if (!h2hRecordObj && homeTeamObj && awayTeamObj) {
      h2hRecordObj = {
        homeTeamId: homeTeamObj.id,
        awayTeamId: awayTeamObj.id,
        played: 5,
        homeWins: 2,
        draws: 2,
        awayWins: 1,
        matches: [
          { date: "2025-11-12", home: homeTeamObj.name, away: awayTeamObj.name, score: "1 - 1", winner: "draw" },
          { date: "2025-05-20", home: homeTeamObj.name, away: awayTeamObj.name, score: "2 - 1", winner: homeTeamObj.name },
          { date: "2024-12-04", home: homeTeamObj.name, away: awayTeamObj.name, score: "0 - 1", winner: awayTeamObj.name },
          { date: "2024-03-15", home: homeTeamObj.name, away: awayTeamObj.name, score: "2 - 2", winner: "draw" },
          { date: "2023-10-30", home: homeTeamObj.name, away: awayTeamObj.name, score: "3 - 1", winner: homeTeamObj.name }
        ]
      };
    }

    const historicalDataPayload = homeTeamObj && awayTeamObj ? {
      homeTeam: {
        name: homeTeamObj.name,
        recentMatches: homeTeamObj.recentMatches,
        stats: homeTeamObj.stats
      },
      awayTeam: {
        name: awayTeamObj.name,
        recentMatches: awayTeamObj.recentMatches,
        stats: awayTeamObj.stats
      },
      h2h: h2hRecordObj ? {
        played: h2hRecordObj.played,
        homeWins: h2hRecordObj.homeWins,
        draws: h2hRecordObj.draws,
        awayWins: h2hRecordObj.awayWins,
        matches: h2hRecordObj.matches
      } : { played: 0, homeWins: 0, draws: 0, awayWins: 0, matches: [] }
    } : null;

    try {
      const response = await fetch("/api/match-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: queryText,
          historicalData: historicalDataPayload,
          provider: analysisProvider,
          model: analysisModel
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `伺服器響應錯誤 (${response.status})`);
      }

      const data: PredictionData = await response.json();

      // Inject local configured historical data so it is guaranteed to display locally!
      if (!data.historicalPerformance && homeTeamObj && awayTeamObj) {
        data.historicalPerformance = {
          teamAData: {
            teamName: homeTeamObj.name,
            recentResults: homeTeamObj.recentMatches.map(m => ({
              opponent: m.opponent,
              score: m.score,
              result: m.result,
              venue: m.venue,
              date: m.date
            })),
            trends: [
              { metric: "期望進球效率 (xG Ratio)", teamAValue: `場均 ${homeTeamObj.stats.avgGoalsScored} 球`, teamBValue: `場均 ${awayTeamObj.stats.avgGoalsScored} 球`, status: homeTeamObj.stats.avgGoalsScored >= awayTeamObj.stats.avgGoalsScored ? "advantage_a" : "advantage_b" },
              { metric: "防守零封場次 (Clean Sheets)", teamAValue: `勝率 ${homeTeamObj.stats.winRate}，零封率 ${homeTeamObj.stats.cleanSheets}`, teamBValue: `勝率 ${awayTeamObj.stats.winRate}，零封率 ${awayTeamObj.stats.cleanSheets}`, status: parseFloat(homeTeamObj.stats.cleanSheets) >= parseFloat(awayTeamObj.stats.cleanSheets) ? "advantage_a" : "advantage_b" },
              { metric: "場均失球頻率 (Defence)", teamAValue: `場均失 ${homeTeamObj.stats.avgGoalsConceded} 球`, teamBValue: `場均失 ${awayTeamObj.stats.avgGoalsConceded} 球`, status: homeTeamObj.stats.avgGoalsConceded <= awayTeamObj.stats.avgGoalsConceded ? "advantage_a" : "advantage_b" },
              { metric: "戰略勝率 (Win %)", teamAValue: homeTeamObj.stats.winRate, teamBValue: awayTeamObj.stats.winRate, status: parseFloat(homeTeamObj.stats.winRate) >= parseFloat(awayTeamObj.stats.winRate) ? "advantage_a" : "advantage_b" }
            ]
          },
          teamBData: {
            teamName: awayTeamObj.name,
            recentResults: awayTeamObj.recentMatches.map(m => ({
              opponent: m.opponent,
              score: m.score,
              result: m.result,
              venue: m.venue,
              date: m.date
            })),
            trends: [
              { metric: "期望進球效率 (xG Ratio)", teamAValue: `場均 ${homeTeamObj.stats.avgGoalsScored} 球`, teamBValue: `場均 ${awayTeamObj.stats.avgGoalsScored} 球`, status: homeTeamObj.stats.avgGoalsScored >= awayTeamObj.stats.avgGoalsScored ? "advantage_a" : "advantage_b" },
              { metric: "防守零封場次 (Clean Sheets)", teamAValue: `勝率 ${homeTeamObj.stats.winRate}，零封率 ${homeTeamObj.stats.cleanSheets}`, teamBValue: `勝率 ${awayTeamObj.stats.winRate}，零封率 ${awayTeamObj.stats.cleanSheets}`, status: parseFloat(homeTeamObj.stats.cleanSheets) >= parseFloat(awayTeamObj.stats.cleanSheets) ? "advantage_a" : "advantage_b" },
              { metric: "場均失球頻率 (Defence)", teamAValue: `場均失 ${homeTeamObj.stats.avgGoalsConceded} 球`, teamBValue: `場均失 ${awayTeamObj.stats.avgGoalsConceded} 球`, status: homeTeamObj.stats.avgGoalsConceded <= awayTeamObj.stats.avgGoalsConceded ? "advantage_a" : "advantage_b" },
              { metric: "戰略勝率 (Win %)", teamAValue: homeTeamObj.stats.winRate, teamBValue: awayTeamObj.stats.winRate, status: parseFloat(homeTeamObj.stats.winRate) >= parseFloat(awayTeamObj.stats.winRate) ? "advantage_a" : "advantage_b" }
            ]
          },
          h2hRecord: {
            winsA: h2hRecordObj?.homeWins || 0,
            winsB: h2hRecordObj?.awayWins || 0,
            draws: h2hRecordObj?.draws || 0,
            recentMatches: h2hRecordObj?.matches.map(m => ({
              date: m.date,
              score: `${m.home} ${m.score} ${m.away}`,
              winner: m.winner === "draw" ? "平局" : m.winner
            })) || []
          }
        };
      }

      setPrediction(data);
      saveToHistory(data);
      setSelectedAgentTab("debate"); // reset tab
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "發生不可預期的分析錯誤，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("football_predict_history");
  };

  const handleAddNewTeam = () => {
    if (!newTeamName.trim()) return;
    const newId = "team_" + Date.now();
    const newTeamItem: TeamHistory = {
      id: newId,
      name: newTeamName.trim(),
      stats: {
        avgGoalsScored: 1.5,
        avgGoalsConceded: 1.2,
        cleanSheets: "20%",
        winRate: "40%"
      },
      recentMatches: [
        { opponent: "未知對手", score: "1 - 1", result: "D", venue: "Home", date: "2026-06-01" },
        { opponent: "未知對手", score: "2 - 1", result: "W", venue: "Away", date: "2026-05-25" },
        { opponent: "未知對手", score: "0 - 1", result: "L", venue: "Home", date: "2026-05-18" },
        { opponent: "未知對手", score: "1 - 1", result: "D", venue: "Away", date: "2026-05-11" },
        { opponent: "未知對手", score: "2 - 0", result: "W", venue: "Home", date: "2026-05-04" }
      ]
    };
    const updated = [...teams, newTeamItem];
    setTeams(updated);
    localStorage.setItem("football_predictor_teams", JSON.stringify(updated));
    setNewTeamName("");
    setIsAddingNewTeam(false);
    setHomeTeamId(newId);
  };

  const handleUpdateH2H = (played: number, homeWins: number, draws: number, awayWins: number, matches: any[]) => {
    const updated = h2hs.map(h => {
      if ((h.homeTeamId === homeTeamId && h.awayTeamId === awayTeamId) ||
          (h.homeTeamId === awayTeamId && h.awayTeamId === homeTeamId)) {
        return {
          ...h,
          played,
          homeWins,
          draws,
          awayWins,
          matches
        };
      }
      return h;
    });
    const h2hExists = h2hs.some(h => 
      (h.homeTeamId === homeTeamId && h.awayTeamId === awayTeamId) ||
      (h.homeTeamId === awayTeamId && h.awayTeamId === homeTeamId)
    );
    if (!h2hExists) {
      updated.push({
        homeTeamId,
        awayTeamId,
        played,
        homeWins,
        draws,
        awayWins,
        matches
      });
    }
    setH2hs(updated);
    localStorage.setItem("football_predictor_h2hs", JSON.stringify(updated));
  };

  const handleSaveTeamEdit = () => {
    if (!editingTeamId) return;
    const updated = teams.map(t => {
      if (t.id === editingTeamId) {
        return {
          ...t,
          name: editName,
          stats: {
            avgGoalsScored: editAvgGoalsScored,
            avgGoalsConceded: editAvgGoalsConceded,
            cleanSheets: editCleanSheets,
            winRate: editWinRate
          },
          recentMatches: editRecentMatches
        };
      }
      return t;
    });
    setTeams(updated);
    localStorage.setItem("football_predictor_teams", JSON.stringify(updated));
    setEditingTeamId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Upper Sports-Bar Ticker */}
      <div className="bg-zinc-900 border-b border-zinc-800 text-xs px-4 py-2 flex items-center justify-between overflow-x-auto whitespace-nowrap">
        <div className="flex items-center space-x-6 text-zinc-400">
          <span className="flex items-center text-emerald-400 font-bold uppercase tracking-wider text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse"></span>
            AI Agent 聯戰預測系統
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="font-semibold text-zinc-200">協作協議：</span>
            <span>大數據 (A1) ⚔️ 貝氏神算 (A2) ⚔️ 辯證質疑官 (A3)</span>
          </span>
        </div>
        <div className="hidden lg:flex items-center space-x-4 text-zinc-400 divider-x">
          <span>數據更新源：即時歷史賽事 & 近況矩陣</span>
          <span>運作模式：3-Agent 辯證防震預測模型</span>
        </div>
      </div>

      {/* Main Grid Header */}
      <header className="border-b border-zinc-900 py-6 px-4 md:px-8 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Dribbble className="w-7 h-7 animate-spin-slow text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400">
                Football Match Predictor
              </h1>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                足球戰術推導與三智能體決策辯論系統
              </p>
            </div>
          </div>
          
           <div className="flex items-center space-x-3">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 space-x-2">
              <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">分析引擎 :</span>
              <select
                value={analysisProvider}
                onChange={(e) => {
                  const val = e.target.value as "gemini" | "zhipu" | "local" | "dashscope";
                  setAnalysisProvider(val);
                  setAnalysisModel(val === "dashscope" ? "qwen-plus" : val === "zhipu" ? "glm-4-flash" : val === "gemini" ? "gemini-3.5-flash" : "local");
                }}
                className="bg-transparent text-[11px] text-zinc-100 font-bold focus:outline-none cursor-pointer pr-1"
              >
                <option value="dashscope" className="bg-zinc-950 text-emerald-400 font-bold">阿里百煉 DashScope (通義 Qwen) 🌟</option>
                <option value="local" className="bg-zinc-950 text-zinc-200">內置極致精算引擎 (極速/免限流)</option>
                <option value="gemini" className="bg-zinc-950 text-zinc-200">Gemini 3.5 Flash (需 Secrets 金鑰)</option>
                <option value="zhipu" className="bg-zinc-950 text-zinc-200">智譜 AI GLM-4 / Flash (備用)</option>
              </select>
            </div>

            {analysisProvider === "dashscope" && (
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 space-x-2 animate-fade-in">
                <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">模型 :</span>
                <select
                  value={analysisModel}
                  onChange={(e) => setAnalysisModel(e.target.value)}
                  className="bg-transparent text-[11px] text-zinc-100 font-bold focus:outline-none cursor-pointer pr-1 text-emerald-400"
                >
                  <option value="qwen-plus" className="bg-zinc-950 text-zinc-200">Qwen Plus (平衡/推薦)</option>
                  <option value="qwen-max" className="bg-zinc-950 text-zinc-200">Qwen Max (最強/精準)</option>
                  <option value="qwen-turbo" className="bg-zinc-950 text-zinc-200">Qwen Turbo (極速)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Tab Channel Switcher */}
      <div className="bg-zinc-950 border-b border-zinc-900 border-t border-zinc-900 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex space-x-2 py-3">
          <button
            onClick={() => setMainTab("predict")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainTab === "predict"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/15"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            📊 智能對決研判 (賽事辯證)
          </button>
          
          <button
            onClick={() => setMainTab("simulate")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              mainTab === "simulate"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/15"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
            }`}
          >
            <Tv className="w-4 h-4 animate-pulse" />
            ⚽ 賽事模擬直播 (文字實況)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <ApiKeyDiagnostic />
      </div>

      {/* Academic Purpose Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 text-xs py-3 px-4 text-center font-medium shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
          <span>
            <strong>重要教育聲明：</strong> 本網站分析模型與對話數據<strong>僅作學習與學術交流用途</strong>。本站不提供亦不鼓勵任何博彩投注渠道，體育有風險，<strong>請勿進行賭博等非法投注活動</strong>。
          </span>
        </div>
      </div>

      {mainTab === "simulate" ? (
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex-1">
          <MatchSimulator
            initialHomeTeam={simHomeTeam}
            initialAwayTeam={simAwayTeam}
            initialFocusTopic={simFocusTopic}
            autoTriggerKey={simTriggerKey}
            provider={analysisProvider}
            model={analysisModel}
          />
        </div>
      ) : (
        /* Layout Content */
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar: Settings / MatchPresets / History */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          
          {/* Quick Match Selection */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm tracking-wide text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                賽事快速捷徑
              </h3>
              <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">經典對決</span>
            </div>
            
            <div className="space-y-3">
              {PRESET_MATCHES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputVal(preset.query);
                    handlePredict(preset.query);
                  }}
                  disabled={isLoading}
                  className="w-full text-left p-3.5 bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-700 rounded-xl transition duration-250 cursor-pointer disabled:opacity-50 text-xs flex flex-col gap-1 group"
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{preset.league}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-zinc-600 group-hover:text-emerald-400" />
                  </div>
                  <span className="font-semibold text-zinc-200 block truncate group-hover:text-emerald-300 transition-colors">
                    {preset.teams}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate w-full italic">
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
              <h3 className="font-display font-medium text-xs uppercase tracking-wider text-zinc-400 flex items-center">
                <RotateCcw className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                近期分析紀錄
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] hover:text-red-400 text-zinc-500 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  清除
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-none space-y-2.5 pr-1">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 text-zinc-600 gap-2">
                  <HelpCircle className="w-8 h-8 opacity-40 text-zinc-500" />
                  <span className="text-[11px]">暫無本輪預測數據</span>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPrediction(item.data)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition duration-200 cursor-pointer block ${
                      prediction?.matchInfo.homeTeam === item.data.matchInfo.homeTeam &&
                      prediction?.matchInfo.awayTeam === item.data.matchInfo.awayTeam
                        ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-inner"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 hover:border-zinc-850"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] text-zinc-650 font-mono mb-1">
                      <span>{item.timestamp}</span>
                      <span className="bg-emerald-500/10 text-emerald-500 px-1 py-0.2 rounded font-mono">
                        {item.data.rebuttalAndIntegration.modifiedScorePrediction}
                      </span>
                    </div>
                    <div className="font-semibold truncate text-zinc-300 border-0 p-0 text-left bg-transparent">
                      {item.data.matchInfo.queryTitle}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 truncate uppercase">
                      {item.data.matchInfo.homeTeam} 對 {item.data.matchInfo.awayTeam}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Main Content Panel */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Text Input Prompt Box */}
          <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm">
            <h3 className="font-display font-semibold text-[13px] tracking-wide text-zinc-300 mb-3.5 flex items-center">
              <span className="w-1.5 h-3 bg-emerald-500 rounded mr-2 inline-block"></span>
              輸入您想分析的對決 (例如兩隊名稱、賽事或關鍵戰術問題)：
            </h3>

            <div className="flex gap-2 p-1.5 bg-zinc-950 border border-zinc-850 rounded-xl focus-within:border-emerald-500/50 transition">
              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="例如：女子阿根廷甲組聯賽 泰拿尼斯女足 vs 飓風隊女足，預測最後比分及戰術對照..."
                className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 h-16 min-h-[50px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePredict(inputVal);
                  }
                }}
              />
              <div className="flex items-end pb-1 pr-1">
                <button
                  onClick={() => handlePredict(inputVal)}
                  disabled={isLoading || !inputVal.trim()}
                  className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold rounded-lg transition duration-200 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400"></span>
                支援任何聯賽（西甲、英超、意甲、歐聯、亞洲盃、世界盃、本地盃賽等）
              </span>
              <span className="hidden sm:inline">按下 Enter 即可送出分析</span>
            </div>
          </div>

          {/* Loading Transition Cockpit */}
          {isLoading && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 py-14 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
              
              {/* Ball Radar Loading Spinner */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-500/20 animate-spin-slow"></div>
                <div className="absolute inset-2 rounded-full border-2 border-emerald-500/40 animate-spin"></div>
                <div className="absolute inset-4 rounded-full border border-emerald-500/70 animate-pulse bg-emerald-500/10 flex items-center justify-center">
                  <Dribbble className="w-6 h-6 text-emerald-400 animate-bounce" />
                </div>
              </div>

              <div className="max-w-md">
                <h4 className="font-display font-semibold text-base text-zinc-100 flex items-center justify-center gap-2">
                  四合一 AI 頂級大師與戰術軍師研判中...
                </h4>
                <div className="h-1.5 bg-zinc-950 rounded-full mt-4 overflow-hidden relative border border-zinc-850">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${((loadingStep + 1) / loadingThoughts.length) * 100}%` }}
                  ></div>
                </div>
                
                {/* Rolling Agent thoughts animation */}
                <div className="min-h-[44px] flex items-center justify-center mt-4">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -7 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-emerald-400/90 leading-relaxed italic"
                    >
                      {loadingThoughts[loadingStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl bg-zinc-950/60 p-3.5 py-2.5 max-w-sm">
                <p className="text-[10px] text-zinc-500 leading-normal">
                  統計備戰中：這通常需要 10 - 20 秒。我們正多重呼叫模型進行深海博弈與觀點反駁、修正整合，以得出最具抗震係數的分析比分。
                </p>
              </div>
            </div>
          )}

          {/* Error Message Case */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-6 text-zinc-200">
              <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
                <div className="flex gap-3">
                  <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-red-400">分析引擎報錯</h4>
                    <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{errorMsg}</p>
                    
                    <div className="bg-zinc-950 rounded-lg p-3.5 py-2.5 text-[10px] text-zinc-500 mt-4 leading-normal font-mono">
                      <p className="font-semibold text-zinc-400 mb-1">💡 排除指引及解決方法：</p>
                      1. **若遇到當日免費配額上限 (429/Quota)**: 此為免費 API 的頻率限制。點擊右路按鈕即可無縫載入備用數據體驗全盤功能。<br />
                      2. **配置專屬金鑰**: 請於 AI Studio 右上角「Settings &gt; Secrets」面板添加自定義 `GEMINI_API_KEY`。<br />
                      3. **若顯示 "Failed to fetch" (網路錯誤)**: 可能是您的瀏覽器廣告/追蹤攔截器（如 AdBlock、uBlock 或 Brave Shields）誤將包含 `predict` 的 API 路徑當作追蹤器攔截。請點擊瀏覽器網址列旁的盾牌/攔截器圖示暫時將此網址設為白名單，或點擊下方按鈕無縫載入離線德比備用數據。
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0 flex flex-col gap-2">
                </div>
              </div>
            </div>
          )}

          {/* Loaded Prediction Showcase */}
          {prediction && !isLoading && (
            <div className="space-y-6">
              
              {/* Scoreboard Header Widget */}
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-[10px] bg-zinc-800 border-l border-b border-zinc-700/60 rounded-bl-xl font-semibold text-zinc-400 pointer-events-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-ping"></span>
                  賽事診斷完成
                </div>

                <div className="text-zinc-500 text-[10px] font-mono tracking-wider uppercase mb-1 flex items-center pr-12">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  分析焦點：{prediction.matchInfo.queryTitle || "足球深度預估"}
                </div>

                {/* Score Comparing Dashboard */}
                <div className="py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-zinc-850">
                  
                  {/* Home and Away labels with big VS */}
                  <div className="flex items-center space-x-4 md:space-x-8 shrink-0">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-display font-bold text-base shadow-sm mx-auto">
                        {prediction.matchInfo.homeTeam?.charAt(0) || "主"}
                      </div>
                      <span className="block font-bold text-base text-zinc-100 mt-2 tracking-wide truncate max-w-[110px]">
                        {prediction.matchInfo.homeTeam}
                      </span>
                      <span className="text-[10px] text-zinc-500">主場 / 戰略主導</span>
                    </div>

                    <div className="font-display font-black text-xl text-zinc-600 scale-95 select-none px-1">
                      VS
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-display font-bold text-base shadow-sm mx-auto">
                        {prediction.matchInfo.awayTeam?.charAt(0) || "客"}
                      </div>
                      <span className="block font-bold text-base text-zinc-100 mt-2 tracking-wide truncate max-w-[110px]">
                        {prediction.matchInfo.awayTeam}
                      </span>
                      <span className="text-[10px] text-zinc-500">客場 / 突襲制戰</span>
                    </div>
                  </div>

                  {/* Comparisons scoreboard */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 text-center justify-center">
                    
                    {/* Before critique score */}
                    <div className="bg-zinc-950 border border-zinc-850 px-4 py-3 rounded-xl min-w-[105px]">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">
                        A2 初始建議
                      </span>
                      <div className="font-display font-bold text-xl text-zinc-400">
                        {prediction.agent2.scorePrediction}
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        信心度: {prediction.agent2.confidence}%
                      </span>
                    </div>

                    {/* Arrow sign */}
                    <div className="p-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold leading-none hidden md:block">
                      ➜
                    </div>

                    {/* After critique score */}
                    <div className="bg-emerald-500/5 border border-emerald-500/35 px-4.5 py-3 rounded-xl min-w-[115px] shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                      <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider block mb-1 flex items-center justify-center gap-1">
                        <Scale className="w-2.5 h-2.5" /> 辯證修正比分
                      </span>
                      <div className="font-display font-bold text-2xl text-emerald-400">
                        {prediction.rebuttalAndIntegration.modifiedScorePrediction}
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold font-mono">
                        最終信心: {prediction.rebuttalAndIntegration.modifiedConfidence}%
                      </span>
                    </div>

                  </div>
                </div>

                {/* Probability Distribution Bar */}
                <div className="pt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                    <span>A2 大數據勝平負概率預估 :</span>
                  </div>
                  <div className="h-4.5 w-full bg-zinc-950 rounded-lg flex overflow-hidden border border-zinc-800 text-[10px] font-mono text-zinc-950 font-black">
                    <div 
                      className="bg-sky-400/85 hover:bg-sky-400 transition-colors flex items-center justify-center text-zinc-950" 
                      style={{ width: `${prediction.agent2.probabilities.homeWin}%` }}
                      title={`主勝概率: ${prediction.agent2.probabilities.homeWin}%`}
                    >
                      {prediction.agent2.probabilities.homeWin >= 15 && `主勝 ${prediction.agent2.probabilities.homeWin}%`}
                    </div>
                    <div 
                      className="bg-zinc-400/85 hover:bg-zinc-400 transition-colors flex items-center justify-center text-zinc-950 border-l border-r border-zinc-900" 
                      style={{ width: `${prediction.agent2.probabilities.draw}%` }}
                      title={`平局概率: ${prediction.agent2.probabilities.draw}%`}
                    >
                      {prediction.agent2.probabilities.draw >= 15 && `平局 ${prediction.agent2.probabilities.draw}%`}
                    </div>
                    <div 
                      className="bg-emerald-400/85 hover:bg-emerald-400 transition-colors flex items-center justify-center text-zinc-950" 
                      style={{ width: `${prediction.agent2.probabilities.awayWin}%` }}
                      title={`客勝概率: ${prediction.agent2.probabilities.awayWin}%`}
                    >
                      {prediction.agent2.probabilities.awayWin >= 15 && `客勝 ${prediction.agent2.probabilities.awayWin}%`}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-sky-400 rounded-sm inline-block"></span>
                      主 {prediction.matchInfo.homeTeam}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-zinc-400 rounded-sm inline-block"></span>
                      和局
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block"></span>
                      客 {prediction.matchInfo.awayTeam}
                    </span>
                  </div>
                </div>

                {/* Real-time Web Search Verified Grounding Sources */}
                {prediction.groundingSources && prediction.groundingSources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-850/50">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
                        即時聯網資訊剖析來源 (Web Grounding Sources)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prediction.groundingSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 rounded-full text-[10px] font-medium border border-sky-500/15 transition max-w-[200px] sm:max-w-[280px] break-all"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-1.5 font-mono">
                      * 資訊由預測模組透過 Google Search 即時查核 2026 最新聯賽現況與官網記錄。
                    </p>
                  </div>
                )}

                {/* Match Simulator Integration Direct Link Option */}
                <div className="mt-5 pt-4.5 border-t border-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left space-y-1">
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5 font-display">
                      <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                      智能鏈路已接通 - 2D 全場熱血實況直播
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-normal max-w-xl">
                      系統已備戰本次研判的戰略參數。點擊右側亦可發布 Agent 1 現場直播裁判、Agent 2 與 Agent 3 各自帶領球隊進行上下半場 1' - 90' 激情攻防文字記錄！
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSimHomeTeam(prediction.matchInfo.homeTeam);
                      setSimAwayTeam(prediction.matchInfo.awayTeam);
                      setSimFocusTopic(`基於【${prediction.matchInfo.queryTitle || "本場智能對決"}】研判：主隊「${prediction.matchInfo.homeTeam}」強攻戰略對抗客隊「${prediction.matchInfo.awayTeam}」的精算防手反攻，預計終局比分為 ${prediction.rebuttalAndIntegration.modifiedScorePrediction}，實時體能與牌證變化的全場大戰！`);
                      setSimTriggerKey(Date.now().toString());
                      setMainTab("simulate");
                    }}
                    className="w-full sm:w-auto px-5 py-2.8 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:opacity-90 active:scale-95 text-zinc-950 font-black text-xs rounded-xl transition duration-205 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <Tv className="w-4 h-4 text-zinc-950 animate-bounce" />
                    發動本場實況模擬直播 !
                  </button>
                </div>

              </div>

              {/* Sub tabs to switch view styles */}
              <div className="flex border-b border-zinc-850">
                <button
                  onClick={() => setSelectedAgentTab("debate")}
                  className={`px-4.5 py-3 text-xs font-bold leading-none border-b-2 transition duration-200 cursor-pointer ${
                    selectedAgentTab === "debate"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  }`}
                >
                  ⚔️ 智能體辯論沙盒 (Debate Sandbox)
                </button>
                <button
                  onClick={() => setSelectedAgentTab("comparison")}
                  className={`px-4.5 py-3 text-xs font-bold leading-none border-b-2 transition duration-200 cursor-pointer ${
                    selectedAgentTab === "comparison"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  }`}
                >
                  🧬 修正抗震分析 (Rebuttal Details)
                </button>
                <button
                  onClick={() => setSelectedAgentTab("history")}
                  className={`px-4.5 py-3 text-xs font-bold leading-none border-b-2 transition duration-200 cursor-pointer ${
                    selectedAgentTab === "history"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  }`}
                >
                  📊 歷史對決與戰意盤口 (H2H & Recent History)
                </button>
                <button
                  onClick={() => setSelectedAgentTab("final")}
                  className={`px-4.5 py-3 text-xs font-bold leading-none border-b-2 transition duration-200 cursor-pointer ${
                    selectedAgentTab === "final"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-500/[0.02]"
                      : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                  }`}
                >
                  🏆 終極決策合一書 (Final Synthesis)
                </button>
              </div>

              {/* TAB CONTENT CASE 1: Active Interactive Debate Box */}
              {selectedAgentTab === "debate" && (
                <div className="space-y-6">
                  
                  {/* Agent 1 Detail Card */}
                  <div className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 transition-all rounded-2xl p-5 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner font-bold text-xs">
                        A1
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-blue-400 flex items-center gap-1.5">
                            AI Agent 1：大數據分析專家
                          </h4>
                          <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full">
                            數據 & 狀態層
                          </span>
                        </div>
                        
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                          {prediction.agent1.analysis}
                        </p>

                        <div className="pt-2">
                          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block mb-2">
                            📊 分析指標板 (Key Metrics) :
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(prediction.agent1.keyMetrics || []).map((metric, i) => (
                              <div key={i} className="bg-zinc-950 border border-zinc-900 p-2.5 rounded-lg text-xs hover:border-zinc-800 transition flex items-center gap-2">
                                <span className="text-blue-400 text-xs shrink-0 font-bold">●</span>
                                <span className="text-zinc-300">{metric}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent 2 Detail Card */}
                  <div className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 transition-all rounded-2xl p-5 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-inner font-bold text-xs">
                        A2
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-teal-400 flex items-center gap-1.5">
                            AI Agent 2：比分預測大師
                          </h4>
                          <span className="text-[9px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded-full">
                            神算預估層
                          </span>
                        </div>
                        
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                          {prediction.agent2.rationale}
                        </p>

                        <div className="p-3 bg-zinc-950 border border-zinc-900/60 rounded-xl flex items-center justify-between gap-4">
                          <div className="text-xs">
                            <span className="text-[10px] text-zinc-500 block uppercase font-bold">初始推定比分</span>
                            <span className="text-lg font-display font-black text-teal-400">{prediction.agent2.scorePrediction}</span>
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-[10px] text-zinc-500 block uppercase font-bold">首推決斷信心</span>
                            <span className="font-mono text-base font-bold text-zinc-200">{prediction.agent2.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent 3 Skeptic / Critique Card */}
                  <div className="border border-amber-500/20 bg-amber-500/[0.01] hover:bg-amber-500/[0.03] transition-all rounded-2xl p-5 relative">
                    <div className="absolute top-3 right-3 shrink-0 p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-lg text-xs leading-none flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> 反對與挑刺官
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner font-bold text-xs">
                        A3
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center">
                          <h4 className="font-semibold text-sm text-amber-400">
                            AI Agent 3：統計與風險提示官
                          </h4>
                        </div>
                        
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line pr-16 bg-zinc-950/20 p-2.5 rounded">
                          {prediction.agent3.critique}
                        </p>

                        <div className="pt-2">
                          <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider block mb-2">
                            ⚠️ 質疑與黑天鵝風險警告 :
                          </span>
                          <div className="space-y-1.5">
                            {(prediction.agent3.keyRisks || []).map((risk, i) => (
                              <div key={i} className="bg-zinc-950 border border-amber-500/10 p-2.5 pl-3.5 rounded-lg text-xs hover:border-amber-500/20 transition flex items-start gap-2.5">
                                <span className="text-amber-500 text-xs shrink-0 font-bold mt-0.5">⚠️</span>
                                <span className="text-zinc-300 leading-normal">{risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Market Sentiment / Heat Trend Module */}
                        {prediction.agent3.marketSentimentTrend && prediction.agent3.marketSentimentTrend.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-amber-500/15 space-y-3">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-amber-500" />
                              <span className="text-[11px] text-amber-400 uppercase font-black tracking-wider block">
                                📊 市場大眾情緒演變 & 賠率變動信心博弈 (Sentiment & Odds Trend)
                              </span>
                            </div>
                            
                            {prediction.agent3.marketAnalysisText && (
                              <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/45 p-3 rounded-xl border border-amber-500/10 mb-1 leading-normal">
                                {prediction.agent3.marketAnalysisText}
                              </p>
                            )}

                            {/* Chart Area */}
                            <div className="bg-zinc-950/90 rounded-2xl p-4 border border-zinc-900 h-[240px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={prediction.agent3.marketSentimentTrend}
                                  margin={{ top: 8, right: 10, left: -25, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                                  <XAxis
                                    dataKey="timeStep"
                                    stroke="#71717a"
                                    fontSize={10}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    yAxisId="left"
                                    stroke="#ec4899"
                                    fontSize={9}
                                    domain={[0, 100]}
                                    tickLine={false}
                                    unit="%"
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#14b8a6"
                                    fontSize={9}
                                    domain={['auto', 'auto']}
                                    tickLine={false}
                                    tickFormatter={(v) => v.toFixed(2)}
                                  />
                                  <Tooltip
                                    content={<CustomMarketTooltip />}
                                    cursor={{
                                      stroke: "rgba(245, 158, 11, 0.25)",
                                      strokeWidth: 1.5,
                                      strokeDasharray: "4 4"
                                    }}
                                  />
                                  <Legend
                                    verticalAlign="top"
                                    height={28}
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: "9.5px", paddingBottom: "8px" }}
                                  />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="sentimentScore"
                                    name="大眾主隊支持情緒 (%)"
                                    stroke="#f59e0b"
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5, fill: "#f59e0b", strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: "#09090b", strokeWidth: 2 }}
                                  />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="predictionConfidence"
                                    name="AI 辯護預測信心 (%)"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    dot={{ r: 3.5, fill: "#06b6d4", strokeWidth: 0 }}
                                    activeDot={{ r: 6, stroke: "#09090b", strokeWidth: 2 }}
                                  />
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="oddsHome"
                                    name="主勝平均賠率 (Odds)"
                                    stroke="#ef4444"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 4.5, stroke: "#09090b", strokeWidth: 1.5 }}
                                  />
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="oddsAway"
                                    name="客勝平均賠率 (Odds)"
                                    stroke="#10b981"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 4.5, stroke: "#09090b", strokeWidth: 1.5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Agent 4 Tactical Analyst Card */}
                  {prediction.tacticalAnalysis && (
                    <div className="border border-violet-500/20 bg-violet-500/[0.01] hover:bg-violet-500/[0.03] transition-all rounded-2xl p-5 relative">
                      <div className="absolute top-3 right-3 shrink-0 p-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/25 rounded-lg text-xs leading-none flex items-center shadow-sm">
                        <Activity className="w-3.5 h-3.5 mr-1 text-violet-400" /> 陣盤戰術官
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 shadow-inner font-bold text-xs font-mono">
                          A4
                        </div>
                        <div className="flex-1 space-y-3.5">
                          <div className="flex items-center">
                            <h4 className="font-semibold text-sm text-violet-400 font-display">
                              AI Agent 4：頂級足球戰術分析師
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-zinc-950 border border-violet-500/10 p-3 rounded-xl transition hover:border-violet-500/20">
                              <span className="text-[10px] text-violet-400 font-black uppercase tracking-wider block mb-1">
                                🛡️ 陣型與對抗相剋
                              </span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                {prediction.tacticalAnalysis.formationMatchup}
                              </p>
                            </div>

                            <div className="bg-zinc-950 border border-violet-500/10 p-3 rounded-xl transition hover:border-violet-500/20">
                              <span className="text-[10px] text-violet-400 font-black uppercase tracking-wider block mb-1">
                                ⚡ 高位逼搶效果
                              </span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                {prediction.tacticalAnalysis.pressingEffectiveness}
                              </p>
                            </div>

                            <div className="bg-zinc-950 border border-violet-500/10 p-3 rounded-xl transition hover:border-violet-500/20">
                              <span className="text-[10px] text-violet-400 font-black uppercase tracking-wider block mb-1">
                                🎯 定位球與制空威脅
                              </span>
                              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                                {prediction.tacticalAnalysis.setPieceThreat}
                              </p>
                            </div>
                          </div>

                          <div className="bg-violet-950/20 border border-violet-500/15 p-3 rounded-xl">
                            <span className="text-[10px] text-violet-300 font-black uppercase tracking-wider block mb-1">
                              📋 戰術師終極沙盤判詞 (Tactical Verdict)
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed font-sans italic">
                              "{prediction.tacticalAnalysis.analystVerdict}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT CASE 2: Comparison detail (How Agent 1 & 2 adapt) */}
              {selectedAgentTab === "comparison" && (
                <div className="space-y-6">
                  
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-display font-bold text-sm tracking-wide text-zinc-200 border-b border-zinc-800 pb-3.5 mb-5 flex items-center gap-1.5">
                      <Scale className="w-4.5 h-4.5 text-emerald-400" />
                      智能體辯證：抗震攻防修正細節
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Agent 1 Response Card */}
                      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                              Agent 1 答辯
                            </span>
                            <span className="text-[9px] text-zinc-500">大數據立場微調</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                            {prediction.rebuttalAndIntegration.agent1Response}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-900/80 text-[10px] text-zinc-500 italic">
                          * 已針對 A3 的體能雙線疲勞論點進行陣容深度配比修正。
                        </div>
                      </div>

                      {/* Agent 2 Response Card */}
                      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                              Agent 2 適配
                            </span>
                            <span className="text-[9px] text-zinc-500">精算信心修正</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                            {prediction.rebuttalAndIntegration.agent2Response}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-900/80 text-[10px] text-zinc-500 italic">
                          * 將高比例傾斜的防守反擊與xG回歸概率計入，重調平局可能性。
                        </div>
                      </div>

                    </div>

                    {/* Score evolution graphic */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4.5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs">
                        <h4 className="font-bold text-zinc-300">防震微調結果摘要：</h4>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                          通過 Agent 3 的地毯式風險質詢，初始預測的激進比分已融合安全邊際。
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <span className="text-[9px] text-zinc-500 uppercase block">首推信心</span>
                          <span className="text-sm font-semibold font-mono text-zinc-400 leading-snug">{prediction.agent2.confidence}%</span>
                        </div>
                        <div className="text-lg text-zinc-700 leading-none">➔</div>
                        <div className="text-center">
                          <span className="text-[9px] text-emerald-400 uppercase block font-semibold">最終防震信心</span>
                          <span className="text-sm font-semibold font-mono text-emerald-400 leading-snug">{prediction.rebuttalAndIntegration.modifiedConfidence}%</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB CONTENT CASE 4: Historical Performance & H2H Tracker */}
              {selectedAgentTab === "history" && (
                <div className="space-y-6">
                  {/* Summary / Header banner */}
                  <div className="bg-zinc-900/60 border border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <h4 className="font-display font-medium text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        歷史交相戰力及連賽狀態矩陣
                      </h4>
                      <p className="text-[11px] text-zinc-500 leading-normal max-w-xl">
                        AI Agent 1、2、3 基於以下實時查核之歷史交鋒細節、兩隊近期各自 5 場戰績及核心戰術趨勢進行聯席預算，以消除單一戰意或盤口熱度的預測偏倚。
                      </p>
                    </div>
                  </div>

                  {prediction.historicalPerformance ? (
                    <div className="space-y-6">
                      
                      {/* H2H Stat Comparison Ring */}
                      <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Users className="w-4 h-4 text-sky-400" />
                          雙方歷史直接交鋒對賽 (H2H Stats)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                          {/* Left stats */}
                          <div className="text-center md:text-right space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-black block">
                              {prediction.matchInfo.homeTeam} 勝場
                            </span>
                            <span className="font-display font-extrabold text-3xl text-sky-400">
                              {prediction.historicalPerformance.h2hRecord.winsA} 次
                            </span>
                            <span className="text-[10px] text-zinc-600 block">
                              勝率: {Math.round((prediction.historicalPerformance.h2hRecord.winsA / Math.max(1, prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws)) * 100)}%
                            </span>
                          </div>

                          {/* Center bar indicator */}
                          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-850 space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold">
                              <span>和局 {prediction.historicalPerformance.h2hRecord.draws} 次</span>
                              <span>共 {prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws} 場交鋒</span>
                            </div>
                            <div className="h-3 w-full bg-zinc-900 rounded-full flex overflow-hidden">
                              <div className="bg-sky-400 hover:bg-sky-300 transition-colors" style={{ width: `${(prediction.historicalPerformance.h2hRecord.winsA / Math.max(1, prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws)) * 100}%` }}></div>
                              <div className="bg-zinc-500 hover:bg-zinc-400 transition-colors" style={{ width: `${(prediction.historicalPerformance.h2hRecord.draws / Math.max(1, prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws)) * 100}%` }}></div>
                              <div className="bg-emerald-400 hover:bg-emerald-300 transition-colors" style={{ width: `${(prediction.historicalPerformance.h2hRecord.winsB / Math.max(1, prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws)) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-zinc-650 font-mono">
                              <span>{prediction.matchInfo.homeTeam}</span>
                              <span>平局</span>
                              <span>{prediction.matchInfo.awayTeam}</span>
                            </div>
                          </div>

                          {/* Right stats */}
                          <div className="text-center md:text-left space-y-1">
                            <span className="text-[10px] text-zinc-500 uppercase font-black block">
                              {prediction.matchInfo.awayTeam} 勝場
                            </span>
                            <span className="font-display font-extrabold text-3xl text-emerald-400">
                              {prediction.historicalPerformance.h2hRecord.winsB} 次
                            </span>
                            <span className="text-[10px] text-zinc-600 block">
                              勝率: {Math.round((prediction.historicalPerformance.h2hRecord.winsB / Math.max(1, prediction.historicalPerformance.h2hRecord.winsA + prediction.historicalPerformance.h2hRecord.winsB + prediction.historicalPerformance.h2hRecord.draws)) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Recent H2H list matches details */}
                        <div className="mt-5 border-t border-zinc-855 pt-4">
                          <span className="text-[10px] text-zinc-500 font-bold block mb-2.5">📋 近期對賽對局明細 :</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(prediction.historicalPerformance?.h2hRecord?.recentMatches || []).map((match, idx) => (
                              <div key={idx} className="bg-zinc-950 p-2.5 px-3.5 rounded-xl border border-zinc-900 hover:border-zinc-800 transition text-xs flex items-center justify-between">
                                <span className="font-mono text-zinc-500 text-[10px]">{match.date}</span>
                                <span className="font-semibold text-zinc-300 mx-2">{match.score}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  match.winner === "Draw" || match.winner === "和局"
                                    ? "bg-zinc-800/80 text-zinc-400"
                                    : match.winner === prediction.matchInfo.homeTeam || match.winner === "teamA"
                                    ? "bg-sky-500/10 text-sky-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {match.winner === "Draw" || match.winner === "和局" ? "平局" : (match.winner === prediction.matchInfo.homeTeam || match.winner === "teamA" ? "主勝" : "客勝")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recent matches logs sidebar side comparison */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Team A recent */}
                        <div className="border border-zinc-805 bg-zinc-900/40 rounded-2xl p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3.5 border-b border-zinc-850 pb-2.5">
                            <h5 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                              {prediction.matchInfo.homeTeam} 近況往績
                            </h5>
                            <span className="text-[10px] font-mono text-zinc-500">整體走勢</span>
                          </div>

                          <div className="space-y-2.5 flex-1">
                            {(prediction.historicalPerformance?.teamAData?.recentResults || []).map((res, i) => (
                              <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-850 transition">
                                <div className="space-y-1">
                                  <div className="font-mono text-[9px] text-zinc-550">{res.date}</div>
                                  <div className="text-xs font-semibold text-zinc-350">
                                    <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800 mr-1.5 uppercase font-mono">{res.venue === "Home" || res.venue === "主場" ? "主" : "客"}</span>
                                    對手: {res.opponent}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-zinc-300 text-xs font-black">{res.score}</span>
                                  <span className={`w-6 h-6 rounded-lg text-[10px] font-mono font-black flex items-center justify-center ${
                                    res.result === "W" || res.result === "勝"
                                      ? "bg-sky-400 text-zinc-955 shadow-md"
                                      : res.result === "D" || res.result === "平"
                                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                      : "bg-red-500/20 text-red-500 border border-red-500/30"
                                  }`}>
                                    {res.result}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team B recent */}
                        <div className="border border-zinc-805 bg-zinc-900/40 rounded-2xl p-5 flex flex-col">
                          <div className="flex items-center justify-between mb-3.5 border-b border-zinc-850 pb-2.5">
                            <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              {prediction.matchInfo.awayTeam} 近況往績
                            </h5>
                            <span className="text-[10px] font-mono text-zinc-500">整體走勢</span>
                          </div>

                          <div className="space-y-2.5 flex-1">
                            {(prediction.historicalPerformance?.teamBData?.recentResults || []).map((res, i) => (
                              <div key={i} className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-zinc-850 transition">
                                <div className="space-y-1">
                                  <div className="font-mono text-[9px] text-zinc-550">{res.date}</div>
                                  <div className="text-xs font-semibold text-zinc-350">
                                    <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800 mr-1.5 uppercase font-mono">{res.venue === "Home" || res.venue === "主場" ? "主" : "客"}</span>
                                    對手: {res.opponent}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-zinc-300 text-xs font-black">{res.score}</span>
                                  <span className={`w-6 h-6 rounded-lg text-[10px] font-mono font-black flex items-center justify-center ${
                                    res.result === "W" || res.result === "勝"
                                      ? "bg-emerald-400 text-zinc-955 shadow-md"
                                      : res.result === "D" || res.result === "平"
                                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                      : "bg-red-500/20 text-red-500 border border-red-500/30"
                                  }`}>
                                    {res.result}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Tactical Performance Trend comparison table */}
                      <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-500" />
                          實體戰術指標 & 優勢研判 (Performance Trends)
                        </h4>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                                <th className="pb-2.5 font-bold">對比戰術指標</th>
                                <th className="pb-2.5 font-bold text-sky-400">{prediction.matchInfo.homeTeam} (主)</th>
                                <th className="pb-2.5 font-bold text-emerald-400">{prediction.matchInfo.awayTeam} (客)</th>
                                <th className="pb-2.5 font-bold text-center">AI 優勢判定</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-850/60">
                              {(prediction.historicalPerformance?.teamAData?.trends || []).map((item, idx) => (
                                <tr key={idx} className="hover:bg-zinc-900/20 transition">
                                  <td className="py-3 font-semibold text-zinc-300">{item.metric}</td>
                                  <td className="py-3 text-zinc-400 font-mono">{item.teamAValue}</td>
                                  <td className="py-3 text-zinc-400 font-mono">{item.teamBValue}</td>
                                  <td className="py-3 text-center">
                                    <span className={`px-2 py-0.8 rounded text-[10px] font-bold ${
                                      item.status === "advantage_a" || item.status === "teamA"
                                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/10"
                                        : item.status === "advantage_b" || item.status === "teamB"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                                        : "bg-zinc-800 text-zinc-500"
                                    }`}>
                                      {item.status === "advantage_a" || item.status === "teamA"
                                        ? `🔵 ${prediction.matchInfo.homeTeam} 佔優` 
                                        : (item.status === "advantage_b" || item.status === "teamB"
                                        ? `🟢 ${prediction.matchInfo.awayTeam} 佔優` 
                                        : "⚖️ 均勢平局")}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 border border-zinc-850 p-12 rounded-2xl flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <p>無此場賽事的實時歷史對賽數據庫緩存。</p>
                      <p className="mt-1 text-[10px]">您可以對其它經典對戰發動預測，系統將進行實時 Google 深海檢索並自動更新此處！</p>
                    </div>
                  )}

                </div>
              )}

              {/* TAB CONTENT CASE 3: Final Combined Analysis Report (Synthesis) */}
              {selectedAgentTab === "final" && (
                <div className="space-y-6">
                  
                  {/* Synthesis Core Card */}
                  <div className="border border-emerald-500/35 bg-gradient-to-tr from-zinc-950 to-zinc-900 rounded-3xl p-6.5 shadow-md relative overflow-hidden">
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        合一決策證書
                      </span>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        prediction.finalSynthesis.riskRating === "高"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : prediction.finalSynthesis.riskRating === "中"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        風險評級: {prediction.finalSynthesis.riskRating}
                      </span>
                    </div>

                    <div className="flex gap-4 items-start pb-4 border-b border-zinc-850">
                      <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 rounded-xl shrink-0">
                        <CheckCircle2 className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-zinc-100">
                          三智能體聯手・終極賽事判決
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-medium leading-relaxed uppercase">
                          整合大數據、模型分布及極端黑天鵝防範後的完美結論
                        </p>
                      </div>
                    </div>

                    {/* Summary copy */}
                    <div className="py-5 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                      {prediction.finalSynthesis.summary}
                    </div>

                    {/* Strategy panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      
                      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl">
                        <span className="text-[9px] text-zinc-500 uppercase font-black block mb-1 tracking-wider uppercase">
                          🌟 核心策略方向 (Strategy Recommendation)
                        </span>
                        <p className="text-xs text-zinc-200 font-semibold leading-normal">
                          {prediction.finalSynthesis.recommendation}
                        </p>
                      </div>

                      <div className="bg-zinc-950 border border-emerald-500/20 p-4 rounded-xl">
                        <span className="text-[9px] text-emerald-400 uppercase font-black block mb-0.5 tracking-wider uppercase">
                          🛡️ 精算推薦玩法 (Suggested Play Option)
                        </span>
                        <p className="text-sm text-emerald-300 font-bold leading-normal">
                          {prediction.finalSynthesis.suggestedOption}
                        </p>
                      </div>

                    </div>

                    {/* Disclaimer */}
                    <div className="mt-5 pt-4.5 border-t border-zinc-850/80 flex items-center justify-between gap-4 text-[10px] text-zinc-500 leading-normal italic">
                      <span>* 本報告僅供賽事數據分析與娛樂之用，體育賽事存有極高變數，請理性看待分析意見。</span>
                      <span>風險管理：嚴控本金</span>
                    </div>

                  </div>

                </div>
              )}

              {/* Bottom Quick Actions */}
              <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-400">
                <span>覺得對決分析精準？您可以嘗試輸入其他小眾或自訂賽事！</span>
                <button
                  onClick={() => {
                    setInputVal("");
                    setPrediction(null);
                  }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg border border-zinc-700 transition cursor-pointer"
                >
                  重置預測盤
                </button>
              </div>

            </div>
          )}

          {/* Empty Prompt State */}
          {!prediction && !isLoading && !errorMsg && (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-8 py-14 flex flex-col items-center justify-center text-center gap-5">
              
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-sm">
                <Dribbble className="w-7 h-7" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="font-display font-bold text-base text-zinc-200">
                  足球智能辯論終端已就緒
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed px-4">
                  在上方輸入框輸入您想解析的足球賽事（不限聯賽與杯賽），或點擊左側賽事快速捷徑，AI 戰略辯論官會立刻為您在沙盤上深度推衍。
                </p>
              </div>

              {/* Steps explanation tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl w-full mt-4 text-left">
                
                <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-blue-400 font-bold mb-1">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    1. 數據精算 (A1)
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    精準查核雙方各項往績、進球期望值、防守強度、關鍵主力缺席等高階要素。
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-teal-400 font-bold mb-1">
                    <Percent className="w-3.5 h-3.5 mr-1" />
                    2. 比分神算 (A2)
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    根據統計模型提供首推期望比分與勝和負幾率，並給出核心戰術依據。
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center text-amber-500 font-bold mb-1">
                    <Scale className="w-3.5 h-3.5 mr-1" />
                    3. 反駁抗震 (A3)
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    大膽質疑其餘智能體的樂觀盲點，列出體能衰竭、盤口熱度與冷門要素並修正最終結果。
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
      )}

      {/* Global Page Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-b border-zinc-900 pb-4">
            <p className="text-left text-zinc-400">
              © 2026 Football Match Predictor. 所有賽事分析、賠率比分與AI辯論推導均基於預測大數據與學術研討。
            </p>
            <div className="flex space-x-4 shrink-0">
              <span className="flex items-center text-amber-500 font-semibold bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                僅作學習交流・嚴禁賭博
              </span>
              <span className="flex items-center text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                學習沙盒狀態：運作中
              </span>
            </div>
          </div>
          <div className="text-zinc-600 text-[11px] leading-relaxed text-center space-y-1">
            <p>
              ⚠️ <strong>免責及特殊博彩警醒：</strong> 本站為純粹資訊技術交流、對話式模型研討及預估算法測試之<strong>非營利性學習平台</strong>。
            </p>
            <p>
              系統所產生的所有比分機率、大數據預判及專家攻防觀點<strong>切勿視為投注、非法博彩之依據或引導</strong>。博彩伴隨高風險，請理智看待、遠離投注。
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
