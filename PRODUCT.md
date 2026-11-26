# Hearing Assist

## Platform

A website built with React, designed first for phones and hosted on Vercel. People open it in Safari or Chrome and can add a home-screen shortcut. It also works on a laptop in a phone-width column.

## Students and their work

A student opens the site as a lecture or discussion begins, checks that everyone agrees to transcription, then follows readable live captions. After class they can revisit the transcript, review structured notes, and ask questions about the same conversation. Students who rely on captions must always be able to tell when the microphone stops.

## Interaction design

Follow Apple's iOS conventions so it feels like an app Apple made, beside Notes and Voice Memos: the system font, large titles, inset grouped lists, segmented controls, switches, action sheets and 44-point tap targets, in light and dark appearance. The layout follows Voice Memos rather than a tab bar: the notebook has one round record button at the bottom, and a gear opens Settings. The live screen is the transcript itself, with a waveform, a timer, and one record/stop control. One green tint marks everything you can tap. Red appears only for recording, stopping and deleting. Start with an empty notebook stored in the browser. The primary language for this first release is US English.

## Accessibility

Everyone must be able to use it, not only people who hear well and see well.

- **Captions people can read.** A Caption Style setting modeled on iOS Subtitles & Captioning offers Default, Large Text, High Contrast, Classic (yellow on black) and Custom. Custom covers five text sizes, line spacing, font (System, Rounded, Atkinson Hyperlegible) and four color pairs, with a live preview. Fixed color pairs pass 7:1.
- **Text follows the phone.** Every size is in rem, and on iPhone the root follows the Larger Text setting. Layouts reflow at 320 px and at 200% text with no sideways scrolling.
- **The microphone never stops silently.** The state is shown as text in a status capsule, announced to screen readers, and shown in a red banner if it stops on its own. An optional single screen flash is available, never more than one.
- **Screen readers.** Each finished caption is announced once (this can be turned off). The typing indicator is not announced. Every control has a name, role and state; screens move focus to their heading; action sheets trap and return focus.
- **Keyboard and switch access.** Everything works without touch, with a visible focus ring.
- **System settings respected.** Dark mode, Increase Contrast, Reduce Motion, Reduce Transparency and Windows high-contrast mode are all supported.
- **Checked automatically.** Playwright runs axe (WCAG 2.2 AA) on every screen and state in light, dark and increased contrast, plus a keyboard-only run of the whole flow and 200% text reflow checks.

## AI

Google Gemini turns recorded audio into captions, and, only for sessions where the student allows it, writes notes and answers questions. Every note and answer must quote the transcript word for word; the server discards anything it can't find in the transcript.
