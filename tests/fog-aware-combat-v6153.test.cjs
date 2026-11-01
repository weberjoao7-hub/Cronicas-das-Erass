'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
function between(a,b){
 const start=script.indexOf(a),end=script.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'ancoras ausentes: '+a);
 return script.slice(start,end);
}
const autoSource=between('function warriorAutoEngage(){','function combatTurn(){');
const combatSource=between('function combatTurn(){','const key=(x,y)');
function patrol(visibility,enemy=true){
 const u={kind:'warrior',x:80.5,y:80.5,hp:100,path:[]},calls=[];
 const game={enemy:{x:84,y:80,hp:100},enemyUnits:enemy?[{x:83.5,y:80.5,hp:65}]:[],units:[u]};
 const run=new Function('game','isMilitary','attackRange','hasRangedSight','approachHostile','visibleAt',
  autoSource+';return warriorAutoEngage;')(game,()=>true,()=>1.4,()=>true,
  (_,x,y)=>calls.push([x,y]),visibility);
 run();return calls;
}
function tower(visibility,los=()=>true,hostiles=[{x:83.5,y:80.5,hp:65}]){
 const game={enemy:{x:120,y:120,hp:100},enemyUnits:hostiles,buildings:[{t:'Torre',x:80,y:80,buildLeft:0}],units:[],claim:[]};
 const shots=[];
 const run=new Function('game','towerShots','refresh','toast','menu','panel','document','key',
  'visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty','hasRangedSight',
  combatSource+';return combatTurn;')(game,shots,()=>{},()=>{},()=>{},{},{getElementById:()=>({})},
   (x,y)=>x+','+y,visibility,()=>true,()=>4.3,()=>9,0,false,los);
 run();return {game,shots};
}
test('script compila e formato do save permanece v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(autoSource,/localStorage|game\.units\s*=/);
});
test('patrulha nao persegue tropas ocultas e volta a agir quando avistadas',()=>{
 assert.equal(patrol(()=>false).length,0);
 assert.deepEqual(patrol(()=>true),[[83.5,80.5]]);
});
test('fortaleza rival oculta nao atrai patrulhas automaticamente',()=>{
 assert.equal(patrol(()=>false,false).length,0);
 assert.deepEqual(patrol(()=>true,false),[[84.5,80.5]]);
});
test('torres so disparam contra alvos visiveis',()=>{
 const hidden=tower(()=>false);
 assert.equal(hidden.game.enemyUnits[0].hp,65);
 assert.equal(hidden.shots.length,0);
 const visible=tower(()=>true);
 assert.equal(visible.game.enemyUnits[0].hp,51);
 assert.equal(visible.shots.length,1);
});
test('torre ignora alvo mais proximo sob nevoa e escolhe um visivel',()=>{
 const hostiles=[{x:81.5,y:80.5,hp:65},{x:83.5,y:80.5,hp:65}];
 const result=tower((x)=>x>82,()=>true,hostiles);
 assert.equal(result.game.enemyUnits[0].hp,65);
 assert.equal(result.game.enemyUnits[1].hp,51);
 assert.equal(result.shots.length,1);
});
test('visibilidade nao substitui bloqueio de montanha para flechas',()=>{
 const blocked=tower(()=>true,()=>false);
 assert.equal(blocked.game.enemyUnits[0].hp,65);
 assert.equal(blocked.shots.length,0);
});
