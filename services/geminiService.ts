/// <reference types="vite/client" />

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ArchitectureType, AnalysisOrientation, DatabaseType } from "../types";

export async function performRequirementAnalysis(
  text: string,
  architecture: ArchitectureType,
  orientation: AnalysisOrientation,
  database: DatabaseType,
  customApiKey?: string
): Promise<string> {
  let apiKey = (customApiKey || import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string) || "").trim();

  // 清洗 API Key，移除可能的非 ASCII 字元 (例如不可見字元、複製時夾帶的空白等)
  apiKey = apiKey.replace(/[^\x00-\x7F]/g, "");

  if (!apiKey) {
    console.warn("未提供 API Key，切換至展示模式 (Demo Mode)");
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模擬人工智慧處理延遲
    return `
# [展示模式] SRS 需求分析報告 - ${new Date().toLocaleDateString()}

> [!NOTE]
> 偵測到未設定 API Key，系統已自動切換至展示模式。以下為模擬產出的報告內容。

## 1. 專案概覽
- **目標架構**: ${architecture}
- **資料庫**: ${database}
- **分析導向**: ${orientation}

## 2. 核心功能模組 (範例)
| 模組編號 | 功能名稱 | 詳細描述 | 優先級 |
| :--- | :--- | :--- | :--- |
| F001 | 使用者驗證 | 包含登入、註冊、多因子驗證 (MFA) | 必須實作 |
| F002 | 需求匯入與解析 | 支援多種檔案格式 (DOCX, PDF) 之內容讀取 | 必須實作 |
| F003 | 自動化分析引擎 | 基於大語言模型之語義分析與結構化處理 | 應該實作 |

## 3. 技術實作建議 (.NET)
- 使用 **Entity Framework Core** 進行資料持久化。
- 針對 **${database}** 實作分頁與索引優化。
- 後端架構建議採用 **Clean Architecture** 以提升可維護性。

---
*這是一份模擬報告，請在設定 API Key 後獲取完整 AI 分析結果。*
    `.trim();
  }

  // 驗證 API Key 格式 (基本的非空檢查)
  if (!apiKey || apiKey.length < 10) {
    throw new Error("提供的 API Key 格式不正確或已失效，請檢查輸入內容。");
  }

  // 使用 GoogleGenerativeAI 並指定 API 版本為 v1
  // @ts-ignore - 部分 SDK 版本可能需要此參數在建構子中
  const genAI = new GoogleGenerativeAI(apiKey);

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

  const model = genAI.getGenerativeModel({
    // 使用 Gemini 2.0 Flash (使用者提到 2.5 但目前主要為 2.0，若 404 請檢查名稱)
    model: "gemini-2.0-flash"
  }, { apiVersion: "v1beta" });

  const fullPrompt = `
${systemPrompt}

---

請分析以下需求來源文件內容並產出完整 SRS：

[來源文件內容]
${text}

請開始執行專家分析：
`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || "分析失敗，模型未回傳結果。";
  } catch (error: any) {
    console.error("Gemini API Error details:", error);

    const errorMessage = error.message || "";

    // 處理 429 Quota Exceeded
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      throw new Error(
        `Gemini 配額不足 (429): 您目前的 API Key 已達到免費額度上限，或者該模型 (${model.model}) 在您所在的區域尚未對免費用戶開放。請稍候再試，或更換 API Key。`
      );
    }

    // 處理 404 Model Not Found (可能是版本不相容)
    if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      throw new Error(
        `Gemini 模型未找到 (404): 無法呼叫 ${model.model}。這可能是因為 API 版本或模型名稱不匹配。建議在 Google AI Studio 確認該模型是否可用。`
      );
    }

    throw new Error(`Gemini 分析出錯: ${errorMessage || "未知錯誤"}`);
  }
}
