// Controlled combat fixtures shared by bridge scenarios and bounded matchup audits.
   window.bridgeBase=serializeCareer(G);window.bridgeRandom=Math.random;
   window.bridgeFixture=(options={})=>{
    clearShipCombatFeedback();installSaveSnapshot(parseSaveSnapshot(window.bridgeBase));
    Object.assign(DEBUG,{infiniteHull:false,infiniteCrewHp:false,infiniteFuel:false});
    const id=options.hull||'ATTACK_CORVETTE';G.shipStats=buildShipStats(id,{weapons:id==='BULK_FREIGHTER'?1:0});
    G.ship={x:10,y:10,hp:G.shipStats.maxHp,maxHp:G.shipStats.maxHp};G.fuel=G.maxFuel=G.shipStats.maxFuel;
    G.galaxy[10][10]={type:'VOID'};
    G.installedWeapons=options.weapons||(id==='ATTACK_CORVETTE'?['railgun','mass_driver']:['mass_driver']);
    G.shipRefits={};G.hangarStores={};G.installedModules=[];G.cargo=[];G.log=[];
    G.crew[0].skills.cbt=options.trained?6:1;G.crew[1].skills.nav=options.trained?6:3;
    G.crew.forEach(c=>{c.hp=c.maxHp;c.statuses={};c._skillXp={};});
    G.nextCrewTalkTurn=G.nextCrewGalaxyTalkTurn=100000;G.pirates=[];G.neutralShips=[];G.gasEntities=[];G.npcStranded=[];
    G._pirateRoamerTarget=0;G.mode='galaxy';G.stranded=null;ensureShipSystems();
    if(options.setupOnly)return null;
    const tactic=options.tactic||'brawler',weapon={brawler:'mass_driver',skirmisher:'pulse_laser',sniper:'railgun',missile:'artemis'}[tactic];
    const npc={name:'Bridge '+tactic,x:10,y:10,hp:90,maxHp:90,atk:9,guns:1,alive:true,pirateType:'guard',
     engineRating:tactic==='skirmisher'?3:2,combatTactic:tactic,bridgeSkills:{gunnery:3,piloting:3},installedWeapons:[weapon],ammo:{artemis:4}};
    G.pirates=[npc];startShipCombat(npc,true);G.shipCombat.asteroids=[];
    return G.shipCombat;
   };
