// The Bestiary tab at the bonfire (D229): every zone's enemies and boss, a chapter each (collapsible). An entry is a
// question mark until it is unlocked, then its picture and name; later its lore, then what it resists and what hurts
// it, then the two bonuses once earned. Only what is unlocked is shown, and the kills the next step needs; never what
// that step will be.
import { bestiaryProgress, bestiaryZones, type BestiaryZone } from '../data/bestiary';
import { zoneDef } from '../data/zones';
import { drawById, type DrawState } from '../engine/draw/registry';
import { affinityMult, ELEMENTS, enemyElement } from '../game/elements';
import { DAMAGE_TYPES, type BossDef, type Character, type DamageType, type EnemyDef } from '../game/types';
import { btn, h } from './dom';

/** Chapters folded shut this session (all open by default). */
const folded = new Set<number>();

const TYPE_LABEL: Record<DamageType, string> = { physical: 'Physical', magic: 'Magic', void: 'Void', fire: 'Fire', holy: 'Holy' };

/** The enemy drawn small, standing still and facing you. */
export function enemyIcon(def: EnemyDef | BossDef, zone: number, size = 48): HTMLCanvasElement {
  const c = h('canvas', { width: size * 2, height: size * 2, style: `width:${size}px;height:${size}px` });
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const r = def.radius || 20;
  const k = Math.min(1.4, (size * 0.36) / r);
  ctx.scale(2, 2);
  ctx.translate(size / 2, size * 0.58);
  ctx.scale(k, k);
  const pal = zoneDef(zone).palette.colors;
  const s: DrawState = {
    x: 0, y: 0, facing: Math.PI / 2, t: 0.4, r, flash: false, tint: null, alpha: 1, scale: 1, squash: 0,
    pose: 'idle', poseT: 0, hpFrac: 1, moving: 0, pal: def.palette ?? pal, phase: 0, variant: 0, awake: true,
    elem: enemyElement(def), atk: null,
  };
  try {
    drawById(ctx, def.draw ?? def.id, s);
  } catch {
    // a drawing that needs more of a live entity than an icon has: the plain blob instead
    drawById(ctx, '__none__', s);
  }
  return c;
}

/** What it resists and what hurts it: its own resistances with its zone's, against the element chart (as combat does). */
export function weakAndStrong(def: EnemyDef | BossDef, zone: number): { weak: DamageType[]; resists: DamageType[] } {
  const resist: Partial<Record<string, number>> = { ...(zoneDef(zone).resist ?? {}), ...def.resist };
  const body = enemyElement(def);
  const weak: DamageType[] = [];
  const resists: DamageType[] = [];
  for (const t of DAMAGE_TYPES) {
    const m = (1 - (resist[t] ?? 0)) * affinityMult(t, body);
    if (m > 1.05) weak.push(t);
    else if (m < 0.95) resists.push(t);
  }
  return { weak, resists };
}

function typeList(ts: DamageType[]): HTMLElement {
  const el = h('span', null);
  if (!ts.length) el.append(h('span', { class: 'dim-text' }, 'nothing'));
  ts.forEach((t, i) => {
    if (i) el.append(', ');
    el.append(h('span', { style: `color:${ELEMENTS[t]?.glow ?? '#efe6d2'}` }, TYPE_LABEL[t]));
  });
  return el;
}

function entry(c: Character, def: EnemyDef | BossDef, zone: number): HTMLElement {
  const p = bestiaryProgress(c, def);
  const isBoss = def.role === 'boss';
  const card = h('div', { class: 'card', 'data-testid': `bestiary-${def.id}`, style: `padding:6px 8px;display:flex;gap:10px;align-items:flex-start${isBoss ? ';border-left:3px solid #e8c25a' : ''}` });
  if (!p.icon) {
    card.append(
      h('div', { style: 'width:48px;height:48px;flex:none;display:flex;align-items:center;justify-content:center;border:2px dashed #3a3447;border-radius:8px;font-size:22px;color:#6a6274' }, '?'),
      h('div', { class: 'col', style: 'gap:2px' }, h('b', { class: 'dim-text' }, '???'), p.next !== null ? h('div', { class: 'small dim-text' }, isBoss ? 'Not seen yet.' : 'Not met yet.') : null),
    );
    return card;
  }
  const info = h('div', { class: 'col', style: 'gap:3px;min-width:0' });
  info.append(h('div', { class: 'row', style: 'gap:8px;align-items:baseline' }, h('b', null, def.name), h('span', { class: 'small dim-text' }, `${p.kills} ${p.kills === 1 ? 'kill' : 'kills'}`)));
  if (p.lore) info.append(h('div', { class: 'small', style: 'font-style:italic;color:#cfc6b4' }, def.flavor ?? ''));
  if (p.resists) {
    const ws = weakAndStrong(def, zone);
    info.append(h('div', { class: 'small' }, 'Resists ', typeList(ws.resists), h('span', { class: 'dim-text' }, ' · '), 'Weak to ', typeList(ws.weak)));
  }
  if (p.dealMore) info.append(h('div', { class: 'small good' }, 'You deal 25% more damage to it.'));
  if (p.takeLess) info.append(h('div', { class: 'small good' }, 'It deals 25% less damage to you.'));
  if (p.next !== null) info.append(h('div', { class: 'small dim-text' }, `More at ${p.next} ${p.next === 1 ? 'kill' : 'kills'}.`));
  card.append(enemyIcon(def, zone), info);
  return card;
}

function chapter(c: Character, z: BestiaryZone, rerender: () => void): HTMLElement {
  const all = [...z.enemies, ...(z.boss ? [z.boss] : [])];
  const known = all.filter((d) => bestiaryProgress(c, d).icon).length;
  const open = !folded.has(z.zone);
  const head = btn([open ? '▾ ' : '▸ ', `Zone ${z.zone} · ${z.name}`, h('span', { class: 'small dim-text' }, `  ${known} / ${all.length}`)], () => {
    if (open) folded.add(z.zone);
    else folded.delete(z.zone);
    rerender();
  }, 'tiny');
  head.setAttribute('data-testid', `bestiary-zone-${z.zone}`);
  head.setAttribute('data-focus', `bestiary-zone-${z.zone}`);
  head.style.cssText += ';text-align:left;width:100%';
  const sec = h('div', { class: 'col', style: 'gap:4px' }, head);
  if (open) {
    const grid = h('div', { style: 'display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:6px;padding-left:8px' });
    for (const d of all) grid.append(entry(c, d, z.zone));
    sec.append(grid);
  }
  return sec;
}

/** The whole book into `el`. */
export function renderBestiary(el: HTMLElement, c: Character, rerender: () => void): void {
  const book = h('div', { class: 'col', style: 'gap:8px;max-height:560px;overflow:auto;padding-right:6px', 'data-testid': 'bestiary' }, h('h3', { style: 'margin:0' }, 'Bestiary'));
  book.append(h('div', { class: 'small dim-text', style: 'max-width:760px' }, 'What you have learned about the things down here, by putting them down. Keep at it.'));
  for (const z of bestiaryZones()) book.append(chapter(c, z, rerender));
  el.appendChild(book);
}
