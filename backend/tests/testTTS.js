// backend/tests/testTTS.js
import 'dotenv/config';
import { textToSpeech } from '../services/ttsService.js';
import fs from 'fs';

(async () => {
  try {
    console.log('Testing ElevenLabs TTS...');
    console.log('API Key present:', !!process.env.ELEVENLABS_API_KEY);
    console.log('Voice ID:', process.env.ELEVENLABS_VOICE_ID);

    const audio = await textToSpeech('Hello! Welcome to your AI interview for the Software Engineer position.');
    fs.writeFileSync('test-tts-output.mp3', audio);
    console.log(`✅ SUCCESS: Generated ${audio.length} bytes`);
    console.log('Play the file: open test-tts-output.mp3');
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    if (err.message.includes('401')) console.log('→ Your ELEVENLABS_API_KEY is invalid');
    if (err.message.includes('voice_not_found')) console.log('→ Your ELEVENLABS_VOICE_ID is invalid');
  }
  process.exit();
})();