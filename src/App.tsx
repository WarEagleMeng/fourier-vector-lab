import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Orbit,
  AudioLines,
  Music2,
  Sun,
  Moon,
  Presentation,
  BookOpen,
  ArrowUpRight,
  X,
  HelpCircle,
} from 'lucide-react';
import { DrawingStudio } from './labs/DrawingStudio';
import { SignalLab } from './labs/SignalLab';
import { VectorLab } from './labs/VectorLab';
import { MusicLab } from './labs/MusicLab';
import { Info } from './components/ui';
const tabs = [
  { id: 'drawing', name: 'Drawing Studio', icon: Orbit },
  { id: 'signals', name: 'Signal Reconstruction', icon: AudioLines },
  { id: 'vectors', name: 'Signals as Vectors', icon: Activity },
  { id: 'music', name: 'Music Studio', icon: Music2 },
] as const;
function stored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage is optional */
  }
}
const glossary = [
  [
    'Signal vector',
    'A function considered as one vector in an inner-product space. Its coordinates depend on the selected basis.',
  ],
  [
    'Inner product',
    'For this lab, ⟨x,g⟩ = ∫x(t)g*(t)dt. It is linear in x and conjugate-linear in g.',
  ],
  [
    'Orthogonality',
    'Two signals are orthogonal when their inner product over the stated interval is zero.',
  ],
  [
    'Projection',
    'The approximation cg with c = ⟨x,g⟩ / ⟨g,g⟩. It minimizes the squared error energy.',
  ],
  [
    'Phasor',
    'A complex rotating vector cₙ exp(jnω₀t). Its magnitude is |cₙ| and initial angle is arg(cₙ).',
  ],
  [
    'DC coefficient',
    'The zero-frequency mean. In a contour it is the mean sampled position, which need not equal an area centroid.',
  ],
  [
    'Harmonic order',
    'Maximum absolute signed index N. The paired partial sum contains at most 2N+1 coefficients including DC.',
  ],
  [
    'DFT',
    'Projections of uniformly spaced periodic samples onto complex exponentials. The forward transform here has normalization 1/M.',
  ],
  [
    'Parseval relationship',
    'Mean squared sample magnitude equals the sum of squared magnitudes of all normalized DFT coefficients. Omitted coefficient energy equals reconstruction MSE on that same grid.',
  ],
  [
    'Gibbs phenomenon',
    'Partial Fourier sums overshoot near a discontinuity. The region narrows as N grows; the limiting peak overshoot does not vanish.',
  ],
  [
    'Amplitude and phase',
    'Magnitude gives component size. Phase gives initial angle and is undefined for a zero-magnitude coefficient.',
  ],
  [
    'Drawing parameter',
    'The contour becomes z(t)=x(t)+jy(t) by assigning normalized time to approximately uniform arc length. Changing parameterization changes coefficients even if the geometric curve stays the same.',
  ],
];
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const items = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button,a,input,select,textarea,[tabindex="0"]',
          ) || [],
        );
        if (!items.length) return;
        const first = items[0],
          last = items.at(-1)!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="modal reading-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-title">
          <h2>{title}</h2>
          <button aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('drawing'),
    [light, setLight] = useState(() => stored('fvl-theme', 'dark') === 'light'),
    [presentation, setPresentation] = useState(false),
    [intro, setIntro] = useState(() => stored('fvl-intro', 'show') !== 'done'),
    [dialog, setDialog] = useState<'guide' | 'glossary' | 'about' | null>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    save('fvl-theme', light ? 'light' : 'dark');
  }, [light]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.querySelector('[aria-modal="true"]') ||
        (e.target as HTMLElement).matches('input,textarea,select,button') ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return;
      if (e.key === '?') setDialog('guide');
      if (e.key.toLowerCase() === 'p') setPresentation((v) => !v);
      if (e.key.toLowerCase() === 't') setLight((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <div className={`app ${presentation ? 'presentation-mode' : ''}`}>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab('drawing');
          }}
        >
          <div className="brand-mark">
            <Orbit size={27} />
          </div>
          <div>
            Fourier<span>Vector Lab</span>
          </div>
        </a>
        <div className="course-label">
          EGEE 3110<span>LINEAR SYSTEMS</span>
        </div>
        <div className="header-actions">
          <button className="quiet" onClick={() => setDialog('glossary')}>
            <BookOpen size={16} />
            <span>Glossary</span>
          </button>
          <button
            className="quiet"
            onClick={() => setDialog('guide')}
            aria-label="Open guided introduction"
          >
            <HelpCircle size={17} />
            <span>Guide</span>
          </button>
          <button
            className={`quiet ${presentation ? 'active' : ''}`}
            onClick={() => setPresentation(!presentation)}
            title="Presentation mode · P"
          >
            <Presentation size={17} />
            <span>{presentation ? 'Exit presentation' : 'Present'}</span>
          </button>
          <div className="header-divider" />
          <button
            className="icon-button"
            onClick={() => setLight(!light)}
            aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
            title="Change theme · T"
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="about-button" onClick={() => setDialog('about')}>
            About <ArrowUpRight size={13} />
          </button>
        </div>
      </header>
      <nav className="lab-nav" aria-label="Laboratories">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            aria-current={tab === t.id ? 'page' : undefined}
            className={tab === t.id ? 'selected' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-number">0{i + 1}</span>
            <t.icon size={17} />
            {t.name}
          </button>
        ))}
        <span className="nav-caption">EXPLORE · PROJECT · RECONSTRUCT</span>
      </nav>
      <main>
        {intro && (
          <div className="welcome-strip">
            <span className="welcome-icon">✦</span>
            <div>
              <strong>Start with a curve. Find its components.</strong>
              <span>Choose a drawing, change the harmonic order, then inspect the spectrum.</span>
            </div>
            <button onClick={() => setDialog('guide')}>
              Take the guided tour <ArrowUpRight size={14} />
            </button>
            <button
              className="icon-button"
              aria-label="Dismiss introduction"
              onClick={() => {
                setIntro(false);
                save('fvl-intro', 'done');
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {tab === 'drawing' ? (
          <DrawingStudio light={light} presentation={presentation} />
        ) : tab === 'signals' ? (
          <SignalLab />
        ) : tab === 'vectors' ? (
          <VectorLab />
        ) : (
          <MusicLab />
        )}
      </main>
      <footer>
        <span>
          <span className="footer-orbit">◌</span> Fourier Vector Lab <i> / </i> Signals are vectors.
          Fourier reveals their coordinates.
        </span>
        <span>EGEE 3110 · Runs locally in your browser · No accounts</span>
      </footer>
      {dialog && (
        <Dialog
          title={
            dialog === 'guide'
              ? 'A short guide to the lab'
              : dialog === 'glossary'
                ? 'The language of Fourier analysis'
                : 'About Fourier Vector Lab'
          }
          onClose={() => setDialog(null)}
        >
          {dialog === 'glossary' ? (
            <dl className="glossary">
              {glossary.map(([term, definition]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
          ) : dialog === 'about' ? (
            <>
              <p>
                An interactive companion to EGEE 3110 Linear Systems, based on Dr. Yuan (Edward)
                Meng’s Lecture 31 and Lecture 32 materials.
              </p>
              <p>
                The central idea: signals are vectors in an inner-product space. Fourier analysis
                gives their coordinates along orthogonal basis functions. A rotating phasor is one
                complex sinusoidal component; the drawing interprets an entire complex signal
                geometrically.
              </p>
              <p>
                All image processing, Fourier calculations and audio synthesis run in your browser.
                No account, analytics, server upload, or paid service is required. Uploaded images
                are never embedded in shared links.
              </p>
              <Info>
                Lecture notation uses a₀ as the mean. Mathematical clarifications and source review
                are documented in REFERENCE_ANALYSIS.md and MATHEMATICAL_NOTES.md in the source
                project.
              </Info>
              <p>
                Built with React, TypeScript, Vite, Tailwind CSS and Lucide. Source and dependency
                license details are included in LICENSE and THIRD_PARTY_LICENSES.md.
              </p>
            </>
          ) : (
            <>
              <ol className="tour-steps">
                <li>
                  <strong>Pick a closed contour</strong>
                  <p>
                    Try the heart, circle, square, star or silhouette. Upload a simple high-contrast
                    image, choose a connected boundary, or trace it by hand.
                  </p>
                </li>
                <li>
                  <strong>Start with N = 0</strong>
                  <p>
                    Only the DC position remains. Increase order to add signed harmonic pairs, or
                    select individual coefficient progression under Coefficient order.
                  </p>
                </li>
                <li>
                  <strong>Watch the endpoint</strong>
                  <p>
                    Each phasor starts at the previous endpoint. Positive and negative frequencies
                    rotate in opposite directions. Space pauses, and arrow keys step time.
                  </p>
                </li>
                <li>
                  <strong>Connect time and frequency</strong>
                  <p>
                    Click spectrum lines or use the harmonic selector. Disable one coefficient and
                    compare the reconstruction and omitted energy. Explore the signal and projection
                    labs next.
                  </p>
                </li>
                <li>
                  <strong>Save an experiment</strong>
                  <p>
                    Export contour SVG/PNG, coefficients CSV, experiment JSON or a small
                    configuration link. WebM records 10 seconds in supported browsers; keep the tab
                    active.
                  </p>
                </li>
              </ol>
              <div className="shortcut-list">
                <span>
                  <kbd>Space</kbd> Play / pause drawing
                </span>
                <span>
                  <kbd>←</kbd>
                  <kbd>→</kbd> Step 1/512 period
                </span>
                <span>
                  <kbd>R</kbd> Restart drawing
                </span>
                <span>
                  <kbd>P</kbd> Presentation mode
                </span>
                <span>
                  <kbd>T</kbd> Theme
                </span>
                <span>
                  <kbd>?</kbd> This guide
                </span>
              </div>
              <p className="muted">
                Shortcuts apply when focus is outside a control. Use Tab to reach controls and Enter
                or Space to activate them.
              </p>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}
