function inventoryItemExamineData(item){
  if(!item) return null;
  const name = item.name || 'Unknown Item';
  const usable = item.usable || '';
  const baseDesc = item.desc || 'No shipboard record exists for this object.';
  const data = {
    title:name,
    subtitle:item.isCommodity ? 'Bulk cargo' : usable ? 'Shipboard equipment' : 'Recovered field sample',
    body:baseDesc,
    notes:[],
  };

  if(item.isCommodity){
    data.body = 'A sealed cargo unit tagged for station trade. The manifest matters more than the object inside; dockworkers buy paperwork as much as mass.';
    data.notes.push('Bought at '+(item.boughtAt || 'unknown port')+' for '+(item.boughtPrice || 0)+' cr.');
    data.notes.push('Sell prices depend on the current station market.');
  } else if(usable === 'c4'){
    data.subtitle = 'Military demolition charge';
    data.body = 'A block of plastic explosive with a digital detonator. Standard issue for breaching operations — and occasionally found in forgotten supply lockers where it absolutely should not be.';
    data.notes.push('Arm: press Enter to start a 5-turn countdown.');
    data.notes.push('Drop it before it goes off — 1-tile blast radius destroys doors and weak structures.');
    data.notes.push('WARNING: detonating in inventory is likely fatal.');
  } else if(usable === 'medikit'){
    data.subtitle = 'Emergency medical consumable';
    data.body = 'A compact case of sealant foam, pain blockers, clotting mesh, and disposable diagnostics. It will not fix a ruined day, but it can keep a crew member moving.';
    data.notes.push('Use: restores 10 HP to the most wounded crew member.');
  } else if(usable === 'trauma_kit'){
    data.subtitle = 'Advanced surgical field kit';
    data.body = 'A heavier medbay kit with bone gel, sterile microtools, and printed splints. Designed for the kind of injury that makes everyone in the airlock go quiet.';
    data.notes.push('Use: removes one injury and restores 20 HP.');
  } else if(usable === 'mild_antidepressants'){
    data.subtitle = 'Controlled morale stabilizer';
    data.body = 'Plain-label tablets issued by cautious doctors and tired quartermasters. Less dramatic than Joy Dust, less likely to turn the mess hall into a manifesto.';
    data.notes.push('Use: gives the crew a mild morale lift and reduces grief.');
  } else if(usable === 'iodine_pills'){
    data.subtitle = 'Anti-radiation tablets';
    data.body = 'Potassium iodide tablets in a foil strip. They are not magic, but they give the thyroid something harmless to hold onto when the world outside is glowing wrong.';
    data.notes.push('Use: lowers radiation sickness by 2 for affected crew.');
  } else if(usable === 'oxytank'){
    data.subtitle = 'Portable oxygen reserve';
    data.body = 'A pressure-safe tank with a battered regulator and enough adapters to fit most expedition suits. Heavy, useful, and never mocked after the first leak alarm.';
    data.notes.push('Use: refills oxygen to 100% while planetside.');
  } else if(usable === 'morale_drug'){
    data.subtitle = 'Contraband morale stimulant';
    data.body = 'Joy Dust. Bright packaging, bad judgment, and a chemical promise that tomorrow can file its complaint tomorrow.';
    data.notes.push('Use: sharply boosts crew morale for a while.');
  } else if(usable === 'gun'){
    data.subtitle = 'Sidearm';
    data.body = 'A simple shipboard pistol: cheap alloy, worn grip, and enough stopping power to make distance feel negotiable.';
    data.notes.push('Equip: +2 ATK and enables ranged fire.');
  } else if(usable === 'gun_sniper'){
    data.subtitle = 'Long rifle';
    data.body = 'A precision rifle with a quiet charge cycle and a scope that remembers old fingerprints. Built for patient hands and unpleasant lines of sight.';
    data.notes.push('Equip: +5 ATK and enables long-range fire.');
  } else if(usable === 'knife'){
    data.subtitle = 'Close combat weapon';
    data.body = 'A compact blade with a dull utility sheath. Half tool, half last resort.';
    data.notes.push('Equip: +1 ATK.');
  } else if(usable === 'armor_flight'){
    data.subtitle = 'Light protective suit';
    data.body = 'A flight suit reinforced at the joints and ribs. Comfortable enough to work in, strong enough to matter once.';
    data.notes.push('Equip: +1 DEF.');
  } else if(usable === 'armor_reinforced'){
    data.subtitle = 'Reinforced protective suit';
    data.body = 'Thicker plating, sealed seams, and the distinct feeling that someone expected claws.';
    data.notes.push('Equip: +2 DEF.');
  } else if(usable === 'floodlight'){
    data.subtitle = 'Passive exploration gear';
    data.body = 'A harsh portable lamp array that turns unknown terrain into known trouble. The battery pack hums like it has opinions.';
    data.notes.push('Passive: increases planet vision radius by 2.');
  } else if(item._isSurvey){
    const survOre = item._oreKey ? (ORE_TYPES[item._oreKey] || ORE_TYPES.fe) : null;
    const survCom = survOre ? COMMODITIES[survOre.id] : null;
    data.subtitle = 'Mineral deposit survey data';
    data.body = 'Strata readings and surface coordinates logged during field survey for a '+(survCom ? survCom.name.toLowerCase() : 'ore')+' deposit. Sell this at any station commodity desk, or return with a drill to extract the bulk ore.';
    data.notes.push('No cargo hold required to carry.');
  } else if(name === 'Rock Sample' || MINERAL_SAMPLE_TYPES.some(t=>t.name===name)){
    const stype = MINERAL_SAMPLE_TYPES.find(t=>t.name===name) || MINERAL_SAMPLE_TYPES[0];
    data.subtitle = stype.oreSymbol ? 'Ore hand-sample ('+stype.oreSymbol+')' : 'Survey sample';
    data.body = stype.desc + (stype.oreSymbol ? ' Too small for bulk cargo extraction, but the survey office catalogues hand-samples.' : ' The science office catalogues these; stations buy them by the gram.');
  } else if(name === 'Biodata Sample'){
    data.subtitle = 'Biological survey data';
    data.body = 'A sealed sample cassette containing tissue traces, atmosphere notes, and contamination warnings written by someone with steady hands.';
  } else if(name.includes('Civilization Report')){
    data.subtitle = 'Field intelligence — Science Office interest';
    const reportSpecies = name.replace(' Civilization Report','');
    let repCiv = null, repState = null;
    Object.values(G.planets||{}).forEach(pd=>{
      if(pd?.civilization?.species === reportSpecies){
        repCiv = pd.civilization;
        repState = pd.civilization.state;
      }
    });
    if(repCiv && repState){
      const tier = repCiv.tier;
      const aggr = repCiv.aggression || 'Passive';
      const lang = repState.languageProgress || 0;
      const rel  = repState.relation || 0;
      const comp = ['uncertain','fragmentary','workable','workable','fluent','fluent'][Math.min(5,lang)];
      const tierDesc = {
        primitive:'Pre-agricultural band society',
        tribal:'Tribal confederacy with oral tradition',
        medieval:'Feudal stratified society with written law',
        industrial:'Managed industrial state with bureaucratic authority',
        information:'Modern information-age polity with media and institutional law',
      }[tier] || 'Unknown tier';
      const aggrDesc = {Passive:'Non-aggressive',Territorial:'Territorial and boundary-assertive',Hostile:'Immediately hostile — contact inadvisable'}[aggr]||aggr;
      const memories = repState.memories || [];
      const contactLine = (repState.contacted ? 'First contact established.' : 'Contact not yet established.')
        +(repState.tradeUnlocked ? ' Trade channel open.' : '')
        +(repState.guidanceUnlocked ? ' Surface guidance received.' : '')
        +(repState.permitGranted ? ' Visitor clearance granted.' : '');
      const memLine = memories.length ? ' Field notes: '+memories.slice(-2).map(m=>m.note||'').filter(Boolean).join(' ') : '';
      data.body = tierDesc+'. '+aggrDesc+'. Language comprehension: '+comp+'. '+contactLine+memLine;
      data.notes.push('Relation level: '+(rel>0?'+':'')+rel+'/5.');
      data.notes.push('Language progress: '+lang+'/5 ('+comp+').');
      data.notes.push('Sell to Science Office for '+item.value+' cr.');
    } else {
      data.body = 'Compiled field intelligence on an alien civilisation encountered during the mission. Covers social structure, language progress, and contact history.';
      data.notes.push('Sell to Science Office for '+item.value+' cr.');
    }
  } else if(name.includes('Artifact') || name.includes('Datacore')){
    data.subtitle = 'Recovered alien material';
    data.body = 'Old technology, or old art, or both. The scanners keep changing their mind about which parts are decorative.';
  } else if((item.value || 0) > 0){
    data.body = 'A recovered object with enough intact material, data, or novelty to interest a station buyer.';
  }

  if((item.value || 0) > 0) data.notes.push('Estimated sale value: '+item.value+' cr.');
  if(usable && item.value === 0) data.notes.push('No resale value listed.');
  return data;
}

