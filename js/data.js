// ────────────────────────────────────────────────────────────
// GRID CONSTANTS
// ────────────────────────────────────────────────────────────
const CELL = 60;
const COLS = 14;
const ROWS = 10;
const W = COLS * CELL;   // 840
const H = ROWS * CELL;   // 600

// ────────────────────────────────────────────────────────────
// TOWERS
// fireRate in ms, range in px, freeze/slow applied in game-seconds
// ────────────────────────────────────────────────────────────
const TOWER_DEF = {
  unit:        { name:'Unit Test',    cost:50,  hot:'1', color:'#22c55e', icon:'🧪', range:95,  fireRate:550,  dmg:{off_by_one:32,floating_point:10,race_condition:6,timezone:8,state_mutation:28,silent_failure:8,permission_esc:0,idempotency:10,memory_leak:10,boss:8,megaboss:5},     pColor:'#86efac', flakyRate:0.35 },
  cypress:     { name:'Cypress',      cost:200, hot:'2', color:'#69d3a7', icon:'🌲', range:110, fireRate:500,  dmg:{off_by_one:30,floating_point:26,race_condition:8,timezone:8,state_mutation:24,silent_failure:12,permission_esc:10,idempotency:15,memory_leak:14,boss:7,megaboss:5},    pColor:'#6ee7b7', flakyRate:0.55, retry:true },
  selenium:    { name:'Selenium',     cost:250, hot:'3', color:'#f97316', icon:'Se', range:130, fireRate:1200, dmg:{off_by_one:22,floating_point:35,race_condition:28,timezone:14,state_mutation:22,silent_failure:18,permission_esc:18,idempotency:20,memory_leak:20,boss:18,megaboss:15}, pColor:'#fdba74', flakyRate:0.9 },
  playwright:  { name:'Playwright',   cost:350, hot:'4', color:'#2dd4bf', icon:'🎭', range:145, fireRate:1700, dmg:{off_by_one:14,floating_point:18,race_condition:42,timezone:16,state_mutation:18,silent_failure:22,permission_esc:30,idempotency:25,memory_leak:26,boss:42,megaboss:35}, pColor:'#5eead4', flakyRate:0.85, multishot:2 },
  postman:     { name:'Postman',      cost:180, hot:'5', color:'#FF6C37', icon:'📮', range:115, fireRate:780,  dmg:{off_by_one:18,floating_point:45,race_condition:20,timezone:14,state_mutation:24,silent_failure:50,permission_esc:30,idempotency:25,memory_leak:35,boss:12,megaboss:10}, pColor:'#ffb899', flakyRate:0.5 },
  integration: { name:'Integration',  cost:150, hot:'6', color:'#3b82f6', icon:'🔗', range:125, fireRate:1400, dmg:{off_by_one:14,floating_point:38,race_condition:16,timezone:10,state_mutation:18,silent_failure:20,permission_esc:22,idempotency:15,memory_leak:22,boss:15,megaboss:12}, pColor:'#93c5fd', flakyRate:0.65 },
  db:          { name:'DB Test',      cost:280, hot:'7', color:'#a16207', icon:'🗄', range:110, fireRate:2200, dmg:{off_by_one:12,floating_point:18,race_condition:65,timezone:15,state_mutation:52,silent_failure:22,permission_esc:20,idempotency:45,memory_leak:28,boss:30,megaboss:25}, pColor:'#ca8a04', flakyRate:0.6 },
  e2e:         { name:'E2E Test',     cost:300, hot:'8', color:'#f59e0b', icon:'🔄', range:155, fireRate:2800, dmg:{off_by_one:8,floating_point:22,race_condition:55,timezone:12,state_mutation:12,silent_failure:15,permission_esc:45,idempotency:20,memory_leak:20,boss:35,megaboss:28},  pColor:'#fcd34d', flakyRate:1.1,  splash:65, slow:1.8 },
  docker:      { name:'Docker',       cost:450, hot:'9', color:'#0ea5e9', icon:'🐳', range:135, fireRate:3800, dmg:{off_by_one:18,floating_point:22,race_condition:30,timezone:18,state_mutation:28,silent_failure:20,permission_esc:65,idempotency:35,memory_leak:30,boss:55,megaboss:45}, pColor:'#7dd3fc', flakyRate:0.3,  freeze:2.0 },
  perf:        { name:'Perf Test',    cost:400, hot:'0', color:'#ec4899', icon:'⚡', range:170, fireRate:3500, dmg:{off_by_one:10,floating_point:15,race_condition:45,timezone:20,state_mutation:28,silent_failure:18,permission_esc:32,idempotency:30,memory_leak:40,boss:62,megaboss:55}, pColor:'#f9a8d4', flakyRate:0.4,  splash:80 },
  ai:          { name:'AI Assertion', cost:500, hot:'a', color:'#a855f7', icon:'🤖', range:185, fireRate:1800, dmg:{off_by_one:12,floating_point:14,race_condition:16,timezone:65,state_mutation:15,silent_failure:55,permission_esc:50,idempotency:50,memory_leak:45,boss:28,megaboss:22}, pColor:'#d8b4fe', flakyRate:0.18 }
};

