import { fixtures, type FixtureId, FIXED_CLOCK, FIXTURE_REVISION } from './fixtures.js';
import { BRIDGE_VERSION, postBridge } from './bridge.js';

const A='./assets/';
const img=(n:string,c='',a='')=>`<img ${a?`data-anchor="${a}"`:''} class="${c}" data-canonical-asset="${n}" src="${A}${n}" alt="">`;
const fixture=()=>{const q=new URLSearchParams(location.search).get('fixture') as FixtureId|null;return q&&q in fixtures?q:'session-prestart'};

const header=(subtitle:string)=>`<header class="master-header">
  <div class="brand-mark">${img('001_logo_ose.png','brand-logo','header_logo')}</div>
  <button class="header-button menu" aria-label="Menu">${img('002_icone_menu.png')}</button>
  <button class="header-button settings" aria-label="Configurações">${img('003_icone_configuracoes.png')}</button>
  <div class="header-d20">${img('011_icone_d20.png')}</div>
  <p class="header-subtitle">${subtitle}</p>
  <i class="ornament-line"></i>
</header>`;

const nav=()=>`<nav class="bottom-nav">
  <button class="sel">${img('006_icone_pergaminho.png')}<span>SESSÃO</span></button>
  <button>${img('013_icone_mapa.png')}<span>MAPA</span></button>
  <button>${img('012_icone_livros.png')}<span>FICHA</span></button>
  <button>${img('014_icone_grupo.png')}<span>COMPANHIA</span></button>
</nav>`;

const partyCard=(asset:string,name:string,klass:string,level:string)=>`<article class="party-card">
  ${img(asset,'party-token')}
  <strong>${name}</strong><span>${klass}</span><small>${level}</small>
</article>`;

function prestart(){return `<main class="screen prestart">
  ${header('Cavernas do Caos  •  Preparação da Sessão')}

  <section class="parchment-panel prep-hero" data-anchor="prep_panel">
    ${img('075_painel_pergaminho_rustico.png','panel-art')}
    <div class="door-medallion">${img('032_icone_porta.png')}</div>
    <div class="prep-copy">
      <h1>PREPARAÇÃO DA SESSÃO</h1>
      <i></i>
      <p>Defina a posição inicial, apresente o ponto de partida e prepare o terreno para a aventura.</p>
    </div>
  </section>

  <section class="framed-panel company-panel">
    <div class="section-heading"><div>${img('014_icone_grupo.png')}<h2>COMPANHIA</h2></div><span>4 AVENTUREIROS</span></div>
    <div class="party-grid">
      ${partyCard('040_token_guerreiro.png','Valgrim','Guerreiro','Nível 2')}
      ${partyCard('042_token_arqueiro.png','Lyria','Clériga','Nível 2')}
      ${partyCard('041_token_mago.png','Thamon','Mago','Nível 1')}
      ${partyCard('043_token_ladrao.png','Sildor','Ladino','Nível 1')}
    </div>
  </section>

  <section class="framed-panel initial-panel">
    <div class="section-heading simple"><h2>SITUAÇÃO INICIAL</h2></div>
    <div class="initial-row">${img('032_icone_porta.png')}<div><b>POSIÇÃO INICIAL</b><span>Entrada das Cavernas</span></div><button aria-label="Editar posição"><i></i></button></div>
    <div class="initial-row">${img('014_icone_grupo.png')}<div><b>PARTY</b><span>4 aventureiros • pronta</span></div><button aria-label="Editar companhia"><i></i></button></div>
    <div class="initial-row">${img('012_icone_livros.png')}<div><b>ESTADO</b><span>Narrativa ainda não iniciada</span></div><button aria-label="Editar estado"><i></i></button></div>
  </section>

  <section class="framed-panel opening-panel">
    <div class="section-heading simple quill"><h2>ABERTURA DA NARRATIVA</h2></div>
    <p>Escreva o gancho inicial ou situação de abertura para os jogadores.</p>
    <textarea id="openingNarrative" aria-label="Abertura da narrativa" placeholder="Ex.: À sua frente, a boca escura da caverna se abre na encosta, exalando um hálito frio e úmido..."></textarea>
    <button class="master-cta">${img('012_icone_livros.png')}<span>MESTRE COMEÇAR A NARRAR</span></button>
    <button class="tts-config">${img('OSE_SESSION_NEW_A701_icone_tts_ouvir.png')}<span><b>CONFIGURAR TTS</b><small>Áudio e assistente do mestre</small></span></button>
  </section>

  ${nav()}
</main>`}

