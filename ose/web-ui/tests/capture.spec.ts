import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
mkdirSync(path.resolve('captures'),{recursive:true});

const TOL=4, SIZE_TOL=6;
type Box={x:number,y:number,w:number,h:number};
const P:Record<string,Box>={
  pre_header_logo:{x:18,y:6,w:105,h:52}, pre_prep:{x:40,y:159,w:229,h:292}, pre_start:{x:168,y:496,w:78,h:45},
  pre_party:{x:311,y:158,w:39,h:39}, pre_map:{x:311,y:223,w:39,h:39}, pre_dice:{x:311,y:289,w:39,h:39}, pre_bag:{x:311,y:355,w:39,h:39},
  pre_action:{x:74,y:591,w:82,h:49}, pre_tts:{x:246,y:579,w:58,h:57}, pre_gm:{x:257,y:646,w:78,h:48},
  act_header_logo:{x:18,y:6,w:105,h:52}, act_light:{x:22,y:82,w:53,h:46}, act_move:{x:103,y:82,w:53,h:46}, act_dice:{x:183,y:82,w:53,h:46}, act_party:{x:263,y:82,w:53,h:46},
  act_narration:{x:29,y:153,w:313,h:168}, act_tts:{x:357,y:158,w:40,h:39}, act_action:{x:95,y:363,w:122,h:171}, act_send:{x:192,y:498,w:57,h:36}, act_gm:{x:317,y:440,w:65,h:39},
  act_qmap:{x:28,y:579,w:40,h:34}, act_qsheet:{x:122,y:579,w:40,h:34}, act_qdice:{x:216,y:579,w:40,h:34}, act_qbag:{x:309,y:579,w:40,h:34}
};
async function assertAllImagesLoaded(page:any){const bad=await page.locator('img:visible').evaluateAll((imgs:HTMLImageElement[])=>imgs.filter(i=>!i.complete||i.naturalWidth<=0||i.naturalHeight<=0).map(i=>i.getAttribute('src')));expect(bad,'broken visible images').toEqual([])}
function networkGuard(page:any){const failures:string[]=[];page.on('requestfailed',(r:any)=>{if(r.url().includes('/assets/')||r.url().endsWith('.js'))failures.push(`requestfailed ${r.url()}`)});page.on('response',(r:any)=>{if(r.status()===404&&(r.url().includes('/assets/')||r.url().endsWith('.js')))failures.push(`404 ${r.url()}`)});return()=>expect(failures,'local asset/module failures').toEqual([])}
async function box(page:any,anchor:string){return await page.locator(`[data-anchor="${anchor}"]`).evaluate((e:HTMLElement)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})}
async function expectBox(page:any,anchor:string,target:Box){const b=await box(page,anchor);expect(Math.abs(b.x-target.x),`${anchor}.x ${b.x} vs ${target.x}`).toBeLessThanOrEqual(TOL);expect(Math.abs(b.y-target.y),`${anchor}.y ${b.y} vs ${target.y}`).toBeLessThanOrEqual(TOL);expect(Math.abs(b.w-target.w),`${anchor}.w ${b.w} vs ${target.w}`).toBeLessThanOrEqual(SIZE_TOL);expect(Math.abs(b.h-target.h),`${anchor}.h ${b.h} vs ${target.h}`).toBeLessThanOrEqual(SIZE_TOL)}
async function noOverflow(page:any){expect(await page.evaluate(()=>document.documentElement.scrollHeight>915||document.documentElement.scrollWidth>415)).toBeFalsy()}

