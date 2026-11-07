const assert=require('node:assert/strict');
const {chromium,gameUrl,artifactPath}=require('./runtime.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Comms QA','Comms QA'));
  await page.waitForFunction(()=>G?.galaxy && G.log.some(e=>e.msg.includes('Ready for departure')));
  await page.evaluate(()=>{
   G.log=[];for(let i=0;i<240;i++)addLog('Comms entry '+i+' — '+('A long transmission with details. '.repeat(i%3+1)),'li');
   archiveLog('ARCHIVE ONLY','li');renderAll();
  });
  const log=page.locator('#log-list');
  assert.equal(await log.locator('.log-entry').count(),80,'initial window is bounded for large careers');
  assert.ok(!(await log.textContent()).includes('ARCHIVE ONLY'));
  for(const style of ['cockpit','classic']){
   await page.evaluate(style=>{OPTIONS.uiStyle=style;applyUIStyle();renderAll();},style);
   for(const viewport of [{width:1400,height:720},{width:1000,height:620}]){
    await page.setViewportSize(viewport);
    const layout=await log.evaluate(el=>{
     const side=el.parentElement,b=side.getBoundingClientRect(),r=el.getBoundingClientRect(),s=getComputedStyle(side),z=b.height/side.offsetHeight;
     const newest=el.firstElementChild.getBoundingClientRect();
     return {bottomGap:(b.bottom-r.bottom)/z,expected:parseFloat(s.paddingBottom)+parseFloat(s.borderBottomWidth),height:r.height/z,scroll:el.scrollHeight>el.clientHeight,
       row:parseFloat(getComputedStyle(el.firstElementChild).flexShrink),newestBottom:newest.bottom<=r.bottom+1};
    });
    assert.ok(Math.abs(layout.bottomGap-layout.expected)<2,'log fills remaining sidebar height');
    assert.ok(layout.height>400 && layout.scroll && layout.row===0 && layout.newestBottom,'long rows retain natural size inside a scrollable full-height log');
    await page.screenshot({path:artifactPath('Comms-log-'+style+'-'+viewport.width+'.png')});
   }
  }
  // Read older messages without losing the reading position on normal/new renders.
  await log.evaluate(el=>{el.scrollTop=-200;});await page.waitForTimeout(50);
  const anchor=await log.evaluate(el=>{
   const b=el.getBoundingClientRect(),row=[...el.children].find(c=>{const r=c.getBoundingClientRect();return r.top>=b.top && r.bottom<=b.bottom;});
   window.commsAnchor=row.textContent;return {text:row.textContent,y:row.getBoundingClientRect().top};
  });
  await page.evaluate(()=>{renderAll();addLog('New incoming transmission while reading history','lg');renderAll();});
  const after=await log.evaluate((el,text)=>[...el.children].find(row=>row.textContent===text).getBoundingClientRect().top,anchor.text);
  assert.ok(Math.abs(after-anchor.y)<2,'new messages preserve the reader anchor');
  // Actual scroll events load older pages, including the first saved message.
  for(let i=0;i<5;i++){await log.evaluate(el=>{el.scrollTop=-el.scrollHeight;});await page.waitForTimeout(80);}
  assert.equal(await log.locator('.log-entry').count(),241);
  assert.ok((await log.textContent()).includes('Comms entry 0 —'));
  await log.evaluate(el=>{el.scrollTop=0;});await page.waitForTimeout(30);
  await page.evaluate(()=>{addLog('Newest pinned transmission','lg');renderAll();});
  assert.ok(await log.evaluate(el=>Math.abs(el.scrollTop)<1 && el.firstElementChild.textContent==='Newest pinned transmission'));
  const turn=await page.evaluate(()=>G.turn);await page.getByRole('button',{name:'Increase log text size'}).click();
  assert.equal(await page.evaluate(()=>G.turn),turn);
  // Fresh career restores the bounded window and has no previous career messages.
  await page.evaluate(()=>initGame('LIGHT_SCOUT','Fresh Comms','Fresh Comms'));
  await page.waitForFunction(()=>G?.shipName==='Fresh Comms' && G.log.some(e=>e.msg.includes('Ready for departure')));
  assert.ok(!(await log.textContent()).includes('Comms entry 0'));
  assert.deepEqual(errors,[]);console.log('PASS: full-height comms, uncompressed wrapped rows, both themes/scales, paged oldest history, reading anchor, newest pinning and career reset.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