const TARGET_MODES = ['FIRST', 'LAST', 'STRONG', 'WEAK'];

// ────────────────────────────────────────────────────────────
// BUGS
// ────────────────────────────────────────────────────────────
const BUG_DEF = {
  off_by_one:    { label:'+-1', color:'#ef4444', hp:65,   speed:125, reward:10,  size:9  },
  floating_point:{ label:'.1',  color:'#f97316', hp:105,  speed:88,  reward:18,  size:11 },
  race_condition:{ label:'||',  color:'#8b5cf6', hp:220,  speed:55,  reward:40,  size:16 },
  timezone:      { label:'TZ',  color:'#94a3b8', hp:90,   speed:100, reward:28,  size:10 },
  state_mutation:{ label:'MUT', color:'#dc2626', hp:75,   speed:112, reward:25,  size:10, splits:true },
  silent_failure:{ label:'?!',  color:'#16a34a', hp:130,  speed:95,  reward:32,  size:12 },
  permission_esc:{ label:'SU',  color:'#0f766e', hp:280,  speed:45,  reward:60,  size:14, immuneTo:['unit'] },
  idempotency:   { label:'2x',  color:'#7e22ce', hp:150,  speed:75,  reward:45,  size:13, duplicates:true },
  memory_leak:   { label:'ML',  color:'#eab308', hp:150,  speed:68,  reward:42,  size:12, regen:9 },
  boss:          { label:'',    color:'#ea580c', hp:650,  speed:30,  reward:150, size:24 },
  megaboss:      { label:'',    color:'#7c3aed', hp:2500, speed:15,  reward:500, size:38 }
};

// ────────────────────────────────────────────────────────────
// BETWEEN-WAVE EVENTS
// ────────────────────────────────────────────────────────────
const WAVE_EVENTS = [
  { name:'Tech Debt Sprint',  effect:()=>{ state.towers.forEach(t=>{ t.flakiness=Math.min(95,t.flakiness+18); }); }, msg:'EVENT: Tech Debt Sprint. All towers +18% flakiness.' },
  { name:'Good Sprint',       effect:()=>{ state.budget+=100; },                                                      msg:'EVENT: Good Sprint. +$100 budget injected.' },
  { name:'Pair Review',       effect:()=>{ state.towers.forEach(t=>{ t.flakiness=Math.max(0,t.flakiness-30); }); },  msg:'EVENT: Pair Review. All towers -30% flakiness.' },
  { name:'Scope Creep',       effect:()=>{ state.budget=Math.max(0,state.budget-80); },                               msg:'EVENT: Scope Creep. -$80 budget (sprint overrun).' },
  { name:'Automation Win',    effect:()=>{ state.score+=250; state.budget+=60; },                                     msg:'EVENT: Automation Win. +250 score, +$60 bonus.' },
  { name:'Infra Incident',    effect:()=>{ const t=state.towers[Math.floor(Math.random()*state.towers.length)]; if(t) t.flakiness=95; }, msg:'EVENT: Infra Incident. Random tower maxed flakiness.' },
];