test('PRESTART exact OSE concept geometry',async({page})=>{
  const check=networkGuard(page);await page.goto('/?fixture=session-prestart');await expect(page.locator('body')).toHaveAttribute('data-ready','true');expect(await page.evaluate(()=>[innerWidth,innerHeight])).toEqual([415,915]);await assertAllImagesLoaded(page);
  await expectBox(page,'header_logo',P.pre_header_logo);await expectBox(page,'prep_panel',P.pre_prep);await expectBox(page,'start_cta',P.pre_start);await expectBox(page,'rail_party',P.pre_party);await expectBox(page,'rail_map',P.pre_map);await expectBox(page,'rail_dice',P.pre_dice);await expectBox(page,'rail_bag',P.pre_bag);await expectBox(page,'player_action',P.pre_action);await expectBox(page,'tts_control',P.pre_tts);await expectBox(page,'gm_help',P.pre_gm);
  await expect(page.getByText('NOVA SESSÃO')).toBeVisible();await expect(page.getByText('PREPARAÇÃO DA SESSÃO')).toBeVisible();await expect(page.getByText('COMEÇAR A NARRAR')).toBeVisible();await noOverflow(page);check();await page.screenshot({path:path.resolve('captures/SESSION_PRESTART_REAL_415x915.png')});
});

test('ACTIVE exact OSE concept geometry',async({page})=>{
  const check=networkGuard(page);await page.goto('/?fixture=session-active');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await assertAllImagesLoaded(page);
  await expectBox(page,'header_logo',P.act_header_logo);await expectBox(page,'status_light',P.act_light);await expectBox(page,'status_move',P.act_move);await expectBox(page,'status_dice',P.act_dice);await expectBox(page,'status_party',P.act_party);await expectBox(page,'narration_panel',P.act_narration);await expectBox(page,'tts_control',P.act_tts);await expectBox(page,'player_action_panel',P.act_action);await expectBox(page,'send_button',P.act_send);await expectBox(page,'gm_help',P.act_gm);await expectBox(page,'shortcut_map',P.act_qmap);await expectBox(page,'shortcut_sheet',P.act_qsheet);await expectBox(page,'shortcut_dice',P.act_qdice);await expectBox(page,'shortcut_bag',P.act_qbag);
  await expect(page.getByText('CRIPTA SOB O OUTEIRO')).toBeVisible();await expect(page.getByText('HISTÓRICO DA SESSÃO')).toBeVisible();await expect(page.locator('#playerAction')).toBeVisible();await noOverflow(page);check();await page.screenshot({path:path.resolve('captures/SESSION_ACTIVE_REAL_415x915.png')});
});

test('KEYBOARD keeps real PLAYER_ACTION and ENVIAR accessible',async({page})=>{
  const check=networkGuard(page);await page.goto('/?fixture=keyboard-open');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await assertAllImagesLoaded(page);
  const g=await page.evaluate(()=>{const a=document.querySelector('[data-anchor=player_action_panel]')!.getBoundingClientRect();const s=document.querySelector('[data-anchor=send_button]')!.getBoundingClientRect();const k=document.querySelector('.keyboard-sim')!.getBoundingClientRect();return{aTop:a.top,aBottom:a.bottom,sBottom:s.bottom,kTop:k.top,textarea:!!document.getElementById('playerAction')}});expect(g.textarea).toBeTruthy();expect(g.aTop).toBeGreaterThanOrEqual(0);expect(g.aBottom).toBeLessThanOrEqual(g.kTop);expect(g.sBottom).toBeLessThanOrEqual(g.kTop);check();await page.screenshot({path:path.resolve('captures/SESSION_KEYBOARD_REAL_415x915.png')});
});

test('debug 50 percent concept overlays',async({page})=>{
  await page.goto('/?fixture=session-prestart&conceptOverlay=1');await assertAllImagesLoaded(page);await expect(page.locator('.concept-overlay')).toBeVisible();await page.screenshot({path:path.resolve('captures/DEBUG_PRESTART_OVERLAY_50.png')});
  await page.goto('/?fixture=session-active&conceptOverlay=1');await assertAllImagesLoaded(page);await expect(page.locator('.concept-overlay')).toBeVisible();await page.screenshot({path:path.resolve('captures/DEBUG_ACTIVE_OVERLAY_50.png')});
});

test('bridge schema remains versioned',async({page})=>{await page.goto('/?fixture=session-prestart');const result=await page.evaluate(async()=>{const m=await import('./bridge.js');return[m.isBridgeEnvelope({version:1,type:'ViewState',payload:{}}),m.isBridgeEnvelope({version:2,type:'ViewState',payload:{}})]});expect(result).toEqual([true,false])});
