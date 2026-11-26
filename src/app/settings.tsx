import { useId, type ReactNode } from 'react';
import { Link } from 'wouter';
import { Page } from './shell';
import { Banner, Choice, Icon, Switch, type IconName } from '../components/ui';
import { usePreferences } from '../settings/use-preferences';
import {
  appearanceNames, colorNames, fontNames, presetNames, resolveCaption, sizeNames, sizeSteps,
  type Appearance, type Colors, type Font, type Preferences, type Preset, type Spacing,
} from '../settings/caption-style';

function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return <section className="settings-section" aria-labelledby={id}>
    <h2 className="field-label" id={id}>{title}</h2>
    <div className="card list">{children}</div>
    {hint && <p className="field-hint">{hint}</p>}
  </section>;
}
function LinkRow({ href, icon, title, value }: { href: string; icon: IconName; title: string; value?: string }) {
  return <Link href={href} className="list-row pressable" data-navigates>
    <span className="row-icon"><Icon name={icon} /></span>
    <span className="row-text"><span className="row-title">{title}</span></span>
    {value && <span className="row-value">{value}</span>}
    <Icon name="chevron" size={18} />
  </Link>;
}

export function Settings() {
  const { prefs, update, error } = usePreferences();
  return <Page title="Settings" className="settings">
    {!!error && <Banner>{error}</Banner>}
    <section className="settings-section" aria-labelledby="appearance-h">
      <h2 className="field-label" id="appearance-h">Appearance</h2>
      <Choice variant="segmented" labelledBy="appearance-h" values={['light', 'dark', 'system'] as Appearance[]} selected={prefs.appearance}
        names={appearanceNames} onChange={appearance => update({ appearance })} />
    </section>
    <Section title="Captions" hint="Caption text also grows with your phone’s text size setting.">
      <LinkRow href="/app/settings/captions" icon="textformat" title="Caption style" value={presetNames[prefs.preset]} />
      <Switch checked={prefs.timestamps} icon="mic" onChange={timestamps => update({ timestamps })} title="Show times in live captions" />
    </Section>
    <Section title="Accessibility">
      <Switch checked={prefs.announce} icon="notes" onChange={announce => update({ announce })} title="Read new captions to VoiceOver"
        detail="Screen readers announce each caption once it’s finished." />
      <Switch checked={prefs.flash} icon="alert" onChange={flash => update({ flash })} title="Flash when the microphone stops"
        detail="One short flash if captions stop on their own. A red message always appears too." />
    </Section>
    <Section title="Privacy">
      <p className="list-row prose"><Icon name="lock" />While captions are on, audio goes to Google Gemini to turn speech into text and isn’t kept. Notes and answers also use Gemini, only for sessions where you allow it. Sessions are saved in this browser on this device and don’t sync yet.</p>
    </Section>
    <Section title="Open it like an app">
      <p className="list-row prose"><Icon name="home" />In Safari, tap Share, then Add to Home Screen. In Chrome, open the menu and choose Install or Add to Home screen.</p>
    </Section>
    <p className="about"><Link href="/" className="text-link">About Hearing Assist</Link></p>
  </Page>;
}

const presetOrder: Preset[] = ['default', 'large', 'contrast', 'classic', 'custom'];

export function CaptionSettings() {
  const { prefs, update, error } = usePreferences();
  const sizeId = useId();
  const style = resolveCaption(prefs);
  const index = sizeSteps.indexOf(style.size as typeof sizeSteps[number]);
  // Editing any custom option starts from the style the person can see right now.
  const edit = (change: Partial<Preferences>) => update(prefs.preset === 'custom' ? change
    : { font: style.font, size: index, spacing: style.spacing, colors: style.colors, ...change, preset: 'custom' });
  return <Page title="Caption style" back={{ href: '/app/settings', label: 'Settings' }} className="settings captions-settings">
    {!!error && <Banner>{error}</Banner>}
    <figure className={'caption-preview' + (style.colors !== 'auto' ? ' fixed-colors' : '')}>
      {style.colors === 'auto' && <span className="aura" aria-hidden="true"><i /><i /></span>}
      <p className="caption-sample">The mitochondria turns food into energy the cell can use.</p>
      <figcaption className="visually-hidden">Preview of {presetNames[prefs.preset]} captions</figcaption>
    </figure>
    <section className="settings-section" aria-labelledby="style-h">
      <h2 className="field-label" id="style-h">Style</h2>
      <Choice labelledBy="style-h" values={presetOrder} selected={prefs.preset} names={presetNames} onChange={preset => update({ preset })} />
    </section>
    <Section title="Size and spacing" hint="Changing size, spacing, font or colors switches the style to Custom.">
      <div className="list-row stack">
        <label className="row-title" htmlFor={sizeId}>Text size <span className="row-value">{sizeNames[index]}</span></label>
        <div className="slider">
          <span aria-hidden="true" className="slider-a small">A</span>
          <input id={sizeId} type="range" min={0} max={sizeSteps.length - 1} step={1} value={index}
            aria-valuetext={sizeNames[index]} onChange={e => edit({ size: Number(e.target.value) })} />
          <span aria-hidden="true" className="slider-a large">A</span>
        </div>
      </div>
      <div className="list-row stack">
        <span className="row-title" id="spacing-h">Line spacing</span>
        <Choice variant="segmented" labelledBy="spacing-h" values={['normal', 'roomy'] as Spacing[]} selected={style.spacing}
          names={{ normal: 'Normal', roomy: 'Roomy' }} onChange={spacing => edit({ spacing })} />
      </div>
    </Section>
    <section className="settings-section" aria-labelledby="font-h">
      <h2 className="field-label" id="font-h">Font</h2>
      <Choice variant="cards" labelledBy="font-h" values={Object.keys(fontNames) as Font[]} selected={style.font}
        names={fontNames} classes={{ system: 'font-system', rounded: 'font-rounded', hyperlegible: 'font-hyperlegible' }} onChange={font => edit({ font })} />
    </section>
    <section className="settings-section" aria-labelledby="colors-h">
      <h2 className="field-label" id="colors-h">Colors</h2>
      <Choice variant="cards" labelledBy="colors-h" values={Object.keys(colorNames) as Colors[]} selected={style.colors}
        names={colorNames} classes={Object.fromEntries(Object.keys(colorNames).map(c => [c, 'swatch-' + c]))} onChange={colors => edit({ colors })} />
    </section>
  </Page>;
}
