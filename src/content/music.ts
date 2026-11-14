// Exact pitch, beat and chord assignments from the instructor's MATLAB script.
export const fs = 8000,
  beatDuration = 0.75;
const G3 = 196,
  C4 = 261.626,
  D4 = 293.665,
  E4 = 329.628,
  Fsharp4 = 369.994,
  G4 = 391.995,
  A4 = 440,
  B4 = 493.883,
  D5 = 587.33;
export const notes = [
  D4,
  G4,
  B4,
  G4,
  B4,
  A4,
  G4,
  E4,
  D4,
  D4,
  G4,
  B4,
  G4,
  B4,
  A4,
  D5,
  B4,
  D5,
  B4,
  D5,
  B4,
  G4,
  D4,
  E4,
  G4,
  G4,
  E4,
  D4,
  D4,
  G4,
  B4,
  G4,
  B4,
  A4,
  G4,
];
export const beats = [
  1, 2, 0.5, 0.5, 2, 1, 2, 1, 2, 1, 2, 0.5, 0.5, 2, 1, 4, 1, 1.5, 0.5, 0.5, 0.5, 2, 1, 1.5, 0.5,
  0.5, 0.5, 2, 1, 2, 0.5, 0.5, 2, 1, 4,
];
export const chordIndices = [
  0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 1, 1, 1, 1, 1, 0, 3, 0, 0, 2, 2, 0, 0, 3, 3, 3, 3, 0, 0, 1, 1, 1, 1,
  0, 0,
];
export const chordMap = [
  [G3, B4, D5],
  [C4, E4, G4],
  [D4, Fsharp4, A4],
  [E4, G4, B4],
];
export const chordNames = ['G', 'C', 'D7*', 'Em'];
export const noteNames: Record<string, string> = {
  '196': 'G3',
  '261.626': 'C4',
  '293.665': 'D4',
  '329.628': 'E4',
  '369.994': 'F♯4',
  '391.995': 'G4',
  '440': 'A4',
  '493.883': 'B4',
  '587.33': 'D5',
};
export const starts = beats.map((_, i) =>
  beats.slice(0, i).reduce((s, b) => s + b * beatDuration, 0),
);
export const duration = beats.reduce((s, b) => s + b * beatDuration, 0);
/** Fixed normalization (1+3*.6), 10 ms endpoint ramps, no resampled timing. */
export function noteSamples(i: number, melody = true, chords = true) {
  const dur = beats[i] * beatDuration,
    M = Math.round(fs * dur),
    out = new Float32Array(M);
  for (let k = 0; k < M; k++) {
    const t = k / fs;
    let y = melody ? Math.cos(2 * Math.PI * notes[i] * t) : 0;
    if (chords) for (const f of chordMap[chordIndices[i]]) y += 0.6 * Math.cos(2 * Math.PI * f * t);
    const envelope = Math.min(1, t / 0.01, (M - 1 - k) / fs / 0.01);
    out[k] = ((0.85 * y) / 2.8) * envelope;
  }
  return out;
}
