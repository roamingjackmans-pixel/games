// Spell loadout (GAME_DESIGN §10): one 3-slot loadout per school; a spell below its requirement cannot be
// slotted (shown greyed with the number needed). Used as a tab in the inventory and the bonfire menu.
import { glyphText } from '../glyphs';
import { SPELLS } from '../../data/spells';
import type { Character } from '../../game/types';
import { btn, h } from '../dom';

export function setLoadout(c: Character, school: 'brain' | 'prayer', slot: number, spellId: string | null): string {
  if (spellId) {
    const sp = SPELLS[spellId];
    if (!sp || sp.school !== school) return 'Wrong school for that slot.';
    if (!c.knownSpells.includes(spellId)) return 'You do not know that spell.';
    const stat = school === 'brain' ? c.stats.brain : c.stats.prayer;
    if (stat < sp.req) return `${sp.name} needs ${school === 'brain' ? 'Brain' : 'Prayer'} ${sp.req}.`;
    const lo = c.spellLoadout[school];
    const dup = lo.indexOf(spellId);
    if (dup >= 0) lo[dup] = null;
  }
  c.spellLoadout[school][slot] = spellId;
  return '';
}

export function renderSpellTab(el: HTMLElement, c: Character, onChange: () => void, rerender: () => void): void {
  let sel: { school: 'brain' | 'prayer'; slot: number } = (el as HTMLElement & { _sel?: { school: 'brain' | 'prayer'; slot: number } })._sel ?? { school: 'brain', slot: 0 };
  const status = h('div', { class: 'small bad', style: 'min-height:18px' });
  const col = (school: 'brain' | 'prayer'): HTMLElement => {
    const lo = c.spellLoadout[school];
    const box = h('div', { class: 'col', style: 'gap:6px;width:330px' }, h('h3', null, school === 'brain' ? 'Brain loadout (staff)' : 'Prayer loadout (talisman)'));
    for (let i = 0; i < 3; i++) {
      const id = lo[i];
      const isSel = sel.school === school && sel.slot === i;
      const b = btn(`${i + 1}. ${id ? (SPELLS[id]?.name ?? id) : '— empty —'}${isSel ? '  ◀' : ''}`, () => {
        sel = { school, slot: i };
        (el as HTMLElement & { _sel?: unknown })._sel = sel;
        rerender();
      });
      if (isSel) b.classList.add('primary');
      box.appendChild(h('div', { class: 'row' }, b, id ? btn('×', () => {
        setLoadout(c, school, i, null);
        onChange();
        rerender();
      }, 'tiny') : null));
    }
    const known = c.knownSpells.filter((id) => SPELLS[id]?.school === school);
    box.appendChild(h('div', { class: 'small dim-text' }, known.length ? 'Known spells — click to put in the selected slot:' : 'No spells of this school known yet. Find spell reliquaries.'));
    for (const id of known) {
      const sp = SPELLS[id]!;
      const stat = school === 'brain' ? c.stats.brain : c.stats.prayer;
      const ok = stat >= sp.req;
      const b = btn(
        h('div', null, h('div', { class: ok ? '' : 'dim-text' }, `${sp.name}  ${ok ? '' : `(needs ${sp.req})`}`), h('div', { class: 'small dim-text' }, `req ${sp.req} · cast ${sp.castS}s · cd ${sp.cooldownS}s · stam ${sp.stamina} — ${sp.description}`)),
        () => {
          if (sel.school !== school) {
            status.textContent = 'Select a slot in this column first.';
            return;
          }
          const m = setLoadout(c, school, sel.slot, id);
          status.textContent = m;
          onChange();
          if (!m) rerender();
        },
        '',
        !ok,
      );
      b.style.width = '100%';
      box.appendChild(b);
    }
    return box;
  };
  el.appendChild(h('div', { class: 'dim-text small' }, `A staff casts Brain spells, a talisman casts Prayer spells (3 slots each: ${glyphText('spell1')} / ${glyphText('spell2')} / ${glyphText('spell3')}). Each school keeps its own loadout.`));
  el.appendChild(status);
  el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:24px' }, col('brain'), col('prayer')));
}
