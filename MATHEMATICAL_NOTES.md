# Mathematical notes

## 1. Signals as vectors

Follow Lecture 31: ⟨x,g⟩ = ∫[a,b] x(t)g*(t) dt, linear in the first argument. E_g = ⟨g,g⟩. For E_g>0, the least-squares scalar projection is c=⟨x,g⟩/E_g. At the optimum ⟨x−cg,g⟩=0. Consequently E_x=|c|²E_g+E_error. This is an energy statement in function space; it does not imply that arbitrary plotted waveforms look geometrically perpendicular.

The projection lab uses 2,048 midpoint samples on the selected interval. Complex c has independently adjustable real and imaginary parts. The energy/c graph varies Re(c) while keeping Im(c) fixed, a slice through the full quadratic energy surface. The optimum button sets both exact numerical parts; sliders round displayed positions to their 0.01 step. Numerical orthogonality depends on the integration interval. Zero basis energy is rejected by the core.

## 2. Contour, abstract vector and phasor

The contour is a planar geometric path. Assigning approximately uniform arc length to normalized time gives a periodic complex signal z(t)=x(t)+jy(t), 0≤t<1. That function is a vector in a function space. An individual term c_n exp(jnω0t) is a rotating phasor, not the entire abstract signal vector.

Mathematical y points upward. Browser pixel y points downward and is negated at decode/input and at render/export. Positive n rotates counterclockwise; negative n rotates clockwise. A constant DC term c0 gives the time/sample mean position (an arc-length-weighted boundary mean after resampling), not the filled-region area centroid. Normalizing imported/built-in paths centers their bounding boxes and scales their maximum extent to 2.5 units; asymmetric shapes can still have nonzero DC. Hand drawings and loaded configurations retain their coordinates. Loaded coordinates are limited to ±100.

The contour is treated as closed, including a straight segment from last to first for open input. Duplicate adjacent samples are removed. Arc-length resampling divides the full polygon perimeter into equal distances and excludes the repeated endpoint. Smoothing applies periodic [1,2,1]/4 convolution for 0–8 passes, followed by resampling. Metrics refer to this final processed contour.

## 3. Analysis and synthesis

For T=1 and ω0=2π:

c_n = ∫[0,1] z(t) exp(−j2πnt) dt.

For M=512 uniform samples z_k:

c_n = (1/M) Σ[k=0…M−1] z_k exp(−j2πnk/M).

z_N(t) = Σ[n=−N…N] c_n exp(j2πnt), with 0≤N≤100.

The complete DFT uses n=−256…255; the Nyquist bin appears once. UI reconstruction does not approach that ambiguous endpoint. The forward DFT has 1/M normalization; synthesis has none. No conjugate symmetry is imposed for complex contours. For a real-valued signal c_−n=c_n*, but x+jy generally has independent signed coefficients.

The full DFT is computed once per processed path (O(M²), 262,144 terms) and reused. Animation samples use precomputed coefficients and requestAnimationFrame elapsed time. Playback 1× traverses one normalized period in 8 wall-clock seconds, purely a viewing speed. The displayed nω0 values remain radians per normalized time unit.

Paired mode includes at most 2N+1 terms. Some terms can have zero magnitude or be disabled. The UI distinguishes enabled terms from nonzero vectors. Individual mode includes an explicitly truncated sequence DC,+1,−1,+2,−2,… through the selected N; it is not a symmetric order-N partial sum. An enabled-set label replaces the full-sum formula when terms are omitted.

Phasor magnitude is hypot(Re c, Im c) and phase is atan2(Im c, Re c). For magnitude below 1e−9, the UI labels phase undefined rather than assigning pedagogical significance to roundoff angles.

## 4. Error and Parseval

Use the exact M-sample DFT convention:

P = (1/M) Σ|z_k|² = Σ_all_bins |c_n|².

