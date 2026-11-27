import { InputError } from './assistant.js';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Only this site's own pages may call the API from a browser. */
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === (request.headers.get('x-forwarded-host') ?? request.headers.get('host')); }
  catch { return false; }
}

/** Wrap a JSON POST handler with origin, size and error handling. */
export function handle(limitBytes: number, run: (body: any) => Promise<unknown>, failure: string) {
  return async (request: Request) => {
    if (request.method !== 'POST') return json(405, { error: 'Use POST.' });
    if (!sameOrigin(request)) return json(403, { error: 'This site is not allowed to use the service.' });
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > limitBytes) return json(413, { error: 'The request is too large.' });
    try {
      const raw = await request.text();
      if (raw.length > limitBytes) return json(413, { error: 'The request is too large.' });
      let body: unknown;
      try { body = JSON.parse(raw); } catch { throw new InputError('Expected a JSON request.'); }
      return json(200, await run(body));
    } catch (error) {
      if (error instanceof InputError) return json(400, { error: error.message });
      console.error(error instanceof Error ? error.message : error);
      return json(503, { error: failure });
    }
  };
}
