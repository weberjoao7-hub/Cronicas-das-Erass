'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const cache=script.slice(script.indexOf('// v6.70: profundidade'),script.indexOf('const colors=',script.indexOf('// v6.70: profundidade')));
const source=script.slice(script.indexOf('function drawLakeDepth('),script.indexOf('function drawForestWaterReflections('));
assert.ok(cache.includes('waterDepth')&&source.includes('function drawLakeDepth'));
function depthMap(){
 const W=7,H=7,terrain=new Uint8Array(W*H).fill(2),shoreMask=new Uint8Array(W*H);
 for(let y=1;y<=5;y++)for(let x=1;x<=5;x++){
  const i=y*W+x;terrain[i]=0;
  if(x===1||x===5||y===1||y===5)shoreMask[i]=1;
 }
 return new Function('W','H','terrain','shoreMask','seamDirs',cache+';return waterDepth')(W,H,terrain,shoreMask,[[0,-1],[1,0],[0,1],[-1,0]]);
}
function paint(depth,ww=74,q=.95,night=0,now=5000){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));calls.push([k,...args])}},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const diamond=(...args)=>calls.push(['diamond',ctx.globalAlpha,...args]);
 const fn=new Function('ctx','diamond','lightLevels','dayClock','scale',source+';return drawLakeDepth')(ctx,diamond,()=>({night}),60,1);
 return {calls,drawn:fn(100,100,ww,ww/2,depth,q,now)};
}
test('v6.70: sintaxe, salvamento e ordem de camadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.(?:7[0-9]|[89][0-9])<\/title>/);
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 const a=script.indexOf('if(b===0)drawLakeDepth('),b=script.indexOf('if(b===0&&shoreMask',a);
 assert.ok(a>0&&b>a);
});
test('BFS: terra 0, margem 1, segunda camada 2 e centro 3',()=>{
 const d=depthMap();
 assert.equal(d[0],0);assert.equal(d[1*7+3],1);
 assert.equal(d[2*7+3],2);assert.equal(d[3*7+3],3);
});
test('água profunda escurece mais e a margem não é sobreposta',()=>{
 assert.equal(paint(1).drawn,0);assert.equal(paint(5,20).drawn,0);
 const shallow=paint(2),deep=paint(7);
 assert.equal(shallow.drawn,1);
 assert.ok(deep.calls.find(c=>c[0]==='diamond')[1]>shallow.calls.find(c=>c[0]==='diamond')[1]);
});
test('reflexos solares respeitam noite, LOD e tempo',()=>{
 const sunny=paint(5),night=paint(5,74,.95,1),small=paint(5,38);
 assert.equal(sunny.calls.filter(c=>c[0]==='stroke').length,2);
 assert.equal(night.calls.filter(c=>c[0]==='stroke').length,0);
 assert.equal(small.calls.filter(c=>c[0]==='stroke').length,0);
 assert.deepEqual(sunny.calls,paint(5).calls);
 assert.notDeepEqual(sunny.calls,paint(5,74,.95,0,6000).calls);
});
test('nenhuma alteração de economia, caminhos ou salvamento',()=>{
 for(const token of ['localStorage','game.','passable(','routeFor(','assignRoute(']){
  assert.ok(!source.includes(token));assert.ok(!cache.includes(token));
 }
});
