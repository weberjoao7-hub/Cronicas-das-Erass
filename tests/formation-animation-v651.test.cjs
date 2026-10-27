'use strict';
// Regressões v6.51: marcha por classe e animações assíncronas sem alterar o save.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');

function getClock(){
 const start=script.indexOf('const unitAnimationPhase=');
 const end=script.indexOf('const paintedCavalry=',start);
 assert.ok(start>=0&&end>start,'relógio por unidade presente');
 return new Function(script.slice(start,end)+';return unitAnimationClock;')();
}
function formation(units,destination={x:30,y:30}){
 const orders=[],game={units},messages=[];
 const start=script.indexOf('function moveArmyTo(');
 const end=script.indexOf('let pointers=new Map()',start);
 assert.ok(start>=0&&end>start,'formação presente');
 const move=new Function('game','isMilitary','passable','key','assignRoute','toast','save','dirty',
  script.slice(start,end)+';return moveArmyTo;')(
   game,k=>['warrior','archer','cavalry'].includes(k),
   ()=>true,(x,y)=>x+','+y,
   (u,x,y)=>{orders.push({u,x,y});return true},
   msg=>messages.push(msg),()=>{},false);
 move(destination.x,destination.y);
 return {orders,messages};
}
const soldier=(kind,x,y)=>({kind,x,y,hp:100,path:[]});
test('JavaScript compila e mantém o save legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('cada personagem tem fase estável e independente do deslocamento',()=>{
 const clock=getClock(),a=soldier('warrior',1,1),b=soldier('warrior',1,1);
 const t=10000,phase=clock(a,t)-t;
 assert.equal(clock(a,t)-t,phase);
 a.x=55;a.y=72;
 assert.equal(clock(a,t+600)-(t+600),phase);
 assert.notEqual(clock(b,t),clock(a,t));
 assert.equal(clock(null,t),t);
});
test('as poses SVG e o galope procedural usam o relógio visual',()=>{
 assert.match(script,/drawPaintedTroop\(u,px,py,z,archer,moving,striking,visualNow,direction,enemy\)/);
 assert.match(script,/drawPaintedVillager\(u,px,py,z,job,moving,visualNow\)/);
 assert.match(script,/drawPaintedWorkerAction\(u,px,py,z,job,moving,visualNow\)/);
 assert.match(script,/drawVillagerAtlas\(u,px,py,z,job,moving,visualNow\)/);
 assert.match(script,/Math\.floor\(visualNow\/155\)%2/);
 assert.match(script,/Math\.sin\(unitAnimationClock\(u,now\)\*\.017/);
});
test('três classes, mesmo com apenas uma unidade cada, ocupam fileiras distintas',()=>{
 const units=[soldier('archer',8,8),soldier('warrior',9,8),soldier('cavalry',10,8)];
 const {orders}=formation(units);
 assert.equal(orders.length,3);
 const rank=Object.fromEntries(orders.map(o=>[o.u.kind,o.x+o.y]));
 assert.ok(rank.warrior>rank.cavalry,'infantaria à frente');
 assert.ok(rank.cavalry>rank.archer,'arqueiros atrás da cavalaria');
 assert.equal(new Set(orders.map(o=>o.x+','+o.y)).size,3);
});
test('fileira parcial não mistura arqueiros com guerreiros',()=>{
 const units=[
  soldier('warrior',8,8),soldier('archer',9,8),soldier('archer',10,8),
  soldier('warrior',11,8),soldier('cavalry',12,8),soldier('archer',13,8)
 ];
 const {orders}=formation(units);
 assert.equal(orders.length,6);
 const projection=k=>orders.filter(o=>o.u.kind===k).map(o=>o.x+o.y);
 const min=a=>Math.min(...a),max=a=>Math.max(...a);
 assert.ok(min(projection('warrior'))>max(projection('cavalry')));
 assert.ok(min(projection('cavalry'))>max(projection('archer')));
 assert.equal(new Set(orders.map(o=>o.x+','+o.y)).size,6);
});
