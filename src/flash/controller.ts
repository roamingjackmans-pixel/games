// The FlashGames side of a run (D452, GAME_DESIGN §25): it hears the session (kills, cleared rooms, zones), keeps the
// score and reports it to FlashGames, and ends the run (time up, a death under Eviction Notice, The Landlord beaten).
// The run scene (src/game/scenes/run.ts) asks it whether the game may move and tells it about deaths and the credits.
import type { GameSession } from '../game/session';
import type { Entity } from '../game/world';
import { FlashScore } from './score';
import type { FlashSetup } from './setup';

/** The parts of window.FlashRun a run uses (tests pass their own). */
export interface FlashApi {
  score(n: number, detail?: string): void;
  over(n: number, detail?: string, reason?: 'won' | 'dead' | 'time'): void;
  timeLeft(): number;
}

export type FlashEnd = 'time' | 'dead' | 'won';

export class FlashController {
  readonly score = new FlashScore();
  /** waiting for FlashGames' go; running; over (time, death or win) */
  phase: 'waiting' | 'running' | 'over' = 'waiting';
  endReason: FlashEnd | null = null;
  /** the scene's part of the end: freeze and show the final score */
  onOver: ((reason: FlashEnd) => void) | null = null;
  private session: GameSession | null = null;

  constructor(
    readonly setup: FlashSetup,
    private api: FlashApi,
  ) {}

  get running(): boolean {
    return this.phase === 'running';
  }

  /** Listen to the run's session: zones reached, enemies killed, rooms won. */
  attach(s: GameSession): void {
    this.session = s;
    const l = s.listener;
    const entered = l.roomEntered;
    l.roomEntered = (node, zoneChanged) => {
      entered?.(node, zoneChanged);
      if (this.phase !== 'over') this.score.reached(s.layout.zone);
    };
    l.enemyKilled = (e) => this.killed(e);
    l.roomCleared = (node) => {
      if (this.phase !== 'over') this.score.roomCleared(s.layout.zone, node.id);
    };
  }

  private killed(e: Entity): void {
    const s = this.session;
    const en = e.en;
    if (!s || !en || this.phase === 'over') return;
    // Gary, the training dummies and The Instructor are not fights; a mimic is
    if (en.def.special && !en.def.traits?.mimic) return;
    const zone = s.layout.zone;
    if (en.bonusBoss) this.score.kill('challenger', zone, s.node.id);
    else if (en.isBoss) this.score.kill('boss', zone);
    else if (en.elite || en.def.traits?.mimic) this.score.kill('elite', zone);
    else this.score.kill('plain', zone);
  }

  /** FlashGames said go: the clock runs and so does the game. */
  go(): void {
    if (this.phase !== 'waiting') return;
    this.phase = 'running';
    this.report();
  }

  /** Every update: the score so far (FlashRun skips repeats and paces the messages). */
  frame(): void {
    if (this.phase === 'running') this.report();
  }

  private report(): void {
    this.api.score(this.score.points, this.score.detail());
  }

  /** Joe died. Under Eviction Notice that ends the run; otherwise he wakes at the bonfire, as always. */
  died(): void {
    if (this.phase !== 'running') return;
    this.score.died();
    this.report();
    if (this.setup.rules.oneLife) this.finish('dead');
  }

  /** The Landlord fell and Joe climbed out: the lease is void, with a bonus for the time left. */
  won(): void {
    if (this.phase !== 'running') return;
    this.score.won(this.api.timeLeft() / 1000);
    this.finish('won');
  }

  /** FlashGames' clock ran out (FlashRun.onEnd). */
  end(): void {
    this.finish('time');
  }

  private finish(reason: FlashEnd): void {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.endReason = reason;
    this.api.over(this.score.points, this.score.detail(), reason);
    this.onOver?.(reason);
  }
}
