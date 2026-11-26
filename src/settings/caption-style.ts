// Caption appearance, modeled on iOS Settings → Accessibility → Subtitles & Captioning.
export type Font = 'system' | 'rounded' | 'hyperlegible';
export type Spacing = 'normal' | 'roomy';
export type Colors = 'auto' | 'white-on-black' | 'black-on-white' | 'yellow-on-black';
export type Preset = 'default' | 'large' | 'contrast' | 'classic' | 'custom';
export type Appearance = 'light' | 'dark' | 'system';
export type CaptionStyle = { font: Font; size: number; spacing: Spacing; colors: Colors };
export type Preferences = {
  preset: Preset;
  font: Font; size: number; spacing: Spacing; colors: Colors; // used by Custom
  announce: boolean;   // read new captions aloud with VoiceOver
  flash: boolean;      // flash the screen when the microphone stops
  timestamps: boolean; // show times beside live captions
  appearance: Appearance; // the whole site: light by default
};

/** Caption sizes in rem, so they scale with the phone's own text size. */
export const sizeSteps = [1.25, 1.5, 1.75, 2.125, 2.75] as const;
export const sizeNames = ['Small', 'Medium', 'Large', 'Extra Large', 'Huge'] as const;

export const presets: Record<Exclude<Preset, 'custom'>, CaptionStyle> = {
  default: { font: 'system', size: sizeSteps[1], spacing: 'normal', colors: 'auto' },
  large: { font: 'system', size: sizeSteps[3], spacing: 'roomy', colors: 'auto' },
  contrast: { font: 'system', size: sizeSteps[2], spacing: 'normal', colors: 'white-on-black' },
  classic: { font: 'hyperlegible', size: sizeSteps[2], spacing: 'normal', colors: 'yellow-on-black' },
};
export const presetNames: Record<Preset, string> = {
  default: 'Default', large: 'Large Text', contrast: 'High Contrast', classic: 'Classic', custom: 'Custom',
};
export const fontNames: Record<Font, string> = { system: 'System', rounded: 'Rounded', hyperlegible: 'Atkinson Hyperlegible' };
export const appearanceNames: Record<Appearance, string> = { light: 'Light', dark: 'Dark', system: 'Match Device' };
export const colorNames: Record<Colors, string> = {
  auto: 'Match Appearance', 'white-on-black': 'White on Black', 'black-on-white': 'Black on White', 'yellow-on-black': 'Yellow on Black',
};

export const defaults: Preferences = {
  preset: 'default', font: 'system', size: 1, spacing: 'normal', colors: 'auto',
  announce: true, flash: false, timestamps: false, appearance: 'light',
};

const clampStep = (index: number) => Math.min(sizeSteps.length - 1, Math.max(0, Math.round(Number(index) || 0)));

export function resolveCaption(prefs: Preferences): CaptionStyle {
  if (prefs.preset !== 'custom') return presets[prefs.preset] ?? presets.default;
  return { font: prefs.font, size: sizeSteps[clampStep(prefs.size)], spacing: prefs.spacing, colors: prefs.colors };
}

const families: Record<Font, string> = {
  system: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif',
  hyperlegible: '"Atkinson Hyperlegible Next Variable", -apple-system, system-ui, sans-serif',
};
const palette: Record<Colors, [string, string]> = {
  auto: ['var(--ink)', 'var(--bg)'],
  'white-on-black': ['#ffffff', '#000000'],
  'black-on-white': ['#000000', '#ffffff'],
  'yellow-on-black': ['#ffd60a', '#000000'],
};

export function captionVars(style: CaptionStyle) {
  const [fg, bg] = palette[style.colors];
  return {
    '--cap-font': families[style.font],
    '--cap-size': style.size + 'rem',
    '--cap-leading': style.spacing === 'roomy' ? '1.65' : '1.38',
    '--cap-fg': fg,
    '--cap-bg': bg,
  };
}

/** Converts a stored size step from the first version (21/26/34 px) to a size index. */
export function legacySize(px: number) {
  return px <= 21 ? 0 : px >= 34 ? 3 : 1;
}

/** WCAG 2 contrast ratio between two #rrggbb colors. */
export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
