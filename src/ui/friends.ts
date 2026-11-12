// Friends (GAME_DESIGN §12.1, D339): the Friends screen (title menu and the host's lobby), the lobby's invite list,
// and the invite card that turns up on any screen when a friend invites you.
import { playSfx } from '../engine/audio/sfx';
import { ZONES } from '../data/zones';
import { formatFriendCode } from '../game/net/friendCode';
import { friends } from '../game/net/friends';
import type { FriendStatus, FriendView, IncomingInvite } from '../game/net/presence';
import { btn, clearEl, focusFirst, h, layer, markFocus, restoreFocus, toast, uiRoot } from './dom';

const STATUS_TEXT: Record<FriendStatus, string> = {
  menu: 'Online, in the menus',
  solo: 'Playing solo',
  hosting: 'Hosting a lobby',
  coop: 'In a co-op game',
};

type Row = FriendView & { savedName: string };

/** A "N s" countdown that tickCountdowns keeps current without rebuilding the menu around it. */
function countdown(until: number, pre = ''): HTMLElement {
  return h('span', { 'data-until': String(until), 'data-pre': pre }, `${pre}${Math.max(0, Math.ceil((until - Date.now()) / 1000))} s`);
}

function tickCountdowns(scope: HTMLElement): void {
  for (const el of scope.querySelectorAll<HTMLElement>('[data-until]')) {
    const left = Math.max(0, Math.ceil((Number(el.dataset.until) - Date.now()) / 1000));
    el.textContent = `${el.dataset.pre ?? ''}${left} s`;
  }
}

/** Everything a friends view shows except the countdowns: when it is unchanged, only the countdowns move. */
function signature(): string {
  const f = friends();
  const rows = f.views().map((v) => [v.code, v.online, v.name, v.savedName, v.status, v.version, v.invite?.id, v.invite?.state]);
  return JSON.stringify([f.book.data.appearOnline, rows, f.incoming().map((i) => i.id)]);
}

export function friendName(v: { code: string; name: string; savedName?: string }): string {
  return v.name || v.savedName || `Friend ${formatFriendCode(v.code).slice(0, 5)}`;
}

/** What the host's lobby lends the friends UI so it can send invites. */
export interface LobbyInvite {
  room: () => string | null;
  zone: number;
  hostName: string;
  full: () => boolean;
}

/** Why a friend cannot be invited right now (null: they can). Offline friends can be: the invite waits (D351). */
function cannotInvite(v: Row, lobby: LobbyInvite): string | null {
  if (v.online && v.version && v.version !== __GAME_VERSION__) return 'Other version';
  if (v.online && v.status === 'coop') return 'In a game';
  const inv = v.invite;
  if (inv?.state === 'queued') return 'Invited · when online';
  if (inv?.state === 'sent' && inv.expiresAt > Date.now()) return 'Invited';
  if (inv?.state === 'accepted') return 'Joining…';
  if (lobby.full()) return 'Party full';
  return null;
}

function sendInvite(v: Row, lobby: LobbyInvite): boolean {
  const room = lobby.room();
  const p = friends().presence;
  return !!room && !!p && p.invite(v.code, room, lobby.zone, lobby.hostName);
}

function inviteControl(v: Row, lobby: LobbyInvite): HTMLElement | null {
  const inv = v.invite;
  const why = cannotInvite(v, lobby);
  if (why === 'Invited' && inv) return btn(countdown(inv.expiresAt, 'Invited · '), () => undefined, 'tiny', true);
  if (why) {
    const off = btn(why, () => undefined, 'tiny', true);
    off.setAttribute('data-testid', `invite-${v.code}`);
    return off;
  }
  const note = inv?.state === 'declined' ? 'declined' : inv?.state === 'busy' ? 'busy' : inv?.state === 'expired' ? 'no answer' : '';
  const b = btn(
    'Invite',
    () => {
      if (sendInvite(v, lobby)) {
        playSfx('uiConfirm');
        toast(v.online ? `Invited ${friendName(v)}.` : `${friendName(v)} gets the invite when they come online.`, 2600);
      }
    },
    'tiny primary',
  );
  b.setAttribute('data-testid', `invite-${v.code}`);
  b.setAttribute('data-focus', `invite-${v.code}`);
  return note ? h('span', { class: 'row', style: 'gap:6px' }, h('span', { class: 'small dim-text' }, note), b) : b;
}

function friendRow(v: Row, extra: (HTMLElement | null)[]): HTMLElement {
  const status = v.online ? (v.status ? STATUS_TEXT[v.status] : 'Online') : 'Offline';
  return h(
    'div',
    { class: 'card row', 'data-testid': `friend-${v.code}`, 'data-online': v.online ? '1' : '0', style: 'padding:6px 10px' },
    h('span', { class: `friend-dot${v.online ? ' on' : ''}` }),
    h('div', { class: 'grow' }, h('div', null, h('b', null, friendName(v))), h('div', { class: 'small dim-text' }, `${status} · ${formatFriendCode(v.code)}`)),
    ...extra,
  );
}

