import AIInterviewSession from '../models/AIInterviewSession.js';
import { streamTTSToSocket } from './ttsService.js';
import { createLiveTranscription } from './sttService.js';

class InterviewFlowManager {
  /**
   * @param {string} sessionId - MongoDB _id of the AIInterviewSession
   * @param {Socket} socket - Socket.io socket connected to candidate's browser
   */
  constructor(sessionId, socket) {
    this.sessionId = sessionId;
    this.socket = socket;
    this.sttConnection = null;       // Deepgram live connection
    this.currentTranscript = '';      // accumulated text for current question
    this.silenceTimer = null;         // detects when candidate stops talking
    this.noSpeechTimer = null;        // ← NEW: detects when candidate never starts talking
    this.responseStartTime = null;    // when candidate started answering
  }

  // ─────────────────────────────────────────────────
  // START: Initialize and begin the interview
  // ─────────────────────────────────────────────────
  async start() {
    const session = await AIInterviewSession.findById(this.sessionId)
      .populate('jobId', 'title');

    if (!session) throw new Error('Session not found');

    session.status = 'in-progress';
    session.startedAt = new Date();
    session.currentState = 'greeting';
    await session.save();

    // Tell frontend: "we're in greeting state now"
    this.socket.emit('interview-state', { state: 'greeting' });

    // AI speaks the greeting
    const jobTitle = session.jobId?.title || 'this position';
    const greeting = `Hello! Welcome to your interview for ${jobTitle}. ` +
      `I'm your AI interviewer today. I'll be asking you ${session.questions.length} questions. ` +
      `Take your time with each answer, and feel free to think before responding. Let's begin.`;

    await streamTTSToSocket(greeting, this.socket);

    // 2 second pause, then first question
    setTimeout(() => this.askNextQuestion(), 2000);
  }

  // ─────────────────────────────────────────────────
  // ASK: Speak the next question
  // ─────────────────────────────────────────────────
  async askNextQuestion() {
    const session = await AIInterviewSession.findById(this.sessionId);
    const idx = session.currentQuestionIndex;

    // All questions asked? → close the interview
    if (idx >= session.questions.length) {
      return this.closeInterview();
    }

    const question = session.questions[idx];

    // Update state → asking
    session.currentState = 'asking';
    await session.save();

    this.socket.emit('interview-state', {
      state: 'asking',
      questionIndex: idx,
      totalQuestions: session.questions.length,
      questionText: question.questionText
    });

    // AI speaks the question aloud
    await streamTTSToSocket(question.questionText, this.socket);

    // Transition to listening
    session.currentState = 'listening';
    await session.save();
    this.socket.emit('interview-state', { state: 'listening', questionIndex: idx });

    // Open Deepgram connection and start capturing candidate audio
    this.startListening(session._id, idx);
  }

  // ─────────────────────────────────────────────────
  // LISTEN: Capture candidate's spoken response
  // ─────────────────────────────────────────────────
  startListening(sessionId, questionIndex) {
    this.currentTranscript = '';
    this.responseStartTime = Date.now();

    this.sttConnection = createLiveTranscription({
      onTranscript: (result) => {
        // Candidate stopped talking → start silence countdown
        if (result.utteranceEnd) {
          this.handleSilence(sessionId, questionIndex);
          return;
        }

        // Finalized text → append to running transcript
        if (result.isFinal) {
          this.currentTranscript += ' ' + result.text;
          if (this.silenceTimer) clearTimeout(this.silenceTimer);

          // ── NEW: Cancel the no-speech timer once they start talking ──
          if (this.noSpeechTimer) {
            clearTimeout(this.noSpeechTimer);
            this.noSpeechTimer = null;
          }
        }

        // Send live transcript to frontend for display
        this.socket.emit('transcript-update', {
          text: result.text,
          isFinal: result.isFinal,
          fullTranscript: this.currentTranscript.trim()
        });
      },

      onError: (err) => {
        console.error('[STT] Error:', err);
        this.socket.emit('interview-error', { message: 'Transcription error' });
      }
    });

    // Tell frontend: "start sending me your mic audio now"
    this.socket.emit('start-sending-audio');

    // ─────────────────────────────────────────────────
    // NEW: No-speech timeout
    // If Deepgram detects zero speech for 15 seconds,
    // skip this question with an empty transcript.
    // This handles: silent audio in tests, candidate freezes,
    // mic issues, or candidate intentionally skips.
    // ─────────────────────────────────────────────────
    this.noSpeechTimer = setTimeout(async () => {
      console.log(`[Interview] No speech detected for Q${questionIndex + 1}, skipping...`);

      // Save empty response
      await this.saveResponse(sessionId, questionIndex);

      // Close Deepgram
      if (this.sttConnection) this.sttConnection.close();

      // Move to next question
      const session = await AIInterviewSession.findById(sessionId);
      session.currentQuestionIndex += 1;
      session.currentState = 'processing';
      await session.save();

      this.socket.emit('interview-state', { state: 'processing' });

      // Let them know we're moving on
      await streamTTSToSocket("Let's move on to the next question.", this.socket);

      setTimeout(() => this.askNextQuestion(), 1500);
    }, 15000); // 15 seconds of total silence → skip
  }

