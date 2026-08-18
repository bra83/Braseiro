(function (global) {
  'use strict';

  const VERSION = '1.0.0';
  const STORAGE_KEY = 'braseiro_xwn_wwn_v100';
  const HEX_RADIUS = 3;
  const AXIAL_DIRS = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];

  const DIFFICULTIES = Object.freeze({ routine: 6, competent: 8, hard: 10, master: 12, legendary: 14 });
  const TERRAIN = Object.freeze({
    plains: { label: 'Planície', mph: 3, exploreDays: 1, encounterDie: 8, css: 'plains', tile: 'assets/terrain/plains_lush.png' },
    farmland: { label: 'Campos cultivados', mph: 3, exploreDays: 1, encounterDie: 10, css: 'farmland', tile: 'assets/terrain/farmland.png' },
    forest: { label: 'Floresta leve', mph: 2, exploreDays: 1, encounterDie: 8, css: 'forest', tile: 'assets/terrain/forest_lush.png' },
    dense_forest: { label: 'Floresta densa', mph: 1.5, exploreDays: 2, encounterDie: 6, css: 'dense-forest', tile: 'assets/terrain/forest_lush.png' },
    hills: { label: 'Colinas acidentadas', mph: 1.5, exploreDays: 2, encounterDie: 6, css: 'hills', tile: 'assets/terrain/hills_lush.png' },
    mountains: { label: 'Montanhas', mph: 0.5, exploreDays: 2, encounterDie: 6, css: 'mountains', tile: 'assets/terrain/mountains_lush.png' },
    swamp: { label: 'Pântano', mph: 1, exploreDays: 2, encounterDie: 6, css: 'swamp', tile: 'assets/terrain/swamp.png' },
    water: { label: 'Águas rasas', mph: 1, exploreDays: 2, encounterDie: 8, css: 'water', tile: 'assets/terrain/water.png' }
  });

  const POIS = Object.freeze({
    '0,0': { name: 'Dorsa', kind: 'settlement', icon: '⌂', summary: 'Uma aldeia murada em torno de uma velha ponte de pedra.', public: true },
    '1,0': { name: 'Bosque das Lanternas', kind: 'site', icon: '✦', summary: 'Luzes amarelas aparecem entre os troncos depois do crepúsculo.' },
    '1,-1': { name: 'Torre de Cinza', kind: 'ruin', icon: 'tower', image: 'assets/poi/tower.png', summary: 'Uma torre sem telhado vigia o vale como um dente escurecido.', forcedEncounter: 'ash_scout' },
    '0,-1': { name: 'Campos de Rill', kind: 'farm', icon: '♜', summary: 'Terra fértil cortada por valas e pequenas propriedades abandonadas.' },
    '-1,0': { name: 'Brejo do Vidro', kind: 'hazard', icon: '≈', summary: 'Água rasa, limo cinzento e reflexos que não acompanham o céu.' },
    '-1,1': { name: 'Cemitério dos Peregrinos', kind: 'ruin', icon: 'cemetery', image: 'assets/poi/cemetery.png', summary: 'Lápides inclinadas cercam uma capela sem portas.', forcedEncounter: 'grave_robber' },
    '0,1': { name: 'Marco Quebrado', kind: 'landmark', icon: '◆', summary: 'Um marco de estrada partido, coberto por inscrições quase apagadas.' },
    '2,-1': { name: 'Passo do Corvo', kind: 'landmark', icon: '▲', summary: 'A única passagem segura por uma serra de pedra negra.' },
    '2,-2': { name: 'Mosteiro Afundado', kind: 'ruin', icon: '✚', summary: 'Telhados de ardósia emergem de uma depressão tomada pela mata.' },
    '-2,1': { name: 'Poço das Vozes', kind: 'site', icon: '◉', summary: 'Um poço circular de pedra no meio do brejo; ecos respondem antes da pergunta.' },
    '-2,2': { name: 'Lago de Orne', kind: 'water', icon: '≈', summary: 'Água escura e imóvel, cercada por salgueiros baixos.' },
    '1,1': { name: 'Pedreira Velha', kind: 'site', icon: '◇', summary: 'Cortes retos na rocha e guindastes de madeira abandonados.' },
    '2,0': { name: 'Muralha dos Três Reis', kind: 'landmark', icon: '▦', summary: 'Trechos de muralha ciclópica seguem a crista das colinas.' },
    '-1,-1': { name: 'Casa do Salgueiro', kind: 'site', icon: '⌂', summary: 'Uma casa isolada continua soltando fumaça apesar da estrada ter sumido.' }
  });

  const ENEMIES = Object.freeze({
    ash_scout: { id: 'ash_scout', name: 'Batedor da Cinza', hp: 6, ac: 13, ab: 1, damage: '1d6', morale: 7, shock: 2, shockAC: 13 },
    grave_robber: { id: 'grave_robber', name: 'Saqueador de Túmulos', hp: 5, ac: 12, ab: 1, damage: '1d6', morale: 6, shock: 1, shockAC: 13 },
    marsh_hound: { id: 'marsh_hound', name: 'Cão do Brejo', hp: 4, ac: 12, ab: 1, damage: '1d4', morale: 7, shock: 1, shockAC: 12 },
    road_bandit: { id: 'road_bandit', name: 'Bandido da Estrada', hp: 5, ac: 13, ab: 1, damage: '1d6', morale: 6, shock: 2, shockAC: 13 }
  });

  function key(q, r) { return `${q},${r}`; }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function attrMod(score) {
    if (score <= 3) return -2;
    if (score <= 7) return -1;
    if (score <= 13) return 0;
    if (score <= 17) return 1;
    return 2;
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function nextRandom(state) {
    const x = Math.sin((state.seed + state.rngCursor * 9301) * 0.0174533) * 10000;
    state.rngCursor += 1;
    return x - Math.floor(x);
  }

  function rollDie(state, sides) { return 1 + Math.floor(nextRandom(state) * sides); }
  function rollDice(state, count, sides) {
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(rollDie(state, sides));
    return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
  }

  function parseDie(expr, state) {
    const m = String(expr).match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (!m) return { total: 0, rolls: [] };
    const count = Number(m[1]), sides = Number(m[2]);
    const base = rollDice(state, count, sides);
    const mod = m[3] ? (m[3] === '+' ? 1 : -1) * Number(m[4]) : 0;
    return { total: base.total + mod, rolls: base.rolls, mod };
  }

  function axialDistance(a, b) {
    const aq = a.q, ar = a.r, as = -aq - ar;
    const bq = b.q, br = b.r, bs = -bq - br;
    return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(as - bs)) / 2;
  }

  function isAdjacent(a, b) { return axialDistance(a, b) === 1; }

  function terrainFor(q, r) {
    const k = key(q, r);
    const explicit = {
      '0,0': 'farmland', '1,0': 'forest', '1,-1': 'hills', '0,-1': 'farmland', '-1,0': 'swamp', '-1,1': 'plains', '0,1': 'plains',
      '2,-1': 'mountains', '2,-2': 'dense_forest', '-2,1': 'swamp', '-2,2': 'water', '1,1': 'hills', '2,0': 'hills', '-1,-1': 'forest',
      '3,-1': 'mountains', '3,-2': 'mountains', '3,-3': 'mountains', '2,-3': 'dense_forest', '1,-3': 'dense_forest', '0,-3': 'forest',
      '-1,-2': 'forest', '-2,-1': 'swamp', '-3,0': 'swamp', '-3,1': 'swamp', '-3,2': 'water', '-3,3': 'water', '-2,3': 'water',
      '-1,3': 'plains', '0,3': 'plains', '1,2': 'farmland', '2,1': 'hills', '3,0': 'mountains', '0,2': 'farmland', '-1,2': 'plains',
      '-2,0': 'swamp', '0,-2': 'forest', '1,-2': 'forest', '-2,2': 'water'
    };
    return explicit[k] || 'plains';
  }

  function roadFor(q, r) {
    const roadKeys = new Set(['-1,1', '0,1', '0,0', '0,-1', '1,-1', '2,-1']);
    return roadKeys.has(key(q, r));
  }

  function generateHexes() {
    const out = {};
    for (let q = -HEX_RADIUS; q <= HEX_RADIUS; q++) {
      const r1 = Math.max(-HEX_RADIUS, -q - HEX_RADIUS);
      const r2 = Math.min(HEX_RADIUS, -q + HEX_RADIUS);
      for (let r = r1; r <= r2; r++) {
        const k = key(q, r);
        out[k] = {
          q, r, key: k,
          terrain: terrainFor(q, r),
          road: roadFor(q, r),
          discovered: k === '0,0' || axialDistance({ q, r }, { q: 0, r: 0 }) === 1,
          explored: k === '0,0',
          visited: k === '0,0',
          poi: POIS[k] ? clone(POIS[k]) : null,
          notes: []
        };
      }
    }
    return out;
  }

  function makeInitialState() {
    const playerAttrs = { str: 10, dex: 14, con: 12, int: 13, wis: 14, cha: 9 };
    const state = {
      schema: 1,
      version: VERSION,
      seed: hashString('DORSA-V010'),
      rngCursor: 1,
      campaign: { name: 'As Marchas de Orne', system: 'WWN', day: 1, hour: 8, weather: 'Bruma fria', season: 'Outono', worldTurn: 0 },
      atlas: { id: 'orne-r3', orientation: 'flat', radius: 3, hexMiles: 6, source: 'acervo-compartilhado' },
      current: { q: 0, r: 0 },
      selected: { q: 0, r: 0 },
      hexes: generateHexes(),
      player: {
        name: 'Elian Vargo', level: 1, className: 'Expert', hp: 6, maxHp: 6, ac: 13, attackBonus: 0,
        attrs: playerAttrs,
        mods: Object.fromEntries(Object.entries(playerAttrs).map(([k, v]) => [k, attrMod(v)])),
        skills: { notice: 1, survive: 1, connect: 0, sneak: 0, exert: 0, stab: 0, shoot: -1, heal: 0, know: 0, convince: 0 },
        weapon: { name: 'Espada curta', damage: '1d6', skill: 'stab', attr: 'dex', shock: 2, shockAC: 13 },
        inventory: ['Espada curta', 'Arco curto', 'Mochila', '2 dias de comida', 'Odre', 'Pederneira'],
        systemStrain: 0, condition: 'Apto', frail: false, mortallyWounded: false
      },
      factions: [
        { id: 'salt', name: 'Companhia do Sal', power: 2, goal: 'Controlar a ponte de Dorsa', progress: 0 },
        { id: 'bell', name: 'Irmãos do Sino', power: 1, goal: 'Recuperar uma relíquia perdida', progress: 0 },
        { id: 'ash', name: 'Vigias da Cinza', power: 2, goal: 'Abrir o Passo do Corvo', progress: 0 }
      ],
      npcs: {
        mara: { name: 'Mara Tessel', role: 'estalajadeira', disposition: 1, knows: ['A Torre de Cinza voltou a mostrar luz à noite.', 'Dois carregadores sumiram no Marco Quebrado.'] },
        del: { name: 'Irmão Del', role: 'escriba itinerante', disposition: 0, knows: ['O cemitério é mais antigo que Dorsa.', 'Há marcas novas na pedra do Passo do Corvo.'] }
      },
      journal: [],
      rumors: [],
      pendingActions: [],
      combat: null,
      lastMechanics: '',
      lastRuleAnswer: '',
      narrative: []
    };
    addJournal(state, 'campanha', 'A campanha começou em Dorsa, ao amanhecer do primeiro dia.');
    state.narrative = openingScene(state);
    return state;
  }

  function nowLabel(state) {
    return `Dia ${state.campaign.day}, ${String(state.campaign.hour).padStart(2, '0')}:00`;
  }

  function addJournal(state, type, text) {
    state.journal.unshift({ id: `${Date.now()}-${state.journal.length}`, type, when: nowLabel(state), text });
    if (state.journal.length > 200) state.journal.length = 200;
  }

  function openingScene() {
    return [
      'A manhã encontra Dorsa coberta por uma bruma baixa. A velha ponte de pedra desaparece pela metade dentro do nevoeiro, e carroças atravessam devagar para não assustar os animais.',
      'Perto do portão oriental, uma carroça de sal permanece parada sem condutor. Ninguém parece tratá-la como emergência, mas os carregadores evitam olhar para ela por tempo demais.',
      'A estrada segue para os campos e, além deles, sobe na direção de uma torre escura recortada contra as colinas. Você ainda tem o dia inteiro pela frente.'
    ];
  }

  function sceneForHex(hex, state, mode) {
    const t = TERRAIN[hex.terrain];
    const base = [];
    const weather = state.campaign.weather.toLowerCase();
    const byTerrain = {
      plains: 'A terra se abre em ondulações baixas, com capim úmido e longas linhas de visão.',
      farmland: 'Valas rasas dividem os campos. Cercas de pedra e árvores antigas marcam propriedades que parecem maiores do que seus donos conseguem manter.',
      forest: 'A estrada se estreita sob copas irregulares. O chão guarda folhas velhas, raízes expostas e marcas que a luz lateral transforma em pistas falsas.',
      dense_forest: 'A mata fecha o horizonte. Galhos cruzados abafam o vento e obrigam cada escolha de direção a ser consciente.',
      hills: 'O terreno sobe em lombadas pedregosas. Cada crista oferece visão melhor e, ao mesmo tempo, deixa qualquer viajante mais exposto.',
      mountains: 'A pedra domina a paisagem. O caminho escolhe por você onde é possível passar, e cada desvio custa tempo.',
      swamp: 'A água invade o caminho em lâminas rasas. O solo firme aparece em ilhas estreitas, separadas por lama escura.',
      water: 'A margem é baixa e enlameada. A superfície quase imóvel devolve um céu mais escuro do que deveria.'
    };
    if (mode === 'arrival') base.push(`Você entra em ${t.label.toLowerCase()}. ${byTerrain[hex.terrain]}`);
    else base.push(byTerrain[hex.terrain]);
    if (hex.road) base.push('Uma estrada antiga atravessa este hex e oferece avanço mais rápido enquanto o piso se mantém transitável.');
    if (weather.includes('bruma')) base.push('A bruma reduz a distância útil de observação, mas também encobre movimentos discretos.');
    if (hex.explored && hex.poi) base.push(`${hex.poi.name}: ${hex.poi.summary}`);
    else if (hex.discovered && hex.poi && hex.poi.public) base.push(`${hex.poi.name} é visível e conhecido daqui.`);
    return base;
  }

  function revealNeighbors(state, center) {
    for (const d of AXIAL_DIRS) {
      const h = state.hexes[key(center.q + d.q, center.r + d.r)];
      if (h) h.discovered = true;
    }
  }

  function advanceHours(state, hours) {
    state.campaign.hour += Math.max(0, Math.ceil(hours));
    while (state.campaign.hour >= 24) {
      state.campaign.hour -= 24;
      state.campaign.day += 1;
      dailyWorldUpdate(state);
    }
  }

  function advanceDays(state, days) {
    for (let i = 0; i < days; i++) {
      state.campaign.day += 1;
      dailyWorldUpdate(state);
    }
  }

  function dailyWorldUpdate(state) {
    if (state.campaign.day % 7 === 0) {
      state.campaign.worldTurn += 1;
      const faction = state.factions[state.campaign.worldTurn % state.factions.length];
      faction.progress += 1;
      addJournal(state, 'mundo', `${faction.name} avançou silenciosamente seu objetivo: ${faction.goal}.`);
    }
    const weatherRoll = rollDie(state, 6);
    if (weatherRoll === 1) state.campaign.weather = 'Chuva pesada';
    else if (weatherRoll === 2) state.campaign.weather = 'Vento frio';
    else if (weatherRoll >= 5) state.campaign.weather = 'Céu aberto';
    else state.campaign.weather = 'Bruma fria';
  }

  function travelHours(hex, state) {
    const t = TERRAIN[hex.terrain];
    let mph = t.mph;
    if (hex.road) mph = Math.min(3, mph * 2);
    if (/chuva pesada|lama|tempestade/i.test(state.campaign.weather)) mph *= 0.5;
    return 6 / mph;
  }

  // WWN assumes at most ten hours of overland travel in a day. Long crossings
  // automatically include a night camp rather than silently treating 12+ hours
  // as one uninterrupted march.
  function advanceTravelTime(state, travelHoursRequired) {
    let remaining = Math.max(0, travelHoursRequired);
    let marchingHours = 0;
    let campNights = 0;
    while (remaining > 0.001) {
      if (state.campaign.hour < 8) advanceHours(state, 8 - state.campaign.hour);
      if (state.campaign.hour >= 18) {
        advanceHours(state, 24 - state.campaign.hour + 8);
        campNights += 1;
        continue;
      }
      const capacity = 18 - state.campaign.hour;
      const leg = Math.min(remaining, capacity, 10);
      advanceHours(state, leg);
      marchingHours += leg;
      remaining -= leg;
      if (remaining > 0.001) {
        advanceHours(state, 24 - state.campaign.hour + 8);
        campNights += 1;
      }
    }
    return { marchingHours, campNights };
  }

  function encounterCheck(state, hex, context) {
    if (context === 'explore' && hex.poi && hex.poi.forcedEncounter && !hex.poi.encounterResolved) {
      return clone(ENEMIES[hex.poi.forcedEncounter]);
    }
    const die = TERRAIN[hex.terrain].encounterDie;
    const r = rollDie(state, die);
    if (r !== 1) return null;
    if (hex.terrain === 'swamp') return clone(ENEMIES.marsh_hound);
    return clone(ENEMIES.road_bandit);
  }

  function selectHex(state, q, r) {
    if (!state.hexes[key(q, r)]) return { ok: false, reason: 'Hex inexistente.' };
    state.selected = { q, r };
    return { ok: true };
  }

  function travelTo(state, q, r) {
    if (state.combat) return { ok: false, narrative: ['Você precisa resolver o combate antes de viajar.'], mechanics: '' };
    const dest = state.hexes[key(q, r)];
    if (!dest) return { ok: false, narrative: ['Esse hex não pertence ao atlas atual.'], mechanics: '' };
    if (!isAdjacent(state.current, { q, r })) return { ok: false, narrative: ['O destino não é adjacente. Escolha um dos seis hexes vizinhos.'], mechanics: '' };

    const hours = travelHours(dest, state);
    const journey = advanceTravelTime(state, hours);
    state.current = { q, r };
    state.selected = { q, r };
    dest.discovered = true;
    dest.visited = true;
    revealNeighbors(state, state.current);
    const hoursLabel = `${Math.ceil(journey.marchingHours)}h de marcha${journey.campNights ? ` + ${journey.campNights} acampamento${journey.campNights > 1 ? 's' : ''}` : ''}`;
    const mechanics = `VIAGEM — 6 milhas; ${TERRAIN[dest.terrain].label}; velocidade base ${TERRAIN[dest.terrain].mph} mph${dest.road ? '; estrada aplicada (máx. 3 mph)' : ''}; ${hoursLabel}. Limite aplicado: até 10h de marcha/dia.`;
    addJournal(state, 'viagem', `Chegada ao hex ${dest.key} (${TERRAIN[dest.terrain].label}).`);
    const narrative = sceneForHex(dest, state, 'arrival');
    const encounter = encounterCheck(state, dest, 'travel');
    if (encounter) {
      const start = startCombat(state, encounter, 'viagem');
      narrative.push(...start.narrative);
      return { ok: true, narrative, mechanics: `${mechanics}\n${start.mechanics}` };
    }
    return { ok: true, narrative, mechanics };
  }

  function exploreCurrentHex(state) {
    if (state.combat) return { ok: false, narrative: ['Você não consegue conduzir uma exploração sistemática enquanto a luta está em curso.'], mechanics: '' };
    const hex = state.hexes[key(state.current.q, state.current.r)];
    const days = TERRAIN[hex.terrain].exploreDays;
    advanceDays(state, days);
    hex.explored = true;
    hex.discovered = true;
    revealNeighbors(state, state.current);
    const mechanics = `EXPLORAÇÃO — hex de 6 milhas; ${days} dia${days > 1 ? 's' : ''} de reconhecimento (${TERRAIN[hex.terrain].label}).`;
    const narrative = sceneForHex(hex, state, 'explore');
    if (hex.poi) {
      narrative.push(`Depois de uma busca deliberada, o lugar deixa de ser apenas um ponto no mapa. ${hex.poi.name} se revela como algo que merece atenção própria.`);
      addJournal(state, 'descoberta', `${hex.poi.name} foi localizado em ${hex.key}.`);
    } else {
      narrative.push('A busca cobre os marcos principais do hex. Nada aqui se impõe como sítio maior, embora pequenos detalhes ainda possam escapar a uma varredura comum.');
      addJournal(state, 'exploração', `O hex ${hex.key} foi explorado.`);
    }
    const encounter = encounterCheck(state, hex, 'explore');
    if (encounter) {
      if (hex.poi) hex.poi.encounterResolved = true;
      const start = startCombat(state, encounter, 'exploração');
      narrative.push(...start.narrative);
      return { ok: true, narrative, mechanics: `${mechanics}\n${start.mechanics}` };
    }
    return { ok: true, narrative, mechanics };
  }

  function skillCheck(state, skill, attr, difficulty, situational = 0) {
    const skillLevel = state.player.skills[skill] ?? -1;
    const attrBonus = state.player.mods[attr] ?? 0;
    let penalty = 0;
    if (skillLevel < 0) penalty = -1;
    const roll = rollDice(state, 2, 6);
    const effectiveSkill = Math.max(0, skillLevel);
    const total = roll.total + effectiveSkill + attrBonus + penalty + clamp(situational, -2, 2);
    return { roll: roll.rolls, total, skill, skillLevel, attr, attrBonus, penalty, situational: clamp(situational, -2, 2), difficulty, success: total >= difficulty };
  }

  function skillMechanics(c) {
    const parts = [`2d6 (${c.roll.join('+')})`, `${c.skill} ${c.skillLevel >= 0 ? c.skillLevel : 'sem treino'}`, `${c.attr.toUpperCase()} ${c.attrBonus >= 0 ? '+' : ''}${c.attrBonus}`];
    if (c.penalty) parts.push(`${c.penalty} sem nível-0`);
    if (c.situational) parts.push(`${c.situational >= 0 ? '+' : ''}${c.situational} situação`);
    return `TESTE — ${parts.join(' | ')} = ${c.total} vs ${c.difficulty}: ${c.success ? 'SUCESSO' : 'FALHA'}.`;
  }

  function performAction(state, rawText) {
    const text = String(rawText || '').trim();
    if (!text) return { ok: false, narrative: [], mechanics: '' };
    if (state.combat) return combatTextAction(state, text);

    const lower = text.toLowerCase();
    const current = state.hexes[key(state.current.q, state.current.r)];
    let check = null;
    let narrative = [];

    if (/regras?|como funciona|qual regra|teste\?|rolagem/i.test(lower)) {
      return { ok: false, narrative: ['Essa mensagem parece uma consulta de regra. Use a caixa azul para que ela não avance a cena.'], mechanics: 'ENTRADA INTERCEPTADA — nenhuma mudança no estado da campanha.' };
    }

    if (/observo|olho em volta|vejo o que|examino o horizonte/i.test(lower)) {
      narrative = sceneForHex(current, state, 'observe');
      narrative.push('Você dedica alguns instantes a organizar o que já está ao alcance dos sentidos. Nada é decidido por rolagem quando a informação é evidente.');
      return completeAction(state, text, narrative, 'SEM TESTE — observação do que já é perceptível; a cena não exige incerteza mecânica.');
    }

    if (/procuro|investigo|vasculho|examino|rastro|pista/i.test(lower)) {
      const diff = current.terrain === 'dense_forest' || current.terrain === 'swamp' ? 10 : 8;
      check = skillCheck(state, 'notice', 'wis', diff, 0);
      if (check.success) {
        const detail = current.poi ? `Você encontra um indício concreto ligado a ${current.poi.name}: marcas recentes mostram que alguém passou por aqui antes de você.` : 'Você encontra sinais de passagem recente: pegadas, um galho rompido e terra ainda úmida sob uma pedra deslocada.';
        narrative.push(detail);
      } else {
        narrative.push('A busca consome tempo e produz apenas sinais ambíguos. Você não perde a possibilidade de continuar, mas fica mais exposto ao que estiver usando a mesma área.');
        advanceHours(state, 1);
      }
      return completeAction(state, text, narrative, skillMechanics(check));
    }

    if (/forrage|comida|caçar|coletar/i.test(lower)) {
      const diff = current.terrain === 'swamp' || current.terrain === 'mountains' ? 10 : 8;
      check = skillCheck(state, 'survive', 'wis', diff, 0);
      if (check.success) {
        state.player.inventory.push('1 dia de comida forrageada');
        narrative.push('Você encontra alimento suficiente para aliviar as provisões do grupo sem precisar desmontar o acampamento ou abandonar a rota.');
      } else {
        narrative.push('O terreno oferece pouco e você gasta parte do dia procurando. O fracasso custa tempo, não uma parede invisível na aventura.');
        advanceHours(state, 2);
      }
      return completeAction(state, text, narrative, skillMechanics(check));
    }

    if (/esgueir|furtiv|sem ser visto|me escondo/i.test(lower)) {
      check = skillCheck(state, 'sneak', 'dex', 8, /bruma|noite/i.test(state.campaign.weather) ? 1 : 0);
      narrative.push(check.success ? 'Você escolhe cobertura, ritmo e silêncio suficientes para atravessar a área sem oferecer um alvo fácil aos olhos alheios.' : 'Você avança com cuidado, mas deixa sinais demais para ter certeza de que passou despercebido. A posição não é perdida, porém sua presença pode ter sido notada.');
      return completeAction(state, text, narrative, skillMechanics(check));
    }

    if (/escal|saltar|forçar|arrombar|nadar/i.test(lower)) {
      check = skillCheck(state, 'exert', 'str', 8, 0);
      narrative.push(check.success ? 'O esforço funciona. Você supera o obstáculo e chega do outro lado ainda em condições de decidir o próximo passo.' : 'Você não consegue concluir a manobra como pretendia. Em vez de bloquear a cena, o erro cobra posição e tempo: você precisa tentar outro método ou aceitar maior exposição.');
      if (!check.success) advanceHours(state, 1);
      return completeAction(state, text, narrative, skillMechanics(check));
    }

    if (/mara|estalajadeira|pergunto|converso|falo com/i.test(lower) && key(state.current.q, state.current.r) === '0,0') {
      const npc = /del|escriba/i.test(lower) ? state.npcs.del : state.npcs.mara;
      const info = npc.knows[Math.floor(nextRandom(state) * npc.knows.length)];
      narrative.push(`${npc.name} interrompe o que estava fazendo antes de responder. “${info}”`);
      narrative.push('A conversa continua aberta; uma pergunta comum não exige teste social. Só haverá rolagem quando você tentar obter algo que o NPC tenha motivo real para negar.');
      if (!state.rumors.includes(info)) state.rumors.push(info);
      addJournal(state, 'rumor', `${npc.name}: ${info}`);
      return completeAction(state, text, narrative, 'SEM TESTE SOCIAL — conversa básica e informação que o NPC está disposto a compartilhar.');
    }

    if (/persuad|convencer|pression|intimid|mentir/i.test(lower)) {
      check = skillCheck(state, 'convince', 'cha', 8, 0);
      narrative.push(check.success ? 'A outra pessoa cede o bastante para abrir uma possibilidade concreta. A concessão não elimina seus próprios interesses, mas muda o que ela aceita fazer agora.' : 'A resistência permanece. Em vez de encerrar a conversa, a tentativa deixa claro qual é o preço, medo ou interesse que precisa ser contornado.');
      return completeAction(state, text, narrative, skillMechanics(check));
    }

    narrative.push(`Você declara: “${text}”. O Mestre registra a intenção sem presumir uma rolagem.`);
    narrative.push('A ação é possível dentro da cena atual; como não há incerteza relevante identificada pelo motor, ela segue sem teste e o mundo permanece disponível para sua próxima decisão.');
    return completeAction(state, text, narrative, 'SEM TESTE — nenhuma incerteza mecânica relevante foi detectada.');
  }

  function completeAction(state, text, narrative, mechanics) {
    state.lastMechanics = mechanics;
    addJournal(state, 'ação', text);
    state.narrative = narrative;
    return { ok: true, narrative, mechanics };
  }

  function startCombat(state, enemy, source) {
    const playerInit = rollDie(state, 8) + state.player.mods.dex;
    const enemyInit = rollDie(state, 8);
    state.combat = { enemy, round: 1, playerTurn: playerInit >= enemyInit, source, initiative: { player: playerInit, enemy: enemyInit }, log: [] };
    const narrative = [`A tensão vira combate: ${enemy.name} fecha a distância e a cena deixa de ser apenas exploração.`];
    const mechanics = `INICIATIVA — jogador ${playerInit}, inimigo ${enemyInit}. ${state.combat.playerTurn ? 'Você age primeiro.' : `${enemy.name} age primeiro.`}`;
    addJournal(state, 'combate', `Combate iniciado contra ${enemy.name}.`);
    if (!state.combat.playerTurn) {
      const enemyResult = enemyAttack(state);
      narrative.push(...enemyResult.narrative);
      return { narrative, mechanics: `${mechanics}\n${enemyResult.mechanics}` };
    }
    return { narrative, mechanics };
  }

  function playerAttack(state) {
    if (state.player.mortallyWounded) return { ok: false, narrative: ['Você está Ferido Mortalmente e não pode agir até ser estabilizado.'], mechanics: 'FERIMENTO MORTAL — personagem indefeso; janela de estabilização de seis rodadas. [WWN SRD 2.5.1]' };
    if (!state.combat) return { ok: false, narrative: ['Não há combate ativo.'], mechanics: '' };
    const enemy = state.combat.enemy;
    const w = state.player.weapon;
    const d20 = rollDie(state, 20);
    const skill = state.player.skills[w.skill] ?? -1;
    const skillPart = skill < 0 ? -2 : skill;
    const total = d20 + state.player.attackBonus + state.player.mods[w.attr] + skillPart;
    let damage = 0;
    let hit = total >= enemy.ac;
    let shock = false;
    if (hit) damage = parseDie(w.damage, state).total + state.player.mods[w.attr];
    else if (enemy.ac <= w.shockAC) { damage = Math.max(0, w.shock + state.player.mods[w.attr]); shock = damage > 0; }
    enemy.hp = Math.max(0, enemy.hp - damage);
    const mechanics = `ATAQUE — d20 ${d20} + AB ${state.player.attackBonus} + ${w.attr.toUpperCase()} ${state.player.mods[w.attr] >= 0 ? '+' : ''}${state.player.mods[w.attr]} + ${w.skill} ${skillPart >= 0 ? '+' : ''}${skillPart} = ${total} vs AC ${enemy.ac}. ${hit ? `Acerto; ${damage} dano.` : shock ? `Erro; Shock ${damage}.` : 'Erro; sem dano.'}`;
    const narrative = [hit ? `A lâmina encontra abertura e ${enemy.name} recua sob o impacto.` : shock ? `O golpe não entra limpo, mas a pressão do combate ainda força ${enemy.name} a ceder terreno e absorver o choque.` : `${enemy.name} evita o golpe sem oferecer uma abertura imediata.`];
    if (enemy.hp <= 0) {
      narrative.push(`${enemy.name} não consegue continuar lutando. O silêncio volta ao lugar aos poucos, deixando as consequências para serem examinadas.`);
      addJournal(state, 'combate', `${enemy.name} foi derrotado.`);
      state.combat = null;
      state.narrative = narrative;
      state.lastMechanics = mechanics;
      return { ok: true, narrative, mechanics };
    }
    const enemyResult = enemyAttack(state);
    narrative.push(...enemyResult.narrative);
    state.combat.round += 1;
    const merged = `${mechanics}\n${enemyResult.mechanics}`;
    state.narrative = narrative;
    state.lastMechanics = merged;
    return { ok: true, narrative, mechanics: merged };
  }

  function enemyAttack(state) {
    const enemy = state.combat.enemy;
    const d20 = rollDie(state, 20);
    const total = d20 + enemy.ab;
    const hit = total >= state.player.ac;
    let damage = 0;
    let shock = false;
    if (hit) damage = parseDie(enemy.damage, state).total;
    else if (state.player.ac <= (enemy.shockAC || 0)) { damage = enemy.shock || 0; shock = damage > 0; }
    state.player.hp = Math.max(0, state.player.hp - damage);
    const mechanics = `INIMIGO — d20 ${d20} + AB ${enemy.ab} = ${total} vs AC ${state.player.ac}. ${hit ? `Acerto; ${damage} dano.` : shock ? `Erro; Shock ${damage}.` : 'Erro.'}`;
    const narrative = [hit ? `${enemy.name} aproveita a abertura e o golpe chega antes que você consiga fechar a guarda.` : shock ? `${enemy.name} não acerta em cheio, mas mantém pressão suficiente para machucar mesmo assim.` : `${enemy.name} ataca, mas você consegue sair da linha do golpe.`];
    if (state.player.hp <= 0) {
      state.player.mortallyWounded = true;
      state.player.condition = 'Ferido Mortalmente';
      state.player.deathRound = 6;
      narrative.push('Você cai Ferido Mortalmente. Pelas regras, um personagem nesse estado fica indefeso e morrerá ao fim da sexta rodada após cair se ninguém o estabilizar.');
      addJournal(state, 'ferimento', 'Elian caiu Ferido Mortalmente; janela de estabilização: seis rodadas.');
    }
    return { narrative, mechanics };
  }

  function fleeCombat(state) {
    if (!state.combat) return { ok: false, narrative: ['Não há combate ativo.'], mechanics: '' };
    const c = skillCheck(state, 'exert', 'dex', 8, 0);
    const enemyName = state.combat.enemy.name;
    const mechanics = `FUGA — ${skillMechanics(c)}`;
    const narrative = [];
    if (c.success) {
      narrative.push(`Você rompe o contato com ${enemyName} e encontra espaço suficiente para transformar a luta em perseguição evitada. A posição fica preservada, mas o inimigo continua existindo no mundo.`);
      addJournal(state, 'combate', `Fuga bem-sucedida de ${enemyName}.`);
      state.combat = null;
    } else {
      narrative.push(`Você tenta abrir distância de ${enemyName}, mas a rota fecha. A falha não encerra sua ação: o inimigo ganha a chance de pressionar antes do próximo movimento.`);
      const e = enemyAttack(state); narrative.push(...e.narrative);
    }
    state.narrative = narrative; state.lastMechanics = mechanics;
    return { ok: true, narrative, mechanics };
  }

  function combatTextAction(state, text) {
    const lower = text.toLowerCase();
    if (/atac|golpe|espada/i.test(lower)) return playerAttack(state);
    if (/fug|recu|escapar/i.test(lower)) return fleeCombat(state);
    return { ok: true, narrative: ['Em combate, a V1 aceita ações estruturadas de atacar ou fugir. A intenção foi registrada, mas não foi transformada em uma rolagem inventada.'], mechanics: 'COMBATE — use ATACAR ou FUGIR para resolução mecânica determinística nesta versão.' };
  }

  function queryRules(state, question) {
    const q = String(question || '').trim().toLowerCase();
    if (!q) return '';
    let answer;
    if (/dificuldade|cd|difficulty/.test(q)) answer = 'Dificuldades comuns: 6 tarefa relativamente simples; 8 desafio significativo para um profissional competente; 10 difícil até para alguém habilidoso; 12 confiável apenas para um mestre; 14+ até um mestre provavelmente falha. Modificadores situacionais normalmente ficam entre -2 e +2. [WWN SRD 2.3.1]';
    else if (/teste|skill|perícia|pericia/.test(q)) answer = 'Teste de perícia: role 2d6 e some o nível da perícia e o modificador do atributo relevante; total igual ou maior que a dificuldade é sucesso. Sem sequer nível-0 na perícia pertinente, normalmente há -1 e certas tarefas técnicas podem ser impossíveis. O Mestre só pede teste quando existe incerteza relevante. [WWN SRD 2.3.0]';
    else if (/explor|hex/.test(q)) answer = 'Explorar levemente um hex padrão de 6 milhas leva um dia inteiro e encontra a maioria dos pontos de interesse maiores. Terreno muito acidentado ou ocultante, como montanhas ou pântano sem trilha, pode dobrar ou triplicar esse tempo. [WWN SRD 2.12.1]';
    else if (/viagem|viajar|marcha|milhas/.test(q)) answer = 'Viagem terrestre presume até 10 horas de marcha por dia. Velocidades: planície/savana 3 mph; floresta leve/deserto 2; floresta densa/colinas 1,5; pântano 1; montanhas/ermos 0,5. Estrada dobra a velocidade, mas não acima de 3 mph. Mau tempo reduz pela metade. [WWN SRD 2.11.0]';
    else if (/iniciativa/.test(q)) answer = 'Iniciativa padrão é por lado: cada lado rola 1d8 e soma o melhor modificador de Destreza do grupo; maior resultado age primeiro. A ordem não é rerrolada a cada rodada. [WWN SRD 2.4.2]';
    else if (/shock|choque/.test(q)) answer = 'Algumas armas corpo a corpo causam Shock mesmo quando o ataque erra, desde que a AC corpo a corpo do alvo seja igual ou menor que o valor de AC indicado pelo Shock da arma. O modificador de atributo relevante soma ao Shock. Escudo normalmente nega a primeira fonte de Shock sofrida na rodada. [WWN SRD 2.4.6.4]';
    else if (/ataque|acertar|ac/.test(q)) answer = 'Ataque de personagem: 1d20 + bônus base de ataque + modificador do atributo da arma + perícia de combate relevante. Sem nível-0 na perícia apropriada, a penalidade é -2. Igualar ou superar a AC relevante acerta. [WWN SRD 2.4.5]';
    else if (/salvamento|save|saving/.test(q)) answer = 'Salvamentos usam 1d20 e precisam igualar ou superar o alvo. Há salvamentos Físico, Evasão, Mental e Sorte. Para PCs, os três primeiros derivam de 16 - nível - melhor modificador de atributo do par pertinente; Sorte é 16 - nível. [WWN SRD 2.2.0]';
    else if (/ferido mortal|ferimento mortal|estabiliz/.test(q)) answer = 'Ao chegar a 0 PV por dano letal, um PC fica Ferido Mortalmente, indefeso e incapaz de agir. Ele morre ao fim da sexta rodada após cair se não for estabilizado. Estabilizar normalmente é uma Ação Principal com Dex/Heal ou Int/Heal, dificuldade 8 + rodadas completas desde a queda; sem kit de cura, +2. [WWN SRD 2.5.1]';
    else if (/round|rodada|turno|cena/.test(q)) answer = 'Cena é uma unidade narrativa curta; combate ocorre em rodadas de cerca de 6 segundos; turnos de exploração complexa duram cerca de 10 minutos. Esses relógios são separados para que perguntas de regra não consumam tempo ficcional. [WWN SRD 2.1.0]';
    else answer = 'A consulta não encontrou uma regra local já indexada nesta V1. Ela não avança tempo nem altera a cena. O próximo passo do projeto é ampliar o índice para todo o SRD e depois para os módulos Deluxe/suplementos sem misturar regra com narração.';
    state.lastRuleAnswer = answer;
    return answer;
  }

  function exportState(state) { return JSON.stringify(state, null, 2); }
  function importState(json) {
    const parsed = typeof json === 'string' ? JSON.parse(json) : clone(json);
    if (!parsed || !parsed.hexes || !parsed.player || !parsed.campaign) throw new Error('Save inválido.');
    return parsed;
  }

  const GameBus = (() => {
    const handlers = {};
    return {
      on(event, fn) { (handlers[event] ||= []).push(fn); },
      emit(event, payload) { (handlers[event] || []).forEach(fn => fn(payload)); }
    };
  })();

  const api = {
    VERSION, STORAGE_KEY, HEX_RADIUS, AXIAL_DIRS, DIFFICULTIES, TERRAIN, POIS, ENEMIES,
    key, clone, attrMod, axialDistance, isAdjacent, makeInitialState, selectHex, travelTo, exploreCurrentHex,
    skillCheck, performAction, queryRules, playerAttack, fleeCombat, exportState, importState, revealNeighbors, travelHours, advanceTravelTime, GameBus
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.XWNEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
