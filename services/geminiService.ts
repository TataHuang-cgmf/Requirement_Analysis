
import { GoogleGenAI, Type } from "@google/genai";
import { ArchitectureType, AnalysisOrientation, DatabaseType } from "../types";

export async function performRequirementAnalysis(
  text: string, 
  architecture: ArchitectureType,
  orientation: AnalysisOrientation,
  database: DatabaseType
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const isRequirements = orientation === AnalysisOrientation.REQUIREMENTS;
  
  const systemInstruction = `
    你是一位世界級的「需求分析專家 (Senior Requirements Analyst)」，擁有超過 15 年在企業級 .NET 解決方案設計的經驗。
    你精通 IIBA BABOK 指南、IEEE 830 SRS 標準，以及 ISO/IEC/IEEE 29148 需求工程規範。
    
    你的任務是將客戶提供的原始文件內容轉換為一份高品質、具備「程式開發評估深度」的需求規格書 (SRS)。
    
    【當前環境上下文】：
    - 目標架構：${architecture}
    - 核心技術棧：.NET (C#), Entity Framework Core
    - 後端資料庫：${database}
    - 分析導向：${isRequirements ? '需求分析導向 [requirements-analysis] (側重於功能分解、邊界定義、業務邏輯與系統限制)' : '問題解決導向 [problem-solution] (側重於現狀痛點識別、解決方案映射、價值主張與技術轉型路徑)'}
    
    【文件產出原則】：
    1. 專業性：使用標準的軟體工程術語。
    2. 表格化：關鍵細節必須使用 Markdown 表格呈現，以利於閱讀與後續轉換。
    3. 實作導向：針對 ${database} 提供具體的 Schema 設計與 .NET 效能優化建議（如索引策略、並行處理、${database} 特有的 SQL 特性）。
    4. 架構深度：如果是 B/S，討論 Blazor/Web API/JWT；如果是 C/S，討論 WPF/MAUI/WCF/gRPC 等整合方案。

    【SRS 必須包含的表格章節】：
    - 「功能模組清單」：模組編號、功能名稱、詳細描述、使用者角色、優先級 (請務必使用中文：必須實作、應該實作、可以實作、不在此次範圍)。
    - 「非功能性需求矩陣」：分類 (效能/安全/可用性)、具體衡量指標 (KPI)、實作技術建議。
    - 「資料庫實體模型 (ERD 預覽)」：資料表名稱、說明、核心欄位、關聯屬性、${database} 專屬優化建議。
    - 「API/介面定義預覽」：端點路徑/方法、功能說明、傳入參數、回傳結構。
    - 「技術風險與緩解措施」：風險描述、影響程度 (請務必使用中文：高、中、低)、預防措施。

    輸出語言：專業繁體中文。
    輸出格式：純 Markdown。
  `;

  const prompt = `
    請分析以下需求來源文件內容並產出完整 SRS：
    
    [來源文件內容]
    ${text}
    
    請開始執行專家分析：
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3, // 降低隨機性，確保結構穩定
      topP: 0.95,
      topK: 40
    }
  });

  return response.text || "分析失敗，模型未回傳結果。";
}
