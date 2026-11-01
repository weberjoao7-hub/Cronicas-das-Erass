'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const a=script.indexOf('function drawRoadWayfinder('),b=script.indexOf('function drawRoad(',a);
assert.ok(a>0&&b>a);
const source=script.slice(a,b);
const roads=[[1,0],[0,1],[-1,0]];
function scene(era=4,ww=90,season=1,x=6,y=0,links=roads){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx',source+'return drawRoadWayfinder;')(ctx);
 const result=draw(180,210,ww,ww*.51,x,y,links,era,season);
 return {result,calls,styles};
}
test('script principal compila e preserva o save',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/drawRoadWayfinder\(px,py,ww,hh,x,y,links,era,forestSeason\(\)\)/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random|game\.|roadTiles\.(?:add|delete)/);
});
test('marcos aparecem apenas em entroncamentos detalhados e eras compativeis',()=>{
 for(const era of [0,1])assert.equal(scene(era).result,0);
 assert.equal(scene(4,50).result,0);
 assert.equal(scene(4,90,1,7,0).result,0);
 assert.equal(scene(4,90,1,6,0,roads.slice(0,2)).result,0);
 assert.equal(scene(4,90).result,1);
});
test('pedra, madeira e metal apresentam geometrias e paletas distintas',()=>{
 const stone=scene(2),wood=scene(4),metal=scene(7);
 assert.ok(stone.styles.includes('#b7b4a1'));
 assert.ok(wood.styles.includes('#b78b56'));
 assert.ok(metal.styles.includes('#769196'));
 assert.ok(wood.calls.filter(c=>c[0]==='lineTo').length>stone.calls.filter(c=>c[0]==='lineTo').length);
});
test('inverno adiciona cobertura sem alterar a geometria base',()=>{
 const summer=scene(5),winter=scene(5,90,3);
 assert.equal(summer.result,winter.result);
 assert.equal(winter.calls.filter(c=>c[0]==='stroke').length,summer.calls.filter(c=>c[0]==='stroke').length+1);
});
test('determinismo, integridade Canvas e custo limitado',()=>{
 const first=scene(6),again=scene(6);
 assert.deepEqual(first,again);
 assert.equal(first.calls.filter(c=>c[0]==='save').length,first.calls.filter(c=>c[0]==='restore').length);
 assert.ok(first.calls.length<120);
});
