// ─────────────────────────────────────────────────────────────────
//  STATION MENU DATA
// ─────────────────────────────────────────────────────────────────
const STATION_BUILDINGS = [
  {
    id: 'hangar',
    name: 'Hangar',
    desc: 'Ship maintenance, fuel and upgrades',
    col: '#44aaff',
    actions: () => {
      const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
      const hangarSub = G.base?.hangarSub || 'top';

      if(hangarSub === 'top'){
        return [
          { label: 'Maintenance',   detail: 'Refuel and repair your hull',          id:'hangar_sub_maintenance' },
          { label: 'Upgrades',      detail: 'Hull, fuel, engines, shields, sensors',  id:'hangar_sub_upgrades'    },
          { label: 'Armament',      detail: 'Install and upgrade weapons',          id:'hangar_sub_armament'    },
          { label: 'Modules',       detail: 'Ship systems and special equipment',   id:'hangar_sub_modules'     },
          { label: 'Change Hull',   detail: 'Switch to a different ship class',     id:'changehull'             },
        ];
      }

      const cls = SHIP_CLASSES[ss.classId] || SHIP_CLASSES.LIGHT_SCOUT;
      const hasEngineer = G.crew.some(c=>c.role==='engineer'&&c.hp>0);

      if(hangarSub === 'maintenance'){
        const fuelCost = Math.round((G.maxFuel-G.fuel)*0.8);
        const rows = [
          { label: '← Back',     detail: '',                                              id:'hangar_sub_top' },
          { label: 'Refuel ship', detail: fuelCost>0 ? fuelCost+' cr → full tank' : 'Already full', id:'refuel', disabled: fuelCost===0 },
          { label: 'Repair hull', detail: G.ship.hp>=G.ship.maxHp ? 'Hull at full integrity' : '50 cr → ship +10 HP', id:'repair', disabled: G.ship.hp>=G.ship.maxHp },
        ];
        if(G.towedShip){
          rows.push({ label: '⚓ Sell: '+G.towedShip.name, detail: 'Salvage value: '+(G.towedShip.saleValue||400)+' cr', id:'sell_towed_ship' });
        }
        return rows;
      }

      if(hangarSub === 'upgrades'){
        const hullAtMax   = G.ship.maxHp >= ss.maxUpgradeHp;
        const fuelAtMax   = G.maxFuel    >= ss.maxUpgradeFuel;
        const sensorAtMax = ss.sensorRange >= (ss.maxUpgradeSensor ?? cls.sensorRange + 2);
        const shieldAtMax = ss.shields >= ss.maxShields;
        const cargoMax   = { LIGHT_SCOUT:1, BULK_FREIGHTER:15, ATTACK_CORVETTE:1 };
      const cargoAtMax  = ss.cargoCapacity >= (cargoMax[ss.classId]||0);
        return [
          { label: '← Back',              detail: '',                                                                                                                                                   id:'hangar_sub_top' },
          { label: 'Upgrade hull plating', detail: hullAtMax   ? 'Max ('+ss.maxUpgradeHp+' HP)'         : hasEngineer ? '200 cr → max HP +20 ('+G.ship.maxHp+'/'+ss.maxUpgradeHp+')'      : 'Needs Engineer', id:'uphull',    disabled: hullAtMax   || !hasEngineer },
          { label: 'Upgrade fuel tank',    detail: fuelAtMax   ? 'Max ('+ss.maxUpgradeFuel+')'           : hasEngineer ? '250 cr → max fuel +20 ('+G.maxFuel+'/'+ss.maxUpgradeFuel+')'     : 'Needs Engineer', id:'upfuel',    disabled: fuelAtMax   || !hasEngineer },
          { label: 'Upgrade shields',      detail: shieldAtMax ? 'Max ('+ss.maxShields+')'               : ss.maxShields===0 ? 'Hull cannot mount shields'
                                                               : hasEngineer ? '350 cr → +1 shield ('+ss.shields+'/'+ss.maxShields+')'                                                     : 'Needs Engineer', id:'upshield',  disabled: shieldAtMax || ss.maxShields===0 || !hasEngineer },
          { label: 'Upgrade sensors',      detail: sensorAtMax ? 'Max'                                   : '400 cr → range +1 (currently '+ss.sensorRange+')',                                          id:'upsensor',  disabled: sensorAtMax },
          { label: 'Upgrade cargo hold',   detail: cargoAtMax  ? 'Max'                                   : hasEngineer ? '300 cr → +10 capacity ('+ss.cargoCapacity+')'                    : 'Needs Engineer', id:'upcargo',   disabled: cargoAtMax  || !hasEngineer },
          { label: 'Upgrade engines',   detail: (()=>{ const cap=ss.maxUpgradeEngine??ss.engineRating; return ss.engineRating>=cap ? 'Max (rating '+cap+')' : hasEngineer ? '450 cr → engine +1 ('+ss.engineRating+'/'+cap+')' : 'Needs Engineer'; })(),  id:'upengine',  disabled: (ss.engineRating>=(ss.maxUpgradeEngine??ss.engineRating)) || !hasEngineer },
        ];
      }

      if(hangarSub === 'armament'){
        const weaponAtMax = ss.weaponSlots >= ss.maxWeaponSlots;
        return [
          { label: '← Back', detail: '', id:'hangar_sub_top' },
          ...Array.from({length: ss.maxWeaponSlots}, (_,slot) => {
            const wid = (G.installedWeapons||[])[slot];
            const wdef = wid ? SHIP_WEAPONS[wid] : null;
            const locked = slot >= ss.weaponSlots;
            return {
              label: 'Slot ['+(slot+1)+'] '+(wdef ? wdef.name : 'empty'),
              detail: locked ? 'Locked — add weapon slot first' : wdef ? wdef.minDmg+'–'+wdef.maxDmg+' dmg — press Enter to replace' : 'No weapon installed',
              id: 'installweapon_'+slot,
              disabled: locked,
            };
          }),
          { label: 'Add weapon slot',
            detail: weaponAtMax ? 'Max ('+ss.maxWeaponSlots+')' : hasEngineer ? '500 cr → unlock slot ('+ss.weaponSlots+'/'+ss.maxWeaponSlots+')' : 'Needs Engineer',
            id:'upwslot', disabled: weaponAtMax || !hasEngineer },
        ];
      }

      if(hangarSub === 'modules'){
        const moduleSlots = ss.moduleSlots || 0;
        const moduleAtMax = moduleSlots >= ss.maxModuleSlots;
        const modules = [
          { id:'tractor_beam',   name:'Tractor Beam',       desc:'Tow derelict ships to a station and sell them.' },
          { id:'fuel_scoop',     name:'Fuel Scoop',          desc:'Harvest hydrogen from gas giants to refuel.' },
          { id:'mining_drill',   name:'Ship Mining Drill',   desc:'Drill mineral deposits directly from orbit.' },
        ];
        const rows = [
          { label: '← Back', detail: '', id:'hangar_sub_top' },
          { label: 'Add module slot',
            detail: moduleAtMax ? 'Max ('+ss.maxModuleSlots+')' : hasEngineer ? '500 cr → unlock slot ('+moduleSlots+'/'+ss.maxModuleSlots+')' : 'Needs Engineer',
            id:'upmodslot', disabled: moduleAtMax || !hasEngineer },
        ];
        // Fuel Scoop availability — 60% chance per station visit, seeded by station+turn
        if(G.base._scoopStock === undefined){
          G.base._scoopStock = Math.random() < 0.60;
        }
        // Tractor Beam availability — 50% chance per station visit
        if(G.base._tractorStock === undefined){
          G.base._tractorStock = Math.random() < 0.50;
        }
        const scoopAvail = G.base._scoopStock;
        const tractorAvail = G.base._tractorStock;
        modules.forEach((mod, i) => {
          const installed = (G.installedModules||[]).includes(mod.id);
          const freeSlot  = moduleSlots > (G.installedModules||[]).length;
          if(mod.id === 'fuel_scoop'){
            const SCOOP_COST = 500;
            let detail, id, disabled;
            if(installed){
              detail = 'Installed — '+mod.desc; id = 'noop'; disabled = true;
            } else if(!scoopAvail){
              detail = 'Out of stock — check back later'; id = 'noop'; disabled = true;
            } else if(!freeSlot){
              detail = 'No module slot — add one above'; id = 'noop'; disabled = true;
            } else {
              detail = SCOOP_COST+' cr — '+mod.desc; id = 'install_fuel_scoop'; disabled = false;
            }
            rows.push({ label: (installed?'✓ ':'  ')+mod.name, detail, id, disabled });
          } else if(mod.id === 'tractor_beam'){
            const TRACTOR_COST = 600;
            let detail, id, disabled;
            if(installed){
              detail = 'Installed — '+mod.desc; id = 'noop'; disabled = true;
            } else if(!tractorAvail){
              detail = 'Out of stock — check back later'; id = 'noop'; disabled = true;
            } else if(!freeSlot){
              detail = 'No module slot — add one above'; id = 'noop'; disabled = true;
            } else {
              detail = TRACTOR_COST+' cr — '+mod.desc; id = 'install_tractor_beam'; disabled = false;
            }
            rows.push({ label: (installed?'✓ ':'  ')+mod.name, detail, id, disabled });
          } else {
            rows.push({
              label: (installed ? '✓ ' : '  ')+mod.name,
              detail: installed ? 'Installed — '+mod.desc : '(Coming soon)  —  '+mod.desc,
              id: 'noop', disabled: true,
            });
          }
        });
        return rows;
      }

      return [];
    },
  },
  {
    id: 'science',
    name: (stationName) => stationCorpOffice(stationName),
    desc: 'Sell samples, pick up missions',
    col: '#88ffaa',
    actions: () => {
      const cargo = G.inventory.filter(i=>i.value>0 && !i.isCapturedCreature);
      const total = cargo.reduce((s,i)=>s+(i.value||0),0);
      const surveyTotal = getPendingSurveySaleValue();
      const grandTotal = total + surveyTotal;
      const detailParts = [];
      if(total>0)       detailParts.push(total+' cr samples');
      if(surveyTotal>0) detailParts.push(surveyTotal+' cr surveys');
      const sellDetail = grandTotal>0 ? grandTotal+' cr  ('+detailParts.join(', ')+')' : 'Nothing to sell';
      const jobState = ensureScienceJobState();
      const noJobsLeft = !jobState.active && remainingScienceJobTypes().length === 0;
      const jobDisabled = noJobsLeft || (!jobState.active && G.turn < jobState.cooldownUntil);

      // Corp store sub-screen
      const stationName = G.base?.stationName || 'Starbase Alpha';
      const corpId = G?._stationCorps?.[stationName] || 'eridani';
      const corp = CORPORATIONS.find(c=>c.id===corpId);
      if(G.base?.scienceCorpSub){
        if(!G.base.corpStock) G.base.corpStock = generateCorpStock(corpId, stationName);
        const stock = G.base.corpStock;
        const rows = [{ label:'← Back', detail:'return to '+corp.name, id:'science_corp_back' }];
        rows.push({ label:'━━  '+(corp.name).toUpperCase()+' STORE  ━━', detail:'exclusive equipment', id:'_sep_corp', _header:true });
        if(!stock.length){
          rows.push({ label:'Nothing available', detail:'Check back after next run', id:'noop', disabled:true });
        } else {
          stock.forEach((item,i)=>rows.push({
            label: 'Buy '+item.name,
            detail: item.cost+' cr — '+item.detail+(item.stock > 0 ? ' ['+item.stock+' left]' : ' [OUT OF STOCK]'),
            id: 'corp_'+i,
            disabled: item.stock <= 0,
          }));
        }
        // Margo: bounty redemption for captured creatures
        if(corpId === 'margo'){
          const captured = (G.inventory||[]).filter(c=>c.isCapturedCreature);
          if(captured.length > 0){
            rows.push({ label:'━━  BOUNTY REDEMPTION  ━━', detail:'sell live captures for Margo Security bounties', id:'_sep_bounty', _header:true });
            captured.forEach((c,ci)=>{
              rows.push({
                label: 'Redeem: '+c.creatureName,
                detail: c.bounty+' cr bounty — live specimen',
                id: 'bounty_redeem_'+ci,
              });
            });
          }
        }
        if(corpId === 'biovance'){
          const REMOVAL_COST = 200;
          rows.push({ label:'━━  IMPLANT REMOVAL  ━━', detail:'surgical extraction — '+REMOVAL_COST+' cr per implant', id:'_sep_removal', _header:true });
          const crewWithImplants = (G.crew||[]).filter(c=>c.hp>0 && c.implants && c.implants.length>0);
          if(!crewWithImplants.length){
            rows.push({ label:'No implants to remove', detail:'no living crew carry implants', id:'noop_removal', disabled:true });
          } else {
            crewWithImplants.forEach(c=>{
              (c.implants||[]).forEach((impId, si)=>{
                const imp = IMPLANT_CATALOG.find(i=>i.id===impId);
                rows.push({
                  label: 'Remove: '+crewDisplayName(c)+' — '+(imp?imp.name:impId),
                  detail: REMOVAL_COST+' cr — permanent removal, effects lost',
                  id: 'implant_remove_'+c.name.replace(/\s/g,'_')+'_'+si,
                });
              });
            });
          }
        }
        return rows;
      }

      const capturedSpecimens = (G.inventory||[]).filter(c=>c.isCapturedCreature);
      const isMargo = corpId === 'margo';
      const actions = [
        { label: 'Sell samples & surveys', detail: sellDetail, id:'sell', disabled: grandTotal===0 },
        { label: jobState.active ? 'Complete research job' : (noJobsLeft ? 'Research jobs exhausted' : 'Take research job'), detail: scienceJobDetail(), id:'science_job', disabled: jobDisabled },
        { label: 'Browse '+(corp?.name||'Corp')+' Store', detail: 'exclusive equipment & tech', id:'science_corp_sub' },
        { label: 'File for retirement', detail: G.credits+' cr — end your career here', id:'retire' },
      ];
      if(isMargo && capturedSpecimens.length > 0){
        actions.splice(1, 0, { label: 'Sell captured specimens ('+capturedSpecimens.length+')', detail: capturedSpecimens.reduce((s,c)=>s+c.bounty,0)+' cr total — live specimen bounties', id:'sell_specimens' });
      } else if(isMargo && capturedSpecimens.length === 0){
        actions.splice(1, 0, { label: 'Sell captured specimens', detail: 'no live specimens in inventory', id:'sell_specimens', disabled: true });
      }
      return actions;
    },
  },
  {
    id: 'market',
    name: 'Commodity Market',
    desc: 'Buy and sell bulk cargo',
    col: '#ffdd88',
    actions: () => {
      const station = G.base?.stationName || 'Starbase Alpha';
      const ss = G.shipStats;
      const cargoFull = !ss || G.cargo.length >= ss.cargoCapacity;
      const holdStr = ss ? G.cargo.length+'/'+ss.cargoCapacity+' hold' : '';
      const rows = [];
      rows.push({ label: '← Back', detail: '', id:'market_back' });
      // ── SELL SECTION ──────────────────────────────────────────
      const ownedComs = (G.cargo||[]).filter(i=>i.isCommodity);
      const sellAllVal = ownedComs.reduce((s,i)=>s+getSellPrice(station,i.commodityId),0);
      rows.push({ label: '━━  SELL CARGO  ━━', detail: 'offload at current station prices', id:'_sep_sell', _header:true });
      if(ownedComs.length){
        rows.push({ label: 'Sell all  ('+ownedComs.length+' units)', detail: sellAllVal+' cr total', id:'market_sell_all' });
        ownedComs.forEach((item,idx)=>{
          const sellP = getSellPrice(station, item.commodityId);
          const profit = sellP - (item.boughtPrice||0);
          const profStr = profit>=0 ? '+'+profit+' profit' : profit+' loss';
          rows.push({ label: 'Sell: '+item.name, detail: sellP+' cr  ('+profStr+')', id:'market_sell_'+idx });
        });
      } else {
        rows.push({ label: 'No cargo to sell', detail: 'buy commodities below or find deals at the bar', id:'_', disabled:true });
      }
      // ── BUY SECTION ───────────────────────────────────────────
      rows.push({ label: '━━  BUY CARGO  ━━', detail: cargoFull ? 'Hold full — '+holdStr : holdStr, id:'_sep_buy', _header:true });
      Object.values(COMMODITIES).forEach(com=>{
        const buyP = getBuyPrice(station, com.id);
        rows.push({
          label: 'Buy: '+com.name,
          detail: cargoFull ? 'Hold full' : buyP+' cr / unit',
          id: 'market_buy_'+com.id,
          disabled: cargoFull,
        });
      });
      return rows;
    },
  },
  {
    id: 'bar',
    name: (stationName) => stationName === 'Waypoint Omega' ? 'Good Ship Lollipop (Bar)' : 'The Rusty Comet (Bar)',
    desc: 'Recruit crew, hear rumours',
    col: '#ffaa44',
    actions: () => {
      const ss = G.shipStats;
      const cargoFull = !ss || G.cargo.length >= ss.cargoCapacity;
      const station   = G.base?.stationName || 'Starbase Alpha';
      // Show cargo offer if player has space — pick a random commodity for this session
      const offerCom  = G.base?._barOfferCom || null;
      const offerPrice = offerCom ? getBuyPrice(station, offerCom) : 0;
      const comDef    = offerCom ? COMMODITIES[offerCom] : null;
      const btns = [
        { label: 'Recruit crew member', detail: '150 cr — add a crew member ('+G.crew.filter(c=>c.hp>0).length+' / '+(ss?.maxCrew??6)+')', id:'recruit' },
        { label: 'Buy a drink',         detail: '5 cr — hear a rumour, maybe a cargo tip', id:'drink' },
      ];
      if(offerCom && !cargoFull){
        btns.push({ label: 'Buy: '+comDef.name, detail: offerPrice+' cr / unit  ('+G.cargo.length+'/'+ss.cargoCapacity+' hold)', id:'buy_cargo_offer' });
      } else if(cargoFull && ss && ss.cargoCapacity > 0){
        btns.push({ label: 'Cargo hold full', detail: G.cargo.length+'/'+ss.cargoCapacity+' — offload first', id:'_', disabled:true });
      }
      return btns;
    },
  },
  {
    id: 'medbay',
    name: 'Medbay',
    desc: 'Heal crew, treat injuries',
    col: '#ff6688',
    actions: () => {
      const cost = 30*G.crew.length;
      if(G.base && !G.base.medbayStock) G.base.medbayStock = generateMedbayStock(G.base.stationName || 'Starbase Alpha');
      if(G.base?.medbaySub === 'vend'){
        const stock = G.base?.medbayStock || [];
        const rows = [
          { label:'← Back', detail:'return to Medbay services', id:'medvend_back' },
          { label:'━━  MED-VEND  ━━', detail:'station-specific medical stock', id:'_sep_med', _header:true },
        ];
        if(!stock.length){
          rows.push({ label:'No special supplies', detail:'This medbay is picked clean', id:'noop', disabled:true });
        } else {
          stock.forEach((item,i)=>rows.push({
            label: 'Buy '+item.name,
            detail: item.cost+' cr — '+item.detail+(item.stock > 0 ? ' ['+item.stock+' left]' : ' [OUT OF STOCK]'),
            id: 'medbuy_'+i,
            disabled: item.stock <= 0,
          }));
        }
        return rows;
      }
      return [
        { label: 'Heal and treat crew', detail: cost+' cr → full HP; remove disease and injuries', id:'healcrew' },
        {
          label: 'Med-vend',
          detail: 'browse special medicine and field treatment supplies',
          id: 'medvend',
        },
      ];
    },
  },
  {
    id: 'pawn',
    name: 'Supply Depot',
    desc: 'Buy supplies and equipment',
    col: '#ccaaff',
    actions: () => {
      const stock = G.base.pawnStock || [];
      if(!stock.length) return [{ label:'Nothing in stock', detail:'Come back later', id:'noop', disabled:true }];
      return stock.map((item,i) => ({
        label: 'Buy '+item.name,
        detail: item.cost+' cr — '+item.detail+(item.stock > 0 ? ' ['+item.stock+' left]' : ' [OUT OF STOCK]'),
        id: 'pawn_'+i,
        disabled: item.stock <= 0,
      }));
    },
  },
];

