'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script present');
function sourceBetween(from,to){
 const a=script.indexOf(from),b=script.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'source markers '+from+' '+to);
 return script.slice(a,b);
}
const wind=new Function(sourceBetween('function meadowWindOffset(','function meadowDetails(')+'return meadowWindOffset;')();
function shadowScene(now=1500,ww=74,night=0,dusk=0){
 const calls=[],ctx=new Proxy({},{
  get(obj,key){return key in obj?obj[key]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'finite Canvas '+key);
   calls.push([key,...args]);
  };},
  set(obj,key,value){obj[key]=value;return true;}
 });
 const fn=new Function('ctx','lightLevels','dayClock',sourceBetween('function drawWindmillBladeShadow(','function drawWindmill(')+'return drawWindmillBladeShadow;')(ctx,()=>({night,dusk}),0);
 return {result:fn(120,150,ww,ww*38/74,now),calls};
}
test('v6.110: valid JavaScript and original save preserved',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/finally\{requestAnimationFrame\(loop\)\}/);
});
test('meadow breeze moves tips within tile and remains deterministic',()=>{
 assert.equal(wind(12,23,1000,74),wind(12,23,1000,74));
 assert.notEqual(wind(12,23,1000,74),wind(12,23,3000,74));
 assert.equal(wind(12,23,1000,0),0);
 assert.equal(wind(12,23,NaN,74),0);
 for(let t=0;t<30000;t+=137)for(const width of [36,74,120]){
  const v=wind(17,41,t,width);
  assert.ok(Number.isFinite(v)&&Math.abs(v)<=width*.01500001);
 }
 assert.match(script,/meadowDetails\(px,py,ww,hh,x,y,b,frameTime\)/);
});
test('windmill shadow rotates on ground and respects zoom and night',()=>{
 const near=shadowScene(1000),later=shadowScene(4000);
 assert.equal(near.result,4);
 assert.equal(later.result,4);
 assert.notDeepEqual(near.calls,later.calls);
 assert.equal(shadowScene(1000,35).result,0);
 assert.equal(shadowScene(1000,74,1,1).result,0);
 assert.match(script,/obj\.t==='Moinho'\)drawWindmillBladeShadow\(px,py,ww,hh,frameTime\)/);
});
test('Canvas save/restore and clipping remain balanced',()=>{
 for(const width of [43,54,74,120]){
  const {calls}=shadowScene(2300,width);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
  assert.equal(calls.filter(c=>c[0]==='clip').length,1);
  assert.equal(calls.filter(c=>c[0]==='fill').length,5);
 }
});
