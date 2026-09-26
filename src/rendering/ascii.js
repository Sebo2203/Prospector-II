const ASCII = {
  // Galaxy
  player_ship:    { ch:'?', bg:'#04040c', fg:'#aaddff' },
  ship_corvette:  { ch:'?', bg:'#04040c', fg:'#ff8866' },
  ship_freighter: { ch:'?', bg:'#04040c', fg:'#ffdd88' },
  pirate_ship:    { ch:'?', bg:'#04040c', fg:'#ff4422' },
  starbase:       { ch:'B', bg:'#04040c', fg:'#ffe066' },
  black_hole:     { ch:'●', bg:'#000000', fg:'#ff8800' },

  // Planet floors
  earth_floor:    { ch:'.', bg:'#0a1a08', fg:'#2a5a1a' },
  earth_floor2:   { ch:'.', bg:'#0a1a08', fg:'#2a5a1a' },
  bloom_floor:    { ch:'·', bg:'#17351a', fg:'#ff66cc' },
  bloom_floor2:   { ch:'·', bg:'#203b16', fg:'#ffe066' },
  bloom_thicket:  { ch:'?', bg:'#17351a', fg:'#d488ff' },
  BLOOM_FLOOR:    { ch:'·', bg:'#17351a', fg:'#ff66cc' },
  BLOOM_FLOOR2:   { ch:'·', bg:'#203b16', fg:'#ffe066' },
  BLOOM_THICKET:  { ch:'?', bg:'#17351a', fg:'#d488ff' },
  toxic_floor:    { ch:'.', bg:'#081008', fg:'#1a5a0a' },
  TOXIC_FLOOR2:   { ch:'~', bg:'#051008', fg:'#2a7a10' },
  TOXIC_FLOOR3:   { ch:'o', bg:'#051208', fg:'#3a6a00' },
  desert_floor:   { ch:'.', bg:'#1a1208', fg:'#5a4010' },
  frozen_floor:   { ch:'.', bg:'#080e18', fg:'#2a4a6a' },
  asteroid_floor: { ch:'.', bg:'#080808', fg:'#282828' },
  volcanic_floor: { ch:'.', bg:'#120600', fg:'#3a1800' },
  volcanic_floor2: { ch:'.', bg:'#0a0603', fg:'#1a0e07' },
  ancient_floor:  { ch:'.', bg:'#080c14', fg:'#1e3a5a' },
  ancient_road:         { ch:'=', bg:'#0a0e18', fg:'#2a3a52' },
  ancient_wall:         { ch:'█', bg:'#0d1520', fg:'#28e8c8' },
  ancient_outpost_floor:{ ch:'·', bg:'#0a1018', fg:'#28e8c8' },
  // Rocks
  earth_rock:     { ch:'#', bg:'#0a1a08', fg:'#4a7a2a' },
  earth_rock2:    { ch:'#', bg:'#0a1a08', fg:'#3a6a1a' },
  toxic_rock:     { ch:'#', bg:'#081008', fg:'#3a7a1a' },
  toxic_rock2:    { ch:'#', bg:'#081008', fg:'#2a6a10' },
  desert_rock:    { ch:'#', bg:'#1a1208', fg:'#8a6030' },
  desert_rock2:   { ch:'#', bg:'#1a1208', fg:'#7a5028' },
  frozen_rock:    { ch:'#', bg:'#080e18', fg:'#6a8aaa' },
  frozen_rock2:   { ch:'#', bg:'#080e18', fg:'#5a7a9a' },
  volcanic_rock:  { ch:'#', bg:'#120600', fg:'#5a2a00' },
  volcanic_rock2: { ch:'#', bg:'#120600', fg:'#6a3200' },
  asteroid_rock:  { ch:'#', bg:'#080808', fg:'#5a5a5a' },
  asteroid_rock2: { ch:'#', bg:'#080808', fg:'#4a4a4a' },
  ancient_rock:   { ch:'▪', bg:'#080c14', fg:'#2a4060' },
  ancient_locked_door: { ch:'#',  bg:'#0a0d18', fg:'#22ccee' },
  ancient_statue: { ch:'♙', bg:null, fg:'#c0b090' },
  lava:           { ch:'~', bg:'#2a0000', fg:'#ff6600' },
  // Items
  mineral:        { ch:'$', bg:null, fg:'#ffe066' },
  artifact:       { ch:'&', bg:null, fg:'#dd66ff' },
  biodata:        { ch:'+', bg:null, fg:'#44ff88' },
  // Entities
  player_pawn:        { ch:'@', bg:null, fg:'#aaddff' },
  alien:          { ch:'a', bg:null, fg:'#ff4422' },
  alien_boss:     { ch:'A', bg:null, fg:'#ff0000' },
  alien2:         { ch:'a', bg:null, fg:'#cc3311' },
  alien_boss2:    { ch:'A', bg:null, fg:'#ff2200' },
  lava_floor:     { ch:'~', bg:'#cc3300', fg:'#ff8800' },
  lava_crust:     { ch:'.', bg:'#331100', fg:'#aa4400' },
  ammonia:        { ch:'~', bg:'#1a3a08', fg:'#88cc22' },
  geyser:         { ch:'o', bg:'#1a2a08', fg:'#446622' },
  geyser_active:  { ch:'!', bg:'#1a2a08', fg:'#aaff44' },
  creature_quadruped: { ch:'q', bg:null, fg:'#aa8833' },
  creature_serpent:   { ch:'s', bg:null, fg:'#44aa44' },
  creature_floater:   { ch:'f', bg:null, fg:'#8844cc' },
  creature_crawler:   { ch:'c', bg:null, fg:'#aa6622' },
  creature_biped:     { ch:'b', bg:null, fg:'#446644' },
  creature_spiker:    { ch:'*', bg:null, fg:'#cc8822' },
  creature_grazer:    { ch:'g', bg:null, fg:'#888855' },
  creature_stalker:   { ch:'S', bg:null, fg:'#334466' },
  civ_local_primitive:   { ch:'p', bg:null, fg:'#d8b26a' },
  civ_local_tribal:      { ch:'t', bg:null, fg:'#a8d86a' },
  civ_local_medieval:    { ch:'m', bg:null, fg:'#c8c0a0' },
  civ_local_industrial:  { ch:'i', bg:null, fg:'#9aa8b8' },
  civ_local_information: { ch:'I', bg:null, fg:'#70d8ff' },
  civ_hut:           { ch:'h', bg:null, fg:'#b88a48' },
  civ_fire_pit:      { ch:'o', bg:null, fg:'#ff8844' },
  civ_longhouse:     { ch:'H', bg:null, fg:'#a87844' },
  civ_totem:         { ch:'!', bg:null, fg:'#d0a050' },
  civ_stone_tower:   { ch:'T', bg:null, fg:'#b8b8aa' },
  civ_market:        { ch:'$', bg:null, fg:'#e0aa66' },
  civ_factory:       { ch:'F', bg:null, fg:'#8c9098' },
  civ_tenement:      { ch:'B', bg:null, fg:'#a0a0a8' },
  civ_office:        { ch:'O', bg:null, fg:'#70b8e8' },
  civ_relay_tower:   { ch:'R', bg:null, fg:'#70d8ff' },
  uw_civ_shelter:    { ch:'s', bg:null, fg:'#42d0d8' },
  uw_civ_reef_totem: { ch:'!', bg:null, fg:'#70e0d0' },
  uw_civ_habitat:    { ch:'H', bg:null, fg:'#54c8f0' },
  uw_civ_bastion:    { ch:'B', bg:null, fg:'#80d8ff' },
  uw_civ_exchange:   { ch:'$', bg:null, fg:'#96e8d8' },
  uw_civ_processor:  { ch:'P', bg:null, fg:'#60b8d8' },
  uw_civ_pod_stack:  { ch:'D', bg:null, fg:'#78c8f0' },
  uw_civ_archive:    { ch:'A', bg:null, fg:'#9ee8ff' },
  uw_civ_sonar:      { ch:'R', bg:null, fg:'#b0f0ff' },
  walking_tree:          { ch:'T', bg:null, fg:'#44aa44' },
  civ_ruin:              { ch:'%', bg:'#1a160f', fg:'#665544' },
  cave_bug:       { ch:'x', bg:null, fg:'#b06a2a' },
  cave_queen:     { ch:'X', bg:null, fg:'#d28a36' },
  ship_tile:      { ch:'>', bg:null, fg:'#aaaaff' },
  cave_entrance:  { ch:'n', bg:null, fg:'#aa8844' },  // darker arch — stands out from rocks
  cave_floor:     { ch:'.', bg:'#080808', fg:'#1a1a1a' },
  cave_wall:      { ch:'#', bg:'#050505', fg:'#3a2a1a' },
  cave_stalagtite:{ ch:'^', bg:'#080808', fg:'#2a2020' },
  cave_exit:      { ch:'?', bg:'#080808', fg:'#aa8844' },
  nest:           { ch:'o', bg:'#0a1a08', fg:'#3a6a20' },
  cave_nest:      { ch:'¤', bg:'#080808', fg:'#8a4f2a' },
  // Underwater tiles
  uw_floor:       { ch:'.', bg:'#021828', fg:'#0a3a5a' },
  uw_wall:        { ch:'#', bg:'#010e18', fg:'#0a2030' },
  uw_kelp:        { ch:'|', bg:'#021828', fg:'#1a6a40' },
  uw_coral:       { ch:'*', bg:'#021828', fg:'#cc4466' },
  uw_vent:        { ch:'^', bg:'#021828', fg:'#cc8833' },
  uw_wreck:       { ch:'W', bg:'#021828', fg:'#886644' },
  uw_exit:        { ch:'↑', bg:'#021828', fg:'#44aadd' },
  // Derelict station tiles
  station_floor:  { ch:'·', bg:'#0a0f15', fg:'#2a3d50' },
  station_wall:   { ch:'¦', bg:'#04080c', fg:'#6688aa' },
  station_door:   { ch:'+',  bg:'#0a0f15', fg:'#88aacc' },
  station_console:{ ch:'?', bg:'#0a0f15', fg:'#22aadd' },
  station_locker: { ch:'?', bg:'#0a0f15', fg:'#7799aa' },
  station_corpse: { ch:'%',  bg:null,      fg:'#cc8855' },
  station_crack:  { ch:'\\', bg:'#0a0f15', fg:'#334455' },
  // Ancient station tiles (warm amber/gold palette — alien architecture)
  ancient_st_floor:  { ch:'·', bg:'#100c04', fg:'#4a3a10' },
  ancient_st_edge:   { ch:'¦', bg:'#100c04', fg:'#88661a' },
  ancient_st_corner: { ch:'+', bg:'#100c04', fg:'#aa8822' },
  ancient_st_node:   { ch:'?', bg:'#100c04', fg:'#ccaa33' },
  ancient_st_fuel:   { ch:'?', bg:'#100c04', fg:'#22ddaa' },
  ancient_st_trap:   { ch:'?', bg:'#100c04', fg:'#ccaa00' },  // visible energy node
  ancient_st_void:   { ch:' ',  bg:'#060400', fg:'#060400' },      // open space / instant death
  ancient_st_glow:   { ch:'*',  bg:'#100c04', fg:'#44ffcc' },      // alien light source — faint teal
  // Ringworld tiles
  rw_floor:          { ch:'·',  bg:'#161c20', fg:'#2a3440' },
  rw_debris:         { ch:'#',  bg:'#0a0b0d', fg:'#1c2028' },
  rw_wall:           { ch:'¦',  bg:'#0c0e11', fg:'#1e242b' },
  rw_locked_door:    { ch:'#',  bg:'#0e0a0a', fg:'#cc2200' },
  rw_open_door:      { ch:'/',  bg:'#161c20', fg:'#00aa44' },
  rw_console:        { ch:'?',  bg:'#08060e', fg:'#cc44ff' },
  rw_void:           { ch:' ',  bg:'#02020a', fg:'#02020a' },
  // Nuclear War Planet
  nuke_dirt:       { ch:'.',  bg:'#2a2418', fg:'#3a3020' },
  nuke_rock:       { ch:'¦',  bg:'#1e1c18', fg:'#2e2c22' },
  nuke_water:      { ch:'~',  bg:'#0e1c28', fg:'#1a4444' },
  nuke_dead_tree:  { ch:'†',  bg:'#2a2418', fg:'#1a1810' },
  nuke_crater:     { ch:'?',  bg:'#1e1a14', fg:'#2e2820' },
  nuke_ruin:       { ch:'#',  bg:'#2a2418', fg:'#3a3428' },
  nuke_ruin2:      { ch:'+',  bg:'#2a2418', fg:'#302c22' },
};

function drawAsciiTile(key, x, y, bgOverride, fgOverride){
  const def = ASCII[key] || { ch:'?', bg:'#111', fg:'#888' };
  const bg  = bgOverride || def.bg;
  if(bg){
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, TS, TS);
  }
  ctx.fillStyle = fgOverride || def.fg;
  ctx.font = 'bold '+(TS-1)+'px Courier New';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.ch, x + TS/2, y + TS/2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

