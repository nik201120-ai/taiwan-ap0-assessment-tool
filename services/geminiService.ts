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
    nationality: { type: Type.STRING, description: "Must be in Traditional Chinese (e.g., 馬來西亞, 越南)" },
    passportNumber: { type: Type.STRING },
    dateOfBirth: { type: Type.STRING, description: 'YYYY-MM-DD' },
    
    educationLevel: { type: Type.STRING, enum: ['Doctoral', 'Master', 'Bachelor', 'Associate', 'HighSchool'] },
    educationEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    educationFileIndex: { type: Type.INTEGER, description: "The 0-based index of the file containing the diploma" },

    salaryAmount: { type: Type.STRING, description: 'Return strictly in this priority: 1. Rank (e.g. "3-8", "2等5"), 2. "Base+Bonus" (e.g. "34600+2000"), 3. Base Amount.' },
    salaryReason: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    salaryFileIndex: { type: Type.INTEGER, description: "The 0-based index of the file containing salary info" },

    experienceYears: { type: Type.NUMBER },
    experienceEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    experienceFileIndex: { type: Type.INTEGER, description: "The 0-based index of the file containing experience proof" },

    qualificationScore: { type: Type.BOOLEAN },
    qualificationEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    qualificationFileIndex: { type: Type.INTEGER },

    chineseLevel: { type: Type.STRING, enum: ['Fluent', 'High', 'Intermediate', 'Basic', 'None'] },
    chineseEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    chineseFileIndex: { type: Type.INTEGER },

    foreignLanguageCount: { type: Type.INTEGER },
    foreignLanguageEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    foreignLanguageFileIndex: { type: Type.INTEGER },

    policyCompliance: { type: Type.BOOLEAN },
    policyEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    policyFileIndex: { type: Type.INTEGER },

    scholarship: { type: Type.STRING, enum: ['Gov', 'School', 'None'] },
    scholarshipEvidence: { type: Type.STRING, description: "Evidence text in Traditional Chinese" },
    scholarshipFileIndex: { type: Type.INTEGER },
  },
  required: ['chineseName', 'educationLevel', 'salaryAmount', 'nationality']
};

export const analyzeDocuments = async (files: DocumentFile[], manualApiKey?: string): Promise<Partial<ApplicantData>> => {
  const apiKey = manualApiKey || process.env.API_KEY;
  
  if (!apiKey) {
      throw new Error("API Key is missing. Please enter it in the top right corner.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const parts = await Promise.all(files.map(f => fileToPart(f.file)));
  
  // Create a list of file names to help the AI map indices
  const fileListString = files.map((f, i) => `File Index ${i}: ${f.name}`).join('\n');
  
  const prompt = `
    You are an expert HR assistant for Taiwan's AP0 (Points-Based) work permit system.
    Analyze the attached documents (Images/PDFs) to extract applicant data.
    
    **File List for Reference (0-based index):**
    ${fileListString}

    **CRITICAL OUTPUT RULES:**
    1. **Language**: All 'Reason' and 'Evidence' fields MUST be in **Traditional Chinese (繁體中文)**.
    2. **File Index**: You MUST strictly identify which file (0, 1, 2...) contains the evidence.

    **EXTRACTION LOGIC:**

    1.  **Education (Highest Degree)**:
        *   Scan ALL documents. Identify the **Highest** degree obtained.
        *   Priority: Doctoral > Master > Bachelor (University) > Associate > High School.
        *   **Warning**: If user has multiple diplomas, ONLY use the Highest one.

    2.  **Salary (Strict Priority Check)**:
        *   **Step 1: Check "任用等級" (Grade/Level)**. Look for "X-X" or "X等X" (e.g., "3-8", "2-5") in the HR Personnel Form (人事資料表). If found, RETURN THIS immediately.
        *   **Step 2: Check "薪資" (Salary Field)**. If Step 1 is empty, look for the Salary field. If format is "34600+2000" (Base + Attendance), RETURN "34600+2000".
        *   **Step 3: Check "面試紀錄" (Interview Record)**. If Step 1 & 2 are empty, look here.
        *   **Note**: "本薪" means Base Salary. Always exclude "全勤" (Attendance Bonus) if possible, or return the "Base+Bonus" string format so the system can calculate it.

    3.  **Work Experience**:
        *   **Primary Source**: "Service Certificate" (離職證明) or "Labor Insurance" (勞保明細).
        *   **Secondary Source**: HR Personnel Form (use only if no certs are available).
        *   **Time Check**: Only count experience years that happened **AFTER** the graduation date of the Highest Degree.
        *   **Evidence**: "離職證明: [Company Name] [Duration]", "勞保: [Duration]".

    4.  **Nationality**:
        *   Extract nationality and convert to **Traditional Chinese** (e.g., "越南", "印尼", "馬來西亞").

    5.  **Policy Compliance**:
        *   Look for specific keywords in diplomas: "新南向產學合作專班", "印尼二技 2+i", "產學攜手合作", "海外青年技術訓練班".
        *   If found, return true.

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