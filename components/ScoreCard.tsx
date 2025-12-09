import React from 'react';
import { Edit2, Image as ImageIcon } from 'lucide-react';
import { ApplicantData, DocumentFile } from '../types';
import { calculateWowprimeSalary } from '../utils/logic';

interface ScoreCardProps {
  title: string;
  type: keyof ApplicantData | string; 
  data: ApplicantData;
  score?: number; 
  updateData: (key: any, value: any) => void;
  files: DocumentFile[];
  onPreview: (file: DocumentFile) => void;
  note?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, type, data, score = 0, updateData, files, onPreview, note }) => {
  
  const getEvidence = () => {
    switch (type) {
      case 'education': return { val: data.educationLevel, txt: data.educationEvidence, idx: data.educationFileIndex, setVal: 'educationLevel', setTxt: 'educationEvidence' };
      case 'salary': return { val: data.salaryAmount, txt: data.salaryReason, idx: data.salaryFileIndex, setVal: 'salaryAmount', setTxt: 'salaryReason' };
      case 'experience': return { val: data.experienceYears, txt: data.experienceEvidence, idx: data.experienceFileIndex, setVal: 'experienceYears', setTxt: 'experienceEvidence' };
      case 'qualification': return { val: data.qualificationScore, txt: data.qualificationEvidence, idx: data.qualificationFileIndex, setVal: 'qualificationScore', setTxt: 'qualificationEvidence' };
      case 'chinese': return { val: data.chineseLevel, txt: data.chineseEvidence, idx: data.chineseFileIndex, setVal: 'chineseLevel', setTxt: 'chineseEvidence' };
      case 'languages': return { val: data.foreignLanguageCount, txt: data.foreignLanguageEvidence, idx: data.foreignLanguageFileIndex, setVal: 'foreignLanguageCount', setTxt: 'foreignLanguageEvidence' };
      case 'policy': return { val: data.policyCompliance, txt: data.policyEvidence, idx: data.policyFileIndex, setVal: 'policyCompliance', setTxt: 'policyEvidence' };
      case 'scholarship': return { val: data.scholarship, txt: data.scholarshipEvidence, idx: data.scholarshipFileIndex, setVal: 'scholarship', setTxt: 'scholarshipEvidence' };
      default: return null;
    }
  };

  const fields = getEvidence();
  if (!fields) return null;

  const sourceFile = (fields.idx >= 0 && fields.idx < files.length) ? files[fields.idx] : null;

  const renderDescription = () => {
      if (type === 'languages') {
          return (
              <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 border rounded">
                  <p><strong>評分標準：</strong></p>
                  <ul className="list-disc list-inside">
                      <li>20分：具有華語以外之2項及以上他國語言能力。</li>
                      <li>10分：具有華語以外之1項他國語言能力，或於他國連續居留6年以上成長經驗。</li>
                  </ul>
                  <p className="mt-1 text-orange-600 font-bold">※ 港澳居民/華語母語者：需檢附「華語以外」之證明 (因母語即華語)。</p>
                  <p className="mt-1 text-[10px]">
                      認可考試：FLPT、TOEFL、TOEIC、IELTS、GEPT、劍橋領思(Linguaskill)、DELF、TestDaF、JLPT(日語)等。
                  </p>
              </div>
          );
      }
      if (type === 'policy') {
          return (
              <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 border rounded">
                  <p><strong>配合政府政策 (20分) 僅限以下專班：</strong></p>
                  <ul className="list-disc list-inside mt-1 leading-relaxed">
                      <li>新南向產學合作專班</li>
                      <li>印尼二技 2+i 產學合作國際專班</li>
                      <li>產學攜手合作僑生專班</li>
                      <li>海外青年技術訓練班 (二年制副學士)</li>
                  </ul>
              </div>
          );
      }
      return null;
  };

  const renderInput = () => {
    if (type === 'salary') {
        const salaryNum = calculateWowprimeSalary(fields.val as string);
        const netSalary = salaryNum > 2000 ? salaryNum - 2000 : salaryNum;
        return (
            <div className="flex flex-col gap-1">
                <input 
                    type="text" 
                    value={fields.val as string} 
                    onChange={(e) => updateData(fields.setVal, e.target.value)}
                    className="border p-2 rounded w-full font-bold text-lg"
                    placeholder="例如: 34600+2000"
                />
                <span className="text-xs text-slate-500">
                    本薪 (Net): <span className="font-bold text-blue-600">{netSalary.toLocaleString()}</span> (若輸入34600+2000，系統會自動扣除全勤2000計算)
                </span>
            </div>
        )
    }
    if (type === 'education') {
        return (
            <select className="border p-2 rounded w-full" value={fields.val as string} onChange={(e) => updateData(fields.setVal, e.target.value)}>
                <option value="Doctoral">Doctoral (30)</option>
                <option value="Master">Master (20)</option>
                <option value="Bachelor">Bachelor (10)</option>
                <option value="Associate">Associate (5)</option>
            </select>
        )
    }
    if (type === 'experience') {
        return (
             <div className="flex items-center gap-2">
                <input type="number" className="border p-2 rounded w-20" value={fields.val as number} onChange={(e) => updateData(fields.setVal, parseInt(e.target.value) || 0)} />
                <span>年 (Years)</span>
             </div>
        )
    }
    if (typeof fields.val === 'boolean') {
        return (
            <div className="flex items-center gap-2">
                <input type="checkbox" id={`check-${type}`} className="w-5 h-5 text-blue-600 rounded" checked={fields.val as boolean} onChange={(e) => updateData(fields.setVal, e.target.checked)} />
                <label htmlFor={`check-${type}`} className="text-sm font-medium">符合此項目 (Yes)</label>
            </div>
        )
    }
    if (type === 'chinese') {
        return (
            <select className="border p-2 rounded w-full" value={fields.val as string} onChange={(e) => updateData(fields.setVal, e.target.value)}>
                <option value="Fluent">Fluent (Level 5 / 80+) (30)</option>
                <option value="High">High (Level 4 / 70-79) (25)</option>
                <option value="Intermediate">Intermediate (Level 3 / 60-69) (20)</option>
                <option value="Basic">Basic (0)</option>
                <option value="None">None (0)</option>
            </select>
        )
    }
    if (type === 'languages') {
         return (
             <select className="border p-2 rounded w-full" value={fields.val as number} onChange={(e) => updateData(fields.setVal, parseInt(e.target.value))}>
                <option value={0}>0 項</option>
                <option value={1}>1 項 (10分) - 需證明/非台護照</option>
                <option value={2}>2 項以上 (20分)</option>
             </select>
         )
    }
     if (type === 'scholarship') {
        return (
            <select className="border p-2 rounded w-full" value={fields.val as string} onChange={(e) => updateData(fields.setVal, e.target.value)}>
                <option value="Gov">Government / Top 30% (20)</option>
                <option value="School">School / Top 50% & GPA 3.0 (5)</option>
                <option value="None">None (0)</option>
            </select>
        )
    }
    return <input type="text" className="border p-2 rounded w-full" value={String(fields.val)} onChange={(e) => updateData(fields.setVal, e.target.value)} />
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-primary border-y border-r border-slate-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
            <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-sm">得分: {score}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            {renderInput()}
            {renderDescription()}
          </div>
          <div className="relative">
            <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">AI 判定證據 (Evidence):</label>
            <textarea className="w-full text-sm text-blue-800 bg-blue-50 p-2 rounded border border-blue-100 min-h-[60px] resize-none focus:outline-none" value={fields.txt || ''} onChange={(e) => updateData(fields.setTxt, e.target.value)} />
            <Edit2 size={12} className="absolute top-0 right-0 text-blue-400 m-2 pointer-events-none"/>
          </div>
          {note && <p className="text-xs text-orange-600 font-medium mt-1">{note}</p>}
        </div>
        <div className="w-full md:w-48 flex-shrink-0 flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400">來源文件:</span>
            {sourceFile ? (
                <div className="border rounded-lg overflow-hidden h-32 relative group cursor-pointer bg-slate-100" onClick={() => onPreview(sourceFile)}>
                    {sourceFile.type.includes('image') ? <img src={sourceFile.previewUrl} className="w-full h-full object-cover" alt="Proof" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon /> PDF</div>}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <span className="bg-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100">放大</span>
                    </div>
                </div>
            ) : <div className="border border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center text-slate-400 text-xs">無文件</div>}
        </div>
      </div>
    </div>
  );
};