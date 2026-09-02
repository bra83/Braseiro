import { fixtures, type FixtureId, FIXED_CLOCK, FIXTURE_REVISION } from './fixtures.js';
import { BRIDGE_VERSION, postBridge } from './bridge.js';

const A='./assets/';
const img=(n:string,c='',a='')=>`<img ${a?`data-anchor="${a}"`:''} class="${c}" data-canonical-asset="${n}" src="${A}${n}" alt="">`;
const fixture=()=>{const q=new URLSearchParams(location.search).get('fixture') as FixtureId|null;return q&&q in fixtures?q:'session-prestart'};

const header=(location:string)=>`<header class="brand-header">
  ${img('001_logo_ose.png','logo','header_logo')}
  <button class="menu" data-anchor="menu" aria-label="Menu">${img('002_icone_menu.png')}</button>
  <button class="settings" data-anchor="settings" aria-label="Configurações">${img('003_icone_configuracoes.png')}</button>
  <p class="location" data-anchor="header_title">${location}</p>
  <i class="brand-divider" data-axis="header_divider"></i>
</header>`;

const nav=()=>`<nav class="bottom-nav" data-axis="bottom_nav">
  <button data-anchor="bottom_session" class="sel">${img('006_icone_pergaminho.png')}<small>SESSÃO</small></button>
  <button data-anchor="bottom_map">${img('013_icone_mapa.png')}<small>MAPA</small></button>
  <button data-anchor="bottom_sheet">${img('012_icone_livros.png')}<small>FICHA</small></button>
  <button data-anchor="bottom_bag">${img('015_icone_mochila.png')}<small>BOLSA</small></button>
</nav>`;

const railCard=(n:string,label:string,anchor:string)=>`<button class="rail-card" data-anchor="${anchor}">${img(n)}<span>${label}</span></button>`;

function prestart(){return `<main class="screen prestart">
  ${header('Cavernas do Caos  •  Nova Sessão')}
  <section class="ready-block">
    ${img('006_icone_pergaminho.png','ready-icon','ready_icon')}
    <h1 data-anchor="ready_title">PRONTO PARA<br>COMEÇAR</h1>
    <p data-anchor="ready_subtitle">Party e posição inicial definidas.</p>
  </section>

  <section class="prep-panel" data-anchor="prep_panel">
    ${img('075_painel_pergaminho_rustico.png','panel-art')}
    <div class="prep-content">
      <h2>PREPARAÇÃO DA SESSÃO</h2>
      <div class="prep-row"><span class="glyph">✥</span><div><b>POSIÇÃO INICIAL</b><p>Entrada das Cavernas</p></div></div>
      <div class="prep-row">${img('014_icone_grupo.png')}<div><b>PARTY</b><p>4 aventureiros  •  pronta</p></div></div>
      <div class="prep-row">${img('012_icone_livros.png')}<div><b>ESTADO</b><p>Narrativa ainda não iniciada</p></div></div>
      <div class="prep-row compact">${img('006_icone_pergaminho.png')}<div><b>PLAYER_ACTION</b><p>Permanecerá indisponível até que nenhuma consequência mecânica avance.</p></div></div>
    </div>
  </section>

  <aside class="pre-rail">
    ${railCard('014_icone_grupo.png','PARTY','rail_party')}
    ${railCard('013_icone_mapa.png','MAPA','rail_map')}
    ${railCard('011_icone_d20.png','DADOS','rail_dice')}
    ${railCard('015_icone_mochila.png','BOLSA','rail_bag')}
  </aside>

  <button class="start-cta" data-anchor="start_cta">${img('OSE_GLOBAL_A202_botao_base_ativo_sem_texto.png')}<span>COMEÇAR A NARRAR</span></button>

  <section class="lower-actions">
    <button class="lower-card player-card" data-anchor="player_action" disabled>${img('075_painel_pergaminho_rustico.png','card-bg')}<div>${img('006_icone_pergaminho.png','card-icon')}<b>PLAYER_ACTION</b><small>Indisponível até existir narração.</small></div></button>
    <button class="tts-orb" data-anchor="tts_control" disabled>${img('OSE_SESSION_NEW_A701_icone_tts_ouvir.png')}<b>OUVIR</b><small>TTS</small></button>
    <button class="lower-card gm-card" data-anchor="gm_help">${img('075_painel_pergaminho_rustico.png','card-bg')}<div>${img('OSE_SESSION_A501_icone_gm_help.png','card-icon')}<b>GM_HELP</b><small>Não avança mundo antes da narração.</small></div></button>
  </section>
  ${nav()}
</main>`}