// ────────────────────────────────────────────────────────────
// LEVELS
// ────────────────────────────────────────────────────────────
const LEVELS = [
  {
    id:0, name:'STARTUP', subtitle:'MVP in a garage. Fast iteration, tight budget.',
    difficulty:'EASY',
    rawPath:[[0,4],[4,4],[4,7],[8,7],[8,2],[12,2],[12,5],[14,5]],
    budget:500, lives:10, waveBonusBase:50, waveBonusPer:25, theme:'#22c55e',
    waves: [
      { bugs:['off_by_one','off_by_one','off_by_one','off_by_one','off_by_one','off_by_one','off_by_one','off_by_one'], ms:1200 },
      { bugs:['off_by_one','off_by_one','floating_point','off_by_one','off_by_one','floating_point','off_by_one','floating_point','off_by_one','off_by_one'], ms:1100 },
      { bugs:['off_by_one','floating_point','state_mutation','off_by_one','race_condition','state_mutation','off_by_one','floating_point','race_condition','off_by_one','state_mutation','floating_point'], ms:1000 },
      { bugs:['floating_point','race_condition','state_mutation','timezone','off_by_one','permission_esc','race_condition','timezone','state_mutation','off_by_one','race_condition','timezone','permission_esc','timezone'], ms:900 },
      { bugs:['race_condition','timezone','floating_point','permission_esc','timezone','state_mutation','race_condition','timezone','timezone','permission_esc','floating_point','race_condition','state_mutation','silent_failure','timezone','race_condition','boss'], ms:800 },
      { bugs:['timezone','state_mutation','race_condition','timezone','permission_esc','race_condition','state_mutation','timezone','race_condition','timezone','permission_esc','race_condition','state_mutation','race_condition','timezone','timezone','race_condition','state_mutation'], ms:700 },
      { bugs:Array.from({length:20},(_,i)=>['state_mutation','permission_esc','race_condition','timezone','timezone','state_mutation','silent_failure'][i%7]), ms:600 },
      { bugs:[...Array.from({length:22},(_,i)=>['race_condition','timezone','state_mutation','permission_esc','state_mutation','timezone','race_condition','timezone'][i%8]),'idempotency','idempotency','boss'], ms:480 }
    ]
  },
  {
    id:1, name:'COMPANY', subtitle:'Series B. 3 engineering teams. CI/CD half-configured.',
    difficulty:'MEDIUM',
    rawPath:[[0,7],[3,7],[3,3],[6,3],[6,8],[9,8],[9,1],[11,1],[11,5],[14,5]],
    budget:650, lives:8, waveBonusBase:70, waveBonusPer:30, theme:'#3b82f6',
    waves: [
      { bugs:['off_by_one','off_by_one','floating_point','off_by_one','off_by_one','floating_point'], ms:1200 },
      { bugs:['floating_point','off_by_one','state_mutation','off_by_one','floating_point','state_mutation','off_by_one','floating_point'], ms:1100 },
      { bugs:['state_mutation','race_condition','floating_point','state_mutation','off_by_one','race_condition','state_mutation','floating_point','race_condition'], ms:1000 },
      { bugs:['race_condition','floating_point','permission_esc','timezone','race_condition','state_mutation','permission_esc','race_condition','timezone'], ms:950 },
      { bugs:['timezone','race_condition','permission_esc','state_mutation','race_condition','timezone','permission_esc','state_mutation','race_condition','timezone','permission_esc'], ms:900 },
      { bugs:['permission_esc','race_condition','timezone','state_mutation','permission_esc','timezone','race_condition','state_mutation','permission_esc','race_condition','silent_failure','boss'], ms:850 },
      { bugs:['race_condition','timezone','state_mutation','permission_esc','race_condition','timezone','state_mutation','permission_esc','race_condition','timezone','state_mutation','permission_esc'], ms:800 },
      { bugs:['permission_esc','state_mutation','race_condition','timezone','permission_esc','race_condition','state_mutation','timezone','permission_esc','race_condition','state_mutation','silent_failure','boss'], ms:750 },
      { bugs:Array.from({length:16},(_,i)=>['permission_esc','race_condition','state_mutation','timezone','permission_esc','race_condition','silent_failure'][i%7]), ms:700 },
      { bugs:[...Array.from({length:17},(_,i)=>['race_condition','state_mutation','timezone','permission_esc','race_condition','state_mutation'][i%6]),'idempotency','boss'], ms:650 },
      { bugs:Array.from({length:20},(_,i)=>['state_mutation','permission_esc','race_condition','timezone','state_mutation','permission_esc','silent_failure'][i%7]), ms:580 },
      { bugs:[...Array.from({length:22},(_,i)=>['race_condition','timezone','state_mutation','permission_esc','state_mutation','timezone'][i%6]),'idempotency','idempotency','boss','boss'], ms:480 }
    ]
  },
  {
    id:2, name:'CORPORATION', subtitle:'Enterprise. 20 microservices. Compliance reviews. Tech debt everywhere.',
    difficulty:'HARD',
    rawPath:[[0,2],[3,2],[3,7],[6,7],[6,1],[9,1],[9,8],[12,8],[12,4],[14,4]],
    budget:800, lives:6, waveBonusBase:90, waveBonusPer:40, theme:'#a855f7',
    waves: [
      { bugs:['off_by_one','off_by_one','floating_point','off_by_one','floating_point','off_by_one','state_mutation'], ms:1100 },
      { bugs:['floating_point','state_mutation','off_by_one','floating_point','state_mutation','floating_point','off_by_one','state_mutation','floating_point'], ms:1000 },
      { bugs:['state_mutation','race_condition','floating_point','state_mutation','race_condition','state_mutation','floating_point','race_condition','state_mutation','race_condition'], ms:950 },
      { bugs:['race_condition','state_mutation','permission_esc','timezone','race_condition','state_mutation','permission_esc','race_condition','timezone','permission_esc','race_condition'], ms:900 },
      { bugs:['permission_esc','race_condition','timezone','state_mutation','permission_esc','timezone','race_condition','permission_esc','state_mutation','race_condition','timezone','permission_esc'], ms:850 },
      { bugs:['timezone','permission_esc','race_condition','state_mutation','boss','timezone','permission_esc','race_condition','state_mutation','timezone','permission_esc','race_condition'], ms:800 },
      { bugs:Array.from({length:14},(_,i)=>['permission_esc','race_condition','state_mutation','timezone','permission_esc','race_condition','silent_failure'][i%7]), ms:780 },
      { bugs:[...Array.from({length:14},(_,i)=>['permission_esc','race_condition','state_mutation','timezone'][i%4]),'idempotency','boss'], ms:750 },
      { bugs:Array.from({length:18},(_,i)=>['state_mutation','permission_esc','race_condition','timezone','state_mutation','permission_esc','silent_failure'][i%7]), ms:700 },
      { bugs:[...Array.from({length:15},(_,i)=>['permission_esc','race_condition','state_mutation','timezone','permission_esc'][i%5]),'idempotency','boss'], ms:670 },
      { bugs:Array.from({length:20},(_,i)=>['race_condition','state_mutation','permission_esc','timezone','race_condition','state_mutation','permission_esc','silent_failure'][i%8]), ms:640 },
      { bugs:[...Array.from({length:18},(_,i)=>['permission_esc','state_mutation','race_condition','timezone'][i%4]),'idempotency','idempotency','boss','boss'], ms:600 },
      { bugs:Array.from({length:22},(_,i)=>['permission_esc','race_condition','state_mutation','timezone','permission_esc','race_condition','state_mutation','silent_failure'][i%8]), ms:560 },
      { bugs:[...Array.from({length:19},(_,i)=>['permission_esc','state_mutation','race_condition','timezone','permission_esc'][i%5]),'idempotency','idempotency','boss','boss'], ms:520 },
      { bugs:Array.from({length:24},(_,i)=>['permission_esc','state_mutation','race_condition','timezone','permission_esc','race_condition','state_mutation','timezone','silent_failure'][i%9]), ms:480 },
      { bugs:[...Array.from({length:26},(_,i)=>['permission_esc','state_mutation','race_condition','timezone','permission_esc','race_condition'][i%6]),'idempotency','idempotency','idempotency','boss','boss','megaboss'], ms:420 }
    ]
  },
  {
    id:3, name:'HYPERSCALER', subtitle:'Planet-scale infra. On-call 24/7. One bad deploy from the front page.',
    difficulty:'EXTREME',
    rawPath:[[0,8],[2,8],[2,3],[4,3],[4,6],[7,6],[7,1],[10,1],[10,7],[12,7],[12,4],[14,4]],
    budget:900, lives:5, waveBonusBase:100, waveBonusPer:45, theme:'#ef4444',
    waves: Array.from({length:20},(_,i)=>{
      const pools=[
        ['off_by_one','off_by_one','floating_point'],
        ['off_by_one','floating_point','state_mutation'],
        ['floating_point','state_mutation','race_condition','timezone'],
        ['race_condition','timezone','permission_esc','state_mutation'],
        ['permission_esc','race_condition','memory_leak','timezone','state_mutation'],
        ['permission_esc','memory_leak','race_condition','silent_failure','timezone'],
        ['memory_leak','permission_esc','state_mutation','race_condition','silent_failure','timezone'],
      ];
      const pool = pools[Math.min(pools.length-1, Math.floor(i/2))];
      const bugs = Array.from({length:8+i},(_,k)=>pool[k%pool.length]);
      if (i>=5 && i%3===2) bugs.push('idempotency');
      if (i>=7 && i%4===3) bugs.push('boss');
      if (i===13 || i===16) bugs.push('boss');
      if (i===11) bugs.push('megaboss');
      if (i===19) bugs.push('idempotency','boss','boss','megaboss','megaboss');
      return { bugs, ms: Math.max(380, 1100 - i*38) };
    })
  }
];

