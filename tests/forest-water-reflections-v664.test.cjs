'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=html.indexOf('function drawForestWaterReflections(');
const end=html.indexOf('function drawShoreFoam(',start);
assert.ok(start>0&&end>start);
const art=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(forestNeighbors=[]){
 const calls=[],ctx={};
 for(const name of ['save','restore','beginPath','moveTo','lineTo','closePath','clip','quadraticCurveTo','stroke']){
  ctx[name]=(...args)=>calls.push([name,...args]);
 }
 const neighbors=new Set(forestNeighbors.map(p=>p.join(',')));
 const biome=(x,y)=>neighbors.has([x,y].join(','))?3:1;
 const draw=new Function('ctx','biome','rnd',art+';return drawForestWaterReflections')(ctx,biome,rnd);
 return {draw,calls};
}
const strokes=s=>s.calls.filter(c=>c[0]==='stroke').length;
test('v6.64 mantém sintaxe, salvamento e ordem de camadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(html,/drawCoast\([^\n]*drawForestWaterReflections\([^\n]*drawShoreFoam\(/);
});
test('reflexos apenas em margens adjacentes a florestas',()=>{
 const noForest=scene();noForest.draw(200,160,72,36,20,30,15,1000);
 assert.equal(strokes(noForest),0);
 const forest=scene([[19,30]]);forest.draw(200,160,72,36,20,30,1,1000);
 assert.equal(strokes(forest),16);
 const wrongMask=scene([[19,30]]);wrongMask.draw(200,160,72,36,20,30,2,1000);
 assert.equal(strokes(wrongMask),0);
});
test('quatro orientações costeiras e LOD do Safari',()=>{
 const s=scene([[19,30],[20,29],[21,30],[20,31]]);
 s.draw(200,160,72,36,20,30,15,1000);
 assert.equal(strokes(s),64);
 const small=scene([[19,30],[20,29],[21,30],[20,31]]);
 small.draw(200,160,40,20,20,30,15,1000);
 assert.equal(strokes(small),16);
 const tiny=scene([[19,30],[20,29],[21,30],[20,31]]);
 tiny.draw(200,160,25,13,20,30,15,1000);
 assert.equal(strokes(tiny),0);
});
test('traços finitos e determinísticos por instante',()=>{
 const a=scene([[19,30]]),b=scene([[19,30]]);
 a.draw(200,160,72,36,20,30,1,1500);
 b.draw(200,160,72,36,20,30,1,1500);
 assert.deepEqual(a.calls,b.calls);
 for(const call of a.calls)for(const value of call.slice(1))assert.ok(Number.isFinite(value));
 assert.equal(a.calls.filter(c=>c[0]==='clip').length,1);
});