function statusCard(n:string,value:string,label:string,anchor:string){return `<div class="status-card" data-anchor="${anchor}">${img(n)}<strong>${value}</strong><small>${label}</small></div>`}

function active(keyboard=false){const f=fixtures['session-active'];return `<main class="screen active ${keyboard?'kbd-open':''}">
  ${header('Cavernas do Caos  •  Cripta sob o Outeiro')}

  <section class="status-row">
    ${statusCard('008_status_tocha_30m.png','30m','LUZ','status_light')}
    ${statusCard('010_status_movimento_90.png','90′','MOVIMENTO','status_move')}
    ${statusCard('011_icone_d20.png','2º turno','TURNO','status_dice')}
    ${statusCard('014_icone_grupo.png','4','PARTY','status_party')}
  </section>

  <section class="narration-panel" data-anchor="narration_panel">
    ${img('OSE_SESSION_A502_frame_narracao_flexivel.png','panel-art')}
    <div class="narration-content"><h1>MESTRE</h1><p>${f.narrative}</p></div>
  </section>
  <button class="active-tts" data-anchor="tts_control">${img('OSE_SESSION_NEW_A701_icone_tts_ouvir.png')}<b>OUVIR</b><small>TTS</small></button>

  <section class="action-panel" data-anchor="player_action_panel">
    ${img('072_painel_pergaminho_pautado.png','panel-art')}
    <div class="action-content"><h2>AÇÃO / PLAYER_ACTION</h2><label for="playerAction">O que você faz?</label><textarea id="playerAction" aria-label="PLAYER_ACTION">${keyboard?'Examino a porta sem abri-la.':''}</textarea></div>
    <button class="send" data-anchor="send_button">${img('OSE_GLOBAL_A202_botao_base_ativo_sem_texto.png')}<span>ENVIAR</span></button>
  </section>

  <button class="gm-panel" data-anchor="gm_help">${img('075_painel_pergaminho_rustico.png','panel-art')}<div>${img('OSE_SESSION_A501_icone_gm_help.png')}<b>GM_HELP</b><small>não avança<br>mundo</small></div></button>

  <section class="shortcut-row">
    ${railCard('013_icone_mapa.png','MAPA','shortcut_map')}
    ${railCard('012_icone_livros.png','FICHA','shortcut_sheet')}
    ${railCard('011_icone_d20.png','DADOS','shortcut_dice')}
    ${railCard('015_icone_mochila.png','BOLSA','shortcut_bag')}
  </section>

  <i class="history-divider" data-axis="history_divider"></i>
  <section class="history"><h2 data-anchor="history_title">HISTÓRICO DA SESSÃO</h2><ul><li>A pesada porta de madeira range ao ser aberta e vocês entram na cripta.</li><li>O ar é frio e carrega o cheiro de terra molhada e algo antigo.</li><li>À esquerda, um arco de pedra leva a um desvio escuro.</li><li>O corredor continua, sinuoso, desaparecendo na penumbra.</li></ul></section>
  ${nav()}
</main>${keyboard?keyboardMarkup():''}`}

function keyboardMarkup(){return `<div class="keyboard-sim">${['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map(r=>`<div>${[...r].map(k=>`<span>${k}</span>`).join('')}</div>`).join('')}<em>espaço</em></div>`}

const id=fixture();
document.documentElement.dataset.clock=FIXED_CLOCK;
document.body.innerHTML=id==='session-prestart'?prestart():active(id==='keyboard-open');
document.body.dataset.ready='true';
postBridge({version:BRIDGE_VERSION,type:'ViewState',payload:{fixture:id,fixtureRevision:FIXTURE_REVISION,clock:FIXED_CLOCK}});
