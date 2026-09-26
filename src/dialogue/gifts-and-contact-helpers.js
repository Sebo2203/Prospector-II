const CREW_ENCOURAGE_COOLDOWN = 40;

function crewEncourageCooldown(c){
  if(!c) return 0;
  return Math.max(0, (c.nextEncourageTurn || 0) - (G.turn || 1));
}

function canEncourageDialogueCrew(){
  const c = dialogueCrew();
  return !!c && crewEncourageCooldown(c) <= 0;
}

function markCrewEncouragementAttempt(){
  const c = dialogueCrew();
  if(c) c.nextEncourageTurn = (G.turn || 1) + CREW_ENCOURAGE_COOLDOWN;
}

function alienGiftCandidates(){
  const results = [];
  // Commodities from cargo
  (G.cargo || []).forEach((item, idx) => {
    if(item && item.isCommodity) results.push({ item, idx, source:'cargo' });
  });
  // All non-quest inventory items — the reaction layer decides whether a civ values it.
  // We exclude only sealed lab containers (Biodata/Mineral Sample) that have no
  // legible cultural form, and quest items that must not be consumed.
  const neverGift = new Set(['Biodata Sample','Rock Sample','Research Ship Data']);
  // Also exclude a civilization report from being offered back to the civ it describes.
  const activeCiv = dialogueCivilization?.()?.civ;
  if(activeCiv?.species) neverGift.add(activeCiv.species+' Civilization Report');
  (G.inventory || []).forEach((item, idx) => {
    if(!item || item.questItem) return;
    if(neverGift.has(item.name)) return;
    results.push({ item, idx, source:'inventory' });
  });
  // Sort: items with recognised cultural meaning first, then by value
  return results.sort((a,b) => {
    const ga = civClassifyGift(a.item), gb = civClassifyGift(b.item);
    const ma = ga.hasKnownMeaning ? 1 : 0, mb = gb.hasKnownMeaning ? 1 : 0;
    if(mb !== ma) return mb - ma;
    return (b.item.value||0) - (a.item.value||0);
  });
}

function canOfferAlienGift(){
  return alienGiftCandidates().length > 0;
}

function offerAlienGift(ctx, giftIdx){
  const gift = alienGiftCandidates().find(entry=>entry.idx === giftIdx);
  const e = dialogueAlien();
  if(!gift || !e) return;
  if(gift.source === 'cargo'){ const ci = G.cargo.indexOf(gift.item); if(ci !== -1) G.cargo.splice(ci,1); }
  else G.inventory.splice(gift.idx, 1);
  ctx.offeredItemName = gift.item.name || 'the object';
  e.relation = Math.min(10, (e.relation || 0) + 1);
  e.attitude = e.relation >= 4 ? 'Receptive' : 'Neutral';
  e.intent = 'Evaluating the offered object';
  e.currentlyHostile = false;
  e.hostileByDefault = false;
  e.pacifiedByComm = true;
  e.commBoundaryDist = 2;
  addLog('You offer '+ctx.offeredItemName+' to '+e.name+'.','li');
}

function isLocalContact(){
  return !!(G?.dialogue?.context?.isLocal);
}

function civilizationContactKind(){
  return G?.dialogue?.context?.contactKind || (isLocalContact() ? 'local' : 'settlement');
}

function isDelegationContact(){
  return civilizationContactKind() === 'delegation';
}

function isSettlementContact(){
  return civilizationContactKind() === 'settlement';
}

function civilizationAudienceNoun(){
  if(isLocalContact()) return 'local';
  if(isDelegationContact()) return 'delegation';
  return 'settlement';
}

function civilizationAttackLabel(){
  const suffix = civilizationCrewHasGroundWeapons() ? '' : ' with bare fists';
  if(isDelegationContact()) return 'Attack delegation'+suffix;
  return (isLocalContact() ? 'Attack local' : 'Attack settlement')+suffix;
}

function civilizationCrewHasGroundWeapons(){
  return (G?.crew||[]).some(c=>c.hp>0 && c.weapon && c.weapon !== 'Bare hands');
}

function civilizationThreatLabel(armedLabel, bareLabel){
  return civilizationCrewHasGroundWeapons() ? armedLabel : bareLabel;
}

function civilizationObserveLabel(){
  if(isLocalContact()) return 'Read their body language';
  if(isDelegationContact()) return 'Observe the delegation';
  return 'Observe the settlement';
}

function dialogueAllowsEscape(){
  if(!G?.dialogue?.context?.noEscape) return true;
  const wrap = dialogueCivilization();
  return !!(G.dialogue.context.resolved || wrap?.state?.contacted || wrap?.state?.hostile);
}

function civilizationCloseLabel(){
  if(isDelegationContact()) return dialogueAllowsEscape() ? 'Withdraw from delegation' : 'Resolve the delegation first';
  if(isLocalContact()) return 'Back away';
  return 'End contact';
}

function dialogueCivilization(){
  const dlg = G?.dialogue;
  if(!dlg || dlg.id !== 'civilization_contact') return null;
  const pdata = G.planets?.[dlg.context?.planetKey];
  if(!pdata?.civilization) return null;
  const state = ensureCivilizationState(pdata);
  return { pdata, civ:pdata.civilization, state };
}