function cargoItemExamineData(item){
  if(!item) return null;
  const com = item.commodityId ? COMMODITIES[item.commodityId] : null;
  const oreKey = com ? Object.keys(ORE_TYPES).find(k=>ORE_TYPES[k].id===item.commodityId) : null;
  const oreDef = oreKey ? ORE_TYPES[oreKey] : null;
  const station = G.base?.stationName || null;
  const sellNow = (station && item.commodityId) ? getSellPrice(station, item.commodityId) : null;
  const paid = item.boughtPrice || 0;
  const profit = sellNow !== null ? sellNow - paid : null;
  const profCol = profit === null ? '#888' : profit >= 0 ? '#70f090' : '#f07070';

  const data = {
    title: item.name || 'Unknown Cargo',
    subtitle: com ? 'Bulk commodity — '+com.shortName : 'Cargo unit',
    body: '',
    notes: [],
    profit, profCol, sellNow, paid,
  };

  if(oreDef){
    data.body = 'A sealed cargo unit of '+item.name+' ('+oreDef.sym+'). Raw planetary ore extracted from the surface and loaded into a standard cargo block. Refineries and industrial stations are the primary buyers.';
  } else if(com){
    const descs = {
      ore_fe:'Common iron ore. Workhorse of the metals trade — cheap, heavy, always wanted.',
      ore_cu:'Copper ore. Conductors, alloys, and half the electronics in known space trace back to this.',
      ore_si:'Silicon ore. The feedstock of every processor and solar cell. Dull, indispensable.',
      ore_ti:'Titanium ore. Light and strong. Armour plating, hull frames, and anything that needs to survive.',
      ore_au:'Gold ore. Dense, inert, and worth exactly what people agree it is. Which is a lot.',
      ore_pt:'Platinum ore. Catalytic converters, fuel cell electrodes, and the occasional status symbol.',
      ore_ur:'Uranium ore. Shielded and logged. Highly regulated; highly valuable.',
      ore_xc:'Xenocrystal ore. Unknown crystalline matrix. Science offices pay well for analysis samples.',
      ammo:'Bulk munitions in sealed transport crates. Stations and patrols are steady buyers.',
      food:'Processed foodstuffs and nutrient packs. Demand is everywhere life is.',
      luxuries:'High-value consumer goods. Price swings are wild; margins can be too.',
      microelec:'Miniaturized electronics. Small, expensive, and always in short supply somewhere.',
      ore:'Refined processed ore. Already worth more than what came out of the ground.',
      metal:'Structural alloys and plate stock. Heavy but essential.',
      parts:'Machine components. Every station is always short on something.',
    };
    data.body = descs[item.commodityId] || 'A sealed cargo unit. Trade value depends on local market conditions.';
  } else {
    data.body = item.desc || 'Cargo manifest entry. No additional data on file.';
  }

  // Detect if this was found on a planet (boughtAt is a coordinate key like "12,8:2")
  // vs purchased at a station (boughtAt is a human-readable station name)
  const foundOnPlanet = item.boughtAt && /^-?\d+,-?\d+:/.test(item.boughtAt);
  const locationLabel = foundOnPlanet
    ? 'Extracted from planet surface'
    : ('Acquired at: '+(item.boughtAt || 'unknown'));

  data.notes.push(locationLabel);
  if(!foundOnPlanet && paid > 0){
    data.notes.push('Paid: '+paid+' cr per unit');
  }
  if(sellNow !== null){
    const profitLabel = foundOnPlanet
      ? 'Sell here: '+sellNow+' cr  (pure profit)'
      : 'Sell here: '+sellNow+' cr  ('+(profit>=0?'+':'')+profit+' cr)';
    data.notes.push(profitLabel);
  } else {
    data.notes.push('Dock at a station to see current sell price.');
  }
  if(com) data.notes.push('Market volatility: '+(Math.round(com.volatility*100))+'%');
  return data;
}

