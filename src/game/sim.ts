// The fixed-step simulation (DATA_MODEL §4 system order):
// input → movement → statuses → AI → attacks/telegraphs → projectiles → hits/damage → hazards → room/wave logic.
import { updatePlayer } from './player/player';
import { updateEnemy } from './enemies/ai';
import { updateMovement } from './systems/movement';
import { updateStatuses } from './systems/statuses';
import { updateTelegraphs } from './systems/telegraphs';
import { updateProjectiles } from './systems/projectiles';
import { updateHazards } from './systems/hazards';
import { updateTerrain } from './systems/terrain';
import './wire';
import type { World } from './world';

export const SIM_DT = 1 / 60;

export function stepWorld(w: World, dt = SIM_DT): void {
  if (w.paused) return;
  for (const e of w.entities.values()) {
    e.px = e.x;
    e.py = e.y;
  }
  w.tick++;
  w.time += dt;
  for (const p of w.players) if (!p.removed) updatePlayer(w, p, dt);
  updateMovement(w, dt);
  updateStatuses(w, dt);
  for (const e of w.enemies) if (!e.removed) updateEnemy(w, e, dt);
  updateTelegraphs(w, dt);
  updateProjectiles(w, dt);
  updateHazards(w, dt);
  updateTerrain(w);
  if (w.scheduled.length) {
    const due = w.scheduled.filter((x) => x.at <= w.time);
    if (due.length) {
      w.scheduled = w.scheduled.filter((x) => x.at > w.time);
      for (const d of due) d.run();
    }
  }
  w.hooks.onTick?.(w, dt);
  // corpses of dead enemies are removed (the death event already fired)
  for (const e of w.enemies) if (e.hp?.dead && !e.removed) w.remove(e);
  for (const e of w.entities.values()) {
    if (e.type === 'decoy' && e.dc && e.dc.until <= w.time) w.remove(e);
    if (e.type === 'wall' && e.wl && e.wl.until <= w.time) w.remove(e);
    if (e.type === 'pickup' && e.pk && e.pk.until > 0 && e.pk.until <= w.time) w.remove(e);
  }
  w.sweep();
}
