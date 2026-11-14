import { useMemo, useState } from 'react';
import { trigCoefficients, realSignal, trigSum, type SignalKind } from '../math/signals';
import { TAU, coefficient } from '../math/fourier';
import { Range, Section, Info, Metric, Toggle, fnum } from '../components/ui';
import { LineChart, Spectrum } from '../components/Charts';
export function SignalLab() {
  const [kind, setKind] = useState<SignalKind>('square'),
    [N, setN] = useState(9),
    [components, setComponents] = useState(true),
    [compact, setCompact] = useState(false),
    [selected, setSelected] = useState(1),
    [draft, setDraft] = useState('0, 1, 1, 0, -1, -1, 0, 0'),
    [custom, setCustom] = useState([0, 1, 1, 0, -1, -1, 0, 0]),
    [message, setMessage] = useState('');
  const { dc, terms } = useMemo(() => trigCoefficients(kind, N, custom), [kind, N, custom]);
  const M = 1024,
    us = Array.from({ length: M }, (_, k) => (k + 0.5) / M),
    original = us.map((u) => realSignal(kind, u, custom)),
    sum = us.map((u) => trigSum(dc, terms, u)),
    error = original.map((x, k) => x - sum[k]),
    mse = error.reduce((s, x) => s + x * x, 0) / M;
  const spectra = [coefficient(0, dc, 0), ...terms.map((c) => coefficient(c.n, c.a, -c.b))];
  const term = terms.find((c) => c.n === selected);
  return (
    <>
      <div className="lab-heading">
        <div>
          <div className="eyebrow">LABORATORY 02 / REAL FOURIER SERIES</div>
          <h1>Signal Reconstruction</h1>
          <p>Build a periodic waveform one orthogonal component at a time.</p>
        </div>
        <button
          className="quiet"
          onClick={() => {
            setKind('square');
            setN(9);
            setComponents(true);
            setCompact(false);
            setSelected(1);
            setCustom([0, 1, 1, 0, -1, -1, 0, 0]);
            setDraft('0, 1, 1, 0, -1, -1, 0, 0');
            setMessage('');
          }}
        >
          Reset lab
        </button>
      </div>
      <div className="secondary-lab">
        <aside className="panel">
          <Section title="Choose a signal">
            <label className="field-label">
              Periodic waveform
              <select
                aria-label="Periodic waveform"
                value={kind}
                onChange={(e) => setKind(e.target.value as SignalKind)}
              >
                <option value="square">Square wave · Lecture 31</option>
                <option value="triangle">Triangle wave</option>
                <option value="sawtooth">Sawtooth wave</option>
                <option value="exponential">Periodic exponential · Lecture 32</option>
                <option value="custom">User-defined samples</option>
              </select>
            </label>
            {kind === 'custom' && (
              <>
                <label className="field-label">
                  One period, comma-separated samples
                  <textarea
                    aria-label="Custom signal samples"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <button
                  onClick={() => {
                    const values = draft
                      .split(/[\s,]+/)
                      .filter(Boolean)
                      .map(Number);
                    if (
                      values.length < 3 ||
                      values.length > 256 ||
                      values.some((v) => !Number.isFinite(v) || Math.abs(v) > 10)
                    ) {
                      setMessage('Enter 3–256 finite samples between −10 and 10.');
                      return;
                    }
                    setCustom(values);
                    setMessage('Custom period updated using linear interpolation.');
                  }}
                >
                  Apply samples
                </button>
                <p role="status">{message}</p>
              </>
            )}
            <Range label="Signal harmonic order" value={N} max={100} onChange={setN} />
            <Toggle
              label="Show harmonic components"
              checked={components}
              onChange={setComponents}
            />
            <Toggle label="Compact amplitude–phase form" checked={compact} onChange={setCompact} />
            <Info>
              {kind === 'square'
                ? 'Only odd sine harmonics contribute: bₙ=4/(πn) for odd n, with aₙ=0. Gibbs overshoot persists near each jump, while its width shrinks.'
                : kind === 'exponential'
                  ? 'Lecture 32 example: exp(−t/2) on 0≤t<π, periodically extended. Here u=t/π; ω₀=2 rad/s.'
                  : 'Coefficients determine independent projections onto sine and cosine basis signals over one period.'}
            </Info>
          </Section>
          <Section title="Conventions">
            <p className="math formula">
              {compact
                ? 'x(t) = a₀ + Σ Cₙ cos(nω₀t + θₙ)'
                : 'x(t) = a₀ + Σ [aₙ cos(nω₀t) + bₙ sin(nω₀t)]'}
            </p>
            <p>The lecture’s a₀ is the mean value. It appears directly, with no factor of ½.</p>
            <p className="math">
              Cₙ = √(aₙ² + bₙ²)
              <br />
              θₙ = atan2(−bₙ, aₙ)
            </p>
            <p>
              For real signals, c₋ₙ = cₙ*. The compact spectra here show n ≥ 0 and Cₙ, rather than
              two-sided complex coefficients.
            </p>
          </Section>
        </aside>
        <div className="lab-main">
          <div className="panel graph-panel">
            <div className="graph-title">
              <h2>Original & partial sum</h2>
              <div className="chart-key">
                <span style={{ color: '#8c9eb4' }}>Original</span>
                <span style={{ color: '#6de5ad' }}>Fourier sum</span>
              </div>
            </div>
            <LineChart
              series={[
                { name: 'Original', values: original, color: '#8393a9', dash: true },
                ...(components
                  ? terms.slice(0, 8).map((c, i) => ({
                      name: `n=${c.n}`,
                      values: us.map(
                        (u) => c.a * Math.cos(TAU * c.n * u) + c.b * Math.sin(TAU * c.n * u),
                      ),
                      color: ['#7ba6d655', '#b29aef66', '#efbf7866'][i % 3],
                    }))
                  : []),
                { name: 'Fourier sum', values: sum, color: '#6de5ad' },
              ]}
              labels={['0', 't / T = 1']}
            />
            <small className="muted">
              Components: first eight harmonic indices; partial sum: all indices 1…{N} plus DC.
            </small>
          </div>
          <div className="panel graph-panel">
            <h2>
              Error signal · x − x<sub>N</sub>
            </h2>
            <LineChart
              series={[{ name: 'Error', values: error, color: '#efbf78' }]}
              height={150}
              labels={['0', 't / T = 1']}
            />
            <div className="metrics-inline">
              <Metric label="Sampled mean squared error" value={mse.toExponential(3)} />
              <Metric label="DC (mean) a₀" value={fnum(dc)} />
              <Metric label="Included harmonic indices" value={String(N)} />
            </div>
          </div>
          <div className="spectra-grid">
            <div className="panel graph-panel">
              <h2>Compact amplitude Cₙ</h2>
              <Spectrum cs={spectra} N={N} selected={selected} onSelect={setSelected} />
            </div>
            <div className="panel graph-panel">
              <h2>Compact phase θₙ</h2>
              <Spectrum cs={spectra} N={N} selected={selected} onSelect={setSelected} phase />
            </div>
          </div>
          <div className="panel graph-panel">
            <h2>Inspect a component</h2>
            <label className="field-label">
              Harmonic index
              <select value={selected} onChange={(e) => setSelected(+e.target.value)}>
                {Array.from({ length: Math.max(1, N) }, (_, i) => (
                  <option key={i} value={i + 1}>
                    n = {i + 1}
                  </option>
                ))}
              </select>
            </label>
            {term ? (
              <div className="coefficient-row">
                <span>aₙ = {fnum(term.a)}</span>
                <span>bₙ = {fnum(term.b)}</span>
                <span>Cₙ = {fnum(term.amplitude)}</span>
                <span>θₙ = {term.amplitude < 1e-9 ? 'undefined' : fnum(term.phase) + ' rad'}</span>
              </div>
            ) : (
              <p>Select an index within the current order. The DC term is {fnum(dc)}.</p>
            )}
            <p className="activity">
              Try N = 1, 3, 5, 7 and 99. Does a lower total error mean the approximation improves at
              every point? Look closely near a square-wave jump.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
