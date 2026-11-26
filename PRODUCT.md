# Hearing Assist

## Platform

`web`. A website built with React and Vite, hosted on Vercel. It has two parts: a landing page at `/` for people deciding whether to use it, and the app at `/app`. The app is designed for phones first (bottom bar, home-screen shortcut opening straight into `/app`) and has a full desktop layout with a sidebar and a side-by-side notes and transcript view. Sessions are stored in this browser for now; the storage layer sits behind one interface so accounts (Supabase) can come later without changing the screens.

## Students and their work

A student opens the app as a class, talk, meeting or discussion begins, picks what they are listening to (Lecture, Presentation, Meeting or Seminar), checks that everyone agrees to transcription, then follows readable live captions. One tap marks a moment that matters, without looking away. After saving, AI writes notes shaped for that mode: key terms and self-check questions for a lecture, the message and outline for a presentation, decisions and action items for a meeting, arguments and disagreements for a seminar. The notes open as an editable formatted document that exports to Google Docs (rich copy), Word (.docx) or PDF. Key terms and questions become study cards with spaced review. Students who rely on captions must always be able to tell when the microphone stops.

## Interaction design

Its own design, not a copy of any platform: a white page, ink text, Bricolage Grotesque for headings and Atkinson Hyperlegible Next for everything read. A soft green and blue aura sits only behind the places where words appear. Green marks actions, blue marks AI and sources, red is only for the microphone and deleting. Five destinations: Home, Notes, Record, Study, Settings. Patterns people already know are kept where they help: tabs, switches, action sheets, 44-point targets, light and dark appearance. See DESIGN.md. The primary language for this release is US English.

## Accessibility

Everyone must be able to use it, not only people who hear well and see well.

- **Captions people can read.** A Caption Style setting modeled on iOS Subtitles & Captioning offers Default, Large Text, High Contrast, Classic (yellow on black) and Custom. Custom covers five text sizes, line spacing, font (System, Rounded, Atkinson Hyperlegible) and four color pairs, with a live preview. Fixed color pairs pass 7:1.
- **Text follows the phone.** Every size is in rem, and on iPhone the root follows the Larger Text setting. Layouts reflow at 320 px and at 200% text with no sideways scrolling.
- **The microphone never stops silently.** The state is shown as text in a status capsule, announced to screen readers, and shown in a red banner if it stops on its own. An optional single screen flash is available, never more than one.
- **Screen readers.** Each finished caption is announced once (this can be turned off). The typing indicator is not announced. Every control has a name, role and state; screens move focus to their heading; action sheets trap and return focus.
- **Keyboard and switch access.** Everything works without touch, with a visible focus ring.
- **System settings respected.** Dark mode, Increase Contrast, Reduce Motion, Reduce Transparency and Windows high-contrast mode are all supported.
- **Checked automatically.** Playwright runs axe (WCAG 2.2 AA) on the landing page and every app screen, tab and sheet in light, dark and increased contrast, plus a keyboard-only run (landing → app → session → export → editor toolbar), reflow at 320 px and 390 px with 200% text, and the live screen while listening, stopped and leaving.
- **Notes stay accessible when exported.** The document uses real headings and lists, so the Word file and the Google Docs paste keep their structure for screen readers.

## AI

Google Gemini turns recorded audio into captions, and, only for sessions where the student allows it, writes notes and answers questions. The API key stays on the server. Every note item and answer must quote the transcript word for word; the server discards anything it can't find in the transcript, drops task owners and dates nobody said, and makes sure marked moments are covered. Each note item keeps a link back to the second it came from.
