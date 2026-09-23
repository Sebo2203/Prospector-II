const RADIO_CHATTER = [
  '...static... all units be advised, pirate activity reported in sector...',
  '...this is freighter Dorado, requesting fuel escort to...',
  '...survey team three, we\'re seeing something unusual on the surface...',
  '...cannot confirm life signs but the readings are... ..static...',
  '...fuel prices at the depot are criminal. Absolute robbery...',
  '...lost contact with the probe about six hours ago...',
  '...anyone know if the bar at Waypoint Omega is still open?...',
  '...repeat, do not enter the nebula cluster near coordinates...',
  '...she\'s a good ship. Just needs a new fuel injector...',
  '...Company quarterly reports are in. We made them rich again...',
  '...my retirement clock says 847 days. Not that I\'m counting...',
  '...Sigma Draconis system is beautiful this time of cycle...',
  '...bogey on approach, doesn\'t match any registered transponders...',
  '...crew morale is low. Should\'ve sprung for better rations...',
  '...first time out here? You\'ll either love it or never come back...',
];
const CREW_ROLES = {
  captain:    { label:'Captain',   col:'#ffe066', hp:30, maxHp:30, atk:2, def:0, special:true  },
  scout:      { label:'Navigator', col:'#70d8ff', hp:22, maxHp:22, atk:1, def:0, special:true  },
  engineer:   { label:'Engineer',  col:'#ffaa44', hp:25, maxHp:25, atk:1, def:0, special:true  },
  scientist:  { label:'Scientist', col:'#88ffcc', hp:20, maxHp:20, atk:1, def:0, special:true  },
  medic:      { label:'Medic',     col:'#ff6688', hp:20, maxHp:20, atk:1, def:0, special:false },
  mercenary:  { label:'Mercenary', col:'#cc88ff', hp:28, maxHp:28, atk:1, def:0, special:false },
  redshirt:   { label:'Redshirt',  col:'#ff4444', hp:26, maxHp:26, atk:1, def:0, special:false },
};

