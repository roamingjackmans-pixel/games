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
import { openAchievements } from '../../ui/achievements';
import { openStatistics } from '../../ui/statistics';
import { achievements } from '../achievements';
import { newCharacter } from '../player/character';
import { newSave, SLOT_COUNT } from '../save/schema';
import { exportFileName, exportText, parseImport } from '../save/exportImport';
import { deleteSave, listSaves, readMeta, writeSave } from '../save/storage';
import type { ClassId, SaveFile } from '../types';
// the character creator's class card and appearance pickers
import { STAT_IDS, type Appearance, type Character, type StatId } from '../types';
import { computeDerived } from '../player/derived';
import { LOAD_TIERS } from '../player/equipLoad';
import { SPELLS } from '../../data/spells';
import { STAT_LABEL } from '../../ui/tooltip';
import { glyphText } from '../../ui/glyphs';
import {
  ARM_FEATURES, BEARDS, BROWS, EYE_COLORS, EYE_SHAPES, HAIR_COLORS, HAIR_STYLES, LEG_FEATURES, MARKS, NOSES, SKIN_TONES,
  defaultAppearance, randomAppearance, type Choice, type Swatch,
} from '../../data/appearance';

const STAT_HINT: Record<StatId, string> = {
  hp: 'Max health',
  endurance: 'Max stamina, stamina regen and equip load',
  bonk: 'Damage of slow, heavy weapons',
  slicey: 'Damage of fast, light weapons and bows',
  brain: 'Offensive magic (staff spells)',
  prayer: 'Healing and buff magic (talisman spells); a slightly better flask',
};

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
  private preview: { classId: ClassId; canvas: HTMLCanvasElement; char: Character; bareHead: boolean } | null = null;

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
      btn(`Achievements (${achievements().totals().join(' / ')})`, () => {
        this.root!.style.display = 'none';
        openAchievements(() => {
          this.root!.style.display = '';
          this.main();
        });
      }, 'big'),
      btn('Statistics', () => {
        this.root!.style.display = 'none';
        openStatistics(() => {
          this.root!.style.display = '';
          this.main();
        }, { saves: listSaves(store).filter((x): x is SaveFile => !!x), slot: meta.lastSlot });
      }, 'big'),
      btn('Credits', () => titleHooks.credits?.(), 'big'),
      h('div', { class: 'small dim-text', style: 'max-width:360px' }, 'Co-op: up to 4 players, each with their own character.'),
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
    let ap: Appearance = defaultAppearance(classId);
    /** once the player touches the appearance, a class change keeps it */
    let custom = false;
    const name = h('input', { value: app().settings.net.name || 'Joe', maxlength: '16', 'data-testid': 'create-name', style: 'flex:1;min-width:0' });
    const seed = h('input', { placeholder: 'blank = random', maxlength: '24', 'data-testid': 'create-seed' });
    const canvas = h('canvas', { width: 248, height: 250, style: 'background:#14121a;border:2px solid #3a3447;border-radius:8px;display:block' });
    const classes = h('div', { class: 'cc-classes' });
    const card = h('div', { class: 'cc-col', 'data-testid': 'create-class-card' });

    // ---- the class card: name and blurb, then stats, starting kit and what that makes at level 1
    const refreshCard = (ch: Character): void => {
      const cls = CLASSES[classId];
      clearEl(card);
      card.appendChild(h('div', { class: 'cc-name' }, cls.name));
      card.appendChild(h('div', { class: 'dim-text small' }, `“${cls.blurb}”`));
      const stats = h('div', { class: 'cc-rows' });
      for (const k of STAT_IDS) {
        const v = cls.stats[k];
        stats.append(
          h('div', { class: 'lbl', title: STAT_HINT[k] }, STAT_LABEL[k]),
          h('div', { class: 'sep' }, '-'),
          h('div', { class: 'val' }, String(v)),
          h('div', { class: 'cc-bar', title: STAT_HINT[k] }, h('i', { style: `width:${Math.round((v / 16) * 100)}%` })),
        );
      }
      card.append(h('div', { class: 'cc-sec' }, 'Stats'), stats);
      const kit = h('div', { class: 'cc-rows' });
      const kitRow = (label: string, value: string, dim = false): void => {
        kit.append(h('div', { class: 'lbl' }, label), h('div', { class: 'sep' }, '-'), h('div', { class: `wide${dim ? ' dim-text' : ''}` }, value));
      };
      const eq = ch.equipment;
      const paired = isPairedWeapon(WEAPONS[cls.start.main]?.draw ?? '');
      kitRow('Weapon', `${eq.main?.name ?? 'Fists'}${cls.twoHanded ? (paired ? ' (dual-wielding)' : ' (two-handed)') : ''}`);
      kitRow('Off hand', eq.off?.name ?? '—', !eq.off);
      if (ch.altMain) kitRow('2nd weapon', `${ch.altMain.name} (swap: ${glyphText('swapWeapon')})`);
      kitRow('Head', eq.head?.name ?? '—', !eq.head);
      kitRow('Body', eq.body?.name ?? '—', !eq.body);
      kitRow('Legs', eq.legs?.name ?? '—', !eq.legs);
      if (cls.start.spells.length) cls.start.spells.forEach((s, i) => kitRow(i === 0 ? 'Spells' : '', SPELLS[s]?.name ?? s));
      else kitRow('Spells', '—', true);
      for (const it of ch.bag) kitRow('Bag', it.name);
      if (ch.gems.length) kitRow('Gems', `${ch.gems.length} random gem`);
      card.append(h('div', { class: 'cc-sec' }, 'Starting kit'), kit);
      const d = computeDerived(ch);
      const lv = h('div', { class: 'cc-rows' });
      const lvRow = (label: string, ...value: (HTMLElement | string)[]): void => {
        lv.append(h('div', { class: 'lbl' }, label), h('div', { class: 'sep' }, '-'), h('div', { class: 'wide' }, ...value));
      };
      lvRow('Max HP', String(Math.round(d.maxHp)));
      lvRow('Max stamina', String(Math.round(d.maxStam)));
      lvRow('Equip load', h('span', { style: `color:${d.load.effects.color}` }, LOAD_TIERS[d.load.tier].label), h('span', { class: 'dim-text' }, ` ${Math.round(d.load.frac * 100)}%`));
      card.append(h('div', { class: 'cc-sec' }, 'At level 1'), lv);
    };

    // ---- appearance: cyclers for shapes, swatches for colours; every control re-syncs from `ap`
    const syncs: (() => void)[] = [];
    const sync = (): void => {
      for (const s of syncs) s();
      if (this.preview) this.preview.char.appearance = { ...ap };
    };
    const touch = (): void => {
      custom = true;
      sync();
    };
    const cycler = <T extends string>(key: keyof Appearance, list: Choice<T>[], label: string): HTMLElement => {
      const out = h('span');
      const step = (dir: number): void => {
        const i = list.findIndex((o) => (o.id as string) === ap[key]);
        (ap as unknown as Record<string, string>)[key] = list[(i + dir + list.length) % list.length]!.id;
        touch();
      };
      const prev = btn('◀', () => step(-1));
      const next = btn('▶', () => step(1));
      prev.setAttribute('aria-label', `Previous ${label}`);
      next.setAttribute('aria-label', `Next ${label}`);
      syncs.push(() => {
        out.textContent = list.find((o) => (o.id as string) === ap[key])?.label ?? '';
      });
      return h('div', { class: 'cc-cyc', 'data-testid': `ap-${key}` }, prev, out, next);
    };
    const swatches = (key: 'skin' | 'hair' | 'eyes', list: Swatch[], withNone = false): HTMLElement => {
      const box = h('div', { class: 'cc-sw', 'data-testid': `ap-${key}` });
      const all: { hex: string; b: HTMLButtonElement }[] = [];
      const add = (hex: string, label: string, cls = ''): void => {
        const b = btn('', () => {
          ap[key] = hex;
          touch();
        }, cls);
        b.title = label;
        b.setAttribute('aria-label', label);
        if (hex) b.style.background = hex;
        all.push({ hex, b });
        box.appendChild(b);
      };
      if (withNone) add('', 'Plain', 'none');
      for (const s of list) add(s.hex, s.label);
      syncs.push(() => {
        for (const s of all) s.b.classList.toggle('on', s.hex.toLowerCase() === ap[key].toLowerCase());
      });
      return box;
    };
    const apRows: [string, HTMLElement][] = [
      ['Skin', swatches('skin', SKIN_TONES)],
      ['Hair', cycler('hairStyle', HAIR_STYLES, 'hair style')],
      ['Hair colour', swatches('hair', HAIR_COLORS)],
      ['Facial hair', cycler('beard', BEARDS, 'facial hair')],
      ['Eyes', cycler('eyeShape', EYE_SHAPES, 'eyes')],
      ['Eye colour', swatches('eyes', EYE_COLORS, true)],
      ['Nose', cycler('nose', NOSES, 'nose')],
      ['Brows', cycler('brows', BROWS, 'brows')],
      ['Face', cycler('mark', MARKS, 'face mark')],
      ['Left arm', cycler('armL', ARM_FEATURES, 'left arm')],
      ['Right arm', cycler('armR', ARM_FEATURES, 'right arm')],
      ['Left leg', cycler('legL', LEG_FEATURES, 'left leg')],
      ['Right leg', cycler('legR', LEG_FEATURES, 'right leg')],
    ];
    const apGrid = h('div', { class: 'cc-ap' });
    for (const [label, el] of apRows) apGrid.append(h('div', { class: 'lbl' }, label), el);
    const randomize = btn('Randomize', () => {
      ap = randomAppearance(new Rng(`${Date.now()}|${performance.now()}`));
      touch();
    }, 'tiny');
    randomize.setAttribute('data-testid', 'ap-randomize');
    const reset = btn('Class look', () => {
      ap = defaultAppearance(classId);
      custom = false;
      sync();
    }, 'tiny');
    const apCol = h(
      'div',
      { class: 'cc-col' },
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('div', { class: 'cc-sec', style: 'margin:0' }, 'Appearance'), h('div', { class: 'row', style: 'gap:6px' }, randomize, reset)),
      apGrid,
      h('div', { class: 'small dim-text' }, 'Everyone in co-op sees you like this. A hook or a peg still holds a sword and walks the stairs.'),
    );

    const refresh = (): void => {
      if (!custom) ap = defaultAppearance(classId);
      const ch = newCharacter(classId, 'Joe', 'preview');
      ch.appearance = { ...ap };
      refreshCard(ch);
      for (const b of classes.querySelectorAll('button')) b.classList.toggle('on', b.getAttribute('data-class') === classId);
      this.preview = { classId, canvas, char: ch, bareHead: this.preview?.bareHead ?? true };
      sync();
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
      ch.appearance = { ...ap };
      const save = newSave(slot, ch, s);
      writeSave(getStore(), save);
      app().settings.net.name = nm;
      app().saveSettings();
      titleHooks.start?.(save, mode);
    };
    const startBtn = btn(mode === 'host' ? 'Create and host' : mode === 'join' ? 'Create and join' : 'Start', start, 'primary', false);
    startBtn.setAttribute('data-testid', 'create-start');
    const headBtn = btn('Show headgear', () => {
      if (!this.preview) return;
      this.preview.bareHead = !this.preview.bareHead;
      headBtn.textContent = this.preview.bareHead ? 'Show headgear' : 'Hide headgear';
    }, 'tiny');
    headBtn.style.cssText = 'position:absolute;right:6px;bottom:6px;opacity:.85';
    this.view(
      'create',
      h('h2', null, `New character — slot ${slot}`),
      h(
        'div',
        { class: 'cc' },
        h('div', { class: 'cc-col' }, h('div', { style: 'position:relative' }, canvas, headBtn), h('div', { class: 'row', style: 'gap:8px' }, h('div', null, 'Name'), name), h('div', { class: 'cc-sec' }, 'Class'), classes),
        card,
        apCol,
      ),
      h('div', { class: 'row', style: 'margin-top:4px' }, h('div', null, 'Seed'), seed, h('div', { class: 'small dim-text grow' }, 'Same seed, same dungeon.'), startBtn, btn('Back', () => this.main())),
    );
    const panel = this.root?.querySelector<HTMLElement>('[data-view=create]');
    if (panel) panel.style.maxWidth = 'none';
    refresh();
  }

  private drawPreview(): void {
    const p = this.preview;
    if (!p) return;
    const ctx = p.canvas.getContext('2d')!;
    const W = p.canvas.width;
    const H = p.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#14121a';
    ctx.fillRect(0, 0, W, H);
    const look = lookFor(p.char);
    if (p.bareHead) {
      // the creator shows the face: no hat, hood or helm unless asked
      look.head = 'none';
      delete look.headStyle;
      delete look.crest;
      delete look.visor;
      delete look.eyeGlow;
    }
    const cls = CLASSES[p.classId];
    // stands still facing you, turned a touch to the side so the gear in both hands shows (no more spinning)
    const facing = Math.PI / 2 - 0.3;
    const wDraw = WEAPONS[cls.start.main]?.draw ?? CASTING_TOOLS[cls.start.main]?.draw ?? 'w_fists';
    const off = cls.start.off;
    drawJoe(ctx, look, {
      x: W / 2,
      y: H / 2 + 30,
      facing,
      t: this.t,
      moving: 0,
      scale: 3.1,
      twoHanded: !!cls.twoHanded && !isPairedWeapon(wDraw),
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
