// backend/tests/testFullFlow.js
import 'dotenv/config';
import { io } from 'socket.io-client';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODUxMWM5NWQyMWM3OThiZTI3Yzc3MCIsImlhdCI6MTc3MTk3Nzg0MiwiZXhwIjoxNzcyNTgyNjQyfQ.2_GrKYNwU2CzwUeXTFKCuRZNJiQRvNOoYqAYy-GdUj4';
const SESSION_ID = '699e3f7710a3647bf1907b5d';
const PORT = process.env.PORT || 5000;

const socket = io(`http://localhost:${PORT}/interview`, {
  auth: { token: TOKEN },
  transports: ['websocket']
});

const events = [];

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
  events.push(msg);
}

socket.on('connect', () => {
  log('✅ Connected');
  socket.emit('join-interview', { sessionId: SESSION_ID });
  log('📋 Joined room');

  // Start the interview after 1 second
  setTimeout(() => {
    log('🚀 Starting interview...');
    socket.emit('start-interview', { sessionId: SESSION_ID });
  }, 1000);
});

// Track state changes
socket.on('interview-state', ({ state, questionIndex, totalQuestions, questionText }) => {
  log(`📌 State: ${state}` +
    (questionIndex !== undefined ? ` | Q${questionIndex + 1}/${totalQuestions}` : '') +
    (questionText ? ` | "${questionText.substring(0, 50)}..."` : '')
  );
});

// Track TTS audio chunks (AI speaking)
let ttsChunks = 0;
socket.on('tts-audio-chunk', ({ audio, isLast }) => {
  ttsChunks++;
  if (isLast) {
    log(`🔊 AI finished speaking (${ttsChunks} audio chunks received)`);
    ttsChunks = 0;
  }
});

// Track when server wants us to start sending audio
socket.on('start-sending-audio', () => {
  log('🎤 Server says: start sending mic audio');

  // Simulate the candidate speaking by sending silent audio for 5 seconds
  // (In real life, the browser sends actual mic data)
  log('🎤 Sending 5 seconds of silent audio...');
  const silentChunk = new Int16Array(4096).buffer; // silent PCM
  const interval = setInterval(() => {
    socket.emit('audio-data', { sessionId: SESSION_ID, audio: silentChunk });
  }, 250); // send every 250ms

  // Stop after 5 seconds (simulates candidate finishing their answer)
  setTimeout(() => {
    clearInterval(interval);
    log('🎤 Stopped sending audio (simulating silence)');
  }, 5000);
});

// Track transcripts
socket.on('transcript-update', ({ text, isFinal, fullTranscript }) => {
  if (isFinal) {
    log(`📝 Transcript (final): "${text}"`);
  }
});

// Track prompts
socket.on('interview-prompt', ({ message }) => {
  log(`💬 Prompt: ${message}`);
});

// Track completion
socket.on('interview-complete', ({ sessionId }) => {
  log('🎉 Interview complete!');
  log('');
  log('=== EVENT SUMMARY ===');
  events.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  log('');
  log('✅ Full flow test passed! Check your MongoDB — the session should now be "completed".');
  log('');
  log('Next: Run this in Thunder Client to see the analysis:');
  log(`  GET http://localhost:${PORT}/api/v1/ai-interviews/${SESSION_ID}/analysis`);

  setTimeout(() => process.exit(0), 2000);
});

// Track errors
socket.on('interview-error', ({ message }) => {
  log(`❌ Error: ${message}`);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});

// Safety timeout (interview shouldn't take more than 5 minutes in test)
setTimeout(() => {
  log('⏰ Test timed out after 5 minutes');
  log('Events received:');
  events.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  process.exit(1);
}, 300000);