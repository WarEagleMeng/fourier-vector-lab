import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { Range, Toggle } from './ui';
import { Spectrum } from './Charts';
import { coefficient } from '../math/fourier';
afterEach(cleanup);
it('allows a harmonic range to reach DC-only N=0 via its accessible name', () => {
  const changed = vi.fn();
  render(<Range label="Harmonic order" value={12} max={100} onChange={changed} />);
  fireEvent.change(screen.getByRole('slider', { name: 'Harmonic order' }), {
    target: { value: '0' },
  });
  expect(changed).toHaveBeenCalledWith(0);
});
it('labels the harmonic toggle and reports disabled state', () => {
  const changed = vi.fn();
  render(<Toggle label="Enable this harmonic" checked onChange={changed} />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Enable this harmonic' }));
  expect(changed).toHaveBeenCalledWith(false);
});
it('supports keyboard inspection of negative spectral indices', () => {
  const select = vi.fn();
  render(
    <Spectrum
      cs={[coefficient(-1, 1, 0), coefficient(0, 0, 0), coefficient(1, 0, 1)]}
      N={1}
      selected={0}
      onSelect={select}
    />,
  );
  fireEvent.keyDown(screen.getByRole('button', { name: 'Amplitude harmonic -1' }), {
    key: 'Enter',
  });
  expect(select).toHaveBeenCalledWith(-1);
});

it('compact real spectra use a nonnegative harmonic-index axis', () => {
  render(
    <Spectrum
      cs={[coefficient(0, 0, 0), coefficient(1, 1, 0)]}
      N={9}
      selected={1}
      onSelect={() => {}}
      signed={false}
    />,
  );
  expect(screen.queryByText('-9')).not.toBeInTheDocument();
  expect(screen.getByText('9')).toBeInTheDocument();
});
