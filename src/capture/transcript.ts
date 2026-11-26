import type { Caption } from '../types';

export type Transcript = { final: Caption[]; partial: Caption | null };
export const empty = (): Transcript => ({ final: [], partial: null });

export function onWords(state: Transcript, words: string, final: boolean, at: number): Transcript {
  const text = words.trim();
  if (!text) return state;
  const caption = { text, at: state.partial?.at ?? at };
  return final
    ? { final: [...state.final, caption], partial: null }
    : { ...state, partial: caption };
}

export function finish(state: Transcript): Caption[] {
  return state.partial ? [...state.final, state.partial] : state.final;
}
