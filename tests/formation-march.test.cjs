'use strict';
// Regressões das formações táticas isométricas — v6.50.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function moveArmyTo(');
const end=script.indexOf('let pointers=new Map()',start);
assert.ok(start>=0&&end>start,'âncoras da formação');
const source=script.slice(start,end);
function simulate(units,options={}){
 const orders=[],messages=[],game={units};
 let saves=0,attempts=0;
 const move=new Function('game','isMilitary','passable','key','assignRoute','toast','save','dirty',
   source+';return moveArmyTo;')(
   game,k=>['warrior','archer','cavalry'].includes(k),
   options.passable||(()=>true),(x,y)=>x+','+y,
   (u,x,y)=>{attempts++;orders.push({u,x,y});return options.route?options.route(u,x,y,attempts):true},
   msg=>messages.push(msg),()=>{saves++},false);
 return {move,orders,messages,get saves(){return saves},get attempts(){return attempts}};
}
const unit=(kind,x,y,hp=100)=>({kind,x,y,hp});
test('script compila e mantém o salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('seis tropas recebem destinos distintos e arqueiros ficam atrás da infantaria',()=>{
 const units=[
  unit('warrior',7,7),unit('warrior',8,7),unit('warrior',9,7),
  unit('archer',7,9),unit('archer',8,9),unit('archer',9,9)
 ];
 const sim=simulate(units);sim.move(20,20);
 assert.equal(sim.orders.length,6);
 assert.equal(new Set(sim.orders.map(o=>o.x+','+o.y)).size,6);
 assert.ok(sim.orders.every(o=>Number.isInteger(o.x)&&Number.isInteger(o.y)));
 const front=sim.orders.slice(0,3).reduce((s,o)=>s+o.x+o.y,0)/3;
 const rear=sim.orders.slice(3).reduce((s,o)=>s+o.x+o.y,0)/3;
 assert.ok(front>rear,'arqueiros posicionados na retaguarda');
 assert.equal(sim.saves,1);
 assert.match(sim.messages.at(-1),/6\/6 guerreiros em formação/);
});
test('ordens respeitam seleção e ordem original mesmo com classes misturadas',()=>{
 const units=[unit('archer',4,4),unit('warrior',5,4),unit('worker',4,5),unit('cavalry',6,4)];
 const sim=simulate(units);sim.move(15,18,new Set([units[0],units[3]]));
 assert.deepEqual(sim.orders.map(o=>o.u),[units[0],units[3]]);
 assert.notDeepEqual(sim.orders.map(o=>[o.x,o.y])[0],sim.orders.map(o=>[o.x,o.y])[1]);
});
test('recalcula um destino quando A* recusa a primeira posição',()=>{
 const sim=simulate([unit('warrior',1,1),unit('archer',2,1)],{route:(_u,_x,_y,n)=>n!==1});
 sim.move(15,15);
 assert.equal(sim.attempts,3);
 assert.equal(sim.saves,1);
 assert.equal(new Set(sim.orders.slice(1).map(o=>o.x+','+o.y)).size,2);
});
test('falhas de rota são limitadas a oito tentativas por unidade',()=>{
 const sim=simulate([unit('warrior',1,1)],{route:()=>false});
 sim.move(15,15);
 assert.equal(sim.attempts,8);
 assert.equal(sim.saves,0);
 assert.match(sim.messages.at(-1),/Não existe caminho/);
});
test('destino bloqueado e grupo vazio não alteram o jogo',()=>{
 const blocked=simulate([unit('warrior',1,1)],{passable:()=>false});
 blocked.move(20,20);
 assert.equal(blocked.attempts,0);assert.equal(blocked.saves,0);
 assert.match(blocked.messages.at(-1),/inacessível/);
 const empty=simulate([unit('worker',1,1),unit('archer',2,2,0)]);
 empty.move(20,20);
 assert.equal(empty.attempts,0);
 assert.match(empty.messages.at(-1),/Nenhum guerreiro/);
});
test('mesmo destino da tropa não causa divisão por zero',()=>{
 const sim=simulate([unit('warrior',20,20)]);sim.move(20,20);
 assert.equal(sim.orders.length,1);
 assert.ok(Number.isFinite(sim.orders[0].x)&&Number.isFinite(sim.orders[0].y));
});
