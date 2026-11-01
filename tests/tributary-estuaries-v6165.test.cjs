'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline RTS script exists');
const begin=script.indexOf('const tributaryMask=new Uint8Array(W*H)');
const end=script.indexOf('let game=',begin);
const source=script.slice(begin,end);
const terrainSource=script.slice(script.indexOf('const rnd='),script.indexOf('// Máscaras de margem'));
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
const makeNetwork=()=>new Function('W','H','seamDirs',terrainSource+source+'return {terrain,tributaryMask,tributaryMouthMask,tributaryCount};')(160,160,dirs);
const drawStart=script.indexOf('function drawTributaryEstuary(');
const drawEnd=script.indexOf('function drawTributary(',drawStart);
assert.ok(drawStart>0&&drawEnd>drawStart,'estuary painter isolated');
const drawSource=script.slice(drawStart,drawEnd);
function paint(mask=5,width=80,season=1,now=1000){
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite Canvas geometry');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const draw=new Function('ctx',drawSource+'return drawTributaryEstuary;')(ctx);
 return {count:draw(100,120,width,width*.51,12,18,mask,season,now),calls};
}
test('v6.165 keeps valid JS and existing persistent game format',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source+drawSource,/localStorage|Math\.random|game\.buildings|game\.units|passable\(/);
});
test('all 24 land streams end at reciprocal lake mouths, deterministically',()=>{
 const a=makeNetwork(),b=makeNetwork();
 assert.equal(a.tributaryCount,24);
 assert.deepEqual(a.tributaryMouthMask,b.tributaryMouthMask);
 let count=0,tiles=0;
 for(let i=0;i<a.tributaryMouthMask.length;i++){
  const flags=a.tributaryMouthMask[i];if(!flags)continue;
  tiles++;assert.equal(a.terrain[i],0,'mouth belongs to lake');
  const x=i%160,y=Math.floor(i/160);
  for(let d=0;d<4;d++)if(flags&(1<<d)){
   count++;const [dx,dy]=dirs[d],adjacent=(y+dy)*160+x+dx;
   assert.ok(a.terrain[adjacent]>=1,'bank is land');
   assert.ok(a.tributaryMask[adjacent]&(1<<((d+2)%4)),'reciprocal channel edge');
  }
 }
 assert.equal(count,24);assert.ok(tiles>0&&tiles<=24);
});
test('LOD and invalid masks skip expensive Canvas work',()=>{
 assert.deepEqual(paint(0).calls,[]);
 assert.deepEqual(paint(5,30).calls,[]);
 assert.equal(paint(1,80).count,1);
 assert.equal(paint(5,80).count,2);
});
test('water mouths are clipped, layered and preserve Canvas state',()=>{
 const {calls}=paint();
 assert.equal(calls.filter(x=>x[0]==='save').length,1);
 assert.equal(calls.filter(x=>x[0]==='restore').length,1);
 assert.equal(calls.filter(x=>x[0]==='clip').length,1);
 assert.ok(calls.some(x=>x[0]==='quadraticCurveTo'));
 assert.ok(calls.some(x=>x[0]==='set'&&x[2]==='#b4a47785'),'sediment fan');
 assert.ok(calls.length<110,'bounded drawing work for two outlets');
});
test('summer ripples animate while winter estuaries remain frozen',()=>{
 assert.notDeepEqual(paint(5,80,1,1000),paint(5,80,1,3500));
 assert.deepEqual(paint(5,80,3,1000),paint(5,80,3,3500));
 assert.ok(paint(5,80,3).calls.some(x=>x[0]==='set'&&x[2]==='#c4d8d6b8'));
});
test('lake mouths render above coast only in currently visible water tiles',()=>{
 const base=script.indexOf('if(b===0)drawLakeDepth(');
 const coast=script.indexOf('if(b===0&&shoreMask[y*W+x]&&ww>20)');
 const mouth=script.indexOf('if(b===0&&tributaryMouthMask[y*W+x]&&visibleFog[y*W+x])drawTributaryEstuary(');
 const details=script.indexOf('if(b===0)drawLakeDetails(',mouth);
 assert.ok(base>0&&coast>base&&mouth>coast&&details>mouth);
 assert.match(script.slice(mouth,mouth+250),/forestSeason\(\),frameTime/);
});
