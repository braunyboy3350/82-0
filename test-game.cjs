const fs = require('node:fs');
const script = fs.readFileSync(__dirname + '/index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const tests = `

function assert(ok,message){if(!ok)throw Error(message);}
let seed=123456789;
function rng(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
const results=[];
for(const era of Object.keys(ERA_STYLES)){
 state.mode='era';state.draftEra=era;state.roster=[null,null,null,null,null];
 assert(getPlayableKeys().length===48,'Every pool must be available in '+era);
 assert(new Set(getPlayableKeys().map(franchiseForKey)).size===30,'Missing franchise');
 const pool=ALL_KEYS.flatMap(k=>DB[k]);
 const top=POSITIONS.map(pos=>pool.filter(p=>canPlayerPlay(p,pos)).sort((a,b)=>
  (b.s*.28+b.d*.27+b.r*.22+b.p*.23)*.6+playerEraFit(b)*.4 -
  ((a.s*.28+a.d*.27+a.r*.22+a.p*.23)*.6+playerEraFit(a)*.4)).slice(0,7));
 let best=null,worst=null,legal=0;
 function visit(roster){
   if(roster.length===5){
     state.roster=roster;const score=scoreRoster();legal++;
     if(!best||score.raw>best.score.raw)best={score,roster:roster.slice()};
     if(!worst||score.raw<worst.score.raw)worst={score,roster:roster.slice()};
     return;
   }
   for(const p of top[roster.length])if(canPlayerPlay(p,POSITIONS[roster.length])&&!roster.some(q=>q.n===p.n))visit([...roster,p]);
 }
 visit([]);
 assert(best,'No legal lineup for '+era);
 const weak=POSITIONS.map(pos=>pool.filter(p=>canPlayerPlay(p,pos)).sort((a,b)=>playerEraFit(a)-playerEraFit(b))[0]);
 state.roster=weak;
 assert(best.score.raw>scoreRoster().raw+15,'No meaningful skill gap');
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
 assert(perfect===1000,'An elite lineup should reliably go 82–0 in '+era);
 // Mixed-era random drafts must finish with five distinct names in legal positions.
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
  assert(state.roster.every((p,i)=>canPlayerPlay(p,POSITIONS[i])),'Illegal position');
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
assert(ALL_KEYS.length===48,'Pool count');
assert(Object.values(DB).flat().length===215,'Player-season count');
for(const player of Object.values(DB).flat()){
 assert(['s','d','r','p'].every(k=>Number.isFinite(player[k])&&player[k]>=0&&player[k]<=100),'Invalid ratings: '+player.n);
 assert(['ppg','rpg','apg'].every(k=>Number.isFinite(player[k])&&player[k]>=0),'Invalid stats: '+player.n);
 assert(getPlayerPositions(player).every(pos=>POSITIONS.includes(pos)),'Invalid position: '+player.n);
}
state.mode='era';state.roster=[null,null,null,null,null];
state.currentKey=ALL_KEYS.find(k=>franchiseForKey(k)==='Lakers');
assert(getSkipKeys('team').every(k=>franchiseForKey(k)!=='Lakers'),'Skip repeats franchise');
const passer={s:60,d:60,r:30,p:99};
state.draftEra='1960s';const oldFit=playerEraFit(passer),oldTargets=rosterCoverage([]);
state.draftEra='1980s';
assert(playerEraFit(passer)>oldFit+10,'Era does not reward different strengths');
assert(JSON.stringify(rosterCoverage([]))!==JSON.stringify(oldTargets),'Era targets unchanged');
return results;

`;
console.table(new Function('document', script + '\n' + tests)({addEventListener(){}}));
