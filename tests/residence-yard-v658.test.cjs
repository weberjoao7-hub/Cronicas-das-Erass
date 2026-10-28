'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('function drawResidenceYard('),b=script.indexOf('function drawEraResidence(',a);
assert.ok(a>=0&&b>a,'quintal deve preceder residência');
const source=script.slice(a,b);
function scene(era=0,ww=75,seed=123){
 const calls=[],colors=[],state={};
 const ctx=new Proxy(state,{get(o,k){if(k in o)return o[k];return (...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'coordenada finita: '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true}});
 const fn=new Function('ctx',source+';return drawResidenceYard;')(ctx);
 return {count:fn(200,140,ww,38*ww/74,era,seed),calls,colors};
}
test('script compila e preserva o formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('quintais só aparecem em residências concluídas, antes da sombra e da casa',()=>{
 assert.match(script,/if\(obj&&!obj\.buildLeft&&obj\.t==='Cabana'\)drawResidenceYard\(/);
 assert.ok(script.indexOf("if(obj&&!obj.buildLeft&&obj.t==='Cabana')drawResidenceYard(")<
  script.indexOf("if(obj&&!obj.buildLeft&&obj.t!=='Ponte')drawStructureShadow("));
});
test('piso acompanha oito eras, com materiais históricos distintos',()=>{
 const palettes=Array.from({length:8},(_,era)=>scene(era).colors);
 assert.notDeepEqual(palettes[0],palettes[2]);
 assert.notDeepEqual(palettes[4],palettes[6]);
 assert.notDeepEqual(palettes[6],palettes[7]);
 for(let era=0;era<8;era++)assert.equal(scene(era).count,1);
});
test('LOD evita quintais no zoom distante e reduz objetos intermediários',()=>{
 assert.equal(scene(2,20).count,0);
 const medium=scene(2,34),near=scene(2,75);
 assert.ok(near.calls.length>medium.calls.length);
 assert.equal(medium.calls.filter(([m])=>m==='save').length,1);
 assert.equal(near.calls.filter(([m])=>m==='restore').length,1);
});
test('geometria é determinística e mantém o estado Canvas equilibrado',()=>{
 const first=scene(5,75,77),again=scene(5,75,77),different=scene(5,75,78);
 assert.deepEqual(first,again);
 assert.notDeepEqual(first.calls,different.calls);
 assert.equal(first.calls.filter(([m])=>m==='save').length,first.calls.filter(([m])=>m==='restore').length);
 assert.ok(first.calls.some(([m])=>m==='ellipse'));
});
