import InterviewFlowManager from '../services/interviewFlowService.js';
import { saveAttentionBatch, calculateOverallAttention } from '../services/attentionService.js';

// Track active interviews: sessionId → { manager, disconnectTimer }
const activeSessions = new Map();

const RECONNECT_GRACE_PERIOD = 30_000;

export function handleInterviewSocket(socket, namespace) {

  socket.on('join-interview', ({ sessionId }) => {
    socket.join(`ai-interview:${sessionId}`);
    socket.sessionId = sessionId;
    console.log(`[Socket] User ${socket.userId} joined AI interview ${sessionId}`);

    // Cancel cleanup timer if reconnecting to an active session
    const entry = activeSessions.get(sessionId);
    if (entry && entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = null;
      console.log(`[Socket] Reconnect detected in join — cancelled cleanup timer for ${sessionId}`);
    }
  });

  socket.on('start-interview', async ({ sessionId }) => {
    try {
      const manager = new InterviewFlowManager(sessionId, socket);
      activeSessions.set(sessionId, { manager, disconnectTimer: null });
      await manager.start();
    } catch (err) {
      console.error('[Socket] Start error:', err);
      socket.emit('interview-error', { message: err.message });
    }
  });

  socket.on('restore-state', async ({ sessionId }) => {
    const entry = activeSessions.get(sessionId);
    if (entry) {
      if (entry.disconnectTimer) {
        clearTimeout(entry.disconnectTimer);
        entry.disconnectTimer = null;
        console.log(`[Socket] Reconnect: cancelled cleanup timer for ${sessionId}`);
      }

      entry.manager.replaceSocket(socket);
      socket.join(`ai-interview:${sessionId}`);
      socket.sessionId = sessionId;

      const state = entry.manager.getCurrentState();
      socket.emit('interview-state', state);
      console.log(`[Socket] Restored state for ${sessionId}: ${state.state} Q${(state.questionIndex || 0) + 1}`);

      if (state.state === 'listening') {
        socket.emit('start-sending-audio');
      }
    } else {
      socket.emit('interview-error', {
        message: 'Session expired. Please refresh and rejoin.'
      });
    }
  });

  socket.on('audio-data', ({ sessionId, audio }) => {
    const entry = activeSessions.get(sessionId);
    if (entry) entry.manager.receiveAudio(audio);
  });

  socket.on('attention-data', async ({ sessionId, dataPoints }) => {
    try {
      await saveAttentionBatch(sessionId, dataPoints);
    } catch (err) {
      console.error('[Socket] Attention save error:', err);
    }
  });

  socket.on('end-interview', async ({ sessionId }) => {
    const entry = activeSessions.get(sessionId);
    if (entry) {
      if (entry.disconnectTimer) clearTimeout(entry.disconnectTimer);
      await entry.manager.closeInterview();
      entry.manager.destroy();
      activeSessions.delete(sessionId);
    }
  });

  socket.on('disconnect', async () => {
    const sid = socket.sessionId;
    if (!sid) return console.log(`[Socket] Disconnected (no session): ${socket.id}`);

    const entry = activeSessions.get(sid);
    if (entry) {
      console.log(`[Socket] Disconnected mid-interview ${sid}, waiting ${RECONNECT_GRACE_PERIOD / 1000}s for reconnect...`);

      entry.disconnectTimer = setTimeout(async () => {
        console.log(`[Socket] No reconnect for ${sid} — cleaning up`);
        try {
          await entry.manager.closeInterview();
        } catch (e) {
          console.error('[Socket] Cleanup close error:', e);
        }
        entry.manager.destroy();
        activeSessions.delete(sid);
        await calculateOverallAttention(sid).catch(console.error);
      }, RECONNECT_GRACE_PERIOD);
    } else {
      await calculateOverallAttention(sid).catch(console.error);
    }

    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
}