// ────────────────────────────────────────────────────────────
// ENDLESS MODE: procedural waves after the scripted ones
// n is the 1-based endless wave index
// ────────────────────────────────────────────────────────────
function genEndlessWave(n) {
  const types = ['race_condition','timezone','state_mutation','permission_esc',
                 'silent_failure','idempotency','memory_leak','floating_point'];
  const count = Math.min(30, 12 + n * 2);
  const bugs = Array.from({length: count}, (_,i) => types[(i*5 + n*3) % types.length]);
  if (n % 3 === 0) bugs.push('boss');
  if (n % 5 === 0) bugs.push('megaboss');
  return {
    bugs,
    ms: Math.max(300, 560 - n * 12),
    hpScale: 1 + n * 0.16,
    rewardScale: 1 + n * 0.05
  };
}

// ────────────────────────────────────────────────────────────
// PATH HELPERS
// ────────────────────────────────────────────────────────────
function buildPathPx(rawPath) {
  const pts = rawPath.map(([c,r]) => ({ x: c*CELL + CELL/2, y: r*CELL + CELL/2 }));
  pts[0].x = 0;
  pts[pts.length-1].x = W + CELL*0.5;
  return pts;
}

function buildPathCells(rawPath) {
  const s = new Set();
  for (let i = 0; i < rawPath.length - 1; i++) {
    const [c1,r1] = rawPath[i];
    const [c2,r2] = rawPath[i+1];
    if (c1 === c2) {
      for (let r = Math.min(r1,r2); r <= Math.max(r1,r2); r++) s.add(`${c1},${r}`);
    } else {
      for (let c = Math.min(c1,c2); c <= Math.max(c1,c2); c++) s.add(`${c},${r1}`);
    }
  }
  return s;
}

function getAutoGates(pathPx) {
  const names  = ['BUILD','UNIT TEST','INTEGRATION','STAGING','RELEASE','DEPLOY'];
  const colors = ['#f97316','#eab308','#06b6d4','#3b82f6','#a855f7','#22c55e'];
  const interior = pathPx.length - 2;
  const count = Math.min(interior, 6);
  const gates = [];
  for (let i = 0; i < count; i++) {
    const iIdx = count > 1 ? Math.round((i / (count - 1)) * (interior - 1)) : 0;
    const ptIdx = iIdx + 1;
    const prev = pathPx[ptIdx - 1];
    const curr = pathPx[ptIdx];
    const incomingHoriz = Math.abs(curr.x - prev.x) > Math.abs(curr.y - prev.y);
    const horiz = !incomingHoriz;
    gates.push({ idx:ptIdx, color:colors[i], name:names[i], lx:horiz?-68:0, ly:horiz?0:-50, horiz });
  }
  return gates;
}

function hexRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
