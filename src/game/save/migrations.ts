// Save migrations: each entry upgrades a save from `from` to `from + 1`. Version 3 is current.
import { SAVE_VERSION } from './schema';
import { untierGem } from '../../data/gems';

type Migration = { from: number; up: (s: Record<string, unknown>) => Record<string, unknown> };

/** Version 0 (pre-release test saves) → 1: added leftBehind, altMain, freePoints, quickSlot. */
export const MIGRATIONS: Migration[] = [
  {
    from: 0,
    up: (s) => {
      const c = (s.character ?? {}) as Record<string, unknown>;
      c.altMain ??= null;
      c.freePoints ??= 0;
      c.quickSlot ??= null;
      c.tutorialDone ??= true;
      const w = (s.world ?? {}) as Record<string, unknown>;
      w.leftBehind ??= {};
      w.bonfiresDiscovered ??= [];
      w.roomsVisited ??= [];
      w.bossKilled ??= [];
      return { ...s, character: c, world: w, version: 1 };
    },
  },
  {
    // 1 → 2 (D80, D82, D83): Stardust is Glowen, the Stamina stat is Endurance, the Starcatcher is the
    // Glowcatcher, Stardusted is Glowing, and Insulated (lightning defense) folded into Spellproof (magic).
    from: 1,
    up: (s) => {
      const c = (s.character ?? {}) as Record<string, unknown>;
      if (c.glowen === undefined) c.glowen = typeof c.stardust === 'number' ? c.stardust : 0;
      delete c.stardust;
      const st = c.stats as Record<string, unknown> | undefined;
      if (st && st.endurance === undefined) {
        st.endurance = typeof st.stamina === 'number' ? st.stamina : 10;
        delete st.stamina;
      }
      const fixItem = (it: unknown): void => {
        if (!it || typeof it !== 'object') return;
        const o = it as { baseId?: string; affixes?: { id: string }[] };
        if (o.baseId === 'starcatcher') o.baseId = 'glowcatcher';
        for (const a of o.affixes ?? []) {
          if (a.id === 'stardusted') a.id = 'glowing';
          if (a.id === 'insulated') a.id = 'frostproof';
        }
      };
      const eq = (c.equipment ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(eq)) fixItem(eq[k]);
      fixItem(c.altMain);
      for (const it of (c.bag as unknown[] | undefined) ?? []) fixItem(it);
      const w = (s.world ?? {}) as Record<string, unknown>;
      for (const list of Object.values((w.leftBehind ?? {}) as Record<string, { item?: unknown }[]>)) for (const e of list) fixItem(e.item);
      for (const list of Object.values((w.garyStock ?? {}) as Record<string, { item?: unknown }[]>)) for (const e of list) fixItem(e.item);
      for (const e of Object.values((w.shopStock ?? {}) as Record<string, { item?: unknown }>)) fixItem(e.item);
      return { ...s, character: c, world: w, version: 2 };
    },
  },
  {
    // 2 → 3: a gem is a list of perks, each with its own tier ({family, tier} → {perks: [{family, tier}]}).
    from: 2,
    up: (s) => {
      const c = (s.character ?? {}) as Record<string, unknown>;
      const fixItem = (it: unknown): void => {
        if (!it || typeof it !== 'object') return;
        const o = it as { sockets?: unknown[] };
        if (Array.isArray(o.sockets)) o.sockets = o.sockets.map((g) => (g ? perkGem(g) : null));
      };
      if (Array.isArray(c.gems)) c.gems = c.gems.map(perkGem);
      const eq = (c.equipment ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(eq)) fixItem(eq[k]);
      fixItem(c.altMain);
      for (const it of (c.bag as unknown[] | undefined) ?? []) fixItem(it);
      const w = (s.world ?? {}) as Record<string, unknown>;
      for (const list of Object.values((w.leftBehind ?? {}) as Record<string, { item?: unknown }[]>)) for (const e of list) fixItem(e.item);
      for (const list of Object.values((w.garyStock ?? {}) as Record<string, { item?: unknown; gem?: unknown }[]>)) {
        for (const e of list) {
          fixItem(e.item);
          if (e.gem) e.gem = perkGem(e.gem);
        }
      }
      for (const e of Object.values((w.shopStock ?? {}) as Record<string, { item?: unknown }>)) fixItem(e.item);
      return { ...s, character: c, world: w, version: 3 };
    },
  },
];

/** An old one-family gem ({family, tier}) as a one-perk gem; a gem that already has perks is kept. */
export function perkGem(g: unknown): unknown {
  if (!g || typeof g !== 'object') return g;
  const o = g as { family?: unknown; tier?: unknown; perks?: unknown };
  if (Array.isArray(o.perks)) return g;
  return { perks: [{ family: o.family, tier: typeof o.tier === 'number' ? o.tier : 1 }] };
}

export function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  let s = raw as Record<string, unknown>;
  let v = typeof s.version === 'number' ? s.version : 0;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS.find((x) => x.from === v);
    if (!m) break;
    s = m.up(s);
    v = typeof s.version === 'number' ? s.version : v + 1;
  }
  untierSave(s);
  return s;
}

/**
 * D284: gems lost their tiers. Every perk that still has one (any save from before) folds it into its quality roll. Runs
 * on every load (it leaves tier-less perks alone), so it needs no save version of its own.
 */
export function untierSave(s: Record<string, unknown>): void {
  untierAndRescale(s);
}

/**
 * D325: Leeching is a share of max HP a hit, 0.1–0.3 (it was 1–3% of the damage, whole numbers). An older roll (1 or
 * more) is a tenth of what it was; a new one is never 1 or more, so this runs on every load and never twice.
 */
export function rescaleLeeching(it: unknown): void {
  const affixes = (it as { affixes?: { id?: string; value?: number }[] } | null)?.affixes;
  if (!Array.isArray(affixes)) return;
  for (const a of affixes) if (a?.id === 'leeching' && typeof a.value === 'number' && a.value >= 1) a.value = Math.round(a.value * 10) / 100;
}

function untierAndRescale(s: Record<string, unknown>): void {
  const c = (s.character ?? {}) as Record<string, unknown>;
  const fixItem = (it: unknown): void => {
    if (!it || typeof it !== 'object') return;
    const o = it as { sockets?: unknown[] };
    if (Array.isArray(o.sockets)) for (const g of o.sockets) untierGem(g);
    rescaleLeeching(it);
  };
  if (Array.isArray(c.gems)) for (const g of c.gems) untierGem(g);
  for (const it of Object.values((c.equipment ?? {}) as Record<string, unknown>)) fixItem(it);
  fixItem(c.altMain);
  fixItem(c.altOff);
  for (const it of (c.bag as unknown[] | undefined) ?? []) fixItem(it);
  const w = (s.world ?? {}) as Record<string, unknown>;
  for (const list of Object.values((w.leftBehind ?? {}) as Record<string, { item?: unknown }[]>)) for (const e of list ?? []) fixItem(e?.item);
  for (const list of Object.values((w.garyStock ?? {}) as Record<string, { item?: unknown; gem?: unknown }[]>)) {
    for (const e of list ?? []) {
      fixItem(e?.item);
      untierGem(e?.gem);
    }
  }
  for (const e of Object.values((w.shopStock ?? {}) as Record<string, { item?: unknown }>)) fixItem(e?.item);
}
