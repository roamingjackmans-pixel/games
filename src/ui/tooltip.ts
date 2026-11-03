// Item tooltips (GAME_DESIGN §16) with compare deltas, and small item icons drawn on canvases.
import { WEAPONS } from '../data/weapons';
import { SHIELDS, shieldValues } from '../data/shields';
import { CASTING_TOOLS } from '../data/castingTools';
import { RINGS } from '../data/rings';
import { SKILLS } from '../data/skills';
import { GEMS, gemName, gemText } from '../data/gems';
import { LEGENDARY_POWERS, LEGENDARY_FLAVOR } from '../data/legendaries';
import { affixText } from '../data/affixes';
import { armorPieceDefense, parseArmorBase } from '../data/armor';
import { baseInfo, itemRequirements, meetsRequirements } from '../game/items/bases';
import { itemSellValue } from '../game/items/inventory';
import { poiseForSize, scalingMult, skillsUnlocked, tierName, toolMult, weaponBase } from '../game/combat/formulas';

/** What one hit of this poise damage staggers out of an attack (D78), by body size. */
function staggerReach(p: number): string {
  if (p >= poiseForSize(33)) return 'one hit staggers even brutes';
  if (p >= poiseForSize(26)) return 'one hit staggers knights and smaller';
  if (p >= poiseForSize(17)) return 'one hit staggers most small foes';
  if (p >= poiseForSize(9)) return 'one hit staggers only swarms and the smallest';
  return 'too light to stagger';
}
import { drawShield, drawTool, drawWeapon } from '../engine/draw/weapons';
import { OUTLINE, blob, poly } from '../engine/draw/parts';
import { DAMAGE_TYPES, type Character, type Gem, type Item, type Stats } from '../game/types';
import { h } from './dom';

export const RARITY_LABEL: Record<string, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
const KIND_LABEL: Record<string, string> = { weapon: 'Weapon', shield: 'Shield', staff: 'Staff (Brain)', talisman: 'Talisman (Prayer)', armor: 'Armor', ring: 'Ring' };

function hashStr(s: string): number {
  let h0 = 0;
  for (let i = 0; i < s.length; i++) h0 = (h0 * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h0);
}

/** One number to compare two items of the same slot (damage, defense, block, tool power). */
export function itemScore(item: Item | null, stats: Stats, twoHanded: boolean): number {
  if (!item) return 0;
  const w = WEAPONS[item.baseId];
  if (w) return weaponBase(w.base1, item.ilvl) * scalingMult(w.grades, stats, twoHanded) * (meetsRequirements(itemRequirements(item), stats, twoHanded) ? 1 : 0.4);
  const s = SHIELDS[item.baseId];
  if (s) {
    const v = shieldValues(s, item.ilvl);
    return v.physical * 100 + v.elemental * 50;
  }
  const t = CASTING_TOOLS[item.baseId];
  if (t) return toolMult(t.grade, item.ilvl) * 100;
  if (item.kind === 'armor') {
    const d = armorPieceDefense(item.baseId, item.ilvl);
    return DAMAGE_TYPES.reduce((a, k) => a + d[k], 0);
  }
  return 0;
}

