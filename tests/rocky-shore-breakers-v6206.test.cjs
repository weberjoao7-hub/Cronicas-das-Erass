'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.206: arrebentacao e blocos minerais');
const end=script.indexOf('// v6.87: placas finas de gelo',start);
assert.ok(start>=0&&end>start,'renderizador isolavel');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(ww=78,season=1,neighbors=[4,1,1,1],mask=15,now=10000){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const biome=(x,y)=>x===11&&y===9?neighbors[0]:x===12&&y===8?neighbors[1]:
  x===13&&y===9?neighbors[2]:x===12&&y===10?neighbors[3]:0;
 const draw=new Function('ctx','rnd','biome',source+';return drawRockyShoreBreakers')(ctx,rnd,biome);
 return {draw,count:draw(180,160,ww,ww*.5,12,9,mask,season,now),calls,styles};
}
test('v6.206: sintaxe e persistencia original preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame|routeFor\(|game\./);
});
test('LOD evita desenho distante e limita blocos por margem',()=>{
 assert.equal(scene(40).count,0);
 assert.equal(scene(50).count,1);
 assert.equal(scene(78).count,2);
 assert.equal(scene(110).count,3);
 assert.ok(scene(110).calls.length<150,'limite de operacoes por margem');
});
test('rochas aparecem somente quando a costa encontra colinas ou montanhas',()=>{
 assert.equal(scene(78,1,[1,1,1,1]).count,0);
 assert.equal(scene(78,1,[4,1,1,1]).count,2);
 assert.equal(scene(78,1,[5,1,1,1]).count,2);
 assert.equal(scene(78,1,[4,1,1,1],2).count,0);
 assert.equal(scene(78,1,[4,1,1,5]).count,4);
});
test('inverno acumula neve, outras estacoes animam a espuma',()=>{
 const summer=scene(78,1),autumn=scene(78,2),winter=scene(78,3);
 assert.ok(summer.styles.includes('#d8f1e9'));
 assert.ok(autumn.styles.includes('#9a8c78'));
 assert.ok(winter.styles.includes('#e7f2ebc9'));
 assert.ok(!winter.styles.includes('#d8f1e9'));
});
test('geometria recortada, estado Canvas balanceado e coordenadas finitas',()=>{
 const a=scene(110,1,[4,5,4,5]);
 assert.equal(a.calls[0][0],'save');
 assert.equal(a.calls.at(-1)[0],'restore');
 assert.ok(a.calls.some(c=>c[0]==='clip'));
 assert.ok(a.calls.some(c=>c[0]==='ellipse'));
 assert.ok(a.calls.length<500,'limite de operacoes para quatro margens');
});
test('renderizacao deterministica e sem mutacao do mundo',()=>{
 const a=scene(110,1,[4,5,4,5]),b=scene(110,1,[4,5,4,5]);
 assert.deepEqual(a.calls,b.calls);
 assert.deepEqual(a.styles,b.styles);
 assert.equal(scene(110,1,[4,1,1,1],15,12000).count,3);
});
test('entradas invalidas nao modificam o Canvas',()=>{
 const a=scene();
 const before=a.calls.length;
 assert.equal(a.draw(NaN,160,78,39,12,9,15,1,10000),0);
 assert.equal(a.draw(180,160,0,39,12,9,15,1,10000),0);
 assert.equal(a.calls.length,before);
});
test('integracao ocorre na costa visivel e antes dos detalhes do lago',()=>{
 const coast=script.indexOf('drawShoreFoam(px,py,ww,hh,x,y,shoreMask[y*W+x],frameTime)');
 const breaker=script.indexOf('drawRockyShoreBreakers(px,py,ww,hh,x,y,shoreMask[y*W+x]',coast);
 const details=script.indexOf('drawLakeDetails(px,py,ww,hh,x,y,q,shoreMask[y*W+x]',coast);
 assert.ok(coast>=0&&breaker>coast&&details>breaker);
 assert.match(script.slice(coast,breaker),/visibleFog\[y\*W\+x\]/);
});
