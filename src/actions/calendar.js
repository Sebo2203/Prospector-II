// Reporting only: none of these values drive turn-based gameplay or deadlines.
const CAREER_TIME_LOCATIONS=['space','planets','stations','interiors'];
const CAREER_TIME_ACTIVITIES=['travel','exploration','waiting','combat','repair','scan','leisure','services','docking'];
function newCareerTime(){
  return {minutes:0,locations:Object.fromEntries(CAREER_TIME_LOCATIONS.map(key=>[key,0])),
    activities:Object.fromEntries(CAREER_TIME_ACTIVITIES.map(key=>[key,0]))};
}
function careerTimeLocation(){
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  if(mode==='base' || mode==='casino' || (mode==='planet' && G.planets[G.curPlanet]?.isCasino))return 'stations';
  if(mode==='planet'){
    const map=G.planets[G.curPlanet];
    return map?.isDerelict || map?.isAncientStation || map?.isQuarantine?'interiors':'planets';
  }
  return 'space';
}
function recordCareerTime(activity,minutes,location=careerTimeLocation()){
  if(!Number.isSafeInteger(minutes) || minutes<0 || !CAREER_TIME_LOCATIONS.includes(location) || !CAREER_TIME_ACTIVITIES.includes(activity))throw Error('Invalid career time');
  G.careerTime??=newCareerTime();
  G.careerTime.minutes+=minutes;G.careerTime.locations[location]+=minutes;G.careerTime.activities[activity]+=minutes;
}
function recordCareerActionTime(activity){
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  const location=careerTimeLocation();
  activity??=mode==='shipcombat'?'combat':mode==='casino'?'leisure':mode==='planet'?'exploration':'travel';
  const minutes=activity==='repair'?15:activity==='combat'?1:activity==='leisure'?30:
    location==='planets'||location==='interiors'||location==='stations'?5:mode==='shipcombat'?1:mode==='galaxy'?60:10;
  recordCareerTime(activity,minutes,location);
}
function formatCareerDuration(minutes){
  const months=Math.floor(minutes/43200);minutes%=43200;
  const days=Math.floor(minutes/1440);minutes%=1440;
  const hours=Math.floor(minutes/60),mins=minutes%60;
  return [months?months+'mo':'',days?days+'d':'',hours?hours+'h':'',mins?mins+'m':''].filter(Boolean).join(' ')||'0m';
}
function careerClockText(){
  const minutes=G.careerTime?.minutes||0,day=Math.floor(minutes/1440)+1;
  return 'D'+day+' '+String(Math.floor(minutes%1440/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
function planetLocalTimeText(key){
  const map=G.planets[key],biome=BIOMES[map?.biome]||{};
  if(!map || map.isCasino || map.isDerelict || map.isAncientStation || map.isQuarantine || map.isCave)return '';
  if(map.isRoguePlanet || biome.tidalLock==='night')return 'Permanent night';
  if(biome.tidalLock==='day')return 'Permanent day';
  const cycle=(biome.dayLength||20)*4;
  const minutes=Math.floor((((map.planetTurn||0)%cycle)/cycle*1440+360)%1440);
  return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
}
function drawCareerTimeSummary(cx,y,width){
  const time=G.careerTime||newCareerTime(),at=time.locations;
  ctx.textAlign='center';ctx.font='12px Courier New';ctx.fillStyle='#8aaabb';
  ctx.fillText('Elapsed: '+formatCareerDuration(time.minutes),cx,y,width);
  ctx.fillText('Space '+formatCareerDuration(at.space)+' · Planets '+formatCareerDuration(at.planets),cx,y+16,width);
  ctx.fillText('Stations '+formatCareerDuration(at.stations)+' · Interiors '+formatCareerDuration(at.interiors),cx,y+32,width);
}
