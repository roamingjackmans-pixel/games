// Steam Controller over WebHID (D206). Without Steam translating it, a Steam Controller is not a gamepad to the browser:
// it pretends to be a mouse and keyboard ("lizard mode") and the Gamepad API never lists it. In Chrome and Edge,
// WebHID can open its vendor interface directly: this turns lizard mode off and reads its reports, and the input
// manager reads it like one more gamepad in the standard layout (buttons 0–16, axes 0–3), exactly like the touch pad.
//
// The report layouts follow the Linux kernel's hid-steam driver: the original Steam Controller (wired 0x1102, wireless
// dongle 0x1142) sends state report 0x01; the Steam Deck family sends 0x09. Both are 64 bytes, starting 0x01 0x00.

export const VALVE_VENDOR_ID = 0x28de;
export const STEAM_PAD_ID = 'Steam Controller (WebHID, Xbox layout)';

const BUTTONS = 17;
const pressed: boolean[] = new Array<boolean>(BUTTONS).fill(false);
const values: number[] = new Array<number>(BUTTONS).fill(0);
const axes: [number, number, number, number] = [0, 0, 0, 0];
let connected = false;
let lastReportAt = 0;

/** What one state report says, in the standard gamepad layout. */
export interface SteamPadState {
  buttons: boolean[];
  /** LT and RT, 0…1 */
  lt: number;
  rt: number;
  /** left (move) and right (aim) sticks, −1…1, y down */
  axes: [number, number, number, number];
}

const le16 = (d: Uint8Array, i: number): number => {
  const v = d[i]! | (d[i + 1]! << 8);
  return v >= 0x8000 ? v - 0x10000 : v;
};
const norm = (v: number): number => Math.max(-1, Math.min(1, v / 32767));
const bit = (b: number, n: number): boolean => (b & (1 << n)) !== 0;

/**
 * Parse one 64-byte report (starting 0x01 0x00, then its type) into the standard layout, or null for any other
 * report (connection, battery). `prevStick` keeps the left stick steady while the original controller reports its
 * left trackpad in the same bytes.
 */
export function parseSteamReport(d: Uint8Array, prevStick: [number, number] = [0, 0]): SteamPadState | null {
  if (d.length < 24 || d[0] !== 0x01 || d[1] !== 0x00) return null;
  const type = d[2];
  const b8 = d[8]!;
  const b9 = d[9]!;
  const b10 = d[10]!;
  const buttons = new Array<boolean>(BUTTONS).fill(false);
  // shared by both layouts: A B X Y, bumpers, the digital triggers, View / Steam / Menu, the left pad's four corners
  buttons[0] = bit(b8, 7); // A
  buttons[1] = bit(b8, 5); // B
  buttons[2] = bit(b8, 6); // X
  buttons[3] = bit(b8, 4); // Y
  buttons[4] = bit(b8, 3); // LB
  buttons[5] = bit(b8, 2); // RB
  buttons[8] = bit(b9, 4); // View (Back)
  buttons[9] = bit(b9, 6); // Menu (Start)
  buttons[12] = bit(b9, 0); // D-pad up (the left pad pressed at the top)
  buttons[15] = bit(b9, 1); // right
  buttons[14] = bit(b9, 2); // left
  buttons[13] = bit(b9, 3); // down
  buttons[16] = bit(b9, 5); // Steam
  if (type === 0x01) {
    // the original Steam Controller
    if (d.length < 24) return null;
    let lt = d[11]! / 255;
    let rt = d[12]! / 255;
    if (bit(b8, 1)) lt = Math.max(lt, 1);
    if (bit(b8, 0)) rt = Math.max(rt, 1);
    buttons[6] = lt > 0.5;
    buttons[7] = rt > 0.5;
    buttons[10] = bit(b10, 6); // stick click
    buttons[11] = bit(b10, 2); // right pad click
    // the back grips have no place in the standard layout (and rebinding covers buttons 0–15): left alone
    const lpadTouched = bit(b10, 3);
    const lpadAndJoy = bit(b10, 7);
    // bytes 16–19 carry the stick, or the left pad while it is touched (alternating when both are in use)
    let lx = prevStick[0];
    let ly = prevStick[1];
    if (!lpadTouched) {
      lx = norm(le16(d, 16));
      ly = -norm(le16(d, 18));
    } else if (!lpadAndJoy) {
      lx = 0;
      ly = 0;
    }
    // the right pad aims while it is touched
    const rpadTouched = bit(b10, 4);
    const rx = rpadTouched ? norm(le16(d, 20)) : 0;
    const ry = rpadTouched ? -norm(le16(d, 22)) : 0;
    return { buttons, lt, rt, axes: [lx, ly, rx, ry] };
  }
  if (type === 0x09) {
    // the Steam Deck family: real sticks at 48–55, 16-bit triggers at 44 / 46
    if (d.length < 56) return null;
    const b11 = d[11]!;
    const b13 = d[13]!;
    let lt = Math.max(0, le16(d, 44)) / 32767;
    let rt = Math.max(0, le16(d, 46)) / 32767;
    if (bit(b8, 1)) lt = Math.max(lt, 1);
    if (bit(b8, 0)) rt = Math.max(rt, 1);
    buttons[6] = lt > 0.5;
    buttons[7] = rt > 0.5;
    buttons[10] = bit(b10, 6); // left stick click
    buttons[11] = bit(b11, 2); // right stick click
    void b13; // the back buttons (b9 bit 7, b10 bit 0, b13 bits 1–2): left alone, as on the original
    return { buttons, lt, rt, axes: [norm(le16(d, 48)), -norm(le16(d, 50)), norm(le16(d, 52)), -norm(le16(d, 54))] };
  }
  return null;
}

