// Title screen (GAME_DESIGN §16): continue, 10 save slots (cards, delete with confirm, export / import),
// character creation (name, class, optional seed, vector preview, blurb), settings, credits.
import { app } from '../../app';
import { music } from '../../engine/audio/music';
import { playSfx } from '../../engine/audio/sfx';
import type { Scene } from '../../engine/scene';
import { drawText } from '../../engine/text';
import { glow } from '../../engine/draw/parts';
import { drawJoe } from '../../engine/draw/players';
import { drawShield, drawTool, drawWeapon, isPairedWeapon } from '../../engine/draw/weapons';
import { getStore } from '../../engine/settings';
import { randomSeedString, Rng } from '../../engine/rng';
import { CLASSES, CLASS_IDS } from '../../data/classes';
import { WEAPONS } from '../../data/weapons';
import { SHIELDS } from '../../data/shields';
import { CASTING_TOOLS } from '../../data/castingTools';
import { ZONES } from '../../data/zones';
import { lookFor } from '../../render/entities';
import { btn, clearEl, focusFirst, h, layer, toast } from '../../ui/dom';
import { openSettings } from '../../ui/menus/settings';
import { newCharacter } from '../player/character';
import { newSave, SLOT_COUNT } from '../save/schema';
import { exportFileName, exportText, parseImport } from '../save/exportImport';
import { deleteSave, listSaves, readMeta, writeSave } from '../save/storage';
import type { ClassId, SaveFile } from '../types';

export type StartMode = 'solo' | 'host' | 'join';

/** Scene factory hooks so the title does not import the run/lobby scenes directly (no cycles). */
export const titleHooks: { start?: (save: SaveFile, mode: StartMode) => void; credits?: () => void } = {};

function fmtTime(sec: number): string {
  const h0 = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h0 ? `${h0}h ${m}m` : `${m}m`;
}

