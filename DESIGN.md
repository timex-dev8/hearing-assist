---
name: Hearing Assist
description: Live captions and notes for students who are deaf or hard of hearing. White ground, a green and blue aura, words first.
colors:
  ground: "#ffffff"
  surface: "#f4f7f5"
  surface-pressed: "#e9eeeb"
  line: "#dfe5e2"
  line-strong: "#7b8882"
  ink: "#0e1a16"
  ink-secondary: "#3f4c47"
  ink-meta: "#5b6762"
  action-green: "#0f7a4a"
  action-green-soft: "#e7f6ec"
  ai-blue: "#0b62c4"
  ai-blue-soft: "#e8f0fc"
  mic-red: "#c62828"
  mic-red-soft: "#fdecec"
  meeting-amber: "#8a5200"
  seminar-violet: "#6a42c2"
  focus-blue: "#0b62c4"
  aura-green: "#30d158"
  aura-blue: "#0a84ff"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Atkinson Hyperlegible Next Variable, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5.2vw + 1rem, 5.25rem)"
    fontWeight: 640
    lineHeight: 1.0
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 640
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque Variable, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.2
rounded:
  sm: "10px"
  md: "16px"
  lg: "28px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
components:
  button-primary:
    backgroundColor: "{colors.action-green}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  chip-selected:
    backgroundColor: "{colors.action-green-soft}"
    textColor: "{colors.action-green}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "48px"
  card:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Hearing Assist design system

> The visual system for the Hearing Assist website (`/`) and app (`/app`). One world for both. Read this before adding or restyling anything.

- **Mode:** light first, white ground. Dark is available and is fully specified, but it is never the default.
- **Surfaces:** a landing page (Persuade) and an app (Operate) that share the same tokens, type and signature.
- **Who it is for:** deaf and hard-of-hearing students first, plus anyone with low vision, people using a screen reader or switch, and keyboard users. Readability is the brand.

## Tone

Bright, calm and sure of itself: a study tool that is on your side, not a medical device and not a toy. The page is white and quiet so that the words (captions, notes) are the loudest thing on it. Color has jobs: green for doing things, blue for AI, red only for the microphone and for deleting. The one indulgence is the **aura**: a soft green and blue light that sits behind the places where words appear.

## Signature

1. **The aura.** Two blurred fields, `--aura-1` green `#30d158` and `--aura-2` blue `#0a84ff`, drift slowly behind the places where words appear: the landing hero stage, the caption style preview, the closing band, the Home "Start" card and the live captions. Each field is 70% of its box wide, blurred 64 px, at opacity 0.4 in light and 0.32 in dark (`--aura-opacity`; a plain number, since `light-dark()` only takes colors). It is never placed behind body copy without a solid plate, and never used as section wallpaper. It is hidden under Increase Contrast, Reduce Transparency and fixed caption colors.
2. **Words that settle.** New text arrives a little blurred and lifted, then settles sharp in about 420 ms. This applies to the live caption you are reading, the landing demo and the lines of freshly written notes. It is the same motion everywhere, and it becomes an instant appearance under Reduce Motion.
3. **Mode color.** Each note mode owns one quiet hue, used only for its chip, its icon tile and the list markers in its document. It is never used for buttons, and never as a thick stripe on a card.

## Colors

All text pairs pass WCAG AA. Body text passes AAA.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#ffffff` | `#0b100e` | Page ground |
| `--surface` | `#f4f7f5` | `#141b18` | Cards, nav, inputs at rest |
| `--surface-2` | `#e9eeeb` | `#1c2420` | Pressed, selected, wells |
| `--line` | `#dfe5e2` | `#26302b` | Dividers and card edges (decorative) |
| `--line-strong` | `#7b8882` | `#7f8c86` | Input and control borders (3:1 or more) |
| `--ink` | `#0e1a16` | `#eef3f1` | Text, 17.8:1 |
| `--ink-2` | `#3f4c47` | `#b9c4bf` | Secondary text, 9:1 |
| `--ink-3` | `#5b6762` | `#93a09a` | Meta and placeholders, 5.9:1 |
| `--green` | `#0f7a4a` | `#3ddc84` | Primary action, links, focus of attention, 5.4:1 |
| `--on-green` | `#ffffff` | `#04130b` | Text on green |
| `--green-soft` | `#e7f6ec` | `#12301f` | Selected chip, success well |
| `--blue` | `#0b62c4` | `#6aa8ff` | AI: notes, Ask, sources |
| `--blue-soft` | `#e8f0fc` | `#14243b` | AI wells |
| `--red` | `#c62828` | `#ff6b6b` | Record, microphone off, delete. Nothing else. |
| `--red-soft` | `#fdecec` | `#3a1717` | Alert banner ground |
| `--focus` | `#0b62c4` | `#8fbfff` | Focus ring, 3 px |
| `--aura-1` / `--aura-2` | `#30d158` / `#0a84ff` | same | The aura only |

