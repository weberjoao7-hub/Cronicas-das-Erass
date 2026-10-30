'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.125: sentinela isometrica');
const end=script.indexOf('function drawTownHallEraDetails(',start);
assert.ok(start>=0&&end>start,'sentinela encontrada');
const source=script.slice(start,end);
const factory=new Function('ctx',source+';return drawWatchtowerSentry;');
function scene(era=4,ww=74,now=1200,season=0){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenadas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const count=factory(ctx)(160,200,ww,ww*.5,era,now,season,75,88);
 return {count,calls,styles};
}
test('v6.125: sintaxe e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 assert.ok(!source.includes('localStorage')&&!source.includes('setInterval')&&!source.includes('Math.random'));
});
test('sentinela respeita LOD e sombra',()=>{
 assert.equal(scene(4,30).count,0);
 assert.equal(scene(4,30).calls.length,0);
 assert.equal(scene(4,74).count,1);
 assert.ok(scene(4,74).calls.some(c=>c[0]==='ellipse'));
});
test('armas e vestuario por era e inverno',()=>{
 assert.ok(scene(0).styles.includes('#aaa58a'));
 assert.ok(scene(4).styles.includes('#ad8250'));
 assert.ok(scene(7).styles.includes('#303b3e'));
 assert.ok(scene(4,74,1200,3).styles.includes('#e4e4d5'));
});
test('passos animados e Canvas equilibrado',()=>{
 assert.notDeepEqual(scene(4,74,1200).calls,scene(4,74,1900).calls);
 for(const era of [0,2,4,6,7])for(const ww of [39,54,80]){
  const s=scene(era,ww,2300);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('sentinela integra apenas torre pronta na renderizacao',()=>{
 const branch=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.ok(branch.includes("if(obj&&obj.buildLeft){drawConstructionSite(obj,px,py,ww,hh)}"));
 assert.ok(branch.includes("if(obj.t==='Torre')drawWatchtowerSentry(px,py,ww,hh,game.era,frameTime,forestSeason(),x,y)"));
 assert.ok(branch.includes('if(!exploredFog[y*W+x])continue'));
});
