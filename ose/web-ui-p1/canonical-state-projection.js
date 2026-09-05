(() => {
  'use strict';

  const device=document.querySelector('#device');
  const top=document.querySelector('#topbar');
  const status=document.querySelector('#statusbar');
  const main=document.querySelector('#screen');
  const nativePost=(type,payload)=>{
    if(!(window.BraseiroBridge&&typeof window.BraseiroBridge.postMessage==='function'))return false;
    window.BraseiroBridge.postMessage(JSON.stringify({version:1,type,payload}));
    return true;
  };
  const safe=value=>String(value??'').replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[ch]));
  let lastRequestedScreen='';
  let latest=null;

  const baseReceive=window.BraseiroReceive;
  window.BraseiroReceive=(raw)=>{
    let message=null;
    try{message=typeof raw==='string'?JSON.parse(raw):raw;}catch(_){message=null;}
    if(typeof baseReceive==='function')baseReceive(raw);
    if(message&&message.type==='ViewState'){
      latest=message.payload||{};
      if(device.dataset.screen==='company')applyCompany(latest);
    }
  };

  function resourceValue(payload,key){
    const prefix=key+':';
    const fact=(payload.resources||[]).find(v=>String(v).startsWith(prefix));
    return fact?String(fact).slice(prefix.length):'—';
  }

  function positionLabel(position){
    if(!position)return 'POSIÇÃO NÃO REGISTRADA';
    if(position.kind==='HEX')return `HEXCRAWL_MAP · ${safe(position.spatialEntityId)} · q=${position.q} · r=${position.r}`;
    if(position.kind==='DUNGEON')return `DUNGEON · ${safe(position.spatialEntityId)} · ${safe(position.nodeId)}`;
    if(position.kind==='SETTLEMENT')return `SETTLEMENT · ${safe(position.spatialEntityId)} · ${safe(position.anchorId)}`;
    if(position.kind==='SCENE')return `SCENE · ${safe(position.spatialEntityId)} · ${safe(position.sceneId)}`;
    return safe(position.kind||'POSIÇÃO');
  }

  function characterRole(character){
    const ids=Array.isArray(character.classIds)?character.classIds:[];
    if(!ids.length)return 'classe não registrada';
    return ids.map(id=>{
      const level=character.levelByClass&&character.levelByClass[id];
      return `${safe(String(id).replaceAll('_',' '))}${level!=null?' '+safe(level):''}`;
    }).join(' · ');
  }

  function hpLabel(character){
    const hp=character.hitPoints||{};
    const d=Number(hp.denominator||1);
    const cur=Number(hp.currentNumerator||0);
    const max=Number(hp.maxNumerator||0);
    return d===1?`${cur}/${max}`:`${cur}/${d} / ${max}/${d}`;
  }

  function applyCompany(payload){
    const root=main.querySelector('.company-shell');
    if(!root)return;
    const characters=Array.isArray(payload.characters)?payload.characters:[];
    const title=root.querySelector('.company-head .title');
    const sub=root.querySelector('.company-head .sub');
    const grid=root.querySelector('.company-grid');
    const location=root.querySelector('.company-location');
    const topTitle=top.querySelector('.top-title');
    const topSub=top.querySelector('.top-sub');
    if(topTitle)topTitle.textContent='COMPANHIA';
    if(topSub)topSub.textContent=`${payload.ruleProfile||'OSE'} · estado canônico · somente inspeção`;
    if(title)title.textContent='Companhia';
    if(sub)sub.textContent=`${characters.length} ${characters.length===1?'aventureiro':'aventureiros'} · posição compartilhada`;

    if(grid){
      if(!characters.length){
        grid.innerHTML=`<div class="member p0-card" style="grid-column:1/-1;grid-row:1/-1;justify-content:center;padding:18px"><div><div class="member-name">Nenhum personagem na PartyState</div><div class="member-meta">Crie, importe ou carregue um personagem válido para formar a companhia.</div></div></div>`;
      }else{
        grid.innerHTML=characters.map(character=>`<div class="member p0-card"><img src="assets/014_icone_grupo.png" alt="Membro da companhia" draggable="false"><div><div class="member-name">${safe(character.name)}</div><div class="member-meta">${characterRole(character)}<br>PV ${safe(hpLabel(character))}</div><span class="member-status">MEMBRO</span></div></div>`).join('');
      }
    }

    if(location){
      const image=location.querySelector('img');
      const heading=location.querySelector('strong');
      const paragraph=location.querySelector('p');
      const code=location.querySelector('code');
      if(image){image.src='assets/013_icone_mapa.png';image.alt='Posição canônica';}
      if(heading)heading.textContent='Posição única e canônica';
      if(paragraph)paragraph.textContent='Todos os membros usam o mesmo PositionState. Esta superfície é somente leitura e não move tokens, não teleporta e não avança tempo.';
      if(code)code.textContent=positionLabel(payload.position).replaceAll('&amp;','&');
    }

    const tiles=status.querySelectorAll('.status-tile');
    if(tiles.length>=4){
      const values=tiles[0].querySelector('.status-value');
      if(values)values.textContent=`TURNO ${payload.time&&payload.time.turns!=null?payload.time.turns:'—'}`;
      const weather=tiles[1].querySelector('.status-value');
      if(weather)weather.textContent='NÃO REGISTRADO';
      const torch=tiles[2].querySelector('.status-value');
      if(torch)torch.textContent=resourceValue(payload,'torch');
      const rations=tiles[3].querySelector('.status-value');
      if(rations)rations.textContent=resourceValue(payload,'rations');
    }
  }

  function requestForCurrentScreen(){
    const screen=device.dataset.screen||'';
    if(screen===lastRequestedScreen)return;
    lastRequestedScreen=screen;
    if(screen==='company'){
      if(latest)applyCompany(latest);
      nativePost('ViewState',{surface:'company'});
    }
  }

  new MutationObserver(requestForCurrentScreen).observe(device,{attributes:true,attributeFilter:['data-screen']});
  requestAnimationFrame(requestForCurrentScreen);
})();
