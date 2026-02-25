import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

/**
 * Convert text → complete MP3 audio buffer.
 */
export async function textToSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_turbo_v2_5',
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.8,
      style: 0.2,
      use_speaker_boost: true
    }
  });

  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Generate full audio, send as ONE event, wait for frontend to finish playing.
 * 
 * Old version streamed tiny chunks that browsers couldn't decode individually.
 * New version sends a complete MP3 file the browser can play natively.
 */
export async function streamTTSToSocket(text, socket) {
  const audioBuffer = await textToSpeech(text);

  // Send complete audio as a single event
  socket.emit('tts-audio', {
    audio: audioBuffer.toString('base64')
  });

  // Wait for frontend to confirm playback finished (or timeout after 30s)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('[TTS] Playback timeout — continuing');
      resolve();
    }, 30000);

    socket.once('tts-playback-done', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}