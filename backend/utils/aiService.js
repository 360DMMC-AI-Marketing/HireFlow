import { GoogleGenerativeAI } from "@google/generative-ai";

// Get your key at: https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try multiple models in order of preference (fallback if one is rate-limited)
const MODELS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite'];

export const analyzeResume = async (resumeText, jobDescription) => {
  let lastError = null;
  
  for (const modelName of MODELS) {
    try {
      console.log(`🤖 Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Act as a senior recruiter and ATS system. Analyze this resume against the job description.
      
      JOB DESCRIPTION:
      ${jobDescription || "General position - evaluate candidate's overall qualifications"}

      RESUME TEXT:
      ${resumeText.substring(0, 10000)}

      Provide a detailed analysis in STRICTLY VALID JSON format (no markdown, no code blocks).
      Return ONLY the JSON object with this exact structure:
      {
        "name": "Full Name",
        "email": "email@example.com or empty string if not found",
        "phone": "phone number or empty string if not found",
        "skills": ["skill1", "skill2", "skill3"],
        "summary": "Brief 2-sentence candidate summary",
        "matchScore": 75,
        "experience": [{"role": "Job Title", "company": "Company Name", "years": 2}],
        "redFlags": ["any concerns or empty array"]
      }
      
      IMPORTANT:
      - matchScore must be a number between 0-100 based on how well the candidate matches the job
      - If resume text is empty or unreadable, return matchScore: 0
      - Extract ALL skills mentioned in the resume
      - Be realistic with the match score based on actual qualifications vs requirements
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Raw AI Response:', text.substring(0, 500));
    
    // Clean up if Gemini adds markdown formatting
    let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Remove any text before the first { and after the last }
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    const parsedData = JSON.parse(jsonString);
    
    // Ensure matchScore is a number
    if (typeof parsedData.matchScore !== 'number') {
      parsedData.matchScore = parseInt(parsedData.matchScore) || 0;
    }
    
    // Ensure it's within valid range
    parsedData.matchScore = Math.max(0, Math.min(100, parsedData.matchScore));
    
    console.log(`✅ AI Analysis Complete (${modelName}) - Match Score: ${parsedData.matchScore}%`);
    
    return parsedData;
    
    } catch (error) {
      console.warn(`⚠️  Model ${modelName} failed:`, error.message?.substring(0, 100));
      lastError = error;
      // Continue to next model
    }
  }
  
  // All models failed
  console.error('❌ All AI models failed. Last error:', lastError?.message);
  return {
    name: '',
    email: '',
    phone: '',
    skills: [],
    summary: 'Error analyzing resume',
    matchScore: 0,
    experience: [],
    redFlags: ['Failed to analyze resume: ' + (lastError?.message || 'Unknown error')]
  };
};