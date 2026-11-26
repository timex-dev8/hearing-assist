import { assist } from './_lib/assistant';
import { generate } from './_lib/gemini';
import { handle } from './_lib/http';

export const POST = handle(900_000, body => assist('notes', body, generate),
  'AI notes are unavailable right now. Your transcript is saved. Try again.');
