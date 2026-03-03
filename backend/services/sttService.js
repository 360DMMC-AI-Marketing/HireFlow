import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export function createLiveTranscription({ onTranscript, onError, onClose }) {
  return new Promise((resolve, reject) => {
    console.log('[Deepgram] Creating live connection...');
    console.log('[Deepgram] API key present:', !!process.env.DEEPGRAM_API_KEY, 
      'length:', process.env.DEEPGRAM_API_KEY?.length);

    const connection = deepgram.listen.live({
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 2000,
      vad_events: true,
      endpointing: 300,
      encoding: 'linear16',
      sample_rate: 16000,
      channels: 1
    });

    const timeoutId = setTimeout(() => {
      console.error('[Deepgram] Connection timeout (10s)');
      reject(new Error('Deepgram connection timeout'));
    }, 10000);

    // Log ALL events for debugging
    connection.on(LiveTranscriptionEvents.Open, () => {
      clearTimeout(timeoutId);
      console.log('[Deepgram] Connection opened and ready');

      let sendCount = 0;
      resolve({
        send(audioBuffer) {
          const state = connection.getReadyState();
          sendCount++;
          if (sendCount <= 3) {
            console.log(`[Deepgram] send() #${sendCount}: readyState=${state}, bytes=${audioBuffer?.length || '?'}`);
          }
          if (state === 1) {
            connection.send(audioBuffer);
          } else {
            if (sendCount <= 10) console.log(`[Deepgram] DROPPED - state: ${state}`);
          }
        },
        close() {
          console.log('[Deepgram] Requesting close');
          try { connection.requestClose(); } catch (e) { /* ignore */ }
        }
      });
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      // Log EVERY transcript event — even empty ones
      const alt = data.channel?.alternatives?.[0];
      const text = alt?.transcript || '';
      console.log(`[Deepgram] Transcript event: "${text.substring(0, 60)}" isFinal=${data.is_final} speechFinal=${data.speech_final} confidence=${alt?.confidence?.toFixed(2)}`);

      if (alt?.transcript) {
        onTranscript({
          text: alt.transcript,
          isFinal: data.is_final,
          confidence: alt.confidence,
          words: alt.words,
          speechFinal: data.speech_final
        });
      }
    });

    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.log('[Deepgram] Metadata:', JSON.stringify(data).substring(0, 200));
    });

    connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      console.log('[Deepgram] UtteranceEnd event');
      onTranscript({ utteranceEnd: true });
    });

    connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
      console.log('[Deepgram] SpeechStarted event');
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error('[Deepgram] Error:', JSON.stringify(err).substring(0, 500));
      if (onError) onError(err);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('[Deepgram] Connection closed');
      if (onClose) onClose();
    });

    // Catch-all for any unhandled events
    connection.on('unhandled', (data) => {
      console.log('[Deepgram] Unhandled event:', JSON.stringify(data).substring(0, 200));
    });
  });
}