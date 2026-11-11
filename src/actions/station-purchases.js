// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
//  STARBASE ACTIONS
// ─────────────────────────────────────────────────────────────────

// Shared helper: apply a purchased pawn/supply item to the game state
function applyPawnItem(item){
  if(!item) return;
  if(item.usable === 'supplies'){
    const hullDamaged = G.ship.hp < G.ship.maxHp;
    G.crew.forEach(c=>c.hp=Math.min(c.maxHp,c.hp+10));
    G.ship.hp=Math.min(G.ship.maxHp,G.ship.hp+10);
    if(hullDamaged) SFX.repair();
    addLog('Supplies bought. Crew and hull patched up.','lg');
  } else if(item.usable === 'medikit'){
    G.inventory.push({name:'Medikit',col:'#ff6688',desc:'A medikit.',value:0,usable:'medikit'});
    addLog('Medikit purchased. Open inventory to use.','lg');
  } else if(item.usable === 'oxytank'){
    G.inventory.push({name:'Oxygen Tank',col:'#44ddff',desc:'An oxygen tank.',value:0,usable:'oxytank'});
    addLog('Oxygen Tank purchased. Open inventory to use on the surface.','lg');
  } else if(item.usable === 'gun'){
    G.inventory.push({name:item.name,col:'#aaaaff',desc:'+2 ATK when equipped.',value:0,usable:'gun'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'gun_sniper'){
    G.inventory.push({name:item.name,col:'#ffaa44',desc:'+5 ATK when equipped.',value:0,usable:'gun_sniper'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'knife'){
    G.inventory.push({name:item.name,col:'#ccccaa',desc:'+1 ATK when equipped.',value:0,usable:'knife'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'floodlight'){
    G.inventory.push({name:'Floodlight',col:'#ffffaa',desc:'Passive: always illuminates +2 tile radius.',value:0,usable:'floodlight'});
    addLog('Floodlight purchased and active. +2 tile vision radius at all times.','lg');
  } else if(item.usable === 'armor_flight'){
    G.inventory.push({name:item.name,col:'#88ddff',desc:'+1 DEF when equipped.',value:0,usable:'armor_flight'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'armor_reinforced'){
    G.inventory.push({name:item.name,col:'#ffcc44',desc:'+2 DEF when equipped.',value:0,usable:'armor_reinforced'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'gun_shotgun'){
    G.inventory.push({name:item.name,col:'#cc9966',desc:'+3 ATK when equipped. Close range, high accuracy.',value:0,usable:'gun_shotgun'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'gun_burst'){
    G.inventory.push({name:item.name,col:'#88ccff',desc:'+3 ATK when equipped. Medium range, rapid fire.',value:0,usable:'gun_burst'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'gun_plasma'){
    G.inventory.push({name:item.name,col:'#ff66cc',desc:'+3 ATK when equipped. Range 7, burns targets.',value:0,usable:'gun_plasma'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'stun_baton'){
    G.inventory.push({name:item.name,col:'#aaffdd',desc:'+2 ATK when equipped. Melee, non-lethal — deals 1-2 damage and 65% chance to stun.',value:0,usable:'stun_baton'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'vibroblade'){
    G.inventory.push({name:item.name,col:'#ff88ff',desc:'+4 ATK when equipped. High-precision melee.',value:0,usable:'vibroblade'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'armor_exosuit'){
    G.inventory.push({name:item.name,col:'#ff8833',desc:'+3 DEF when equipped. Heavy combat plating.',value:0,usable:'armor_exosuit'});
    addLog(item.name+' purchased. Open inventory to equip to a crew member.','lg');
  } else if(item.usable === 'repair_kit'){
    const hullDamaged = G.ship.hp < G.ship.maxHp;
    G.ship.hp = Math.min(G.ship.maxHp, G.ship.hp + 15);
    if(hullDamaged) SFX.repair();
    addLog('Repair Kit applied. Ship hull +15 HP.','lg');
  } else if(item.usable === 'jetpack'){
    G.inventory.push({name:'Jetpack',col:'#ff9922',desc:'Leap 2 tiles over any terrain. Use from inventory — enter target mode to aim. Fuel: 15 charges.',value:0,usable:'jetpack',fuel:15});
    addLog('Jetpack purchased — 15 fuel charges loaded. Open inventory, select it, then use [T] target mode to aim.','lg');
  } else if(item.usable === 'grapple'){
    G.inventory.push({name:'Grappling Hook',col:'#ccaa88',desc:'One-use: hook over 1 obstacle tile. Use from inventory — enter target mode to aim direction.',value:0,usable:'grapple'});
    addLog('Grappling Hook purchased. Open inventory, select it, then use [T] target mode to aim.','lg');
  } else if(item.usable === 'sensor_drone'){
    G.inventory.push({name:'Sensor Drone',col:'#44ffcc',desc:'Galaxy use only: launches ahead of ship for 4–7 turns, revealing fog.',value:0,usable:'sensor_drone'});
    addLog('Sensor Drone purchased. Use from galaxy view — ship must be moving to set launch direction.','lg');
  } else if(item.usable){
    // Generic usable item fallback — field_rations, stim_pack, rad_flush, etc.
    G.inventory.push({name:item.name,col:item.col||'#aaaacc',desc:item.desc||item.detail||'',value:0,usable:item.usable});
    addLog(item.name+' purchased. Open inventory to use.','lg');
  }
  if(item.stock === 0) addLog('That was the last one!','lw');
}

// Apply a purchased corporate shop item
function applyCorpItem(item){
  if(!item) return;
  // Implants — special flow: goes to inventory as an implant item
  if(item.usable && item.usable.startsWith('implant_')){
    const implantId = item.implantId || item.usable.slice('implant_'.length);
    const imp = IMPLANT_CATALOG.find(i=>i.id===implantId);
    if(!imp){ addLog('Unknown implant.','lw'); return; }
    G.inventory.push({
      name: imp.name,
      col: imp.col,
      desc: imp.desc,
      value: 0,
      usable: 'implant_'+imp.id,
      implantId: imp.id,
    });
    addLog(imp.name+' acquired. Open Crew tab in inventory to install on a crew member.','lg');
    if(item.stock === 0) addLog('That was the last one!','lw');
    return;
  }
  // Everything else goes to inventory as a generic usable
  G.inventory.push({
    name: item.name,
    col: item.col || '#aaaacc',
    desc: item.detail || '',
    value: 0,
    usable: item.usable,
  });
  addLog(item.name+' purchased. Open inventory to use.','lg');
  if(item.stock === 0) addLog('That was the last one!','lw');
}

function executeBaseAction(actionId){
  if(HULL_REFITS.some(refit=>refit.id===actionId)||actionId.startsWith('remove_refit_')){
    const removing=actionId.startsWith('remove_refit_');
    if(performHullRefit(removing?actionId.slice(13):actionId,removing))recordCareerTime('services',30,'stations');
    renderAll();return;
  }
  const beforeCredits=G.credits,beforeFuel=G.fuel;
  const fuelCost = Math.round((G.maxFuel-G.fuel)*0.8);
  switch(actionId){
    case 'ship_systems': openShipSystems(); return;
    case 'refuel':
      if(G.fuel>=G.maxFuel){ addLog('Fuel already full.','li'); }
      else if(fuelCost===0){ G.fuel=G.maxFuel; SFX.refuel(); addLog('Tank topped off (free).','lg'); }
      else if(G.credits>=fuelCost){ G.credits-=fuelCost; G.fuel=G.maxFuel; G._alarmFuelWarn=false; G._alarmFuelCrit=false; SFX.refuel(); addLog('Refueled. Spent '+fuelCost+' cr.','lg'); }
      else addLog('Need '+fuelCost+' cr to refuel.','lw');
      break;
    case 'repair':{
      if(G.ship.hp>=G.ship.maxHp){ addLog('Hull already at full integrity.','li'); }
      else if(G.credits>=50){
        G.credits-=50; G.ship.hp=Math.min(G.ship.maxHp,G.ship.hp+10);
        SFX.repair();
        addLog('Hull patched. Ship +10 HP.','lg');
      }
      else addLog('Need 50 cr for repairs.','lw');
      break;}
    case 'changehull':
      G.base.screen = 'changehull';
      G.base.hullSel = 0;
      G.base.hullQuoteKey=null;
      break;
    case 'confirmhull':{
      const id=hangarHullIds()[G.base.hullSel||0],quote=getHullPurchaseQuote(id);
      if(quote.reason){addLog(quote.reason+'.','lw');break;}
      if(G.credits<quote.net){addLog('Need '+quote.net+' cr for this exchange.','lw');break;}
      if(G.base.hullQuoteKey!==quote.key){G.base.hullQuoteKey=quote.key;addLog('Review the hull quote, then confirm the exchange.','li');break;}
      commitHullPurchase(id,quote.key);break;}
    case 'upweapon':
      // Legacy — no-op, replaced by installweapon
      break;
    case 'confirminstall':{
      const slot2 = G.base.weaponSlot || 0;
      const weapons2 = Object.values(SHIP_WEAPONS);
      const selW2 = weapons2[G.base.weaponSel || 0];
      if(!selW2 || selW2.placeholder){ addLog('That weapon is not available yet.','lw'); break; }
      const fit=shipWeaponInstallReason(slot2,selW2);
      if(fit){addLog(fit+'.','lw');break;}
      const store=stationEquipmentStore(true),owned=store.weapons.findIndex(item=>item.id===selW2.id),price=shipWeaponInstallPrice(selW2);
      if(store.weapons.length>=256&&G.installedWeapons[slot2]&&owned<0){addLog('Station weapon storage is full.','lw');break;}
      if(G.credits < price){ addLog('Need '+price+' cr to install '+selW2.name+'.','lw'); break; }
      const restored=owned>=0?store.weapons.splice(owned,1)[0]:null;
      const previous=G.installedWeapons[slot2];
      if(previous)store.weapons.push({id:previous,readyAt:G.ship.weaponReadyAt[slot2]||0});
      G.credits -= price;
      if(!G.installedWeapons) G.installedWeapons = [];
      G.installedWeapons[slot2] = selW2.id;
      G.ship.weaponReadyAt[slot2]=Math.max(G.turn,restored?.readyAt||0);
      addLog(selW2.name+' installed in mount ['+(slot2+1)+']. '+(restored?'Fitted from station stores.':'Cost: '+price+' cr.'),'lg');
      G.base.screen = 'sub';
      break;}
    case 'sell':{
      // Science Office: samples and survey data only — bulk cargo goes to Market
      const activeScienceJob = ensureScienceJobState().active;
      const sellableItems = scienceSaleItems();
      let missionCompleted = false;
      if(activeScienceJob && activeScienceJob.type !== 'data_box'){
        missionCompleted = completeScienceJob();
      }
      const sold=sellableItems.reduce((s,i)=>s+(i.value||0),0);
      const surveyInfo = getSurveyPayoutBreakdown();
      const surveySold = surveyInfo.pending;
      if(surveySold>0){
        Object.values(G.planets || {}).forEach(pdata=>{
          pdata.surveySoldValue = getSurveySaleValue(pdata);
        });
        earnCredits(surveySold);
        trackEvent('survey_data_sold', analyticsBaseParams({
          survey_value: surveySold,
          full_survey_bodies: surveyInfo.fullBonusBodies.length,
        }));
        addLog('Sold survey data for '+surveySold+' cr.','lg');
        recordExpeditionEvent('survey-sale:'+G.turn+':'+(G.surveyCareerCredits||0), 'trade', 'Sold survey data for '+surveySold+' cr.', {credits:surveySold});
        awardSurveyMilestones(surveySold);
        if(surveyInfo.fullBonusBodies.length){
          addLog('Full survey bonus awarded for '+surveyInfo.fullBonusBodies.join(', ')+'.','lg');
        }
      }
      if(sold>0){
        earnCredits(sold);
        const soldSet = new Set(sellableItems);
        G.inventory = (G.inventory||[]).filter(i=>!soldSet.has(i));
        addLog('Sold samples for '+sold+' cr.','ll');
      }
      const totalSold = sold + surveySold + (missionCompleted ? 1 : 0);
      if(totalSold>0){
        if(G.credits>=10000) addLog('10,000 cr reached visit the Science Office to retire.','lg');
      } else {
        addLog('Nothing to sell here. Take bulk cargo to the Market.','');
      }
      break;}
    case 'sell_specimens':{
      const specimens = (G.inventory||[]).filter(c=>c.isCapturedCreature);
      if(!specimens.length){ addLog('No captured specimens to sell.','li'); break; }
      const total = specimens.reduce((s,c)=>s+c.bounty,0);
      earnCredits(total);
      specimens.forEach(s=>{ addLog(s.creatureName+' specimen sold — +'+s.bounty+' cr.','lg'); });
      G.inventory = G.inventory.filter(i=>!i.isCapturedCreature);
      addLog('Margo Security accepted '+specimens.length+' specimen'+(specimens.length>1?'s':'')+' for '+total+' cr total.','lg');
      break;}
    case 'science_job':
      startScienceJob();
      break;
    case 'science_abandon':
      abandonScienceJob();
      break;
    case 'retire':
      G.base.confirm = 'retire';
      renderAll();
      return; // skip the renderAll at bottom
    case 'market_back':
      G.base.screen = 'main';
      G.base.subSel = 0;
      G.base.subScroll = 0;
      break;
    case 'install_tractor_beam':{
      const TRACTOR_COST = 600;
      if((G.installedModules||[]).includes('tractor_beam')){
        addLog('Tractor Beam already installed.','li'); break;
      }
      const ssTB = G.shipStats;
      if(!ssTB || (G.installedModules||[]).length >= ssTB.moduleSlots){
        addLog('No free module slot. Add module slots in the Modules menu first.','lw'); break;
      }
      if(G.credits < TRACTOR_COST){ addLog('Need '+TRACTOR_COST+' cr to install Tractor Beam.','lw'); break; }
      G.credits -= TRACTOR_COST;
      if(!G.installedModules) G.installedModules = [];
      G.installedModules.push('tractor_beam');
      G.base._tractorStock = false;
      addLog('Tractor Beam installed! Approach a derelict ship and press [T] to begin towing.','lg');
      break;}
    case 'sell_towed_ship':{
      if(!G.towedShip){ addLog('No ship in tow.','li'); break; }
      const tsVal = G.towedShip.saleValue || 400;
      earnCredits(tsVal);
      addLog('Sold '+G.towedShip.name+' to the station salvage yard. +'+tsVal+' cr.','lg');
      G.towedShip = null;
      break;}
    case 'install_fuel_scoop':{
      const SCOOP_COST = 500;
      if((G.installedModules||[]).includes('fuel_scoop')){
        addLog('Fuel Scoop already installed.','li'); break;
      }
      const ss2 = G.shipStats;
      if(!ss2 || (G.installedModules||[]).length >= ss2.moduleSlots){
        addLog('No free module slot. Add module slots in the Modules menu first.','lw'); break;
      }
      if(G.credits < SCOOP_COST){ addLog('Need '+SCOOP_COST+' cr to install Fuel Scoop.','lw'); break; }
      G.credits -= SCOOP_COST;
      if(!G.installedModules) G.installedModules = [];
      G.installedModules.push('fuel_scoop');
      G.base._scoopStock = false; // sold out
      addLog('Fuel Scoop installed! [U] over a nebula or gas giant to harvest fuel.','lg');
      break;}
    case 'market_sell_all':{
      const mStn = G.base?.stationName || 'Starbase Alpha';
      const mAll = (G.cargo||[]).filter(i=>i.isCommodity);
      if(!mAll.length){ addLog('No commodities to sell.','li'); break; }
      let mGrand=0;
      mAll.forEach(item=>{
        const rev=getSellPrice(mStn,item.commodityId);
        const prof=rev-(item.boughtPrice||0);
        addLog('Sold '+item.name+': '+rev+' cr '+(prof>=0?'(+'+prof+' profit)':'('+prof+' loss)'),prof>=0?'lg':'lw');
        mGrand+=rev;
      });
      G.cargo=G.cargo.filter(i=>!i.isCommodity);
      earnCredits(mGrand);
      addLog('Total received: '+mGrand+' cr.','lg');
      if(G.credits>=10000) addLog('10,000 cr reached visit the Science Office to retire.','lg');
      break;}
    case 'drink':{
      if(G.credits>=5){
        G.credits-=5;
        boostCrewFromDrink();
        G._drinkCount = (G._drinkCount||0) + 1;
        const station = G.base?.stationName || 'Starbase Alpha';
        const otherStation = station === 'Starbase Alpha' ? 'Waypoint Omega' : 'Starbase Alpha';
        const ss = G.shipStats;
        const hasCargoSpace = ss && G.cargo.length < ss.cargoCapacity;
        // Probabilities: cargo offer 6%, price intel 30%, rumour escalating, rest filler
        // Bar is for intel and rumours — Market is for actual trading
        const roll = Math.random();
        const rumourChance = Math.min(0.55, 0.10 + G._drinkCount * 0.10);
        if(roll < 0.06 && hasCargoSpace){
          // Rare street deal — someone offloading quietly
          const comId = randomCommodityId();
          const price = getBuyPrice(station, comId);
          const com = COMMODITIES[comId];
          G.base._barOfferCom   = comId;
          G.base._barOfferPrice = price;
          addLog('"Psst — got a unit of '+com.name+' I need off my hands. '+price+' cr, cash now."','ll');
        } else if(roll < 0.36){
          // Price intel about the other station — this is what the bar is for
          const comId = randomCommodityId();
          const theirPrice = getSellPrice(otherStation, comId);
          const com = COMMODITIES[comId];
          addLog('"'+com.name+' fetching '+theirPrice+' cr a unit over at '+otherStation+' last I heard."','li');
        } else if(roll < (0.36 + rumourChance)){
          const rumour = RUMOURS[Math.floor(Math.random()*RUMOURS.length)];
          addLog('Barkeep leans in: "'+rumour+'"','li');
          G._drinkCount = 0;
        } else {
          // ~40% chance the filler contains genuine intel drawn from world state
          const intelLine = (Math.random() < 0.40) ? generateBarIntel() : null;
          if(intelLine){
            addLog(intelLine, 'li');
          } else {
            addLog(BAR_FILLER[Math.floor(Math.random()*BAR_FILLER.length)],'');
          }
        }
      } else addLog('Need 5 cr for a drink.','lw');
      break;}
    case 'buy_cargo_offer':{      const station2 = G.base?.stationName || 'Starbase Alpha';
      const comId2   = G.base?._barOfferCom;
      if(!comId2){ addLog('The offer is no longer available.','lw'); break; }
      const price2   = getBuyPrice(station2, comId2);
      const com2     = COMMODITIES[comId2];
      const ss2      = G.shipStats;
      if(!ss2 || G.cargo.length >= ss2.cargoCapacity){ addLog('Cargo hold full.','lw'); break; }
      if(G.credits < price2){ addLog('Need '+price2+' cr for a unit of '+com2.name+'.','lw'); break; }
      G.credits -= price2;
      addCargo(makeCommodityItem(comId2, station2, price2));
      addLog('Bought 1 unit of '+com2.name+' for '+price2+' cr. ('+G.cargo.length+'/'+ss2.cargoCapacity+' hold)','lg');
      G.base._barOfferCom   = null;  // offer consumed
      G.base._barOfferPrice = null;
      break;}
    case 'recruit':{
      const maxCrew = G.shipStats?.maxCrew ?? 6;
      if(G.crew.filter(c=>c.hp>0).length >= maxCrew){
        addLog('Crew at maximum capacity ('+maxCrew+').','li'); break;
      }
      if(G.credits < 150){ addLog('Need at least 150 cr to recruit.','lw'); break; }
      // Show role selection sub-screen
      G.base.screen = 'recruit';
      G.base.recruitSel = 0;
      break;}
    case 'recruit_confirm':{
      const maxCrew2 = G.shipStats?.maxCrew ?? 6;
      if(G.crew.filter(c=>c.hp>0).length >= maxCrew2){ addLog('Crew at maximum capacity.','li'); break; }
      // Hireable roles — all except captain
      const HIRE_ROLES = [
        { key:'scout',     cost:200, label:'Navigator' },
        { key:'engineer',  cost:200, label:'Engineer'  },
        { key:'scientist', cost:200, label:'Scientist' },
        { key:'medic',     cost:150, label:'Medic'     },
        { key:'mercenary', cost:150, label:'Mercenary' },
        { key:'redshirt',  cost:100, label:'Redshirt'  },
      ];
      const sel = G.base.recruitSel || 0;
      const chosen = HIRE_ROLES[sel];
      if(!chosen){ addLog('Invalid selection.','lw'); break; }
      if(G.credits < chosen.cost){ addLog('Need '+chosen.cost+' cr to hire a '+chosen.label+'.','lw'); break; }
      G.credits -= chosen.cost;
      const newCrew = randomCrewMember(chosen.key);
      // Hired crew have halved starting skills (floor), rounded down — starting crew are irreplaceable
      const base = ROLE_STARTING_SKILLS[chosen.key] || {};
      Object.keys(newCrew.skills).forEach(sk=>{
        newCrew.skills[sk] = Math.floor((base[sk]||0) / 2);
      });
      G.crew.push(newCrew);
      G.crewHired = (G.crewHired || 3) + 1;
      addLog('Hired '+crewDisplayName(newCrew)+' ('+CREW_ROLES[chosen.key].label+'). Welcome aboard!','lg');
      if(chosen.key !== 'redshirt' && chosen.key !== 'mercenary' && chosen.key !== 'medic'){
        addLog('Note: hired specialists start at half their role training; experience must be earned.','li');
      }
      G.base.screen = 'main';
      break;}
    case 'healcrew':{
      const injured = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp);
      const treatable = G.crew.filter(c=>c.hp>0 && crewStatusList(c).some(s=>DISEASE_STATUS_IDS.includes(s.id)||INJURY_STATUS_IDS.includes(s.id)));
      const cost=30*G.crew.filter(c=>c.hp>0).length;
      if(!injured.length && !treatable.length){ addLog('All crew already at full health.','li'); }
      else if(G.credits>=cost){
        G.credits-=cost;
        G.crew.forEach(c=>{
          if(c.hp>0){
            c.hp=c.maxHp;
            removeCrewDiseases(c, true);
            removeCrewInjuries(c, true);
          }
        });
        addLog('Crew fully treated for '+cost+' cr.','lg');
      }
      else addLog('Need '+cost+' cr to heal crew.','lw');
      break;}
    case 'medvend':{
      if(G.base && !G.base.medbayStock) G.base.medbayStock = generateMedbayStock(G.base.stationName || 'Starbase Alpha');
      G.base.medbaySub = 'vend';
      G.base.subSel = 0;
      G.base.subScroll = 0;
      break;}
    case 'medvend_back':{
      G.base.medbaySub = null;
      G.base.subSel = 0;
      G.base.subScroll = 0;
      break;}
    case 'science_corp_sub':{
      const _corpId = G._stationCorps?.[G.base?.stationName||'Starbase Alpha'] || 'eridani';
      if(!G.base.corpStock) G.base.corpStock = generateCorpStock(_corpId, G.base?.stationName||'Starbase Alpha');
      G.base.scienceCorpSub = true;
      G.base.subSel = 0;
      G.base.subScroll = 0;
      break;}
    case 'science_corp_back':{
      G.base.scienceCorpSub = false;
      G.base.subSel = 0;
      G.base.subScroll = 0;
      break;}
    case 'supplies':{
      if(G.credits>=50){
        const crewFull = G.crew.filter(c=>c.hp>0).every(c=>c.hp>=c.maxHp);
        const hullFull = G.ship.hp>=G.ship.maxHp;
        if(crewFull && hullFull){ addLog('Nothing to patch up — hull and crew are at full health.','li'); }
        else { G.credits-=50; G.crew.forEach(c=>c.hp=Math.min(c.maxHp,c.hp+10)); G.ship.hp=Math.min(G.ship.maxHp,G.ship.hp+10); if(!hullFull) SFX.repair(); addLog('Supplies bought. Crew and hull patched up.','lg'); }
      }
      else addLog('Need 50 cr for supplies.','lw');
      break;}
    case 'medikit':
      if(G.credits>=100){
        G.credits-=100;
        G.inventory.push({name:'Medikit',col:'#ff6688',desc:'A medikit.',value:0,usable:'medikit'});
        addLog('Medikit purchased. Open inventory to use.','lg');
      } else addLog('Need 100 cr for a Medikit.','lw');
      break;
    case 'oxytank':
      if(G.credits>=100){
        G.credits-=100;
        G.inventory.push({name:'Oxygen Tank',col:'#44ddff',desc:'An oxygen tank.',value:0,usable:'oxytank'});
        addLog('Oxygen Tank purchased. Open inventory to use on the surface.','lg');
      } else addLog('Need 100 cr for an Oxygen Tank.','lw');
      break;
    case 'handgun':
      if(G.credits>=150){
        G.credits-=150;
        G.inventory.push({name:'Simple Handgun',col:'#aaaaff',desc:'+2 ATK when equipped.',value:0,usable:'gun'});
        addLog('Simple Handgun purchased. Open inventory to equip to a crew member.','lg');
      } else addLog('Need 150 cr for a Simple Handgun.','lw');
      break;
    default:
      if(actionId.startsWith('store_weapon_')){
        if(G.mode==='base')storeShipWeapon(Number(actionId.slice(13)));
      } else if(actionId.startsWith('store_module_')){
        if(G.mode==='base')storeShipModule(actionId.slice(13));
      } else if(actionId.startsWith('restore_module_')){
        if(G.mode==='base')restoreShipModule(actionId.slice(15));
      } else if(actionId.startsWith('sell_stored_weapon_')){
        if(G.mode==='base')sellStoredEquipment(actionId.slice(19));
      } else if(actionId.startsWith('sell_stored_module_')){
        if(G.mode==='base')sellStoredEquipment(actionId.slice(19),true);
      } else if(actionId.startsWith('ship_ammo_')){
        const id=actionId.slice('ship_ammo_'.length),ammo=SHIP_AMMO[id];
        if(G.mode!=='base' || !ammo) break;
        if(!ownsShipWeapon(id)){addLog('Own an '+SHIP_WEAPONS[id].name+' before buying its ammunition.','lw');break;}
        ensureShipSystems();
        const count=G.ship.ammo[id]||0;
        if(count>=ammo.capacity){addLog('Missile magazine is full.','lw');break;}
        if(G.credits<ammo.cost){addLog('Need '+ammo.cost+' cr for an '+ammo.name+'.','lw');break;}
        G.credits-=ammo.cost;G.ship.ammo[id]=count+1;
        addLog(ammo.name+' loaded. Magazine '+G.ship.ammo[id]+'/'+ammo.capacity+'.','lg');
      } else if(actionId.startsWith('hangar_sub_')){
        G.base.hangarSub = actionId.replace('hangar_sub_', '');
        G.base.subSel = 0; G.base.subScroll = 0;
      } else if(actionId.startsWith('installweapon_')){
        const slot3 = parseInt(actionId.split('_')[1]);
        G.base.screen = 'installweapon';
        G.base.weaponSlot = slot3;
        G.base.weaponSel = 0;
      } else if(actionId.startsWith('pawn_')){
        const idx = parseInt(actionId.slice(5));
        const stock = G.base.pawnStock;
        const item = stock ? stock[idx] : null;
        if(!item || item.stock <= 0){ addLog('Out of stock.','lw'); break; }
        if(G.credits < item.cost){ addLog('Need '+item.cost+' cr for '+item.name+'.','lw'); break; }
        G.credits -= item.cost;
        item.stock--;
        applyPawnItem(item);
      } else if(actionId.startsWith('corp_')){
        const idx = parseInt(actionId.slice(5));
        if(!G.base.corpStock) G.base.corpStock = generateCorpStock(G._stationCorps?.[G.base.stationName]||'eridani', G.base.stationName||'Starbase Alpha');
        const stock = G.base.corpStock;
        const item = stock ? stock[idx] : null;
        if(!item || item.stock <= 0){ addLog('Out of stock.','lw'); break; }
        if(G.credits < item.cost){ addLog('Need '+item.cost+' cr for '+item.name+'.','lw'); break; }
        G.credits -= item.cost;
        item.stock--;
        applyCorpItem(item);
      } else if(actionId.startsWith('bounty_redeem_')){
        const ci = parseInt(actionId.slice('bounty_redeem_'.length));
        const captured = (G.inventory||[]).filter(c=>c.isCapturedCreature);
        const entry = captured[ci];
        if(!entry){ addLog('Bounty entry not found.','lw'); break; }
        earnCredits(entry.bounty);
        addLog('Bounty redeemed: '+entry.creatureName+' — +'+entry.bounty+' cr. Margo Security thanks you.','lg');
        const invIdx = G.inventory.indexOf(entry);
        if(invIdx !== -1) G.inventory.splice(invIdx, 1);
        G.base.subSel = 0; G.base.subScroll = 0;
      } else if(actionId.startsWith('implant_remove_')){
        const REMOVAL_COST = 200;
        // id format: implant_remove_<crew_name_underscored>_<slot_index>
        const rest = actionId.slice('implant_remove_'.length);
        const lastUnderscore = rest.lastIndexOf('_');
        const crewNameKey = rest.slice(0, lastUnderscore).replace(/_/g,' ');
        const slotIdx = parseInt(rest.slice(lastUnderscore+1));
        const target = (G.crew||[]).find(c=>c.name===crewNameKey && c.hp>0);
        if(!target){ addLog('Crew member not found.','lw'); break; }
        if(!target.implants || target.implants[slotIdx]===undefined){ addLog('Implant slot not found.','lw'); break; }
        if(G.credits < REMOVAL_COST){ addLog('Need '+REMOVAL_COST+' cr for implant removal.','lw'); break; }
        const impId = target.implants[slotIdx];
        const imp = IMPLANT_CATALOG.find(i=>i.id===impId);
        G.credits -= REMOVAL_COST;
        // Reverse permanent maxHp bonus if any
        if(imp?.effect?.maxHp){
          target.maxHp = Math.max(1, (target.maxHp||10) - imp.effect.maxHp);
          target.hp = Math.min(target.hp, target.maxHp);
        }
        target.implants.splice(slotIdx, 1);
        addLog((imp?imp.name:impId)+' removed from '+crewDisplayName(target)+'. ('+REMOVAL_COST+' cr)','lg');
        // Reset sub-screen selection so list stays valid
        G.base.subSel = 0; G.base.subScroll = 0;
      } else if(actionId.startsWith('medbuy_')){
        const idx = parseInt(actionId.slice('medbuy_'.length));
        if(G.base && !G.base.medbayStock) G.base.medbayStock = generateMedbayStock(G.base.stationName || 'Starbase Alpha');
        const stock = G.base?.medbayStock;
        const item = stock ? stock[idx] : null;
        if(!item || item.stock <= 0){ addLog('Out of stock.','lw'); break; }
        if(G.credits < item.cost){ addLog('Need '+item.cost+' cr for '+item.name+'.','lw'); break; }
        G.credits -= item.cost;
        item.stock--;
        addPurchasedMedbayItem(item);
        addLog(item.name+' purchased. Open inventory to use.','lg');
        if(item.stock === 0) addLog('That was the last one!','lw');
      } else if(actionId.startsWith('market_buy_')){
        const comId = actionId.slice('market_buy_'.length);
        const com   = COMMODITIES[comId];
        const mStn  = G.base?.stationName || 'Starbase Alpha';
        const ss    = G.shipStats;
        if(!com){ addLog('Unknown commodity.','lw'); break; }
        if(!ss || G.cargo.length >= ss.cargoCapacity){ addLog('Cargo hold full.','lw'); break; }
        const buyP = getBuyPrice(mStn, comId);
        if(G.credits < buyP){ addLog('Need '+buyP+' cr to buy '+com.name+'.','lw'); break; }
        G.credits -= buyP;
        addCargo(makeCommodityItem(comId, mStn, buyP));
        addLog('Bought 1 unit of '+com.name+' for '+buyP+' cr. ('+G.cargo.length+'/'+ss.cargoCapacity+' hold)','lg');
      } else if(actionId.startsWith('market_sell_')){
        const idxStr = actionId.slice('market_sell_'.length);
        const mStn   = G.base?.stationName || 'Starbase Alpha';
        const ownedComs = (G.cargo||[]).filter(i=>i.isCommodity);
        const idx    = parseInt(idxStr);
        const item   = ownedComs[idx];
        if(!item){ addLog('Item not found.','lw'); break; }
        const rev  = getSellPrice(mStn, item.commodityId);
        const prof = rev - (item.boughtPrice||0);
        // Remove just this one unit from cargo
        let removed = false;
        G.cargo = G.cargo.filter(i=>{ if(!removed && i===item){ removed=true; return false; } return true; });
        earnCredits(rev);
        addLog('Sold '+item.name+': '+rev+' cr '+(prof>=0?'(+'+prof+' profit)':'('+prof+' loss)'),prof>=0?'lg':'lw');
        if(G.credits>=10000) addLog('10,000 cr reached visit the Science Office to retire.','lg');
      }
  }
  if(G.credits!==beforeCredits || G.fuel!==beforeFuel){
    const minutes=actionId==='refuel'||actionId==='repair'||actionId.startsWith('up')||actionId.startsWith('buyweapon')?30:5;
    recordCareerTime('services',minutes,'stations');
  }
  renderAll();
}