Mode hues (chip ground, chip ink):

| Mode | Light ink | Light soft | Dark ink |
|---|---|---|---|
| Lecture | `#0f7a4a` | `#e7f6ec` | `#3ddc84` |
| Presentation | `#0b62c4` | `#e8f0fc` | `#6aa8ff` |
| Meeting | `#8a5200` | `#fdf2dd` | `#f2b45a` |
| Seminar | `#6a42c2` | `#f0eafb` | `#b69bff` |

## Typography

Two self-hosted variable faces. Both come from @fontsource; no font is loaded from a remote host.

- **Bricolage Grotesque** is the display voice: headlines, screen titles and the wordmark. It is a grotesque with ink-trap character and an optical-size axis, warm without being cute.
- **Atkinson Hyperlegible Next** is everything you read and operate: UI, body text, notes and the default caption face. The Braille Institute drew it for low-vision readers, with distinct letter shapes (I l 1, 0 O) that reduce misreading.

| Role | Family | Size (rem) | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Display (landing hero) | Bricolage | `clamp(2.75, 5.2vw + 1, 5.25)` | 640 | 1.0 | -0.035em |
| Section title (landing) | Bricolage | `clamp(2, 2.6vw + 1, 3.25)` | 620 | 1.06 | -0.03em |
| Screen title (app) | Bricolage | 1.875 | 640 | 1.1 | -0.025em |
| Heading | Bricolage | 1.25 | 600 | 1.2 | -0.015em |
| Body | Atkinson Next | 1 | 400 | 1.55 | 0 |
| Lead (landing) | Atkinson Next | 1.1875 | 400 | 1.5 | 0 |
| Label / button | Atkinson Next | 1 | 600 | 1.25 | 0 |
| Small / meta | Atkinson Next | 0.875 | 400 | 1.4 | 0.005em |
| Caption (tiny) | Atkinson Next | 0.8125 | 600 | 1.35 | 0.01em |

- `1rem` follows the iPhone text size (`font: -apple-system-body`), so every size scales with Larger Text. Elsewhere `1rem` is 17 px.
- Times and counts use tabular numerals.
- Captions can be switched to another font in Caption style: System, Rounded (`ui-rounded`, "SF Pro Rounded") or Atkinson Hyperlegible Next. Those fonts appear only in captions and in the cards that preview them.
- The body measure stays at 68ch or less.

## Spacing

