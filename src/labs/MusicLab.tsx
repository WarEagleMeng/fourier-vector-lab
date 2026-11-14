import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import {
  notes,
  beats,
  chordIndices,
  chordNames,
  chordMap,
  noteNames,
  beatDuration,
  duration,
  starts,
  noteSamples,
  fs,
} from '../content/music';
import { spectrum } from '../math/fft';
import { LineChart } from '../components/Charts';
import { Section, Toggle, Info, Metric } from '../components/ui';
export function MusicLab() {
  const [melody, setMelody] = useState(true),
    [chords, setChords] = useState(true),
    [playing, setPlaying] = useState(false),
    [index, setIndex] = useState(0),
    [elapsed, setElapsed] = useState(0),
    [message, setMessage] = useState('');
  const context = useRef<AudioContext | null>(null),
    sources = useRef<AudioBufferSourceNode[]>([]),
    frame = useRef(0),
    start = useRef(0),
    origin = useRef(0),
    run = useRef(0);
  const stop = () => {
    run.current++;
    cancelAnimationFrame(frame.current);
    for (const s of sources.current) {
      try {
        s.stop();
      } catch {
        /* already ended */
      }
    }
    sources.current = [];
    void context.current?.close();
    context.current = null;
    setPlaying(false);
  };
  useEffect(
    () => () => {
      run.current++;
      cancelAnimationFrame(frame.current);
      sources.current.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      void context.current?.close();
    },
    [],
  );
  const play = async () => {
    stop();
    const token = run.current;
    try {
      if (!melody && !chords) throw new Error('Enable a melody or chord voice.');
      const ctx = new AudioContext();
      context.current = ctx;
      await ctx.resume();
      if (token !== run.current) {
        void ctx.close();
        return;
      }
      const when = ctx.currentTime + 0.08;
      start.current = when;
      origin.current = starts[index];
      for (let i = index; i < notes.length; i++) {
        const data = noteSamples(i, melody, chords),
          buffer = ctx.createBuffer(1, data.length, fs);
        buffer.copyToChannel(data, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(when + starts[i] - starts[index]);
        sources.current.push(source);
      }
      setPlaying(true);
      const tick = () => {
        if (context.current !== ctx) return;
        const current = Math.max(0, ctx.currentTime - start.current + origin.current);
        setElapsed(current);
        let i = notes.length - 1;
        for (let k = 0; k < notes.length; k++)
          if (current < starts[k] + beats[k] * beatDuration) {
            i = k;
            break;
          }
        setIndex(i);
        if (current >= duration) {
          stop();
          setIndex(0);
          setElapsed(0);
          return;
        }
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch (e) {
      stop();
      setMessage((e as Error).message);
    }
  };
  const samples = useMemo(() => noteSamples(index, melody, chords), [index, melody, chords]),
    wave = Array.from(samples.slice(0, 400)),
    spec = useMemo(
      () =>
        spectrum(samples, fs)
          .filter((b) => b.frequency <= 1000)
          .map((b) => b.magnitude),
      [samples],
    );
  return (
    <>
      <div className="lab-heading">
        <div>
          <div className="eyebrow">LABORATORY 04 / FOURIER SYNTHESIS & SOUND</div>
          <h1>Fourier Music Studio</h1>
          <p>See and hear the supplied Amazing Grace melody and chord voices.</p>
        </div>
        <button
          className="quiet"
          onClick={() => {
            stop();
            setIndex(0);
            setElapsed(0);
            setMelody(true);
            setChords(true);
            setMessage('');
          }}
        >
          <Volume2 size={15} /> Reset lab
        </button>
      </div>
      <div className="secondary-lab">
        <aside className="panel">
          <Section title="Amazing Grace">
            <div className="music-art">
              ♪
              <span>
                35 notes · G major
                <br />
                {duration.toFixed(2)} seconds · 0.75 s / beat
              </span>
            </div>
            <Toggle
              label="Melody voice"
              checked={melody}
              onChange={(v) => {
                stop();
                setMelody(v);
              }}
            />
            <Toggle
              label="Chord voices"
              checked={chords}
              onChange={(v) => {
                stop();
                setChords(v);
              }}
            />
            <div className="button-row">
              <button className="primary" disabled={playing} onClick={() => void play()}>
                <Play size={16} /> Play from note {index + 1}
              </button>
              <button onClick={stop} aria-label="Stop music">
                <Square size={15} /> Stop
              </button>
            </div>
            <p role="status">{message}</p>
            <Info>
              Audio starts only after you press Play. Each note uses the original melody pitch,
              chord voicing and beat duration, with 10 ms endpoint ramps and fixed headroom.
            </Info>
          </Section>
          <Section title="Notes & chords">
            <p>
              Harmonics of one tone occur at integer multiples of its fundamental. Different musical
              notes in a chord generally do not form exact integer harmonics of one fundamental.
            </p>
            <p>
              * The MATLAB label “D7” maps to D4, F♯4, A4: a D-major triad without a seventh. This
              studio preserves those pitches and flags the original label.
            </p>
          </Section>
        </aside>
        <div className="lab-main">
          <div className="panel graph-panel">
            <div className="graph-title">
              <h2>
                Current note{' '}
                <span className="accent">
                  {index + 1} / {notes.length}
                </span>
              </h2>
              <span className="mono">
                {elapsed.toFixed(2)} / {duration.toFixed(2)} s
              </span>
            </div>
            <div className="metrics-inline">
              <Metric label="Melody" value={noteNames[String(notes[index])]} />
              <Metric label="Frequency" value={notes[index].toFixed(3)} unit=" Hz" />
              <Metric label="Chord" value={chordNames[chordIndices[index]]} />
              <Metric label="Duration" value={(beats[index] * beatDuration).toFixed(3)} unit=" s" />
            </div>
            <h3>Time domain · first 0.05 seconds</h3>
            <LineChart
              series={[{ name: 'Audio samples', values: wave, color: '#6de5ad' }]}
              labels={['0', '0.05 s']}
            />
          </div>
          <div className="panel graph-panel">
            <h2>Frequency domain · normalized magnitude</h2>
            <LineChart
              series={[{ name: 'FFT magnitude', values: spec, color: '#b29aef' }]}
              labels={['0', '1000 Hz']}
              nonNegative
              yLabel="Normalized magnitude"
            />
            <p className="muted">
              2,048-sample Hann-windowed FFT at 8,000 Hz. Exact bins kfₛ/M. Current chord pitches:{' '}
              {chordMap[chordIndices[index]].map((f) => f.toFixed(3)).join(', ')} Hz. Spectral
              leakage broadens finite-note peaks.
            </p>
          </div>
          <div className="panel graph-panel">
            <h2>The score</h2>
            <p className="muted">
              Choose a note to preview it and begin playback there. Changing voices stops the
              current schedule.
            </p>
            <div className="score">
              {notes.map((n, i) => (
                <button
                  key={i}
                  aria-label={`Music note ${i + 1}`}
                  className={index === i ? 'selected' : ''}
                  onClick={() => {
                    stop();
                    setIndex(i);
                    setElapsed(starts[i]);
                  }}
                >
                  <small>{i + 1}</small>
                  <strong>{noteNames[String(n)]}</strong>
                  <span>{beats[i]} beats</span>
                  <span>{chordNames[chordIndices[i]]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
