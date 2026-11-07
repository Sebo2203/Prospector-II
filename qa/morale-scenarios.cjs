const assert = require('node:assert/strict');
const { chromium, gameUrl, artifactPath } = require('./runtime.cjs');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1000,height:620},deviceScaleFactor:1.25});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(gameUrl);
    await page.evaluate(()=>initGame('LIGHT_SCOUT','Morale Audit','Morale Audit'));
    await page.waitForFunction(()=>G?.galaxy && G.log.some(entry=>entry.msg.includes('Ready for departure')));
    await page.evaluate(()=>{
      G.crew.forEach(crew=>{crew.skills.soc=0;});
      G._viewCrewSel=1;
      startCrewDialogue('morale');
      Math.random=()=>0;
    });
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [G.dialogue.node,crew.moraleBase,crewMoraleScore(crew),crewEncourageCooldown(crew),crewEncouragementBonus(crew)];
    }),['encourage_fail',55,55,40,0]);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>startCrewDialogue('morale'));
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>G.dialogue.node),'morale','reopening the conversation cannot bypass the cooldown');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      for(let i=0;i<40;i++) doWaitGalaxy();
      startCrewDialogue('morale');
      Math.random=()=>0.99;
    });
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [G.dialogue.node,crew.moraleBase,crewMoraleScore(crew),crewEncourageCooldown(crew),crewEncouragementBonus(crew)];
    }),['encourage_success',55,58,40,3]);
    await page.screenshot({path:artifactPath('Crew-encouragement.png')});
    assert.ok(await page.evaluate(()=>autoSave()));
    assert.ok(await page.evaluate(()=>loadFromStorage()));
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [crew.moraleBase,crewMoraleScore(crew),crew.encouragedUntil-G.turn];
    }),[55,58,30],'loading the result restores the remaining boost without awarding it again');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{
      for(let i=0;i<29;i++){
        beginCareerTurn();
        finishCareerTurn();
      }
      startCrewDialogue('morale');
    });
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [crewMoraleScore(crew),crewMoraleBreakdown(crew).find(row=>row.label==='Encouragement')?.value];
    }),[58,'+3 (1t)']);
    await page.evaluate(()=>{
      beginCareerTurn();
      finishCareerTurn();
    });
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [crew.moraleBase,crewMoraleScore(crew),crewEncourageCooldown(crew),
        crewMoraleBreakdown(crew).some(row=>row.label==='Encouragement')];
    }),[55,55,10,false],'the boost expires at 30 turns while the cooldown still prevents stacking');
    await page.evaluate(()=>{
      for(let i=0;i<10;i++){beginCareerTurn();finishCareerTurn();}
      G.dialogue.context.crew.moraleBase=0;
      Math.random=()=>0.99;
    });
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>[dialogueCrew().moraleBase,crewMoraleScore(dialogueCrew())]),[0,3]);
    await page.keyboard.press('Enter');
    await page.evaluate(()=>enterDialogueNode('morale'));
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>G.dialogue.node),'morale');
    await page.evaluate(()=>{
      for(let i=0;i<40;i++){beginCareerTurn();finishCareerTurn();}
      G.lastStarbaseTurn=G.turn;
    });
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(()=>{
      const crew=dialogueCrew();
      return [G.dialogue.node,crew.moraleBase,crewMoraleScore(crew),crew.encouragedUntil-G.turn,crewEncourageCooldown(crew)];
    }),['encourage_success',0,3,30,40],'another eligible success works within the same conversation');
    assert.deepEqual(errors,[]);
    console.log('PASS: encouragement success and failure, cooldown, save/load, expiry, breakdown, and zero base morale.');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
