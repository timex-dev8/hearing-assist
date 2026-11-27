---
name: Hearing Assist
description: Live captions and notes for Deaf, hard of hearing and ADHD students. v4 "Subtitle" — graphite screens, a light page, one caption-yellow mark.
colors:
  graphite-0: "#141518"
  graphite-1: "#1d1e22"
  graphite-2: "#2a2b30"
  graphite-3: "#3a3b41"
  on-graphite-1: "#f2f2f0"
  on-graphite-2: "#b9bbc1"
  on-graphite-3: "#8d9097"
  page: "#f7f7f6"
  raised: "#ffffff"
  surface: "#efefed"
  hairline: "rgba(20,21,24,.08)"
  ink: "#141518"
  ink-2: "#45474d"
  ink-3: "#66696f"
  mark: "#ffd60a"
  alert: "#c4321f"
  alert-on-graphite: "#ff8a7a"
  listening: "#57c785"
  lecture: "#5b8def"
  presentation: "#4f9d76"
  meeting: "#d9a21b"
  seminar: "#d9738f"
typography:
  family: "-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, Segoe UI, Roboto, sans-serif"
  display: { fontWeight: 500, letterSpacing: "-0.03em" }
  heading: { fontWeight: 500 }
  body: { fontSize: "17px", fontWeight: 400, lineHeight: 1.45 }
  caption: { fontWeight: 600 }
rounded:
  control: "10px"
  button: "12px"
  card: "16px"
  panel: "20px"
  sheet: "24px"
  pill: "999px"
motion:
  ease: "cubic-bezier(.2,.8,.2,1)"
  ease-drawer: "cubic-bezier(.32,.72,0,1)"
  fast: "160ms"
  mid: "240ms"
  settle: "400ms"
---

# Hearing Assist design system (v4 "Subtitle")

> This is the visual system for the website (`/`) and the app (`/app`). Read it before you add or restyle anything. The tokens live in `src/styles/tokens.css`, and `tests/tokens.test.ts` checks their contrast.

- **Idea:** captions are subtitles. Where words are read live (the Live screen, the "New session" panel, the landing hero), the screen is graphite. Everywhere else is a light page. The one accent is the yellow of a highlighter.
- **Who it's for:** Deaf, hard of hearing and ADHD students first, then anyone using low vision settings, a screen reader, a switch or a keyboard. Readability is the brand.
- **Themes:** Light, Dark and Match device (`data-theme` on `<html>`). The landing page always stays light.

## Signature

1. **Graphite for live words.** The Live screen and the Home "New session" panel use `.on-graphite` / `.live`. That scope remaps the page tokens (`--bg`, `--ink`, `--raised`…) to graphite, so the shared components render dark there without a second set of components.
2. **The mark.** A yellow `#ffd60a` bar, always under ink `#141518` text, never under light text. It shows a moment you marked: on the Live caption, in a transcript line (`.mk`), and as a highlight in the notes.
3. **The mode dot.** Each mode has an 8px dot, always next to the mode's name. A mode never colours text, buttons or stripes.

## Colors

Every text pair passes 4.5:1 in light and dark. The token test checks this.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--g0…--g3` | `#141518` `#1d1e22` `#2a2b30` `#3a3b41` | same | Graphite surfaces (fixed) |
| `--gt1…--gt3` | `#f2f2f0` `#b9bbc1` `#8d9097` | same | Text on graphite |
| `--bg` | `#f7f7f6` | `#141518` | Page |
| `--raised` | `#ffffff` | `#1d1e22` | Cards, lists, sheets |
| `--surface` | `#efefed` | `#1d1e22` | Wells, segmented track, pressed |
| `--line` / `--line-2` | ink at 8% / 16% | off-white at 10% / 18% | Hairlines |
| `--ink` / `--ink-2` / `--ink-3` | `#141518` / `#45474d` / `#66696f` | `#f2f2f0` / `#b9bbc1` / `#8d9097` | Text roles |
| `--mark` | `#ffd60a` | same | The mark, only under ink text |
| `--alert` | `#c4321f` | `#ff8a7a` | Microphone off, delete, errors |
| `--live` | `#57c785` | same | "Listening" on graphite |
| `--lec` `--pre` `--mee` `--sem` | `#5b8def` `#4f9d76` `#d9a21b` `#d9738f` | same | Mode dots |

The old names (`--green`, `--blue`, `--r-lg`…) remain as aliases of the nearest v4 role, so older rules still resolve. New code uses the v4 names.

## Typography

- One family, the system stack (SF Pro on Apple). No web fonts in the UI. Atkinson Hyperlegible Next appears only in the Classic caption style.
- Display text is weight 500 at -0.03em. Headings are 500. Body is 17px, weight 400, line-height 1.45. Captions are 600.
- Hierarchy comes from size and colour, not weight. Times and counts use `tabular-nums`.
- `1rem` follows the iPhone text size, so every size scales with Larger Text.

## Shape

