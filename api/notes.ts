import { assist } from './_lib/assistant.js';
import { generate } from './_lib/gemini.js';
import { handle } from './_lib/http.js';

export const POST = handle(900_000, body => assist('notes', body, generate),
  'AI notes are unavailable right now. Your transcript is saved. Try again.');
