(() => {
  'use strict';

  const P='../assets/ose-user-pack-v1/source/TALES_VTT_ASSET_PACK/assets_individuais/';
  const X='assets/';
  const device=document.querySelector('#device');
  const top=document.querySelector('#topbar');
  const status=document.querySelector('#statusbar');
  const main=document.querySelector('#screen');

  const img=(src, cls='', alt='')=>`<img${cls?` class="${cls}"`:''} src="${src}" alt="${alt}" draggable="false">`;

  function canonicalHeader(title, subtitle){
    top.innerHTML=`${img(X+'001_logo_ose.png','brand','Old-School Essentials')}<div class="top-copy"><div class="top-title">${title}</div><div class="top-sub">${subtitle}</div></div><div class="visual-head-actions"><button class="icon-button" aria-label="Menu" data-inspection-only="true">${img(X+'002_icone_menu.png','','Menu')}</button><button class="icon-button" aria-label="Configurações" data-inspection-only="true">${img(X+'003_icone_configuracoes.png','','Configurações')}</button></div>`;
  }

  function terrainFor(q,r){
    const edge=(r<=-6||r>=10||q<=-1||q>=7);
    if(edge) return 'desconhecido';
    if(r<=-4 && (q<2||q>5)) return 'desconhecido';
    if(r>=8 && (q<1||q>5)) return 'desconhecido';
    if((q===5||q===6) && r>=1 && r<=7) return 'agua';
    if((q===1||q===2) && r>=-5 && r<=-2) return 'agua';
    if((q===4||q===5) && r>=-4 && r<=0) return 'montanha';
    if(q===4 && r>=3 && r<=7) return 'montanha';
    if((q===0||q===1) && r>=-2 && r<=2) return 'floresta';
    if((q===0||q===1) && r>=4 && r<=7) return 'floresta';
    if((q+r)%7===0) return 'colinas';
    if((q*2+r)%11===0) return 'pantano';
    return 'planicie';
  }

  function renderMap(){
    canonicalHeader('MAPA DOS ERMOS','Advanced Fantasy • Hexcrawl Geometry V1');
    status.innerHTML=`<div class="map-context-icon">${img(X+'013_icone_mapa.png','','Mapa')}</div><div class="map-context-copy"><b>POSIÇÃO Q3,R2 • VISIBILIDADE LOCAL</b><span>conhecido / rumor / desconhecido • posição única e canônica</span></div>`;

    const hexW=40, hexH=46.188, xStep=40, yStep=34.641, oddOffset=20;
    const cols=9, rows=19, originX=4, originY=3;
    let cells='';
    let partyX=0,partyY=0;
    for(let row=0;row<rows;row++){
      const r=row-7;
      for(let col=0;col<cols;col++){
        const q=col-1;
        const x=originX+col*xStep+(row%2?oddOffset:0);
        const y=originY+row*yStep;
        const t=terrainFor(q,r);
        cells+=`<div class="world-hex terrain-${t}" data-q="${q}" data-r="${r}" data-terrain="${t}" style="left:${x}px;top:${y}px;background-image:url('${P}hexes_compactos/${t}.png')"></div>`;
        if(q===3 && r===2){partyX=x;partyY=y;}
      }
    }

    main.innerHTML=`<section class="canonical-hex-map" data-visual-lock="map" data-geometry-version="1" data-direct-movement="forbidden">
      <div class="map-canvas-wrap" id="canonicalMapViewport" aria-label="Atlas: pan e zoom apenas de câmera">
        <div class="canonical-world-grid" id="canonicalWorldGrid">${cells}<div class="party-current-hex" style="left:${partyX-2}px;top:${partyY-2}px"></div><div class="party-marker" style="left:${partyX+7}px;top:${partyY+8}px">${img(X+'014_icone_grupo.png','','Companhia em Q3,R2')}</div></div>
        <div class="map-camera-controls"><button id="canonZoomOut" data-camera-only="true" aria-label="Diminuir zoom">−</button><button id="canonZoomIn" data-camera-only="true" aria-label="Aumentar zoom">+</button></div>
        <div class="map-position-tag"><b>Q3,R2</b><span>Colinas do Outeiro</span></div>
      </div>
    </section>`;

    const vp=main.querySelector('#canonicalMapViewport');
    const grid=main.querySelector('#canonicalWorldGrid');
    let cam={x:-1,y:0,s:1};
    let drag=null;
    const apply=()=>{grid.style.transform=`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`;};
    apply();
    main.querySelector('#canonZoomIn').onclick=()=>{cam.s=Math.min(1.35,+(cam.s+.08).toFixed(2));apply();};
    main.querySelector('#canonZoomOut').onclick=()=>{cam.s=Math.max(.82,+(cam.s-.08).toFixed(2));apply();};
    vp.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};vp.setPointerCapture(e.pointerId);});
    vp.addEventListener('pointermove',e=>{if(!drag)return;cam.x=drag.cx+e.clientX-drag.x;cam.y=drag.cy+e.clientY-drag.y;apply();});
    vp.addEventListener('pointerup',()=>drag=null);
    vp.addEventListener('pointercancel',()=>drag=null);
  }

  function attr(label,value,mod,asset){
    return `<div class="sheet-attr">${asset?img(P+'atributos_status/'+asset+'.png','sheet-attr-ghost',label):''}<span>${label}</span><b>${value}</b><em>${mod}</em></div>`;
  }

  function renderSheet(){
    canonicalHeader('ALDA • GUERREIRA','Character Sheet • leitura rápida • estado do personagem');
    status.innerHTML=`
      <div class="sheet-quick">${img(P+'atributos_status/coracao.png','','PV')}<b>14/18</b><span>PV</span></div>
      <div class="sheet-quick">${img(P+'atributos_status/classe_armadura.png','','CA')}<b>4</b><span>CA</span></div>
      <div class="sheet-quick">${img(X+'011_icone_d20.png','','Ataque')}<b>+2</b><span>ATQ</span></div>
      <div class="sheet-quick">${img(X+'014_icone_grupo.png','','Nível')}<b>3</b><span>NÍV.</span></div>
      <div class="sheet-quick">${img(X+'012_icone_livros.png','','XP')}<b>5.240</b><span>XP</span></div>`;

    main.innerHTML=`<section class="canonical-sheet" data-visual-lock="sheet" data-context-only="true">
      <div class="sheet-attributes">
        ${attr('FOR','15','+1','forca_for')}${attr('INT','10','0','inteligencia_int')}${attr('SAB','12','0','sabedoria_sab')}
        ${attr('DES','14','+1','destreza_des')}${attr('CON','13','+1','constituicao_con')}${attr('CAR','9','−1','carisma_car')}
      </div>
      <div class="sheet-progress-row">
        <div class="sheet-pv-box"><span>PV</span><div class="bar"><i style="width:78%"></i></div><b>14 / 18</b></div>
        <div class="sheet-progress"><span>XP</span><div class="bar dark"><i style="width:48%"></i></div><small>5.240</small></div>
        <div class="sheet-progress"><span>MOV.</span><div class="bar dark"><i style="width:58%"></i></div><small>90′</small></div>
      </div>
      <i class="sheet-rule"></i>
      <section class="sheet-reference">
        <div class="combat-block"><h3>DEFESA &amp; COMBATE</h3><div class="combat-line"><span>CA <b>4</b></span><span>CAA <b>15</b></span><span>ATAQUE <b>+2</b></span><span>ARMA <b>ESPADA LONGA</b></span></div><small>Valores visíveis; resolução pertence ao Rules Engine.</small></div>
        <div class="saves-block"><h3>SALVAMENTOS</h3>${[['Morte/Veneno','12'],['Varinhas','13'],['Paralisia/Pedra','14'],['Sopro','15'],['Feitiços','16']].map(([n,v])=>`<div><span>${n}</span><b>${v}</b></div>`).join('')}</div>
        <div class="inventory-parchment"><h3>INVENTÁRIO</h3><p>Armadura</p><p>Escudo</p><p>Espada longa</p><p>Arco e flechas</p><p>Tochas</p><p>Rações</p>${img(X+'015_icone_mochila.png','inventory-mark','Bolsa')}</div>
      </section>
    </section>`;
  }

  function patch(){
    const screen=device.dataset.screen;
    const root=main.firstElementChild;
    if(screen==='map' && (!root || root.dataset.visualLock!=='map')) renderMap();
    else if(screen==='sheet' && (!root || root.dataset.visualLock!=='sheet')) renderSheet();
  }

  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patch();});};
  new MutationObserver(schedule).observe(device,{subtree:true,childList:true,attributes:true,attributeFilter:['data-screen']});
  schedule();
})();
