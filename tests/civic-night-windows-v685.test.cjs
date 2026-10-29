'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const start=script.indexOf('function drawCivicNightWindows('),end=script.indexOf('// v6.83:',start);
assert.ok(start>=0&&end>start,'camada de iluminação cívica encontrada');
const source=script.slice(start,end);
const lightSource=script.slice(script.indexOf('function smoothstep('),script.indexOf('function drawAmbientParticles('));
const lightLevels=new Function(lightSource+';return lightLevels')();
function scene({era=4,phase=.82,zoom=1,now=1200,visible=true,buildings=[
 {x:80,y:80,t:'Aldeia'},{x:81,y:80,t:'Quartel'},{x:82,y:80,t:'Moinho'},{x:83,y:80,t:'Mina'}
]}={}){
 const ops=[],colors=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas recebeu coordenada inválida');
  ops.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true}});
 const fn=new Function('ctx','game','scale','TW','TH','point','visibleAt','lightLevels','w','h',
  source+';return drawCivicNightWindows;')(ctx,{era,buildings},zoom,74,38,
  (x,y)=>[200+(x-80)*10,160+(y-80)*5],()=>visible,lightLevels,640,420);
 return {count:fn(phase,now),ops,colors};
}
test('v6.85: JavaScript compila e salvamento original permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 const version=Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1]);assert.ok(version>=85,'versão 6.85 ou posterior');
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval/);
});
test('salão, quartel, moinho e mina acendem no crepúsculo e à noite',()=>{
 assert.equal(scene({phase:.15}).count,0);
 assert.equal(scene({phase:.56}).count,4);
 assert.equal(scene({phase:.82}).count,4);
 assert.ok(scene().ops.filter(([m])=>m==='fill').length>=7);
});
test('paleta fria industrial e lâmpadas quentes históricas',()=>{
 const old=scene({era:4}),modern=scene({era:7});
 assert.ok(old.colors.some(c=>String(c).startsWith('rgba(255,197,103,')));
 assert.ok(modern.colors.some(c=>String(c).startsWith('rgba(177,224,241,')));
 assert.ok(old.ops.some(([m])=>m==='ellipse'));
});
test('névoa, obras, LOD distante e exclusão de cabanas',()=>{
 assert.equal(scene({visible:false}).count,0);
 assert.equal(scene({zoom:.35}).count,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Mina',buildLeft:9}]}).count,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Cabana'}]}).count,0);
 assert.equal(scene({buildings:[{x:200,y:200,t:'Aldeia'}]}).count,0);
});
test('limite de renderização, animação determinística e Canvas balanceado',()=>{
 const buildings=Array.from({length:65},(_,i)=>({x:80+i%5,y:80+Math.floor(i/5),t:'Quartel'}));
 const a=scene({buildings}),b=scene({buildings}),c=scene({buildings,now:2500});
 assert.equal(a.count,28);assert.deepEqual(a,b);assert.notDeepEqual(a.colors,c.colors);
 assert.equal(a.ops.filter(([m])=>m==='save').length,a.ops.filter(([m])=>m==='restore').length);
});
test('camada é aplicada após atmosfera e antes da névoa',()=>{
 const atmosphere=script.slice(script.indexOf('function drawAtmosphere('),script.indexOf('function drawNightBeacons('));
 assert.equal((atmosphere.match(/drawCivicNightWindows\(phase,Date\.now\(\)\)/g)||[]).length,2);
 assert.ok(script.indexOf('drawAtmosphere();')<script.indexOf('// Névoa sobre o mundo renderizado'));
});
