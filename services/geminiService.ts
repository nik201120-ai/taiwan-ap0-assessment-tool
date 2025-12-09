import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DocumentFile, ApplicantData } from '../types';

const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const assessmentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    chineseName: { type: Type.STRING },
    englishSurname: { type: Type.STRING },
    englishGivenName: { type: Type.STRING },
    gender: { type: Type.STRING, enum: ['M', 'F'] },
    nationality: { type: Type.STRING },
    passportNumber: { type: Type.STRING },
    dateOfBirth: { type: Type.STRING, description: 'YYYY-MM-DD' },
    
    educationLevel: { type: Type.STRING, enum: ['Doctoral', 'Master', 'Bachelor', 'Associate'] },
    educationEvidence: { type: Type.STRING },
    educationFileIndex: { type: Type.INTEGER },

    salaryAmount: { type: Type.STRING, description: 'If format is like 34600+2000, return "34600+2000". If Level/Grade, return "2-4".' },
    salaryReason: { type: Type.STRING },
    salaryFileIndex: { type: Type.INTEGER },

    experienceYears: { type: Type.NUMBER },
    experienceEvidence: { type: Type.STRING },
    experienceFileIndex: { type: Type.INTEGER },

    qualificationScore: { type: Type.BOOLEAN },
    qualificationEvidence: { type: Type.STRING },
    qualificationFileIndex: { type: Type.INTEGER },

    chineseLevel: { type: Type.STRING, enum: ['Fluent', 'High', 'Intermediate', 'Basic', 'None'] },
    chineseEvidence: { type: Type.STRING },
    chineseFileIndex: { type: Type.INTEGER },

    foreignLanguageCount: { type: Type.INTEGER },
    foreignLanguageEvidence: { type: Type.STRING },
    foreignLanguageFileIndex: { type: Type.INTEGER },

    policyCompliance: { type: Type.BOOLEAN },
    policyEvidence: { type: Type.STRING },
    policyFileIndex: { type: Type.INTEGER },

    scholarship: { type: Type.STRING, enum: ['Gov', 'School', 'None'] },
    scholarshipEvidence: { type: Type.STRING },
    scholarshipFileIndex: { type: Type.INTEGER },
  },
  required: ['chineseName', 'educationLevel', 'salaryAmount']
};

export const analyzeDocuments = async (files: DocumentFile[]): Promise<Partial<ApplicantData>> => {
  // 自動使用環境變數中的 Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts = await Promise.all(files.map(f => fileToPart(f.file)));
  
  const prompt = `
    You are an expert HR assistant for Taiwan's AP0 (Points-Based) work permit system.
    Analyze the attached documents (Images/PDFs).
    File Names: ${files.map((f, i) => `${i}: ${f.name}`).join(', ')}.

    CRITICAL RULES:
    1. **Salary**: If you see "Base + Bonus" (e.g., 34600+2000), return exactly "34600+2000". Or "2-4" for grades.
    2. **Education**: Map to Doctoral, Master, Bachelor, or Associate.
    3. **Experience**: Service Certificate or Labor Insurance only.
    4. **Language**: 
       - Non-Taiwan Passport (e.g. Hong Kong/Macau) = 1 Foreign Language item automatically? NO, only if they have OTHER language proof like JLPT.
       - Look for FLPT, TOEIC, JLPT.
    5. **Policy**: Strictly look for "New Southbound", "2+i", "OYVAT", "產學攜手" in diploma.
    6. **Evidence**: Extract text evidence and file index.

    Return JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [ ...parts, { text: prompt } ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: assessmentSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};