/** The new Steam Controller's state report (D206): numbered 0x42 (66) and sent through its "Puck" receiver (28de:1304). */
export const TRITON_STATE_REPORT = 0x42;

/**
 * The new Steam Controller (2026) through its Puck: report 0x42, read without its id byte. Byte 0 counts reports, bytes
 * 1–8 are the buttons (the Steam Deck's 64-bit order, as far as seen), then the sticks as signed 16-bit values at 9, 11,
 * 13 and 15 (up positive) and the triggers at 17 and 19. Worked out from the controller's own reports (the readout in
 * Settings → Gamepad); buttons and stick signs to be confirmed on the hardware.
 */
export function parseTritonReport(r: Uint8Array): SteamPadState | null {
  if (r.length < 21) return null;
  const b = (byte: number, n: number): boolean => bit(r[byte]!, n);
  const buttons = new Array<boolean>(BUTTONS).fill(false);
  buttons[0] = b(1, 7); // A
  buttons[1] = b(1, 5); // B
  buttons[2] = b(1, 6); // X
  buttons[3] = b(1, 4); // Y
  buttons[4] = b(1, 3); // LB
  buttons[5] = b(1, 2); // RB
  buttons[12] = b(2, 0); // D-pad up
  buttons[15] = b(2, 1); // right
  buttons[14] = b(2, 2); // left
  buttons[13] = b(2, 3); // down
  buttons[8] = b(2, 4); // View
  buttons[16] = b(2, 5); // Steam
  buttons[9] = b(2, 6); // Menu
  buttons[10] = b(3, 6); // left stick click
  buttons[11] = b(4, 2); // right stick click
  let lt = Math.max(0, le16(r, 17)) / 32767;
  let rt = Math.max(0, le16(r, 19)) / 32767;
  if (b(1, 1)) lt = Math.max(lt, 1);
  if (b(1, 0)) rt = Math.max(rt, 1);
  lt = Math.min(1, lt);
  rt = Math.min(1, rt);
  buttons[6] = lt > 0.5;
  buttons[7] = rt > 0.5;
  return { buttons, lt, rt, axes: [norm(le16(r, 9)), -norm(le16(r, 11)), norm(le16(r, 13)), -norm(le16(r, 15))] };
}

/** Apply one parsed report to the pad the input manager reads. */
export function applySteamState(s: SteamPadState, now = performance.now()): void {
  for (let i = 0; i < BUTTONS; i++) {
    pressed[i] = s.buttons[i]!;
    values[i] = s.buttons[i] ? 1 : 0;
  }
  values[6] = s.lt;
  values[7] = s.rt;
  axes[0] = s.axes[0];
  axes[1] = s.axes[1];
  axes[2] = s.axes[2];
  axes[3] = s.axes[3];
  connected = true;
  lastReportAt = now;
}

