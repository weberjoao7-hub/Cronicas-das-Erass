'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.99: trabalhadores agrícolas');
const end=script.indexOf('// Mina isométrica:',start);
assert.ok(start>=0&&end>start,'render dos agricultores encontrado');
const source=script.slice(start,end);
const create=new Function('ctx',source+';return drawFarmWorkers;');
function scene(era=4,ww=76,day=1,level=1,now=1400,x=20,y=20){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const count=create(ctx)(190,230,ww,ww*38/74,era,now,day,x,y,level);
 return {count,calls,styles};
}
test('v6.99: JavaScript valido e chave do save preservada',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/Crônicas das Eras v6\.(\d+)/)?.[1])>=99);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.food\s*[+\-]?=/);
});
test('LOD omite trabalhadores no zoom distante',()=>{
 const far=scene(4,28),near=scene(4,76);
 assert.equal(far.count,0);assert.equal(far.calls.length,0);
 assert.equal(near.count,1);
 assert.ok(near.calls.some(c=>c[0]==='ellipse'),'sombras e volumes no chão');
});
test('fazenda nivel 3 permite dois trabalhadores no zoom proximo',()=>{
 assert.equal(scene(4,76,1,3).count,2);
 assert.equal(scene(4,62,1,3).count,1);
 assert.equal(scene(4,76,1,2).count,1);
});
test('roupas mudam entre eras primordiais, medievais e industriais',()=>{
 assert.ok(scene(0).styles.includes('#ad8554'));
 assert.ok(scene(4).styles.includes('#90734d'));
 assert.ok(scene(7).styles.includes('#5e7878'));
 assert.ok(scene(7).styles.includes('#b6b4a0'));
});
test('trabalho acompanha fases da lavoura e se repete a cada quatro dias',()=>{
 const scenes=[1,2,3,4].map(day=>scene(4,76,day));
 assert.ok(new Set(scenes.map(s=>JSON.stringify(s))).size>=3);
 assert.deepEqual(scene(4,76,1),scene(4,76,5));
});
test('movimentos animados, Canvas equilibrado e coordenadas finitas',()=>{
 assert.notDeepEqual(scene(4,76,3,1,1200).calls,scene(4,76,3,1,1750).calls);
 for(const era of [0,2,4,6,7])for(const ww of [28,42,60,76]){
  const s=scene(era,ww);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('apenas fazendas prontas e exploradas renderizam trabalhadores',()=>{
 const branch=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(branch,/if\(!exploredFog\[y\*W\+x\]\)continue/);
 assert.match(branch,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite\(obj,px,py,ww,hh\)\}/);
 const farm=branch.indexOf("else if(obj.t==='Fazenda'){drawFarm(");
 assert.ok(farm>=0,'fazenda pronta presente na ramificacao de estruturas');
 const end=branch.indexOf('}',farm),render=branch.slice(farm,end);
 assert.ok(render.includes('drawFarm(px,py,ww,hh,obj.level,frameTime,game.day,obj.x,obj.y)'));
 assert.ok(render.includes('drawFarmWorkers(px,py,ww,hh,game.era,frameTime,game.day,obj.x,obj.y,obj.level)'));
 assert.ok(render.indexOf('drawFarm(')<render.indexOf('drawFarmWorkers('));
});
