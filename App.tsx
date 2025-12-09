import React, { useState, useEffect } from 'react';
import { Upload, FileText, Save, Calculator, CheckCircle, XCircle, User, Award, Printer, Trash2, RotateCcw } from 'lucide-react';
import { ApplicantData, JobType, DocumentFile, ScoringCriteria } from './types';
import { calculateScore, initialApplicantData, generateDateLogic } from './utils/logic';
import { analyzeDocuments } from './services/geminiService';
import { ScoreCard } from './components/ScoreCard';
import { SummaryTable } from './components/SummaryTable';
import { FilePreview } from './components/FilePreview';

function App() {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [data, setData] = useState<ApplicantData>(initialApplicantData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  
  // 檢查 API Key 狀態 (支援 GitHub Actions 注入或本地開發)
  // 在預覽環境中，process.env.API_KEY 由平台自動注入
  const hasEnvKey = !!process.env.API_KEY;

  const [scoreResult, setScoreResult] = useState<{ total: number, breakdown: ScoringCriteria }>({
    total: 0,
    breakdown: { education: 0, salary: 0, experience: 0, qualification: 0, chinese: 0, languages: 0, policy: 0, scholarship: 0 }
  });

  useEffect(() => {
    const result = calculateScore(data);
    setScoreResult(result);
  }, [data]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesList = Array.from(e.target.files) as File[];
      const newFiles: DocumentFile[] = filesList.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('確定要清空所有檔案與重置資料嗎？')) {
      setFiles([]);
      const dates = generateDateLogic();
      setData({ ...initialApplicantData, employmentStart: dates.start, employmentEnd: dates.end });
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      alert('請先上傳文件');
      return;
    }
    // 檢查是否有 Key
    if (!hasEnvKey && !process.env.API_KEY) {
       alert('未偵測到 API Key，請檢查 GitHub Secrets 設定或聯絡管理員。');
       return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeDocuments(files);
      setData(prev => {
        const dates = generateDateLogic();
        return {
          ...prev, ...result,
          employmentStart: dates.start, employmentEnd: dates.end,
          salaryAmount: result.salaryAmount || prev.salaryAmount
        };
      });
    } catch (error) {
      console.error(error);
      alert('AI 分析失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${data.chineseName || 'applicant'}_assessment.json`;
    link.click();
  };

  const handleLoadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loadedData = JSON.parse(event.target?.result as string);
          setData(loadedData);
        } catch (err) { alert('JSON 格式錯誤'); }
      };
      reader.readAsText(file);
    }
  };

  const updateData = <K extends keyof ApplicantData>(key: K, value: ApplicantData[K]) => setData(prev => ({ ...prev, [key]: value }));

  const handleJobToggle = () => {
    if (data.jobType === JobType.CHEF) {
      updateData('jobType', JobType.CADRE);
      updateData('jobTitle', '儲備幹部');
      updateData('jobCode', '-');
      updateData('jobContent', '餐飲服務國際化諮詢');
    } else {
      updateData('jobType', JobType.CHEF);
      updateData('jobTitle', '廚藝人員');
      updateData('jobCode', '512');
      updateData('jobContent', '餐飲烹調');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <nav className="bg-secondary text-white p-4 shadow-md sticky top-0 z-40 no-print">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold">外籍專才評點制 (AP0) 評估系統</h1>
          </div>
          <div className="flex items-center gap-4">
            {hasEnvKey ? (
               <span className="text-xs bg-green-800 text-green-100 px-2 py-1 rounded">系統 Key 已載入 (Protected)</span>
            ) : (
               <span className="text-xs bg-red-800 text-red-100 px-2 py-1 rounded">未設定 GitHub Secret</span>
            )}
            <div className="flex gap-2">
               <label className="bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded cursor-pointer text-sm flex items-center gap-1"><Upload size={16} /> 載入 JSON <input type="file" className="hidden" accept=".json" onChange={handleLoadJson} /></label>
               <button onClick={handleSaveJson} className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm flex items-center gap-1"><Save size={16} /> 儲存</button>
               <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm flex items-center gap-1"><Printer size={16} /> 列印</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print">
          <div className="flex justify-between items-center mb-4">
             <h2 className="font-bold text-lg text-slate-700">文件上傳區</h2>
             {files.length > 0 && <button onClick={handleClearAll} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm flex items-center gap-1 border border-red-200"><RotateCcw size={14} /> 清空重置</button>}
          </div>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition relative group">
            <input type="file" multiple accept="image/*,application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
            <div className="pointer-events-none">
              <Upload className="mx-auto w-12 h-12 text-slate-400 mb-2 group-hover:text-blue-500 transition" />
              <p className="text-lg font-medium text-slate-600">拖放文件至此，或點擊上傳</p>
              <p className="text-sm text-slate-400 mt-1">支援 JPG, PNG, PDF (多檔上傳)</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {files.map(f => (
                <div key={f.id} className="relative group bg-slate-100 p-2 rounded border border-slate-200 w-24 h-24 flex items-center justify-center">
                  {f.type.includes('image') ? <img src={f.previewUrl} alt={f.name} className="max-w-full max-h-full object-contain" /> : <FileText className="text-slate-500 w-10 h-10" />}
                  <button onClick={() => removeFile(f.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm"><Trash2 size={14} /></button>
                  <p className="absolute bottom-0 text-[10px] w-full text-center truncate bg-white/80 px-1">{f.name}</p>
                </div>
              ))}
              <div className="w-full flex justify-end mt-2">
                <button onClick={handleAnalyze} disabled={isAnalyzing} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition ${isAnalyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-blue-700 shadow-lg'}`}>
                  {isAnalyzing ? 'AI 分析中...' : <><Calculator size={20} /> 開始 AI 評估</>}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="sticky top-[72px] z-30 bg-white/90 backdrop-blur border-b border-slate-200 py-4 px-6 -mx-4 md:mx-0 md:rounded-xl md:shadow-sm flex justify-between items-center transition-all">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-black ${scoreResult.total >= 70 ? 'text-green-600' : 'text-red-600'}`}>{scoreResult.total}</div>
              <div>
                <div className="text-sm text-slate-500 font-semibold uppercase tracking-wider">總積分</div>
                <div className="flex items-center gap-1 font-medium">
                  {scoreResult.total >= 70 ? <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16}/> 符合資格 (Pass)</span> : <span className="text-red-600 flex items-center gap-1"><XCircle size={16}/> 未達標準 (Fail)</span>}
                </div>
              </div>
            </div>
            <button onClick={handleJobToggle} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                 {data.jobType === JobType.CHEF ? <User size={18}/> : <Award size={18}/>} 切換: {data.jobTitle}
            </button>
        </section>

        <section className="grid grid-cols-1 gap-6">
          <ScoreCard title="1. 學歷 (Education)" type="education" data={data} score={scoreResult.breakdown.education} updateData={updateData} files={files} onPreview={setPreviewFile} />
          <ScoreCard title="2. 薪資 (Salary)" type="salary" data={data} score={scoreResult.breakdown.salary} updateData={updateData} files={files} onPreview={setPreviewFile} note="系統自動計算: 輸入 34600+2000 會自動扣除全勤 2000" />
          <ScoreCard title="3. 工作經驗 (Work Experience)" type="experience" data={data} score={scoreResult.breakdown.experience} updateData={updateData} files={files} onPreview={setPreviewFile} note="需檢附服務證明或勞保明細" />
          <ScoreCard title="4. 具備職務資格 (Qualifications)" type="qualification" data={data} score={scoreResult.breakdown.qualification} updateData={updateData} files={files} onPreview={setPreviewFile} />
          <ScoreCard title="5. 華語語文能力 (Chinese Language)" type="chinese" data={data} score={scoreResult.breakdown.chinese} updateData={updateData} files={files} onPreview={setPreviewFile} />
          <ScoreCard title="6. 他國語言能力 (Foreign Language)" type="languages" data={data} score={scoreResult.breakdown.languages} updateData={updateData} files={files} onPreview={setPreviewFile} />
          <ScoreCard title="7. 配合政府政策 (Policy)" type="policy" data={data} score={scoreResult.breakdown.policy} updateData={updateData} files={files} onPreview={setPreviewFile} />
          <ScoreCard title="8. 學校獎學金/成績 (Scholarship)" type="scholarship" data={data} score={scoreResult.breakdown.scholarship} updateData={updateData} files={files} onPreview={setPreviewFile} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
          <SummaryTable data={data} updateData={updateData} />
        </section>
      </main>

      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}

export default App;