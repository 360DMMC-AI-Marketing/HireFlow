import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Create a live Deepgram transcription session.
 * Returns a Promise that resolves ONLY when the WebSocket is open and ready.
 *
 * Previous version returned synchronously — audio sent before the connection
 * was ready got silently dropped, causing later questions to have no transcript.
 *
 * @param {Object} callbacks
 * @param {function} callbacks.onTranscript
 * @param {function} callbacks.onError
 * @param {function} callbacks.onClose
 * @returns {Promise<{ send(buffer), close() }>}
 */
export function createLiveTranscription({ onTranscript, onError, onClose }) {
  return new Promise((resolve, reject) => {
    const connection = deepgram.listen.live({
      model: 'nova-2',
      language: 'en',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1200,
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

    connection.on(LiveTranscriptionEvents.Open, () => {
      clearTimeout(timeoutId);
      console.log('[Deepgram] Connection opened and ready');
      resolve({
        send(audioBuffer) {
          if (connection.getReadyState() === 1) {
            connection.send(audioBuffer);
          }
        },
        close() {
          try { connection.requestClose(); } catch (e) { /* ignore */ }
        }
      });
    });

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data.channel?.alternatives?.[0];
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

    connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      onTranscript({ utteranceEnd: true });
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error('[Deepgram] Error:', err);
      if (onError) onError(err);
    });

    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log('[Deepgram] Connection closed');
      if (onClose) onClose();
    });
  });
}