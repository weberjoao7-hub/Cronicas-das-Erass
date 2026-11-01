'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const a=script.indexOf('function drawRoadJunction('),b=script.indexOf('function drawRoad(',a);
assert.ok(a>0&&b>a);
const source=script.slice(a,b),rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const triple=[[1,0],[0,1],[-1,0]],quad=[...triple,[0,-1]];
function scene(era=4,ww=74,links=triple){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));calls.push([k,...args]);}},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','rnd',source+'return drawRoadJunction;')(ctx,rnd);
 return {calls,styles,count:draw(100,120,ww,ww*.514,80,80,links,era,ww*(era>=6?.18:.15))};
}
test('script v6.149 compila sem mudar persistencia',()=>{assert.doesNotThrow(()=>new Function(script));assert.match(html,/Crônicas das Eras v6\.149/);assert.match(script,/cronicas-v04/);assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./)});
test('cruzamentos em T e X possuem meio-fio somente no ramal ausente',()=>{
 const t=scene(),x=scene(4,74,quad);assert.equal(t.count,3);assert.equal(x.count,4);
 assert.ok(t.calls.filter(c=>c[0]==='stroke').length>x.calls.filter(c=>c[0]==='stroke').length);
});
test('pavimento muda com a era, com faixas e rebites modernos',()=>{
 assert.ok(scene(0).styles.includes('#6c583d85'));
 assert.ok(scene(6).styles.includes('#d5c9a2'));
 assert.ok(scene(7).styles.includes('#eee9d0c7'));
 assert.notDeepEqual(scene(2).styles,scene(5).styles);
});
test('zoom distante ignora detalhes caros e nao desenha cruzamento',()=>{
 assert.equal(scene(7,24).count,0);assert.equal(scene(7,24).calls.length,0);
 assert.ok(scene(7,74).calls.length>scene(7,42).calls.length);
 assert.ok(!scene(7,42).styles.includes('#eee9d0c7'));
});
test('geometria deterministica e save/restore do Canvas balanceados',()=>{
 const a=scene(5);assert.deepEqual(a,scene(5));
 assert.equal(a.calls.filter(c=>c[0]==='save').length,a.calls.filter(c=>c[0]==='restore').length);
 assert.equal(a.calls.filter(c=>c[0]==='clip').length,1);
});
test('integracao preserva rotas, unidades e salvamento',()=>{
 const draw=script.slice(script.indexOf('function drawRoad(',b),script.indexOf('function drawRoadConvoy(',b));
 assert.match(draw,/drawRoadJunction\(px,py,ww,hh,x,y,links,era,width\)/);
 assert.match(draw,/roadLinks\.get\(key\(x,y\)\)/);
 assert.doesNotMatch(source,/roadTiles\.(?:add|delete)|roadLinks\.(?:set|delete)/);
});
test('ramais diagonais preservam o cruzamento original sem meio-fio falso',()=>{
 assert.equal(scene(4,74,[[1,1],[-1,-1],[1,0]]).count,0);
});