| Token | Value | Used for |
|---|---|---|
| `--r-ctl` | 10px | Inputs, search, segmented items, quote boxes |
| `--r-btn` | 12px | Buttons (48px tall) |
| `--r-card` | 16px | Cards, joined lists, the study card |
| `--r-panel` | 20px | The "New session" panel |
| `--r-sheet` | 24px | Sheets and dialogs |

Pills are for chips, the landing buttons and the round Live controls.

## Depth

- Hairlines and surface steps come first: a card is `--raised` with a 1px `--line` ring.
- A soft neutral shadow (`--float`, `--float-strong`) appears only on floating things: sheets, the bottom bar, the Live dock.
- In dark theme the graphite panel lifts one step to `#1d1e22`, with a hairline. Its colour is a registered `@property`, so `light-dark()` resolves against the page theme.

## Components

- **Primary button:** ink fill with white text on a light page, and off-white with ink text on graphite. 48px tall, radius 12. Pressing scales it to 0.97 over 100ms.
- **Secondary button:** `--raised` with a 1px `--line-2` ring.
- **Chip:** a pill with a hairline ring. Selected, it is filled with ink and shows a check. Mode chips put the dot before the name.
- **Segmented control:** a `--surface` track with a white thumb.
- **Bottom nav:** Home, Notes, Record, Study, Settings. The current tab is ink with a filled icon. Record is an ink circle with a microphone glyph. The nav has no motion.
- **Session row:** title, then the meta line (dot, mode, time, length), then the excerpt, all in one joined list.
- **Source time:** a small tabular link in `--ink-2` with a hairline underline (`.src`), never a coloured pill.
- **Quote:** a hairline box in `--ink-2` (`.quote-chip`).
- **Ask AI:** your question is an ink bubble; the answer is a raised card with a hairline.
- **Study card:** white with a hairline, a thin progress bar, a large front (500, -0.02em) and the answer under a hairline.
- **Status:** a dot, the text and a timer. "Listening" is `--live`, with no pulse.
- **Banner:** `--red-soft` with ink text. It stays on screen and is never a toast.

## Landing only

- Pill buttons, cards at 24–32px, and frosted glass (`.glass-d` on graphite, `.glass-l` on light). Glass falls back to solid under Reduce Transparency and Increase Contrast.
- The iPhone frame appears only in How it works, as a drawing (`aria-hidden`) inside a figure that carries a text label. The app screens are never framed.

## Motion

Only `transform` and `opacity` animate, plus `background-size` for the mark. No `transition: all`, no `scale(0)`, no `ease-in`, nothing loops. Hover motion runs only under `(hover: hover) and (pointer: fine)`.

| Element | How often | Purpose | How |
|---|---|---|---|
| Hero demo | Once a visit | Explains the app | Keyframes: captions 400ms each, the mark at 3.5s, the note at 5.3s. Pause, Play, Replay. Runs once |
| How it works phone | Occasional | Spatial | Opacity cross-fade, 240ms |
| Section reveal | Once a section | Avoids a jarring jump | Opacity plus a 12px rise over 400ms, `--ease` |
| Landing menu | Occasional | State | `@starting-style`, 180ms in; closes instantly |
| Sheets | Occasional | Spatial | translateY(100%) → 0 over 300ms on `--ease-drawer`; exits the same way over 200ms; the scrim fades |
| New caption | Every few seconds | Avoids a jarring jump | Opacity plus a 4px rise over 240ms; the line before greys over 400ms; no stagger |
| Mark | Several a session | Feedback | Press 0.95; the bar grows 0 → 100% over 240ms; the toast is a 200ms transition |
| Next study card | Tens a session | Spatial (forward) | translateX(16px) plus opacity over 200ms |
| Tabs, nav, routes | Many a day | None | **No animation** |

**Reduce Motion:** every animation shows its final frame. The hero demo shows the finished screen and hides its button, sections are visible from the start, sheets open in place, and study cards fade instead of sliding.

## Accessibility commitments

- Text is 4.5:1 or better, and control edges 3:1 or better, in light, dark and Increase Contrast.
- The focus ring is a 3px `--focus` (ink) outline with a 2px offset.
- Tap targets are at least 44×44.
- Layouts reflow at 320px and at 200% text with nothing cut off.
- State is never shown by colour alone: there is always text or an icon. The mode dot always sits beside its name.
- Each screen's h1 takes focus on arrival.
- Playwright runs axe (WCAG 2.2 AA) in light, dark and more contrast, plus a keyboard-only run and a reflow check, on every screen and sheet.

## Do / don't

- **Do** let words carry the screen: captions, notes, real example content.
- **Do** keep one primary action per view.
- **Do** keep yellow for the mark, under ink text.
- **Don't** add gradients, glows, auras or coloured shadows to the app.
- **Don't** put a mode colour on text, buttons or card stripes.
- **Don't** use red except for the microphone, deleting and errors.
- **Don't** invent claims (user counts, accuracy percentages, testimonials).