function renderCrewDialogueContextSidebar(){
  const c = dialogueCrew() || selectedCrewMember();
  let html = '';
  if(c){
    const role = CREW_ROLES[c.role] || { label:'Crew', col:'#aaaaaa' };
    const mood = crewMoraleScore(c);
    const moodCol = mood >= 72 ? '#88dd88' : mood >= 45 ? '#aaaacc' : mood >= 22 ? '#ffaa44' : '#ff7777';
    html += `<div style="color:${htmlEsc(role.col)};font-size:14px;font-weight:bold;margin-bottom:2px">${htmlEsc(crewDisplayName(c))}</div>`;
    html += `<div style="color:#888899;font-size:12px;margin-bottom:8px">${htmlEsc(role.label)} · morale <span style="color:${moodCol}">${mood}</span> ${htmlEsc(crewMoodFace(c))}</div>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;min-height:190px;max-height:240px;overflow:hidden">`;
    html += `<div style="min-width:0;overflow:hidden">`;
    html += `<div style="color:#ffe066;font-size:12px;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #332a11;padding-bottom:2px">MORALE</div>`;
    crewMoraleBreakdown(c).forEach(row=>{
      html += `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;line-height:1.7;border-bottom:1px solid #111827">`;
      html += `<span style="color:#667788;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${htmlEsc(row.label)}</span>`;
      html += `<span style="color:${row.col};white-space:nowrap">${htmlEsc(row.value)}</span>`;
      html += `</div>`;
    });
    html += `</div>`;
    html += `<div style="min-width:0;overflow:hidden;border-left:1px solid #223344;padding-left:10px">`;
    html += `<div style="color:#ff6688;font-size:12px;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #332222;padding-bottom:2px">STATUS</div>`;
    crewMedicalBreakdown(c).forEach(row=>{
      html += `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;line-height:1.7;border-bottom:1px solid #111827">`;
      html += `<span style="color:#667788;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${htmlEsc(row.label)}</span>`;
      html += `<span style="color:${row.col};white-space:nowrap">${htmlEsc(row.value)}</span>`;
      html += `</div>`;
    });
    html += `</div>`;
    html += `</div>`;
  } else {
    html += `<div style="color:#777788;font-size:13px">No living crew selected.</div>`;
  }
  return html;
}

