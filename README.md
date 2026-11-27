# Hearing Assist

Live captions for lectures and meetings, made for phones. Start with everyone's consent, read speech as it is transcribed, then save the transcript in your browser. Optional AI notes and questions are always backed by an exact quote from the transcript.

It's a React website (Vite + TypeScript) with three small serverless functions on Vercel that call Google Gemini.

## How it works

- **Captions:** the page records the microphone, cuts the audio into 6–10 second clips at natural pauses, and sends each clip to `/api/transcribe`, which asks Gemini for a verbatim transcript. Captions appear a few seconds after speech.
- **Notebook:** sessions and the caption size are saved in the browser (IndexedDB). Nothing is stored on the server, and sessions don't sync between devices.
- **Notes and Ask:** `/api/notes` and `/api/ask` send the transcript to Gemini. The server keeps only notes and answers whose quote appears word for word in the transcript.

## Run it on your laptop

You need Node.js 22 or newer and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```sh
npm install
cp .env.example .env.local   # then paste your key after GEMINI_API_KEY=
npm run dev
```

Open http://localhost:5173. The microphone works on `localhost` in Chrome and Safari. A phone on your Wi-Fi can open the Network address Vite prints, but browsers only allow the microphone over https, so test the microphone on a phone using a Vercel deployment.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repository. Vercel detects Vite.
2. Under **Environment Variables**, add `GEMINI_API_KEY`. `GEMINI_TRANSCRIBE_MODEL` and `GEMINI_NOTES_MODEL` are optional overrides.
3. Deploy. Every push to `main` deploys again, and every other branch gets a preview URL.
4. In Google AI Studio, set a spending limit for the key. The site has no login, so anyone with the URL can use it.

On iPhone, open the site in Safari and tap **Share → Add to Home Screen**.

## Develop

```sh
npm test            # unit tests (Vitest)
npm run typecheck
npm run build
npm run e2e         # phone-sized browser tests with a fake microphone; uses installed Google Chrome
```

Code map: the landing page in `src/landing`, app screens in `src/app`, shared controls in `src/components/ui.tsx`, microphone and clip upload in `src/capture`, browser storage in `src/storage`, the AI client in `src/ai`, and the serverless functions in `api/` (shared code in `api/_lib`). For real-device testing, follow [docs/device-check.md](docs/device-check.md).

Design: v4 "Subtitle" (graphite screens, a light page, one caption-yellow mark). Tokens, components and the motion rules are in [DESIGN.md](DESIGN.md).
