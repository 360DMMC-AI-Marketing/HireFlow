// backend/tests/testSTT.js
import 'dotenv/config';
import { createLiveTranscription } from '../services/sttService.js';

(async () => {
  try {
    console.log('Testing Deepgram STT connection...');
    console.log('API Key present:', !!process.env.DEEPGRAM_API_KEY);

    let connected = false;

    const stt = createLiveTranscription({
      onTranscript: (result) => {
        console.log('Got transcript event:', result);
      },
      onError: (err) => {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
      },
      onClose: () => {
        if (connected) {
          console.log('✅ SUCCESS: Deepgram connection works');
        }
        process.exit(0);
      }
    });

    // Give it 3 seconds to connect, then close
    setTimeout(() => {
      connected = true;
      console.log('Connection established, closing...');
      stt.close();
    }, 3000);

  } catch (err) {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  }
})();