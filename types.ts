export enum JobType {
  CHEF = 'Chef',
  CADRE = 'Cadre'
}

export interface DocumentFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  type: string;
}

export interface ApplicantData {
  chineseName: string;
  englishSurname: string;
  englishGivenName: string;
  gender: 'M' | 'F' | string;
  nationality: string;
  passportNumber: string;
  dateOfBirth: string; 
  
  jobType: JobType;
  jobCode: string;
  jobTitle: string;
  jobContent: string;
  employmentStart: string;
  employmentEnd: string;

  educationLevel: 'Doctoral' | 'Master' | 'Bachelor' | 'Associate' | 'HighSchool' | string;
  educationEvidence: string;
  educationFileIndex: number;

  salaryAmount: string; 
  salaryReason: string;
  salaryFileIndex: number;

  experienceYears: number;
  experienceEvidence: string;
  experienceFileIndex: number;

  qualificationScore: boolean; 
  qualificationEvidence: string;
  qualificationFileIndex: number;

  chineseLevel: 'Fluent' | 'High' | 'Intermediate' | 'Basic' | 'None';
  chineseEvidence: string;
  chineseFileIndex: number;

  foreignLanguageCount: number; 
  foreignLanguageEvidence: string;
  foreignLanguageFileIndex: number;

  policyCompliance: boolean;
  policyEvidence: string;
  policyFileIndex: number;
  
  scholarship: 'Gov' | 'School' | 'None';
  scholarshipEvidence: string;
  scholarshipFileIndex: number;
}

export interface ScoringCriteria {
  education: number;
  salary: number;
  experience: number;
  qualification: number;
  chinese: number;
  languages: number;
  policy: number;
  scholarship: number;
}