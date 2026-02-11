# 需求分析專家 (RAE)

這是一個基於 React 與 Gemini AI 的需求分析應用程式。

## 本地開發 (Run Locally)

**前置作業:** Node.js

1. **安裝套件:**

   ```bash
   npm install
   ```

2. **設定環境變數:**
   在根目錄新增 `.env.local` 並設定 `VITE_GEMINI_API_KEY`:

   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **啟動開發伺服器:**

   ```bash
   npm run dev
   ```

## 部署 (Deployment)

本專案已設定 GitHub Actions，當推送到 `main` 分支時會自動部署到 GitHub Pages。

### 自動部署

1. 將程式碼推送到 GitHub `main` 分支。
2. 前往 GitHub Repo 的 `Settings > Pages`。
3. 在 `Build and deployment > Source` 選擇 `GitHub Actions`。

### 手動建置

若需手動建置，請執行：

```bash
npm run build
```

產出的檔案將位於 `dist` 資料夾。

## 專案結構

- `App.tsx`: 主要應用程式邏輯
- `services/`: AI 與資料處理服務
- `types.ts`: TypeScript 型別定義
