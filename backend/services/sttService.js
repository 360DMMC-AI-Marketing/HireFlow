import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Create a live Deepgram transcription session.
 *
 * @param {Object} callbacks
 * @param {function} callbacks.onTranscript - Called with each transcript result:
 *   { text, isFinal, confidence, words, speechFinal, utteranceEnd }
 * @param {function} callbacks.onError - Called on connection errors
 * @param {function} callbacks.onClose - Called when Deepgram connection closes
 * @returns {{ send(audioBuffer), close() }}
 */
export function createLiveTranscription({ onTranscript, onError, onClose }) {
  const connection = deepgram.listen.live({
    model: 'nova-2',           // best accuracy
    language: 'en',
    smart_format: true,        // auto-punctuation and capitalization
    interim_results: true,     // show words as candidate speaks (before finalized)
    utterance_end_ms: 1500,    // consider utterance done after 1.5s silence
    vad_events: true,          // voice activity detection events
    endpointing: 300,          // ms sensitivity for detecting speech end
    encoding: 'linear16',      // raw PCM from browser mic
    sample_rate: 16000,
    channels: 1
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log('[Deepgram] Connection opened');
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel.alternatives[0];
    if (alt.transcript) {
      onTranscript({
        text: alt.transcript,
        isFinal: data.is_final,          // true = these words are locked in
        confidence: alt.confidence,
        words: alt.words,                 // word-level timestamps
        speechFinal: data.speech_final    // true = end of full sentence/thought
      });
    }
  });

  connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
    onTranscript({ utteranceEnd: true });  // candidate stopped talking
  });

  connection.on(LiveTranscriptionEvents.Error, (err) => {
    console.error('[Deepgram] Error:', err);
    if (onError) onError(err);
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log('[Deepgram] Connection closed');
    if (onClose) onClose();
  });

  return {
    /** Pipe raw PCM audio to Deepgram */
    send(audioBuffer) {
      if (connection.getReadyState() === 1) {
        connection.send(audioBuffer);
      }
    },
    /** Gracefully close the connection */
    close() {
      connection.requestClose();
    }
  };
}