---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/app","src/screens"]
---

# Hearing Assist app

Scope: `/app` and everything under it (Home, Notes library, New session + live captions, Session doc/transcript/ask, Study, Settings). Mode: Operate.
Audience: deaf and hard-of-hearing students in lectures, presentations, meetings and seminars; low-vision, screen-reader, switch and keyboard users. Job: start captions with consent, read them live, mark moments, save, get mode-shaped notes as an editable doc, export it, ask questions, review study cards. Constraints: phone Safari first, desktop sidebar layout, Dynamic Type, WCAG 2.2 AA, storage local (Supabase later).

## Direction contract
THESIS: A study app whose screens are made of words: captions, notes and questions sit on white in a highly legible face; the only theatre is the aura behind where new words arrive. Refuses the Apple-clone grouped-gray list and the dashboard of stat tiles.
OWN-WORLD: White ground, #f4f7f5 surfaces, 1px #dfe5e2 edges, ink text; green pills for actions, blue for AI and sources, red only for mic/delete; mode hues (green, blue, amber, violet) on chips and doc rules. Bricolage titles, Atkinson Hyperlegible Next body, Phosphor icons.
STORY: Home shows a Start card with mode chips, what to continue and what to review; Record opens setup then a focused live screen; saving lands in a doc of mode notes with time-linked sources; Study turns them into cards.
FIRST VIEWPORT: Phone: Bricolage greeting top-left, Start card (aura, 4 mode chips, green Start) then Continue and Recent; 5-slot bottom nav with raised ink Record. Desktop: 260px sidebar + 2-column Home.
FORM: own-world study app (approved plan; position 1); seed: none (unavailable)
SIGNATURE: words that settle, plus mode-colored doc rules.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
