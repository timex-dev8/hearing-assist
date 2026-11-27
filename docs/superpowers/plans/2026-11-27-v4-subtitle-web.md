# Hearing Assist v4 "Subtitle": code the canvas into the website, with motion

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native, recommended: the tasks share one token file and one ui.css, so each depends on the one before) or superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes. On approval, a copy of this plan is saved to `hearing-assist/docs/superpowers/plans/2026-11-27-v4-subtitle-web.md`.

**Copy fixed by the canvas (use verbatim):**
- H1: "Every word, on your screen."
- Lede: "Live captions and notes from the room you’re in. Read along, mark what matters, study it later."
- Fine print: "Safari and Chrome. No account, no meeting bot."
- Tiles:
  - Record: "Captions appear as people speak"
  - Mark: "Tap once to keep a moment"
  - Notes: "Each point links to when it was said"
- End band: "Your next class, captioned."

## Context
You approved the v4 "Subtitle" canvas (artifact RvsiRdXohBC1zB73xTBePY, v35): a landing page with a graphite hero, frosted glass and rounder shapes, a hero that shows who it's for (Deaf, Hard of hearing, ADHD) and what it does (Record, Mark, Notes), a live demo, and a scroll story in an iPhone frame. The app screens were redesigned too.

You also said:
- The iPhone frame belongs only inside the website (the landing's How it works). The app screens are not framed.
- Build all of it into the real site at `hearing-assist/`, add animations using the animation skills, and write the code with superpowers (TDD).

The code today still shows v2/v3.1: a green action color, Bricolage display type, aura gradients and a "Good afternoon" greeting. The job is to port the look and motion while keeping every real flow, route and stored setting working.

**Goal:** the site and app match the v4 canvas, with purposeful CSS motion, and every existing test passes after being updated to the new copy.

**Architecture:** tokens drive everything. Rewrite `src/styles/tokens.css` to v4, keeping light and dark through `light-dark()`. Restyle the shared components in `ui.css`, then each screen. All motion is CSS (transitions, keyframes, `@starting-style`) plus two small hooks that use IntersectionObserver. No motion library.

**Tech stack:** React 19, Vite 8, TypeScript 6, wouter, Vitest 5, Playwright with axe.

**Spec:** the canvas boards `Main`, `Landing-Phone`, `DesignSystem`, `Home`, `Start`, `Live`, `Caption-Style`, `Session-*`, `Notes`, `Study-*`, `You`, `States` and `Desk-*`. The working copies are in the scratchpad at `canvas/project/`. Tokens and components are in `canvas/project/ha.css`.

## Global constraints
- **Colors:**

  | Role | Value |
  |---|---|
  | Graphite (background, raised, line) | `#141518`, `#1d1e22`, `#2a2b30` |
  | Text on graphite | `#f2f2f0` / `#b9bbc1` / `#8d9097` |
  | Page (background, raised) | `#f7f7f6`, `#ffffff` |
  | Ink (three text roles) | `#141518` / `#45474d` / `#66696f` |
  | Hairline | `rgba(20,21,24,.08)` |
  | Mark | `#ffd60a`, only under ink text |
  | Alert | `#c4321f`; on graphite `#ff8a7a` |
  | Listening | `#57c785` |
  | Mode dots (8px, always beside the name) | Lecture `#5b8def`, Presentation `#4f9d76`, Meeting `#d9a21b`, Seminar `#d9738f` |

  Every text role passes 4.5:1, in both light and dark.
- **Type:** the system font stack. Display 500 at -0.03em, headings 500, body 17/400 at 1.45, captions 600, `tabular-nums` for times. Atkinson Hyperlegible stays only for the Classic caption style. Bricolage is removed.
- **Shapes:**
  - App: controls 10, buttons 12 (48px tall), cards 16, panels 20, sheets 24.
  - Landing only: pill buttons; cards 24–32; frosted glass (`.glass-d` / `.glass-l`) with fallbacks for reduced transparency and more contrast.
- **Motion:**
  - Easing: `--ease: cubic-bezier(.2,.8,.2,1)`, which already exists, so keep it. Add `--ease-drawer: cubic-bezier(.32,.72,0,1)` for sheets.
  - Durations: 160, 240 and 400ms.
  - Animate `transform` and `opacity` only, plus `background-size` for the mark. No `transition: all`, no `scale(0)`, no `ease-in`, nothing loops.
  - Hover motion only under `(hover: hover) and (pointer: fine)`.
  - Under Reduce Motion everything shows its final frame.
- **Copy and labels:** keep the current routes and accessible names unless this plan renames them. Home's h1 becomes "Home"; the greeting goes. No emoji and no exclamation marks.
- **Your standing rules:**
  - No `preview_start`, and no simulator.
  - No commit or push until you say so: each task ends ready to commit, and I ask once at the end.
  - Approving this plan is the go-ahead to run the tests and one `npm run build`.

## Review focus (failure modes with no obvious test, each pinned to a task)
1. **Reduce Motion:** the hero demo shows its final frame and no Pause button, sections are visible without scrolling, and sheets open instantly. Covered in Tasks 3 and 6.
2. **Replay while paused:** Play, then Pause, then wait, then Play must finish and show Replay, never get stuck. Covered in Task 3.
3. **Caption presets on the dark Live screen:** Default and Large must not end up ink on graphite (invisible). High Contrast and Classic keep their fixed colors. Covered in Task 5.
4. **Dark theme and more contrast:** v4 tokens in `data-theme="dark"` still pass axe, the frosted glass falls back to solid, and the mark keeps ink text. Covered in Tasks 1 and 7.
5. **The scroll story without IntersectionObserver, or in a short viewport:** clicking a step still switches the phone, and the steps never use `vh` sizes. Covered in Task 4.

---

### Task 1: v4 tokens and base type
**Files:**
- Modify: `src/styles/tokens.css` (rewrite), `src/styles/base.css`, `src/main.tsx` (drop the Bricolage import)
- Test: `tests/tokens.test.ts` (new)

**Produces:**
- **Tokens:**
  - Graphite: `--g0 --g1 --g2 --g3 --gt1 --gt2 --gt3`
  - Page: `--bg --raised --surface --line --line-2`
  - Text: `--ink --ink-2 --ink-3`
  - Mark and alerts: `--mark --alert --alert-on-dark --live`
  - Mode dots: `--lec --pre --mee --sem`
  - Motion: `--ease --ease-drawer --t-fast:160ms --t-mid:240ms --t-settle:400ms`
  - Shape: `--r-ctl:10px --r-btn:12px --r-card:16px --r-panel:20px --r-sheet:24px`
- **Kept names:** the old names still used by components (`--green`, `--blue` and so on) become aliases of the nearest v4 role, so nothing breaks before Task 2.
- **Mode classes:** `.mode-lecture` etc. set `--mode` to the dot colour only.

- [ ] Write `tests/tokens.test.ts`. It parses `tokens.css` with a regex for `--name: light-dark(a, b)` and plain hex values, and uses `contrastRatio` from `src/settings/caption-style.ts`. It expects these pairs to be ≥ 4.5 in both themes: `ink/bg`, `ink-2/bg`, `ink-3/bg`, `ink-3/raised`, `gt1/g0`, `gt2/g0`, `gt3/g0`, `gt3/g1`, `#141518/mark`, `alert/raised`, `alert-on-dark/g0`, `live/g0`.
- [ ] Run `npx vitest run tests/tokens.test.ts` and see it FAIL (no `--g0` yet).
- [ ] Rewrite `tokens.css` with the v4 values (dark: graphite surfaces, page text inverted). Set the system font stack in `base.css`, and make `::selection` the mark colour with ink text.
- [ ] Run `npx vitest run` and `npm run typecheck`: PASS.

### Task 2: shared components and the app shell
**Files:**
- Modify: `src/styles/ui.css` (buttons, chips, segmented, tabs, list rows, cards, switch, fields, banner, spinner, sidebar, bottom nav, page head)
- Modify: `src/app/shell.tsx` (Logo becomes the v4 mark: an ink square holding a white line and a yellow line)
- Modify: `src/components/ui.tsx`. Only the class names change. `Icon`, `Button`, `Switch`, `Choice`, `Tabs` and `ActionSheet` keep their signatures.
- Test: `tests/e2e/a11y.spec.ts` (existing), `tests/e2e/shell.spec.ts` (new)

- [ ] Write `shell.spec.ts`. At 390px the bottom nav has Home, Notes, Record, Study and Settings, and the current tab has `aria-current="page"`. The Record link's computed background is `rgb(20, 21, 24)`. Pressing a nav item doesn't animate (the nav item's `getAnimations()` returns 0 after a click).
- [ ] Run `npx playwright test shell`: FAIL on the colour.
- [ ] Restyle to v4:
  - Primary `.btn` is ink on light and off-white on graphite, 48px tall, radius 12. Press scales to 0.97 over 100ms ease-out.
  - Chips have a dot and are ink when on.
  - The segmented control has a white thumb.
  - The active tab is ink with a filled icon, and Record is an ink circle.
  - No colour transitions on nav (it's used tens of times a day).
- [ ] Run `npx playwright test shell a11y`: PASS.

### Task 3: landing hero, menu and section reveals
**Files:**
- Create: `src/landing/hero-demo.tsx`, `src/motion/use-reveal.ts`, `src/motion/reduced-motion.ts`
- Modify: `src/landing/landing.tsx`, `src/styles/landing.css` (rewrite from the canvas `Main.dc.html` styles)
- Test: `tests/e2e/landing.spec.ts`

**Produces:**
- `HeroDemo(): JSX.Element`. It holds the `run` ('a'|'b'), `paused` and `done` state; the button's label is "Pause demo", "Play demo" or "Replay demo".
- `useReveal<T extends HTMLElement>(): { ref: RefObject<T>; className: '' | 'rv-pre' | 'rv-in' }`. It does nothing under reduced motion or when the element starts on screen.
- `prefersReducedMotion(): boolean`.

- [ ] Update `landing.spec.ts`. Keep the existing 8 tests and the h1 "Every word, on your screen." Add:
  - **Who it's for:** the list named "Made for people who are" contains Deaf, Hard of hearing and ADHD, and h3 Deaf / Hard of hearing / ADHD still exist in the "Made for how you follow" section.
  - **What it does:** the list named "What it does" contains Record, Mark and Notes.
  - **Demo controls:** with normal motion, "Pause demo" switches to "Play demo" and the demo's animations report `playState === 'paused'`. After `page.clock`/a 6s wait the button reads "Replay demo", and clicking it restarts (a caption line's `getAnimations()[0].currentTime < 500`).
  - **Paused then played:** Pause, wait 2s, then Play still reaches "Replay demo".
  - **Reduced motion:** no demo button is visible, the note card has opacity 1, and every `section[data-reveal]` has opacity 1 on load.
  - **FAQ:** there are 4 FAQ questions, and one is "How accurate are the captions?".
- [ ] Run `npx playwright test landing`: FAIL.
- [ ] Implement from the canvas:
  - **Nav:** a frosted pill nav, with the Menu-button logic that already exists.
  - **Hero:** a split hero with the who-for chips (Icons8 PNGs already in `public/icons`), the Record / Mark / Notes tiles, and the demo.
  - **Demo motion:** CSS keyframes whose names come from `--cin/--mk/--nt`, swapped between run a and b to replay. Pause uses `animation-play-state`. `onAnimationEnd` on the note card sets done.
  - **Menu:** opens with `@starting-style` over 180ms (opacity and translateY -6px). No animation on close (it's dismissed instantly).
  - **Sections:** each fades in once, rising 12px over 400ms with `--ease`.
- [ ] Run `npx playwright test landing a11y`: PASS.

### Task 4: How it works, inside the iPhone frame
**Files:**
- Create: `src/landing/iphone.tsx`, `src/landing/how-it-works.tsx`
- Test: `tests/e2e/landing.spec.ts`

**Produces:**
- `IPhone({ children, label }): JSX.Element`. It draws a 300×652 frame with radius 52, a titanium edge and a Dynamic Island. The frame is `aria-hidden`, and the figure carries `label`.
- `HowItWorks(): JSX.Element`. Four step `<button aria-pressed>` elements and the screens Start, Live, Notes and Study.

- [ ] Add tests:
  - Clicking step 3 sets it `aria-pressed="true"` and shows the phone's Notes screen (`[data-screen="notes"]` visible).
  - At 1280×860, scrolling step 4 into the middle selects it.
  - At 390px the phone is not sticky (`position` is not `sticky`).
- [ ] Run them: FAIL.
- [ ] Implement:
  - An IntersectionObserver with `rootMargin: '-45% 0px -45% 0px'`. Clicking a step is the fallback.
  - Screens cross-fade over 240ms (opacity only, stacked absolutely so the old one leaves while the new one arrives).
  - Steps are at least 200px tall, never sized in `vh`.
- [ ] Run `npx playwright test landing`: PASS.

### Task 5: Home, the setup screen and Live
**Files:**
- Modify: `src/app/home.tsx`, `src/app/capture.tsx`, `src/settings/caption-style.ts`, `src/styles/ui.css` (home, setup and live sections)
- Test: `tests/caption-style.test.ts`, `tests/e2e/flow.spec.ts`

- [ ] **Unit test:** `captionVars(presets.default)` gives `--cap-fg: 'var(--gt1)'` and `--cap-bg: 'var(--g0)'`. The contrast and classic presets still give `#ffffff`/`#000000` and `#ffd60a`/`#000000`.
- [ ] **e2e updates:**
  - Home's h1 is "Home" (the greeting is gone).
  - The mode picker is a radiogroup named "Mode".
  - The newest caption line has class `newest`, and its animation lasts no longer than 240ms.
  - After Mark, the marked line's mark bar has `background-size` 100% when the animation ends.
- [ ] Run both: FAIL.
- [ ] Implement:
  - **Home:** a graphite "New session" panel with a segmented mode control, an off-white "Start lecture" link and v4 rows. The `greeting()` function is deleted.
  - **Setup:** a white page with mode radio rows, a hairline consent row and the AI switch. Labels are unchanged ("Everyone agrees to transcription", "Start live captions").
  - **Live:** graphite. Older lines `--gt3`, the newest line 600 in `--gt1`.
    - **Caption arrival:** the newest line enters over 240ms (opacity plus 4px rise); the line before it turns grey over 400ms. No stagger.
    - **Mark:** the button presses to scale .95; the marked line's yellow bar grows from 0 to 100% over 240ms; the "Marked" toast slides up 8px over 200ms as a transition, not keyframes.
    - **Removed:** the waveform's glow, and the aura.
- [ ] Run `npx vitest run` and `npx playwright test flow`: PASS.

### Task 6: sheets and dialogs
**Files:**
- Modify: `src/components/ui.tsx` (`ActionSheet`), `src/styles/ui.css`
- Test: `tests/e2e/a11y.spec.ts`

- [ ] **Tests:**
  - The caption style sheet and the leave sheet open with the `[data-state="open"]` class, and focus lands on Cancel (that test already exists).
  - Under reduced motion the sheet's `getAnimations()` returns 0, and it is fully on screen as soon as it opens.
- [ ] Run them: FAIL.
- [ ] **Implement:** the sheet rises from translateY(100%) over 300ms with `--ease-drawer`, and the scrim fades in over 200ms. Exit runs the same path over 200ms, then unmounts. The dialog radius is 24.
- [ ] Run `npx playwright test a11y flow`: PASS.

### Task 7: Session, Notes library, Study and Settings
**Files:**
- Modify: `src/app/session.tsx`, `src/app/library.tsx`, `src/app/session-row.tsx`, `src/app/study.tsx`, `src/app/settings.tsx`, `src/components/doc-editor.tsx` (toolbar classes only), `src/styles/ui.css`
- Test: `tests/e2e/a11y.spec.ts`, `tests/e2e/flow.spec.ts`, `tests/e2e/study.spec.ts` (new)

- [ ] Write `study.spec.ts`:
  - "Show answer" reveals the answer with the quote and its time link.
  - "Got it" moves to the next card (the progress text goes from "1 of N" to "2 of N").
  - With normal motion, the incoming card's animation is opacity plus translateX over at most 240ms. Under reduced motion it has none.
- [ ] Run it: FAIL.
- [ ] **Implement:**
  - Source times are small tabular links, and marked moments use the yellow mark. Ask answers quote the text in a hairline box.
  - The library has chips with dots and rows grouped by day.
  - The study card is white with a hairline and large type.
  - Settings rows and switches are restyled.
  - In dark theme every screen uses graphite surfaces.
- [ ] Run `npx playwright test`, the full e2e suite including axe in light, dark and more contrast: PASS.

### Task 8: documentation and the full check
**Files:**
- Modify: `DESIGN.md` (rewrite to v4: tokens, motion table, the landing-only glass and pill rules), `README.md` (design line)

- [ ] Run `npm run typecheck`, `npx vitest run`, `npx playwright test` and `npm run build`, and report each result exactly.
- [ ] Ask you whether to commit and push.

## Motion map (the animate and choreograph decisions)
| Element | How often | Purpose | How |
|---|---|---|---|
| Hero demo | Once per visit | Explanation | Keyframes: captions 400ms with 1–1.1s between them, mark at 3.5s, note at 5.3s. Pause, Play and Replay; runs once. |
| How it works phone | Occasional | Spatial consistency | Opacity cross-fade over 240ms |
| Section reveal | Once per section | Prevents a jarring change | Transition: opacity plus 12px over 400ms |
| Landing menu | Occasional | State | `@starting-style`, 180ms |
| Sheets | Occasional | Spatial consistency | Transform over 300ms with `--ease-drawer`; exits the same way |
| Live caption arrival | Constant, every few seconds | Prevents a jarring change | Newest line: opacity plus 4px over 240ms. No stagger. |
| Mark | Several per session | Feedback | Press scale .95 over 100ms; mark bar 240ms; toast transition 200ms |
| Study next card | Tens per session | Spatial (forward) | translateX 16px plus opacity over 200ms |
| Tabs, nav, routes | Many per day | None | **No animation** |

## Verification
- `npx vitest run`: the tokens contrast test and the updated caption-style test pass.
- `npx playwright test`: landing (demo controls, reduced motion, scroll story), shell, flow, study and a11y. Axe runs in light, dark and more contrast, at 320, 390 and 1280px, with text at 200%.
- `npm run typecheck` and `npm run build` complete cleanly.
- **Your check:** to look at it yourself, run `npm run dev` in `hearing-assist`, then open `/` and `/app`. I won't open a preview.