MSE(S) = (1/M) Σ|z_k−Σ[n∈S] c_n exp(j2πnk/M)|² = Σ[n∉S] |c_n|².

Relative RMS = sqrt(MSE/P). Retained normalized energy = 1−MSE/P. The zero-energy case defines relative RMS=0 and retained energy=1. Curves are drawn with 1,024 synthesis points, but all exact error statements refer to the 512-sample analysis grid. This compares the extracted/resampled signal, not photograph pixels or a semantic ideal curve. Increasing paired order cannot increase this aggregate squared error; it need not reduce every pointwise error.

The error/order curve includes all coefficients within each paired order; numeric metrics respect disabled coefficients and individual ordering. Comparison contours use complete N=1,5,20 sets and are visually labeled.

## 5. Real trigonometric series

Follow Lecture 32, using the mean directly:

x(t)=a0+Σ[n≥1](a_n cos(nω0t)+b_n sin(nω0t)).

a0=(1/T)∫x dt, a_n=(2/T)∫x cos(nω0t)dt, b_n=(2/T)∫x sin(nω0t)dt.

Compact form C_n cos(nω0t+θ_n) uses C_n=hypot(a_n,b_n), θ_n=atan2(−b_n,a_n). For n>0, complex coefficient c_n=(a_n−jb_n)/2. Thus the compact nonnegative-index C_n spectrum in the real-signal lab has a different normalization from Drawing Studio's two-sided |c_n| spectrum. DC is shown separately as its signed mean.

The Lecture 31 ±1 square wave is +1 on (0,π), −1 on (π,2π), with b_n=4/(πn) for odd n, zero for even n, and a0=a_n=0. The exact jump value is immaterial to the integral; midpoint sampling avoids evaluating precisely at the jumps. Triangle coefficients alternate odd b_n=8(−1)^((n−1)/2)/(π²n²). The rising sawtooth u↦2u−1 has b_n=−2/(πn). The periodic exponential exp(−t/2), 0≤t<π, has a0=2(1−exp(−π/2))/π, a_n=2a0/(1+16n²), b_n=8na0/(1+16n²).

Custom real signals are finite samples for one period, periodically linearly interpolated. DC is their arithmetic mean. Harmonic coefficients use 2,048 midpoint quadrature samples. Displayed error uses a separate 1,024-point midpoint grid, so it is a numerical estimate rather than an exact continuous integral.

Lecture 31 slide 20's N=1 table entry 1.1938 disagrees with its formula 2π−16/π=1.1902271282389352. The app follows the formula. Other reference clarifications appear in REFERENCE_ANALYSIS.md. Fourier sums can exhibit Gibbs overshoot near discontinuities.

## 6. Music and FFT

Pitches, 35 beat durations, 35 chord assignments and 0.75 s/beat are preserved from the MATLAB file. The implementation uses 8,000 samples/s with t_k=k/fs, exact note lengths round(fs*duration), and FFT bin k*fs/M. This corrects endpoint-inclusive linspace axes without changing the musical data.

For each note, a unit cosine melody plus three weight-0.6 chord cosines is scaled by 0.85/2.8, independent of voice switches. A 10 ms linear attack/release reaches zero at note endpoints. All voices therefore stay within ±0.85 in ideal arithmetic and toggling a voice does not normalize remaining voices upward. Web Audio resamples the 8 kHz buffers to the hardware context rate as needed. The AudioContext clock schedules notes; React only displays progress. Stopping/switching labs cleans up sources and the context.

A 2,048-point radix-2 FFT with a Hann window displays magnitude normalized to the current note peak, over 0…1,000 Hz. Windowing reduces leakage; finite notes still spread spectral peaks. These normalized FFT magnitudes are illustrative and are not calibrated continuous Fourier coefficients. Simultaneous chord notes should not be confused with the integer harmonics of one tone. The source's D7 label lacks a seventh; pitches remain a D-major triad and the label is starred.
