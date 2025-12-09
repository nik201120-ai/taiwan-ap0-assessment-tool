import { ApplicantData, ScoringCriteria } from '../types';
import { addMonths, addDays, addYears, format, subDays } from 'date-fns';

export const initialApplicantData: ApplicantData = {
  chineseName: '',
  englishSurname: '',
  englishGivenName: '',
  gender: '',
  nationality: '',
  passportNumber: '',
  dateOfBirth: '',
  jobType: 'Chef' as any,
  jobCode: '512',
  jobTitle: '廚藝人員',
  jobContent: '餐飲烹調',
  employmentStart: '',
  employmentEnd: '',
  educationLevel: 'Bachelor',
  educationEvidence: '',
  educationFileIndex: -1,
  salaryAmount: '0',
  salaryReason: '',
  salaryFileIndex: -1,
  experienceYears: 0,
  experienceEvidence: '',
  experienceFileIndex: -1,
  qualificationScore: false,
  qualificationEvidence: '',
  qualificationFileIndex: -1,
  chineseLevel: 'None',
  chineseEvidence: '',
  chineseFileIndex: -1,
  foreignLanguageCount: 0,
  foreignLanguageEvidence: '',
  foreignLanguageFileIndex: -1,
  policyCompliance: false,
  policyEvidence: '',
  policyFileIndex: -1,
  scholarship: 'None',
  scholarshipEvidence: '',
  scholarshipFileIndex: -1
};

export const calculateWowprimeSalary = (input: string): number => {
  if (!input) return 0;
  
  // 處理 "34600+2000" 的情況: 全部加總 (36600)
  // 後續計分邏輯會再扣除 2000 全勤，變回 34600 本薪
  if (input.includes('+')) {
      const parts = input.split('+').map(p => parseFloat(p.replace(/[^\d.]/g, '')));
      return parts.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : curr), 0);
  }

  // 處理 "2-4" 職級寫法
  const levelRegex = /([23])[-](\d+)/;
  const match = input.match(levelRegex);

  if (match) {
    const level = parseInt(match[1]);
    const grade = parseInt(match[2]);
    let base = 0;
    let increment = 0;

    if (level === 2) {
      base = 33000;
      increment = 800;
    } else if (level === 3) {
      base = 35000;
      increment = 900;
    }
    return base + ((grade - 1) * increment);
  }

  const num = parseFloat(input.replace(/[^\d.]/g, ''));
  return isNaN(num) ? 0 : num;
};

export const calculateScore = (data: ApplicantData): { total: number, breakdown: ScoringCriteria } => {
  const breakdown: ScoringCriteria = {
    education: 0,
    salary: 0,
    experience: 0,
    qualification: 0,
    chinese: 0,
    languages: 0,
    policy: 0,
    scholarship: 0
  };

  // 1. 學歷
  const eduMap: Record<string, number> = {
    'Doctoral': 30,
    'Master': 20,
    'Bachelor': 10,
    'Associate': 5
  };
  breakdown.education = eduMap[data.educationLevel] || 0;

  // 2. 薪資 (扣除 2000 全勤)
  const rawSalary = calculateWowprimeSalary(data.salaryAmount);
  // 規則: 總額扣除 "全勤獎金" (2000)
  const effectiveSalary = rawSalary > 2000 ? rawSalary - 2000 : rawSalary;

  if (effectiveSalary >= 47971) breakdown.salary = 40;
  else if (effectiveSalary >= 40000) breakdown.salary = 30;
  else if (effectiveSalary >= 35000) breakdown.salary = 20;
  else if (effectiveSalary >= 31520) breakdown.salary = 10;

  // 3. 經驗
  if (data.experienceYears >= 2) breakdown.experience = 20;
  else if (data.experienceYears >= 1) breakdown.experience = 10;

  // 4. 資格
  if (data.qualificationScore) breakdown.qualification = 20;

  // 5. 華語
  const chiMap: Record<string, number> = {
    'Fluent': 30, // TOCFL 5
    'High': 25,   // TOCFL 4
    'Intermediate': 20 // TOCFL 3
  };
  breakdown.chinese = chiMap[data.chineseLevel] || 0;

  // 6. 他國語言
  if (data.foreignLanguageCount >= 2) breakdown.languages = 20;
  else if (data.foreignLanguageCount === 1) breakdown.languages = 10;

  // 7. 政策
  if (data.policyCompliance) breakdown.policy = 20;

  // 8. 獎學金
  if (data.scholarship === 'Gov') breakdown.scholarship = 20;
  else if (data.scholarship === 'School') breakdown.scholarship = 5;

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { total, breakdown };
};

export const generateDateLogic = () => {
  const today = new Date();
  const start = addDays(addMonths(today, 1), 7);
  const end = subDays(addYears(start, 3), 1);
  return {
    start: format(start, 'yyyy/MM/dd'),
    end: format(end, 'yyyy/MM/dd')
  };
};