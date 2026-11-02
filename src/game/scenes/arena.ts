// The test arena (debug menu → Test arena): an open room, a scripted training dummy that performs a
// normal, a Red and a Piercing attack, and whatever the debug menu spawns.
import '../../engine/draw/enemies';
import { drawText } from '../../engine/text';
import { Room, T } from '../room';
import { World } from '../world';
import { WorldScene } from './worldScene';
import { newCharacter } from '../player/character';
import { spawnPlayer } from '../player/player';
import { spawnEnemy } from '../enemies/spawn';
import { TRAINING_DUMMY } from '../../data/enemies/special';

import type { Character, ClassId } from '../types';
import { stream } from '../../engine/rng';
import { installRules } from '../rules';
import { dormantMimicNear, mimicBite } from '../interact';
import { ENEMIES } from '../../data/enemies';
import { zoneDef } from '../../data/zones';

export class ArenaScene extends WorldScene {
  readonly name = 'arena';

  constructor(
    private classId: ClassId = 'knight',
    private character: Character | null = null,
  ) {
    super();
    this.setup();
  }

  private setup(): void {
    const room = Room.empty();
    room.id = 'arena';
    for (const [x, y] of [
      [8, 5],
      [31, 5],
      [8, 16],
      [31, 16],
    ] as const)
      room.set(x, y, T.Pillar);
    this.w = new World('ARENA', room);
    const ch = this.character ?? newCharacter(this.classId, 'Joe', 'local-player', stream('ARENA', 'char'));
    this.local = spawnPlayer(this.w, ch, 0, true, 400, 368);
    installRules(this.w, {
      onPlayerDown: (w, e) => {
        // the arena never kills you: back to full
        e.hp!.hp = e.hp!.max;
        w.emit({ t: 'msg', text: 'You would have died. The arena is forgiving.' });
      },
      zoneFodder: () => ENEMIES.shambler ?? null,
    });
    this.w.hooks.onInteract = (w, p) => {
      const m = dormantMimicNear(w, p);
      if (m) mimicBite(w, p, m);
    };
    spawnEnemy(this.w, TRAINING_DUMMY, 800, 368, { tellS: 0.2 });
  }

  protected override spawnContext(): { zone?: number; cycle?: number; zoneResist?: Partial<Record<string, number>>; zoneImmune?: string[] } {
    const z = zoneDef(1);
    return { zone: 1, cycle: 0, zoneResist: z.resist, zoneImmune: z.statusImmune };
  }

  protected override toArena(): string {
    this.setup();
    return 'Arena reset.';
  }

  protected override renderTop(ctx: CanvasRenderingContext2D): void {
    drawText(ctx, 'TEST ARENA — the dummy swings (block or parry it), stomps (Red: dodge through) and rings (Piercing: step out)', 640, 712, {
      size: 13,
      align: 'center',
      color: '#a59c8a',
    });
  }
}
