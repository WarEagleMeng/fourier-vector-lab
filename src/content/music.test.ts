import { describe, it, expect } from 'vitest';
import {
  notes,
  beats,
  chordIndices,
  chordMap,
  noteSamples,
  fs,
  beatDuration,
  duration,
} from './music';
import { spectrum } from '../math/fft';
describe('preserved MATLAB synthesis', () => {
  it('has 35 matching note, beat and chord assignments', () => {
    expect(notes.length).toBe(35);
    expect(beats.length).toBe(35);
    expect(chordIndices.length).toBe(35);
    expect(chordMap[2]).toEqual([293.665, 369.994, 440]);
    expect(duration).toBe(beats.reduce((s, b) => s + b, 0) * 0.75);
  });
  it('preserves exact durations with integer fs samples and no clipping', () => {
    for (let i = 0; i < 35; i++) {
      const y = noteSamples(i);
      expect(y.length).toBe(Math.round(fs * beats[i] * beatDuration));
      expect(y[0]).toBe(0);
      expect(Math.abs(y.at(-1)!)).toBe(0);
      expect(Math.max(...Array.from(y, Math.abs))).toBeLessThanOrEqual(0.850001);
    }
  });
  it('can mute melody and chords independently', () => {
    expect(noteSamples(0, false, false).every((x) => x === 0)).toBe(true);
    expect(noteSamples(0, true, false).some((x) => x !== 0)).toBe(true);
    expect(noteSamples(0, false, true).some((x) => x !== 0)).toBe(true);
  });
  it('places the FFT peak within one bin of a synthetic tone', () => {
    const f = 440,
      y = Float32Array.from({ length: 2048 }, (_, k) => Math.cos((2 * Math.PI * f * k) / fs)),
      spec = spectrum(y, fs),
      peak = spec.reduce((a, b) => (a.magnitude > b.magnitude ? a : b));
    expect(Math.abs(peak.frequency - f)).toBeLessThanOrEqual(fs / 2048);
    expect(peak.magnitude).toBe(1);
  });
});
