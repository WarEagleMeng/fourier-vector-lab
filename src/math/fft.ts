/** Radix-2 real-input FFT magnitudes, with a Hann window. fs supplies exact k*fs/M bins. */
export function spectrum(samples: Float32Array, fs: number, M = 2048) {
  if ((M & (M - 1)) !== 0) throw new Error('FFT size must be a power of two.');
  const re = new Float64Array(M),
    im = new Float64Array(M);
  for (let i = 0; i < M; i++)
    re[i] = (samples[i] || 0) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (M - 1)));
  for (let i = 1, j = 0; i < M; i++) {
    let bit = M >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const t = re[i];
      re[i] = re[j];
      re[j] = t;
    }
  }
  for (let len = 2; len <= M; len <<= 1) {
    const a = (-2 * Math.PI) / len,
      wr = Math.cos(a),
      wi = Math.sin(a);
    for (let i = 0; i < M; i += len) {
      let ur = 1,
        ui = 0;
      for (let j = 0; j < len / 2; j++) {
        const k = i + j,
          l = k + len / 2,
          tr = ur * re[l] - ui * im[l],
          ti = ur * im[l] + ui * re[l];
        re[l] = re[k] - tr;
        im[l] = im[k] - ti;
        re[k] += tr;
        im[k] += ti;
        const next = ur * wr - ui * wi;
        ui = ur * wi + ui * wr;
        ur = next;
      }
    }
  }
  const mags = Array.from({ length: M / 2 }, (_, i) => Math.hypot(re[i], im[i])),
    max = Math.max(1e-12, ...mags);
  return mags.map((v, k) => ({ frequency: (k * fs) / M, magnitude: v / max }));
}
