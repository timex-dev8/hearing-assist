import { test } from 'vitest';
import assert from 'node:assert/strict';
import { Chunker, downsample, encodeWav, RATE } from '../src/capture/wav';

const tone = (seconds: number, amplitude: number) => Float32Array.from({ length: seconds * RATE }, (_, i) => amplitude * Math.sin(i / 5));

test('the WAV header describes 16 kHz mono 16-bit audio', () => {
  const bytes = encodeWav(new Float32Array(RATE));
  const view = new DataView(bytes.buffer);
  assert.equal(String.fromCharCode(...bytes.subarray(0, 4)), 'RIFF');
  assert.equal(view.getUint32(24, true), 16000);
  assert.equal(view.getUint16(22, true), 1);
  assert.equal(view.getUint32(40, true), RATE * 2);
  assert.equal(bytes.length, 44 + RATE * 2);
});

test('downsampling 48 kHz to 16 kHz keeps a third of the samples', () => {
  assert.equal(downsample(new Float32Array(48000), 48000).length, 16000);
});

test('clips cut at a pause after the minimum length, and always by the maximum', () => {
  const chunker = new Chunker(6, 10);
  assert.equal(chunker.push(tone(5, 0.3)), null);
  assert.equal(chunker.push(tone(1.5, 0.3)), null, 'no cut while still speaking');
  const atPause = chunker.push(tone(0.3, 0));
  assert.ok(atPause && Math.abs(atPause.samples.length / RATE - 6.8) < 0.01);
  assert.ok(atPause.loudest > 0.1);
  assert.equal(chunker.push(tone(9, 0.3)), null);
  const forced = chunker.push(tone(1, 0.3));
  assert.equal(forced?.samples.length, 10 * RATE);
  assert.equal(chunker.flush(), null);
});
