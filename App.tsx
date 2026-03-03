
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader2, Download, Settings, ChevronRight, Server, Layout, Database } from 'lucide-react';
import { ArchitectureType, AnalysisOrientation, UploadedFile, AnalysisResult, DatabaseType } from './types';
import { extractTextFromFile } from './services/fileParser';
import { performRequirementAnalysis } from './services/geminiService';
import { downloadAsDocx } from './services/docxGenerator';

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [architecture, setArchitecture] = useState<ArchitectureType>(ArchitectureType.BS);
  const [orientation, setOrientation] = useState<AnalysisOrientation>(AnalysisOrientation.REQUIREMENTS);
  const [database, setDatabase] = useState<DatabaseType>(DatabaseType.SQL_SERVER);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  const MAX_CHAR_LIMIT = 50000; // SRE 建議：限制輸入長度以控制成本

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFiles: UploadedFile[] = Array.from(uploadedFiles).map((f: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name,
      type: f.type,
      content: '',
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      try {
        const text = await extractTextFromFile(file);
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, content: text, status: 'completed' } : f));
      } catch (err) {
        console.error("File processing error:", err);
        setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error' } : f));
      }
    }
  };

  const handleStartAnalysis = async () => {
    const combinedContent = files
      .filter(f => f.status === 'completed')
      .map(f => `--- 文件名: ${f.name} ---\n${f.content}`)
      .join('\n\n');

    if (!combinedContent) {
      setError("請先上傳並等待文件處理完成。");
      return;
    }

    if (combinedContent.length > MAX_CHAR_LIMIT) {
      setError(`文件內容過大 (${combinedContent.length} 字元)，超過系統限制 (${MAX_CHAR_LIMIT} 字元)。請減少文件數量或簡化內容。`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const markdown = await performRequirementAnalysis(combinedContent, architecture, orientation, database, apiKey);
      setResult({
        markdown,
        timestamp: new Date().toLocaleString(),
        architecture,
        orientation,
        database
      });
    } catch (err: any) {
      setError(err.message || "分析過程中發生錯誤。");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">RAE 需求分析專家系統</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">.NET Solution Engine</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Panel: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              1. 匯入需求文件
            </h2>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-400 transition-colors cursor-pointer relative">
              <input
                type="file"
                multiple
                accept=".docx,.pdf,.pptx,.xlsx,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-900">拖放或點擊上傳</p>
                <p className="mt-1 text-xs text-slate-500">支援 DOCX, PDF, XLSX, PPTX</p>
              </div>
            </div>

            {files.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100">
                {files.map(file => (
                  <li key={file.id} className="py-3 flex items-center justify-between group">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className={`w-5 h-5 shrink-0 ${file.status === 'error' ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className="text-sm text-slate-700 truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'pending' && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                      {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        &times;
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-500" />
              2. 分析設定
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">目標系統架構</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setArchitecture(ArchitectureType.BS)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${architecture === ArchitectureType.BS ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Layout className="w-5 h-5 mb-1" />
                    <span>B/S</span>
                  </button>
                  <button
                    onClick={() => setArchitecture(ArchitectureType.CS)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs transition-all ${architecture === ArchitectureType.CS ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Server className="w-5 h-5 mb-1" />
                    <span>C/S</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">後端資料庫</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDatabase(DatabaseType.SQL_SERVER)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] leading-tight transition-all ${database === DatabaseType.SQL_SERVER ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Database className="w-4 h-4 mb-1" />
                    <span className="text-center">SQL Server</span>
                  </button>
                  <button
                    onClick={() => setDatabase(DatabaseType.ORACLE)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] leading-tight transition-all ${database === DatabaseType.ORACLE ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Database className="w-4 h-4 mb-1" />
                    <span className="text-center">Oracle</span>
                  </button>
                  <button
                    onClick={() => setDatabase(DatabaseType.POSTGRESQL)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-[10px] leading-tight transition-all ${database === DatabaseType.POSTGRESQL ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                  >
                    <Database className="w-4 h-4 mb-1" />
                    <span className="text-center">PostgreSQL</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">分析導向</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as AnalysisOrientation)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={AnalysisOrientation.REQUIREMENTS}>[requirements-analysis] 需求分析導向</option>
                  <option value={AnalysisOrientation.PROBLEM_SOLUTION}>[problem-solution] 問題解決導向</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  自訂 Gemini API Key (選填)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="輸入您的 API Key 以覆蓋伺服器設定"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  若伺服器未設定 Key，請在此輸入您的專屬 Key。
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">安全性說明</label>
                </div>
                <div className="text-[10px] text-slate-500 bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100 leading-relaxed">
                  <p className="font-semibold text-indigo-700 mb-1">🛡️ 企業級安全防護已啟動</p>
                  API Key 已加密存放於後端代理伺服器，您的開發者工具 (F12) 將不再洩漏任何敏感資訊。所有傳連線均受到後端限流保護。
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                disabled={isProcessing || files.filter(f => f.status === 'completed').length === 0}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>專家分析中...</span>
                  </>
                ) : (
                  <>
                    <span>生成 SRS 分析報告</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {error && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Panel: Result Display */}
        <div className="lg:col-span-8">
          {result ? (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="overflow-hidden">
                  <h3 className="text-lg font-bold text-slate-900">SRS 需求分析結果</h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    時間: {result.timestamp} | 架構: {result.architecture} | 資料庫: {result.database}
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => downloadAsDocx(result.markdown, `Requirement_Analysis_${Date.now()}`)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載 DOCX</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-white prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-100">
                  {result.markdown}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 text-center p-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">尚未生成報告</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">
                請在左側面板上傳需求文件並完成設定 (包含架構與資料庫)，系統將為您產生專業的 .NET 架構評估報告。
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs">
          <p>&copy; 2025 RAE Requirement Analysis Expert System. Powered by Gemini 3 Pro & .NET Solutioning.</p>
        </div>
      </footer>
    </div>
  );
}
