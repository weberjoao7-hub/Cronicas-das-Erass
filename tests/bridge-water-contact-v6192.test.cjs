'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const start=script.indexOf('function drawBridgeWaterContact(');
const end=script.indexOf(" function drawBridge(",start);
assert.ok(start>=0&&end>start,'bridge contact helper');
const source=script.slice(start,end);
function scene({ww=74,hh=34,axis='x',era=3,progress=1,now=1000,season=1}={}){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite '+k);
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['style',k,v]);return true}
 });
 const draw=new Function('ctx',source+'return drawBridgeWaterContact;')(ctx);
 return {ripples:draw(120,130,ww,hh,axis,era,progress,now,season),calls};
}
test('v6.192: script parseable and existing save key preserved',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|requestAnimationFrame/);
 assert.match(html,/<title>Crônicas das Eras v6\.192<\/title>/);
});
test('bridge ripples use LOD and disappear under winter ice or early construction',()=>{
 assert.equal(scene().ripples,9);
 assert.equal(scene({ww:43}).ripples,4);
 for(const args of [{ww:20},{season:3},{progress:.2},{hh:0}])
  assert.deepEqual(scene(args),{ripples:0,calls:[]});
});
test('wood, stone and metal produce distinct contact materials',()=>{
 const color=era=>scene({era}).calls.filter(c=>c[0]==='style'&&c[1]==='strokeStyle').map(c=>c[2]);
 assert.notDeepEqual(color(0),color(3));
 assert.notDeepEqual(color(3),color(7));
});
test('both bridge axes project water contact differently',()=>{
 const ellipses=axis=>scene({axis}).calls.filter(c=>c[0]==='ellipse');
 assert.notDeepEqual(ellipses('x'),ellipses('y'));
 assert.equal(ellipses('x').length,9);
});
test('deterministic animation and finite coordinates with balanced Canvas',()=>{
 const a=scene(),b=scene();
 assert.deepEqual(a,b);
 assert.equal(a.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(a.calls.filter(c=>c[0]==='restore').length,1);
 assert.ok(a.calls.length<80);
 assert.notDeepEqual(a.calls,scene({now:5000}).calls);
});
test('bridge contact is drawn before bridge deck and Safari has viewport fallbacks',()=>{
 const bridge=script.slice(end,script.indexOf('function drawBridgeEngineering(',end));
 assert.ok(bridge.includes('drawBridgeWaterContact(px,py,ww,hh,axis,stage,complete,Date.now(),forestSeason());'));
 assert.ok(bridge.indexOf('drawBridgeWaterContact(')<bridge.indexOf('const count=9,laid='));
 assert.match(html,/height:100vh;height:100dvh/);
 assert.match(html,/max-height:55vh;max-height:55dvh/);
});
