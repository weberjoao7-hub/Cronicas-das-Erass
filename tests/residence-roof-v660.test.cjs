'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const a=script.indexOf('function drawEraResidence('),b=script.indexOf('/* Fortificações',a);
assert.ok(a>=0&&b>a,'residência e telhado definidos antes das torres');
const source=script.slice(a,b);
function render(era,ww=74,seed=17){
 const calls=[],fills=[],ctx=new Proxy({},{get(obj,k){if(k in obj)return obj[k];return (...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k)+' recebeu '+v);
  calls.push([k,...args]);
 }},set(obj,k,v){obj[k]=v;if(k==='fillStyle')fills.push(v);return true}});
 const draw=new Function('ctx','scale','drawCottage',source+';return drawEraResidence;')(ctx,1,()=>{});
 draw(180,140,ww,ww*38/74,1,seed,era);
 return {calls,fills};
}
test('script compila e preserva salvamento v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('telhas só são adicionadas nas eras históricas e no zoom adequado',()=>{
 const distant=render(4,28),medium=render(4,52),close=render(4,74);
 assert.ok(close.calls.length>medium.calls.length);
 assert.ok(medium.calls.length>distant.calls.length);
 assert.ok(close.fills.includes('#526574')||close.fills.includes('#657987'));
 assert.ok(!render(7,74).fills.includes('#526574'));
});
test('barro, ardósia e metal têm materiais distintos',()=>{
 const clay=render(2,74),slate=render(4,74),metal=render(6,74);
 assert.ok(clay.fills.some(v=>['#a45c42','#b96e4c','#d08a5f','#8c4e39'].includes(v)));
 assert.ok(slate.fills.some(v=>['#526574','#657987','#82939a','#465966'].includes(v)));
 assert.ok(metal.calls.filter(([name])=>name==='arc').length>=14,'rebites industriais');
});
test('geometria de oito eras e três zooms permanece finita',()=>{
 for(let era=0;era<8;era++)for(const ww of [28,52,74])for(let level=1;level<=3;level++){
  const scene=render(era,ww,level*31);
  assert.equal(scene.calls.filter(([m])=>m==='save').length,scene.calls.filter(([m])=>m==='restore').length);
 }
});
test('cores de telhas são determinísticas por edifício',()=>{
 assert.deepEqual(render(5,74,101),render(5,74,101));
 assert.notDeepEqual(render(5,74,101).fills,render(5,74,102).fills);
});
test('telhas são aplicadas dentro do renderizador histórico e não mudam gameplay',()=>{
 assert.match(source,/drawEraRoofTiles\(px,py,ww,hh,apex,era,seed\)/);
 assert.doesNotMatch(source,/\b(?:game|localStorage|routeFor|passable)\s*[.=(]/);
});
