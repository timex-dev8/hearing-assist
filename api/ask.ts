import { assist } from './_lib/assistant';
import { generate } from './_lib/gemini';
import { handle } from './_lib/http';

export const POST = handle(900_000, body => assist('ask', body, generate),
  'Could not answer right now. Try again.');
