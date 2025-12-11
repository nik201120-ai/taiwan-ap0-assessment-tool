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
    educationEvidence: { type: Type.STRING },
    educationFileIndex: { type: Type.INTEGER },

    salaryAmount: { type: Type.STRING, description: 'Return strictly in this priority: 1. Rank (e.g. "3-8", "2等5"), 2. "Base+Bonus" (e.g. "34600+2000"), 3. Base Amount.' },
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
  required: ['chineseName', 'educationLevel', 'salaryAmount', 'nationality']
};

export const analyzeDocuments = async (files: DocumentFile[], manualApiKey?: string): Promise<Partial<ApplicantData>> => {
  const apiKey = manualApiKey || process.env.API_KEY;
  
  if (!apiKey) {
      throw new Error("API Key is missing. Please enter it in the top right corner.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const parts = await Promise.all(files.map(f => fileToPart(f.file)));
  
  const prompt = `
    You are an expert HR assistant for Taiwan's AP0 (Points-Based) work permit system.
    Analyze the attached documents (Images/PDFs) to extract applicant data.

    **CRITICAL RULES FOR EXTRACTION:**

    1.  **Education (Highest Degree)**:
        *   Scan ALL documents. Identify the **Highest** degree obtained.
        *   Priority: Doctoral > Master > Bachelor (University) > Associate > High School.
        *   Example: If user has both High School and Bachelor diplomas, return 'Bachelor'.

    2.  **Salary (Strict Priority)**:
        *   **Priority 1 (Rank/Level)**: Look for "任用等級" or "Grade/Level" in HR forms or Interview records. Format: "X-X", "X等X", "X級X" (e.g., "3-8", "2-5"). If found, RETURN THIS.
        *   **Priority 2 (Base+Bonus)**: Look for "Salary" field. If format is like "34600+2000" (Base + Attendance), RETURN "34600+2000".
        *   **Priority 3 (Base Only)**: Look for "本薪" or raw number (e.g., "34600本薪"). RETURN JUST THE NUMBER.
        *   *Validation Order*: HR Personnel Form > Salary Field > Interview Record.

    3.  **Work Experience**:
        *   **Source**: MUST use "Service Certificate" (離職證明) or "Labor Insurance" (勞保).
        *   **Constraint**: HR Personnel Form is secondary.
        *   **Calculation**: Only count experience that happened **AFTER** the graduation date of the Highest Degree. Exclude student part-time jobs.

    4.  **Nationality**:
        *   Return the nationality in **Traditional Chinese** (e.g., "越南", "印尼", "馬來西亞").

    5.  **Language**:
        *   HK/Macau residents: Need proof of *Foreign* language (not Chinese).
        *   Look for FLPT, TOEIC, JLPT.

    6.  **Policy Compliance**:
        *   Look for specific keywords in the diplomas or certificates:
            - "新南向產學合作專班" (New Southbound Industry-Academia)
            - "印尼二技 2+i" (2+i Industry-Academia)
            - "產學攜手合作僑生專班" (Industry-Academia Collaboration)
            - "海外青年技術訓練班" (OYVAT / Haiqing Class)
        *   If the document mentions these programs, return true.

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