'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const a=script.indexOf('function walkSegmentClear(');
const b=script.indexOf('// Seleção pelo desenho visível',a);
assert.ok(a>=0&&b>a,'v6.190 routing helpers');
const block=script.slice(a,b);
const key=(x,y)=>x+','+y;
const tiles=new Set(),links=new Map();
const open=(x,y)=>x>=0&&y>=0&&x<20&&y<20;
let route=null;
const api=new Function('passable','routeFor','roadTiles','roadLinks','key',
 block+';return {walkSegmentClear,smoothUnitRoute,pavedRouteEdge,assignRoute};')(
 open,()=>route,tiles,links,key);
const {walkSegmentClear,smoothUnitRoute,pavedRouteEdge,assignRoute}=api;

test('v6.190: sintaxe e persistencia anterior preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=190);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(block,/localStorage|save\(\)/);
});
test('supercover impede travessia por lago, montanha e canto bloqueado',()=>{
 assert.equal(walkSegmentClear(.5,.5,6.5,6.5,open),true);
 assert.equal(walkSegmentClear(.5,.5,6.5,.5,(x,y)=>open(x,y)&&x!==3),false);
 assert.equal(walkSegmentClear(.5,.5,3.5,3.5,(x,y)=>open(x,y)&&!(x===1&&y===0)),false);
 assert.equal(walkSegmentClear(.5,.5,3.5,3.5,(x,y)=>open(x,y)&&!(x===1&&y===1)),false);
});
test('corredor livre elimina ziguezague sem mudar destino nem rota original',()=>{
 const route=Array.from({length:9},(_,i)=>({x:i+1.5,y:.5}));
 const copy=JSON.stringify(route);
 const smooth=smoothUnitRoute({x:.5,y:.5},route,open);
 assert.deepEqual(smooth,[{x:9.5,y:.5}]);
 assert.equal(JSON.stringify(route),copy);
});
test('desvio em obstaculo mantem todos os segmentos transitaveis',()=>{
 const pass=(x,y)=>open(x,y)&&!(x===4&&y===0);
 const route=[{x:1.5,y:.5},{x:2.5,y:.5},{x:2.5,y:1.5},
  {x:3.5,y:1.5},{x:4.5,y:1.5},{x:5.5,y:1.5},{x:5.5,y:.5},{x:6.5,y:.5}];
 const smooth=smoothUnitRoute({x:.5,y:.5},route,pass);
 assert.ok(smooth.length<route.length);
 assert.deepEqual(smooth.at(-1),route.at(-1));
 let from={x:.5,y:.5};
 for(const to of smooth){assert.ok(walkSegmentClear(from.x,from.y,to.x,to.y,pass));from=to}
});
test('arestas de estrada continuam preservadas para o bonus de velocidade',()=>{
 const road=[3,4].map(x=>key(x,0));
 road.forEach(x=>tiles.add(x));
 links.set(key(3,0),[[1,0]]);
 assert.equal(pavedRouteEdge({x:3.5,y:.5},{x:4.5,y:.5}),true);
 assert.equal(pavedRouteEdge({x:2.5,y:.5},{x:3.5,y:.5}),false);
 const original=Array.from({length:9},(_,i)=>({x:i+1.5,y:.5}));
 const smooth=smoothUnitRoute({x:.5,y:.5},original,open,pavedRouteEdge);
 assert.deepEqual(smooth.map(p=>p.x),[3.5,4.5,9.5]);
});
test('assignRoute usa trajeto simplificado e preserva coordenadas do alvo',()=>{
 tiles.clear();links.clear();
 route=Array.from({length:9},(_,i)=>({x:i+1.5,y:.5}));
 const u={x:.5,y:.5,path:[]};
 assert.equal(assignRoute(u,9,0),true);
 assert.deepEqual(u.path,[{x:9.5,y:.5}]);
 assert.equal(u.tx,9.5);assert.equal(u.ty,.5);
 route=null;assert.equal(assignRoute(u,10,0),false);
 assert.deepEqual(u.path,[{x:9.5,y:.5}]);
});
test('entrada invalida e limite de busca nao provocam loops',()=>{
 assert.equal(walkSegmentClear(NaN,0,2,2,open),false);
 assert.equal(walkSegmentClear(.5,.5,2.5,2.5,null),false);
 const long=Array.from({length:19},(_,i)=>({x:i+1.5,y:.5}));
 const smooth=smoothUnitRoute({x:.5,y:.5},long,open,null,4);
 assert.ok(smooth.length>=5);
 assert.deepEqual(smooth.at(-1),long.at(-1));
 assert.deepEqual(smoothUnitRoute({x:.5,y:.5},[],open),[]);
});
