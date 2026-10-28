'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('// v6.73: estações também alteram o chão isométrico;');
const end=script.indexOf('// Água rasa e transições costeiras',start);
assert.ok(start>=0&&end>start);
const art=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(season,b=2,ww=74,x=41,y=37){
 const calls=[],colors=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'geometria finita');calls.push([k,...args])}},
  set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true}
 });
 const draw=new Function('ctx','rnd','scale','forestSeason',art+';return drawSeasonalGround;')(ctx,rnd,ww/74,()=>season);
 const painted=draw(100,120,ww,ww*38/74,x,y,b);
 return {painted,calls,colors};
}
test('v6.73 preserva sintaxe, biomas e salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/if\(b!==0\)drawSeasonalGround\(px,py,ww,hh,x,y,b\)/);
});
test('primavera adiciona flores sem transformar água ou montanhas',()=>{
 const spring=scene(0,2,74,20,20);
 assert.ok(spring.painted>0);
 assert.ok(spring.colors.includes('#edb74d'));
 assert.equal(scene(0,5).painted,0);
 assert.equal(scene(0,0).painted,0);
});
test('outono colore terreno com folhas e não muda o verão',()=>{
 const autumn=scene(2,2,74,20,20);
 assert.ok(autumn.painted>0);
 assert.ok(autumn.colors.includes('#a87a44'));
 assert.equal(scene(1,2).painted,0);
});
test('inverno cobre prados, florestas e maciços com neve isométrica',()=>{
 for(const [biome,color] of [[2,'#dce8df'],[3,'#dce8df'],[4,'#e3e9e1'],[5,'#edf2ee']]){
  const s=scene(3,biome,74,20,20);
  assert.ok(s.painted>0,'bioma '+biome);
  assert.ok(s.colors.includes(color),'cor '+biome);
  assert.ok(s.calls.some(c=>c[0]==='clip'),'recorte no losango');
 }
});
test('LOD remove detalhes no zoom distante e mantém resultado determinístico',()=>{
 assert.equal(scene(3,2,20,20,20).painted,0);
 const a=scene(3,2,74,20,20),b=scene(3,2,74,20,20);
 assert.deepEqual(a.calls,b.calls);
});
test('prados, flores e cumes obedecem ao calendário sem afetar colisões',()=>{
 assert.match(script,/const season=forestSeason\(\),flowers=b===2&&q>\.73&&season===0/);
 assert.match(script,/const snow=height\*\(\(\(typeof forestSeason==='function'&&forestSeason\(\)===3\)\?\.39:\.23\)\+variation\*\.045\)/);
});
