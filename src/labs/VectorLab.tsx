import { useMemo, useState } from 'react';
import { innerProduct, projection, abs2, type Complex } from '../math/fourier';
import { LineChart } from '../components/Charts';
import { Range, Section, Info, Metric, fnum, Toggle } from '../components/ui';
type Choice = 'square' | 'sin' | 'cos' | 'mixed' | 'exp1' | 'exp2' | 'custom';
const choices: Record<Choice, string> = {
  square: 'Square wave',
  sin: 'sin(t)',
  cos: 'cos(t)',
  mixed: '1 + sin(t)',
  exp1: 'exp(jt)',
  exp2: 'exp(j2t)',
  custom: 'Custom real samples',
};
function evalSignal(choice: Choice, t: number, custom: number[]): Complex {
  switch (choice) {
    case 'square':
      return { re: Math.sin(t) >= 0 ? 1 : -1, im: 0 };
    case 'sin':
      return { re: Math.sin(t), im: 0 };
    case 'cos':
      return { re: Math.cos(t), im: 0 };
    case 'mixed':
      return { re: 1 + Math.sin(t), im: 0 };
    case 'exp1':
      return { re: Math.cos(t), im: Math.sin(t) };
    case 'exp2':
      return { re: Math.cos(2 * t), im: Math.sin(2 * t) };
    case 'custom': {
      const u = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * custom.length,
        i = Math.floor(u),
        v = u - i;
      return {
        re: custom[i % custom.length] * (1 - v) + custom[(i + 1) % custom.length] * v,
        im: 0,
      };
    }
  }
}
export function VectorLab() {
  const [target, setTarget] = useState<Choice>('square'),
    [basis, setBasis] = useState<Choice>('sin'),
    [a, setA] = useState(0),
    [b, setB] = useState(2),
    [re, setRe] = useState(1),
    [im, setIm] = useState(0),
    [imag, setImag] = useState(false),
    [draft, setDraft] = useState('0,1,0,-1'),
    [custom, setCustom] = useState([0, 1, 0, -1]),
    [message, setMessage] = useState('');
  const data = useMemo(() => {
    const M = 2048,
      dt = ((b - a) * Math.PI) / M,
      t = Array.from({ length: M }, (_, i) => a * Math.PI + (i + 0.5) * dt),
      x = t.map((t) => evalSignal(target, t, custom)),
      g = t.map((t) => evalSignal(basis, t, custom)),
      opt = projection(x, g, dt),
      product = innerProduct(x, g, dt);
    return { x, g, opt, product, dt };
  }, [target, basis, a, b, custom]);
  const scaled = data.g.map((g) => ({ re: re * g.re - im * g.im, im: re * g.im + im * g.re })),
    err = data.x.map((x, i) => ({ re: x.re - scaled[i].re, im: x.im - scaled[i].im })),
    energy = (arr: Complex[]) => arr.reduce((s, q) => s + abs2(q) * data.dt, 0),
    Ee = energy(err),
    Ex = energy(data.x),
    Ep = energy(scaled),
    orth = innerProduct(err, data.g, data.dt),
    optScaled = data.g.map((g) => ({
      re: data.opt.re * g.re - data.opt.im * g.im,
      im: data.opt.re * g.im + data.opt.im * g.re,
    })),
    optErr = data.x.map((x, i) => ({ re: x.re - optScaled[i].re, im: x.im - optScaled[i].im })),
    optError = energy(optErr),
    curve = Array.from({ length: 101 }, (_, i) => {
      const c = -3 + i * 0.06;
      return energy(
        data.x.map((x, k) => ({
          re: x.re - (c * data.g[k].re - im * data.g[k].im),
          im: x.im - (c * data.g[k].im + im * data.g[k].re),
        })),
      );
    });
  const component = imag ? 'im' : 're';
  return (
    <>
      <div className="lab-heading">
        <div>
          <div className="eyebrow">LABORATORY 03 / INNER-PRODUCT SPACES</div>
          <h1>Signals as Vectors</h1>
          <p>
            A Fourier coefficient begins with a simpler question: how much of one signal lies along
            another?
          </p>
        </div>
        <button
          className="quiet"
          onClick={() => {
            setTarget('square');
            setBasis('sin');
            setA(0);
            setB(2);
            setRe(1);
            setIm(0);
            setImag(false);
            setDraft('0,1,0,-1');
            setCustom([0, 1, 0, -1]);
            setMessage('');
          }}
        >
          Reset lab
        </button>
      </div>
      <div className="secondary-lab">
        <aside className="panel">
          <Section title="Signal & basis">
            <label className="field-label">
              Target x(t)
              <select
                aria-label="Target signal"
                value={target}
                onChange={(e) => setTarget(e.target.value as Choice)}
              >
                {Object.entries(choices).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Basis g(t)
              <select
                aria-label="Basis signal"
                value={basis}
                onChange={(e) => setBasis(e.target.value as Choice)}
              >
                {Object.entries(choices).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {(target === 'custom' || basis === 'custom') && (
              <>
                <label className="field-label">
                  Shared custom real period
                  <textarea
                    aria-label="Projection custom samples"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <button
                  onClick={() => {
                    const v = draft
                      .split(/[\s,]+/)
                      .filter(Boolean)
                      .map(Number);
                    if (
                      v.length < 3 ||
                      v.length > 256 ||
                      v.some((n) => !Number.isFinite(n) || Math.abs(n) > 10)
                    ) {
                      setMessage('Use 3–256 finite values in [−10,10].');
                      return;
                    }
                    setCustom(v);
                    setMessage('Custom samples applied.');
                  }}
                >
                  Apply custom samples
                </button>
                <p role="status">{message}</p>
              </>
            )}
            <div className="input-pair">
              <label className="field-label">
                Start / π
                <input
                  aria-label="Integration start divided by pi"
                  type="number"
                  min={-2}
                  max={b - 0.1}
                  step={0.1}
                  value={a}
                  onChange={(e) => {
                    const v = +e.target.value;
                    if (Number.isFinite(v)) setA(Math.max(-2, Math.min(b - 0.1, v)));
                  }}
                />
              </label>
              <label className="field-label">
                End / π
                <input
                  aria-label="Integration end divided by pi"
                  type="number"
                  min={a + 0.1}
                  max={4}
                  step={0.1}
                  value={b}
                  onChange={(e) => {
                    const v = +e.target.value;
                    if (Number.isFinite(v)) setB(Math.min(4, Math.max(a + 0.1, v)));
                  }}
                />
              </label>
            </div>
            <p className="muted">Midpoint quadrature: 2,048 samples.</p>
            <button
              className="wide secondary"
              onClick={() => {
                setTarget('sin');
                setBasis('cos');
                setA(0);
                setB(2);
                setRe(0);
                setIm(0);
              }}
            >
              Try an orthogonal pair
            </button>
            <button
              className="wide secondary"
              onClick={() => {
                setTarget('mixed');
                setBasis('sin');
                setA(0);
                setB(2);
                setRe(1);
                setIm(0);
              }}
            >
              Try a nonorthogonal pair
            </button>
          </Section>
          <Section title="Adjust the projection">
            <Range
              label="Real part of c"
              value={re}
              min={-3}
              max={3}
              step={0.01}
              onChange={setRe}
            />
            <Range
              label="Imaginary part of c"
              value={im}
              min={-3}
              max={3}
              step={0.01}
              onChange={setIm}
            />
            <button
              className="wide primary"
              onClick={() => {
                setRe(data.opt.re);
                setIm(data.opt.im);
              }}
            >
              Use optimal coefficient
            </button>
            <Toggle label="Plot imaginary components" checked={imag} onChange={setImag} />
            <Info>
              The best c makes the residual orthogonal to g. For the Lecture 31 square wave on
              [0,2π], the sine projection is c = 4/π.
            </Info>
          </Section>
        </aside>
        <div className="lab-main">
          <div className="panel graph-panel">
            <div className="graph-title">
              <h2>{imag ? 'Imaginary' : 'Real'} components</h2>
              <div className="chart-key">
                <span style={{ color: '#8dbff0' }}>x(t)</span>
                <span style={{ color: '#6de5ad' }}>cg(t)</span>
                <span style={{ color: '#efbf78' }}>error</span>
              </div>
            </div>
            <LineChart
              series={[
                { name: 'Target', values: data.x.map((p) => p[component]), color: '#8dbff0' },
                { name: 'Scaled basis', values: scaled.map((p) => p[component]), color: '#6de5ad' },
                { name: 'Error', values: err.map((p) => p[component]), color: '#efbf78' },
              ]}
              labels={[`${a}π`, `${b}π`]}
              yLabel={imag ? 'Imaginary part' : 'Real part'}
            />
            <div className="metrics-inline">
              <Metric label="Error energy ∫|x − cg|² dt" value={fnum(Ee)} />
              <Metric label="Minimum error energy" value={fnum(optError)} />
              <Metric label="Current Re(c)" value={fnum(re)} />
            </div>
          </div>
          <div className="panel graph-panel">
            <h2>The coefficient that minimizes error</h2>
            <div className="projection-equation math">
              c = ⟨x,g⟩ / ⟨g,g⟩ = {fnum(data.opt.re)} {data.opt.im < 0 ? '−' : '+'} j
              {fnum(Math.abs(data.opt.im))}
            </div>
            <p className="math">
              ⟨x,g⟩ = ∫ x(t)g*(t) dt = {fnum(data.product.re)} + j{fnum(data.product.im)}
            </p>
            <p>
              We use an inner product linear in its first argument, conjugate-linear in its second.
              A signal is an abstract vector in a function space; its time plot is a representation
              of that vector.
            </p>
            <LineChart
              series={[{ name: 'Error energy', values: curve, color: '#efbf78' }]}
              height={180}
              labels={['Re(c) = −3', 'Re(c) = +3']}
              nonNegative
              yLabel={`Error energy at Im(c) = ${fnum(im, 2)}`}
            />
            <p className="muted">
              The plotted minimum over real c depends on the current imaginary part. The button sets
              both parts to the full complex optimum.
            </p>
          </div>
          <div className="panel graph-panel">
            <h2>Orthogonality & the Pythagorean relationship</h2>
            <div className="metrics-inline">
              <Metric label="Eₓ" value={fnum(Ex)} />
              <Metric label="Ecg" value={fnum(Ep)} />
              <Metric label="Eerror" value={fnum(Ee)} />
            </div>
            <p className="math">
              ⟨error, g⟩ = {fnum(orth.re)} + j{fnum(orth.im)}
            </p>
            <p>
              At the optimum: Eₓ = Eprojection + Eerror = {fnum(energy(optScaled))} +{' '}
              {fnum(optError)} = {fnum(Ex)}. Orthogonal components add in energy because the cross
              terms vanish.
            </p>
            <p className="activity">
              Change the integration interval. Do sin(t) and cos(t) remain orthogonal over every
              interval? Adjust c away from its optimum and observe the residual inner product.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
