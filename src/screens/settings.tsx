import { useId } from 'react';
import { useLocation } from 'wouter';
import { Group, Icon, NavButton, Row, Screen, Segmented, Switch, TabBar } from '../components/ui';
import { usePreferences } from '../settings/use-preferences';
import {
  colorNames, fontNames, presetNames, resolveCaption, sizeNames, sizeSteps,
  type Colors, type Font, type Preferences, type Preset, type Spacing,
} from '../settings/caption-style';

export function Settings() {
  const { prefs, update, error } = usePreferences();
  const [, navigate] = useLocation();
  return <Screen title="Settings" toolbar={<TabBar current="settings" onRecord={() => navigate('/new')} />}>
    {!!error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{error}</span></p>}
    <Group header="Captions" footer="Caption text also grows with your iPhone’s Larger Text setting.">
      <Row title="Caption Style" tile={['textformat', 'green']} value={presetNames[prefs.preset]} href="/settings/captions" />
      <Switch checked={prefs.timestamps} tile={['clock', 'gray']} onChange={timestamps => update({ timestamps })} title="Show Times in Live View" />
    </Group>
    <Group header="Accessibility">
      <Switch checked={prefs.announce} tile={['speaker', 'blue']} onChange={announce => update({ announce })} title="Announce New Captions"
        detail="VoiceOver reads each caption once it’s finished." />
      <Switch checked={prefs.flash} tile={['bolt', 'orange']} onChange={flash => update({ flash })} title="Flash When Microphone Stops"
        detail="One short flash if captions stop on their own. A message always appears too." />
    </Group>
    <Group header="Privacy" footer="Sessions stay in this browser on this device and don’t sync. Safari may clear them if you don’t open the site for a few weeks.">
      <p className="block prose with-tile"><Icon name="lock" size={20} />While captions are on, audio is sent to Google Gemini to turn speech into text and isn’t kept. Notes and answers also use Gemini, only for sessions where you allow it.</p>
    </Group>
    <Group header="Home Screen">
      <p className="block prose with-tile"><Icon name="home" size={20} />In Safari, tap Share, then Add to Home Screen, to open Hearing Assist like an app.</p>
    </Group>
  </Screen>;
}

const presetOrder: Preset[] = ['default', 'large', 'contrast', 'classic', 'custom'];

export function CaptionSettings({ onBack }: { onBack: () => void }) {
  const { prefs, update, error } = usePreferences();
  const sizeId = useId();
  const style = resolveCaption(prefs);
  const index = sizeSteps.indexOf(style.size as typeof sizeSteps[number]);
  // Editing any custom option starts from the style the person can see right now.
  const edit = (change: Partial<Preferences>) => update(prefs.preset === 'custom' ? change
    : { font: style.font, size: index, spacing: style.spacing, colors: style.colors, ...change, preset: 'custom' });

  return <Screen title="Caption Style" leading={<NavButton icon="back" onClick={onBack}>Settings</NavButton>}>
    {!!error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{error}</span></p>}
    <figure className="caption-preview" aria-label="Preview">
      <span className="aura" aria-hidden="true"><i /><i /></span>
      <p className="caption-sample">The mitochondria turns food into energy the cell can use.</p>
      <figcaption className="visually-hidden">Preview of {presetNames[prefs.preset]} captions</figcaption>
    </figure>
    <section className="group" aria-labelledby="style-h">
      <h2 className="group-header" id="style-h">Style</h2>
      <Segmented variant="chips" label="Caption style" values={presetOrder} selected={prefs.preset} names={presetNames} onChange={preset => update({ preset })} />
    </section>
    <Group header="Custom" footer="Changing size, spacing, font or colors switches the style to Custom.">
      <div className="block stack">
        <label className="block-title" htmlFor={sizeId}>Text Size <span className="row-value">{sizeNames[index]}</span></label>
        <div className="slider">
          <span aria-hidden="true" className="slider-a small">A</span>
          <input id={sizeId} type="range" min={0} max={sizeSteps.length - 1} step={1} value={index}
            aria-valuetext={sizeNames[index]} onChange={e => edit({ size: Number(e.target.value) })} />
          <span aria-hidden="true" className="slider-a large">A</span>
        </div>
      </div>
      <div className="block stack">
        <span className="block-title">Line Spacing</span>
        <Segmented label="Line spacing" values={['normal', 'roomy'] as Spacing[]} selected={style.spacing}
          names={{ normal: 'Normal', roomy: 'Roomy' }} onChange={spacing => edit({ spacing })} />
      </div>
    </Group>
    <Group header="Font">
      <div role="radiogroup" aria-label="Caption font" className="radio-list">
        {(Object.keys(fontNames) as Font[]).map(f => <Row key={f} role="radio" checked={style.font === f} onClick={() => edit({ font: f })}
          title={<span className={'font-name ' + f}>{fontNames[f]}</span>} />)}
      </div>
    </Group>
    <Group header="Colors">
      <div role="radiogroup" aria-label="Caption colors" className="radio-list">
        {(Object.keys(colorNames) as Colors[]).map(c => <Row key={c} role="radio" title={colorNames[c]} checked={style.colors === c} onClick={() => edit({ colors: c })}>
          <span className={'swatch ' + c} aria-hidden="true">Aa</span>
        </Row>)}
      </div>
    </Group>
  </Screen>;
}
