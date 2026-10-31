function addCargo(item){
  const cap = G.shipStats?.cargoCapacity ?? 1;
  if(G.cargo.length >= cap){
    addLog('Cargo hold full! ('+G.cargo.length+'/'+cap+')', 'lw');
    return false;
  }
  G.cargo.push(item);
  return true;
}

function analyticsShipClass(){
  return G?.shipStats?.classId || G?.shipStats?.hullType || 'unknown';
}

function analyticsBaseParams(extra){
  const params = {
    turns_played: G?.turn || 0,
    credits: G?.credits || 0,
    ship_class: analyticsShipClass(),
    mode: G?.mode || 'unknown',
  };
  return Object.assign(params, extra || {});
}

function trackTurnMilestone(){
  if(!G) return;
  const bucket = Math.floor((G.turn || 0) / 100);
  if(bucket <= 0) return;
  if(G._lastTrackedTurnBucket === bucket) return;
  G._lastTrackedTurnBucket = bucket;
  trackEvent('turn_milestone', analyticsBaseParams({
    turns_bucket: bucket * 100,
  }));
}

function trackDeathOnce(cause){
  if(!G || G._analyticsDeathTracked) return;
  G._analyticsDeathTracked = true;
  trackEvent('game_over', analyticsBaseParams({
    death_cause: cause || G.deathCause || 'unknown',
    crew_alive: (G.crew || []).filter(c=>c.hp>0).length,
    combats_fought: G.combatsFought || 0,
  }));
}

function trackRetirementOnce(){
  if(!G || G._analyticsRetiredTracked) return;
  G._analyticsRetiredTracked = true;
  const tier = RETIREMENT_TIERS.find(t=>G.credits>=t.min&&G.credits<=t.max) || RETIREMENT_TIERS[0];
  trackEvent('retired', analyticsBaseParams({
    retirement_tier: tier?.title || 'unknown',
    combats_fought: G.combatsFought || 0,
    survey_credits: G.surveyCareerCredits || 0,
    science_jobs_completed: G.scienceJob?.completed || 0,
  }));
}

function syncAnalyticsState(){
  if(!G) return;
  trackTurnMilestone();
  if(G.dead) trackDeathOnce();
  if(G.retired) trackRetirementOnce();
}

function trackPlanetDiscoveryOnce(pKey, flag, eventName, extra){
  const pdata = G?.planets?.[pKey];
  if(!pdata) return;
  const key = '_tracked_' + flag;
  if(pdata[key]) return;
  pdata[key] = true;
  trackEvent(eventName, analyticsBaseParams(extra));
}

