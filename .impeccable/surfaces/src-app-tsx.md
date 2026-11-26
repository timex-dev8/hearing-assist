---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/screens"]
---

# Hearing Assist app surface

Scope: the whole phone-first web app (Notebook, New session sheet, Live transcript, Session detail, Settings). Mode: Operate.
Audience: deaf and hard-of-hearing students in lectures and meetings; also screen-reader, low-vision, keyboard users. Job: start captions with consent, read them live, save, review notes, ask questions. Constraints: iPhone Safari first, Dynamic Type, WCAG 2.2 AA, light and dark from the system.

## Direction contract
THESIS: An Apple-made accessibility app, as if shipped beside Notes and Voice Memos: the transcript is the screen, and one round red record control is the only loud thing. Refuses the dashboard/hero-card template and any colour that has no job.
OWN-WORLD: iOS system materials only: grouped gray ground, white inset groups, hairline separators, blurred bars. One tint, the icon green, on every interactive element; red only for record, stop and destroy; orange only for transitional state. SF system type on the iOS Dynamic Type ramp, tabular numerals for time.
STORY: The student sees their notebook, taps the record button, confirms consent in a sheet, and reads large captions that settle line by line; they always know whether the microphone is on, stop with the same button, save, then read notes with quotes and ask questions.
FIRST VIEWPORT: Notebook: large title top left, date-grouped inset list, an empty state of one line; a 64pt red record button bottom center above the tab bar. Live: status capsule and timer top, transcript filling the screen in the chosen caption style, waveform strip and the same red button bottom center.
FORM: iOS native app conventions (pinned by user, Apple style), position 1 on list; seed: none (unavailable)
SIGNATURE: the live waveform strip drawn from the real microphone level, continuous with the record button, plus captions that settle (newest line full strength, earlier lines quieter).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
