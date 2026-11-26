import { expect, type Page } from '@playwright/test';

// Synthetic sessions for screen checks. Never bundled into the app.
const now = Date.now();
const lectureCaptions = [
  { text: 'Today is all about how water gets in and out of a cell.', at: 0 },
  { text: 'Osmosis is water moving across a membrane, toward the side with more dissolved stuff in it.', at: 61_000 },
  { text: 'If you drop a red blood cell into pure water, water rushes in and the cell swells until it bursts.', at: 135_000 },
  { text: 'That one will be on the exam, so mark it.', at: 140_000 },
  { text: 'Diffusion is different: it moves the particles themselves, from high to low concentration.', at: 220_000 },
];
export const lecture = {
  id: '1', title: 'Cell Biology', mode: 'Lecture', startedAt: now - 3600e3, durationMs: 2_880_000, allowAI: true, captions: lectureCaptions, marks: [141_000],
  notes: { version: 2, mode: 'Lecture', summary: 'How water and particles cross the cell membrane.', sections: [
    { id: 'summary', heading: 'Summary', kind: 'text', items: [{ text: 'How water and particles cross the cell membrane, and why cells swell in fresh water.', quote: 'Today is all about how water gets in and out of a cell.' }] },
    { id: 'terms', heading: 'Key terms', kind: 'term', items: [
      { text: 'Osmosis', detail: 'water moving across a membrane toward the side with more solute', quote: 'Osmosis is water moving across a membrane' },
      { text: 'Diffusion', detail: 'particles spreading from high to low concentration', quote: 'it moves the particles themselves, from high to low concentration' }] },
    { id: 'check', heading: 'Check yourself', kind: 'qa', items: [{ text: 'Why does a red blood cell swell in pure water?', detail: 'Water flows in toward the higher solute concentration inside the cell.', quote: 'water rushes in and the cell swells until it bursts', marked: true }] },
  ] },
};
export const meeting = {
  id: '2', title: 'Lab group check-in', mode: 'Meeting', startedAt: now - 26 * 3600e3, durationMs: 1_260_000, allowAI: true,
  captions: [{ text: 'Let’s move the write-up deadline to Friday.', at: 192_000 }, { text: 'Priya will email the slides by Friday.', at: 260_000 }],
  notes: { version: 2, mode: 'Meeting', summary: 'Deadline moved to Friday.', sections: [
    { id: 'decisions', heading: 'Decisions', kind: 'bullet', items: [{ text: 'Move the lab write-up deadline to Friday', quote: 'move the write-up deadline to Friday' }] },
    { id: 'actions', heading: 'Action items', kind: 'task', items: [{ text: 'Email the slides', detail: 'Priya, by Friday', quote: 'Priya will email the slides by Friday.' }] },
  ] },
};
export const talk = {
  id: '3', title: 'Capstone pitch: bike share', mode: 'Presentation', startedAt: now - 5 * 86400e3, durationMs: 900_000, allowAI: false,
  captions: [{ text: 'Shared bikes would make the walk between east and west campus a third shorter.', at: 40_000 }],
};

export async function seed(page: Page, sessions: object[] = [lecture, meeting, talk]) {
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(list => new Promise<void>((ok, fail) => {
    const r = indexedDB.open('hearing-assist');
    r.onsuccess = () => { const tx = r.result.transaction('sessions', 'readwrite'); for (const s of list as any[]) tx.objectStore('sessions').put(s, s.id); tx.oncomplete = () => ok(); tx.onerror = fail; };
  }), sessions);
  await page.reload();
  await expect(page.getByText((sessions[0] as any).title).first()).toBeVisible();
}
