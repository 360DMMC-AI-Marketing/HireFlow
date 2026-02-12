import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your key at: https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeResume = async (resumeText, jobDescription) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Act as a senior recruiter. Analyze this resume text against the job description.
    
    JOB DESCRIPTION:
    ${jobDescription || "General Software Engineering role"}

    RESUME TEXT:
    ${resumeText}

    Return a strictly valid JSON object (no markdown, no backticks) with this exact structure:
    {
      "firstName": "String",
      "lastName": "String",
      "email": "String",
      "phone": "String",
      "skills": ["Array of Strings"],
      "summary": "String (2 sentences max)",
      "matchScore": Number (0-100),
      "experience": [{"role": "String", "company": "String", "years": Number}],
      "redFlags": ["Array of Strings"]
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean up if Gemini adds markdown formatting
  const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonString);
};