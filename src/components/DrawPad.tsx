import { useEffect, useRef, useState } from 'react';
import type { Complex } from '../math/fourier';
export function DrawPad({
  onUse,
  image,
  onCancel,
}: {
  onUse: (p: Complex[]) => void;
  image?: string;
  onCancel: () => void;
}) {
  const cancel = useRef(onCancel);
  cancel.current = onCancel;
  const ref = useRef<HTMLCanvasElement>(null),
    points = useRef<Complex[]>([]),
    drawing = useRef(false);
  const [count, setCount] = useState(0);
  const paint = () => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#53b98a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.current.forEach((p, i) => {
      const x = (p.re / 3 + 0.5) * c.width,
        y = (0.5 - p.im / 1.8) * c.height;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  };
  useEffect(() => {
    paint();
    const previous = document.activeElement as HTMLElement | null,
      modal = ref.current?.closest('[role="dialog"]');
    modal?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel.current();
      }
      if (e.key === 'Tab') {
        const buttons = Array.from(
          modal?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [],
        );
        if (e.shiftKey && document.activeElement === buttons[0]) {
          e.preventDefault();
          buttons.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) {
          e.preventDefault();
          buttons[0]?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="draw-pad">
      <p>
        {image
          ? 'Trace one closed outline over the image.'
          : 'Draw one continuous outline. We will close the last point to the first.'}
      </p>
      <div
        className="draw-surface"
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        <canvas
          ref={ref}
          width={600}
          height={360}
          aria-label="Freehand contour drawing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            points.current = [];
            drawing.current = true;
            const b = e.currentTarget.getBoundingClientRect();
            points.current.push({
              re: ((e.clientX - b.left) / b.width) * 3 - 1.5,
              im: 0.9 - ((e.clientY - b.top) / b.height) * 1.8,
            });
            setCount(1);
            paint();
          }}
          onPointerMove={(e) => {
            if (!drawing.current || points.current.length >= 4096) return;
            const b = e.currentTarget.getBoundingClientRect();
            points.current.push({
              re: ((e.clientX - b.left) / b.width) * 3 - 1.5,
              im: 0.9 - ((e.clientY - b.top) / b.height) * 1.8,
            });
            setCount(points.current.length);
            paint();
          }}
          onPointerUp={() => {
            drawing.current = false;
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        />
      </div>
      <div className="button-row">
        <button onClick={onCancel}>Cancel</button>
        <button className="primary" disabled={count < 4} onClick={() => onUse(points.current)}>
          Use closed path ({count} points)
        </button>
      </div>
    </div>
  );
}
