import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

/**
 * Convert text → MP3 audio buffer (waits for full audio).
 * Good for short acknowledgments like "Thank you."
 *
 * @param {string} text - What the AI should say
 * @returns {Buffer} - Complete MP3 audio
 */
export async function textToSpeech(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    model_id: 'eleven_turbo_v2_5',     // fastest model
    output_format: 'mp3_44100_128',
    voice_settings: {
      stability: 0.6,                   // slight variation = more natural
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
 * Stream text → audio chunks directly to a Socket.io client.
 * Lower latency: candidate hears audio before full generation finishes.
 *
 * Emits 'tts-audio-chunk' events with { audio: base64String, isLast: bool }
 *
 * @param {string} text - What the AI should say
 * @param {Socket} socket - Socket.io socket to the candidate's browser
 */
export async function streamTTSToSocket(text, socket) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const audioStream = await client.textToSpeech.convertAsStream(voiceId, {
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

  for await (const chunk of audioStream) {
    socket.emit('tts-audio-chunk', {
      audio: chunk.toString('base64'),
      isLast: false
    });
  }

  // Signal that audio is complete
  socket.emit('tts-audio-chunk', { audio: null, isLast: true });
}