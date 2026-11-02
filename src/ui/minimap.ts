// Minimap (top-right) and the full map (M): discovered rooms, current room, icons for bonfires (lit/ember),
// treasure, reliquary, merchant, boss, and items left behind.
import type { ZoneLayout, RoomNode } from '../game/procgen/zone';
import { neighbourId } from '../game/procgen/zone';
import type { WorldState } from '../game/types';
import type { Side } from '../game/room';

export interface MapView {
  layout: ZoneLayout;
  ws: WorldState;
  currentId: string;
  revealAll: boolean;
}

/** Rooms the player knows about: visited ones and their neighbours seen through doors. */
export function knownRooms(v: MapView): { visited: Set<string>; seen: Set<string> } {
  const visited = new Set(v.ws.roomsVisited.filter((id) => !!v.layout.byId[id]));
  const seen = new Set<string>();
  for (const id of visited) {
    for (const s of ['n', 's', 'e', 'w'] as Side[]) {
      const n = neighbourId(v.layout, id, s);
      if (n && !visited.has(n.id)) seen.add(n.id);
    }
  }
  if (v.revealAll) for (const r of v.layout.rooms) if (!visited.has(r.id)) seen.add(r.id);
  return { visited, seen };
}

function iconFor(r: RoomNode, ws: WorldState): { glyph: string; color: string } | null {
  switch (r.kind) {
    case 'start':
    case 'anteroom': {
      const id = r.kind === 'start' ? `z${ws.zone}-start` : `z${ws.zone}-boss`;
      const used = ws.bonfiresUsed.includes(id);
      return { glyph: '▲', color: used ? '#8a5a3a' : '#ff9b2e' };
    }
    case 'treasure':
      return { glyph: '■', color: '#e6b84a' };
    case 'reliquary':
      return { glyph: '✦', color: '#c58cff' };
    case 'merchant':
      return { glyph: '$', color: '#58d66a' };
    case 'boss':
      return { glyph: '☠', color: '#ff3b3b' };
    default:
      return null;
  }
}

export function drawMap(ctx: CanvasRenderingContext2D, v: MapView, x0: number, y0: number, cw: number, ch: number, gap: number, detail: boolean): void {
  const { visited, seen } = knownRooms(v);
  const rooms = v.layout.rooms.filter((r) => r.kind !== 'tutorial' || visited.has(r.id));
  if (rooms.length === 0) return;
  const minX = Math.min(...rooms.map((r) => r.gx));
  const minY = Math.min(...rooms.map((r) => r.gy));
  const cell = (r: RoomNode): [number, number] => [x0 + (r.gx - minX) * (cw + gap), y0 + (r.gy - minY) * (ch + gap)];
  // corridors
  ctx.strokeStyle = 'rgba(239,230,210,0.35)';
  ctx.lineWidth = 2;
  for (const r of rooms) {
    if (!visited.has(r.id) && !seen.has(r.id)) continue;
    const [x, y] = cell(r);
    for (const s of ['e', 's'] as Side[]) {
      const n = neighbourId(v.layout, r.id, s);
      if (!n) continue;
      const nr = v.layout.byId[n.id];
      if (!nr || (!visited.has(nr.id) && !seen.has(nr.id))) continue;
      const [nx, ny] = cell(nr);
      ctx.beginPath();
      ctx.moveTo(x + cw / 2, y + ch / 2);
      ctx.lineTo(nx + cw / 2, ny + ch / 2);
      ctx.stroke();
    }
  }
  for (const r of rooms) {
    const vis = visited.has(r.id);
    if (!vis && !seen.has(r.id)) continue;
    const [x, y] = cell(r);
    const cur = r.id === v.currentId;
    ctx.fillStyle = cur ? '#efe6d2' : vis ? (v.ws.roomsCleared.includes(r.id) || r.kind !== 'combat' ? '#5a5468' : '#7a4a4a') : 'rgba(90,84,104,0.35)';
    ctx.fillRect(x, y, cw, ch);
    ctx.strokeStyle = cur ? '#e6b84a' : '#1a1820';
    ctx.lineWidth = cur ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
    const ic = iconFor(r, v.ws);
    if (ic && (vis || seen.has(r.id))) {
      ctx.fillStyle = ic.color;
      ctx.font = `bold ${Math.round(ch * 0.8)}px "Segoe UI", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ic.glyph, x + cw / 2, y + ch / 2 + 1);
    }
    const left = v.ws.leftBehind[r.id]?.length ?? 0;
    if (detail && left) {
      ctx.fillStyle = '#ff9b2e';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`left behind: ${left}`, x + 2, y + ch + 11);
    }
    if (v.ws.shardpile && v.ws.shardpile.roomId === r.id && v.ws.shardpile.zone === v.layout.zone) {
      ctx.fillStyle = '#9ad0ff';
      ctx.beginPath();
      ctx.arc(x + cw - 4, y + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.textBaseline = 'alphabetic';
}

export function drawMinimap(ctx: CanvasRenderingContext2D, v: MapView): void {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(10,8,14,0.6)';
  ctx.fillRect(1280 - 170, 12, 158, 120);
  drawMap(ctx, v, 1280 - 164, 18, 14, 10, 3, false);
  ctx.restore();
}
