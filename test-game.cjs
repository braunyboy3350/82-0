const fs = require('node:fs');
const script = fs.readFileSync(__dirname + '/index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const tests = `
function assert(ok,message){if(!ok)throw Error(message);}
let seed=123456789;
function rng(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
const results=[];
for(const era of Object.keys(ERA_STYLES)){
 state.mode='era';state.draftEra=era;state.roster=[null,null,null,null,null];
 assert(getPlayableKeys().every(k=>parseKey(k).era===era),'Era lock failed');
 const pool=ALL_KEYS.filter(k=>parseKey(k).era===era).flatMap(k=>DB[k]);
 let best=null,worst=null,legal=0;
 function visit(roster){
   if(roster.length===5){
     state.roster=roster;const score=scoreRoster();legal++;
     if(!best||score.raw>best.score.raw)best={score,roster:roster.slice()};
     if(!worst||score.raw<worst.score.raw)worst={score,roster:roster.slice()};
     return;
   }
   for(const p of pool)if(canPlayerPlay(p,POSITIONS[roster.length])&&!roster.some(q=>q.n===p.n))visit([...roster,p]);
 }
 visit([]);
 assert(best,'No legal lineup for '+era);
 assert(best.score.raw>worst.score.raw+10,'No meaningful skill gap');
 state.roster=best.roster;
 let perfect=0,wins=0;
 for(let i=0;i<1000;i++){
  const season=simulateSeason(best.score,rng);
  assert(season.games.length===82,'Season length');
  assert(season.games.some(g=>g.opp==='2024–25 Utah Jazz'),'Missing Jazz');
  assert(season.games.some(g=>g.opp==='2011–12 New Orleans Hornets'),'Missing Hornets');
  assert(season.games.every(g=>g.chance>=0&&g.chance<=1),'Invalid win probability');
  perfect+=Number(season.w===82);wins+=season.w;
 }
 assert(perfect>=50,'82–0 too rare for strongest '+era+' lineup');
 // Random legal draft paths must all finish and remain in their era.
 for(let run=0;run<200;run++){
  state.roster=[null,null,null,null,null];
  for(let pick=0;pick<5;pick++){
   const keys=getPlayableKeys();
   assert(keys.length,'Dead-end draft in '+era);
   const key=keys[Math.floor(rng()*keys.length)];
   const available=DB[key].filter(isPlayerAvailable);
   const p=available[Math.floor(rng()*available.length)];
   const positions=getOpenPositions(p);
   const target=POSITIONS.indexOf(positions[Math.floor(rng()*positions.length)]);
   state.roster=buildLineupWith(p,target);
   assert(state.roster,'Invalid placement');
  }
  assert(state.roster.every(Boolean),'Incomplete draft');
  assert(new Set(state.roster.map(p=>p.n)).size===5,'Duplicate player');
 }
 results.push({era,legalLineups:legal,strongLineupAverageWins:wins/1000,strongLineupPerfectSeasons:perfect+'/1000'});
}
state.mode='classic';state.draftEra=null;
state.roster=ALL_KEYS.slice(0,5).map(k=>DB[k][0]);
const c=scoreRoster();
const original=c.scr*.28+c.def*.27+c.reb*.22+c.ply*.23;
assert(Math.abs(c.raw-original)<1e-9,'Classic rating changed');
assert(simulateSeason(c,rng).games.every(g=>Math.abs(g.chance-(original/100*.88+.06))<1e-9),'Classic odds changed');
assert(challengeWinChance({raw:80},{rating:40})>challengeWinChance({raw:80},{rating:74}),'Opponent strength ignored');
assert(challengeWinChance({raw:85},{rating:65})>challengeWinChance({raw:65},{rating:65}),'Roster strength ignored');
assert(challengeWinChance({raw:86},{rating:74})===1,'Elite team should reliably win');
assert(getPlayableKeys().every(k=>!CHALLENGE_KEYS.includes(k)),'Classic pool changed');
return results;
`;
console.table(new Function('document', script + tests)({ addEventListener() {} }));
console.log('All checks passed: 7,000 seasons, 1,400 draft paths, Classic compatibility.');
