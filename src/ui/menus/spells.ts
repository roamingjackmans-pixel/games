// Spell loadout (GAME_DESIGN §10): one 3-slot loadout per school; a spell below its requirement cannot be
// slotted (shown greyed with the number needed). Used as a tab in the inventory and the bonfire menu.
import { glyphText } from '../glyphs';
import { SPELLS } from '../../data/spells';
import type { Character } from '../../game/types';
import { btn, h } from '../dom';
import { computeDerived, toolForSchool } from '../../game/player/derived';
import { spellSkill } from '../../game/skills/use';
import { spellUtility } from '../../game/combat/formulas';

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

/**
 * The slot picked in the loadout, per character (D157). It used to live on the tab's element, but the inventory and
 * bonfire rebuild that element on every redraw, so picking slot 2 or 3 (or any Prayer slot) snapped straight back
 * to Brain slot 1.
 */
const picked = new WeakMap<Character, { school: 'brain' | 'prayer'; slot: number }>();

export function renderSpellTab(el: HTMLElement, c: Character, onChange: () => void, rerender: () => void): void {
  // first visit: the school of the first spell this character knows
  let sel = picked.get(c) ?? { school: SPELLS[c.knownSpells[0] ?? '']?.school ?? 'brain', slot: 0 };
  const status = h('div', { class: 'small bad', style: 'min-height:18px' });
  const col = (school: 'brain' | 'prayer'): HTMLElement => {
    const lo = c.spellLoadout[school];
    const box = h('div', { class: 'col', style: 'gap:6px;width:330px' }, h('h3', null, school === 'brain' ? 'Brain loadout (staff)' : 'Prayer loadout (talisman)'));
    // Spell Skill (D182): what the held staff or talisman makes of your stat; the listed numbers are at 100
    const d = computeDerived(c);
    if (toolForSchool(d, school)) {
      const sk = spellSkill(d, school);
      box.appendChild(h('div', { class: 'small', 'data-testid': `spell-skill-${school}` }, h('b', null, `Spell Skill ${sk}`), ` · spells deal and heal ×${(sk / 100).toFixed(2)}, other effects ×${spellUtility(sk / 100).toFixed(2)} (listed amounts are at 100)`));
    } else box.appendChild(h('div', { class: 'small dim-text' }, `Hold a ${school === 'brain' ? 'staff' : 'talisman'} to cast these. Its Spell Skill grows with your ${school === 'brain' ? 'Brain' : 'Prayer'} and its scaling.`));
    for (let i = 0; i < 3; i++) {
      const id = lo[i];
      const isSel = sel.school === school && sel.slot === i;
      const b = btn(`${i + 1}. ${id ? (SPELLS[id]?.name ?? id) : '— empty —'}${isSel ? '  ◀' : ''}`, () => {
        sel = { school, slot: i };
        picked.set(c, sel);
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
  // D117: which keys cast which school when a tool is in the weapon hand
  el.appendChild(
    h(
      'div',
      { class: 'dim-text small' },
      `Either hand can hold the tool. ${glyphText('spell1')} / ${glyphText('spell2')} / ${glyphText('spell3')} cast the school of the tool in your weapon hand (or your off hand's, if the weapon hand has none). A staff and a talisman together: the weapon hand's school stays on ${glyphText('spell1')} / ${glyphText('spell2')} / ${glyphText('spell3')}, and the off hand's goes on ${glyphText('skill1')} / ${glyphText('skill2')} / ${glyphText('skill3')}, where a weapon's skills would be.`,
    ),
  );
  el.appendChild(status);
  el.appendChild(h('div', { class: 'row', style: 'align-items:flex-start;gap:24px' }, col('brain'), col('prayer')));
}