  // ─────────────────────────────────────────────────
  // SILENCE: Detect when candidate finishes answering
  // ─────────────────────────────────────────────────
  handleSilence(sessionId, questionIndex) {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);

    // Wait 3 seconds of silence before considering answer complete
    this.silenceTimer = setTimeout(async () => {
      // ── NEW: Cancel no-speech timer (they did speak) ──
      if (this.noSpeechTimer) {
        clearTimeout(this.noSpeechTimer);
        this.noSpeechTimer = null;
      }

      // If they said almost nothing, prompt them
      if (this.currentTranscript.trim().length < 10) {
        this.socket.emit('interview-prompt', {
          message: 'Take your time. Would you like to add anything?'
        });
        return;
      }

      // Save their response to the database
      await this.saveResponse(sessionId, questionIndex);

      // Close the Deepgram connection for this question
      if (this.sttConnection) this.sttConnection.close();

      // Move to next question
      const session = await AIInterviewSession.findById(sessionId);
      session.currentQuestionIndex += 1;
      session.currentState = 'processing';
      await session.save();

      this.socket.emit('interview-state', { state: 'processing' });

      // Brief spoken acknowledgment
      const acks = [
        'Thank you for that response.',
        'Great, thank you.',
        'Understood, let\'s move on.',
        'Thank you. Next question.'
      ];
      const ack = acks[Math.floor(Math.random() * acks.length)];
      await streamTTSToSocket(ack, this.socket);

      // 1.5s pause then next question
      setTimeout(() => this.askNextQuestion(), 1500);
    }, 3000);
  }

  // ─────────────────────────────────────────────────
  // SAVE: Persist candidate's response
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
  // CLOSE: End the interview gracefully
  // ─────────────────────────────────────────────────
  async closeInterview() {
    const session = await AIInterviewSession.findById(this.sessionId);

    session.currentState = 'closing';
    await session.save();
    this.socket.emit('interview-state', { state: 'closing' });

    const closing = 'That concludes our interview. Thank you for your time ' +
      'and thoughtful responses. You\'ll hear back from the team soon. Have a great day!';
    await streamTTSToSocket(closing, this.socket);

    // Finalize session
    session.status = 'completed';
    session.currentState = 'done';
    session.completedAt = new Date();
    session.duration = (session.completedAt - session.startedAt) / 1000;
    await session.save();

    this.socket.emit('interview-state', { state: 'done' });
    this.socket.emit('interview-complete', { sessionId: this.sessionId });

    // Trigger background analysis via BullMQ
    const { aiAnalysisQueue } = await import('../jobs/aiInterviewJobs.js');
    await aiAnalysisQueue.add('analyze-interview', { sessionId: this.sessionId });
  }

  // ─────────────────────────────────────────────────
  // AUDIO: Receive mic data from frontend → pipe to Deepgram
  // ─────────────────────────────────────────────────
  receiveAudio(audioData) {
    if (this.sttConnection) {
      this.sttConnection.send(Buffer.from(audioData));
    }
  }

  // ─────────────────────────────────────────────────
  // CLEANUP: Release resources on disconnect/end
  // ─────────────────────────────────────────────────
  destroy() {
    if (this.sttConnection) this.sttConnection.close();
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.noSpeechTimer) clearTimeout(this.noSpeechTimer);
  }
}

export default InterviewFlowManager;