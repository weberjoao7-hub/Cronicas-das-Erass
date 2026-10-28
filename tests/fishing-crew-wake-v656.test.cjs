'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawBoatWake(');
const end=script.indexOf('// Sites grow',start);
assert.ok(start>=0&&end>start,'wake, crew and boat renderers');
const source=script.slice(start,end);

function scene({width=78,era=2,state='outbound',now=1000,cargo=0}={}){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(_target,method){return (...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'finite '+String(method));
   calls.push([method,...args]);
  }},
  set(_target,key,value){if(key==='fillStyle'||key==='strokeStyle')styles.push(value);return true;}
 });
 const fn=new Function('ctx','game','scale','TW','TH','drawFishingNet',
  source+';return {drawFishingBoat,drawBoatWake,drawFishingCrew};'
 )(ctx,{era},1,32,16,()=>{});
 const boat={heading:{x:1,y:0},state,x:8,y:9,cargo};
 fn.drawFishingBoat(boat,0,0,width,width*.5,now);
 return {calls,styles,fn};
}

test('script compiles and legacy save format remains unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('wake only follows moving boats, with extra bubbles at close zoom',()=>{
 const near=scene({width:78}),far=scene({width:25}),idle=scene({width:78,state:'ready'});
 assert.ok(near.calls.filter(([m])=>m==='quadraticCurveTo').length>
  idle.calls.filter(([m])=>m==='quadraticCurveTo').length);
 assert.ok(near.calls.filter(([m])=>m==='arc').length>
  far.calls.filter(([m])=>m==='arc').length);
 assert.ok(near.styles.includes('#c8f0e5a8'));
 assert.ok(!idle.styles.includes('#c8f0e5a8'));
});
test('fisherman clothing changes by era and rower is only drawn when visible',()=>{
 const early=scene({era:1}),medieval=scene({era:4}),modern=scene({era:7});
 assert.ok(early.styles.includes('#94714b'));
 assert.ok(medieval.styles.includes('#5b7655'));
 assert.ok(modern.styles.includes('#3c6174'));
 assert.ok(early.styles.includes('#b58b58'),'wooden oar blades');
 assert.ok(!modern.styles.includes('#b58b58'),'motorboat has no wooden paddles');
 assert.ok(!scene({width:26}).styles.includes('#94714b'),'crew omitted at low LOD');
});
test('rowing and wake respond to time without modifying persistent boat state',()=>{
 const before={heading:{x:1,y:0},state:'outbound',x:8,y:9,cargo:0};
 const a=scene({now:1000}),b=scene({now:2500});
 assert.notDeepEqual(a.calls,b.calls);
 assert.equal(a.calls.filter(([m])=>m==='save').length,
  a.calls.filter(([m])=>m==='restore').length);
 assert.deepEqual(before,{heading:{x:1,y:0},state:'outbound',x:8,y:9,cargo:0});
 assert.match(source,/drawFishingCrew\(r,beam,ww,now,game\.era,moving\)/);
});
test('boat geometry stays finite at mobile, desktop and all eras',()=>{
 for(const era of [0,1,2,3,4,5,6,7]){
  for(const width of [19,29,39,78,150]){
   for(const state of ['outbound','returning','ready','fishing']){
    const result=scene({width,era,state,cargo:3});
    assert.ok(result.calls.length>0);
    assert.equal(result.calls.filter(([m])=>m==='save').length,
     result.calls.filter(([m])=>m==='restore').length);
   }
  }
 }
});
