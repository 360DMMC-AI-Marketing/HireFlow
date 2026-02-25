import InterviewFlowManager from '../services/interviewFlowService.js';
import { saveAttentionBatch, calculateOverallAttention } from '../services/attentionService.js';

// Track active interviews: sessionId → InterviewFlowManager instance
const activeSessions = new Map();

/**
 * Socket event handler for AI interviews.
 *
 * INCOMING events (from candidate's browser):
 *   'join-interview'   → join a room for this session
 *   'start-interview'  → begin the AI interview flow
 *   'audio-data'       → raw mic audio chunk (piped to Deepgram)
 *   'attention-data'   → batch of gaze tracking data points
 *   'end-interview'    → end early
 *
 * OUTGOING events (from server to browser, via InterviewFlowManager):
 *   'interview-state'  → state machine updates
 *   'tts-audio-chunk'  → AI voice audio
 *   'transcript-update'→ live transcription text
 *   'start-sending-audio' → "ok, stream your mic now"
 *   'interview-complete'  → interview finished
 *   'interview-error'     → something went wrong
 *   'interview-prompt'    → "would you like to add anything?"
 */
export function handleInterviewSocket(socket, namespace) {
  socket.on('join-interview', ({ sessionId }) => {
    socket.join(`ai-interview:${sessionId}`);
    socket.sessionId = sessionId;
    console.log(`[Socket] User ${socket.userId} joined AI interview ${sessionId}`);
  });

  socket.on('start-interview', async ({ sessionId }) => {
    try {
      const manager = new InterviewFlowManager(sessionId, socket);
      activeSessions.set(sessionId, manager);
      await manager.start();
    } catch (err) {
      console.error('[Socket] Start error:', err);
      socket.emit('interview-error', { message: err.message });
    }
  });

  socket.on('audio-data', ({ sessionId, audio }) => {
    const manager = activeSessions.get(sessionId);
    if (manager) manager.receiveAudio(audio);
  });

  socket.on('attention-data', async ({ sessionId, dataPoints }) => {
    try {
      await saveAttentionBatch(sessionId, dataPoints);
    } catch (err) {
      console.error('[Socket] Attention save error:', err);
    }
  });

  socket.on('end-interview', async ({ sessionId }) => {
    const manager = activeSessions.get(sessionId);
    if (manager) {
      await manager.closeInterview();
      manager.destroy();
      activeSessions.delete(sessionId);
    }
  });

  socket.on('disconnect', async () => {
    const sid = socket.sessionId;
    if (sid) {
      const manager = activeSessions.get(sid);
      if (manager) {
        manager.destroy();
        activeSessions.delete(sid);
      }
      await calculateOverallAttention(sid).catch(console.error);
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
}