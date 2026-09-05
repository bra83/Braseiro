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
      if(device.dataset.screen==='sheet')applySheet(latest);
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

  function totalXp(character){
    const xp=character&&character.xpByClass?Object.values(character.xpByClass):[];
    return xp.reduce((sum,value)=>sum+(Number(value)||0),0);
  }

  function primaryLevel(character){
    const levels=character&&character.levelByClass?Object.values(character.levelByClass):[];
    return levels.length?Math.max(...levels.map(value=>Number(value)||0)):0;
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

  function applySheet(payload){
    const root=main.querySelector('.canonical-sheet');
    if(!root)return;
    const characters=Array.isArray(payload.characters)?payload.characters:[];
    const character=characters[0]||null;
    const topTitle=top.querySelector('.top-title');
    const topSub=top.querySelector('.top-sub');

    if(!character){
      if(topTitle)topTitle.textContent='FICHA';
      if(topSub)topSub.textContent=`${payload.ruleProfile||'OSE'} · nenhum personagem carregado`;
      status.innerHTML=`<div class="sheet-level" style="grid-column:1/-1"><b>SEM PERSONAGEM</b><span>PartyState vazia · nenhum dado ilustrativo exibido</span></div>`;
      root.innerHTML=`<section class="p0-card" style="margin:34px 7px 0;padding:22px 18px;background:rgba(238,213,171,.72)"><div class="section-kicker">FICHA CANÔNICA</div><h2 style="margin:12px 0 8px;font-size:17px">Nenhum personagem carregado</h2><p style="margin:0;font-size:9px;line-height:1.45">A ficha não mostra atributos, PV, CA, salvamentos, equipamento ou XP inventados. Crie, importe ou carregue um personagem válido para projetar o estado real aqui.</p><p style="margin:14px 0 0;font:600 7px/1.4 Arial,sans-serif;color:#725e4a">${safe(positionLabel(payload.position).replaceAll('&amp;','&'))}</p></section>`;
      return;
    }

    if(topTitle)topTitle.textContent=`${character.name}`;
    if(topSub)topSub.textContent=`${characterRole(character)} · estado canônico`;

    const quick=status.querySelectorAll('.sheet-quick');
    if(quick[1]){const b=quick[1].querySelector('b');if(b)b.textContent=String(character.armorClassDescending??'—');}
    if(quick[2]){const b=quick[2].querySelector('b');if(b)b.textContent=String(character.armorClassAscending??'—');}
    const level=status.querySelector('.sheet-level');
    if(level){
      const b=level.querySelector('b');
      const span=level.querySelector('span');
      if(b)b.textContent=`NÍV. ${primaryLevel(character)||'—'}`;
      if(span)span.textContent=`XP ${totalXp(character).toLocaleString('pt-BR')}`;
    }

    const attrValues=[
      ['str','FOR'],['int','INT'],['wis','SAB'],['dex','DES'],['con','CON'],['cha','CAR']
    ];
    root.querySelectorAll('.sheet-attr').forEach((node,index)=>{
      const pair=attrValues[index];
      if(!pair)return;
      const value=node.querySelector('.sheet-attr-value b');
      const mod=node.querySelector('.sheet-attr-value em');
      const image=node.querySelector('.sheet-attr-image');
      if(value)value.textContent=String(character.attributes&&character.attributes[pair[0]]!=null?character.attributes[pair[0]]:'—');
      if(mod){mod.textContent='';mod.setAttribute('aria-label','modificador não projetado');}
      if(image)image.alt=pair[1];
    });

    const hp=root.querySelector('.sheet-pv-box b');
    if(hp)hp.textContent=`PV ${hpLabel(character)}`;
    const progress=root.querySelectorAll('.sheet-progress small');
    if(progress[0])progress[0].textContent=`XP ${totalXp(character).toLocaleString('pt-BR')}`;
    if(progress[1])progress[1].textContent=`MOV. ${resourceValue(payload,'movement')}`;

    const combatValues=root.querySelectorAll('.combat-line span b');
    if(combatValues[0])combatValues[0].textContent=String(character.armorClassDescending??'—');
    if(combatValues[1])combatValues[1].textContent=String(character.armorClassAscending??'—');
    if(combatValues[2])combatValues[2].textContent=String(character.attackBonusAscending??'—');
    if(combatValues[3])combatValues[3].textContent='NÃO REGISTRADA';
    const combatNote=root.querySelector('.combat-block small');
    if(combatNote)combatNote.textContent=`THAC0 ${character.thac0??'—'} · dados vindos do estado canônico`;

    const saves=character.savingThrows||{};
    const saveValues=[saves.deathPoison,saves.wands,saves.paralysisPetrification,saves.breath,saves.spellsRodsStaves];
    root.querySelectorAll('.saves-block>div b').forEach((node,index)=>{node.textContent=String(saveValues[index]??'—');});

    const inventory=root.querySelector('.inventory-parchment');
    if(inventory){
      inventory.innerHTML=`<h3>INVENTÁRIO</h3><p>Inventário estruturado ainda não está disponível neste estado.</p><p style="margin-top:12px;color:#725e4a">Nenhum item ilustrativo é tratado como dado real.</p>`;
    }
  }

  function requestForCurrentScreen(){
    const screen=device.dataset.screen||'';
    if(screen===lastRequestedScreen)return;
    lastRequestedScreen=screen;
    if(screen==='company'||screen==='sheet'){
      if(latest){
        if(screen==='company')applyCompany(latest);
        if(screen==='sheet')applySheet(latest);
      }
      nativePost('ViewState',{surface:screen});
    }
  }

  new MutationObserver(requestForCurrentScreen).observe(device,{attributes:true,attributeFilter:['data-screen']});
  requestAnimationFrame(requestForCurrentScreen);
})();