The base step is 4 px: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`.

- **App:** a 16 px gutter on phones, 32 px on desktop.
- **Landing sections:** 96 px apart on desktop and 64 px on phones.
- **Headings:** always more space above a heading than below it.

## Radius

| Token | Value | Used for |
|---|---|---|
| `--r-sm` | 10px | Inputs, small buttons, toolbar buttons |
| `--r-md` | 16px | Cards, list groups, the doc page |
| `--r-lg` | 28px | The hero stage, the Home Start card, the sheets |
| `--r-pill` | 999px | Chips, the primary button, the status capsule, the nav record button |

## Depth

- Flat by default: cards use `--surface` or a 1px `--line` edge, not shadows.
- **Floating elements** (bottom nav, live dock, menus, the doc page on the landing) get `0 1px 2px rgb(14 26 22 / .06), 0 8px 24px -6px rgb(14 26 22 / .14)`.
- **Translucency** is used in exactly two places, the bottom nav and the live dock. There it is a real effect (content scrolls under them): `color-mix(in srgb, var(--bg) 82%, transparent)` with a `blur(20px) saturate(160%)` backdrop. Both turn solid under Reduce Transparency and Increase Contrast.

## Components

- **Primary button:** a green pill with white label text, 48 px tall (44 px minimum). There is one per view.
- **Secondary button:** a `--surface` pill with ink text. Quiet text buttons are green.
- **Danger button:** red text on `--red-soft`. Red fill appears only on the record control.
- **Chip:** a pill with a 1px `--line-strong` border. Selected, it takes the mode or green soft ground and ink of that hue, plus a check icon (selection is never shown by color alone).
- **Input:** 48 px tall, `--surface` ground, a 1px `--line-strong` border, and a 2px green border on focus.
- **Switch:** 52×32, green when on, with a visible thumb. It uses the native checkbox with `role="switch"`.
- **Tabs:** segmented, on `--surface`; the selected tab is `--bg` with a soft shadow. They are a real `tablist`.
- **Bottom nav (phone):** five equal slots: Home, Notes, Record, Study, Settings. Every slot has an icon and a visible label. Record is an ink circle with a red dot, raised 8 px. Labels grow with text size up to 16 px, the most that fits five across, like a native tab bar; everything else keeps growing.
- **Sidebar (≥ 900 px):** the wordmark, the same five destinations and the "New session" primary button.
- **Session row:** a mode icon in its hue, then title, meta and the last-said excerpt (two lines). A Notes badge in blue appears when notes exist.
- **Doc page:** a white page with a 1px `--line` edge, 68ch measure and Atkinson body. H2 headings are in Bricolage; list markers take the mode hue. Quotes sit on a `--surface` well, not a side rule. Source links are small blue time pills (`12:04`) named "12:04, show in transcript", so the visible time is part of the name. Long words may break at very large text instead of widening the page.
- **Formatting toolbar:** one Tab stop; arrow keys, Home and End move between Heading, Subheading, Bold, Italic, Highlight, the three list types, Quote, Undo and Redo. Buttons are 44 px tall and share one row in the wide split; on a phone they wrap to two rows rather than hide.
- **Session layout:** at 1240 px and wider the notes sit beside a Transcript / Ask AI panel; narrower, the three are tabs.
- **Choice cards (mode, font, colors):** an empty ring when unselected, a filled hue circle with a check when selected.
- **Status capsule:** a dot plus text plus a timer: "Listening" in green, "Connecting…" in ink-2, "Microphone off" in red. The text is always present.
- **Banner:** `--red-soft` ground with a warning icon and ink text. It is persistent and is never a toast for errors.

## Icons

Phosphor, one family. The regular weight is used at 20/24 px; the fill weight marks the active nav item. Icons never stand in for a label on primary controls.

## Motion

- **Easing:** `--ease` `cubic-bezier(.2,.8,.2,1)`, a critically damped exponential out. There is no bounce anywhere.
- **Durations:** settle 420 ms; state changes 160 ms; sheets and menus 260 ms; page changes 220 ms.
- **The aura:** it drifts over 24 s cycles with two fields out of phase. Its amplitude is small enough not to read as motion in peripheral vision.
- **Scroll reveals on the landing page:** sections are visible by default and lift 12 px with opacity 0.6 → 1 once.
- **Reduce Motion:** every transform animation becomes an instant change, the aura stops, the demo captions appear whole and the record pulse becomes a static ring.

## Accessibility commitments (design-side)

- Text contrast is 4.5:1 or more and control boundaries 3:1 or more, in light, dark and Increase Contrast.
- The focus ring is a 3 px `--focus` outline with a 2 px offset and is visible on every interactive element.
- Tap targets are 44×44 or larger.
- Layouts reflow at 320 px and at 200% text with nothing clipped.
- State is never shown by color alone: there is always text and/or an icon.
- `forced-colors` mode falls back to system colors, with borders on all controls.
- Each screen's h1 takes focus on arrival so screen readers announce it; that programmatic focus draws no ring, everything a person can Tab to does.
- The saved appearance is painted before the app loads (`ha-theme` in localStorage), so dark mode never flashes white.
- Playwright checks all of this on every screen and sheet: axe WCAG 2.2 AA in light, dark and Increase Contrast, a keyboard-only run, and reflow at 320 px with 200% text.

## Do / don't

- **Do** let words be the hero: captions, notes, real example content.
- **Do** keep each screen to one primary action.
- **Do** use mode hues only to say which mode.
- **Don't** add eyebrow labels above headings, gradient text, glass cards, icon-tile grids or three equal feature cards.
- **Don't** put thick accent stripes (top or side) on rounded cards. Mode is said by the badge and icon.
- **Don't** use red for anything except the microphone and deleting.
- **Don't** put the aura behind paragraphs or animate it faster.
- **Don't** invent claims (user counts, accuracy percentages, testimonials).