const status=(asset:string,label:string,value:string)=>`<div class="status-box">${img(asset)}<div><b>${label}</b><strong>${value}</strong></div></div>`;

function active(keyboard=false){const f=fixtures['session-active'];return `<main class="screen active ${keyboard?'kbd-open':''}">
  ${header('Cavernas do Caos  •  Sessão em andamento')}

  <section class="status-strip">
    ${status('007_icone_tocha.png','TOCHA','40 min')}
    ${status('009_status_racoes_4.png','RAÇÕES','6/10')}
    ${status('011_icone_d20.png','TURNO','17')}
    ${status('010_status_movimento_90.png','MOVIMENTO','90′')}
  </section>

  <section class="parchment-panel narration-master" data-anchor="narration_panel">
    ${img('075_painel_pergaminho_rustico.png','panel-art')}
    <div class="narration-copy">
      <h1>${img('006_icone_pergaminho.png')} NARRAÇÃO DO MESTRE</h1>
      <p>${f.narrative}</p>
    </div>
    <div class="scene-art" aria-label="Ilustração contextual da cripta">
      <div class="stone-wall"></div>
      ${img('007_icone_tocha.png','scene-torch left')}
      ${img('007_icone_tocha.png','scene-torch right')}
      ${img('032_icone_porta.png','scene-door')}
      <div class="scene-vignette"></div>
    </div>
  </section>

  <section class="framed-panel action-master" data-anchor="player_action_panel">
    <div class="section-heading simple quill"><h2>O QUE VOCÊ FAZ?</h2></div>
    <div class="action-input">
      <textarea id="playerAction" aria-label="PLAYER_ACTION" placeholder="Descreva sua ação ou decisão...">${keyboard?'Examino a porta sem abri-la.':''}</textarea>
      <button class="voice" aria-label="Ditado por voz">${img('OSE_SESSION_NEW_A701_icone_tts_ouvir.png')}</button>
    </div>
    <div class="quick-actions">
      <button>${img('007_icone_tocha.png')}<span><b>TOCHA</b><small>Gerenciar luz</small></span></button>
      <button>${img('011_icone_d20.png')}<span><b>TESTE</b><small>Fazer teste</small></span></button>
      <button>${img('013_icone_mapa.png')}<span><b>MAPA</b><small>Ver mapa</small></span></button>
    </div>
    <button class="narrate-tts">${img('OSE_SESSION_NEW_A701_icone_tts_ouvir.png')}<span><b>NARRAR (TTS)</b><small>Ouvir narração do mestre</small></span></button>
  </section>

  ${nav()}
</main>${keyboard?keyboardMarkup():''}`}

function keyboardMarkup(){return `<div class="keyboard-sim">${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(r=>`<div>${[...r].map(k=>`<span>${k}</span>`).join('')}</div>`).join('')}<em>espaço</em></div>`}

const id=fixture();
document.documentElement.dataset.clock=FIXED_CLOCK;
document.body.innerHTML=id==='session-prestart'?prestart():active(id==='keyboard-open');
document.body.dataset.ready='true';
postBridge({version:BRIDGE_VERSION,type:'ViewState',payload:{fixture:id,fixtureRevision:FIXTURE_REVISION,clock:FIXED_CLOCK}});
