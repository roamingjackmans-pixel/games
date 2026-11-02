// Web Audio mixer: master / sfx / music gains, unlocked on the first user input (autoplay rule).
export class Mixer {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  music: GainNode | null = null;
  private vol = { master: 0.8, sfx: 0.9, music: 0.6 };
  private duck = 1;
  private onUnlock: (() => void)[] = [];

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** Create/resume the context. Safe to call repeatedly (from every input handler). */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor: typeof AudioContext | undefined =
          typeof AudioContext !== 'undefined'
            ? AudioContext
            : (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.master = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.music = this.ctx.createGain();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.ratio.value = 4;
        this.sfx.connect(this.master);
        this.music.connect(this.master);
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.apply();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().then(() => this.fireUnlock());
      } else this.fireUnlock();
    } catch {
      // audio unavailable: the game runs silent
    }
  }

  private fireUnlock(): void {
    const l = this.onUnlock;
    this.onUnlock = [];
    for (const f of l) f();
  }

  whenUnlocked(f: () => void): void {
    if (this.unlocked) f();
    else this.onUnlock.push(f);
  }

  setVolumes(master: number, sfx: number, music: number): void {
    this.vol = { master, sfx, music };
    this.apply();
  }

  /** Duck the music (death screen). 1 = normal. */
  setDuck(k: number): void {
    this.duck = k;
    this.apply();
  }

  private apply(): void {
    if (!this.ctx || !this.master || !this.sfx || !this.music) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.master, t, 0.02);
    this.sfx.gain.setTargetAtTime(this.vol.sfx, t, 0.02);
    this.music.gain.setTargetAtTime(this.vol.music * this.duck * 0.5, t, 0.3);
  }
}

export const mixer = new Mixer();
