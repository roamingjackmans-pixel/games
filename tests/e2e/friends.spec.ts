import { expect, test, type Page } from '@playwright/test';
import { newFriendCode } from '../../src/game/net/friendCode';

// D339: friends over the same-browser BroadcastChannel transport (?net=bc). Each page gets its own friend code
// (&me=) and has the other on its list (&friends=). The host's lobby lists the guest online with an Invite button;
// the guest, on the title screen, gets the invite card, accepts, makes a character and lands in the host's game.

async function sceneName(p: Page): Promise<string> {
  return p.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? '');
}

test('a host invites an online friend from the lobby; the friend accepts and joins', async ({ context }) => {
  const a = newFriendCode();
  const b = newFriendCode();
  const host = await context.newPage();
  const guest = await context.newPage();
  const errors: string[] = [];
  for (const p of [host, guest]) p.on('pageerror', (e) => errors.push(String(e)));
  await host.goto(`./?net=bc&auto=host&code=616161&me=${a}&friends=${b}`);
  await guest.goto(`./?net=bc&me=${b}&friends=${a}`);
  await expect(guest.getByTestId('title')).toBeVisible();

  // the guest's Friends screen shows the host online and hosting
  await guest.getByRole('button', { name: /^Friends/ }).click();
  await expect(guest.getByTestId('friends')).toBeVisible();
  await expect(guest.getByTestId(`friend-${a}`)).toHaveAttribute('data-online', '1', { timeout: 10000 });
  await expect(guest.getByTestId(`friend-${a}`)).toContainText('Hosting a lobby');
  await guest.getByRole('button', { name: 'Back' }).click();

  // the host's lobby lists the guest with an Invite button
  const invite = host.getByTestId('lobby-friends').getByTestId(`invite-${b}`);
  await expect(invite).toBeVisible({ timeout: 10000 });
  await invite.click();
  await expect(host.getByTestId('lobby-friends')).toContainText('Invited');

  // the guest accepts; with no character yet, the creator opens and "Create and join" goes to the host's room
  await expect(guest.getByTestId('invite-prompt')).toBeVisible({ timeout: 10000 });
  await expect(guest.getByTestId('invite-prompt')).toContainText('Host Joe invites you');
  await guest.getByTestId('invite-join').click();
  await guest.getByTestId('create-start').click();
  await expect.poll(() => sceneName(host), { timeout: 20000 }).toBe('run');
  await expect.poll(() => sceneName(guest), { timeout: 20000 }).toBe('guestRun');
  expect(errors).toEqual([]);
});

test('a declined invite tells the host, and a friend can be added and removed on the Friends screen', async ({ context }) => {
  const a = newFriendCode();
  const b = newFriendCode();
  const host = await context.newPage();
  const guest = await context.newPage();
  const errors: string[] = [];
  for (const p of [host, guest]) p.on('pageerror', (e) => errors.push(String(e)));
  await host.goto(`./?net=bc&auto=host&code=626262&me=${a}&friends=${b}`);
  // the guest adds the host by typing the code on the Friends screen
  await guest.goto(`./?net=bc&me=${b}`);
  await guest.getByRole('button', { name: /^Friends/ }).click();
  await expect(guest.getByTestId('my-friend-code')).toHaveText(`${b.slice(0, 5)}-${b.slice(5)}`);
  await guest.getByTestId('friend-code-input').fill(b);
  await guest.getByRole('button', { name: 'Add friend' }).click();
  await expect(guest.getByTestId('friend-error')).toContainText('your own code');
  await guest.getByTestId('friend-code-input').fill(`${a.slice(0, 5).toLowerCase()} ${a.slice(5)}`);
  await guest.getByRole('button', { name: 'Add friend' }).click();
  await expect(guest.getByTestId(`friend-${a}`)).toHaveAttribute('data-online', '1', { timeout: 10000 });
  await guest.getByRole('button', { name: 'Back' }).click();

  await host.getByTestId('lobby-friends').getByTestId(`invite-${b}`).click();
  await guest.getByTestId('invite-decline').click();
  await expect(host.getByTestId('lobby-friends')).toContainText('declined', { timeout: 10000 });
  await expect(host.getByTestId('lobby-friends').getByTestId(`invite-${b}`)).toBeEnabled();

  // removing takes two presses, and the host then sees the guest go offline
  await guest.getByRole('button', { name: /^Friends/ }).click();
  await guest.getByTestId(`friend-${a}`).getByRole('button', { name: 'Remove' }).click();
  await guest.getByTestId(`friend-${a}`).getByRole('button', { name: 'Remove?' }).click();
  await expect(guest.getByTestId(`friend-${a}`)).toHaveCount(0);
  await expect(host.getByTestId('lobby-friends')).toContainText('None of your friends is online', { timeout: 10000 });
  expect(errors).toEqual([]);
});

test('an invite to an offline friend waits and reaches them when they open the game (D351)', async ({ context }) => {
  const a = newFriendCode();
  const b = newFriendCode();
  const host = await context.newPage();
  const errors: string[] = [];
  host.on('pageerror', (e) => errors.push(String(e)));
  await host.goto(`./?net=bc&auto=host&code=636363&me=${a}&friends=${b}`);
  // the friend is offline: still listed, and Invite all invites them
  const row = host.getByTestId('lobby-friends').getByTestId(`friend-${b}`);
  await expect(row).toHaveAttribute('data-online', '0', { timeout: 10000 });
  await host.getByTestId('invite-all').click();
  await expect(row).toContainText('when online');
  // they open the game later and the invite is waiting for them
  const guest = await context.newPage();
  guest.on('pageerror', (e) => errors.push(String(e)));
  await guest.goto(`./?net=bc&me=${b}&friends=${a}`);
  await expect(guest.getByTestId('invite-prompt')).toBeVisible({ timeout: 10000 });
  await expect(row).toContainText('Invited', { timeout: 10000 });
  await guest.getByTestId('invite-join').click();
  await guest.getByTestId('create-start').click();
  await expect.poll(() => sceneName(guest), { timeout: 20000 }).toBe('guestRun');
  expect(errors).toEqual([]);
});