export function exportSave(save: SaveFile): void {
  const blob = new Blob([exportText(save)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: exportFileName(save) });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export class TitleScene implements Scene {
  readonly name = 'title';
  private root: HTMLElement | null = null;
  private t = 0;
  private preview: { classId: ClassId; canvas: HTMLCanvasElement } | null = null;

  enter(): void {
    this.root = layer('clear');
    this.root.setAttribute('data-testid', 'title');
    this.root.style.alignItems = 'center';
    this.root.style.justifyContent = 'flex-end';
    this.root.style.paddingRight = '90px';
    this.main();
    music.play('title', { root: 45, tempo: 50, bright: 0.3, scale: [0, 3, 5, 7, 10], wave: 'triangle' });
  }

  exit(): void {
    this.root?.remove();
    this.root = null;
  }

  update(dt: number): void {
    this.t += dt;
    const a = app();
    if (a.input.consumeLocal('pause') && this.root && !this.root.querySelector('[data-view=main]')) this.main();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const t = this.t;
    ctx.fillStyle = '#0d0b12';
    ctx.fillRect(0, 0, 1280, 720);
    // an endless staircase going down
    for (let i = 0; i < 14; i++) {
      const k = (i + (t * 0.4) % 1) / 14;
      const y = 120 + k * 640;
      const w = 220 + k * 520;
      ctx.fillStyle = `rgba(${40 + k * 40},${36 + k * 30},${50 + k * 30},1)`;
      ctx.fillRect(420 - w / 2, y, w, 26 + k * 20);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(420 - w / 2, y + 22 + k * 18, w, 6);
    }
    glow(ctx, 420, 140, 160, '#e6b84a', 0.15);
    drawJoe(ctx, lookFor(newCharacter('nobody', 'Joe', 't')), { x: 420, y: 470 + Math.sin(t * 2) * 4, facing: Math.PI / 2, t, moving: 0.6, scale: 2.2 });
    drawText(ctx, 'DUNGEON JOE', 420, 92, { size: 64, weight: 'bold', align: 'center', color: '#efe6d2', outline: '#000', outlineWidth: 8 });
    drawText(ctx, 'Joe went down the stairs to find the fuse box. The stairs kept going.', 420, 124, { size: 15, align: 'center', color: '#a59c8a' });
    drawText(ctx, `v${__GAME_VERSION__}`, 1270, 712, { size: 11, align: 'right', color: '#5a5468' });
    if (this.preview) this.drawPreview();
  }

  // ------------------------------------------------------------------ views

  private view(name: string, ...children: (HTMLElement | null)[]): void {
    if (!this.root) return;
    clearEl(this.root);
    this.preview = null;
    const panel = h('div', { class: 'panel col', 'data-view': name, style: 'min-width:360px;max-width:720px' }, ...children.filter((c): c is HTMLElement => !!c));
    this.root.appendChild(panel);
    setTimeout(() => focusFirst(panel), 0);
  }

  main(): void {
    const store = getStore();
    const meta = readMeta(store);
    const saves = listSaves(store);
    const last = meta.lastSlot ? saves[meta.lastSlot - 1] : null;
    this.view(
      'main',
      h('h2', null, 'Main menu'),
      last ? btn(`Continue — ${last.character.name} (Lv ${last.character.level}${last.character.cycle ? `, Cycle ${last.character.cycle + 1}` : ''})`, () => titleHooks.start?.(last, 'solo'), 'primary big') : null,
      btn('Host a game', () => this.coop('host'), 'big'),
      btn('Join a game', () => this.coop('join'), 'big'),
      btn('Characters (10 slots)', () => this.slots(), 'big'),
      btn('New character', () => this.pickEmpty(), 'big'),
      btn('Settings', () => {
        this.root!.style.display = 'none';
        openSettings(() => {
          this.root!.style.display = '';
          this.main();
        });
      }, 'big'),
      btn('Credits', () => titleHooks.credits?.(), 'big'),
      h('div', { class: 'small dim-text', style: 'max-width:340px' }, 'Co-op: up to 4 players, browser to browser. The host shares a 6-digit code; everyone brings their own character.'),
    );
  }

  /** Host or Join from the main menu (D74): one character goes straight in; several get a picker; none, create one. */
  coop(mode: 'host' | 'join'): void {
    const store = getStore();
    const saves = listSaves(store).filter((x): x is SaveFile => !!x);
    if (saves.length === 0) {
      toast(mode === 'host' ? 'Make a character to host with.' : 'Make a character to join with.');
      this.pickEmpty(mode);
      return;
    }
    if (saves.length === 1) {
      titleHooks.start?.(saves[0]!, mode);
      return;
    }
    // the last played character first
    const last = readMeta(store).lastSlot;
    saves.sort((a, b) => (b.slot === last ? 1 : 0) - (a.slot === last ? 1 : 0));
    const list = h('div', { class: 'col', style: 'gap:6px;max-height:480px;overflow:auto;min-width:460px' });
    for (const sv of saves) {
      const c = sv.character;
      list.appendChild(
        h(
          'div',
          { class: 'card row', 'data-testid': `coop-pick-${sv.slot}` },
          h('div', { class: 'grow' }, h('div', null, h('b', null, c.name), ` — ${CLASSES[c.classId].name}, level ${c.level}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}`), h('div', { class: 'small dim-text' }, mode === 'host' ? `Your world: ${ZONES[sv.world.zone - 1]?.name ?? ''}` : 'Keeps everything earned in the host’s world')),
          btn(mode === 'host' ? 'Host' : 'Join', () => titleHooks.start?.(sv, mode), 'tiny primary'),
        ),
      );
    }
    this.view(
      'coop',
      h('h2', null, mode === 'host' ? 'Host a game — with which character?' : 'Join a game — with which character?'),
      list,
      h('div', { class: 'row' }, btn('New character', () => this.pickEmpty(mode)), btn('Back', () => this.main())),
    );
  }

  private pickEmpty(mode: StartMode = 'solo'): void {
    const saves = listSaves(getStore());
    const i = saves.findIndex((s) => !s);
    if (i < 0) {
      toast('All 10 slots are used. Delete one first.');
      this.slots();
      return;
    }
    this.create(i + 1, mode);
  }

  slots(): void {
    const store = getStore();
    const saves = listSaves(store);
    const list = h('div', { class: 'col', style: 'gap:6px;max-height:520px;overflow:auto;min-width:640px' });
    saves.forEach((s, i) => {
      const slot = i + 1;
      if (!s) {
        list.appendChild(h('div', { class: 'card row' }, h('div', { class: 'grow dim-text' }, `Slot ${slot} — empty`), btn('New character', () => this.create(slot), 'tiny')));
        return;
      }
      const c = s.character;
      const zone = ZONES[s.world.zone - 1]?.name ?? '';
      const card = h(
        'div',
        { class: 'card row', 'data-testid': `slot-${slot}` },
        h(
          'div',
          { class: 'grow' },
          h('div', null, h('b', null, c.name), ` — ${CLASSES[c.classId].name}, level ${c.level}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}`),
          h('div', { class: 'small dim-text' }, `${zone} · ${fmtTime(s.stats.playtimeSec)} played · ${s.stats.deaths} deaths · seed ${s.world.seed}`),
        ),
        btn('Play', () => titleHooks.start?.(s, 'solo'), 'tiny primary'),
        btn('Host', () => titleHooks.start?.(s, 'host'), 'tiny'),
        btn('Join', () => titleHooks.start?.(s, 'join'), 'tiny'),
        btn('Export', () => exportSave(s), 'tiny'),
        btn('Delete', () => this.confirmDelete(s), 'tiny danger'),
      );
      list.appendChild(card);
    });
    const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', 'data-testid': 'import-file' });
    file.addEventListener('change', () => {
      const f = file.files?.[0];
      if (!f) return;
      void f.text().then((text) => this.importText(text));
    });
    this.view(
      'slots',
      h('h2', null, 'Characters'),
      list,
      h('div', { class: 'row' }, btn('Import a .dungeonjoe.json', () => file.click()), btn('Back', () => this.main()), file),
    );
  }

  importText(text: string): string {
    const store = getStore();
    const saves = listSaves(store);
    const i = saves.findIndex((s) => !s);
    if (i < 0) {
      toast('No free slot for the import.');
      return 'full';
    }
    const res = parseImport(text, i + 1);
    if (typeof res === 'string') {
      playSfx('uiError');
      toast(res, 4000);
      return res;
    }
    writeSave(store, res);
    toast(`Imported ${res.character.name} into slot ${i + 1}.`);
    this.slots();
    return '';
  }

  private confirmDelete(s: SaveFile): void {
    this.view(
      'confirm',
      h('h2', null, `Delete ${s.character.name}?`),
      h('div', { class: 'dim-text' }, 'This cannot be undone. Export first if in doubt.'),
      h(
        'div',
        { class: 'row' },
        btn('Delete forever', () => {
          deleteSave(getStore(), s.slot);
          toast('Deleted.');
          this.slots();
        }, 'danger'),
        btn('Keep', () => this.slots(), 'primary'),
      ),
    );
  }

  create(slot: number, mode: StartMode = 'solo'): void {
    let classId: ClassId = 'knight';
    const name = h('input', { value: app().settings.net.name || 'Joe', maxlength: '16', 'data-testid': 'create-name' });
    const seed = h('input', { placeholder: 'blank = random', maxlength: '24', 'data-testid': 'create-seed' });
    const blurb = h('div', { class: 'dim-text', style: 'min-height:40px' });
    const stats = h('div', { class: 'small mono' });
    const canvas = h('canvas', { width: 220, height: 220, style: 'background:#14121a;border:2px solid #3a3447;border-radius:8px' });
    const classes = h('div', { class: 'row wrap', style: 'gap:6px;max-width:560px' });
    const refresh = (): void => {
      const cls = CLASSES[classId];
      blurb.textContent = `“${cls.blurb}”`;
      const st = cls.stats;
      const kit = [WEAPONS[cls.start.main]?.name, cls.start.off ? (SHIELDS[cls.start.off]?.name ?? CASTING_TOOLS[cls.start.off]?.name) : null].filter(Boolean).join(' + ');
      stats.textContent = `HP ${st.hp} · Endurance ${st.endurance} · Bonk ${st.bonk} · Slicey ${st.slicey} · Brain ${st.brain} · Prayer ${st.prayer}\n${kit}${cls.start.spells.length ? ` · spells: ${cls.start.spells.join(', ').replace(/_/g, ' ')}` : ''}`;
      stats.style.whiteSpace = 'pre-line';
      for (const b of classes.querySelectorAll('button')) b.classList.toggle('on', b.getAttribute('data-class') === classId);
      this.preview = { classId, canvas };
    };
    for (const id of CLASS_IDS) {
      const b = btn(CLASSES[id].name, () => {
        classId = id;
        refresh();
      }, 'tiny');
      b.setAttribute('data-class', id);
      classes.appendChild(b);
    }
    const start = (): void => {
      const s = seed.value.trim() || randomSeedString((Date.now() ^ (performance.now() * 1000)) >>> 0);
      const nm = name.value.trim() || 'Joe';
      const pid = `p-${randomSeedString((Date.now() * 7) >>> 0)}-${randomSeedString((performance.now() * 997) >>> 0)}`;
      const ch = newCharacter(classId, nm, pid, new Rng(`${s}|kit`));
      const save = newSave(slot, ch, s);
      writeSave(getStore(), save);
      app().settings.net.name = nm;
      app().saveSettings();
      titleHooks.start?.(save, mode);
    };
    this.view(
      'create',
      h('h2', null, `New character — slot ${slot}`),
      h('div', { class: 'row', style: 'align-items:flex-start;gap:16px' }, canvas, h('div', { class: 'col', style: 'gap:8px' }, h('div', { class: 'row' }, h('div', { style: 'width:60px' }, 'Name'), name), classes, blurb, stats)),
      h('div', { class: 'row' }, h('div', { style: 'width:60px' }, 'Seed'), seed, h('div', { class: 'small dim-text' }, 'Same seed, same dungeon.')),
      h('div', { class: 'row' }, btn(mode === 'host' ? 'Create and host' : mode === 'join' ? 'Create and join' : 'Start', start, 'primary', false), btn('Back', () => this.main())),
    );
    const startBtn = this.root?.querySelector<HTMLButtonElement>('button.primary');
    startBtn?.setAttribute('data-testid', 'create-start');
    refresh();
  }

  private drawPreview(): void {
    const p = this.preview;
    if (!p) return;
    const ctx = p.canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14121a';
    ctx.fillRect(0, 0, 220, 220);
    const c = newCharacter(p.classId, 'Joe', 'preview');
    const look = lookFor(c);
    const cls = CLASSES[p.classId];
    const facing = Math.PI / 2 + Math.sin(this.t) * 0.9;
    const wDraw = WEAPONS[cls.start.main]?.draw ?? 'w_fists';
    const off = cls.start.off;
    drawJoe(ctx, look, {
      x: 110,
      y: 125,
      facing,
      t: this.t,
      moving: 0.3,
      scale: 2.4,
      drawWeapon: (g) => {
        g.save();
        g.translate(Math.cos(facing + 0.9) * 10, Math.sin(facing + 0.9) * 10 + 2);
        g.rotate(facing + 0.7);
        drawWeapon(g, wDraw, 0);
        g.restore();
        if (isPairedWeapon(wDraw)) {
          g.save();
          g.translate(Math.cos(facing - 0.9) * 10, Math.sin(facing - 0.9) * 10 + 2);
          g.rotate(facing - 0.6);
          drawWeapon(g, wDraw, 0);
          g.restore();
        }
      },
      drawOffhand: (g) => {
        if (!off) return;
        g.save();
        g.translate(Math.cos(facing - 1.1) * 13, Math.sin(facing - 1.1) * 13 + 2);
        g.rotate(facing);
        if (SHIELDS[off]) drawShield(g, SHIELDS[off]!.draw);
        else if (CASTING_TOOLS[off]) drawTool(g, CASTING_TOOLS[off]!.draw, this.t);
        g.restore();
      },
    });
  }
}

export { SLOT_COUNT };
