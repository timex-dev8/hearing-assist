import type { IconName } from '../components/ui';
import { modes, templates, type Mode } from '../../shared/modes';
export { modes, templates, type Mode };

export const modeInfo: Record<Mode, { icon: IconName; css: string; gets: string; when: string; asks: [string, string] }> = {
  Lecture: { icon: 'lecture', css: 'mode-lecture', when: 'A class or talk you’ll be tested on',
    gets: 'Key terms, main ideas, examples and study questions', asks: ['What should I review?', 'Explain the hardest idea simply'] },
  Presentation: { icon: 'presentation', css: 'mode-presentation', when: 'Someone presenting slides or a pitch',
    gets: 'Main message, outline, takeaways and questions to ask', asks: ['What was the main point?', 'What evidence did they give?'] },
  Meeting: { icon: 'meeting', css: 'mode-meeting', when: 'A team, project or group meeting',
    gets: 'Decisions, action items and open questions', asks: ['What did we decide?', 'Who is doing what?'] },
  Seminar: { icon: 'seminar', css: 'mode-seminar', when: 'A discussion where people trade views',
    gets: 'Arguments, agreements, disagreements and ideas to follow up', asks: ['What were the main positions?', 'Where did people disagree?'] },
};
export const modeIcons = Object.fromEntries(modes.map(m => [m, modeInfo[m].icon])) as Record<Mode, IconName>;
export const modeClasses = Object.fromEntries(modes.map(m => [m, modeInfo[m].css])) as Record<Mode, string>;
/** Sessions saved before Presentation and Seminar existed are still Lecture or Meeting. */
export const asMode = (value: unknown): Mode => (modes as readonly unknown[]).includes(value) ? value as Mode : 'Lecture';
