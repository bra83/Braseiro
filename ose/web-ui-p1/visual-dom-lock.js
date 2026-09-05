(() => {
  'use strict';

  const P='../assets/ose-user-pack-v1/source/TALES_VTT_ASSET_PACK/assets_individuais/';
  const X='assets/';
  const device=document.querySelector('#device');
  const top=document.querySelector('#topbar');
  const status=document.querySelector('#statusbar');
  const main=document.querySelector('#screen');
  const img=(src,cls='',alt='')=>`<img${cls?` class="${cls}"`:''} src="${src}" alt="${alt}" draggable="false">`;
  const nativePost=(type,payload)=>{if(!(window.BraseiroBridge&&typeof window.BraseiroBridge.postMessage==='function'))return false;window.BraseiroBridge.postMessage(JSON.stringify({version:1,type,payload}));return true;};
  let pendingReaction=null;

  const baseReceive=window.BraseiroReceive;
  window.BraseiroReceive=(raw)=>{
    let message=null;
    try{message=typeof raw==='string'?JSON.parse(raw):raw;}catch(_){message=null;}
    if(typeof baseReceive==='function')baseReceive(raw);
    if(message&&message.type==='SessionUpdate'){
      const acknowledged=pendingReaction;
      pendingReaction=null;
      const reaction=main.querySelector('#canonicalReaction');
      if(reaction&&acknowledged&&reaction.value.trim()===acknowledged.text)reaction.value='';
      syncPendingUi();
    }else if(message&&message.type==='BridgeError'){
      // Keep the same id after an ambiguous failure: mechanics may already have committed.
      syncPendingUi();
    }
  };

  function syncPendingUi(){
    const button=main.querySelector('#canonicalSend');
    const reaction=main.querySelector('#canonicalReaction');
    if(!button||!reaction)return;
    if(!pendingReaction){
      button.textContent='ENVIAR';
      button.removeAttribute('aria-busy');
      reaction.removeAttribute('data-pending-reaction');
      return;
    }
    const sameText=reaction.value.trim()===pendingReaction.text;
    button.textContent=sameText?'REENVIAR':'AGUARDE';
    button.setAttribute('aria-busy','true');
    reaction.setAttribute('data-pending-reaction',pendingReaction.id);
  }

  function canonicalHeader(title,subtitle){
    top.innerHTML=`${img(X+'001_logo_ose.png','brand','Old-School Essentials')}<div class="top-copy"><div class="top-title">${title}</div><div class="top-sub">${subtitle}</div></div><div class="visual-head-actions"><button class="icon-button" aria-label="Menu" data-inspection-only="true">${img(X+'002_icone_menu.png','','Menu')}</button><button class="icon-button" aria-label="Configurações" data-inspection-only="true">${img(X+'003_icone_configuracoes.png','','Configurações')}</button></div>`;
  }

  function renderSession(){
    canonicalHeader('CRIPTA SOB O OUTEIRO','SESSION_ACTIVE • narrativa em andamento');
    status.innerHTML=`<div class="session-status-icon">${img(X+'008_status_tocha_30m.png','','Tocha 30 minutos')}</div><div class="session-status-icon">${img(X+'010_status_movimento_90.png','','Movimento 90 pés')}</div><div class="session-status-icon">${img(X+'011_icone_d20.png','','Dados')}</div><div class="session-status-icon">${img(X+'014_icone_grupo.png','','Companhia')}</div>`;

    main.innerHTML=`<section class="canonical-session" data-visual-lock="session" data-player-action-channel="exclusive">
      <section class="canonical-master-panel"><h3>MESTRE</h3><div class="narration-scroll"><p class="narration-text">A escadaria termina num patamar de pedra onde a umidade cobre as juntas do piso. A chama da tocha deixa o corredor atrás de vocês em luz vacilante, mas à frente alcança uma porta de madeira escurecida pelo tempo. Há riscos recentes junto à fechadura e pequenas lascas espalhadas no chão. À direita, o muro afunda num arco antigo, parcialmente oculto por sombra. O ar que vem dali é mais frio e traz cheiro de terra revolvida. Nenhuma criatura está à vista. O silêncio é quebrado apenas pelo estalo da chama.</p></div></section>
      <button class="canonical-tts" id="canonicalTts" aria-label="Ouvir narração">${img(X+'OSE_SESSION_NEW_A701_icone_tts_ouvir.png','','Ouvir')}<span>OUVIR<br>TTS</span></button>

      <section class="canonical-player-action"><h3>AÇÃO / PLAYER ACTION</h3><textarea id="canonicalReaction" maxlength="5000" placeholder="O que você faz?"></textarea><button id="canonicalSend">ENVIAR</button></section>
      <button class="canonical-gm-help" id="canonicalGmHelp" aria-label="GM Help">${img(X+'OSE_SESSION_A501_icone_gm_help.png','','GM Help')}<span>não avança mundo</span></button>

      <div class="canonical-session-shortcuts" aria-label="Atalhos de consulta">
        <button data-shortcut-nav="map">${img(X+'013_icone_mapa.png','','Mapa')}<span>MAPA</span></button>
        <button data-shortcut-nav="sheet">${img(X+'012_icone_livros.png','','Ficha')}<span>FICHA</span></button>
        <button data-inspection-only="true">${img(X+'011_icone_d20.png','','Dados')}<span>DADOS</span></button>
        <button data-inspection-only="true">${img(X+'015_icone_mochila.png','','Bolsa')}<span>BOLSA</span></button>
      </div>

      <section class="canonical-session-history"><h3>HISTÓRICO DA SESSÃO</h3><p>A narração continua em rolagem vertical. Entradas anteriores permanecem acessíveis sem empurrar PLAYER_ACTION e GM_HELP para o mesmo canal. O concept demonstra conteúdo extenso sem transformar a tela em command board.</p></section>
    </section>`;

    const reaction=main.querySelector('#canonicalReaction');
    reaction.addEventListener('input',syncPendingUi);
    main.querySelector('#canonicalSend').addEventListener('click',()=>{
      const text=reaction.value.trim();
      if(!text)return;
      if(pendingReaction&&pendingReaction.text!==text){syncPendingUi();return;}
      const candidate=pendingReaction||{id:'ui-'+Date.now(),text};
      if(nativePost('PlayerReaction',{reactionId:candidate.id,text:candidate.text,surface:'ACTIVE'})){
        pendingReaction=candidate;
        syncPendingUi();
      }
    });
    main.querySelector('#canonicalGmHelp').addEventListener('click',()=>nativePost('GMHelp',{question:reaction.value.trim()||'turn'}));
    main.querySelector('#canonicalTts').addEventListener('click',()=>{const visible=main.querySelector('.narration-text').innerText.trim();if(!nativePost('TtsCommand',{command:'play',visibleNarration:visible})&&'speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(visible);u.lang='pt-BR';speechSynthesis.speak(u);}});
    main.querySelectorAll('[data-shortcut-nav]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.shortcutNav;const nav=document.querySelector(`[data-nav="${target}"]`);if(nav)nav.click();}));
    syncPendingUi();
  }

  function terrainFor(col,row){
    if(row<=2 || row>=17) return 'desconhecido';
    if((col===0 || col===9) && row!==9 && row!==10) return 'desconhecido';
    if(col===8 && row>=3 && row<=7) return 'desconhecido';
    if(col===9 && row>=12) return 'desconhecido';
    if((row>=3&&row<=8&&col>=5&&col<=7) || (row>=9&&row<=12&&col===6)) return 'montanha';
    if((row>=4&&row<=7&&col>=2&&col<=4&&((row+col)%3!==0)) || (row>=9&&row<=13&&col>=7&&col<=9&&((row+col)%4!==0))) return 'agua';
    if((row>=10&&row<=15&&col<=3&&((row+col)%3!==1)) || (row===5&&col===1) || (row===8&&col===2)) return 'floresta';
    if((row===8&&col===1) || (row===11&&col===5) || (row===14&&col===8)) return 'pantano';
    if((row+col)%8===0 || (row===4&&col===4) || (row===13&&col===5)) return 'colinas';
    return 'planicie';
  }

  function renderMap(){
    canonicalHeader('MAPA DOS ERMOS','Advanced Fantasy • Hexcrawl Geometry V1');
    status.innerHTML=`<div class="map-context-icon">${img(X+'013_icone_mapa.png','','Mapa')}</div><div class="map-context-copy"><b>POSIÇÃO Q3,R2 • VISIBILIDADE LOCAL</b><span>conhecido / rumor / desconhecido • perfil Advanced</span></div>`;
    const xStep=42,yStep=38,oddOffset=21,cols=10,rows=19,originX=-18,originY=-6;
    let cells='',partyX=0,partyY=0;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const q=col-1,r=row-8,x=originX+col*xStep+(row%2?oddOffset:0),y=originY+row*yStep,t=terrainFor(col,row);
      cells+=`<div class="world-hex terrain-${t}" data-q="${q}" data-r="${r}" data-terrain="${t}" style="left:${x}px;top:${y}px;background-image:url('${P}hexes_terreno/hex_${t}.png')"></div>`;
      if(col===4&&row===10){partyX=x;partyY=y;}
    }
    main.innerHTML=`<section class="canonical-hex-map" data-visual-lock="map" data-geometry-version="1" data-direct-movement="forbidden"><div class="map-canvas-wrap" id="canonicalMapViewport" aria-label="Atlas: pan e zoom apenas de câmera"><div class="canonical-world-grid" id="canonicalWorldGrid">${cells}<div class="party-current-hex" style="left:${partyX-2}px;top:${partyY-2}px"></div><div class="party-marker" style="left:${partyX+7}px;top:${partyY+9}px">${img(X+'014_icone_grupo.png','','Companhia em Q3,R2')}</div></div><div class="map-camera-controls" aria-hidden="true"><button id="canonZoomOut" data-camera-only="true">−</button><button id="canonZoomIn" data-camera-only="true">+</button></div></div></section>`;
    const vp=main.querySelector('#canonicalMapViewport'),grid=main.querySelector('#canonicalWorldGrid');let cam={x:0,y:0,s:1},drag=null;const apply=()=>{grid.style.transform=`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`;};apply();
    main.querySelector('#canonZoomIn').onclick=()=>{cam.s=Math.min(1.35,+(cam.s+.08).toFixed(2));apply();};main.querySelector('#canonZoomOut').onclick=()=>{cam.s=Math.max(.82,+(cam.s-.08).toFixed(2));apply();};
    vp.addEventListener('wheel',e=>{e.preventDefault();cam.s=Math.max(.82,Math.min(1.35,cam.s+(e.deltaY<0?.06:-.06)));apply();},{passive:false});vp.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};vp.setPointerCapture(e.pointerId);});vp.addEventListener('pointermove',e=>{if(!drag)return;cam.x=drag.cx+e.clientX-drag.x;cam.y=drag.cy+e.clientY-drag.y;apply();});vp.addEventListener('pointerup',()=>drag=null);vp.addEventListener('pointercancel',()=>drag=null);
  }

  function attr(label,value,mod,asset,selected=false){return `<div class="sheet-attr ${selected?'selected':''}"><div class="sheet-attr-tile">${img(P+'atributos_status/'+asset+'.png','sheet-attr-image',label)}</div><div class="sheet-attr-value"><b>${value}</b><em>${mod}</em></div></div>`;}
  function renderSheet(){
    canonicalHeader('ALDA • GUERREIRA','Character Sheet • leitura rápida • estado do personagem');
    status.innerHTML=`<div class="sheet-quick icon-only">${img(P+'atributos_status/coracao.png','','PV')}</div><div class="sheet-quick value-icon">${img(P+'atributos_status/classe_armadura.png','','CA')}<b>4</b></div><div class="sheet-quick value-icon">${img(P+'atributos_status/valor_colchetes.png','','CAA')}<b>15</b></div><div class="sheet-quick icon-only">${img(X+'011_icone_d20.png','','Ataque')}</div><div class="sheet-quick icon-only">${img(X+'015_icone_mochila.png','','Bolsa')}</div><div class="sheet-quick icon-only">${img(X+'012_icone_livros.png','','Livros')}</div><div class="sheet-level"><b>NÍV. 3</b><span>XP 5.240</span></div>`;
    main.innerHTML=`<section class="canonical-sheet" data-visual-lock="sheet" data-context-only="true"><div class="sheet-attributes">${attr('FOR','15','+1','forca_for',true)}${attr('INT','10','0','inteligencia_int')}${attr('SAB','12','0','sabedoria_sab')}${attr('DES','14','+1','destreza_des')}${attr('CON','13','+1','constituicao_con')}${attr('CAR','9','−1','carisma_car')}</div><div class="sheet-progress-row"><div class="sheet-pv-box"><div class="progress-art pv-art">${img(P+'barras_compactas/barra_vida.png','','PV')}</div><b>PV 14 / 18</b></div><div class="sheet-progress"><div class="progress-art">${img(P+'barras_compactas/barra_xp.png','','XP')}</div><small>XP 5.240</small></div><div class="sheet-progress"><div class="progress-art">${img(P+'barras_compactas/barra_viagem.png','','Movimento')}</div><small>MOV. 90′</small></div></div><i class="sheet-rule"></i><section class="sheet-reference"><div class="combat-block"><h3>DEFESA &amp; COMBATE</h3><div class="combat-line"><span>CA <b>4</b></span><span>CAA <b>15</b></span><span>ATAQUE <b>+2</b></span><span>ARMA <b>ESPADA LONGA</b></span></div><small>estado ilustrativo</small></div><div class="saves-block"><h3>SALVAMENTOS</h3>${[['Morte/Veneno','12'],['Varinhas','13'],['Paralisia/Pedra','14'],['Sopro','15'],['Feitiços','16']].map(([n,v])=>`<div><span>${n}</span><b>${v}</b></div>`).join('')}</div><div class="inventory-parchment"><h3>INVENTÁRIO</h3><p>Armadura</p><p>Escudo</p><p>Espada longa</p><p>Arco e flechas</p><p>Tochas</p><p>Rações</p>${img(X+'015_icone_mochila.png','inventory-mark','Bolsa')}</div></section></section>`;
  }

  function patch(){const screen=device.dataset.screen,root=main.firstElementChild;if(screen==='session'&&(!root||root.dataset.visualLock!=='session'))renderSession();else if(screen==='map'&&(!root||root.dataset.visualLock!=='map'))renderMap();else if(screen==='sheet'&&(!root||root.dataset.visualLock!=='sheet'))renderSheet();}
  let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patch();});};new MutationObserver(schedule).observe(device,{subtree:true,childList:true,attributes:true,attributeFilter:['data-screen']});schedule();
})();
