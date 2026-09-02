import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
mkdirSync(path.resolve('captures'),{recursive:true});

async function assertAllImagesLoaded(page:any){
  const bad=await page.locator('img:visible').evaluateAll((imgs:HTMLImageElement[])=>
    imgs.filter(i=>!i.complete||i.naturalWidth<=0||i.naturalHeight<=0).map(i=>i.getAttribute('src')));
  expect(bad,'broken visible images').toEqual([]);
}
function networkGuard(page:any){
  const failures:string[]=[];
  page.on('requestfailed',(r:any)=>{if(r.url().includes('/assets/')||r.url().endsWith('.js'))failures.push(`requestfailed ${r.url()}`)});
  page.on('response',(r:any)=>{if(r.status()===404&&(r.url().includes('/assets/')||r.url().endsWith('.js')))failures.push(`404 ${r.url()}`)});
  page.on('console',(m:any)=>{if(m.type()==='error'&&/(image|module|asset|404|failed)/i.test(m.text()))failures.push(`console ${m.text()}`)});
  return()=>expect(failures,'local asset/module failures').toEqual([]);
}

test('PRESTART approved composition is real DOM and fits 415x915',async({page})=>{
  const check=networkGuard(page);
  await page.goto('/?fixture=session-prestart');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>[innerWidth,innerHeight])).toEqual([415,915]);
  await assertAllImagesLoaded(page);
  await expect(page.locator('.company-panel')).toBeVisible();
  await expect(page.locator('.party-card')).toHaveCount(4);
  await expect(page.locator('#openingNarrative')).toBeVisible();
  await expect(page.getByText('MESTRE COMEÇAR A NARRAR')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollHeight>915||document.documentElement.scrollWidth>415);
  expect(overflow).toBeFalsy();
  check();
  await page.screenshot({path:path.resolve('captures/SESSION_PRESTART_REAL_415x915.png')});
});

test('ACTIVE approved composition is real DOM and fits 415x915',async({page})=>{
  const check=networkGuard(page);
  await page.goto('/?fixture=session-active');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>[innerWidth,innerHeight])).toEqual([415,915]);
  await assertAllImagesLoaded(page);
  await expect(page.locator('.status-box')).toHaveCount(4);
  await expect(page.locator('.dungeon-context')).toBeVisible();
  await expect(page.locator('.dungeon-tile')).toHaveCount(5);
  await expect(page.locator('.party-marker')).toHaveCount(4);
  await expect(page.locator('#playerAction')).toBeVisible();
  await expect(page.getByText('NARRAR (TTS)')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollHeight>915||document.documentElement.scrollWidth>415);
  expect(overflow).toBeFalsy();
  check();
  await page.screenshot({path:path.resolve('captures/SESSION_ACTIVE_REAL_415x915.png')});
});

test('KEYBOARD keeps PLAYER_ACTION accessible',async({page})=>{
  const check=networkGuard(page);
  await page.goto('/?fixture=keyboard-open');
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  await assertAllImagesLoaded(page);
  const g=await page.evaluate(()=>{
    const a=document.querySelector('[data-anchor=player_action_panel]')!.getBoundingClientRect();
    const k=document.querySelector('.keyboard-sim')!.getBoundingClientRect();
    const n=document.querySelector('nav')!.getBoundingClientRect();
    return {aTop:a.top,aBottom:a.bottom,kTop:k.top,navW:n.width,textarea:!!document.getElementById('playerAction')};
  });
  expect(g.textarea).toBeTruthy();
  expect(g.aTop).toBeGreaterThanOrEqual(0);
  expect(g.aBottom).toBeLessThanOrEqual(g.kTop);
  expect(g.navW).toBe(0);
  check();
  await page.screenshot({path:path.resolve('captures/SESSION_KEYBOARD_REAL_415x915.png')});
});

test('canonical party tokens are actually used',async({page})=>{
  await page.goto('/?fixture=session-prestart');
  const srcs=await page.locator('.party-token').evaluateAll((imgs:HTMLImageElement[])=>imgs.map(i=>i.getAttribute('src')));
  expect(srcs).toEqual([
    './assets/040_token_guerreiro.png',
    './assets/042_token_arqueiro.png',
    './assets/041_token_mago.png',
    './assets/043_token_ladrao.png'
  ]);
});

test('bridge schema remains versioned',async({page})=>{
  await page.goto('/?fixture=session-prestart');
  const result=await page.evaluate(async()=>{const m=await import('./bridge.js');return[m.isBridgeEnvelope({version:1,type:'ViewState',payload:{}}),m.isBridgeEnvelope({version:2,type:'ViewState',payload:{}})]});
  expect(result).toEqual([true,false]);
});