function renderSidebar(){
  if(G.dialogue?.id === 'crew_basic' || G.dialogue?.id === 'captain_log'){
    document.querySelectorAll('#sidebar .s-title').forEach(el=>el.style.display='');
    document.getElementById('crew-list').innerHTML = renderCrewDialogueContextSidebar();
    document.getElementById('inv-list').innerHTML = '';
    setLogHTML(G.log.slice(0,12).map(l=>{
      const age = (G.turn||0) - (l.turn||0);
      const opacity = age === 0 ? 1.0 : 0.75;
      return `<div class="log-entry ${l.cls}" style="opacity:${opacity}">${htmlEsc(logDisplayText(l))}</div>`;
    }).join(''));
    return;
  }

  if(G.mode === 'inventory' && G._crewExamine){
    const c = selectedCrewMember();
    let html = `<div class="s-title" style="color:#aa8800;border-color:#554400">CREW CHANNEL</div>`;
    if(c){
      const role = CREW_ROLES[c.role] || { label:'Crew', col:'#aaaaaa' };
      const mood = crewMoraleScore(c);
      const moodCol = mood >= 72 ? '#88dd88' : mood >= 45 ? '#aaaacc' : mood >= 22 ? '#ffaa44' : '#ff7777';
      html += `<div style="height:44%;min-height:145px;border-bottom:1px solid #223344;margin-bottom:10px;padding-bottom:10px">`;
      html += `<div style="color:${htmlEsc(role.col)};font-size:14px;font-weight:bold;margin-bottom:2px">${htmlEsc(crewDisplayName(c))}</div>`;
      html += `<div style="color:#888899;font-size:12px;margin-bottom:8px">${htmlEsc(role.label)} · morale <span style="color:${moodCol}">${mood}</span> ${htmlEsc(crewMoodFace(c))}</div>`;
      const mkBtn = (key, label, action) =>
        `<button onclick="crewDialogueAction('${action}')" style="display:block;width:100%;text-align:left;margin:5px 0;padding:7px 8px;background:#08080f;border:1px solid #26364a;color:#aaddff;font-family:'Courier New',monospace;font-size:12px;cursor:pointer">[${key}] ${label}</button>`;
      html += mkBtn('1', 'Request status check', 'checkin');
      html += mkBtn('2', 'Request ship assessment', 'ship');
      html += mkBtn('3', 'Check morale', 'morale');
      html += `<div style="color:#443300;font-size:12px;margin-top:8px">[1-3] channel · [X] or [ESC] exit</div>`;
      html += `</div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;height:50%;overflow:hidden">`;
      html += `<div style="min-width:0;overflow:hidden">`;
      html += `<div style="color:#ffe066;font-size:12px;font-weight:bold;margin-bottom:6px">MORALE</div>`;
      crewMoraleBreakdown(c).forEach(row=>{
        html += `<div style="display:flex;justify-content:space-between;font-size:12px;line-height:1.7;border-bottom:1px solid #111827">`;
        html += `<span style="color:#667788">${htmlEsc(row.label)}</span>`;
        html += `<span style="color:${row.col}">${htmlEsc(row.value)}</span>`;
        html += `</div>`;
      });
      html += `</div>`;
      html += `<div style="min-width:0;overflow:hidden;border-left:1px solid #223344;padding-left:10px">`;
      html += `<div style="color:#ff6688;font-size:12px;font-weight:bold;margin-bottom:6px">STATUS</div>`;
      crewMedicalBreakdown(c).forEach(row=>{
        html += `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;line-height:1.7;border-bottom:1px solid #111827">`;
        html += `<span style="color:#667788;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${htmlEsc(row.label)}</span>`;
        html += `<span style="color:${row.col};white-space:nowrap">${htmlEsc(row.value)}</span>`;
        html += `</div>`;
      });
      html += `</div>`;
      html += `</div>`;
    } else {
      html += `<div style="color:#777788;font-size:13px">No living crew selected.</div>`;
    }
    document.querySelectorAll('#sidebar .s-title').forEach(el => el.style.display = 'none');
    document.getElementById('crew-list').innerHTML = html;
    document.getElementById('inv-list').innerHTML = '';
    const _ll=document.getElementById('log-list'); _ll.innerHTML=''; _ll.style.flex='0 0 0';
    return;
  }

  if(G.mode === 'inventory' && G._cargoExamine && G._viewTab === 'ship'){
    const cargo = G.cargo || [];
    const sel = Math.max(0, Math.min(G._cargoSel||0, cargo.length-1));
    const item = cargo[sel] || null;
    const data = cargoItemExamineData(item);
    let html = `<div class="s-title" style="color:#aa8800;border-color:#554400">CARGO EXAMINE</div>`;
    if(data){
      html += `<div style="color:${htmlEsc(item.col || '#ffe066')};font-size:14px;font-weight:bold;margin-bottom:4px;line-height:1.35">${htmlEsc(data.title)}</div>`;
      html += `<div style="color:#888899;font-size:12px;margin-bottom:8px;font-style:italic">${htmlEsc(data.subtitle)}</div>`;
      html += `<div style="height:1px;background:#223344;margin-bottom:8px"></div>`;
      html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">${htmlEsc(data.body)}</div>`;
      if(data.notes.length){
        html += `<div style="font-size:12px;line-height:1.7">`;
        data.notes.forEach(note=>{
          const col = note.startsWith('Sell here') ? (data.profCol||'#aaaacc') : '#aaaacc';
          html += `<span style="color:#445566">- </span><span style="color:${col}">${htmlEsc(note)}</span><br>`;
        });
        html += `</div>`;
      }
    } else {
      html += `<div style="color:#777788;font-size:13px">No cargo selected.</div>`;
    }
    html += `<div style="color:#443300;font-size:12px;margin-top:12px">[X] or [ESC] to exit</div>`;
    document.querySelectorAll('#sidebar .s-title').forEach(el => el.style.display = 'none');
    document.getElementById('crew-list').innerHTML = html;
    document.getElementById('inv-list').innerHTML = '';
    const _ll=document.getElementById('log-list'); _ll.innerHTML=''; _ll.style.flex='0 0 0';
    return;
  }

  if(G.mode === 'inventory' && G._inventoryExamine){    const item = selectedInventoryItem();
    const data = inventoryItemExamineData(item);
    let html = `<div class="s-title" style="color:#aa8800;border-color:#554400">ITEM EXAMINE</div>`;
    if(data){
      html += `<div style="color:${htmlEsc(item.col || '#ffe066')};font-size:14px;font-weight:bold;margin-bottom:4px;line-height:1.35">${htmlEsc(data.title)}</div>`;
      html += `<div style="color:#888899;font-size:12px;margin-bottom:8px;font-style:italic">${htmlEsc(data.subtitle)}</div>`;
      html += `<div style="height:1px;background:#223344;margin-bottom:8px"></div>`;
      html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">${htmlEsc(data.body)}</div>`;
      if(data.notes.length){
        html += `<div style="font-size:12px;line-height:1.7">`;
        data.notes.forEach(note=>{
          html += `<span style="color:#445566">- </span><span style="color:#aaaacc">${htmlEsc(note)}</span><br>`;
        });
        html += `</div>`;
      }
    } else {
      html += `<div style="color:#777788;font-size:13px">No item selected.</div>`;
    }
    html += `<div style="color:#443300;font-size:12px;margin-top:12px">[X] or [ESC] to exit</div>`;

    document.querySelectorAll('#sidebar .s-title').forEach(el => el.style.display = 'none');
    document.getElementById('crew-list').innerHTML = html;
    document.getElementById('inv-list').innerHTML = '';
    const _ll=document.getElementById('log-list'); _ll.innerHTML=''; _ll.style.flex='0 0 0';
    return;
  }

  // ── Range fire mode — replace sidebar with targeting panel ───────
  if(G.rangeTarget && G.mode==='planet'){
    renderRangeSidebar();
    return;
  }
  // ── Examine mode — replace sidebar with inspect panel ────────────
  if(G.examine){
    const cx = G.examine.x, cy = G.examine.y;
    let name = '???';
    let examineData = null;

    if(G.mode==='galaxy'){
      if(G.visited[cy*MAP_W+cx]){
        const r = getExamineName(cx, cy);
        examineData = typeof r === 'string' ? r : r;
      }
    } else if(G.mode==='planet'){
      const pdata = G.planets[G.curPlanet];
      if(pdata?.visited?.[cy*PW(pdata)+cx]) examineData = getExamineName(cx, cy);
    }

    // Resolve name — examineData might be a string or {type:'creature',enemy}
    let html = `<div class="s-title" style="color:#aa8800;border-color:#554400">EXAMINE</div>`;

    if(examineData && typeof examineData === 'object' && examineData.type === 'creature'){
      const e = examineData.enemy;
      const detailVisible = canExamineCreatureDetails(e);
      if(e.civLocal){
        html += civilizationLocalExamineHtml(e, detailVisible);
      } else {
      const dietCol   = e.diet==='carnivore'?'#ff7755':e.diet==='herbivore'?'#88dd55':'#ffaa44';
      const behLabel  = e.behaviour==='TERRITORIAL'?'Territorial':
                        e.behaviour==='COWARD'?'Skittish':
                        e.behaviour==='DOCILE'?'Docile':
                        e.behaviour==='STALK'?'Stalking predator':'Hostile';
      const hostileLabel = e.currentlyHostile||e.hostileByDefault ? '<span style="color:#ff6644">Hostile</span>' : '<span style="color:#88cc55">Neutral</span>';
      const healthDesc = creatureHealthDesc(e.hp, e.maxHp);
      const healthCol  = e.hp/e.maxHp >= 0.5 ? '#88cc55' : e.hp/e.maxHp >= 0.25 ? '#ffaa44' : '#ff5533';
      const sizeLabel  = e.size<0.5?'Tiny':e.size<0.9?'Small':e.size<1.3?'Medium':e.size<1.8?'Large':'Enormous';

      html += `<div style="color:#ffe066;font-size:14px;font-weight:bold;margin-bottom:4px">${detailVisible ? htmlEsc(e.name) : 'Unidentified lifeform'}</div>`;
      html += `<div style="color:#888899;font-size:12px;margin-bottom:8px;font-style:italic">${detailVisible ? sizeLabel+' '+htmlEsc(e.bodyLabel||'creature') : 'Movement detected beyond reliable examine range'}</div>`;
      html += `<div style="color:#334455;height:1px;background:#223344;margin-bottom:8px"></div>`;

      if(!detailVisible){
        html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">Too far for a reliable biological readout. Move within 2 tiles to examine details.</div>`;
        html += `<div style="font-size:12px;line-height:1.9">`;
        html += `<span style="color:#445566">Range: </span><span style="color:#aaaacc">${creaturePlayerDistance(e)} tiles</span><br>`;
        html += `<span style="color:#445566">Movement: </span><span style="color:#aaaacc">${e.stunTurns > 0 ? 'Stunned' : htmlEsc(planetCritterSpeedLabel(e))}</span>`;
        html += `</div>`;
      } else {
      // Description
      if(e.desc){
        html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:10px">${htmlEsc(e.desc)}</div>`;
      }

      // Stats
      html += `<div style="font-size:12px;line-height:1.9">`;
      html += `<span style="color:#445566">Diet: </span><span style="color:${dietCol}">${e.diet ? e.diet.charAt(0).toUpperCase()+e.diet.slice(1) : 'Unknown'}</span><br>`;
      html += `<span style="color:#445566">Temperament: </span><span style="color:#aaaacc">${behLabel}</span><br>`;
      html += `<span style="color:#445566">Movement: </span><span style="color:#aaaacc">${e.stunTurns > 0 ? 'Stunned' : htmlEsc(planetCritterSpeedLabel(e))}</span><br>`;
      html += `<span style="color:#445566">Status: </span>${hostileLabel}<br>`;
      html += `<span style="color:#445566">Condition: </span><span style="color:${healthCol}">${healthDesc}</span>`;
      if(e.canCommunicate && e.commKnown){
        html += `<br><span style="color:#445566">Attitude: </span><span style="color:#ffe066">${htmlEsc(e.attitude || 'Wary')}</span>`;
        html += `<br><span style="color:#445566">Intent: </span><span style="color:#aaaacc">${htmlEsc(e.intent || 'Watching the crew')}</span>`;
        html += `<br><span style="color:#445566">Contact: </span><span style="color:#70d8ff">${htmlEsc(e.commMethod || 'Unknown channel')}</span>`;
        if(e.commRefused) html += `<br><span style="color:#aa5544">Communication refused</span>`;
        else html += `<br><div style="display:inline-block;margin-top:7px;background:#1a2e1a;border:1px solid #3a7a3a;border-radius:3px;padding:3px 10px;color:#90f0a0;font-size:13px;font-weight:bold;letter-spacing:0.5px"><span style="color:#70f090">[T]</span> Communicate</div>`;
      }
      html += `</div>`;
      }
      }

    } else if(examineData && typeof examineData === 'object' && examineData.type === 'galaxy_ship'){
      const ns = examineData.ns;
      const dist = examineData.dist;
      const rr = radioRange();
      const inRange = dist <= rr;
      const typeLabel = ns.type==='trader'?'Merchant Vessel':ns.type==='science'?'Survey Vessel':ns.type==='patrol'?'Station Patrol':ns.type==='cargo'?'Cargo Hauler':'Unknown Vessel';
      const typeCol   = ns.type==='patrol'?'#70d8ff':ns.type==='trader'?'#ffe066':ns.type==='science'?'#90f0a0':'#aaaacc';
      html += `<div style="color:#ffe066;font-size:14px;font-weight:bold;margin-bottom:4px">${htmlEsc(ns.name)}</div>`;
      html += `<div style="color:${typeCol};font-size:12px;margin-bottom:8px">${typeLabel}</div>`;
      html += `<div style="font-size:12px;line-height:1.9">`;
      html += `<span style="color:#445566">Distance: </span><span style="color:${inRange?'#90f0a0':'#ff6644'}">${dist}u</span><br>`;
      html += `<span style="color:#445566">Radio range: </span><span style="color:#aaaacc">${rr}u max</span><br>`;
      html += `<span style="color:#445566">Status: </span><span style="color:${inRange?'#90f0a0':'#ff6644'}">${inRange?'In range':'Out of range'}</span>`;
      html += `</div>`;
      if(inRange){
        html += `<div style="display:inline-block;margin-top:9px;background:#1a2e1a;border:1px solid #3a7a3a;border-radius:3px;padding:3px 10px;color:#90f0a0;font-size:13px;font-weight:bold;letter-spacing:0.5px"><span style="color:#70f090">[H]</span> Hail</div>`;
      }
    } else if(examineData && typeof examineData === 'object' && examineData.type === 'tile'){
      html += `<div style="color:#ffe066;font-size:14px;font-weight:bold;margin-bottom:6px;line-height:1.4">${htmlEsc(examineData.name)}</div>`;
      if(examineData.desc){
        html += `<div style="color:#aaaaaa;font-size:12px;line-height:1.5;margin-bottom:6px">${htmlEsc(examineData.desc)}</div>`;
      }
    } else {
      // Plain string name (tile, ship, etc.)
      name = typeof examineData === 'string' ? examineData : '???';
      html += `<div style="color:#ffe066;font-size:14px;font-weight:bold;margin-bottom:6px;line-height:1.4">${name}</div>`;
    }

    html += `<div style="color:#443300;font-size:12px;margin-top:12px">[X] or [ESC] to exit</div>`;

    // Hide all sidebar section titles before overwriting crew-list
    document.querySelectorAll('#sidebar .s-title').forEach(el => el.style.display = 'none');
    document.getElementById('crew-list').innerHTML  = html;
    document.getElementById('inv-list').innerHTML   = '';
    const _ll=document.getElementById('log-list'); _ll.innerHTML=''; _ll.style.flex='0 0 0';
    return;
  }

  // Restore section titles when not examining
  document.querySelectorAll('#sidebar .s-title').forEach(el=>el.style.display='');

  // Crew — filter out dead members (hp<=0) for display clarity
  const living=G.crew.filter(c=>c.hp>0);
  if(!living.length){
    document.getElementById('crew-list').innerHTML = '<div style="color:#f07070;font-size: 13px">All crew dead!</div>';
  } else {
    // Specials first, then grunts grouped by role
    const specials = living.filter(c=>CREW_ROLES[c.role]?.special);
    const grunts   = living.filter(c=>!CREW_ROLES[c.role]?.special);
    // Group grunts by role
    const gruntGroups = {};
    grunts.forEach(c=>{ gruntGroups[c.role]=(gruntGroups[c.role]||[]); gruntGroups[c.role].push(c); });

    let html = '';
    specials.forEach(c=>{
      const p=c.hp/c.maxHp;
      const cl=p<0.3?'cr':p<0.6?'co':'cg';
      const roleData=CREW_ROLES[c.role];
      const st = crewStatusSummary(c);
      html+=`<div class="crew-row"><span style="color:${roleData.col}">${roleData.label}${st?' <span style="color:#d488ff">'+st+'</span>':''}</span><span class="${cl}" style="font-size: 13px">${c.hp}/${c.maxHp}</span></div>`;
    });
    Object.entries(gruntGroups).forEach(([role, members])=>{
      const roleData=CREW_ROLES[role];
      const avgHpPct = members.reduce((s,c)=>s+c.hp/c.maxHp,0)/members.length;
      const cl=avgHpPct<0.3?'cr':avgHpPct<0.6?'co':'cg';
      const label = members.length>1 ? roleData.label+' ×'+members.length : roleData.label;
      const hpStr = members.length>1 ? members.map(c=>c.hp).join('/') : members[0].hp+'/'+members[0].maxHp;
      const groupedStatuses = new Map();
      members.forEach(c=>{
        visibleCrewStatusList(c).forEach(s=>{
          const def = CREW_STATUS_DEFS[s.id] || { short:(s.id||'?').slice(0,3).toUpperCase() };
          const val = s.intensity ?? s.severity ?? 1;
          const text = def.short + (val > 1 ? val : '');
          groupedStatuses.set(text, (groupedStatuses.get(text)||0) + 1);
        });
      });
      const statusSummary = [...groupedStatuses.entries()]
        .map(([text,count])=>text+(count>1?'×'+count:''))
        .join(' ');
      const st = statusSummary ? ' <span style="color:#d488ff">'+statusSummary+'</span>' : '';
      html+=`<div class="crew-row"><span style="color:${roleData.col}">${label}${st}</span><span class="${cl}" style="font-size: 13px">${hpStr}</span></div>`;
    });
    document.getElementById('crew-list').innerHTML = html;
  }

  // Inventory hidden from sidebar — shown in dedicated inventory overlay only

  // Log
  setLogHTML(G.log.filter(l=>!l.archive).slice(0,18).map(l=>{
    const age = (G.turn||0) - (l.turn||0);
    const opacity = age === 0 ? 1.0 : 0.75;
    return `<div class="log-entry ${l.cls}" style="opacity:${opacity}">${htmlEsc(logDisplayText(l))}</div>`;
  }).join(''));
}

