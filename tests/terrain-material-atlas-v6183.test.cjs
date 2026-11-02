'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function paintTerrainMaterial(');
const end=script.indexOf('const tileArt=Array.from(',start);
assert.ok(start>=0&&end>start,'material isolavel');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const paint=new Function('rnd',source+'return paintTerrainMaterial;')(rnd);
function scene(b=2,v=0,w=148,h=76){
 const calls=[],styles=[];
 const g=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k);calls.push([k,...args])}},
 set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 return {count:paint(g,w,h,b,v),calls,styles};
}
test('v6.183: sintaxe e persistencia preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=183);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random|game\./);
});
test('seis biomas usam materiais e cores distintas',()=>{
 const scenes=Array.from({length:6},(_,b)=>scene(b));
 assert.equal(new Set(scenes.map(s=>s.styles[0])).size,6);
 assert.equal(scenes[0].count,6);
 assert.equal(scenes[4].count,10);
 assert.equal(scenes[2].count,9);
});
test('48 texturas cacheadas e integradas antes dos microdetalhes',()=>{
 assert.match(script,/const TERRAIN_VARIANTS=8/);
 assert.match(script,/const tileArt=Array\.from\(\{length:6\}/);
 const atlas=script.slice(script.indexOf('const tileArt='),script.indexOf('function point('));
 assert.ok(atlas.indexOf('paintTerrainMaterial(g,ww,hh,biomeId,variant)')>atlas.indexOf('g.fillRect(0,0,ww,hh)'));
 assert.ok(atlas.indexOf('paintTerrainMaterial(g,ww,hh,biomeId,variant)')<atlas.indexOf('for(let i=0;i<38;i++)'));
 assert.match(atlas,/g\.clip\(\)/);
});
test('variantes deterministicas nao repetem manchas identicas',()=>{
 assert.deepEqual(scene(3,2),scene(3,2));
 assert.notDeepEqual(scene(3,2).calls,scene(3,3).calls);
});
test('geometria finita e pilha Canvas equilibrada em 48 combinacoes',()=>{
 for(let b=0;b<6;b++)for(let v=0;v<8;v++){
  const s=scene(b,v);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
  assert.ok(s.calls.filter(c=>c[0]==='fill').length>=6);
 }
});
test('detalhe mineral e campo sem custo no loop de renderizacao',()=>{
 assert.ok(scene(5).calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.ok(!scene(0).calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.equal(scene(4).calls.filter(c=>c[0]==='stroke').length,7);
 const draw=script.slice(script.indexOf('function draw(){'),script.indexOf('function loop('));
 assert.doesNotMatch(draw,/paintTerrainMaterial\(/);
 assert.equal(scene(2,0,-1,76).count,0);
});
