import { describe, expect, it } from 'vitest';
import { newWorldState } from '../../src/game/save/schema';
import { noteShopGemBought, rollShopPiece, shopGem, shopGemBuys, shopPiece } from '../../src/game/bonfire/shop';
import { gemTitle } from '../../src/data/gems';

// D357: the shop's gem and rotating piece change only when bought or in a new zone; each zone has its own
describe('shop stock (D357)', () => {
  it('the rotating piece stays across rests and bonfires until it is bought', () => {
    const ws = newWorldState('shop-seed');
    const a = shopPiece(ws, 1, 0);
    for (let i = 0; i < 5; i++) expect(shopPiece(ws, 1, 0)).toBe(a); // rests change nothing
    const b = rollShopPiece(ws, 1, 0); // the purchase rolls the next one
    expect(b).not.toBe(a);
    expect(shopPiece(ws, 1, 0)).toBe(b);
  });

  it('each zone and each cycle has its own piece', () => {
    const ws = newWorldState('shop-seed');
    const z1 = shopPiece(ws, 1, 0);
    const z2 = shopPiece(ws, 2, 0);
    const ng = shopPiece(ws, 1, 1);
    expect(new Set([z1.id, z2.id, ng.id]).size).toBe(3);
    expect(shopPiece(ws, 1, 0)).toBe(z1);
    expect(Object.keys(ws.shopStock).sort()).toEqual(['z1c0', 'z1c1', 'z2c0']);
  });

  it('the shop gem is the same until bought, then the next one, per zone', () => {
    const ws = newWorldState('shop-seed');
    const first = gemTitle(shopGem(ws.seed, 3, 0, shopGemBuys(ws, 3, 0)));
    expect(gemTitle(shopGem(ws.seed, 3, 0, shopGemBuys(ws, 3, 0)))).toBe(first);
    noteShopGemBought(ws, 3, 0);
    expect(shopGemBuys(ws, 3, 0)).toBe(1);
    expect(shopGemBuys(ws, 4, 0)).toBe(0);
    const titles = new Set<string>();
    for (let n = 0; n < 8; n++) titles.add(JSON.stringify(shopGem(ws.seed, 3, 0, n).perks));
    expect(titles.size).toBeGreaterThan(3); // the sequence does not repeat one gem
    // the zone's first gem is unchanged from before D357
    expect(JSON.stringify(shopGem(ws.seed, 3, 0, 0).perks)).toBe(JSON.stringify(shopGem(ws.seed, 3, 0).perks));
  });

  it('a stocked piece survives a save round trip', () => {
    const ws = newWorldState('shop-seed');
    const a = shopPiece(ws, 2, 0);
    const back = JSON.parse(JSON.stringify(ws)) as typeof ws;
    expect(shopPiece(back, 2, 0).id).toBe(a.id);
  });
});
