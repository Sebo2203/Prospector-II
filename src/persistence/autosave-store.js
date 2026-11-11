// Autosave records are committed as a current/previous pair in one transaction.
// Keep browser I/O separate from the write queue so failure ordering is testable.
const AUTOSAVE_DB_NAME='prospector_autosaves';
const AUTOSAVE_DB_VERSION=1;
let autosaveDatabasePromise=null;
let autosaveBaseKnown=false,autosaveExpectedToken=null;

function autosaveRecordToken(record){return record?record.savedAt+':'+record.checksum:null;}

function autosaveChecksum(raw){
  let hash=0x811c9dc5;
  for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),0x01000193);
  return (hash>>>0).toString(16);
}

function makeAutosaveRecord(raw){
  const game=parseSaveSnapshot(raw);
  return {format:1,raw,checksum:autosaveChecksum(raw),savedAt:Date.now(),
    summary:{turn:game.turn,seed:game.seed,captain:game.crew.find(c=>c.role==='captain')?.name||'Captain'}};
}

function validAutosaveRecord(record){
  if(!record || record.format!==1 || typeof record.raw!=='string' || record.checksum!==autosaveChecksum(record.raw))return false;
  try{
    const game=parseSaveSnapshot(record.raw);
    return Number.isFinite(record.savedAt) && record.summary?.turn===game.turn && typeof record.summary.captain==='string';
  }catch(e){return false;}
}

function selectAutosaveRecord(current,previous){
  if(validAutosaveRecord(current))return {record:current,recovered:false};
  if(validAutosaveRecord(previous))return {record:previous,recovered:true};
  return null;
}

function openAutosaveDatabase(){
  if(autosaveDatabasePromise)return autosaveDatabasePromise;
  autosaveDatabasePromise=new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){reject(new Error('Browser save storage is unavailable.'));return;}
    let settled=false,request;
    const fail=error=>{if(!settled){settled=true;clearTimeout(timer);reject(error);}};
    const timer=setTimeout(()=>fail(new Error('Save storage did not respond. Close other game tabs and retry.')),5000);
    try{request=indexedDB.open(AUTOSAVE_DB_NAME,AUTOSAVE_DB_VERSION);}catch(e){fail(e);return;}
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('slots'))request.result.createObjectStore('slots');
    };
    request.onerror=()=>fail(request.error||new Error('Cannot open browser save storage.'));
    request.onblocked=()=>fail(new Error('Save storage is blocked by another game tab. Close it and retry.'));
    request.onsuccess=()=>{
      if(settled){request.result.close();return;}
      settled=true;clearTimeout(timer);const db=request.result;
      db.onversionchange=()=>{db.close();autosaveDatabasePromise=null;};
      resolve(db);
    };
  }).catch(error=>{autosaveDatabasePromise=null;throw error;});
  return autosaveDatabasePromise;
}

async function readAutosaveSlots(){
  const db=await openAutosaveDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('slots','readonly'),store=tx.objectStore('slots');
    const current=store.get('current'),previous=store.get('previous');
    tx.oncomplete=()=>resolve({current:current.result,previous:previous.result});
    tx.onabort=()=>reject(tx.error||new Error('Cannot read the autosave.'));
    tx.onerror=()=>{}; // The abort handler reports the transaction result.
  });
}

async function writeAutosaveRecord(record){
  const db=await openAutosaveDatabase();
  return new Promise((resolve,reject)=>{
    let tx;
    try{tx=db.transaction('slots','readwrite',{durability:'strict'});}
    catch(e){tx=db.transaction('slots','readwrite');}
    const store=tx.objectStore('slots'),current=store.get('current');
    let conflict=null;
    current.onsuccess=()=>{
      if(autosaveBaseKnown && autosaveRecordToken(current.result)!==autosaveExpectedToken){
        conflict=new Error('Another game window changed the autosave. Export this game or load the newer save.');
        conflict.name='AutosaveConflict';tx.abort();return;
      }
      // Never rotate a damaged current record over a usable recovery copy.
      if(validAutosaveRecord(current.result) && current.result.raw!==record.raw)store.put(current.result,'previous');
      store.put(record,'current');
    };
    tx.oncomplete=()=>{
      autosaveBaseKnown=true;autosaveExpectedToken=autosaveRecordToken(record);resolve();
    }; // A successful request alone is not a committed save.
    tx.onabort=()=>reject(conflict||tx.error||new Error('Autosave transaction was interrupted.'));
    tx.onerror=()=>{};
  });
}

function createAutosaveQueue(write,onStatus){
  let pending=null,running=false,lastRaw=null,lastResult=true,sequence=0;
  const waiters=[];
  async function drain(){
    running=true;
    while(pending){
      const next=pending;pending=null;
      try{
        onStatus('saving',next.record);
        if(next.record.raw!==lastRaw || !lastResult)await write(next.record);
        lastRaw=next.record.raw;lastResult=true;
        onStatus('saved',next.record);
      }catch(error){lastResult=false;onStatus('error',next.record,error);}
      for(let i=waiters.length-1;i>=0;i--)if(waiters[i].sequence<=next.sequence){
        waiters[i].resolve(lastResult);waiters.splice(i,1);
      }
    }
    running=false;
  }
  return {
    save(record){
      if(!running && !pending && lastResult && record.raw===lastRaw)return Promise.resolve(true);
      const next=++sequence;pending={record,sequence:next};
      const result=new Promise(resolve=>waiters.push({sequence:next,resolve}));
      if(!running)void drain();
      return result;
    },
    idle(){return running||pending?new Promise(resolve=>waiters.push({sequence,resolve})):Promise.resolve(lastResult);},
    get busy(){return running||!!pending;},
  };
}
