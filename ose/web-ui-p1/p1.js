(() => {
  'use strict';
  const A='../assets/ose-user-pack-v1/source/TALES_VTT_ASSET_PACK/assets_individuais/';
  const img=(p,c='',alt='')=>`<img ${c?`class="${c}"`:''} src="${A}${p}" alt="${alt}" draggable="false">`;
  const q=new URLSearchParams(window.__P1_CAPTURE_QUERY || location.search);
  let screen=q.get('screen')||'session';
  let state=q.get('state')||'active';
  const device=document.querySelector('#device');
  const top=document.querySelector('#topbar');
  const status=document.querySelector('#statusbar');
  const main=document.querySelector('#screen');
  const nav=document.querySelector('#primaryNav');
  const toast=document.querySelector('#toast');
  const hasNative=()=>!!(window.BraseiroBridge&&typeof window.BraseiroBridge.postMessage==='function');
  const postNative=(type,payload)=>{if(!hasNative())return false;window.BraseiroBridge.postMessage(JSON.stringify({version:1,type,payload}));return true};
  window.BraseiroReceive=(raw)=>{try{const m=typeof raw==='string'?JSON.parse(raw):raw;const p=m.payload||{};if(m.type==='SessionUpdate'){const nt=document.querySelector('.narration-text');if(nt&&p.narration)nt.textContent=p.narration;const fb=document.querySelector('.result-strip span');if(fb&&p.feedback)fb.textContent=p.feedback;showToast(p.committed?'Estado confirmado e salvo.':'Sem mutação mecânica.');}else if(m.type==='GMHelpResponse'){showToast(p.answer||'GM_HELP sem resposta.')}else if(m.type==='BridgeError'){showToast('Erro: '+(p.message||'bridge'));}}catch(e){showToast('Resposta nativa inválida.')}};

  const model=Object.freeze({
    position:Object.freeze({space:'HEXCRAWL_MAP',q:3,r:2,label:'Colinas do Outeiro'}),
    day:3,time:'14:20',weather:'NUBLADO',torch:'30m',rations:'4',movement:"90′",
    party:Object.freeze([
      {name:'Alda',role:'Guerreira 3',hp:'14/18',token:'tokens_compactos/guerreiro.png'},
      {name:'Merek',role:'Mago 3',hp:'8/8',token:'tokens_compactos/mago.png'},
      {name:'Lysa',role:'Arqueira 3',hp:'11/13',token:'tokens_compactos/arqueiro.png'},
      {name:'Corvin',role:'Ladino 3',hp:'9/11',token:'tokens_compactos/ladino.png'}
    ])
  });

  const narrative={
    active:{label:'SESSÃO ATIVA',title:'A porta sob o outeiro',text:`A escadaria termina num patamar de pedra onde a umidade cobre as juntas do piso. A chama da tocha cria sombras instáveis no corredor atrás de vocês. À frente, uma porta de madeira escurecida pelo tempo fecha a passagem. O ar que vem das frestas é mais frio e traz um cheiro de terra revolvida. Nenhuma criatura está à vista. O silêncio é quebrado apenas pelo estalo da chama.`,feedback:'Posição preservada · contexto atualizado pelo Mestre.'},
    encounter:{label:'ENCONTRO',title:'Movimento além da porta',text:`Um ruído curto de metal raspando pedra vem do outro lado da porta. A chama se inclina com uma corrente de ar e, por um instante, passos parecem responder no corredor. O Mestre apresenta a situação e aguarda a reação do grupo.`,feedback:'Encontro apresentado · aguardando PLAYER_REACTION.'},
    combat:{label:'COMBATE',title:'Choque no corredor',text:`A porta cede e duas silhuetas armadas avançam para a luz. A situação é narrada pelo Mestre; qualquer consequência mecânica continua pertencendo ao Rules Engine OSE depois da sua declaração.`,feedback:'Combate contextual · nenhuma mutação direta disponível.'},
    recovery:{label:'RECUPERAÇÃO',title:'Depois do confronto',text:`O corredor volta a ficar silencioso. A tocha continua queimando enquanto o grupo verifica o que aconteceu. Informações mecânicas aparecem apenas como resultado resolvido; a próxima intenção ainda passa pelo mesmo canal de reação.`,feedback:'Recuperação contextual · recursos em inspeção.'}
  };

  function renderChrome(){
    if(screen==='session'){
      top.innerHTML=`${img('marca_navegacao/logo_old_school_essentials.png','brand','Old-School Essentials')}<div class="top-copy"><div class="top-title">CRIPTA SOB O OUTEIRO</div><div class="top-sub">${(narrative[state]||narrative.active).label} · Mestre automático</div></div><button class="icon-button" aria-label="Configurações" data-inspection-only="true">${img('marca_navegacao/icone_configuracoes.png','','Configurações')}</button>`;
      status.innerHTML=`<div class="session-scene-label">CENA</div><div class="session-scene-row">
        <div class="scene-stat scene-location">${img('arte_telas/corredor_escuro_porta_carvalho.png','','Corredor')}<div><strong>CORREDOR</strong><small>de pedra · cripta</small></div></div>
        <div class="scene-stat"><div><div class="mini">DIA ${model.day}</div><b>${model.time}</b></div></div>
        <div class="scene-stat"><div><div class="mini">CLIMA</div><b>${model.weather}</b></div></div>
        <div class="scene-stat scene-torch">${img('recursos_navegacao/tempo_30m.png','','Tocha')}<div class="torch-copy"><div class="mini">TOCHA</div><b>${model.torch}</b></div></div>
      </div>`;
    } else {
      const titles={map:'MAPA',sheet:'FICHA',company:'COMPANHIA'};
      top.innerHTML=`${img('marca_navegacao/logo_old_school_essentials.png','brand','Old-School Essentials')}<div class="top-copy"><div class="top-title">${titles[screen]||'OSE'} · CRIPTA SOB O OUTEIRO</div><div class="top-sub">Motor Barbara · Mestre automático conectado</div></div><button class="icon-button" aria-label="Configurações" data-inspection-only="true">${img('marca_navegacao/icone_configuracoes.png','','Configurações')}</button>`;
      status.innerHTML=`<div class="status-tile"><div><div class="status-label">Tempo</div><div class="status-value">DIA ${model.day} · ${model.time}</div></div></div><div class="status-tile"><div><div class="status-label">Clima</div><div class="status-value">${model.weather}</div></div></div><div class="status-tile">${img('recursos_navegacao/tempo_30m.png','','Tocha 30m')}<div><div class="status-label">Tocha</div><div class="status-value">${model.torch}</div></div></div><div class="status-tile">${img('recursos_navegacao/racoes_4.png','','Rações 4')}<div><div class="status-label">Rações</div><div class="status-value">${model.rations}</div></div></div>`;
    }
    const navs=[['session','marca_navegacao/icone_pergaminho.png','SESSÃO'],['map','recursos_navegacao/icone_mapa.png','MAPA'],['sheet','recursos_navegacao/icone_livro.png','FICHA'],['company','recursos_navegacao/icone_grupo.png','COMPANHIA']];
    nav.innerHTML=navs.map(([id,p,label])=>`<button class="nav-item ${screen===id?'active':''}" data-nav="${id}" data-inspection-only="true">${img(p,'',label)}<span>${label}</span></button>`).join('');
    nav.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
  }
  function navigate(next){screen=next;q.set('screen',screen);if(screen!=='session')q.delete('state');try{history.replaceState(null,'',`${location.pathname}?${q.toString()}`);}catch(_e){}render();}
  function showToast(msg){toast.textContent=msg;toast.hidden=false;clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.hidden=true,1500)}

  function renderSession(){
    const n=narrative[state]||narrative.active;
    main.innerHTML=`<section class="session-canonical" data-screen="SCREEN_06_SESSION_ACTIVE" data-session-state="${state}">
      <div class="master-kicker">MESTRE</div>
      <div class="session-narrative-layout">
        <article class="master-panel" aria-label="Narração visível do Mestre"><i class="master-diamond"></i><div class="narration-scroll"><h2 class="narration-title">${n.title}</h2><p class="narration-text">${n.text}</p><p class="narration-text secondary">Mapa, ficha e companhia permanecem superfícies de inspeção; a campanha só avança pela reação declarada.</p></div><span class="scroll-hint">↕</span></article>
        <aside class="session-rail">
          <button id="tts" class="rail-card tts" data-inspection-only="true" aria-label="Ouvir narração">${img('marca_navegacao/icone_pergaminho.png','','Ouvir')}<b>OUVIR</b><small>NARRAÇÃO</small></button>
          <button class="rail-card local" data-inspection-only="true">${img('locais_campanha/corredor_umido.png','','Corredor')}<b>LOCAL</b><small>corredor</small></button>
          <button class="rail-card help gm-help" data-inspection-only="true">${img('marca_navegacao/icone_pergaminho.png','','Ajuda')}<b>AJUDA</b><small>somente consulta</small></button>
        </aside>
      </div>
      <div class="result-strip"><b>RESULTADO VISÍVEL</b><span>${n.feedback}</span></div>
      <div class="suggestions-head"><b>SUGESTÕES DO MESTRE</b><small>toque para preencher sua reação</small></div>
      <div class="session-suggestions"><button data-suggest="Examino a porta sem abri-la." data-inspection-only="true">EXAMINAR A PORTA</button><button data-suggest="Ouvimos do outro lado antes de agir." data-inspection-only="true">OUVIR DO OUTRO LADO</button><button data-suggest="Voltamos ao corredor seguro." data-inspection-only="true">VOLTAR AO CORREDOR</button></div>
      <div class="reaction-heading">SUA REAÇÃO / PLAYER_REACTION</div>
      <div class="reaction-dock"><textarea id="reaction" class="reaction-input" placeholder="O que seu personagem faz ou diz?" aria-label="PLAYER_REACTION"></textarea><button class="send-reaction" data-channel="PLAYER_REACTION" data-intentional-mutation="true">ENVIAR<br>REAÇÃO</button><small class="channel-note">único canal de jogo</small></div>
      <i class="history-divider"></i><div class="history-head"><b>HISTÓRICO / DIÁRIO</b><small>estado conhecido pelo jogador</small></div>
      <section class="history-card"><div class="history-time">14:20 · CRIPTA SOB O OUTEIRO</div><p>O Mestre descreveu uma porta antiga no fim do corredor. A passagem anterior permanece conhecida e a posição atual do grupo não mudou.</p><div class="history-open">Abrir histórico completo</div></section>
    </section>`;
    main.querySelectorAll('[data-suggest]').forEach(b=>b.addEventListener('click',()=>{main.querySelector('#reaction').value=b.dataset.suggest;main.querySelector('#reaction').focus()}));
    main.querySelector('.gm-help').addEventListener('click',()=>{const qv=main.querySelector('#reaction').value.trim()||'turn';if(!postNative('GMHelp',{question:qv}))showToast('GM_HELP: consulta somente leitura; campanha/RNG inalterados.');});
    main.querySelector('.send-reaction').addEventListener('click',()=>{const v=main.querySelector('#reaction').value.trim();if(!v){showToast('Escreva uma reação antes de enviar.');return;}const ok=postNative('PlayerReaction',{reactionId:'ui-'+Date.now(),text:v,surface:String(state).toUpperCase()});showToast(ok?'PLAYER_REACTION enviado ao Rules/Session Engine.':'PLAYER_REACTION em preview; bridge nativa ausente.');});
    main.querySelector('#tts').addEventListener('click',()=>{const visible=main.querySelector('.narration-scroll').innerText.trim();if(postNative('TtsCommand',{command:'play',visibleNarration:visible})){showToast('TTS nativo: narração visível.');}else if('speechSynthesis' in window&&visible){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(visible);u.lang='pt-BR';speechSynthesis.speak(u);}else showToast('TTS indisponível neste navegador.');});
  }

  const terrain=['planicie','colinas','floresta','planicie','montanha','desconhecido','floresta','colinas','planicie','agua','desconhecido','montanha','planicie','pantano','floresta','colinas','planicie','desconhecido','agua','planicie','colinas','floresta','desconhecido','montanha','planicie','floresta','pantano','desconhecido','colinas','planicie'];
  const geom=Object.freeze({hexW:60,hexH:69.282,xStep:60,yStep:51.962,oddOffset:30,originX:42,originY:40});
  function hexPath(name){return `hexes_compactos/${name}.png`}
  function renderMap(){
    let cells='';let i=0;
    for(let r=0;r<5;r++)for(let c=0;c<6;c++){const x=geom.originX+c*geom.xStep+(r%2?geom.oddOffset:0),y=geom.originY+r*geom.yStep;const t=terrain[i++%terrain.length];cells+=`<div class="hex-cell" data-q="${c}" data-r="${r}" data-terrain="${t}" data-inspection-only="true" aria-label="hex ${t}" style="left:${x}px;top:${y}px;background-image:url('${A}${hexPath(t)}')"></div>`;}
    const px=geom.originX+3*geom.xStep+16,py=geom.originY+2*geom.yStep+17;
    main.innerHTML=`<section class="map-shell" data-screen="MAP" data-geometry-version="1" data-direct-movement="forbidden"><div class="map-head"><div><div class="section-kicker">Mapa · inspeção/exploração</div><div class="map-title">Ermos do Norte</div></div><div class="camera-tools"><button id="zoomOut" data-camera-only="true">−</button><button id="zoomIn" data-camera-only="true">+</button></div></div><div id="mapViewport" class="map-viewport" aria-label="Mapa com pan e zoom de câmera; sem movimento direto"><div id="mapGrid" class="map-grid" data-geometry-version="1">${cells}<div class="canonical-ring" style="left:${px-9}px;top:${py-9}px"></div>${img('tokens_compactos/guerreiro.png','party-pin','Posição canônica da companhia').replace('<img ','<img style="left:'+px+'px;top:'+py+'px" ')}<div class="map-label" style="left:${px+30}px;top:${py+2}px">POSIÇÃO CANÔNICA · Q3,R2</div></div></div><div class="map-inspect p0-card"><img class="inspect-hex" src="${A}hexes_destaque/hex_colinas_arborizadas.png" alt="Colinas arborizadas"><div><div class="inspect-title">Colinas do Outeiro</div><div class="inspect-copy">Conhecido pelo grupo. Seleção de mapa altera apenas o foco de inspeção; não move a companhia, não gasta tempo e não resolve encontros.</div><div class="geometry-note">GEOMETRY V1 · HEXES IGUAIS · SEM STRETCH · SEM NUDGE POR CÉLULA · CÂMERA ≠ POSIÇÃO</div></div></div></section>`;
    let cam={x:-18,y:10,s:1};const grid=main.querySelector('#mapGrid'),vp=main.querySelector('#mapViewport');const apply=()=>grid.style.transform=`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`;apply();main.querySelector('#zoomIn').onclick=()=>{cam.s=Math.min(1.45,+(cam.s+.1).toFixed(2));apply()};main.querySelector('#zoomOut').onclick=()=>{cam.s=Math.max(.75,+(cam.s-.1).toFixed(2));apply()};let drag=null;vp.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};vp.setPointerCapture(e.pointerId)});vp.addEventListener('pointermove',e=>{if(!drag)return;cam.x=drag.cx+e.clientX-drag.x;cam.y=drag.cy+e.clientY-drag.y;apply()});vp.addEventListener('pointerup',()=>drag=null);vp.addEventListener('pointercancel',()=>drag=null);
  }

  function renderSheet(){
    const attrs=[['forca_for','FOR','15'],['inteligencia_int','INT','10'],['sabedoria_sab','SAB','12'],['destreza_des','DES','14'],['constituicao_con','CON','13'],['carisma_car','CAR','9']];
    const inv=[['equipamentos/espada_longa.png','Espada longa'],['equipamentos/cota_malha.png','Cota de malha'],['marca_navegacao/tocha.png','Tocha'],['ferramentas_consumiveis/ferramentas_consumiveis_01.png','Rações'],['equipamentos/corda.png','Corda'],['equipamentos/chave.png','Chave']];
    main.innerHTML=`<section class="sheet-shell" data-screen="CHARACTER_SHEET" data-context-only="true"><div class="hero-card p0-card">${img('retratos/retrato_alda_guerreira.png','portrait','Alda')}<div><div class="section-kicker">Personagem</div><div class="hero-name">Alda</div><div class="hero-meta">GUERREIRA · NÍVEL 3 · ADVANCED FANTASY</div><div class="vitals"><div class="vital">${img('atributos_status/coracao.png','','HP')}<div><span>HP</span><b>14/18</b></div></div><div class="vital">${img('atributos_status/classe_armadura.png','','CA')}<div><span>CA</span><b>4</b></div></div><div class="vital">${img('recursos_navegacao/movimento_90.png','','Movimento')}<div><span>MOV</span><b>90′</b></div></div></div></div></div><div class="attrs p0-card">${attrs.map(([p,l,v])=>`<div class="attr">${img('atributos_status/'+p+'.png','',l)}<b>${v}</b><span>${l}</span></div>`).join('')}</div><div class="sheet-bottom"><div class="saves p0-card"><div class="panel-title">Salvamentos</div>${[['Morte/Veneno','12'],['Varinhas','13'],['Paralisia/Pedra','14'],['Sopro','15'],['Feitiços','16']].map(([n,v])=>`<div class="save-row"><span>${n}</span><b>${v}</b></div>`).join('')}<div class="readonly-note">Somente inspeção. A ficha não aplica regra.</div></div><div class="inventory p0-card"><div class="panel-title">Inventário</div><div class="inv-grid">${inv.map(([p,n])=>`<div class="inv-item">${img(p,'',n)}<span>${n}</span></div>`).join('')}</div><div class="readonly-note">Alterações mecânicas exigem resolução por PLAYER_REACTION.</div></div></div></section>`;
  }

  function renderCompany(){
    main.innerHTML=`<section class="company-shell" data-screen="COMPANY" data-context-only="true"><div class="company-head"><div><div class="section-kicker">Companhia</div><div class="title">Os Quatro do Outeiro</div></div><div class="sub">4 aventureiros · posição compartilhada</div></div><div class="company-grid">${model.party.map((m,i)=>`<div class="member p0-card">${img(m.token,'',m.name)}<div><div class="member-name">${m.name}</div><div class="member-meta">${m.role}<br>HP ${m.hp}</div><span class="member-status">${i===0?'LÍDER':'PRONTO'}</span></div></div>`).join('')}</div><div class="company-location p0-card">${img('locais_campanha/corredor_umido.png','','Local atual')}<div><strong>Posição única e canônica</strong><p>Todos os membros compartilham o mesmo PositionState. Esta superfície mostra a companhia, mas não separa tokens, não teleporta e não avança tempo.</p><code>${model.position.space} · q=${model.position.q} · r=${model.position.r}</code></div></div></section>`;
  }

  function render(){device.dataset.screen=screen;device.dataset.state=state;renderChrome();if(screen==='map')renderMap();else if(screen==='sheet')renderSheet();else if(screen==='company')renderCompany();else renderSession();window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;requestAnimationFrame(()=>window.scrollTo(0,0));}
  render();
  document.body.dataset.ready='true';
  postNative('ViewState',{request:'initial'});
})();
