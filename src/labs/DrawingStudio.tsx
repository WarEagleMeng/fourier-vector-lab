import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Upload,
  PenLine,
  Download,
  Share2,
  Maximize,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  FolderOpen,
} from 'lucide-react';
import {
  activeCoefficients,
  dft,
  resampleClosed,
  smoothClosed,
  normalizePath,
  sampleSynthesis,
  metrics,
  errorCurve,
  type Complex,
} from '../math/fourier';
import { exampleNames, examplePath, pathD } from '../content/examples';
import { decodeRaster, extractContours, svgContours, type Raster } from '../image/contours';
import { drawScene, type Layers, type DrawingScene } from '../render/drawing';
import {
  parseExperiment,
  download,
  encodeShare,
  decodeShare,
  type Experiment,
} from '../state/experiment';
import { Section, Range, Toggle, Metric, Info, fnum } from '../components/ui';
import { Spectrum, ErrorChart } from '../components/Charts';
import { DrawPad } from '../components/DrawPad';
const initialLayers: Layers = {
  vectors: true,
  circles: true,
  original: true,
  reconstruction: true,
  trace: true,
  contribution: false,
  grid: true,
};
export function DrawingStudio({ light, presentation }: { light: boolean; presentation: boolean }) {
  const [raw, setRaw] = useState<Complex[]>(() => examplePath('Heart')),
    [name, setName] = useState('Heart'),
    [N, setN] = useState(12),
    [speed, setSpeed] = useState(1),
    [playing, setPlaying] = useState(true),
    [loop, setLoop] = useState(true),
    [smoothing, setSmoothing] = useState(0),
    [layers, setLayers] = useState(initialLayers),
    [selected, setSelected] = useState(1),
    [disabled, setDisabled] = useState<number[]>([]),
    [progress, setProgress] = useState(0),
    [mode, setMode] = useState<'paired' | 'individual'>('paired'),
    [terms, setTerms] = useState(25),
    [compare, setCompare] = useState(false),
    [evolving, setEvolving] = useState(false),
    [evolveMax, setEvolveMax] = useState(12),
    [message, setMessage] = useState(''),
    [draw, setDraw] = useState(false),
    [leftOpen, setLeftOpen] = useState(true),
    [rightOpen, setRightOpen] = useState(true),
    [raster, setRaster] = useState<Raster | null>(null),
    [imageUrl, setImageUrl] = useState(''),
    [threshold, setThreshold] = useState(128),
    [invert, setInvert] = useState(false),
    [candidates, setCandidates] = useState<Complex[][]>([]),
    [contourIndex, setContourIndex] = useState(0),
    [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    stage = useRef<HTMLDivElement>(null),
    upload = useRef<HTMLInputElement>(null),
    jsonInput = useRef<HTMLInputElement>(null),
    time = useRef(0),
    recorder = useRef<MediaRecorder | null>(null),
    recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    urlRef = useRef('');
  const points = useMemo(
    () => resampleClosed(smoothClosed(resampleClosed(raw), smoothing)),
    [raw, smoothing],
  );
  const cs = useMemo(() => dft(points), [points]);
  const active = useMemo(
    () => activeCoefficients(cs, N, disabled, mode, Math.min(terms, 2 * N + 1)),
    [cs, N, disabled, mode, terms],
  );
  const curve = useMemo(() => sampleSynthesis(active, 1024), [active]);
  const error = useMemo(() => metrics(points, cs, active), [points, cs, active]);
  const errors = useMemo(() => errorCurve(cs), [cs]);
  const inspected = cs.find((c) => c.n === selected)!;
  const comparisons = useMemo(
    () =>
      compare ? [1, 5, 20].map((n) => sampleSynthesis(activeCoefficients(cs, n), 512)) : undefined,
    [cs, compare],
  );
  const scene = useRef<DrawingScene>({ points, curve, cs: active, t: 0, trace: [], layers });
  scene.current = {
    points,
    curve,
    cs: active,
    t: 0,
    trace: [],
    layers,
    inspected,
    comparison: comparisons,
    light,
  };
  const resetTime = useCallback(() => {
    time.current = 0;
    setProgress(0);
  }, []);
  useEffect(resetTime, [raw, N, smoothing, disabled, mode, terms, resetTime]);
  useEffect(() => {
    let id = 0,
      last = 0,
      shown = 0;
    const animate = (now: number) => {
      if (last && playing) {
        let next = time.current + (((now - last) / 1000) * speed) / 8;
        if (next >= 1) {
          if (loop) next %= 1;
          else {
            next = 1;
            setPlaying(false);
          }
        }
        time.current = next;
      }
      last = now;
      const s = scene.current,
        t = time.current;
      if (canvas.current)
        drawScene(canvas.current, {
          ...s,
          t,
          trace: s.curve.slice(0, Math.floor(t * (s.curve.length - 1)) + 1),
        });
      if (now - shown > 100) {
        setProgress(t);
        shown = now;
      }
      id = requestAnimationFrame(animate);
    };
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [playing, speed, loop]);
  useEffect(() => {
    if (!evolving) return;
    if (N >= evolveMax) {
      setEvolving(false);
      return;
    }
    const id = setTimeout(() => {
      setN(N + 1);
      setTerms(2 * (N + 1) + 1);
    }, 650);
    return () => clearTimeout(id);
  }, [evolving, N, evolveMax]);
  const usePath = useCallback(
    (p: Complex[], label: string) => {
      try {
        resampleClosed(p);
        setRaw(p.length > 2048 ? resampleClosed(p, 2048) : p);
        setName(label);
        setDisabled([]);
        setDraw(false);
        setSelected(1);
        resetTime();
      } catch (e) {
        setMessage((e as Error).message);
      }
    },
    [resetTime],
  );
  const apply = useCallback(
    (x: Experiment) => {
      setEvolving(false);
      usePath(x.points, x.name);
      setN(x.N);
      setTerms(2 * x.N + 1);
      setSpeed(x.speed);
      setSmoothing(x.smoothing);
      setDisabled(x.disabled);
      setMode('paired');
      setPlaying(false);
      setRaster(null);
      setCandidates([]);
      setImageUrl('');
    },
    [usePath],
  );
  useEffect(() => {
    if (location.hash.startsWith('#experiment=')) {
      try {
        apply(decodeShare(location.hash.slice(12)));
        setMessage('Shared experiment loaded. Press Play to explore.');
      } catch (e) {
        setMessage((e as Error).message);
      }
    }
  }, [apply]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        document.querySelector('[aria-modal="true"]') ||
        (e.target as HTMLElement).matches('input,textarea,select,button') ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === 'r' || e.key === 'R') resetTime();
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        time.current = (time.current + (e.key === 'ArrowRight' ? 1 : -1) / 512 + 1) % 1;
        setProgress(time.current);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [resetTime]);
  useEffect(() => {
    if (!raster) return;
    const id = setTimeout(() => {
      try {
        const loops = extractContours(raster, threshold, invert);
        setCandidates(loops);
        setContourIndex(0);
        if (loops.length) usePath(normalizePath(loops[0]), 'Image contour');
        else setMessage('No closed boundary found. Adjust threshold or trace the image manually.');
      } catch (e) {
        setMessage((e as Error).message);
      }
    }, 120);
    return () => clearTimeout(id);
  }, [raster, threshold, invert, usePath]);
  useEffect(() => {
    if (urlRef.current && urlRef.current !== imageUrl) URL.revokeObjectURL(urlRef.current);
    urlRef.current = imageUrl;
  }, [imageUrl]);
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (recordTimer.current) clearTimeout(recordTimer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
    },
    [],
  );
  const loadFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      if (file.name.toLowerCase().endsWith('.svg')) {
        const loops = svgContours(await file.text());
        setRaster(null);
        setImageUrl('');
        setCandidates(loops);
        setContourIndex(0);
        usePath(loops[0], 'SVG contour');
      } else {
        const result = await decodeRaster(file);
        setRaster(result.raster);
        setImageUrl(result.url);
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const config = (): Experiment => ({
    version: 1,
    name,
    points: raw,
    N,
    speed,
    smoothing,
    disabled,
  });
  const exportSVG = () => {
    const extent = Math.max(1, ...curve.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im)))),
      scale = 450 / extent;
    const d =
      curve
        .map(
          (p, i) =>
            `${i ? 'L' : 'M'}${(500 + p.re * scale).toFixed(3)} ${(500 - p.im * scale).toFixed(3)}`,
        )
        .join(' ') + ' Z';
    download(
      'fourier-contour.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="${d}" fill="none" stroke="#16835b" stroke-width="3"/></svg>`,
      'image/svg+xml',
    );
    setMessage('Reconstructed contour exported as SVG.');
  };
  const exportPNG = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 1200;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = light ? '#f5f8fb' : '#0b1420';
    ctx.fillRect(0, 0, 1200, 1200);
    const ext = Math.max(1, ...curve.map((p) => Math.max(Math.abs(p.re), Math.abs(p.im)))),
      s = 500 / ext;
    ctx.strokeStyle = light ? '#16835b' : '#6de5ad';
    ctx.lineWidth = 3;
    ctx.beginPath();
    curve.forEach((p, i) =>
      i ? ctx.lineTo(600 + p.re * s, 600 - p.im * s) : ctx.moveTo(600 + p.re * s, 600 - p.im * s),
    );
    ctx.closePath();
    ctx.stroke();
    c.toBlob((blob) => {
      if (blob) download('fourier-contour.png', blob);
    }, 'image/png');
  };
  const share = async () => {
    try {
      const x = config();
      const link = location.origin + location.pathname + '#experiment=' + encodeShare(x);
      await navigator.clipboard.writeText(link);
      setMessage(
        'Configuration link copied. The link contains contour points and settings, never an uploaded image.',
      );
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const record = () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const c = canvas.current;
      if (!c?.captureStream || typeof MediaRecorder === 'undefined')
        throw new Error(
          'WebM recording is unavailable in this browser. Try current Chrome or Edge.',
        );
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      if (!mime) throw new Error('This browser cannot encode WebM.');
      c.scrollIntoView({ block: 'center', behavior: 'instant' });
      const stream = c.captureStream(30),
        rec = new MediaRecorder(stream, { mimeType: mime }),
        chunks: Blob[] = [];
      recorder.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordTimer.current) clearTimeout(recordTimer.current);
        setRecording(false);
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 1024) {
          setMessage(
            'No video frames were captured. Keep the canvas visible in the active tab and try again.',
          );
          return;
        }
        download('fourier-animation.webm', blob);
      };
      rec.start(250);
      setRecording(true);
      resetTime();
      setPlaying(true);
      recordTimer.current = setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, 10000);
      setMessage('Recording 10 seconds. Keep this tab active and the animation canvas visible.');
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  const fullScreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void stage.current
        ?.requestFullscreen()
        .catch(() => setMessage('Fullscreen is unavailable. Use Presentation mode instead.'));
  };
  const defaults = () => {
    setEvolving(false);
    setN(12);
    setTerms(25);
    setMode('paired');
    setSpeed(1);
    setSmoothing(0);
    setLayers(initialLayers);
    setLoop(true);
    setPlaying(true);
    setCompare(false);
    setRaster(null);
    setCandidates([]);
    setImageUrl('');
    usePath(examplePath('Heart'), 'Heart');
  };
  const step = (d: number) => {
    setPlaying(false);
    time.current = (time.current + d / 512 + 1) % 1;
    setProgress(time.current);
  };
  return (
    <>
      <div className="lab-heading">
        <div>
          <div className="eyebrow">
            LABORATORY 01 <span> / </span> COMPLEX FOURIER SERIES
          </div>
          <h1>
            Fourier Drawing Studio
            <span className="live-tag">
              <i /> LIVE
            </span>
          </h1>
          <p>A drawing is a signal. Discover the rotating vectors that bring it to life.</p>
        </div>
        <button className="quiet" onClick={defaults}>
          <RotateCcw size={15} /> Reset lab
        </button>
      </div>
      {message && (
        <div className="status-banner" role="status">
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage('')}>
            ×
          </button>
        </div>
      )}
      <div
        className={`studio-grid ${!leftOpen ? 'left-collapsed' : ''} ${!rightOpen ? 'right-collapsed' : ''} ${presentation ? 'presentation-studio' : ''}`}
      >
        <aside className="studio-left panel">
          <button
            className="panel-collapse"
            aria-label={leftOpen ? 'Collapse preparation panel' : 'Expand preparation panel'}
            onClick={() => setLeftOpen(!leftOpen)}
          >
            {leftOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          {leftOpen && (
            <>
              <Section title="Choose a drawing" number="01">
                <div className="examples">
                  {exampleNames.map((n) => (
                    <button
                      key={n}
                      className={`example ${name === n ? 'selected' : ''}`}
                      onClick={() => {
                        setRaster(null);
                        setImageUrl('');
                        setCandidates([]);
                        usePath(examplePath(n), n);
                      }}
                      aria-label={`${n} example`}
                    >
                      <svg viewBox="0 0 64 64">
                        <path d={pathD(examplePath(n))} />
                      </svg>
                      <span>{n}</span>
                    </button>
                  ))}
                </div>
                <div
                  className="upload-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void loadFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={21} />
                  <button onClick={() => upload.current?.click()} disabled={busy}>
                    {busy ? 'Processing…' : 'Upload an image'}
                  </button>
                  <small>or drop it here · PNG, JPG, WebP, SVG</small>
                </div>
                <input
                  ref={upload}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.svg"
                  hidden
                  onChange={(e) => {
                    void loadFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button className="wide secondary" onClick={() => setDraw(true)}>
                  <PenLine size={15} />
                  {imageUrl ? 'Trace or draw a path' : 'Draw your own path'}
                </button>
                {imageUrl && raster && (
                  <>
                    <div className="image-comparison">
                      <img src={imageUrl} alt="Original uploaded image" />
                      <svg
                        viewBox={`0 0 ${raster.width} ${raster.height}`}
                        aria-label="Selected extracted contour overlay"
                      >
                        <polyline
                          points={(candidates[contourIndex] || [])
                            .map((p) => `${p.re},${-p.im}`)
                            .join(' ')}
                          fill="none"
                          stroke="#10bb77"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <small className="muted">
                      Original image with selected ordered boundary in green
                    </small>
                    <Range
                      label="Threshold"
                      value={threshold}
                      min={1}
                      max={254}
                      onChange={setThreshold}
                    />
                    <Toggle label="Light foreground" checked={invert} onChange={setInvert} />
                  </>
                )}
                {!!candidates.length && (
                  <label className="field-label">
                    Select contour ({candidates.length})
                    <select
                      aria-label="Select contour"
                      value={contourIndex}
                      onChange={(e) => {
                        const i = +e.target.value;
                        setContourIndex(i);
                        usePath(
                          normalizePath(candidates[i]),
                          raster ? 'Image contour' : 'SVG contour',
                        );
                      }}
                    >
                      {candidates.map((c, i) => (
                        <option value={i} key={i}>
                          Contour {i + 1} · {c.length} boundary points
                        </option>
                      ))}
                    </select>
                    <small>
                      One closed loop at a time. Holes and disconnected regions are separate
                      contours.
                    </small>
                  </label>
                )}
              </Section>
              <Section title="Prepare the contour" number="02">
                <div className="mini-stats">
                  <span>
                    Samples <b>512</b>
                  </span>
                  <span>
                    Path <b>Closed</b>
                  </span>
                </div>
                <Range label="Smoothing passes" value={smoothing} max={8} onChange={setSmoothing} />
                <small className="muted">Uniform arc-length resampling · x + jy, y upward</small>
              </Section>
              <Section title="Build with harmonics" number="03">
                <div className="order-readout">
                  <span>
                    Maximum order <i>N</i>
                  </span>
                  <strong data-testid="harmonic-order">{N}</strong>
                </div>
                <Range
                  label="Harmonic order"
                  value={N}
                  max={100}
                  onChange={(v) => {
                    setEvolving(false);
                    setN(v);
                    setTerms(2 * v + 1);
                  }}
                />
                <div className="frequency-range">
                  −{N} <span>≤ n ≤</span> +{N}
                  <b>{2 * N + 1} available terms</b>
                </div>
                <button
                  className={`wide ${evolving ? 'active' : 'secondary'}`}
                  onClick={() => {
                    if (evolving) setEvolving(false);
                    else {
                      setEvolveMax(Math.max(1, N));
                      setN(0);
                      setTerms(1);
                      setEvolving(true);
                    }
                  }}
                >
                  <Sparkles size={15} />
                  {evolving ? 'Pause order evolution' : 'Evolve from N = 0'}
                </button>
                <details>
                  <summary>
                    Coefficient order <ChevronDown size={13} />
                  </summary>
                  <label className="field-label">
                    Progression
                    <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                      <option value="paired">Paired order −N … +N</option>
                      <option value="individual">Individual: DC, +1, −1, +2, −2…</option>
                    </select>
                  </label>
                  {mode === 'individual' && (
                    <Range
                      label="Included coefficients"
                      value={Math.min(terms, 2 * N + 1)}
                      min={1}
                      max={2 * N + 1}
                      onChange={setTerms}
                    />
                  )}
                  <Toggle label="Compare N = 1, 5, 20" checked={compare} onChange={setCompare} />
                  {compare && (
                    <small className="muted">
                      Dashed: purple N=1, amber N=5, blue N=20. Comparisons use all coefficients.
                    </small>
                  )}
                </details>
              </Section>
              <Section title="Visible layers">
                <div className="layer-toggles">
                  {(
                    [
                      ['vectors', 'Rotating vectors', '#8dbff0'],
                      ['circles', 'Vector circles', '#748cba'],
                      ['original', 'Original contour', '#7d8a9e'],
                      ['reconstruction', 'Reconstructed contour', '#3d956c'],
                      ['trace', 'Traced trajectory', '#6de5ad'],
                      ['contribution', 'Inspected harmonic', '#efbf78'],
                      ['grid', 'Coordinate grid', '#64748b'],
                    ] as const
                  ).map(([k, label, color]) => (
                    <Toggle
                      key={k}
                      label={label}
                      color={color}
                      checked={layers[k]}
                      onChange={(v) => setLayers((l) => ({ ...l, [k]: v }))}
                    />
                  ))}
                </div>
              </Section>
            </>
          )}
        </aside>
        <div className="studio-center">
          <div className="canvas-panel panel" ref={stage}>
            <div className="canvas-toolbar">
              <span>
                <i className="small-dot" />
                {name}
                <small> / complex plane</small>
              </span>
              <div>
                <span className="mono">
                  {active.filter((c) => c.magnitude > 1e-9).length} nonzero vectors ·{' '}
                  {active.length} enabled terms
                </span>
                <button
                  className="icon-button"
                  aria-label="Fullscreen animation"
                  title="Fullscreen animation"
                  onClick={fullScreen}
                >
                  <Maximize size={16} />
                </button>
              </div>
            </div>
            <div className="canvas-wrap">
              <canvas
                ref={canvas}
                role="img"
                aria-label="Animated head-to-tail Fourier vectors reconstructing the contour"
              />
              <div className="canvas-equation">
                z<sub>{N}</sub>(t) ={' '}
                <span className="summation">
                  <span>{disabled.length || mode === 'individual' ? '' : N}</span>
                  <b>Σ</b>
                  <span>{disabled.length || mode === 'individual' ? 'n ∈ S' : `n = −${N}`}</span>
                </span>{' '}
                c<sub>n</sub> e<sup>jnω₀t</sup>
                {(disabled.length > 0 || mode === 'individual') && (
                  <small> S = enabled indices</small>
                )}
              </div>
              <div className="canvas-legend">
                <span>
                  <i style={{ background: '#8dbff0' }} /> n &gt; 0
                </span>
                <span>
                  <i style={{ background: '#b29aef' }} /> n &lt; 0
                </span>
                <span>
                  <i style={{ background: '#6de5ad' }} /> reconstruction
                </span>
              </div>
              <div className="time-stamp">t / T = {progress.toFixed(3)}</div>
            </div>
            <div className="playback">
              <div className="transport">
                <button
                  className="icon-button"
                  aria-label="Restart animation"
                  title="Restart · R"
                  onClick={resetTime}
                >
                  <RotateCcw size={17} />
                </button>
                <button className="icon-button" aria-label="Step backward" onClick={() => step(-1)}>
                  <SkipBack size={17} />
                </button>
                <button
                  className="play-button"
                  aria-label={playing ? 'Pause animation' : 'Play animation'}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? (
                    <Pause size={19} fill="currentColor" />
                  ) : (
                    <Play size={19} fill="currentColor" />
                  )}
                </button>
                <button className="icon-button" aria-label="Step forward" onClick={() => step(1)}>
                  <SkipForward size={17} />
                </button>
              </div>
              <label className="speed-select">
                Speed
                <select
                  aria-label="Animation speed"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                >
                  {[0.1, 0.25, 0.5, 1, 1.5, 2, 3].map((v) => (
                    <option key={v} value={v}>
                      {v}×
                    </option>
                  ))}
                </select>
              </label>
              <label className="loop-control">
                <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
                Loop
              </label>
              <span className="keyboard-hint">
                <kbd>space</kbd> play / pause
              </span>
            </div>
          </div>
          <div className="concept-card panel">
            <div className="eyebrow">THE IDEA BEHIND THE DRAWING</div>
            <h2>Every curve has a frequency story.</h2>
            <p>
              Your contour is the complex periodic signal{' '}
              <span className="math">z(t) = x(t) + jy(t)</span>. Each Fourier coefficient becomes a
              rotating phasor. Add them head-to-tail and their final endpoint draws the partial
              reconstruction.
            </p>
            <div className="concept-equations">
              <span>
                c<sub>n</sub> = (1/T) ∫<sub>0</sub>
                <sup>T</sup> z(t)e<sup>−jnω₀t</sup> dt
              </span>
              <span>
                ω₀ = 2π/T <small>· T = 1 normalized unit</small>
              </span>
            </div>
            <Info>
              Negative frequencies rotate clockwise in the mathematical plane; positive frequencies
              rotate counterclockwise. The DC vector c₀ is the mean position, not a rotating term.
            </Info>
          </div>
          <div className="export-bar panel">
            <span>TAKE YOUR EXPERIMENT WITH YOU</span>
            <div className="export-actions">
              <button onClick={exportSVG}>
                <Download size={14} /> SVG
              </button>
              <button onClick={exportPNG}>PNG</button>
              <button
                onClick={() =>
                  download(
                    'fourier-coefficients.csv',
                    'n,angular_frequency_rad_per_unit,re,im,magnitude,phase_rad,enabled\n' +
                      cs
                        .filter((c) => Math.abs(c.n) <= 100)
                        .map((c) =>
                          [
                            c.n,
                            c.n * 2 * Math.PI,
                            c.re,
                            c.im,
                            c.magnitude,
                            c.magnitude < 1e-9 ? '' : c.phase,
                            active.some((a) => a.n === c.n),
                          ].join(','),
                        )
                        .join('\n'),
                    'text/csv',
                  )
                }
              >
                CSV
              </button>
              <button
                onClick={() =>
                  download(
                    'fourier-experiment.json',
                    JSON.stringify(config(), null, 2),
                    'application/json',
                  )
                }
              >
                Save JSON
              </button>
              <button onClick={() => jsonInput.current?.click()}>
                <FolderOpen size={14} /> Load
              </button>
              <button onClick={() => void share()}>
                <Share2 size={14} /> Share
              </button>
              <button className={recording ? 'recording' : ''} onClick={record}>
                <Film size={14} />
                {recording ? 'Stop recording' : 'WebM'}
              </button>
            </div>
            <input
              ref={jsonInput}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  if (file.size > 1_000_000) throw new Error('Experiment exceeds 1 MB.');
                  apply(parseExperiment(JSON.parse(await file.text())));
                  setMessage('Experiment loaded.');
                } catch (err) {
                  setMessage((err as Error).message);
                }
              }}
            />
          </div>
        </div>
        <aside className="studio-right panel">
          <button
            className="panel-collapse"
            aria-label={rightOpen ? 'Collapse analysis panel' : 'Expand analysis panel'}
            onClick={() => setRightOpen(!rightOpen)}
          >
            {rightOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          {rightOpen && (
            <>
              <Section title="Frequency spectra">
                <div className="chart-label">
                  <span>AMPLITUDE</span>
                  <span>|cₙ|</span>
                </div>
                <Spectrum
                  cs={cs}
                  N={N}
                  selected={selected}
                  onSelect={setSelected}
                  disabled={disabled}
                />
                <div className="chart-label">
                  <span>PHASE</span>
                  <span>arg(cₙ) · rad</span>
                </div>
                <Spectrum
                  cs={cs}
                  N={N}
                  phase
                  selected={selected}
                  onSelect={setSelected}
                  disabled={disabled}
                />
                <small className="muted">
                  Click a spectral line to inspect a harmonic. Indices are signed.
                </small>
              </Section>
              <Section title="Harmonic inspector">
                <label className="harmonic-picker">
                  Selected harmonic
                  <select
                    aria-label="Selected harmonic"
                    value={selected}
                    onChange={(e) => setSelected(+e.target.value)}
                  >
                    {Array.from({ length: 201 }, (_, i) => i - 100).map((n) => (
                      <option key={n} value={n}>
                        n = {n > 0 ? '+' : ''}
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="coefficient-value">
                  c<sub>{selected}</sub> = {fnum(inspected.re)} {inspected.im < 0 ? '−' : '+'} j
                  {fnum(Math.abs(inspected.im))}
                </div>
                <dl className="inspector-details">
                  <div>
                    <dt>Magnitude</dt>
                    <dd>{fnum(inspected.magnitude)}</dd>
                  </div>
                  <div>
                    <dt>Phase</dt>
                    <dd>
                      {inspected.magnitude < 1e-9 ? 'Undefined' : fnum(inspected.phase, 3) + ' rad'}
                    </dd>
                  </div>
                  <div>
                    <dt>Angular frequency</dt>
                    <dd>
                      {selected}ω₀ = {fnum(selected * 2 * Math.PI, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt>Rotation</dt>
                    <dd>
                      {selected === 0
                        ? 'Stationary'
                        : selected > 0
                          ? 'Counterclockwise'
                          : 'Clockwise'}
                    </dd>
                  </div>
                </dl>
                <Toggle
                  label="Enable this harmonic"
                  checked={!disabled.includes(selected)}
                  onChange={(v) =>
                    setDisabled((d) => (v ? d.filter((n) => n !== selected) : [...d, selected]))
                  }
                />
                <small className="muted">
                  Contribution: c<sub>{selected}</sub> exp(j{selected}ω₀t).{' '}
                  {Math.abs(selected) > N ? 'Outside the current order.' : ''}
                </small>
              </Section>
              <Section title="Reconstruction error">
                <div className="error-metrics">
                  <Metric
                    label="Relative RMS error"
                    value={(error.relativeRms * 100).toFixed(2)}
                    unit="%"
                  />
                  <Metric label="Mean squared error" value={error.mse.toExponential(2)} />
                </div>
                <div className="energy-label">
                  <span>Retained energy</span>
                  <strong>{(100 * error.energy).toFixed(2)}%</strong>
                </div>
                <div className="energy-track">
                  <i style={{ width: `${error.energy * 100}%` }} />
                </div>
                <div className="chart-label">
                  <span>ERROR VS. HARMONIC ORDER</span>
                </div>
                <ErrorChart values={errors} N={N} />
                <small className="muted">
                  Curve: all coefficients through each order. Metrics: current enabled terms. Error
                  is against the resampled contour, not the photograph’s pixels.
                </small>
              </Section>
              <Section title="Try this">
                <p className="activity">
                  Set N = 0. Where does the endpoint sit? Then add n = +1 and n = −1. Why do they
                  turn in opposite directions?
                </p>
                <Info>
                  Contour signals are complex. Their positive and negative coefficients generally
                  are independent, unlike a real signal’s conjugate-symmetric spectrum.
                </Info>
              </Section>
            </>
          )}
        </aside>
      </div>
      {draw && (
        <div className="modal-backdrop">
          <div role="dialog" aria-modal="true" aria-label="Draw a contour" className="modal">
            <h2>Make a signal with your own hand</h2>
            <DrawPad
              image={imageUrl}
              onCancel={() => setDraw(false)}
              onUse={(p) => {
                usePath(p, 'Hand-drawn contour');
                setRaster(null);
                setCandidates([]);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
