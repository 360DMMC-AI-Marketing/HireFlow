// backend/services/aiAnalysisService.js
// ─────────────────────────────────────────────────────────────
// Uses Google Gemini API (free tier) for interview analysis.
// Replaces the Anthropic/Claude version.
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import AIInterviewSession from '../models/AIInterviewSession.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Helper: Send prompt to Gemini and parse JSON response.
 * Gemini sometimes wraps JSON in markdown fences — this strips them.
 */
async function askGemini(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Full analysis pipeline for a completed interview.
 * Called by the BullMQ worker in aiInterviewJobs.js.
 *
 * Does 3 things:
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

    // No response → automatic zero
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
      q.analysis = await askGemini(
        `You are an expert interview evaluator. Analyze this interview response.

Job Title: ${session.jobId?.title || 'Unknown'}
Job Requirements: ${session.jobId?.requirements || 'Not specified'}

Question: ${q.questionText}
Question Type: ${q.type}
Candidate Response: "${q.transcript}"
Response Duration: ${q.responseDuration?.toFixed(1)} seconds

Return ONLY valid JSON, no explanation, no markdown:
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
    } catch (e) {
      console.error(`[Analysis] Failed to parse Q${i}:`, e.message);
      q.analysis = {
        score: 50,
        communicationScore: 50,
        relevanceScore: 50,
        depthScore: 50,
        strengths: [],
        concerns: ['Analysis parsing failed'],
        summary: 'Could not parse AI analysis.'
      };
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
    session.overallAnalysis = await askGemini(
      `You are a senior hiring manager. Provide an overall assessment.

Job: ${session.jobId?.title || 'Unknown'}
Candidate: ${session.candidateId?.name || 'Unknown'}
Duration: ${Math.round((session.duration || 0) / 60)} minutes
Attention Score: ${session.overallAttentionScore ?? 'N/A'}%

Individual Responses:
${responseSummary}

Return ONLY valid JSON, no explanation, no markdown:
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
  } catch (e) {
    console.error('[Analysis] Overall parse failed:', e.message);
    session.overallAnalysis = { overallScore: 0, summary: 'Analysis failed.' };
  }

  // ═══════════════════════════════════════════════
  // STEP 3: Resume vs Interview comparison
  // ═══════════════════════════════════════════════
  const resumeData = session.candidateId?.resumeData;
  if (resumeData) {
    try {
      session.overallAnalysis.resumeComparison = await askGemini(
        `Compare resume claims with interview responses.

Resume Data: ${JSON.stringify(resumeData)}

Interview Responses:
${responseSummary}

Return ONLY valid JSON, no explanation, no markdown:
{
  "consistencies": ["what aligns"],
  "discrepancies": ["what doesn't match"],
  "additionalInsights": ["things learned in interview not on resume"]
}`
      );
    } catch (e) {
      console.error('[Analysis] Comparison parse failed:', e.message);
    }
  }

  await session.save();
  return session;
}