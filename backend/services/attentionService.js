import AIInterviewSession from '../models/AIInterviewSession.js';

/**
 * Save a batch of attention data points sent from the frontend every 5 seconds.
 * Uses $push with $each for efficient bulk append.
 */
export async function saveAttentionBatch(sessionId, dataPoints) {
  await AIInterviewSession.findByIdAndUpdate(sessionId, {
    $push: { attentionData: { $each: dataPoints } }
  });
}

/**
 * After interview completes: compute overall attention score
 * and per-question attention metrics + flags.
 */
export async function calculateOverallAttention(sessionId) {
  const session = await AIInterviewSession.findById(sessionId);
  if (!session || session.attentionData.length === 0) return;

  // Overall average
  const total = session.attentionData.reduce((sum, dp) => sum + (dp.gazeScore || 0), 0);
  session.overallAttentionScore = Math.round(total / session.attentionData.length);

  // Per-question breakdown
  for (const question of session.questions) {
    if (question.responseStartTime == null || question.responseEndTime == null) continue;

    const qData = session.attentionData.filter(
      dp => dp.timestamp >= question.responseStartTime &&
            dp.timestamp <= question.responseEndTime
    );

    if (qData.length === 0) continue;

    question.averageGazeScore = Math.round(
      qData.reduce((s, d) => s + (d.gazeScore || 0), 0) / qData.length
    );

    // Flag notable attention drops
    const flags = [];
    let lowStart = null;

    for (const dp of qData) {
      if (dp.gazeScore < 30 && !lowStart) {
        lowStart = dp.timestamp;
      } else if (dp.gazeScore >= 30 && lowStart) {
        const dur = dp.timestamp - lowStart;
        if (dur > 3) {
          const m = Math.floor(lowStart / 60);
          const s = Math.floor(lowStart % 60);
          flags.push(`Looked away for ${Math.round(dur)}s at ${m}:${String(s).padStart(2, '0')}`);
        }
        lowStart = null;
      }

      if (dp.multipleFaces) {
        const m = Math.floor(dp.timestamp / 60);
        const s = Math.floor(dp.timestamp % 60);
        flags.push(`Multiple faces detected at ${m}:${String(s).padStart(2, '0')}`);
      }
    }

    question.attentionFlags = flags;
  }

  await session.save();
}