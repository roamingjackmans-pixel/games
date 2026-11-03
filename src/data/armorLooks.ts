// Rich look specs for the 24 armor sets (CONTENT_ITEMS §7, ART_AUDIO §2). armor.ts keeps the base look
// (head/body type, colour, trim); this adds the fantasy dressing per piece: helm sub-styles, crests and
// visors on the head piece; pauldrons, capes, surcoats/tabards, emblems, belts and textures on the body
// piece; greaves/boots on the legs piece. Read by lookFor() in src/render/entities.ts. Pure data.
import type { BodyExtras, HeadExtras, LegExtras } from '../engine/draw/players';

export interface ArmorLookSpec {
  head: HeadExtras;
  body: BodyExtras;
  legs: LegExtras;
}

export const ARMOR_LOOKS: Record<string, ArmorLookSpec> = {
  // ---------------------------------------------------------------- Zone 1: the Crypt
  crypt_rags: {
    head: { headStyle: 'pointed', headTrim: '#a9b7a0' },
    body: { capeStyle: 'tattered', belt: '#8a7a5a', texture: 'patches', hands: 'wraps' },
    legs: { legs: 'wraps' },
  },
  sextons_mail: {
    head: { headStyle: 'coif' },
    body: { over: 'surcoat', overColor: '#4f6a4c', emblem: 'cross', emblemColor: '#e8e1c8', belt: '#4a3322', metal: '#d8c890', hands: 'glove' },
    legs: { legs: 'chausses', bootColor: '#4a3322' },
  },
  caretakers_plate: {
    head: { headStyle: 'kettle' },
    body: {
      pauldrons: 'round',
      over: 'tabard',
      overColor: '#4a5248',
      emblem: 'shovel',
      emblemColor: '#a9b7a0',
      cape: '#3a4238',
      capeStyle: 'tattered',
      texture: 'dents',
      metal: '#a9b7a0',
    },
    legs: { legs: 'greaves' },
  },
  // ---------------------------------------------------------------- Zone 2: the Caverns
  sporesilk: {
    head: { headStyle: 'cowl', headTrim: '#5fd3c0' },
    body: { glow: '#5fd3c0', emblem: 'spores', emblemColor: '#5fd3c0', belt: '#3f2a58' },
    legs: { legs: 'slippers', bootColor: '#3f2a58' },
  },
  mycelial: {
    head: { headStyle: 'mushroom', headTrim: '#c58cff' },
    body: { pauldrons: 'shroom', texture: 'studs', metal: '#c58cff', belt: '#4a2e1c', emblem: 'spores', emblemColor: '#c58cff' },
    legs: { legs: 'boots', bootColor: '#4a2e1c' },
  },
  capshell: {
    head: { headStyle: 'shell', headTrim: '#5fd3c0', eyeGlow: '#5fd3c0' },
    body: { pauldrons: 'shell', glow: '#5fd3c0', metal: '#5fd3c0', emblem: 'spores', emblemColor: '#5fd3c0' },
    legs: { legs: 'greaves', legMetal: '#8a6a8e' },
  },
  // ---------------------------------------------------------------- Zone 3: the Sewers
  waders: {
    head: { headStyle: 'mask' },
    body: { over: 'vest', extra: 'suspenders', belt: '#2a2a20', texture: 'stitches', hands: 'glove' },
    legs: { legs: 'waders', bootColor: '#3d4a30' },
  },
  ratcatcher: {
    head: { headStyle: 'flaps', headTrim: '#8fa37a' },
    body: { over: 'vest', overColor: '#5a4a32', extra: 'bandolier', emblem: 'rat', emblemColor: '#8fa37a', belt: '#3a2a1a', metal: '#8fa37a' },
    legs: { legs: 'boots', bootColor: '#3a2a1a' },
  },
  drowned_king: {
    head: { headStyle: 'drowned', headTrim: '#5fd3c0' },
    body: {
      pauldrons: 'royal',
      cape: '#1f4a44',
      capeLining: '#0e2a26',
      over: 'tabard',
      overColor: '#24453a',
      emblem: 'trident',
      emblemColor: '#e6b84a',
      metal: '#e6b84a',
      belt: '#e6b84a',
    },
    legs: { legs: 'greaves', legMetal: '#e6b84a' },
  },
  // ---------------------------------------------------------------- Zone 4: the Forest
  glade: {
    head: { headStyle: 'ranger', headTrim: '#e6b84a' },
    body: { cape: '#3a5a2a', capeStyle: 'short', emblem: 'leaf', emblemColor: '#e6b84a', extra: 'quiver', texture: 'stitches', metal: '#e6b84a' },
    legs: { legs: 'boots', bootColor: '#3a2410' },
  },
  huntsman: {
    head: { headStyle: 'feather', crestColor: '#c8621f', headTrim: '#c8621f' },
    body: { pauldrons: 'leather', texture: 'studs', metal: '#c8621f', extra: 'pouches', belt: '#3a2614', cape: '#2a4a2c', capeStyle: 'short' },
    legs: { legs: 'leggings', bootColor: '#3a2614' },
  },
  antlerguard: {
    head: { headStyle: 'antlers' },
    body: { pauldrons: 'fur', cape: '#5a3a1e', capeLining: '#3a2412', emblem: 'antler', emblemColor: '#e6b84a', metal: '#e6b84a', belt: '#3a2412' },
    legs: { legs: 'greaves', legMetal: '#e6b84a' },
  },
  // ---------------------------------------------------------------- Zone 5: the Forge
  cultist: {
    head: { headStyle: 'deep', headTrim: '#ff7a1a', eyeGlow: '#ff7a1a' },
    body: { emblem: 'flame', emblemColor: '#ff7a1a', belt: '#2a0a0a', glow: '#ff7a1a' },
    legs: { legs: 'hose', bootColor: '#1a0808' },
  },
  smiths_apron: {
    head: { headStyle: 'goggles', headTrim: '#ffd27a' },
    body: { over: 'apron', overColor: '#7a4a24', emblem: 'anvil', emblemColor: '#ffd27a', belt: '#2a1a10', metal: '#ffd27a', hands: 'glove' },
    legs: { legs: 'boots', bootColor: '#2a1a10' },
  },
  forgeplate: {
    head: { headStyle: 'bucket', visor: 'slit', eyeGlow: '#ff7a1a', crest: 'flame', crestColor: '#ff7a1a', headTrim: '#6a3a2a' },
    body: { pauldrons: 'layered', glow: '#ff7a1a', texture: 'cracks', emblem: 'anvil', emblemColor: '#ff7a1a', metal: '#ff7a1a', belt: '#1a0e0e' },
    legs: { legs: 'greaves', legMetal: '#6a3a2a' },
  },
  // ---------------------------------------------------------------- Zone 6: the Reliquary
  choir: {
    head: { headTrim: '#d4af37' },
    body: { over: 'stole', overColor: '#d4af37', belt: '#d4af37', emblem: 'sun', emblemColor: '#d4af37' },
    legs: { legs: 'slippers', bootColor: '#e8e1c8' },
  },
  wraithwatch: {
    head: { headStyle: 'winged', crest: 'plume', crestColor: '#9ad0ff', headTrim: '#c9d8e8' },
    body: { over: 'surcoat', overColor: '#2a4a78', emblem: 'eye', emblemColor: '#9ad0ff', cape: '#203a60', capeLining: '#14243c', belt: '#1a2a40', metal: '#9ad0ff', hands: 'glove' },
    legs: { legs: 'chausses', bootColor: '#1a2a40' },
  },
  saints_ice: {
    head: { headStyle: 'great', visor: 'cross', crest: 'halo', crestColor: '#d4af37', headTrim: '#d4af37' },
    body: { pauldrons: 'winged', cape: '#f4f8ff', capeLining: '#b8cce0', over: 'tabard', overColor: '#f4f8ff', emblem: 'sun', emblemColor: '#d4af37', metal: '#d4af37', belt: '#d4af37' },
    legs: { legs: 'greaves', legMetal: '#d4af37' },
  },
  // ---------------------------------------------------------------- Zone 7: the Citadel
  magister: {
    head: { headTrim: '#b08d3c' },
    body: { over: 'mantle', overColor: '#4a2f8a', emblem: 'star', emblemColor: '#e6c86a', belt: '#b08d3c' },
    legs: { legs: 'hose', bootColor: '#2a1a4a' },
  },
  cogwork: {
    head: { headStyle: 'cogcap', headTrim: '#2aa198' },
    body: { pauldrons: 'gear', texture: 'studs', metal: '#2aa198', emblem: 'cog', emblemColor: '#2aa198', extra: 'pouches', belt: '#5a4420', hands: 'glove' },
    legs: { legs: 'greaves', legMetal: '#2aa198' },
  },
  juggernaut: {
    head: { headStyle: 'grille', visor: 'grille', eyeGlow: '#2aa198', crest: 'pipes', crestColor: '#5a5048', headTrim: '#2aa198' },
    body: { pauldrons: 'massive', extra: 'boiler', emblem: 'gauge', emblemColor: '#efe6d2', metal: '#2aa198', belt: '#3a2a10' },
    legs: { legs: 'greaves', legMetal: '#2aa198' },
  },
  // ---------------------------------------------------------------- Zone 8: the Abyss
  lessee: {
    head: { headTrim: '#efe6d2' },
    body: { emblemColor: '#8a1a2a', extra: 'tie' },
    legs: { legs: 'slacks', bootColor: '#0e0c10' },
  },
  abyssal_scale: {
    head: { headStyle: 'finned', crest: 'fin', crestColor: '#7a2bd6', eyeGlow: '#b06bff', visor: 'glow' },
    body: { over: 'none', texture: 'scales', cape: '#1a0828', capeLining: '#3a1460', capeStyle: 'tattered', emblem: 'eye', emblemColor: '#b06bff', glow: '#7a2bd6', belt: '#12061c', metal: '#b06bff', hands: 'gauntlet' },
    legs: { legs: 'scales', legMetal: '#7a2bd6' },
  },
  foreclosure: {
    head: { headStyle: 'spiked', visor: 'slit', eyeGlow: '#b06bff', crest: 'spikes', crestColor: '#2a1a34', headTrim: '#7a2bd6' },
    body: { pauldrons: 'spiked', cape: '#0c0610', capeLining: '#3a1460', capeStyle: 'tattered', emblem: 'padlock', emblemColor: '#b06bff', glow: '#7a2bd6', metal: '#3a2a44', belt: '#0a060c' },
    legs: { legs: 'greaves', legMetal: '#3a2a44' },
  },
};

/** The Lessee's Hat is a bowler (armor.ts lists the head as 'none'). */
export const HEAD_OVERRIDE: Record<string, 'bowler'> = { lessee: 'bowler' };
