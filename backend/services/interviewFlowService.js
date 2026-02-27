import AIInterviewSession from '../models/AIInterviewSession.js';
import { streamTTSToSocket } from './ttsService.js';
import { createLiveTranscription } from './sttService.js';

class InterviewFlowManager {
  constructor(sessionId, socket) {
    this.sessionId = sessionId;
    this.socket = socket;
    this.sttConnection = null;
    this.currentTranscript = '';
    this.silenceTimer = null;
    this.noSpeechTimer = null;
    this.responseStartTime = null;
  }

  // ─────────────────────────────────────────────────
  // START
  // ─────────────────────────────────────────────────
  async start() {
    const session = await AIInterviewSession.findById(this.sessionId)
      .populate('jobId', 'title');
    if (!session) throw new Error('Session not found');

    session.status = 'in-progress';
    session.startedAt = new Date();
    session.currentState = 'greeting';
    await session.save();

    this.socket.emit('interview-state', { state: 'greeting' });

    const jobTitle = session.jobId?.title || 'this position';
    const greeting = `Hello! Welcome to your interview for ${jobTitle}. ` +
      `I'm your AI interviewer today. I'll be asking you ${session.questions.length} questions. ` +
      `Take your time with each answer, and feel free to think before responding. Let's begin.`;

    await streamTTSToSocket(greeting, this.socket);
    setTimeout(() => this.askNextQuestion(), 2000);
  }

  // ─────────────────────────────────────────────────
  // ASK
  // ─────────────────────────────────────────────────
  async askNextQuestion() {
    const session = await AIInterviewSession.findById(this.sessionId);
    const idx = session.currentQuestionIndex;

    if (idx >= session.questions.length) {
      return this.closeInterview();
    }

    const question = session.questions[idx];

    session.currentState = 'asking';
    await session.save();

    this.socket.emit('interview-state', {
      state: 'asking',
      questionIndex: idx,
      totalQuestions: session.questions.length,
      questionText: question.questionText
    });

    await streamTTSToSocket(question.questionText, this.socket);

    session.currentState = 'listening';
    await session.save();
    this.socket.emit('interview-state', { state: 'listening', questionIndex: idx });

    await this.startListening(session._id, idx);
  }

  // ─────────────────────────────────────────────────
  // LISTEN — async, waits for Deepgram to be ready
  // ─────────────────────────────────────────────────
  async startListening(sessionId, questionIndex) {
    this.cleanupListening();
    this.currentTranscript = '';
    this.responseStartTime = Date.now();

    try {
      this.sttConnection = await createLiveTranscription({
        onTranscript: (result) => {
          if (result.utteranceEnd) {
            this.handleSilence(sessionId, questionIndex);
            return;
          }

          if (result.isFinal) {
            this.currentTranscript += ' ' + result.text;
            if (this.silenceTimer) clearTimeout(this.silenceTimer);
            if (this.noSpeechTimer) {
              clearTimeout(this.noSpeechTimer);
              this.noSpeechTimer = null;
            }
          }

          this.socket.emit('transcript-update', {
            text: result.text,
            isFinal: result.isFinal,
            fullTranscript: this.currentTranscript.trim()
          });
        },

        onError: (err) => {
          console.error('[STT] Error:', err);
          this.socket.emit('interview-error', { message: 'Transcription error' });
        },

        onClose: () => {
          console.log(`[STT] Connection closed for Q${questionIndex + 1}`);
        }
      });

      console.log(`[Interview] Deepgram ready for Q${questionIndex + 1}, requesting audio`);
    } catch (err) {
      console.error('[Interview] Deepgram connection failed:', err);
      this.socket.emit('interview-error', { message: 'Speech recognition failed to connect' });
      return;
    }

    // NOW tell the frontend to start streaming mic audio
    this.socket.emit('start-sending-audio');

    // If no speech at all after 15s, skip
    this.noSpeechTimer = setTimeout(async () => {
      console.log(`[Interview] No speech detected for Q${questionIndex + 1}, skipping`);
      await this.saveResponse(sessionId, questionIndex);
      this.cleanupListening();

      const session = await AIInterviewSession.findById(sessionId);
      session.currentQuestionIndex += 1;
      session.currentState = 'processing';
      await session.save();
      this.socket.emit('interview-state', { state: 'processing' });

      // Only say "let's move on" if more questions remain
      if (session.currentQuestionIndex < session.questions.length) {
        await streamTTSToSocket("Let's move on to the next question.", this.socket);
      }

      setTimeout(() => this.askNextQuestion(), 1500);
    }, 15000);
  }

