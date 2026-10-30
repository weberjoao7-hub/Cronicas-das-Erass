'use strict';
// v6.112 — enemy archers: save compatibility, ranged AI, combat and rendering.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline game script exists');
function between(a,b){
 const start=script.indexOf(a),end=script.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'missing anchors: '+a);
 return script.slice(start,end);
}
function makeSpawn(game){
 return new Function('game','passable',between('function spawnEnemyGuard(){','function enemyTurn(dt){')+
  ';return spawnEnemyGuard;')(game,()=>true);
}
function makeEnemyTurn(game,hasSight,approach){
 return new Function('game','assignRoute','passable','approachHostile','hasRangedSight','dirty',
  between('function enemyTurn(dt){','const isMilitary=')+';return enemyTurn;')(
   game,()=>true,()=>true,approach,hasSight,false);
}
function makeCombat(game,shots,hasSight){
 return new Function('game','towerShots','refresh','toast','menu','panel','document','key',
  'visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty','hasRangedSight',
  between('function combatTurn(){','const key=(x,y)')+';return combatTurn;')(
   game,shots,()=>{},()=>{},()=>{},{},{getElementById:()=>({})},
   (x,y)=>x+','+y,()=>true,()=>true,()=>4.6,()=>11,0,false,hasSight);
}
test('inline game JavaScript parses and keeps the existing save key',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('new fort garrison contains one archer and otherwise melee guards',()=>{
 const game={enemy:{x:91,y:86,hp:100},enemyUnits:[]},spawn=makeSpawn(game);
 for(let i=0;i<4;i++)assert.equal(spawn(),true);
 assert.deepEqual(game.enemyUnits.map(e=>e.kind),['warrior','archer','warrior','warrior']);
 assert.equal(game.enemyUnits[1].hp,50);
 assert.equal(game.enemyUnits[0].hp,65);
 assert.equal(spawn(),false,'garrison cap remains four');
});
test('older saves without enemy kind spawn an archer without replacing saved units',()=>{
 const legacy=[{x:90.5,y:85.5,hp:65},{x:89.5,y:86.5,hp:65}];
 const game={enemy:{x:91,y:86,hp:100},enemyUnits:legacy.slice()};
 assert.equal(makeSpawn(game)(),true);
 assert.equal(game.enemyUnits[0],legacy[0]);
 assert.equal(game.enemyUnits[1],legacy[1]);
 assert.equal(game.enemyUnits[2].kind,'archer');
});
test('enemy archers hold a clear firing lane and reposition when blocked',()=>{
 const game={enemy:{hp:100},enemyUnits:[{kind:'archer',x:84.5,y:80.5,
  homeX:84.5,homeY:80.5,repath:0,path:[]}],units:[{kind:'worker',x:81.5,y:80.5,hp:100}]};
 let reroutes=0;
 makeEnemyTurn(game,()=>true,()=>{reroutes++;return true})(.1);
 assert.equal(reroutes,0,'archer stops at range instead of charging');
 game.enemyUnits[0].repath=0;
 makeEnemyTurn(game,()=>false,()=>{reroutes++;return true})(.1);
 assert.equal(reroutes,1,'blocked firing lane triggers a new position');
});
test('rival arrow deals seven damage and cannot pass through mountains',()=>{
 const unit={kind:'warrior',x:81.5,y:80.5,hp:100,path:[]};
 const game={enemy:{x:120,y:120,hp:100},
  enemyUnits:[{x:84.5,y:80.5,hp:50,kind:'archer'}],buildings:[],units:[unit],claim:[]};
 const shots=[];
 makeCombat(game,shots,()=>false)();
 assert.equal(unit.hp,100);
 assert.equal(shots.length,0);
 makeCombat(game,shots,()=>true)();
 assert.equal(unit.hp,93);
 assert.equal(shots.length,1);
 assert.equal(shots[0].kind,'archer');
});
test('legacy enemy melee guard keeps its close-range damage',()=>{
 const unit={kind:'worker',x:81.5,y:80.5,hp:100,path:[]};
 const game={enemy:{x:120,y:120,hp:100},
  enemyUnits:[{x:81.8,y:80.5,hp:65}],buildings:[],units:[unit],claim:[]};
 const shots=[];
 makeCombat(game,shots,()=>false)();
 assert.equal(unit.hp,89);
 assert.equal(shots.length,0);
});
test('enemy archer uses archer atlas frames and keeps rival colors',()=>{
 const dispatcher=between('function drawUnitSprite(','const harvesting=')+'return false;}';
 const calls=[];
 const draw=new Function('drawPaintedTroop','paintedTroops','Date',
  dispatcher+';return drawUnitSprite;')((...args)=>{calls.push(args);return true},
  {complete:true,naturalWidth:256,naturalHeight:896},{now:()=>10000});
 draw({kind:'archer',x:80.5,y:80.5,path:[]},200,220,1.2,true);
 assert.equal(calls.length,1);
 assert.equal(calls[0][4],true,'uses archer animation frames');
 assert.equal(calls[0][9],true,'rival faction overlay is retained');
 assert.match(script,/e\.kind==='archer'\?'#d9a4ec'/);
 assert.match(script,/u\.kind==='archer'\?50:65/);
});
