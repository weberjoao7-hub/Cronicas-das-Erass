'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script must exist');
const part=(start,end)=>{const a=script.indexOf(start),b=script.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,'Missing anchors: '+start);return script.slice(a,b)};
const spriteCode=part('function drawCavalrySprite(','// Rede viária derivada');
function render(kind,era,zoom=1.4,attackAt=0,face=1){
 const ops=[];
 const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>ops.push([k,...args])},set(o,k,v){o[k]=v;return true}});
 const draw=new Function('ctx','biome','game','Date',spriteCode+';return drawUnitSprite;')(ctx,()=>2,{era},{now:()=>5000});
 draw({kind,x:80.5,y:80.5,hp:100,path:[],attackAt,face},200,220,zoom,false);
 return ops;
}
test('browser game JavaScript remains valid',()=>assert.doesNotThrow(()=>new Function(script)));
test('warrior armour visibly progresses from bronze to steel',()=>{
 const primordial=render('warrior',0),ancient=render('warrior',2),medieval=render('warrior',4),industrial=render('warrior',6);
 assert.ok(ancient.length>primordial.length,'bronze plate is rendered');
 assert.ok(medieval.length>ancient.length,'medieval shoulder armour and heraldry');
 assert.ok(industrial.length>medieval.length,'industrial trims');
});
test('archers and cavalry receive era-specific layered gear',()=>{
 for(const kind of ['archer','cavalry']){
  assert.ok(render(kind,2).length>render(kind,0).length,kind+' Ancient-era equipment');
  assert.ok(render(kind,4).length>render(kind,2).length,kind+' Medieval-era equipment');
 }
});
test('distant sprites skip expensive era equipment',()=>{
 for(const kind of ['warrior','archer','cavalry']){
  assert.deepEqual(render(kind,6,.55),render(kind,0,.55),kind+' must omit close-up era details');
 }
});
test('melee strike produces a temporary animated arc, not a permanent particle',()=>{
 for(const kind of ['warrior','cavalry']){
  const idle=render(kind,4,1.4,0),strike=render(kind,4,1.4,4900);
  assert.ok(strike.length>idle.length,kind+' must animate a recent attack');
  assert.deepEqual(render(kind,4,1.4,4900),strike,'fixed time must be deterministic');
 }
 assert.ok(script.includes('if(warrior&&striking)drawMeleeArc(r,now,u.attackAt)'),'only melee troops receive sword arcs');
});
test('idle soldiers retain their last combat-facing direction',()=>{
 const left=render('warrior',4,1.4,0,-1),right=render('warrior',4,1.4,0,1);
 assert.ok(left.some(op=>op[0]==='scale'&&op[1]===-1));
 assert.ok(right.some(op=>op[0]==='scale'&&op[1]===1));
});
test('combat assigns facing toward target and keeps legacy save key',()=>{
 const combatCode=part('function combatTurn(){','const key=(x,y)');
 const game={enemy:{x:120,y:120,hp:100},enemyUnits:[{x:83.5,y:80.5,hp:65}],buildings:[],units:[{kind:'warrior',x:84.5,y:80.5,hp:100,path:[]}],claim:[]};
 const attack=new Function('game','towerShots','refresh','toast','menu','panel','document','key','visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty',combatCode+';combatTurn();');
 attack(game,[],()=>{},()=>{},()=>{},{},{getElementById:()=>({})},(x,y)=>x+','+y,()=>true,k=>k==='warrior',()=>1.45,()=>18,0,false);
 assert.equal(game.units[0].face,-1);
 assert.equal(game.enemyUnits[0].face,1);
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
});