  // ─────────────────────────────────────────────────
  // SILENCE — 3s after last speech → answer accepted
  // ─────────────────────────────────────────────────
  handleSilence(sessionId, questionIndex) {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    this.silenceTimer = setTimeout(async () => {
      if (this.noSpeechTimer) {
        clearTimeout(this.noSpeechTimer);
        this.noSpeechTimer = null;
      }

      if (this.currentTranscript.trim().length < 20) {
        this.socket.emit('interview-prompt', {
          message: 'Take your time. Would you like to add anything?'
        });
        return;
      }

      await this.saveResponse(sessionId, questionIndex);
      this.cleanupListening();

      const session = await AIInterviewSession.findById(sessionId);
      session.currentQuestionIndex += 1;
      session.currentState = 'processing';
      await session.save();
      this.socket.emit('interview-state', { state: 'processing' });

      // Use different acks depending on whether more questions remain
      const isLastQuestion = session.currentQuestionIndex >= session.questions.length;

      if (isLastQuestion) {
        // Last question — no "next question" or "let's move on"
        const lastAcks = [
          'Thank you for that response.',
          'Great, thank you.',
          'Thank you for sharing that.'
        ];
        const ack = lastAcks[Math.floor(Math.random() * lastAcks.length)];
        await streamTTSToSocket(ack, this.socket);
      } else {
        // More questions coming
        const acks = [
          'Thank you for that response.',
          'Great, thank you.',
          'Understood, let\'s move on.',
          'Thank you. Next question.'
        ];
        const ack = acks[Math.floor(Math.random() * acks.length)];
        await streamTTSToSocket(ack, this.socket);
      }

      setTimeout(() => this.askNextQuestion(), 1500);
    }, 3000);
  }

  // ─────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────
  async saveResponse(sessionId, questionIndex) {
    const session = await AIInterviewSession.findById(sessionId);
    const endTime = Date.now();
    const startOffset = (this.responseStartTime - session.startedAt.getTime()) / 1000;
    const endOffset = (endTime - session.startedAt.getTime()) / 1000;

    session.questions[questionIndex].transcript = this.currentTranscript.trim();
    session.questions[questionIndex].responseStartTime = startOffset;
    session.questions[questionIndex].responseEndTime = endOffset;
    session.questions[questionIndex].responseDuration = (endTime - this.responseStartTime) / 1000;
    await session.save();
  }

  // ─────────────────────────────────────────────────
  // CLOSE
  // ─────────────────────────────────────────────────
  async closeInterview() {
    this.cleanupListening();

    const session = await AIInterviewSession.findById(this.sessionId);
    session.currentState = 'closing';
    await session.save();
    this.socket.emit('interview-state', { state: 'closing' });

    const closing = 'That concludes our interview. Thank you for your time ' +
      'and thoughtful responses. You\'ll hear back from the team soon. Have a great day!';
    await streamTTSToSocket(closing, this.socket);

    session.status = 'completed';
    session.currentState = 'done';
    session.completedAt = new Date();
    session.duration = (session.completedAt - session.startedAt) / 1000;
    await session.save();

    this.socket.emit('interview-state', { state: 'done' });
    this.socket.emit('interview-complete', { sessionId: this.sessionId });

    const { aiAnalysisQueue } = await import('../jobs/aiInterviewJobs.js');
    await aiAnalysisQueue.add('analyze-interview', { sessionId: this.sessionId });
  }

  // ─────────────────────────────────────────────────
  // AUDIO — pipe from frontend → Deepgram
  // ─────────────────────────────────────────────────
  receiveAudio(audioData) {
    if (this.sttConnection) {
      this.sttConnection.send(Buffer.from(audioData));
    }
  }

  // ─────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────
  cleanupListening() {
    if (this.sttConnection) {
      try { this.sttConnection.close(); } catch (e) { /* ignore */ }
      this.sttConnection = null;
    }
    if (this.silenceTimer) { clearTimeout(this.silenceTimer); this.silenceTimer = null; }
    if (this.noSpeechTimer) { clearTimeout(this.noSpeechTimer); this.noSpeechTimer = null; }
  }

  destroy() {
    this.cleanupListening();
  }
}

export default InterviewFlowManager;