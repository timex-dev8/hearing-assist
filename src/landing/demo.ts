// Synthetic example content for the landing page. Labeled as examples on the page.
import type { Mode } from '../notes/modes';

export const stageLines = [
  'Okay, let’s pick up where we left off last week.',
  'Today is all about how water gets in and out of a cell.',
  'Osmosis is water moving across a membrane,',
  'toward the side with more dissolved stuff in it.',
  'So if you drop a red blood cell into pure water,',
  'water rushes in, and the cell swells until it bursts.',
  'That one will be on the exam, so mark it.',
  'Now compare that with diffusion, which moves the particles themselves.',
];
export const markedLine = 6;

type Item = { text: string; detail?: string; at?: string; task?: boolean };
type Section = { heading: string; kind: 'text' | 'list' | 'numbered' | 'tasks'; items: Item[] };
export const exampleNotes: Record<Mode, { title: string; sections: Section[] }> = {
  Lecture: { title: 'Cell Biology · Week 4', sections: [
    { heading: 'Summary', kind: 'text', items: [{ text: 'How water and particles cross the cell membrane, and why cells swell in fresh water.', at: '0:12' }] },
    { heading: 'Key terms', kind: 'list', items: [
      { text: 'Osmosis', detail: 'water moving across a membrane toward the side with more solute', at: '1:01' },
      { text: 'Diffusion', detail: 'particles spreading from high to low concentration', at: '3:40' }] },
    { heading: 'Check yourself', kind: 'numbered', items: [
      { text: 'Why does a red blood cell swell in pure water?', detail: 'Water flows in toward the higher solute concentration inside the cell.', at: '2:15' }] },
  ] },
  Presentation: { title: 'Capstone pitch · Campus bike share', sections: [
    { heading: 'Main message', kind: 'text', items: [{ text: 'Shared bikes would make the walk between east and west campus a third shorter.', at: '0:40' }] },
    { heading: 'Outline', kind: 'list', items: [
      { text: 'The problem', detail: 'a 20-minute walk between the two halves of campus', at: '2:05' },
      { text: 'The plan', detail: '12 docks next to the busiest buildings', at: '5:30' }] },
    { heading: 'Questions to ask', kind: 'list', items: [{ text: 'Who maintains the bikes over winter?' }] },
  ] },
  Meeting: { title: 'Lab group · weekly check-in', sections: [
    { heading: 'Decisions', kind: 'list', items: [{ text: 'Move the lab write-up deadline to Friday', at: '3:12' }] },
    { heading: 'Action items', kind: 'tasks', items: [
      { text: 'Email the slides', detail: 'Priya, by Friday', at: '4:20', task: true },
      { text: 'Book the microscope room', detail: 'Sam', at: '7:02', task: true }] },
    { heading: 'Open questions', kind: 'list', items: [{ text: 'Do we need a second data run?', at: '9:48' }] },
  ] },
  Seminar: { title: 'Ethics seminar · AI and grading', sections: [
    { heading: 'Arguments raised', kind: 'list', items: [
      { text: 'Automated grading is more consistent', detail: '“the same essay gets the same score”', at: '2:30' },
      { text: 'It can’t judge an original idea', at: '5:10' }] },
    { heading: 'Disagreements', kind: 'list', items: [{ text: 'Whether AI feedback should count toward a grade', at: '11:24' }] },
    { heading: 'Ideas to follow up', kind: 'list', items: [{ text: 'Find the department’s policy on AI tools', at: '14:02' }] },
  ] },
};
