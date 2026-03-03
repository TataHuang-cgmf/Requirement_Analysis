
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // 限制 Body 大小，防止超大文件攻擊

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ 錯誤: 未在環境變數中找到 GEMINI_API_KEY");
}

app.post('/api/analyze', async (req, res) => {
    const { text, architecture, orientation, database, prompt, apiKey: userApiKey } = req.body;

    const activeApiKey = userApiKey || apiKey;

    if (!activeApiKey) {
        return res.status(500).json({ error: "伺服器或使用者未提供 API Key" });
    }

    try {
        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash"
        }, { apiVersion: "v1beta" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();

        res.json({ text: resultText });
    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        res.status(500).json({
            error: error.message || "Gemini 分析過程發生錯誤",
            details: error.stack
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 需求分析專家後端代理已啟動: http://localhost:${port}`);
});