export function itemTooltip(item: Item, c: Character, compare: Item | null = null): HTMLElement {
  const info = baseInfo(item.baseId);
  const lines: (HTMLElement | string)[] = [];
  const twoH = c.twoHanded;
  const req = itemRequirements(item);
  const meets = meetsRequirements(req, c.stats, item.kind === 'weapon' ? twoH : false);
  lines.push(h('div', { class: `name r-${item.rarity}` }, item.name));
  lines.push(h('div', { class: 'dim-text small' }, `${RARITY_LABEL[item.rarity]} ${KIND_LABEL[item.kind] ?? item.kind}${item.kind === 'armor' ? ` (${item.slot})` : ''} · item level ${item.ilvl}`));
  const w = WEAPONS[item.baseId];
  if (w) {
    const n = Math.min(3, skillsUnlocked(item.ilvl, item.rarity === 'legendary') + (item.bonusSkills ?? 0));
    lines.push(h('div', null, `${tierName(item.ilvl)} · ${w.name} · ${w.speedClass.replace('very', 'very ')}`));
    const dmg = weaponBase(w.base1, item.ilvl) * scalingMult(w.grades, c.stats, twoH) * (meets ? 1 : 0.4);
    lines.push(h('div', null, `Damage ${Math.round(dmg)}${w.holyPct ? ` (${Math.round(w.holyPct * 100)}% Holy)` : ''} · Scaling Bonk ${w.grades.bonk} / Slicey ${w.grades.slicey}`));
    lines.push(h('div', { class: 'small' }, `Poise damage ${w.poiseDmg} · ${staggerReach(w.poiseDmg)}`));
    lines.push(h('div', { class: 'small' }, ...w.skills.map((sid, i) => h('span', { class: i < n ? '' : 'dim-text', style: i < n ? '' : 'text-decoration:line-through' }, `${['Q', 'E', 'R'][i]} ${SKILLS[sid]?.name ?? sid}${i < 2 ? ' · ' : ''}`))));
  }
  const s = SHIELDS[item.baseId];
  if (s) {
    const v = shieldValues(s, item.ilvl);
    lines.push(h('div', null, `Block ${Math.round(v.physical * 100)}% physical · ${Math.round(v.elemental * 100)}% elemental · stability ${s.stability}`));
    lines.push(h('div', { class: 'small' }, s.parryS ? `Parry window ${s.parryS.toFixed(2)} s` : 'Cannot parry'));
  }
  const t = CASTING_TOOLS[item.baseId];
  if (t) lines.push(h('div', null, `${t.school === 'brain' ? 'Brain' : 'Prayer'} spells · grade ${t.gradeLetter} · power ×${toolMult(t.grade, item.ilvl).toFixed(2)} · cast speed ×${t.castSpeed}`));
  if (item.kind === 'armor') {
    const d = armorPieceDefense(item.baseId, item.ilvl);
    const p = parseArmorBase(item.baseId);
    lines.push(h('div', null, `${p?.set ? `${p.set.weight[0]!.toUpperCase()}${p.set.weight.slice(1)} · ` : ''}Defense ${DAMAGE_TYPES.map((k) => `${k.slice(0, 4)} ${Math.round(d[k])}`).join(' · ')}`));
  }
  const r = RINGS[item.baseId];
  if (r) lines.push(h('div', null, r.effect));
  const reqParts: HTMLElement[] = [];
  const stats = c.stats;
  const k = item.kind === 'weapon' && twoH ? 1.5 : 1;
  for (const key of ['bonk', 'slicey', 'brain', 'prayer'] as const) {
    if (!req[key]) continue;
    const okStat = (key === 'bonk' || key === 'slicey' ? stats[key] * k : stats[key]) >= req[key];
    reqParts.push(h('span', { class: okStat ? '' : 'req-bad' }, `${key[0]!.toUpperCase()}${key.slice(1)} ${req[key]}  `));
  }
  if (reqParts.length) lines.push(h('div', { class: 'small' }, 'Requires ', ...reqParts));
  if (!meets) {
    const pen = item.kind === 'weapon' ? 'Below requirement: 40% damage, skills locked.' : item.kind === 'shield' ? 'Below requirement: half block, no parry.' : 'Below requirement: cannot cast.';
    lines.push(h('div', { class: 'small req-bad' }, pen));
  }
  if (item.affixes.length) {
    lines.push(h('hr'));
    for (const a of item.affixes) lines.push(h('div', { class: 'good' }, affixText(a.id, a.value)));
  }
  if (item.sockets.length) {
    lines.push(h('hr'));
    item.sockets.forEach((g, i) => lines.push(h('div', { class: 'small' }, g ? `◆ ${gemName(g.family, g.tier)}: ${gemText(g.family, g.tier)}` : `◇ Empty socket ${i + 1}${item.kind === 'armor' ? ' (Bulwark)' : ''}`)));
  }
  if (item.legendaryPower) {
    const lp = LEGENDARY_POWERS[item.legendaryPower];
    if (lp) lines.push(h('div', { class: 'r-legendary', style: 'margin-top:4px' }, `${lp.name}: ${lp.text}`));
  }
  if (compare && compare.id !== item.id) {
    const a = itemScore(item, stats, twoH);
    const b = itemScore(compare, stats, twoH);
    if (a || b) {
      const d = a - b;
      lines.push(h('div', { class: d >= 0 ? 'good small' : 'bad small' }, `${d >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(d))} vs equipped ${compare.name}`));
    }
  }
  lines.push(h('div', { class: 'small dim-text' }, `Sells for ${itemSellValue(item)} Glowen`));
  const flavor = item.rarity === 'legendary' ? LEGENDARY_FLAVOR[hashStr(item.name) % LEGENDARY_FLAVOR.length]! : (info?.flavor ?? '');
  if (flavor) lines.push(h('div', { class: 'flavor' }, flavor));
  return h('div', { class: 'tooltip' }, ...lines);
}

