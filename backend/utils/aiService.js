import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeResume = async (resumeText, jobDescription) => {
  try {
    console.log('🤖 Analyzing resume with Groq/Llama 3.3 70B...');

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a senior recruiter and ATS system. Always respond with ONLY valid JSON. No explanation, no markdown fences, no extra text.'
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDescription || "General position - evaluate candidate's overall qualifications"}

RESUME TEXT:
${resumeText.substring(0, 10000)}

Return JSON with this exact structure:
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
- Be realistic with the match score based on actual qualifications vs requirements`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq');

    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsedData = JSON.parse(cleaned);

    // Ensure matchScore is valid
    if (typeof parsedData.matchScore !== 'number') {
      parsedData.matchScore = parseInt(parsedData.matchScore) || 0;
    }
    parsedData.matchScore = Math.max(0, Math.min(100, parsedData.matchScore));

    console.log(`✅ AI Analysis Complete - Match Score: ${parsedData.matchScore}%`);
    return parsedData;

  } catch (error) {
    console.error('❌ AI analysis failed:', error.message);
    return {
      name: '',
      email: '',
      phone: '',
      skills: [],
      summary: 'Error analyzing resume',
      matchScore: 0,
      experience: [],
      redFlags: ['Failed to analyze resume: ' + (error.message || 'Unknown error')]
    };
  }
};