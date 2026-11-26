import type { Answer, Notes, Session } from '../types';

async function request<T>(path: string, session: Session, question?: string): Promise<T> {
  if (!session.allowAI) throw new Error('Allow AI for this session first.');
  try {
    const response = await fetch('/api/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ mode: session.mode, transcript: session.captions.map(c => c.text).join('\n'), question }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The AI service could not finish. Try again.');
    return data;
  } catch (error) {
    if (error instanceof TypeError || (error as DOMException)?.name === 'TimeoutError') throw new Error('Could not reach the AI service. Check your connection and try again.');
    throw error;
  }
}
export const makeNotes = (s: Session) => request<Notes>('notes', s);
export const ask = (s: Session, question: string) => request<Answer>('ask', s, question);
