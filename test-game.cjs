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
   const available=draftOptions(key,rng);
   assert(available.length>0&&available.length<=3,'Invalid draft offer');
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
const allPlayers=Object.values(DB).flat();
state.roster=[['Steve Nash','2004–05'],['LeBron James','2008–09'],['Larry Bird','1984–85'],['David Robinson','1993–94'],['Wilt Chamberlain','1961–62']]
 .map(([name,year])=>allPlayers.find(p=>p.n===name&&p.yr===year));
assert(state.roster.every((p,i)=>p&&canPlayerPlay(p,POSITIONS[i])),'User fixture missing or illegal');
const c=scoreRoster();
assert(c.bonus===8&&c.raw>=86,'User lineup not recognized as elite');
for(let run=0;run<1000;run++)assert(simulateSeason(c,rng).w===82,'User lineup should dominate reliably');
assert(challengeWinChance({raw:80},{rating:40})>challengeWinChance({raw:80},{rating:74}),'Opponent strength ignored');
assert(challengeWinChance({raw:85},{rating:65})>challengeWinChance({raw:65},{rating:65}),'Roster strength ignored');
assert(challengeWinChance({raw:86},{rating:74})===1,'Elite team should reliably win');
state.roster=[null,null,null,null,null];
assert(getPlayableKeys().length===48,'Classic expansion pools missing');
assert(new Set(getPlayableKeys().map(franchiseForKey)).size===30,'Classic franchise missing');
const exposed=new Set();
for(let run=0;run<100;run++)for(const key of ALL_KEYS){
 const offer=draftOptions(key,rng);
 assert(offer.length>0&&offer.length<=3,'Offer size');
 assert(new Set(offer.map(p=>p.n)).size===offer.length,'Duplicate in offer');
 offer.forEach(p=>{assert(DB[key].includes(p)&&isPlayerAvailable(p),'Invalid offer');exposed.add(key+'|'+p.n);});
}
assert(exposed.size===215,'A player cannot appear in a draft offer');
// A seeded greedy drafter should face meaningful scarcity without losing access to elite teams.
let eliteDrafts=0,totalWins=0;
const realRandom=Math.random;Math.random=rng;
try {
 for(let run=0;run<2000;run++){
  state.roster=[null,null,null,null,null];
  for(let pick=0;pick<5;pick++){
   const offers=draftOptions(getRandomPlayableKey(),rng);
   let best=null;
   for(const p of offers)for(const pos of getOpenPositions(p)){
    const before=state.roster,next=buildLineupWith(p,POSITIONS.indexOf(pos));
    state.roster=next;const strength=scoreRoster().raw;state.roster=before;
    if(!best||strength>best.strength)best={next,strength};
   }
   assert(best,'Classic draft dead end');state.roster=best.next;
  }
  assert(state.roster.every((p,i)=>canPlayerPlay(p,POSITIONS[i])),'Classic illegal position');
  assert(new Set(state.roster.map(p=>p.n)).size===5,'Classic duplicate name');
  const scores=scoreRoster();eliteDrafts+=scores.raw>=86;totalWins+=simulateSeason(scores,rng).w;
 }
} finally {Math.random=realRandom;}
assert(eliteDrafts>20&&eliteDrafts<400,'Elite drafts should be possible but scarce');
assert(totalWins/2000<81,'Ordinary drafts win too easily');
results.push({era:'Classic',strongLineupAverageWins:82,strongLineupPerfectSeasons:'1000/1000',eliteDrafts:eliteDrafts+'/2000'});
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
state.mode='classic';state.roster=[null,null,null,null,null];
state.currentKey=ALL_KEYS.find(k=>k.startsWith('2020s_Jazz'));
assert(getSkipKeys('era').some(k=>k.startsWith('1990s_Jazz')),'Historical aliases break era skip');
assert(getSkipKeys('team').every(k=>parseKey(k).era==='2020s'&&franchiseForKey(k)!=='Jazz'),'Team skip changed era or repeated franchise');
state.mode='era';
const passer={s:60,d:60,r:30,p:99};
state.draftEra='1960s';const oldFit=playerEraFit(passer),oldTargets=rosterCoverage([]);
state.draftEra='1980s';
assert(playerEraFit(passer)>oldFit+10,'Era does not reward different strengths');
assert(JSON.stringify(rosterCoverage([]))!==JSON.stringify(oldTargets),'Era targets unchanged');
return results;

`;
console.table(new Function('document', script + '\n' + tests)({addEventListener(){}}));
