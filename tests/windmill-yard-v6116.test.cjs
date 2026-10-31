'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const begin=script.indexOf('// v6.116: moleiro animado');
const end=script.indexOf('function drawWindmill(',begin);
assert.ok(begin>=0&&end>begin,'desenho do pátio isolável');
const source=script.slice(begin,end);
function scene(era=4,ww=80,now=1200,season=1,level=3){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const draw=new Function('ctx',source+'return drawWindmillYard')(ctx);
 const count=draw(190,210,ww,ww*.52,era,level,now,season);
 return {count,calls,styles};
}
test('v6.116: script compila e salvamento existente não muda',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('pátio do moinho integra-se apenas à construção concluída',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(render,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite/);
 assert.match(render,/else if\(obj\.t==='Moinho'\)\{drawWindmill\([^;]+;drawWindmillYard\(/);
 assert.ok(render.indexOf('drawWindmillYard(px,py')<render.lastIndexOf('drawTileOccupants(x,y'));
});
test('LOD reduz custo no zoom distante e adiciona moleiro no zoom próximo',()=>{
 const far=scene(4,28),mid=scene(4,49),near=scene(4,86);
 assert.equal(far.count,0);assert.equal(far.calls.length,0);
 assert.equal(mid.count,1);assert.equal(near.count,2);
 assert.ok(near.calls.length>mid.calls.length);
 assert.ok(near.calls.some(c=>c[0]==='quadraticCurveTo'));
});
test('materiais evoluem da madeira para pedra e ferragens',()=>{
 assert.ok(scene(0).styles.includes('#94704b'));
 assert.ok(scene(3).styles.includes('#886a4c'));
 assert.ok(scene(7).styles.includes('#64787a'));
 assert.ok(scene(7).styles.includes('#d5d3b9'));
});
test('neve sazonal e níveis de moinho alteram somente o cenário',()=>{
 assert.ok(scene(4,80,1200,3).styles.includes('#e8eee3'));
 assert.ok(!scene(4,80,1200,1).styles.includes('#e8eee3'));
 assert.ok(scene(4,80,1200,1,3).calls.length>scene(4,80,1200,1,1).calls.length);
});
test('animação determinística e geometria Canvas válida nas oito eras',()=>{
 assert.deepEqual(scene(4,80,1200).calls,scene(4,80,1200).calls);
 assert.notDeepEqual(scene(4,80,1200).calls,scene(4,80,3200).calls);
 for(let era=0;era<8;era++)for(const ww of [28,46,70,88]){
  const s=scene(era,ww,1450);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
