// backend/services/aiAnalysisService.js
// ─────────────────────────────────────────────────────────────
// Uses Groq API (free tier) for interview analysis.
// Model: Llama 3.3 70B — fast, accurate, 30 RPM / 14,400 RPD
// ─────────────────────────────────────────────────────────────

import Groq from 'groq-sdk';
import AIInterviewSession from '../models/AIInterviewSession.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Helper: Send prompt to Groq and parse JSON response.
 */
async function askLLM(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview evaluator. Always respond with ONLY valid JSON. No explanation, no markdown fences, no extra text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) throw new Error('Empty response from Groq');

      // Clean just in case
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      return JSON.parse(cleaned);
    } catch (e) {
      const isRateLimit = e.status === 429 || e.message?.includes('429') || e.message?.includes('rate');

      if (isRateLimit && attempt < retries) {
        const delay = attempt * 5000;
        console.log(`[Analysis] Rate limited, retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw e;
    }
  }
}

/**
 * Full analysis pipeline for a completed interview.
 * Called by the BullMQ worker in aiInterviewJobs.js.
 *
 *   1. Score each question individually
 *   2. Generate overall interview assessment
 *   3. Compare interview answers vs resume data
 */
export async function analyzeInterview(sessionId) {
  const session = await AIInterviewSession.findById(sessionId)
    .populate('candidateId')
    .populate('jobId');

  if (!session) throw new Error('Session not found');

  // ═══════════════════════════════════════════════
  // STEP 1: Score each question individually
  // ═══════════════════════════════════════════════
  for (let i = 0; i < session.questions.length; i++) {
    const q = session.questions[i];

    if (!q.transcript || q.transcript.trim().length === 0) {
      q.analysis = {
        score: 0,
        communicationScore: 0,
        relevanceScore: 0,
        depthScore: 0,
        strengths: [],
        concerns: ['No response provided'],
        summary: 'Candidate did not provide a response.'
      };
      continue;
    }

    try {
      q.analysis = await askLLM(
        `Analyze this interview response.

Job Title: ${session.jobId?.title || 'Unknown'}
Job Requirements: ${session.jobId?.requirements || 'Not specified'}

Question: ${q.questionText}
Question Type: ${q.type}
Candidate Response: "${q.transcript}"
Response Duration: ${q.responseDuration?.toFixed(1)} seconds

Return JSON with this exact structure:
{
  "score": <0-100 overall>,
  "communicationScore": <0-100>,
  "relevanceScore": <0-100>,
  "depthScore": <0-100>,
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1"],
  "summary": "2-3 sentence evaluation"
}`
      );
      console.log(`[Analysis] Q${i + 1} scored: ${q.analysis.score}`);
    } catch (e) {
      console.error(`[Analysis] Failed Q${i}:`, e.message);
      q.analysis = {
        score: 50,
        communicationScore: 50,
        relevanceScore: 50,
        depthScore: 50,
        strengths: [],
        concerns: ['Analysis failed'],
        summary: 'Could not generate analysis.'
      };
    }

    // Small delay between questions to stay within rate limits
    if (i < session.questions.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ═══════════════════════════════════════════════
  // STEP 2: Overall interview assessment
  // ═══════════════════════════════════════════════
  const responseSummary = session.questions
    .map((q, i) =>
      `Q${i + 1} (${q.type}): ${q.questionText}\n` +
      `A: ${q.transcript || 'No response'}\n` +
      `Score: ${q.analysis?.score ?? 'N/A'}`
    ).join('\n\n');

  try {
    session.overallAnalysis = await askLLM(
      `Provide an overall interview assessment.

Job: ${session.jobId?.title || 'Unknown'}
Candidate: ${session.candidateId?.name || 'Unknown'}
Duration: ${Math.round((session.duration || 0) / 60)} minutes
Attention Score: ${session.overallAttentionScore ?? 'N/A'}%

Individual Responses:
${responseSummary}

Return JSON with this exact structure:
{
  "overallScore": <0-100>,
  "communicationScore": <0-100>,
  "technicalScore": <0-100>,
  "cultureFitScore": <0-100>,
  "strengths": ["str1", "str2", "str3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "<strong-yes|yes|maybe|no|strong-no>",
  "summary": "3-4 sentence executive summary"
}`
    );
    console.log(`[Analysis] Overall score: ${session.overallAnalysis.overallScore}`);
  } catch (e) {
    console.error('[Analysis] Overall failed:', e.message);
    session.overallAnalysis = { overallScore: 0, summary: 'Analysis failed.' };
  }

  // ═══════════════════════════════════════════════
  // STEP 3: Resume vs Interview comparison
  // ═══════════════════════════════════════════════
  const resumeData = session.candidateId?.resumeData;
  if (resumeData) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      session.overallAnalysis.resumeComparison = await askLLM(
        `Compare resume claims with interview responses.

Resume Data: ${JSON.stringify(resumeData)}

Interview Responses:
${responseSummary}

Return JSON with this exact structure:
{
  "consistencies": ["what aligns"],
  "discrepancies": ["what doesn't match"],
  "additionalInsights": ["things learned in interview not on resume"]
}`
      );
    } catch (e) {
      console.error('[Analysis] Comparison failed:', e.message);
    }
  }

  await session.save();
  return session;
}