/** The lobby's "Invite friends" box: every friend (online first), each with an Invite button, and Invite all. */
export function fillLobbyInvites(box: HTMLElement, lobby: LobbyInvite, force = false): void {
  const sig = `${signature()}|${lobby.full()}`;
  if (!force && box.dataset.sig === sig) {
    tickCountdowns(box);
    return;
  }
  box.dataset.sig = sig;
  const mark = markFocus(box);
  clearEl(box);
  const f = friends();
  const rows = f.views();
  if (!f.book.data.appearOnline) box.appendChild(h('div', { class: 'small dim-text' }, 'You are hidden from friends (Friends → Appear online).'));
  else if (!rows.length) box.appendChild(h('div', { class: 'small dim-text' }, 'No friends yet: add their friend code under Friends.'));
  else {
    const open = rows.filter((r) => !cannotInvite(r, lobby));
    const all = btn(
      'Invite all',
      () => {
        const n = open.filter((r) => sendInvite(r, lobby)).length;
        if (!n) return;
        playSfx('uiConfirm');
        toast(n === 1 ? 'Invited 1 friend.' : `Invited ${n} friends. Offline friends get it when they come online.`, 2800);
      },
      'tiny',
      open.length === 0,
    );
    all.setAttribute('data-testid', 'invite-all');
    all.setAttribute('data-focus', 'invite-all');
    box.appendChild(h('div', { class: 'row' }, h('div', { class: 'small dim-text grow' }, rows.some((r) => r.online) ? '' : 'None of your friends is online; an invite waits for them.'), all));
    for (const r of rows) box.appendChild(friendRow(r, [inviteControl(r, lobby)]));
  }
  restoreFocus(box, mark);
}

/** The Friends screen. From the host's lobby it also has Invite buttons. Returns its layer. */
export function openFriends(onClose: () => void, opts: { lobby?: LobbyInvite } = {}): HTMLElement {
  const f = friends();
  f.ensureOnline();
  const root = layer('dim');
  root.setAttribute('data-testid', 'friends');
  const panel = h('div', { class: 'panel col', 'data-view': 'friends', style: 'min-width:560px;max-width:640px;gap:8px' });
  root.appendChild(panel);
  /** the friend whose Remove was pressed once (a second press removes) */
  let confirming: string | null = null;
  let error = '';
  let draft = '';

  const cleanup = (): void => {
    unsub();
    window.removeEventListener('keydown', onKey, true);
  };
  const close = (): void => {
    if (!root.isConnected) return;
    cleanup();
    root.remove();
    onClose();
  };
  function onKey(e: KeyboardEvent): void {
    // a scene that left took this screen with it
    if (!root.isConnected) return cleanup();
    if (e.code !== 'Escape') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    close();
  }
  window.addEventListener('keydown', onKey, true);

  const copy = (): void => {
    const text = formatFriendCode(f.book.me);
    const done = (): void => toast('Your friend code is copied.');
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => toast(text));
    else toast(text);
  };

  const render = (): void => {
    sig = `${signature()}|${opts.lobby?.full() ?? ''}`;
    const mark = markFocus(panel);
    const input = panel.querySelector<HTMLInputElement>('[data-testid=friend-code-input]');
    if (input) draft = input.value;
    clearEl(panel);
    const add = h('input', { type: 'text', maxlength: '16', placeholder: 'XXXXX-XXXXX', 'data-testid': 'friend-code-input', 'data-focus': 'friend-input', 'aria-label': 'A friend’s code', style: 'font-size:20px;letter-spacing:3px;width:220px;text-transform:uppercase' }) as HTMLInputElement;
    add.value = draft;
    const doAdd = (): void => {
      const r = f.add(add.value);
      if (r.ok) {
        draft = '';
        error = '';
        playSfx('uiConfirm');
        toast('Added. They show as online once they have added your code too.', 3200);
      } else {
        draft = add.value;
        error = r.error;
        playSfx('uiError');
      }
      render();
    };
    add.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doAdd();
    });
    const onlineBox = h('input', { type: 'checkbox', 'data-testid': 'appear-online' }) as HTMLInputElement;
    onlineBox.checked = f.book.data.appearOnline;
    onlineBox.addEventListener('change', () => f.setAppearOnline(onlineBox.checked));

    const list = h('div', { class: 'col', style: 'gap:6px;max-height:300px;overflow:auto', 'data-focus-group': 'friends' });
    const rows = f.views();
    if (!rows.length) list.appendChild(h('div', { class: 'dim-text small' }, 'No friends yet.'));
    for (const r of rows) {
      const rm =
        confirming === r.code
          ? btn('Remove?', () => {
              f.remove(r.code);
              confirming = null;
              toast(`Removed ${friendName(r)}.`);
              render();
            }, 'tiny danger')
          : btn('Remove', () => {
              confirming = r.code;
              render();
            }, 'tiny');
      rm.setAttribute('data-focus', `remove-${r.code}`);
      list.appendChild(friendRow(r, [opts.lobby ? inviteControl(r, opts.lobby) : null, rm]));
    }
    // D368: the commonest reason a friend never shows online is that they have not added this code back
    if (rows.length && f.book.data.appearOnline && rows.every((r) => !r.online)) {
      list.appendChild(h('div', { class: 'small dim-text', 'data-testid': 'friends-offline-hint' }, 'Nobody online? A friend only shows once they have added your code too (send it to them), and has the game open.'));
    }

    const invites = f.incoming().map((inv) => inviteCard(inv, false, close));
    panel.append(
      h('h2', null, 'Friends'),
      ...(invites.length ? [h('h3', null, 'Invites'), ...invites] : []),
      h(
        'div',
        { class: 'row' },
        h('div', { class: 'grow' }, h('div', { class: 'small dim-text' }, 'Your friend code'), h('div', { class: 'mono', 'data-testid': 'my-friend-code', style: 'font-size:24px;letter-spacing:3px;color:var(--accent)' }, formatFriendCode(f.book.me))),
        btn('Copy', copy, 'tiny'),
      ),
      h('div', { class: 'small dim-text', style: 'max-width:560px' }, 'Send your code to a friend and add theirs. You see each other once both of you have added the other; nobody else ever sees you online.'),
      h('div', { class: 'row' }, add, btn('Add friend', doAdd, 'primary')),
      ...(error ? [h('div', { class: 'small', style: 'color:var(--bad)', 'data-testid': 'friend-error' }, error)] : []),
      list,
      h('label', { class: 'row small' }, onlineBox, 'Appear online to friends'),
      ...(!f.book.data.appearOnline ? [h('div', { class: 'small dim-text' }, 'Hidden: you are not connected, so you see nobody online either.')] : []),
      btn('Back', close, 'big'),
    );
    if (!restoreFocus(panel, mark) && !mark) setTimeout(() => focusFirst(panel), 0);
  };
  let sig = '';
  const unsub = f.subscribe(() => {
    if (!root.isConnected) return cleanup();
    const s = `${signature()}|${opts.lobby?.full() ?? ''}`;
    if (s === sig) tickCountdowns(panel);
    else render();
  });
  render();
  return root;
}

