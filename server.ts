import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Zhipu AI / ChatGLM API helper
async function queryZhipuAI(messages: any[], model: string = "glm-4-flash", jsonMode: boolean = true) {
  let apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey || apiKey === "MY_ZHIPU_API_KEY" || apiKey.trim() === "") {
    apiKey = "9faac9a6b0794af7a9db7fb594c88f5b.zf8EArqKxvco4fXc";
  }

  if (!apiKey) {
    throw new Error("ZHIPU_API_KEY environment variable is missing. Please configure it in your Secrets/Environment.");
  }

  const payload: any = {
    model: model || "glm-4-flash",
    messages,
    temperature: 0.7,
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  // Enable BigModel web search tool for live football data context
  payload.tools = [{ type: "web_search", web_search: { enable: true } }];

  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zhipu AI Error (${response.status}): ${text}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Multi-Agent Prompt
const SYSTEM_INSTRUCTION = `
你是一個專業的足球分析與預測多智能體系統。請以「繁體中文（廣東話/台灣體育分析風格）」模擬四位AI專家（Agent 1、Agent 2、Agent 3、Agent 4）之間的賽事辯論、反駁與整合過程，並輸出高質量的分析報告。

專家的分工與角色設定如下：

1. **AI Agent 1 (數據分析專家)**:
   - 負責深入分析硬數據與戰術形勢、球隊近期狀態、主客場攻防實力（進球率/失球率/零封過往記錄）。
   - 探討陣容與球員動向（關鍵傷病、停賽、核心球員回歸）。
   - 查閱歷史交鋒戰績（對賽往績、戰術相剋性）。

2. **AI Agent 2 (比分預測大師)**:
   - 根據 Agent 1 的分析，提供具體且合邏輯的預測比分、勝平負概率（%），以及對預測的初始信心度（0-100%）。
   - 給出其比分預測的戰術與數值依據。

3. **AI Agent 3 (統計質疑與風險提示官 - 核心反對派)**:
   - 專門挑戰與反對 Agent 1 的穩健主張與 Agent 2 的具體預測，尋找邏輯漏洞與潛在黑天鵝事件。
   - 分析市場隨時間熱度偏好與賠率走勢的博弈關係，提供風險與信心度對比。

4. **AI Agent 4 (戰術分析師)**:
   - 針對兩隊的常規陣式配合（如 4-3-3 對 4-2-3-1）、高位壓迫防卷、定位球演練、以及主帥排兵布陣的實戰克制性進行深入的沙盤推演與 verdict Verdict 結論。

5. **答辯、修正與終極合成 (Rebuttal, Modified Prediction and Synthesis)**:
   - 組織 Agent 1 針對 Agent 3 提問對線、給出答辯。
   - 讓 Agent 2 理性吸收 A3 的質疑，修正其比分預測。
   - 最後由系統輸出終極推薦配比（包含合意盤口及賽果配置總結）。

所有輸出必須完全符合所提供的 JSON Schema 格式。
`.trim();

app.post("/api/predict", async (req, res) => {
    const { message, historicalData, provider, model } = req.body;
    let selectedProvider = provider || (process.env.GEMINI_API_KEY ? "gemini" : "zhipu");
    let activeModel = model || (selectedProvider === "zhipu" ? "glm-4-flash" : "gemini-3.5-flash");
    let historyContext = "";

  try {
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "請輸入有效的足球賽事或足球問題" });
    }

    if (historicalData && typeof historicalData === "object") {
      try {
        const home = historicalData.homeTeam || {};
        const away = historicalData.awayTeam || {};
        const h2h = historicalData.h2h || {};
        
        const homeRecentStr = home.recentMatches && Array.isArray(home.recentMatches)
          ? home.recentMatches.map((m: any) => `${m.venue || "未知"} 對 ${m.opponent || "未知"} (${m.score || "0-0"}, ${m.result || "D"})`).join(" -> ")
          : "暫無數據";
          
        const awayRecentStr = away.recentMatches && Array.isArray(away.recentMatches)
          ? away.recentMatches.map((m: any) => `${m.venue || "未知"} 對 ${m.opponent || "未知"} (${m.score || "0-0"}, ${m.result || "D"})`).join(" -> ")
          : "暫無數據";

        const h2hMatchesStr = h2h.matches && Array.isArray(h2h.matches)
          ? h2h.matches.map((m: any) => `[${m.date || ""}] ${m.home || ""} ${m.score || "0-0"} ${m.away || ""}`).join(" | ")
          : "暫無數據";

        historyContext = `
【重要歷史與對戰數據 (Historical & H2H Data)】：
系統已從對戰數據庫中提取雙方球隊的真實歷史與對決資料，請各智能體務必在分析與推導中密切結合、引用並佐證此數據：

1. 主隊「${home.name || "主隊"}」近期賽績與走勢：
   - 近期 5 場戰績：${homeRecentStr}
   - 場均得球數：${home.stats?.avgGoalsScored || "未知"}，場均失球數：${home.stats?.avgGoalsConceded || "未知"}
   - 勝率：${home.stats?.winRate || "未知"}，零封率：${home.stats?.cleanSheets || "未知"}

2. 客隊「${away.name || "客隊"}」近期賽績與走勢：
   - 近期 5 場戰績：${awayRecentStr}
   - 場均得球數：${away.stats?.avgGoalsScored || "未知"}，場均失球數：${away.stats?.avgGoalsConceded || "未知"}
   - 勝率：${away.stats?.winRate || "未知"}，零封率：${away.stats?.cleanSheets || "未知"}

3. 雙方頭對頭 (H2H) 往績歷史：
   - 累計對戰次數：${h2h.played || "0"} 次，主隊勝：${h2h.homeWins || "0"} 次，平：${h2h.draws || "0"} 次，客隊勝：${h2h.awayWins || "0"} 次。
   - 歷史交鋒賽賽果：${h2hMatchesStr}

請注意：
- **Agent 1** (數據分析專家) 決策時必須明確參考並以此佐證。
- **Agent 2** (比分預測大師) 必須合乎此交锋偏向與近期得失球趨向。
- **Agent 3** (統計質疑者) 自此數據分析發掘盲點提出統計質詢。
`.trim();
      } catch (err) {
        console.error("Failed to parse historicalData in request, skipping context generation", err);
      }
    }

    let predictionData: any = {};

    if (selectedProvider === "zhipu") {
      const systemInstruction = SYSTEM_INSTRUCTION;
      const userMessage = `【重要指令：你必須利用內置的 web_search 搜尋工具查閱當前（2026年最新）關於雙方球隊的實時近況、歷史頭對頭 (H2H) 往績（最近5次對賽比分與雙方歷史勝平負）、各自最近 5 場賽事結果與對賽比分、聯賽最新排名、傷兵停賽名單、以及多項重要戰力趨勢指標（如期望進球xG、零封場數、傳球、陣容完整度等）。
請確保將這些詳盡的歷史與近況數據填寫到 json 中的 \`historicalPerformance\` 欄位，不得捏造或空白。
與此同等重要：
1. Agent 1 (數據分析專家)：必須具體引用 \`historicalPerformance\` 中的 H2H 及兩隊近況統計展開預判。
2. Agent 2 (比分預測大師)：必須基於對賽的場均失球率與交手勝率分佈，推導其初始預算比分。
3. Agent 3 (統計與風險提示官)：必須從近期各自 5 場表現是否偏離 xG 與 H2H 的黑天鵝歷史數據出發，提出強力的質疑與風險警示。】\n\n針對以下賽事或問題，進行四個智能體（Agent 1：數據分析、Agent 2：比分預測、Agent 3：質疑與風險、Agent 4：戰術分析）的深度推導與最後整合：\n\n「${message}」\n\n${historyContext}\n\n請以「繁體中文（廣東話/台灣體育分析風格）」對答，並務必輸出符合以下 JSON 格式的純 JSON 對象（切勿有任何額外說明，直接返回 JSON 內容），必須包含對應的所有嵌套欄位：
{
  "matchInfo": { "homeTeam": "主隊球隊官方名稱", "awayTeam": "客隊球隊官方名稱", "queryTitle": "標題" },
  "agent1": { "analysis": "數據與近期分析", "keyMetrics": ["數據1", "數據2", "數據3"] },
  "agent2": { "scorePrediction": "比分預測如 2 - 1", "probabilities": { "homeWin": 50, "draw": 30, "awayWin": 20 }, "confidence": 75, "rationale": "預測偏向與論述" },
  "agent3": { "critique": "統計反駁內容", "keyRisks": ["風險1", "風險2"], "marketAnalysisText": "市場分析", "marketSentimentTrend": [{ "timeStep": "5天前", "sentimentScore": 60, "oddsHome": 2.1, "oddsAway": 3.4, "predictionConfidence": 70 }, { "timeStep": "3天前", "sentimentScore": 55, "oddsHome": 2.2, "oddsAway": 3.2, "predictionConfidence": 72 }, { "timeStep": "臨場", "sentimentScore": 57, "oddsHome": 2.15, "oddsAway": 3.3, "predictionConfidence": 75 }] },
  "tacticalAnalysis": { "formationMatchup": "4-3-3 對陣 4-2-3-1", "pressingEffectiveness": "逼搶效果", "setPieceThreat": "定位球威脅", "analystVerdict": "戰術版沙盤總結" },
  "rebuttalAndIntegration": { "agent1Response": "A1回應A3對線及答辯", "agent2Response": "A2吸收質疑後的重置調整", "modifiedScorePrediction": "3 - 2", "modifiedConfidence": 80 },
  "finalSynthesis": { "recommendation": "投注配置貼士", "summary": "終極總結內容", "riskRating": "中", "suggestedOption": "雙重機會" },
  "historicalPerformance": {
    "teamAData": {
      "teamName": "主隊名稱",
      "recentResults": [{ "opponent": "對手名1", "score": "2 - 1", "result": "W", "venue": "Home", "date": "2026-06-15" }, { "opponent": "對手名2", "score": "1 - 1", "result": "D", "venue": "Away", "date": "2026-06-08" }],
      "trends": [{ "metric": "期望進球", "teamAValue": "場均 1.8", "teamBValue": "場均 1.2", "status": "advantage_a" }]
    },
    "teamBData": {
      "teamName": "客隊名稱",
      "recentResults": [{ "opponent": "對手名1", "score": "0 - 1", "result": "L", "venue": "Away", "date": "2026-06-12" }, { "opponent": "對手名2", "score": "2 - 0", "result": "W", "venue": "Home", "date": "2026-06-05" }]
    },
    "h2hRecord": {
      "winsA": 2, "winsB": 1, "draws": 2,
      "recentMatches": [{ "date": "2025-10-26", "score": "2 - 1", "winner": "teamA" }]
    }
  }
}`;

      const zhipuMessages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage }
      ];

      const resText = await queryZhipuAI(zhipuMessages, activeModel, true);
      let cleanedText = resText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      predictionData = JSON.parse(cleanedText);
      predictionData.groundingSources = [
        { title: `智譜大模型 (${activeModel}) 實時網絡分析`, url: `https://open.bigmodel.cn` }
      ];
    } else {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: activeModel,
        contents: `【重要指令：你必須利用內置的 Google Search 搜尋工具查閱當前（2026年最新）關於雙方球隊的實時近況、歷史頭對頭 (H2H) 往績（最近5次對賽比分與雙方歷史勝平負）、各自最近 5 場賽事結果與對賽比分、聯賽最新排名、傷兵停賽名單、以及多項重要戰力趨勢指標（如期望進球xG、零封場數、傳球、陣容完整度等）。
請確保將這些詳盡的歷史與近況數據填寫到 schema 中的 \`historicalPerformance\` 欄位，不得捏造 or 空白。
與此同等重要：
1. Agent 1 (數據分析專家)：必須具體引用 \`historicalPerformance\` 中的 H2H 及兩隊近況統計展開預判。
2. Agent 2 (比分預測大師)：必須基於對賽的場均失球率與交手勝率分佈，推導其初始預算比分。
3. Agent 3 (統計與風險提示官)：必須從近期各自 5 場表現是否偏離 xG 與 H2H 的黑天鵝歷史數據出發，提出強力的質疑與風險警示。】\n\n針對以下賽事或問題，進行四個智能體（Agent 1：數據分析、Agent 2：比分預測、Agent 3：質疑與風險、Agent 4：戰術分析）的深度推導與最後整合：\n\n「${message}」\n\n${historyContext}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchInfo: {
                type: Type.OBJECT,
                properties: {
                  homeTeam: { type: Type.STRING, description: "主隊名稱或主要分析對象 A" },
                  awayTeam: { type: Type.STRING, description: "客隊名稱或主要分析對象 B" },
                  queryTitle: { type: Type.STRING, description: "本次分析的賽事主題或標題" },
                },
                required: ["homeTeam", "awayTeam", "queryTitle"],
              },
              agent1: {
                type: Type.OBJECT,
                properties: {
                  analysis: { type: Type.STRING, description: "Agent 1 針對賽事背景、近況、大數據、歷史交鋒與陣容的精確分析體會，必須具體引用 H2H 與各自近期戰績" },
                  keyMetrics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Agent 1 列出的 3-4 個關鍵的核心數據統計指標（例如：近5場均得X球、主場勝率X%）",
                  },
                },
                required: ["analysis", "keyMetrics"],
              },
              agent2: {
                type: Type.OBJECT,
                properties: {
                  scorePrediction: { type: Type.STRING, description: "Agent 2 給出的具體預測比分，如「2 - 1」" },
                  probabilities: {
                    type: Type.OBJECT,
                    properties: {
                      homeWin: { type: Type.INTEGER, description: "主隊勝出的百分比幾率 (0-100)" },
                      draw: { type: Type.INTEGER, description: "平局的百分比幾率 (0-100)" },
                      awayWin: { type: Type.INTEGER, description: "客隊勝出的百分比幾率 (0-100)" },
                    },
                    required: ["homeWin", "draw", "awayWin"],
                  },
                  confidence: { type: Type.INTEGER, description: "Agent 2 本身分析的初始預測信心指數百分比 (0-100)" },
                  rationale: { type: Type.STRING, description: "Agent 2 根據歷史交鋒及得失球分佈計算比分與概率的依據" },
                },
                required: ["scorePrediction", "probabilities", "confidence", "rationale"],
              },
              agent3: {
                type: Type.OBJECT,
                properties: {
                  critique: { type: Type.STRING, description: "Agent 3 的反駁內容：聚焦兩隊近期走勢、歷史交鋒和黑天鵝漏洞，質詢 A1 及 A2" },
                  keyRisks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Agent 3 強理出的 3 點統計學偏差、黑天鵝風險 or 臨場隱患（如熱度過高、期望進球均值回歸、連賽疲勞）",
                  },
                  marketAnalysisText: { type: Type.STRING, description: "Agent 3 預判並分析的隨時間變化的市場大眾情緒、公共論調走向與大額資金對賽前冷熱分布與賠率影響" },
                  marketSentimentTrend: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeStep: { type: Type.STRING, description: "時間時間點，如：7天前、5天前、3天前、1天前、臨場" },
                        sentimentScore: { type: Type.INTEGER, description: "市場偏好主隊的樂觀熱度百分比 (0-100)" },
                        oddsHome: { type: Type.NUMBER, description: "當時主隊的平均勝賠值（如：1.85）" },
                        oddsAway: { type: Type.NUMBER, description: "當時客隊的平均勝賠值（如：3.20）" },
                        predictionConfidence: { type: Type.INTEGER, description: "在市場擾動熱度下，綜合分析的當前預測信心度％ (0-100)" }
                      },
                      required: ["timeStep", "sentimentScore", "oddsHome", "oddsAway", "predictionConfidence"]
                    },
                    description: "連續5個歷史或臨場時間節點，分析賠率變化對預測信心度的交互影響"
                  }
                },
                required: ["critique", "keyRisks", "marketAnalysisText", "marketSentimentTrend"],
              },
              tacticalAnalysis: {
                type: Type.OBJECT,
                properties: {
                  formationMatchup: { type: Type.STRING, description: "陣型對抗分析，詳述雙方陣型（例如：4-3-3 對陣 4-2-3-1）的空間博弈與中場克制點" },
                  pressingEffectiveness: { type: Type.STRING, description: "雙方高位逼搶效果評估與邊路防禦/解圍體系壓力" },
                  setPieceThreat: { type: Type.STRING, description: "球隊定位球、角球、高空轟炸威脅解析" },
                  analystVerdict: { type: Type.STRING, description: "Agent 4 (戰術分析師) 的實戰沙盤總結與勝負拐點預測" },
                },
                required: ["formationMatchup", "pressingEffectiveness", "setPieceThreat", "analystVerdict"],
              },
              rebuttalAndIntegration: {
                type: Type.OBJECT,
                properties: {
                  agent1Response: { type: Type.STRING, description: "Agent 1 對 Agent 3 提出質疑的答辯（分析其抗震性 or 進行傷病微調）" },
                  agent2Response: { type: Type.STRING, description: "Agent 2 吸收質疑後的調整和回應（重新衡量概率分佈）" },
                  modifiedScorePrediction: { type: Type.STRING, description: "辯論整合後，修正或堅持的最終預測比分（若堅持則不變）" },
                  modifiedConfidence: { type: Type.INTEGER, description: "整合後的最終修正信心指數百分比 (0-100，通常因思考了風險而有所調整)" },
                },
                required: ["agent1Response", "agent2Response", "modifiedScorePrediction", "modifiedConfidence"],
              },
              finalSynthesis: {
                type: Type.OBJECT,
                properties: {
                  recommendation: { type: Type.STRING, description: "綜合三方論述、辯論整合後的最終策略與核心投注推薦（如：客隊受讓、進球大2.5）" },
                  summary: { type: Type.STRING, description: "全盤觀點融會貫通後的終極客觀分析結晶" },
                  riskRating: { type: Type.STRING, description: "本次賽事投資的整體風險等級評定（低、中、高）" },
                  suggestedOption: { type: Type.STRING, description: "一言蔽之推薦（如「主勝防平」、「雙重機會(主勝/客勝)」）" },
                },
                required: ["recommendation", "summary", "riskRating", "suggestedOption"],
              },
              historicalPerformance: {
                type: Type.OBJECT,
                properties: {
                  teamAData: {
                    type: Type.OBJECT,
                    properties: {
                      teamName: { type: Type.STRING, description: "主隊球隊官方名稱" },
                      recentResults: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            opponent: { type: Type.STRING, description: "最近對陣客隊名稱" },
                            score: { type: Type.STRING, description: "比分，如 '2 - 0'" },
                            result: { type: Type.STRING, description: "W, D, 或 L" },
                            venue: { type: Type.STRING, description: "Home or Away" },
                            date: { type: Type.STRING, description: "比賽日期，如 '2026-06-12'" }
                          },
                          required: ["opponent", "score", "result", "venue", "date"]
                        },
                        description: "主隊近期各自的 5 場戰績"
                      },
                      trends: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            metric: { type: Type.STRING, description: "比較項目名稱，如 '期望進球效率 (xG)'" },
                            teamAValue: { type: Type.STRING, description: "主隊的值" },
                            teamBValue: { type: Type.STRING, description: "客隊的值" },
                            status: { type: Type.STRING, description: "必須為 'advantage_a', 'advantage_b', 或 'even'" }
                          },
                          required: ["metric", "teamAValue", "teamBValue", "status"]
                        },
                        description: "與客隊的比對指標趨勢"
                      }
                    },
                    required: ["teamName", "recentResults", "trends"]
                  },
                  teamBData: {
                    type: Type.OBJECT,
                    properties: {
                      teamName: { type: Type.STRING, description: "客隊球隊官方名稱" },
                      recentResults: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            opponent: { type: Type.STRING, description: "最近對陣主隊名稱" },
                            score: { type: Type.STRING, description: "比分，如 '1 - 2'" },
                            result: { type: Type.STRING, description: "W, D, 或 L" },
                            venue: { type: Type.STRING, description: "Home or Away" },
                            date: { type: Type.STRING, description: "比賽日期，如 '2026-06-09'" }
                          },
                          required: ["opponent", "score", "result", "venue", "date"]
                        },
                        description: "客隊近期各自的 5 場戰績"
                      }
                    },
                    required: ["teamName", "recentResults"]
                  },
                  h2hRecord: {
                    type: Type.OBJECT,
                    properties: {
                      winsA: { type: Type.INTEGER, description: "主隊歷史勝出的場次" },
                      winsB: { type: Type.INTEGER, description: "客隊歷史勝出的場次" },
                      draws: { type: Type.INTEGER, description: "歷史平局場次" },
                      recentMatches: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            date: { type: Type.STRING, description: "賽事日期如 '2025-10-26'" },
                            score: { type: Type.STRING, description: "完整的比分對決，如 '皇家馬德里 3 - 2 巴塞隆納'" },
                            winner: { type: Type.STRING, description: "得勝球隊名稱，平局為 'Draw' 或 '和局'" }
                          },
                          required: ["date", "score", "winner"]
                        },
                        description: "最近的 5 次歷史交鋒直接賽果明細"
                      }
                    },
                    required: ["winsA", "winsB", "draws", "recentMatches"]
                  }
                }
              }
            },
            required: [
              "matchInfo",
              "agent1",
              "agent2",
              "agent3",
              "tacticalAnalysis",
              "rebuttalAndIntegration",
              "finalSynthesis",
              "historicalPerformance"
            ],
          },
        },
      });

      const responseText = response.text || "{}";
      try {
        predictionData = JSON.parse(responseText);
      } catch (e) {
        console.error("DEBUG: Failed to parse Gemini response as JSON. Response text:", responseText);
        throw new Error("API returned invalid JSON response.");
      }
    }

    return res.json(predictionData);

  } catch (error: any) {
    console.error("DEBUG: Predict endpoint caught error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    const rawMessage = error.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    console.log("DEBUG: rawMessage:", rawMessage);
    let isQuotaExceeded = false;
    let customErrorMsg = "⚠️ 預測失敗了：我們暫時與 Gemini 預測伺服器失去聯繫，請確認您的 API 密鑰設置。";

    if (
      (error.status === 429) ||
      (error.statusCode === 429) ||
      (error.error && error.error.code === 429) ||
      (rawMessage.includes("429")) ||
      (rawMessage.includes("quota")) ||
      (rawMessage.includes("RESOURCE_EXHAUSTED")) ||
      (rawMessage.includes("exceeded your current quota"))
    ) {
      isQuotaExceeded = true;

      // Automatic fallback to Zhipu if Gemini fails
      if (selectedProvider === "gemini") {
        console.log("DEBUG: Gemini quota exceeded, attempting fallback to Zhipu AI.");
        try {
          const systemInstruction = SYSTEM_INSTRUCTION;
          const userMessage = `【重要指令：你必須利用內置的 web_search 搜尋工具查閱當前（2026年最新）關於雙方球隊的實時近況、歷史頭對頭 (H2H) 往績（最近5次對賽比分與雙方歷史勝平負）、各自最近 5 場賽事結果與對賽比分、聯賽最新排名、傷兵停賽名單、以及多項重要戰力趨勢指標（如期望進球xG、零封場數、傳球、陣容完整度等）。
請確保將這些詳盡的歷史與近況數據填寫到 json 中的 \`historicalPerformance\` 欄位，不得捏造或空白。
與此同等重要：
1. Agent 1 (數據分析專家)：必須具體引用 \`historicalPerformance\` 中的 H2H 及兩隊近況統計展開預判。
2. Agent 2 (比分預測大師)：必須基於對賽的場均失球率與交手勝率分佈，推導其初始預算比分。
3. Agent 3 (統計與風險提示官)：必須從近期各自 5 場表現是否偏離 xG 與 H2H 的黑天鵝歷史數據出發，提出強力的質疑與風險警示。】\n\n針對以下賽事或問題，進行四個智能體（Agent 1：數據分析、Agent 2：比分預測、Agent 3：質疑與風險、Agent 4：戰術分析）的深度推導與最後整合：\n\n「${message}」\n\n${historyContext}\n\n請以「繁體中文（廣東話/台灣體育分析風格）」對答，並務必輸出符合以下 JSON 格式的純 JSON 對象（切勿有任何額外說明，直接返回 JSON 內容），必須包含對應的所有嵌套欄位：
{
  "matchInfo": { "homeTeam": "主隊球隊官方名稱", "awayTeam": "客隊球隊官方名稱", "queryTitle": "標題" },
  "agent1": { "analysis": "數據與近期分析", "keyMetrics": ["數據1", "數據2", "數據3"] },
  "agent2": { "scorePrediction": "比分預測如 2 - 1", "probabilities": { "homeWin": 50, "draw": 30, "awayWin": 20 }, "confidence": 75, "rationale": "預測偏向與論述" },
  "agent3": { "critique": "統計反駁內容", "keyRisks": ["風險1", "風險2"], "marketAnalysisText": "市場分析", "marketSentimentTrend": [{ "timeStep": "5天前", "sentimentScore": 60, "oddsHome": 2.1, "oddsAway": 3.4, "predictionConfidence": 70 }, { "timeStep": "3天前", "sentimentScore": 55, "oddsHome": 2.2, "oddsAway": 3.2, "predictionConfidence": 72 }, { "timeStep": "臨場", "sentimentScore": 57, "oddsHome": 2.15, "oddsAway": 3.3, "predictionConfidence": 75 }] },
  "tacticalAnalysis": { "formationMatchup": "4-3-3 對陣 4-2-3-1", "pressingEffectiveness": "逼搶效果", "setPieceThreat": "定位球威脅", "analystVerdict": "戰術版沙盤總結" },
  "rebuttalAndIntegration": { "agent1Response": "A1回應A3對線及答辯", "agent2Response": "A2吸收質疑後的重置調整", "modifiedScorePrediction": "3 - 2", "modifiedConfidence": 80 },
  "finalSynthesis": { "recommendation": "投注配置貼士", "summary": "終極總結內容", "riskRating": "中", "suggestedOption": "雙重機會" },
  "historicalPerformance": {
    "teamAData": {
      "teamName": "主隊名稱",
      "recentResults": [{ "opponent": "對手名1", "score": "2 - 1", "result": "W", "venue": "Home", "date": "2026-06-15" }, { "opponent": "對手名2", "score": "1 - 1", "result": "D", "venue": "Away", "date": "2026-06-08" }],
      "trends": [{ "metric": "期望進球", "teamAValue": "場均 1.8", "teamBValue": "場均 1.2", "status": "advantage_a" }]
    },
    "teamBData": {
      "teamName": "客隊名稱",
      "recentResults": [{ "opponent": "對手名1", "score": "0 - 1", "result": "L", "venue": "Away", "date": "2026-06-12" }, { "opponent": "對手名2", "score": "2 - 0", "result": "W", "venue": "Home", "date": "2026-06-05" }]
    },
    "h2hRecord": {
      "winsA": 2, "winsB": 1, "draws": 2,
      "recentMatches": [{ "date": "2025-10-26", "score": "2 - 1", "winner": "teamA" }]
    }
  }
}`;
          const zhipuMessages = [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage }
          ];

          const resText = await queryZhipuAI(zhipuMessages, "glm-4-flash", true);
          let cleanedText = resText.trim();
          if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          }
          const fallbackData = JSON.parse(cleanedText);
          fallbackData.groundingSources = [
            { title: `智譜大模型 (glm-4-flash) 實時網絡分析 (Fallback)`, url: `https://open.bigmodel.cn` }
          ];
          console.log("DEBUG: Fallback successful.");
          return res.json(fallbackData);
        } catch (fallbackErr) {
          console.error("DEBUG: Zhipu fallback failed:", fallbackErr);
          return res.status(500).json({
            error: "⚠️ Gemini 額度上限，且備用 Zhipu AI 預測也失敗了。請稍後重試。",
            isQuotaExceeded: true,
            raw: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          });
        }
      }

      customErrorMsg = "⚠️ 您的 Gemini 帳戶已達當日免費額度上限或高頻呼叫限制 (Rate Limit / Quota Exceeded)。請稍等 1 分鐘後再試，或更換您的 API 金鑰。";
    } else {
      customErrorMsg = `⚠️ 預測失敗了：${rawMessage}`;
    }

    return res.status(500).json({
      error: customErrorMsg,
      isQuotaExceeded,
      raw: rawMessage
    });
  }
});

