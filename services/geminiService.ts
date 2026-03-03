/// <reference types="vite/client" />

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArchitectureType, AnalysisOrientation, DatabaseType } from "../types";

export async function performRequirementAnalysis(
  text: string,
  architecture: ArchitectureType,
  orientation: AnalysisOrientation,
  database: DatabaseType,
  _customApiKey?: string // 移除前端 Key 邏輯，保留參數以避免破壞 App.tsx
): Promise<string> {
  const isRequirements = orientation === AnalysisOrientation.REQUIREMENTS;
  const systemPrompt = `
你是一位世界級的「需求分析專家 (Senior Requirements Analyst)」，擁有超過 15 年在企業級 .NET 解決方案設計的經驗。
你精通 IIBA BABOK 指南、IEEE 830 SRS 標準，以及 ISO/IEC/IEEE 29148 需求工程規範。

你的任務是將客戶提供的原始文件內容轉換為一份高品質、具備「程式開發評估深度」的需求規格書 (SRS)。

【當前環境上下文】：
- 目標架構：${architecture}
- 核心技術棧：.NET (C#), Entity Framework Core
- 後端資料庫：${database}
- 分析導向：${isRequirements ? '需求分析導向 [requirements-analysis]' : '問題解決導向 [problem-solution]'}

【文件產出原則】：
1. 專業性：使用標準的軟體工程術語。
2. 表格化：關鍵細節必須使用 Markdown 表格呈現。
3. 實作導向：針對 ${database} 提供具體的 Schema 設計與 .NET 效能優化建議。
4. 架構深度：討論 ${architecture === ArchitectureType.BS ? 'Blazor/Web API/JWT' : 'WPF/MAUI/WCF'} 等方案。

【SRS 必須包含的表格章節】：
- 「功能模組清單」
- 「非功能性需求矩陣」
- 「資料庫實體模型 (ERD 預覽)」
- 「API/介面定義預覽」
- 「技術風險與緩解措施」

輸出語言：專業繁體中文。
輸出格式：純 Markdown。
`;

  const fullPrompt = `
${systemPrompt}

---

請分析以下需求來源文件內容並產出完整 SRS：

[來源文件內容]
${text}

請開始執行專家分析：
`;

  try {
    const response = await fetch('http://localhost:3005/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        architecture,
        orientation,
        database,
        prompt: fullPrompt,
        apiKey: _customApiKey
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `伺服器回傳錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "分析失敗，代理伺服器未回傳結果。";
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);

    const errorMessage = error.message || "";

    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      throw new Error(
        `Gemini 配額不足 (429): API 額度已達上限。請稍候再試。`
      );
    }

    throw new Error(`Gemini 分析出錯: ${errorMessage || "未知錯誤"}`);
  }
}