export function gemTooltip(g: Gem): HTMLElement {
  return h('div', { class: 'tooltip' }, h('div', { class: 'name', style: `color:${GEMS[g.family].color}` }, gemName(g.family, g.tier)), h('div', null, gemText(g.family, g.tier)), h('div', { class: 'small dim-text' }, GEMS[g.family].armorOnly ? 'Armor sockets only.' : 'Weapon sockets.'));
}

/** Draw a small icon for an item into a canvas. */
export function itemIcon(item: Item | null, size = 40): HTMLCanvasElement {
  const c = h('canvas', { width: size, height: size });
  if (!item) return c;
  const ctx = c.getContext('2d')!;
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const s = size / 44;
  ctx.scale(s, s);
  const w = WEAPONS[item.baseId];
  if (w) {
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-28, 0);
    ctx.scale(0.62, 0.62);
    drawWeapon(ctx, w.draw, 0);
  } else if (SHIELDS[item.baseId]) {
    ctx.scale(0.9, 0.9);
    drawShield(ctx, SHIELDS[item.baseId]!.draw);
  } else if (CASTING_TOOLS[item.baseId]) {
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-18, 0);
    ctx.scale(0.7, 0.7);
    drawTool(ctx, CASTING_TOOLS[item.baseId]!.draw, 0);
  } else if (item.kind === 'ring') {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 2, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();
    poly(ctx, [0, -14, 5, -8, 0, -4, -5, -8], '#9ad0ff', OUTLINE, 1.5);
  } else {
    const p = parseArmorBase(item.baseId);
    const col = p?.set?.look.color ?? '#8a6a3a';
    if (item.slot === 'head') blob(ctx, 0, 0, 13, 11, { fill: col });
    else if (item.slot === 'body') poly(ctx, [-14, -12, 14, -12, 12, 14, -12, 14], col);
    else {
      poly(ctx, [-12, -12, 12, -12, 12, -2, 4, 14, -4, 14, -12, -2], col);
      ctx.strokeStyle = OUTLINE;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 14);
      ctx.stroke();
    }
  }
  ctx.restore();
  return c;
}

export function gemIcon(g: Gem, size = 28): HTMLCanvasElement {
  const c = h('canvas', { width: size, height: size });
  const ctx = c.getContext('2d')!;
  const m = size / 2;
  poly(ctx, [m, 3, size - 4, m, m, size - 3, 4, m], GEMS[g.family].color, OUTLINE, 2);
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.round(size * 0.35)}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(g.tier), m, m + size * 0.13);
  return c;
}