// SIMULATION SYSTEM INSTRUCTION
const SIMULATOR_SYSTEM_INSTRUCTION = `
你是一位精通足球實況解說、戰術模擬及裁判規則的「文字直播模擬器」。請以「繁體中文（廣東話/台灣體育解說混搭風格）」模擬一場引人入勝的足球比賽文字直播。

這場比賽中，三位 Agent 的角色切換為：
1. **Agent 1 (裁判及現場直播員/主播)**:
   - 作為直播主控角色！負責宣布上半場 & 下半場開球、吹罰犯規、派發黃紅牌、吹響中場與全場哨音、現場氣氛烘托、傷補宣佈以及關鍵進球判定。
   - 口白風格：激情洋溢，賽場脈搏感強。
2. **Agent 2 (代表「主隊 / Home Team」的進攻意識體)**:
   - 負責帶領主隊發動極具威脅的攻勢，展現主隊的戰術打法（例如：高位高頻壓迫、傳控推進、邊路撕裂傳中、暴力遠射）。
   - 當主隊控球或進球時，展示 Agent 2 熱血高昂的教練/攻勢視角台詞。
3. **Agent 3 (代表「客隊 / Away Team」的防守與防守反擊意識體)**:
   - 負責帶領客隊進行鐵血防守、驚險解圍、防守反擊、利用定位球、快速抓反擊黑天鵝漏洞。
   - 當客隊成功包夾、出奇制勝踢入神仙波、或向裁判爭辯牌證時，發表其精算反撲式的精妙台詞。

請模擬生成至少 20 個關鍵時間節點（分佈於 1' 到 90' 之間，必須包含:
- 上半場：開場 kickoff、兩隊互有攻守各 2-3 次、犯規/牌證判罰 1-2 次、至少 1 個進球事件（在上半場中後段）、半場結束 whistle。
- 下半場：開場 kickoff、換人戰術重調、兩隊攻守互換、關鍵救險/門線解圍 1-2 次、爭議判罰（裁判 Agent 1 的介入）、又一個進球事件（或懸念比分）、尾聲狂攻、全場結束 whistle）。

所有輸出必須完全符合所提供的 JSON Schema 格式。
`.trim();

