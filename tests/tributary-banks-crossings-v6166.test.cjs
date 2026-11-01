'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawTributaryBanks('),end=script.indexOf('function drawBiomeSeam(',start);
assert.ok(start>0&&end>start);
const source=script.slice(start,end);
function mockPaint(){
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'finite Canvas coordinate');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
 const painters=new Function('ctx','rnd',source+'return {drawTributaryBanks,drawTributaryCrossing};')(ctx,rnd);
 return {calls,...painters};
}
test('v6.166 script compiles and save format stays compatible',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|game\.buildings|Math\.random|passable\(/);
});
test('tributary rocks use clipped isometric ground geometry and balanced Canvas state',()=>{
 const a=mockPaint(),n=a.drawTributaryBanks(100,120,90,45,12,18,5,1);
 assert.ok(n>=2&&n<=16);
 assert.equal(a.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(a.calls.filter(c=>c[0]==='restore').length,1);
 assert.equal(a.calls.filter(c=>c[0]==='clip').length,1);
 assert.ok(a.calls.some(c=>c[0]==='ellipse'));
 assert.ok(a.calls.length<200,'bounded painter work');
});
test('bank stones deterministic and snow recolors rock caps',()=>{
 const a=mockPaint(),b=mockPaint(),c=mockPaint();
 a.drawTributaryBanks(100,120,90,45,12,18,5,1);
 b.drawTributaryBanks(100,120,90,45,12,18,5,1);
 c.drawTributaryBanks(100,120,90,45,12,18,5,3);
 assert.deepEqual(a.calls,b.calls);
 assert.notDeepEqual(a.calls,c.calls);
 assert.ok(c.calls.some(k=>k[0]==='set'&&k[2]==='#e5efea'));
});
test('LOD and empty masks skip tributary decorations',()=>{
 const a=mockPaint();
 assert.equal(a.drawTributaryBanks(100,120,35,18,12,18,5),0);
 assert.equal(a.drawTributaryBanks(100,120,90,45,12,18,0),0);
 assert.equal(a.drawTributaryCrossing(100,120,30,15,12,18,5,[[1,0],[-1,0]]),0);
 assert.equal(a.drawTributaryCrossing(100,120,90,45,12,18,5,[[1,0]]),0);
 assert.equal(a.calls.length,0);
});
test('road bridges have period materials, guardrails and winter snow',()=>{
 const old=mockPaint(),stone=mockPaint(),winter=mockPaint();
 const links=[[1,0],[-1,0]];
 assert.equal(old.drawTributaryCrossing(100,120,90,45,12,18,5,links,0,1),1);
 assert.equal(stone.drawTributaryCrossing(100,120,90,45,12,18,5,links,4,1),1);
 assert.equal(winter.drawTributaryCrossing(100,120,90,45,12,18,5,links,7,3),1);
 assert.ok(old.calls.some(c=>c[0]==='set'&&c[2]==='#b38a55'));
 assert.ok(stone.calls.some(c=>c[0]==='set'&&c[2]==='#b9b5a4'));
 assert.ok(winter.calls.some(c=>c[0]==='set'&&c[2]==='#59666a'));
 assert.ok(winter.calls.some(c=>c[0]==='set'&&c[2]==='#e4eee6c4'));
 for(const p of [old,stone,winter]){
  assert.equal(p.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(p.calls.filter(c=>c[0]==='restore').length,1);
  assert.ok(p.calls.length<140);
 }
});
test('rendering order preserves water under roads and never decorates hidden tiles',()=>{
 const water=script.indexOf('if(tributaryMask[y*W+x]&&b!==0)drawTributary(');
 const banks=script.indexOf('if(tributaryMask[y*W+x]&&b!==0&&!roadTiles.has(key(x,y)))drawTributaryBanks(');
 const road=script.indexOf('if(roadTiles.has(key(x,y)))drawRoad(');
 const bridge=script.indexOf('if(tributaryMask[y*W+x]&&b!==0&&roadTiles.has(key(x,y))&&!structures.has(key(x,y)))drawTributaryCrossing(');
 assert.ok(water>0&&banks>water&&road>banks&&bridge>road);
 assert.match(script.slice(bridge,bridge+250),/roadLinks\.get\(key\(x,y\)\)\|\|\[\]/);
 assert.match(script.slice(water-300,water),/if\(!exploredFog\[y\*W\+x\]\)continue/);
});
