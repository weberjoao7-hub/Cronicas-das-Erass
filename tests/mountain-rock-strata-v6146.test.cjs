'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawMountain('),end=script.indexOf('// v6.130: microclima',start);
assert.ok(start>0&&end>start);
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function render(season,ww=80,neighbors=()=>5){
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;return true}});
 const draw=new Function('ctx','biome','rnd','forestSeason',source+'return drawMountain')(ctx,neighbors,rnd,()=>season);
 draw(200,180,ww,ww*38/74,42,32);
 return calls;
}
test('v6.146: sintaxe e salvamento preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random/);
});
test('estratos deterministicos e Canvas balanceado',()=>{
 const a=render(1),b=render(1);
 assert.deepEqual(a,b);
 assert.equal(a[0][0],'save');
 assert.equal(a.at(-1)[0],'restore');
});
test('zoom controla a quantidade de estratos',()=>{
 assert.ok(render(1,40).length<render(1,62).length);
 assert.ok(render(1,62).length<render(1,80).length);
});
test('inverno adiciona cornijas de neve sem modificar o terreno',()=>{
 const a=render(1),b=render(3);
 assert.ok(b.filter(v=>v[0]==='fill').length>a.filter(v=>v[0]==='fill').length);
 assert.notDeepEqual(a,b);
});
test('cordilheiras preservam vizinhos e pintor original',()=>{
 assert.notDeepEqual(render(1,80,()=>4),render(1,80,()=>5));
 assert.match(script,/if\(b===5&&ww>13\)\{drawMountain\(/);
 assert.match(script,/drawMountainRockStrata\(px,py,ww,hh,x,y,peakX,peakY/);
});
