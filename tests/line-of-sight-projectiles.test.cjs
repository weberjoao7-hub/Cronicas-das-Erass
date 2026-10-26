'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script is present');
function between(start,end){
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'missing source anchors: '+start);
 return script.slice(a,b);
}
const losCode=between('function hasRangedSight(','// Arqueiros param');
function sight(terrain){
 return new Function('W','H','biome',losCode+';return hasRangedSight;')(160,160,terrain);
}
test('JavaScript syntax remains valid',()=>assert.doesNotThrow(()=>new Function(script)));
test('mountains block arrows, open ground does not',()=>{
 const los=sight((x,y)=>x===82&&y===80?5:2);
 assert.equal(los(80.5,80.5,84.5,80.5),false);
 assert.equal(los(80.5,81.5,84.5,81.5),true);
 assert.equal(los(NaN,80.5,84.5,80.5),false);
 assert.equal(los(80.5,80.5,80.5,80.5),true);
});
test('archer searches for a clear firing lane instead of shooting through a mountain',()=>{
 const los=sight((x,y)=>x===82&&y===80?5:2);
 const approach=new Function('attackRange','passable','assignRoute','hasRangedSight',
  between('function approachHostile(','function warriorAutoEngage(){')+';return approachHostile;')(
   ()=>4.6,()=>true,(u,x,y)=>{u.path=[{x,y}];return true;},los);
 const u={kind:'archer',x:80.5,y:80.5,path:[]};
 assert.equal(approach(u,84.5,80.5),true);
 assert.ok(u.path.length>0,'archer should reposition despite being within nominal range');
 assert.equal(los(u.path[0].x+.5,u.path[0].y+.5,84.5,80.5),true);
});
function battle(kind,terrain){
 const los=sight(terrain);
 const combat=new Function('game','towerShots','refresh','toast','menu','panel','document','key',
  'visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty','hasRangedSight',
  between('function combatTurn(){','const key=(x,y)')+';combatTurn();');
 const game={enemy:{x:120,y:120,hp:100},enemyUnits:[{x:84.5,y:80.5,hp:65}],
  buildings:kind==='tower'?[{t:'Torre',x:80,y:80,buildLeft:0}]:[],
  units:kind==='archer'?[{kind:'archer',x:80.5,y:80.5,hp:100,path:[]}]:[],claim:[]};
 const shots=[];
 combat(game,shots,()=>{},()=>{},()=>{},{},{getElementById:()=>({})},
  (x,y)=>x+','+y,()=>true,k=>k==='archer',()=>5.4,()=>11,0,false,los);
 return {game,shots};
}
test('mountain cover blocks both archers and watchtowers',()=>{
 for(const kind of ['archer','tower']){
  const blocked=battle(kind,(x,y)=>x===82&&y===80?5:2);
  assert.equal(blocked.game.enemyUnits[0].hp,65,kind+' cannot shoot through mountains');
  assert.equal(blocked.shots.length,0);
  const clear=battle(kind,()=>2);
  assert.ok(clear.game.enemyUnits[0].hp<65,kind+' should fire on clear terrain');
  assert.equal(clear.shots.length,1);
 }
});
test('arrows rotate during flight, then show a short impact and expire',()=>{
 const ops=[],ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>ops.push(k)},set(o,k,v){o[k]=v;return true}});
 const code=between('function drawTowerShots(){','function draw(){');
 const shots=[{sx:80,sy:80,ex:83,ey:81,start:0}];
 let time=140;
 const draw=new Function('ctx','towerShots','Date','visibleAt','point','TH','scale',
  code+';return drawTowerShots;')(ctx,shots,{now:()=>time},()=>true,(x,y)=>[x*35,y*18],20,1.3);
 draw();assert.ok(ops.includes('rotate'),'projectile must follow its trajectory');
 ops.length=0;time=410;draw();assert.ok(ops.includes('ellipse'),'impact ring must appear');
 time=500;draw();assert.equal(shots.length,0,'expired projectiles must be removed');
});
test('projectiles stay hidden when target is under fog',()=>{
 const ops=[],ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>ops.push(k)},set(o,k,v){o[k]=v;return true}});
 const code=between('function drawTowerShots(){','function draw(){');
 const draw=new Function('ctx','towerShots','Date','visibleAt','point','TH','scale',
  code+';return drawTowerShots;')(ctx,[{sx:80,sy:80,ex:83,ey:81,start:0}],{now:()=>120},()=>false,
  (x,y)=>[x*35,y*18],20,1);
 draw();assert.equal(ops.length,0);
});
test('legacy save key is preserved',()=>assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/));
