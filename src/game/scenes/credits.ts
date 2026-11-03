// Credits (after The Landlord, or from the title). They open with the epilogue that follows The Landlord's
// defeat lines (src/data/story.ts), then roll.
import { app } from '../../app';
import { music } from '../../engine/audio/music';
import type { Scene } from '../../engine/scene';
import { drawText } from '../../engine/text';
import { CREDITS_EPILOGUE } from '../../data/story';
import { btn, h, layer } from '../../ui/dom';

const TITLE = 'DUNGEON JOE';

const LINES = [
  ...CREDITS_EPILOGUE,
  '',
  '',
  TITLE,
  '',
  'Joe went down the stairs to find the fuse box.',
  'The stairs kept going. So did Joe.',
  '',
  'Design · the owner',
  'Code, vector art, synthesized sound · built with Claude',
  'Engine · none (Canvas 2D, Web Audio, TypeScript)',
  'Co-op · Trystero (WebRTC)',
  '',
  'Special thanks',
  'The Caretaker, for the shovel',
  'Mother Spore, for the spores',
  'The Bloatking, for the smell',
  'Vexthorn, for the antlers',
  'Foreman Ignatius, for the overtime',
  'Saint Aurelia, for the chill',
  'Archmagister Tock, for the time',
  'The Landlord, for the rent',
  'The Instructor, for the whistle',
  'Gary, for everything else',
  '',
  'No Joes were harmed. Many Joes were hurt.',
  'All Glowen has been returned to its rightful owners.',
  'Please check your spoons.',
  '',
  'The lease has ended. The stairs go up now.',
];
const EPILOGUE_N = CREDITS_EPILOGUE.length;

export class CreditsScene implements Scene {
  readonly name = 'credits';
  private t = 0;
  private root: HTMLElement | null = null;
  constructor(
    private onDone: () => void,
    private doneLabel = 'Back to the title',
  ) {}
  enter(): void {
    this.root = layer('clear');
    this.root.style.alignItems = 'flex-end';
    this.root.style.paddingBottom = '30px';
    this.root.appendChild(h('div', null, btn(this.doneLabel, () => this.onDone(), 'primary')));
    music.play('credits', { root: 52, tempo: 60, bright: 0.6, scale: [0, 2, 4, 7, 9], wave: 'sine' });
  }
  exit(): void {
    this.root?.remove();
  }
  update(dt: number): void {
    this.t += dt;
    if (app().input.consumeLocal('pause')) this.onDone();
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0b0a0f';
    ctx.fillRect(0, 0, 1280, 720);
    // the epilogue fades in on a held screen before the roll starts
    const hold = 7;
    const scroll = Math.max(0, this.t - hold) * 40;
    const y0 = 300 - scroll;
    LINES.forEach((l, i) => {
      const y = y0 + i * 34;
      if (y < -40 || y > 760) return;
      const title = l === TITLE;
      const epi = i < EPILOGUE_N;
      const alpha = Math.max(0, Math.min(1, epi ? (this.t - i * 1.2) / 0.8 : this.t - (hold - 1.5)));
      drawText(ctx, l, 640, y, { size: title ? 48 : 20, align: 'center', weight: title ? 'bold' : 'normal', color: title ? '#e6b84a' : epi ? '#fff3b0' : '#efe6d2', alpha });
    });
  }
}
