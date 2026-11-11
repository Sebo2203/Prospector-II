// Saved facts, rather than parsed log messages, support the journal and endings.
function ensureExpeditionState(){
  if(!G) return null;
  if(!G.expedition) G.expedition = { version:1, events:[], surveys:{}, quarantine:null };
  const state = G.expedition;
  if(!Array.isArray(state.events)) state.events = [];
  if(!state.surveys) state.surveys = {};
  return state;
}

function recordExpeditionEvent(id, kind, text, details={}){
  const state = ensureExpeditionState();
  if(!state || state.events.some(event=>event.id===id)) return;
  state.events.push({ id, kind, text, turn:G.turn, ...details });
}

function recordSurveyFinding(body){
  if(!body || !['partial','full'].includes(body.targetDesc.scanState)) return;
  const state = ensureExpeditionState();
  const {pKey, targetDesc} = body;
  const pdata = G.planets?.[pKey];
  const coverage = pdata ? getScanCoverage(pdata.scanMask) : 0;
  state.surveys[pKey] = {
    name:targetDesc.name, biome:targetDesc.biome,
    scanState:targetDesc.scanState, coverage, turn:G.turn,
    civilization:coverage>0 && pdata?.civilization
      ? pdata.civilization.tierLabel+' '+pdata.civilization.species : null,
  };
  recordExpeditionEvent('survey:'+pKey, 'discovery', 'First scan recorded: '+targetDesc.name, {planetKey:pKey});
}
