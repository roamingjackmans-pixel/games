// The Wave Rush cycle picker (D411): ◀ Cycle n ▶. It changes in place, so the arrow you pressed stays where it is (and
// keeps the focus), and a run of clicks or presses on ▶ walks through the cycles without the menu being rebuilt.
import { btn, h } from './dom';

/** `cycles` are the 0-based cycles that may be picked, in order; `onChange` hears every new pick. */
export function cycleStepper(cycles: number[], pick: number, onChange: (cycle: number) => void): HTMLElement {
  let i = Math.max(0, cycles.indexOf(pick));
  const label = h('b', { 'data-testid': 'rush-cycle', style: 'min-width:90px;text-align:center;display:inline-block' }, '');
  const prev = btn('◀', () => step(-1), 'tiny');
  const next = btn('▶', () => step(1), 'tiny');
  prev.setAttribute('aria-label', 'Earlier cycle');
  next.setAttribute('aria-label', 'Later cycle');
  const show = (): void => {
    label.textContent = `Cycle ${cycles[i]! + 1}`;
    // dimmed at the ends but never disabled: a disabled button would drop the focus
    for (const [b, end] of [[prev, i <= 0], [next, i >= cycles.length - 1]] as const) {
      b.style.opacity = end ? '0.4' : '';
      b.setAttribute('aria-disabled', end ? 'true' : 'false');
    }
  };
  function step(d: number): void {
    const j = Math.max(0, Math.min(cycles.length - 1, i + d));
    if (j === i) return;
    i = j;
    show();
    onChange(cycles[i]!);
  }
  show();
  return h('div', { class: 'row', style: 'gap:8px;align-items:center' }, h('div', { class: 'grow' }, 'Start at'), prev, label, next);
}
