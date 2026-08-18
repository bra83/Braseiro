(() => {
  'use strict';
  const E = window.XWNEngine;
  let state;
  let mapScale = 1;
  const $ = id => document.getElementById(id);

  function loadState() {
    try {
      const raw = localStorage.getItem(E.STORAGE_KEY);
      state = raw ? E.importState(raw) : E.makeInitialState();
    } catch (err) {
      console.warn('Save inválido; criando campanha nova.', err);
      state = E.makeInitialState();
    }
  }

  function saveState() {
    localStorage.setItem(E.STORAGE_KEY, E.exportState(state));
  }

  function hexPixel(q, r) {
    const size = 56;
    const x = size * 1.5 * q;
    const y = size * Math.sqrt(3) * (r + q / 2);
    return { x: 325 + x - 56, y: 285 + y - 48.5 };
  }

  function renderMap() {
    const map = $('hexMap');
    map.innerHTML = '';
    Object.values(state.hexes).forEach(hex => {
      const t = E.TERRAIN[hex.terrain];
      const p = hexPixel(hex.q, hex.r);
      const btn = document.createElement('button');
      btn.className = `hex terrain-${t.css}${hex.discovered ? '' : ' fog'}${hex.q === state.selected.q && hex.r === state.selected.r ? ' selected' : ''}${hex.q === state.current.q && hex.r === state.current.r ? ' current' : ''}`;
      btn.style.left = `${p.x}px`; btn.style.top = `${p.y}px`;
      btn.dataset.q = hex.q; btn.dataset.r = hex.r;
      if (hex.discovered && t.tile) { btn.style.backgroundImage = `url('${t.tile}')`; btn.classList.add('has-tile'); }
      if (hex.road && hex.discovered) {
        const road = document.createElement('span'); road.className = 'road-stroke'; btn.appendChild(road);
      }
      if (hex.discovered && hex.explored && hex.poi) {
        const marker = document.createElement('span'); marker.className = 'poi-marker';
        if (hex.poi.image) { const img = document.createElement('img'); img.src = hex.poi.image; img.alt = ''; marker.appendChild(img); }
        else marker.textContent = hex.poi.icon || '•';
        btn.appendChild(marker);
      }
      if (hex.discovered) {
        const label = document.createElement('span'); label.className = 'hex-label';
        label.textContent = hex.explored && hex.poi ? hex.poi.name : `${hex.q},${hex.r}`;
        btn.appendChild(label);
      }
      btn.addEventListener('click', () => { E.selectHex(state, hex.q, hex.r); renderAll(false); });
      map.appendChild(btn);
    });
    document.documentElement.style.setProperty('--mapScale', mapScale);
  }

  function renderMeta() {
    $('campaignName').textContent = state.campaign.name;
    $('dayLabel').textContent = `Dia ${state.campaign.day}`;
    $('timeLabel').textContent = `${String(state.campaign.hour).padStart(2,'0')}:00`;
    $('weatherLabel').textContent = state.campaign.weather;
    $('seasonLabel').textContent = state.campaign.season;
    const h = state.hexes[E.key(state.selected.q, state.selected.r)];
    const current = state.hexes[E.key(state.current.q, state.current.r)];
    $('hexTitle').textContent = current.explored && current.poi ? current.poi.name : `Hex ${current.key}`;
    $('selectedLabel').textContent = h.discovered ? (h.explored && h.poi ? h.poi.name : `Hex ${h.key}`) : 'Não mapeado';
    $('terrainLabel').textContent = h.discovered ? E.TERRAIN[h.terrain].label : 'Desconhecido';
    $('discoveryLabel').textContent = h.explored ? 'Explorado' : h.discovered ? 'Revelado' : 'Névoa';
    const adjacent = E.isAdjacent(state.current, state.selected);
    $('travelBtn').disabled = !adjacent || !!state.combat;
    $('travelBtn').textContent = adjacent ? 'Viajar para o hex' : (h.key === current.key ? 'Você está aqui' : 'Selecione um hex adjacente');
    $('exploreBtn').disabled = !!state.combat;
  }

  function renderStory() {
    const feed = $('storyFeed'); feed.innerHTML = '';
    (state.narrative || []).forEach(text => { const p = document.createElement('p'); p.textContent = text; feed.appendChild(p); });
    if (state.lastMechanics) { $('mechanicsBox').hidden = false; $('mechanicsText').textContent = state.lastMechanics; }
    else $('mechanicsBox').hidden = true;
    renderSuggestions();
    renderCombat();
  }

  function renderSuggestions() {
    const s = $('suggestions'); s.innerHTML = '';
    const current = state.hexes[E.key(state.current.q, state.current.r)];
    let list = ['Observo a área', 'Procuro rastros', 'Forrageio por comida'];
    if (current.key === '0,0') list = ['Pergunto a Mara sobre a torre', 'Converso com Irmão Del', 'Observo a carroça de sal'];
    if (state.combat) list = ['Ataco com a espada', 'Tento fugir'];
    list.forEach(text => {
      const b = document.createElement('button'); b.textContent = text;
      b.addEventListener('click', () => { $('actionInput').value = text; $('actionInput').focus(); }); s.appendChild(b);
    });
  }

  function renderCombat() {
    const box = $('combatBox');
    if (!state.combat) { box.hidden = true; return; }
    box.hidden = false;
    const e = state.combat.enemy;
    $('enemyName').textContent = e.name;
    $('enemyHpText').textContent = `${e.hp} PV restantes • AC ${e.ac}`;
    const max = E.ENEMIES[e.id] ? E.ENEMIES[e.id].hp : Math.max(e.hp, 1);
    $('enemyHpBar').style.width = `${Math.max(0, Math.min(100, e.hp / max * 100))}%`;
  }

  function renderCharacter() {
    const p = state.player;
    $('charName').textContent = p.name;
    $('charClass').textContent = `${p.className} ${p.level}`;
    $('hpText').textContent = `${p.hp}/${p.maxHp}`; $('acText').textContent = p.ac; $('abText').textContent = p.attackBonus >= 0 ? `+${p.attackBonus}` : p.attackBonus; $('strainText').textContent = p.systemStrain; $('conditionText').textContent = p.condition || 'Apto';
    $('playerHpBar').style.width = `${Math.max(0, p.hp / p.maxHp * 100)}%`;
    const attrNames = { str:'FOR', dex:'DES', con:'CON', int:'INT', wis:'SAB', cha:'CAR' };
    $('attrGrid').innerHTML = Object.entries(p.attrs).map(([k,v]) => `<div><span>${attrNames[k]}</span><strong>${v} (${p.mods[k] >= 0 ? '+' : ''}${p.mods[k]})</strong></div>`).join('');
    $('skillsGrid').innerHTML = Object.entries(p.skills).filter(([,v]) => v >= 0).map(([k,v]) => `<span class="skill">${k} ${v}</span>`).join('');
    $('inventoryList').innerHTML = p.inventory.map(i => `<span class="item">${escapeHtml(i)}</span>`).join('');
  }

  function renderFactions() {
    $('factionList').innerHTML = state.factions.map(f => `<div class="faction-card"><b>${escapeHtml(f.name)}</b><small>${escapeHtml(f.goal)}</small><div class="progress"><i style="width:${Math.min(100, f.progress*20)}%"></i></div></div>`).join('');
  }

  function renderJournal() {
    $('journalList').innerHTML = state.journal.map(j => `<article class="journal-item"><small>${escapeHtml(j.when)} • ${escapeHtml(j.type.toUpperCase())}</small><p>${escapeHtml(j.text)}</p></article>`).join('');
  }

  function renderRules() { if (state.lastRuleAnswer) $('rulesAnswer').textContent = state.lastRuleAnswer; }
  function renderAll(persist = true) { renderMap(); renderMeta(); renderStory(); renderCharacter(); renderFactions(); renderJournal(); renderRules(); if (persist) saveState(); }

  function handleResult(result) {
    if (!result) return;
    if (result.narrative) state.narrative = result.narrative;
    if (typeof result.mechanics === 'string') state.lastMechanics = result.mechanics;
    renderAll(true);
    $('storySection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  $('travelBtn').addEventListener('click', () => handleResult(E.travelTo(state, state.selected.q, state.selected.r)));
  $('exploreBtn').addEventListener('click', () => handleResult(E.exploreCurrentHex(state)));
  $('sendAction').addEventListener('click', () => { const text = $('actionInput').value.trim(); if (!text) return; $('actionInput').value = ''; handleResult(E.performAction(state, text)); });
  $('actionInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('sendAction').click(); } });
  $('sendRule').addEventListener('click', () => { const q = $('rulesInput').value.trim(); if (!q) return; const before = JSON.stringify({ day: state.campaign.day, hour: state.campaign.hour, current: state.current, journal: state.journal.length }); const answer = E.queryRules(state, q); const after = JSON.stringify({ day: state.campaign.day, hour: state.campaign.hour, current: state.current, journal: state.journal.length }); $('rulesAnswer').textContent = answer + (before === after ? '\n\n✓ Cena preservada: nenhuma alteração temporal, espacial ou narrativa.' : '\n\n⚠ Auditoria: alteração indevida detectada.'); $('rulesInput').value = ''; saveState(); });
  $('rulesInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('sendRule').click(); } });
  $('attackBtn').addEventListener('click', () => handleResult(E.playerAttack(state)));
  $('fleeBtn').addEventListener('click', () => handleResult(E.fleeCombat(state)));
  $('zoomIn').addEventListener('click', () => { mapScale = Math.min(1.6, mapScale + .1); renderMap(); });
  $('zoomOut').addEventListener('click', () => { mapScale = Math.max(.65, mapScale - .1); renderMap(); });
  $('zoomReset').addEventListener('click', () => { mapScale = 1; renderMap(); $('mapViewport').scrollTo({left: 90, top: 55, behavior:'smooth'}); });
  $('ttsBtn').addEventListener('click', () => { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance((state.narrative || []).join(' ')); u.lang = 'pt-BR'; u.rate = 1.12; speechSynthesis.speak(u); });
  $('exportBtn').addEventListener('click', () => { const blob = new Blob([E.exportState(state)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `braseiro_xwn_${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); });
  $('importInput').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; try { state = E.importState(await file.text()); renderAll(true); } catch (err) { alert('JSON inválido: ' + err.message); } e.target.value = ''; });
  $('resetBtn').addEventListener('click', () => { if (confirm('Reiniciar a campanha piloto?')) { localStorage.removeItem(E.STORAGE_KEY); state = E.makeInitialState(); renderAll(true); } });
  document.querySelectorAll('.bottom-nav button').forEach(b => b.addEventListener('click', () => $(b.dataset.target).scrollIntoView({ behavior:'smooth', block:'start' })));

  loadState();
  renderAll(false);
  requestAnimationFrame(() => $('mapViewport').scrollTo({ left: 85, top: 55 }));
})();
