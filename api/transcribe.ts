import { InputError } from './_lib/assistant';
import { transcribe } from './_lib/gemini';
import { handle } from './_lib/http';

// A 6–10 s mono 16 kHz WAV is about 200–320 KB; base64 adds a third.
export const POST = handle(1_500_000, async body => {
  const audio = body?.audio;
  const context = typeof body?.context === 'string' ? body.context.slice(-400) : '';
  if (typeof audio !== 'string' || !audio || audio.length > 1_400_000) throw new InputError('Send one short audio clip.');
  return { text: await transcribe(audio, context) };
}, 'Transcription is unavailable right now.');
