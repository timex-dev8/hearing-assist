import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** Serve api/*.ts during `npm run dev`, the same way Vercel does in production. */
function localApi(): Plugin {
  async function run(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
    const name = new URL(req.url ?? '/', 'http://localhost').pathname.replace(/^\/api\//, '');
    if (!/^[a-z]+$/.test(name)) { res.statusCode = 404; return res.end(); }
    let handler: ((request: Request) => Promise<Response>) | undefined;
    try { handler = (await server.ssrLoadModule('/api/' + name + '.ts'))[req.method ?? 'GET']; } catch { handler = undefined; }
    if (!handler) { res.statusCode = 404; return res.end(); }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(key, value);
    const response = await handler(new Request('http://' + (req.headers.host ?? 'localhost') + req.url, {
      method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined }));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  }
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/', (req, res) => {
        req.url = '/api' + (req.url ?? '');
        run(server, req, res).catch(error => { console.error(error); res.statusCode = 500; res.end(); });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), 'GEMINI_'));
  return { plugins: [react(), localApi()], server: { host: true } };
});
