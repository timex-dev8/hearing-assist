export const RATE = 16000;

/** Average-decimate float samples from `from` Hz down to 16 kHz. */
export function downsample(input: Float32Array, from: number): Float32Array {
  if (from === RATE) return input;
  const ratio = from / RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio), end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += input[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export function rms(samples: Float32Array) {
  let sum = 0;
  for (const s of samples) sum += s * s;
  return Math.sqrt(sum / Math.max(1, samples.length));
}

/** 16-bit mono PCM WAV. */
export function encodeWav(samples: Float32Array): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true); view.setUint32(28, RATE * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return bytes;
}

export function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/**
 * Collects 16 kHz audio and decides where to cut clips: after `min` seconds at the
 * first quiet moment, and always by `max` seconds, so words are rarely split.
 */
export class Chunker {
  private parts: Float32Array[] = [];
  private length = 0;
  private quiet = 0;
  private loudest = 0;
  constructor(private min = 6, private max = 10, private silence = 0.012) {}
  /** Returns a finished clip when it's time to cut, otherwise null. */
  push(samples: Float32Array): { samples: Float32Array; loudest: number } | null {
    this.parts.push(samples); this.length += samples.length;
    const level = rms(samples);
    this.loudest = Math.max(this.loudest, level);
    this.quiet = level < this.silence ? this.quiet + samples.length : 0;
    const seconds = this.length / RATE;
    if (seconds >= this.max || (seconds >= this.min && this.quiet >= RATE * 0.25)) return this.flush();
    return null;
  }
  flush(): { samples: Float32Array; loudest: number } | null {
    if (!this.length) return null;
    const samples = new Float32Array(this.length);
    let offset = 0;
    for (const part of this.parts) { samples.set(part, offset); offset += part.length; }
    const result = { samples, loudest: this.loudest };
    this.parts = []; this.length = 0; this.quiet = 0; this.loudest = 0;
    return result;
  }
}
