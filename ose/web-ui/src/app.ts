import { fixtures, type FixtureId, FIXED_CLOCK, FIXTURE_REVISION } from './fixtures.js';
import { BRIDGE_VERSION, postBridge } from './bridge.js';

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c)); }
function queryFixture(): FixtureId {
  const value = new URLSearchParams(location.search).get('fixture') as FixtureId | null;
  return value && value in fixtures ? value : 'session-prestart';
}

function shell(content: string, keyboard = false): string {
  return `<main class="app ${keyboard ? 'keyboard-open' : ''}" data-fixture-revision="${FIXTURE_REVISION}">
    <header class="topbar"><button class="icon-button" aria-label="Menu">☰</button><div><div class="brand">OLD-SCHOOL ESSENTIALS</div><div class="edition">BRASEIRO OSE</div></div><button class="icon-button" aria-label="Configurações">⚙</button></header>
    <section class="content">${content}</section>
    <nav class="bottom-nav" aria-label="Navegação"><button>Sessão</button><button>Mapa</button><button>Ficha</button></nav>
  </main>${keyboard ? keyboardMarkup() : ''}`;
}

function sessionPrestart(): string {
  const f=fixtures['session-prestart'];
  return shell(`<div class="title-block"><h1>${f.title}</h1><p>${f.subtitle}</p></div>
    <section class="parchment narrative"><h2>Antes de começar</h2><p>${f.narrative}</p></section>
    <section class="party-card"><h2>Grupo</h2>${f.party!.map(x=>`<div class="party-row"><span class="token-dot"></span><span>${escapeHtml(x)}</span></div>`).join('')}</section>
    <div class="state-note">TTS indisponível antes da narração</div>
    <button id="startNarration" class="primary">COMEÇAR A NARRAR</button>
    <div class="channel-grid"><button class="secondary" disabled>PLAYER_ACTION</button><button class="secondary">GM_HELP</button></div>`);
}

function characterSheet(): string {
  const f=fixtures['character-sheet']; const c=f.character!;
  return shell(`<div class="title-block"><h1>${f.title}</h1><p>${f.subtitle}</p></div>
    <section class="parchment character-head"><h2>${c.name}</h2><p>${c.classLabel} · Nível <span>${c.level}</span></p><div class="vitals"><span>♥ PV <b>${c.hp}</b></span><span>◈ CA <b>${c.ac}</b></span><span>↟ MOV <b>${c.movement}</b></span><span>✦ XP <b>${c.xp}</b></span></div></section>
    <h2 class="section-label">Atributos</h2><section class="attribute-grid">${c.attributes.map(([n,v,m])=>`<div class="attribute"><span>${n}</span><strong>${v}</strong><em>${m}</em></div>`).join('')}</section>
    <h2 class="section-label">Salvamentos</h2><section class="list-card">${c.saves.map(([n,v])=>`<div><span>${n}</span><b>${v}</b></div>`).join('')}</section>
    <h2 class="section-label">Inventário</h2><section class="list-card inventory">${c.inventory.map(x=>`<div><span>${escapeHtml(x)}</span></div>`).join('')}</section>`);
}

function keyboardMarkup(): string {
  return `<div class="keyboard-sim" aria-label="Teclado simulado"><div class="key-row">${['Q','W','E','R','T','Y','U','I','O','P'].map(k=>`<span>${k}</span>`).join('')}</div><div class="key-row">${['A','S','D','F','G','H','J','K','L'].map(k=>`<span>${k}</span>`).join('')}</div><div class="key-row">${['Z','X','C','V','B','N','M'].map(k=>`<span>${k}</span>`).join('')}</div><div class="space-key">espaço</div></div>`;
}

function keyboardOpen(): string {
  const f=fixtures['keyboard-open'];
  return shell(`<div class="title-block compact"><h1>${f.title}</h1><p>${f.subtitle}</p></div><section class="parchment narrative compact-narrative"><p>${f.narrative}</p></section>
    <div id="actionDock" class="action-dock"><label for="playerAction">PLAYER_ACTION</label><textarea id="playerAction" rows="2">Examino a porta sem abri-la.</textarea><button class="primary">ENVIAR AÇÃO</button></div>`, true);
}

const id=queryFixture();
document.documentElement.dataset.clock=FIXED_CLOCK;
document.body.innerHTML = id === 'character-sheet' ? characterSheet() : id === 'keyboard-open' ? keyboardOpen() : sessionPrestart();
document.body.dataset.ready='true';
postBridge({version:BRIDGE_VERSION,type:'ViewState',payload:{fixture:id,fixtureRevision:FIXTURE_REVISION,clock:FIXED_CLOCK}});
