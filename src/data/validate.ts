// Data validation (CONTENT_ENEMIES §13, CONTENT_SPELLS_CLASSES §4, D38): run at startup in dev and by tests.
import { ENEMIES } from './enemies';
import { ZONES } from './zones';
import { checkEscapable } from '../game/combat/patterns';
import { CONTROL_IDS, STATUS_IDS, type AttackDef, type EffectDef, type EnemyDef, type PatternDef } from '../game/types';
import { hasKind } from '../game/procgen/mix';

export interface ValidationIssue {
  where: string;
  msg: string;
}

function walkEffects(effects: EffectDef[] | undefined, f: (e: EffectDef) => void): void {
  for (const e of effects ?? []) {
    f(e);
    if (e.op === 'dash') walkEffects([e.hitOnEntry, e.hitOnExit, e.hitOnLand].filter(Boolean) as EffectDef[], f);
    if (e.op === 'zone' || e.op === 'channel') walkEffects(e.tick, f);
    if (e.op === 'chain') walkEffects([e.hit], f);
    if (e.op === 'sequence') walkEffects(e.steps.map((s) => s.effect), f);
    if (e.op === 'repeat') walkEffects([e.effect], f);
    if (e.op === 'charge') walkEffects([e.release], f);
    if (e.op === 'onKill' || e.op === 'onHit' || e.op === 'onBlock' || e.op === 'onParry' || e.op === 'onDodge' || e.op === 'everyNthHit') walkEffects(e.then, f);
  }
}

export function validateAttack(where: string, a: AttackDef, issues: ValidationIssue[]): void {
  if (a.status && !STATUS_IDS.includes(a.status.id)) issues.push({ where, msg: `unknown status ${a.status.id}` });
  if (a.control && !CONTROL_IDS.includes(a.control.id)) issues.push({ where, msg: `unknown control ${a.control.id}` });
  if (a.kind === 'pierce' && a.pattern) {
    const r = checkEscapable(a.pattern, a.windupMs / 1000, a.condition ? { condition: a.condition } : {});
    if (!r.ok) issues.push({ where, msg: `Piercing attack not escapable (${r.reason}: needs ${r.needed.toFixed(0)}, has ${r.available.toFixed(0)})` });
    if (a.windupMs < 800 && !(a.pattern.kind === 'circle' && a.pattern.r <= 80) && a.pattern.kind !== 'sequence') {
      // GAME_DESIGN §5.6: the hit area is drawn at least 0.8 s before the hit (small 0.6 s targeted strikes excepted)
      if (a.windupMs < 600) issues.push({ where, msg: `Piercing telegraph ${a.windupMs} ms < 600 ms` });
    }
    const rings: PatternDef[] = [];
    const collect = (p: PatternDef): void => {
      if (p.kind === 'expandingRing') rings.push(p);
      if (p.kind === 'sequence') p.steps.forEach((s) => collect(s.pattern));
    };
    collect(a.pattern);
    for (const ring of rings) if (ring.kind === 'expandingRing' && ring.gaps < 1 && !ring.gapBehind) issues.push({ where, msg: 'Piercing expanding ring without a gap' });
  }
  if (a.kind === 'red' && a.area && a.pattern && (a.pattern.kind === 'pockets' || a.pattern.kind === 'ring') && a.windupMs < 1000) {
    issues.push({ where, msg: 'room-wide Red burst needs a telegraph ≥ 1.0 s' });
  }
  walkEffects(a.effects, (e) => {
    if (e.op === 'resource' && (e.flask ?? 0) > 0) issues.push({ where, msg: 'effect restores Thermos charges (forbidden, D38)' });
    if (e.op === 'damage' && e.status && !STATUS_IDS.includes(e.status.id)) issues.push({ where, msg: `unknown status ${e.status.id}` });
    if (e.op === 'summon' && !ENEMIES[e.enemyId]) issues.push({ where, msg: `summons unknown enemy ${e.enemyId}` });
  });
}

export function validateEnemy(d: EnemyDef, issues: ValidationIssue[]): void {
  const where = `enemy ${d.id}`;
  const normals = d.attacks.filter((a) => a.kind === 'normal');
  const specials = d.attacks.filter((a) => a.kind !== 'normal');
  if (normals.length !== 1) issues.push({ where, msg: `has ${normals.length} normal attacks (needs exactly 1)` });
  if (specials.length < 1 || specials.length > 2) issues.push({ where, msg: `has ${specials.length} specials (needs 1–2)` });
  if (!specials.some((a) => a.kind === 'red' || a.kind === 'pierce')) issues.push({ where, msg: 'no Red or Piercing special' });
  const ids = new Set<string>();
  for (const a of d.attacks) {
    if (ids.has(a.id)) issues.push({ where, msg: `duplicate attack id ${a.id}` });
    ids.add(a.id);
    validateAttack(`${where}/${a.id}`, a, issues);
  }
  for (const s of d.statusImmune ?? []) if (![...STATUS_IDS, ...CONTROL_IDS].includes(s as never)) issues.push({ where, msg: `unknown immunity ${s}` });
  if (!d.draw) issues.push({ where, msg: 'no draw id' });
  if (!d.flavor) issues.push({ where, msg: 'no flavor line' });
}

export interface ValidateOpts {
  /** require the full 8-enemy rosters (false while content is still being added) */
  requireAllZones?: boolean;
}

export function validateData(o: ValidateOpts = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const d of Object.values(ENEMIES)) {
    if (d.special) {
      for (const a of d.attacks) validateAttack(`enemy ${d.id}/${a.id}`, a, issues);
      continue;
    }
    validateEnemy(d, issues);
  }
  for (const z of ZONES) {
    const roster = z.enemies.map((id) => ENEMIES[id]).filter((x): x is EnemyDef => !!x);
    if (roster.length === 0 && !o.requireAllZones) continue;
    if (roster.length !== 8) issues.push({ where: `zone ${z.id}`, msg: `roster has ${roster.length}/8 enemies registered` });
    for (const d of roster) if (d.zone !== z.id) issues.push({ where: `zone ${z.id}`, msg: `${d.id} says zone ${d.zone}` });
    const reds = roster.filter((d) => hasKind(d, 'red')).length;
    const pierces = roster.filter((d) => hasKind(d, 'pierce')).length;
    if (reds < 2) issues.push({ where: `zone ${z.id}`, msg: `only ${reds} Red users (needs ≥ 2)` });
    if (pierces < 2) issues.push({ where: `zone ${z.id}`, msg: `only ${pierces} Piercing users (needs ≥ 2)` });
    for (const s of z.statusImmune) if (![...STATUS_IDS, ...CONTROL_IDS].includes(s as never)) issues.push({ where: `zone ${z.id}`, msg: `unknown immunity ${s}` });
  }
  return issues;
}