// ------------------------------------------------------------------ the invite card

function inviteCard(inv: IncomingInvite, floating: boolean, joined: () => void = () => undefined): HTMLElement {
  const f = friends();
  const zone = ZONES[inv.zone - 1]?.name ?? `zone ${inv.zone}`;
  const join = btn('Join', () => {
    const r = f.accept(inv.id);
    if (r === 'busy') toast('Finish or leave your co-op game first.', 3000);
    else if (r === 'gone') toast('That invite is no longer open.');
    else {
      playSfx('uiConfirm');
      joined();
    }
  }, 'primary');
  join.setAttribute('data-testid', 'invite-join');
  const no = btn('Decline', () => f.decline(inv.id));
  no.setAttribute('data-testid', 'invite-decline');
  return h(
    'div',
    { class: floating ? 'invite-prompt col' : 'card col', 'data-testid': floating ? 'invite-prompt' : 'invite-row', style: 'gap:8px' },
    h('div', null, h('b', null, inv.name), ` invites you to co-op in their world (${zone}).`),
    h('div', { class: 'row' }, join, no, h('span', { class: 'small dim-text grow', style: 'text-align:right' }, countdown(inv.expiresAt))),
  );
}

let installed = false;

/** The invite card on any screen, and the host's toasts when an invite is answered. */
export function installInvitePrompt(): void {
  if (installed) return;
  installed = true;
  const f = friends();
  let el: HTMLElement | null = null;
  let shown = '';
  const draw = (): void => {
    // the Friends screen lists invites itself
    const inv = document.querySelector('[data-testid=friends]') ? undefined : f.incoming().pop();
    if (inv && el && shown === inv.id) {
      tickCountdowns(el);
      return;
    }
    el?.remove();
    el = null;
    shown = '';
    if (!inv) return;
    el = inviteCard(inv, true);
    shown = inv.id;
    uiRoot().appendChild(el);
  };
  f.onInvite = () => {
    playSfx('uiConfirm');
    draw();
  };
  f.onInviteGone = (inv, why) => {
    if (why === 'expired') toast(`The invite from ${inv.name} ran out.`);
    else toast(`${inv.name}’s invite is no longer open.`);
    draw();
  };
  f.onAnswer = (code, name, state) => {
    const who = name || friendName({ code, name: '', savedName: f.book.list.find((x) => x.code === code)?.name ?? '' });
    if (state === 'accepted') toast(`${who} is on the way.`);
    else if (state === 'busy') toast(`${who} is in a co-op game right now.`);
    else if (state === 'declined') toast(`${who} declined.`);
  };
  f.subscribe(draw);
}