// API endpoint to simulate match
app.post("/api/simulate", async (req, res) => {
    const { homeTeam, awayTeam, focusTopic, provider, model } = req.body;
    const hTeam = homeTeam || "皇家馬德里";
    const aTeam = awayTeam || "巴塞隆納";
    const topic = focusTopic || "標準強強聯賽交鋒";

    let selectedProvider = provider || (process.env.GEMINI_API_KEY ? "gemini" : "zhipu");
    let activeModel = model || (selectedProvider === "zhipu" ? "glm-4-flash" : "gemini-3.5-flash");

  try {
    let simData: any = {};

    if (selectedProvider === "zhipu") {
      const userContent = `請模擬 "${hTeam}" (代表: Agent 2 攻勢) 與 "${aTeam}" (代表: Agent 3 防反/質疑) 的整場精彩比賽。主題設定為: "${topic}"。
請生成完備的上下半場每一分鐘與關鍵分鐘的文字直播記錄！
請以繁體中文（廣東話/台灣體育解說混搭風格）回答，且必須輸出符合以下 JSON 格式的純 JSON 對象：
{
  "simulationMeta": {
    "homeTeam": "${hTeam}",
    "awayTeam": "${aTeam}",
    "stadium": "智能戰術沙盤體育場",
    "refereeName": "Agent 1 (即時直播裁判官)",
    "finalScore": "總比分如 2 - 1",
    "totalShotsHome": 14,
    "totalShotsAway": 10,
    "possessionHome": 55,
    "possessionAway": 45
  },
  "timeline": [
    {
      "minute": 1,
      "half": "first",
      "speaker": "Agent 1",
      "speakerName": "Agent 1 (主裁判兼主播)",
      "type": "kickoff",
      "title": "大戰開球",
      "content": "文字直播台詞",
      "currentHomeScore": 0,
      "currentAwayScore": 0
    }
  ]
}
請確保 timeline 包含至少 12 個關鍵賽事時間節點的分佈。`;

      const zhipuMessages = [
        { role: "system", content: SIMULATOR_SYSTEM_INSTRUCTION },
        { role: "user", content: userContent }
      ];

      const resText = await queryZhipuAI(zhipuMessages, activeModel, true);
      let cleanedText = resText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }
      simData = JSON.parse(cleanedText);
    } else {
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: activeModel,
        contents: `請模擬 "${hTeam}" (代表: Agent 2 攻勢) 與 "${aTeam}" (代表: Agent 3 防反/質疑) 的整場精彩比賽。主題設定為: "${topic}"。請生成完備的上下半場每一分鐘與關鍵分鐘的文字直播記錄！`,
        config: {
          systemInstruction: SIMULATOR_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simulationMeta: {
                type: Type.OBJECT,
                properties: {
                  homeTeam: { type: Type.STRING },
                  awayTeam: { type: Type.STRING },
                  stadium: { type: Type.STRING },
                  refereeName: { type: Type.STRING, description: "主裁判姓名" },
                  finalScore: { type: Type.STRING, description: "如 '2 - 1'" },
                  totalShotsHome: { type: Type.INTEGER },
                  totalShotsAway: { type: Type.INTEGER },
                  possessionHome: { type: Type.INTEGER, description: "主隊控球率百分比 (如 54)" },
                  possessionAway: { type: Type.INTEGER, description: "客隊控球率百分比 (如 46)" }
                },
                required: ["homeTeam", "awayTeam", "stadium", "refereeName", "finalScore"]
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    minute: { type: Type.INTEGER, description: "比賽分鐘數 (1-90)" },
                    half: { type: Type.STRING, description: "可填 'first' 或 'second'" },
                    speaker: { type: Type.STRING, description: "必須為 'Agent 1' (裁判直播員), 'Agent 2' (主隊), 或 'Agent 3' (客隊)" },
                    speakerName: { type: Type.STRING, description: "展示角色身份，例如：'Agent 1 (主裁判兼主播)', 'Agent 2 主隊總教練', 'Agent 3 客隊戰略官'" },
                    type: { type: Type.STRING, description: "可填 'kickoff', 'neutral', 'attack_home', 'attack_away', 'foul', 'card', 'goal_home', 'goal_away', 'save', 'substitution', 'whistle'" },
                    title: { type: Type.STRING, description: "事件簡要標題，如：『神雷倒地攔截』、『閃電主宰破門』" },
                    content: { type: Type.STRING, description: "激情澎湃的文字直播具體描述台詞交流內容" },
                    currentHomeScore: { type: Type.INTEGER },
                    currentAwayScore: { type: Type.INTEGER }
                  },
                  required: ["minute", "half", "speaker", "speakerName", "type", "title", "content", "currentHomeScore", "currentAwayScore"]
                }
              }
            },
            required: ["simulationMeta", "timeline"]
          }
        }
      });

      simData = JSON.parse(response.text || "{}");
    }

    return res.json(simData);

  } catch (error: any) {
    console.error("Simulation error:", error);
    const rawMessage = error.message || (typeof error === "object" ? JSON.stringify(error) : String(error));
    let customErrorMsg = "⚠️ 足球模擬發動失敗。請確認您的 API 密鑰狀態良好。";
    let isQuotaExceeded = false;

    if (
      (error.status === 429) ||
      (error.statusCode === 429) ||
      (error.error && error.error.code === 429) ||
      (rawMessage.includes("429")) ||
      (rawMessage.includes("quota")) ||
      (rawMessage.includes("RESOURCE_EXHAUSTED")) ||
      (rawMessage.includes("exceeded your current quota"))
    ) {
      isQuotaExceeded = true;

      // Automatic fallback to Zhipu if Gemini fails
      if (selectedProvider === "gemini") {
        console.log("Gemini quota exceeded, falling back to Zhipu AI for simulation.");
        try {
          const userContent = `請模擬 "${hTeam}" (代表: Agent 2 攻勢) 與 "${aTeam}" (代表: Agent 3 防反/質疑) 的整場精彩比賽。主題設定為: "${topic}"。
請生成完備的上下半場每一分鐘與關鍵分鐘的文字直播記錄！
請以繁體中文（廣東話/台灣體育解說混搭風格）回答，且必須輸出符合以下 JSON 格式的純 JSON 對象：
{
  "simulationMeta": {
    "homeTeam": "${hTeam}",
    "awayTeam": "${aTeam}",
    "stadium": "智能戰術沙盤體育場",
    "refereeName": "Agent 1 (即時直播裁判官)",
    "finalScore": "總比分如 2 - 1",
    "totalShotsHome": 14,
    "totalShotsAway": 10,
    "possessionHome": 55,
    "possessionAway": 45
  },
  "timeline": [
    {
      "minute": 1,
      "half": "first",
      "speaker": "Agent 1",
      "speakerName": "Agent 1 (主裁判兼主播)",
      "type": "kickoff",
      "title": "大戰開球",
      "content": "文字直播台詞",
      "currentHomeScore": 0,
      "currentAwayScore": 0
    }
  ]
}
請確保 timeline 包含至少 12 個關鍵賽事時間節點的分佈。`;

          const zhipuMessages = [
            { role: "system", content: SIMULATOR_SYSTEM_INSTRUCTION },
            { role: "user", content: userContent }
          ];

          const resText = await queryZhipuAI(zhipuMessages, "glm-4-flash", true);
          let cleanedText = resText.trim();
          if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
          }
          const simData = JSON.parse(cleanedText);
          return res.json(simData);
        } catch (fallbackErr) {
          console.error("Zhipu fallback failed for simulation:", fallbackErr);
        }
      }

      customErrorMsg = "⚠️ 您的 Gemini 帳戶已達當日免費額度上限或高頻呼叫限制 (Rate Limit / Quota Exceeded)。請稍等 1 分鐘後再試，或更換您的 API 金鑰。";
    } else {
      customErrorMsg = `⚠️ 模擬失敗了：${rawMessage}`;
    }

    return res.status(500).json({
      error: customErrorMsg,
      isQuotaExceeded,
      raw: rawMessage
    });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
