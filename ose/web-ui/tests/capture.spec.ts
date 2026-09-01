import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

mkdirSync(path.resolve('captures'), { recursive: true });
const expected: Array<[string,string]> = [
  ['session-prestart','CAPTURE_SESSION_PRESTART_415x915.png'],
  ['character-sheet','CAPTURE_CHARACTER_SHEET_415x915.png'],
  ['keyboard-open','CAPTURE_KEYBOARD_OPEN_415x915.png']
];
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');

for (const [fixture,file] of expected) {
  test(`${fixture} renders deterministically at 415x915`, async ({page}) => {
    await page.goto(`/?fixture=${fixture}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready','true');
    expect(await page.evaluate(() => [innerWidth,innerHeight])).toEqual([415,915]);
    expect(await page.locator('[data-canonical-asset]').count()).toBe(0);
    const first=await page.screenshot({fullPage:false});
    const second=await page.screenshot({fullPage:false});
    expect(digest(second)).toBe(digest(first));
    await page.screenshot({path:path.resolve('captures',file),fullPage:false});
  });
}

test('character sheet remains scrollable and unclipped horizontally', async ({page}) => {
  await page.goto('/?fixture=character-sheet');
  const metrics=await page.evaluate(() => ({scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('keyboard fixture keeps action dock above simulated keyboard', async ({page}) => {
  await page.goto('/?fixture=keyboard-open');
  const geometry=await page.evaluate(() => {
    const dock=document.getElementById('actionDock')!.getBoundingClientRect();
    const keyboard=document.querySelector('.keyboard-sim')!.getBoundingClientRect();
    return {dockBottom:dock.bottom,keyboardTop:keyboard.top,textareaVisible:!!document.getElementById('playerAction')};
  });
  expect(geometry.textareaVisible).toBeTruthy();
  expect(geometry.dockBottom).toBeLessThanOrEqual(geometry.keyboardTop + 1);
});

test('bridge schema rejects wrong versions in web contract', async ({page}) => {
  await page.goto('/?fixture=session-prestart');
  const result=await page.evaluate(async () => {
    const m=await import('./bridge.js');
    return [m.isBridgeEnvelope({version:1,type:'ViewState',payload:{}}),m.isBridgeEnvelope({version:2,type:'ViewState',payload:{}}),m.isBridgeEnvelope({version:1,type:'RulesEngine',payload:{}})];
  });
  expect(result).toEqual([true,false,false]);
});