/** The Steam Controller as the Gamepad API would show it, or null when none is open (or it went quiet for 2 s). */
export function steamGamepad(now = performance.now()): Gamepad | null {
  if (!connected || now - lastReportAt > 2000) return null;
  return {
    id: STEAM_PAD_ID,
    index: 98,
    connected: true,
    mapping: 'standard',
    timestamp: lastReportAt,
    axes: [...axes],
    buttons: pressed.map((p, i) => ({ pressed: p, touched: p, value: values[i]! })),
    hapticActuator: null,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

// ---------------------------------------------------------------- WebHID

/* The WebHID types are not in TypeScript's DOM library everywhere; only what this file uses. */
interface HidReportInfo {
  reportId: number;
  items?: { reportSize: number; reportCount: number }[];
}
interface HidDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: { usagePage: number; featureReports?: HidReportInfo[]; outputReports?: HidReportInfo[] }[];
  open(): Promise<void>;
  sendFeatureReport(id: number, data: BufferSource): Promise<void>;
  addEventListener(t: 'inputreport', f: (e: { data: DataView; reportId: number }) => void): void;
}
interface Hid {
  getDevices(): Promise<HidDevice[]>;
  requestDevice(o: { filters: { vendorId: number; usagePage?: number }[] }): Promise<HidDevice[]>;
  addEventListener(t: 'disconnect', f: (e: { device: HidDevice }) => void): void;
}
const hid = (): Hid | null => (typeof navigator !== 'undefined' && 'hid' in navigator ? ((navigator as unknown as { hid: Hid }).hid ?? null) : null);

/** WebHID is there (Chrome, Edge, Opera on a computer; not Firefox or Safari). */
export function steamControllerSupported(): boolean {
  return !!hid();
}

const opened = new Set<HidDevice>();
let heartbeat: ReturnType<typeof setInterval> | null = null;

/** What the driver has seen (Settings → Gamepad shows it live): enough to tell what a controller actually sends. */
export interface SteamDiag {
  devices: { name: string; ids: string; pages: string; opened: boolean; note: string }[];
  /** reports seen per type byte (hex), and the newest one's first 32 bytes */
  types: Record<string, number>;
  lastReportId: number;
  lastBytes: string;
  lastLength: number;
  parsed: number;
  featureError: string;
  /** the controller's own command reports (feature / output ids and their sizes) and which ones took the mouse-off */
  featureIds: string;
  outputIds: string;
  featureOk: string;
  /** the newest state report, decoded: buttons as hex, sticks and triggers as raw numbers */
  buttonsHex: string;
  rawAxes: string;
}
const diag: SteamDiag = { devices: [], types: {}, lastReportId: 0, lastBytes: '', lastLength: 0, parsed: 0, featureError: '', featureIds: '', outputIds: '', featureOk: '', buttonsHex: '', rawAxes: '' };
export function steamDiag(): SteamDiag {
  return diag;
}
const hex = (b: Uint8Array, n = 32): string => [...b.slice(0, n)].map((x) => x.toString(16).padStart(2, '0')).join(' ');
const noteDevice = (d: HidDevice, opened: boolean, note: string): void => {
  const ids = `${d.vendorId.toString(16).padStart(4, '0')}:${d.productId.toString(16).padStart(4, '0')}`;
  const pages = d.collections.map((c) => c.usagePage.toString(16)).join(',');
  const row = diag.devices.find((x) => x.ids === ids && x.pages === pages);
  if (row) Object.assign(row, { opened, note });
  else diag.devices.push({ name: d.productName, ids, pages, opened, note });
};

/** The vendor interface (usage page 0xFF00) is the one that carries the controller's state. */
const isVendorInterface = (d: HidDevice): boolean => d.vendorId === VALVE_VENDOR_ID && d.collections.some((c) => c.usagePage >= 0xff00);

/** Lizard mode off: clear the keyboard / mouse mappings and set both pads to report only (hid-steam's commands). */
const reportBytes = (r: HidReportInfo): number => Math.ceil((r.items ?? []).reduce((t, it) => t + it.reportSize * it.reportCount, 0) / 8) || 63;
/** the feature report id that took the commands last time, per device */
const goodFeature = new Map<HidDevice, number>();

async function lizardOff(d: HidDevice): Promise<void> {
  // a controller that numbers its reports (the Puck) takes commands only on its own feature report ids
  const declared = d.collections.flatMap((c) => c.featureReports ?? []);
  const known = goodFeature.get(d);
  const tries: { id: number; len: number }[] = known !== undefined
    ? [{ id: known, len: reportBytes(declared.find((r) => r.reportId === known) ?? { reportId: known }) }]
    : declared.length ? declared.map((r) => ({ id: r.reportId, len: reportBytes(r) })) : [{ id: 0, len: 64 }];
  const payload = (len: number, bytes: number[]): Uint8Array<ArrayBuffer> => {
    const out = new Uint8Array(new ArrayBuffer(Math.max(len, bytes.length)));
    out.set(bytes);
    return out;
  };
  const errors: string[] = [];
  for (const t of tries) {
    try {
      await d.sendFeatureReport(t.id, payload(t.len, [0x81])); // clear digital mappings
      // settings: left pad mode none (0x07), right pad mode none (0x08), right pad margin 0 (0x18)
      await d.sendFeatureReport(t.id, payload(t.len, [0x87, 9, 0x07, 0x07, 0x00, 0x08, 0x07, 0x00, 0x18, 0x00, 0x00]));
      goodFeature.set(d, t.id);
      diag.featureOk = `report ${t.id}`;
      diag.featureError = '';
      return;
    } catch (err) {
      errors.push(`${t.id}: ${String((err as Error)?.message ?? err).slice(0, 60)}`);
    }
  }
  // some firmware refuses; the state reports still arrive, the pad just keeps moving the mouse too
  goodFeature.delete(d);
  diag.featureOk = '';
  diag.featureError = errors.join('; ').slice(0, 240);
}

async function openDevice(d: HidDevice): Promise<boolean> {
  if (opened.has(d)) return false;
  if (!isVendorInterface(d)) {
    noteDevice(d, false, 'not the controller interface');
    return false;
  }
  try {
    if (!d.opened) await d.open();
  } catch (err) {
    noteDevice(d, false, `could not open: ${String((err as Error)?.message ?? err).slice(0, 80)}`);
    return false;
  }
  noteDevice(d, true, 'open');
  const ids = (k: 'featureReports' | 'outputReports'): string => d.collections.flatMap((c) => c[k] ?? []).map((r) => `${r.reportId}(${reportBytes(r)}b)`).join(' ');
  diag.featureIds = ids('featureReports');
  diag.outputIds = ids('outputReports');
  opened.add(d);
  let stick: [number, number] = [0, 0];
  d.addEventListener('inputreport', (e) => {
    const raw = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
    // a numbered report arrives without its id byte; put the layout back where the parser expects it
    const bytes = e.reportId ? Uint8Array.of(e.reportId, ...raw) : raw;
    const at = bytes[0] === 0x01 && bytes[1] === 0x00 ? bytes : raw[0] === 0x01 && raw[1] === 0x00 ? raw : null;
    const type = at ? at[2]!.toString(16) : `id${e.reportId}`;
    diag.types[type] = (diag.types[type] ?? 0) + 1;
    diag.lastReportId = e.reportId;
    diag.lastLength = raw.length;
    diag.lastBytes = hex(raw);
    // the new controller's numbered state report (D206)
    if (e.reportId === TRITON_STATE_REPORT) {
      diag.buttonsHex = hex(raw.slice(1, 9), 8);
      diag.rawAxes = [9, 11, 13, 15, 17, 19].map((i) => le16(raw, i)).join(' ');
      const t = parseTritonReport(raw);
      if (t) {
        diag.parsed++;
        applySteamState(t);
      }
      return;
    }
    if (!at) return;
    const s = parseSteamReport(at, stick);
    if (!s) return;
    diag.parsed++;
    stick = [s.axes[0], s.axes[1]];
    applySteamState(s);
  });
  await lizardOff(d);
  // the controller drifts back into lizard mode by itself after a while: say it again every few seconds
  heartbeat ??= setInterval(() => {
    for (const x of opened) void lizardOff(x);
  }, 3000);
  return true;
}

/** Reopen any Steam Controller this site was allowed before (on load: no prompt). */
export async function reconnectSteamControllers(): Promise<number> {
  const h = hid();
  if (!h) return 0;
  let n = 0;
  try {
    for (const d of await h.getDevices()) if (await openDevice(d)) n++;
  } catch {
    // WebHID blocked by a permissions policy
  }
  return n;
}

/** Ask for a Steam Controller (needs a click: the browser shows its own device picker). Returns how many opened. */
export async function connectSteamController(): Promise<number> {
  const h = hid();
  if (!h) return 0;
  let n = 0;
  try {
    const picked = await h.requestDevice({ filters: [{ vendorId: VALVE_VENDOR_ID }] });
    for (const d of picked) if (await openDevice(d)) n++;
    // the picker hands over one interface; its siblings (the vendor one among them) are allowed with it
    n += await reconnectSteamControllers();
  } catch {
    // the player closed the picker
  }
  return n;
}

let watching = false;
/** Forget a controller that was unplugged. */
export function watchSteamDisconnects(): void {
  const h = hid();
  if (!h || watching) return;
  watching = true;
  h.addEventListener('disconnect', (e) => {
    opened.delete(e.device);
    if (!opened.size) {
      connected = false;
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = null;
    }
  });
}

/** True when a Steam Controller is open and talking. */
export function steamControllerConnected(now = performance.now()): boolean {
  return connected && now - lastReportAt <= 2000;
}
