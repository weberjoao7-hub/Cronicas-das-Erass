'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=script.indexOf('function tree('),end=script.indexOf('function oak(',start);
assert.ok(start>=0&&end>start);
const source=script.slice(start,end);
function scene(season=1,zoom=1.2,size=22,now=1200){
 const calls=[],styles=[],methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','quadraticCurveTo','arc']);
 const ctx=new Proxy({},{
  get(o,k){return methods.has(k)?(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'finite geometry');
   calls.push([k,...args]);
  }:o[k]},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','scale','canopySway','forestSeason',source+';return tree;')(
  ctx,zoom,(seed,s,t)=>Math.sin(t*.001+seed)*s*.04,()=>season);
 draw(120,160,size,4,now);
 return {calls,styles};
}
test('v6.197 script compiles without changing the save schema',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(html.includes('Crônicas das Eras v6.197'));
 assert.ok(script.includes('cronicas-v04'));
});
test('pine crowns have volumetric faces at close zoom only',()=>{
 const near=scene(),far=scene(1,.5);
 assert.ok(near.calls.length>far.calls.length*2);
 assert.ok(near.styles.includes('#acd29354'));
 assert.ok(near.styles.includes('#103c2e6b'));
 assert.ok(!far.styles.includes('#acd29354'));
});
test('needle details and pine cones respect zoom and size',()=>{
 const near=scene(),small=scene(1,1.2,9);
 assert.ok(near.styles.includes('#55432d'));
 assert.ok(!small.styles.includes('#55432d'));
 assert.ok(near.calls.filter(c=>c[0]==='stroke').length>small.calls.filter(c=>c[0]==='stroke').length);
});
test('winter snow facets and needles preserve seasonal contrast',()=>{
 const summer=scene(1),winter=scene(3);
 assert.ok(winter.styles.includes('#b4d6c363'));
 assert.ok(winter.styles.includes('#a5c7b5a8'));
 assert.ok(!winter.styles.includes('#55432d'));
 assert.ok(winter.calls.filter(c=>c[0]==='stroke').length>summer.calls.filter(c=>c[0]==='stroke').length);
});
test('trunk shadow stays grounded while crowns sway',()=>{
 const a=scene(1,1.2,22,1200),b=scene(1,1.2,22,2600);
 assert.deepEqual(a.calls.find(c=>c[0]==='ellipse'),b.calls.find(c=>c[0]==='ellipse'));
 assert.notDeepEqual(a.calls.filter(c=>c[0]==='lineTo'),b.calls.filter(c=>c[0]==='lineTo'));
});
test('rendering is deterministic for identical inputs',()=>{
 assert.deepEqual(scene(2,1.2,23,1800),scene(2,1.2,23,1800));
});
