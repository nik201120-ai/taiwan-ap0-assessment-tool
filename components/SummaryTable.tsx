import React, { useState } from 'react';
import { Eye, Edit3 } from 'lucide-react';
import { ApplicantData } from '../types';
import { calculateWowprimeSalary } from '../utils/logic';

interface Props {
  data: ApplicantData;
  updateData: (key: keyof ApplicantData, value: any) => void;
}

export const SummaryTable: React.FC<Props> = ({ data, updateData }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const InputCell = ({ field, width }: { field: keyof ApplicantData, width?: string }) => {
    if (!isEditMode) {
       return <div className={`p-1 truncate ${width ? width : ''}`} title={String(data[field])}>{String(data[field])}</div>;
    }
    return (
      <input 
        type="text"
        className={`bg-transparent p-1 focus:bg-white focus:outline-none border-b border-transparent focus:border-blue-500 rounded w-full ${width ? width : ''}`}
        value={String(data[field])}
        onChange={(e) => updateData(field, e.target.value)}
      />
    );
  };

  const SalaryCell = () => {
    const gross = calculateWowprimeSalary(data.salaryAmount);
    const net = gross > 2000 ? gross - 2000 : gross; 
    
    if (!isEditMode) return <div className="p-1 text-right">{net}</div>

    return (
      <input 
        type="number"
        className="bg-transparent p-1 focus:bg-white focus:outline-none border-b border-transparent focus:border-blue-500 rounded w-full text-right"
        value={net}
        onChange={(e) => {
          const newNet = parseFloat(e.target.value);
          const newGross = isNaN(newNet) ? 0 : newNet + 2000;
          updateData('salaryAmount', newGross.toString());
        }}
      />
    );
  };

  const EducationCell = () => {
      if (!isEditMode) {
         const map: Record<string, string> = { 'Doctoral': '01 (博士)', 'Master': '02 (碩士)', 'Bachelor': '03 (學士)', 'Associate': '04 (副學士)' };
         return <div className="p-1">{map[data.educationLevel] || data.educationLevel}</div>
      }
      return (
        <select className="bg-transparent p-1 w-full" value={data.educationLevel} onChange={(e) => updateData('educationLevel', e.target.value)}>
            <option value="Doctoral">01 (博士)</option>
            <option value="Master">02 (碩士)</option>
            <option value="Bachelor">03 (學士)</option>
            <option value="Associate">04 (副學士)</option>
        </select>
      )
  };

  return (
    <div>
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center no-print">
             <h2 className="text-lg font-bold text-slate-800">申請人資料彙總 (Summary)</h2>
             <div className="flex items-center gap-4">
                 <p className="text-xs text-slate-500">提示: 預覽模式可選取複製表格文字</p>
                 <button onClick={() => setIsEditMode(!isEditMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${isEditMode ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                   {isEditMode ? <><Edit3 size={14}/> 編輯中</> : <><Eye size={14}/> 預覽/複製模式</>}
                 </button>
             </div>
        </div>
        <div className="p-0 overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                <tr>
                <th className="p-2 text-left border-r border-slate-200 w-[80px]">中文姓名</th>
                <th className="p-2 text-left border-r border-slate-200 w-[50px]">性別</th>
                <th className="p-2 text-left border-r border-slate-200 w-[80px]">英文姓</th>
                <th className="p-2 text-left border-r border-slate-200 w-[80px]">英文名</th>
                <th className="p-2 text-left border-r border-slate-200 w-[80px]">國籍</th>
                <th className="p-2 text-left border-r border-slate-200 w-[100px]">護照號碼</th>
                <th className="p-2 text-left border-r border-slate-200 w-[90px]">生日</th>
                <th className="p-2 text-left border-r border-slate-200 w-[90px]">最高學歷</th>
                <th className="p-2 text-left border-r border-slate-200 w-[90px]">聘僱(起)</th>
                <th className="p-2 text-left border-r border-slate-200 w-[90px]">聘僱(迄)</th>
                <th className="p-2 text-left border-r border-slate-200 w-[80px]">代碼</th>
                <th className="p-2 text-left border-r border-slate-200 w-[100px]">職稱</th>
                <th className="p-2 text-left border-r border-slate-200 w-[100px]">每月薪資<span className="text-[10px] block font-normal text-slate-400">不含全勤</span></th>
                <th className="p-2 text-left border-r border-slate-200 min-w-[150px]">工作內容</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                <td className="p-1 border-r border-slate-200"><InputCell field="chineseName" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="gender" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="englishSurname" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="englishGivenName" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="nationality" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="passportNumber" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="dateOfBirth" /></td>
                <td className="p-1 border-r border-slate-200"><EducationCell /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="employmentStart" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="employmentEnd" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="jobCode" /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="jobTitle" /></td>
                <td className="p-1 border-r border-slate-200"><SalaryCell /></td>
                <td className="p-1 border-r border-slate-200"><InputCell field="jobContent" /></td>
                </tr>
            </tbody>
            </table>
        </div>
    </div>
  );
};