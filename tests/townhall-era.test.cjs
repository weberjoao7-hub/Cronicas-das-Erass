'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script is present');
const start=script.indexOf('function drawTownHallEraDetails(');
const end=script.indexOf('/* Quartel:',start);
assert.ok(start>=0&&end>start,'era architecture renderer exists');
const renderer=script.slice(start,end);
function render(era,ww=74,now=1500){
 const operations=[];
 const ctx=new Proxy({},{get(target,key){
  if(key in target)return target[key];
  return (...args)=>operations.push([key,args,target.fillStyle,target.strokeStyle]);
 },set(target,key,value){target[key]=value;return true}});
 const draw=new Function('ctx','scale',renderer+';return drawTownHallEraDetails;')(ctx,1);
 draw(100,100,ww,ww*.52,era,now);
 return operations;
}
test('complete game script parses after architectural additions',()=>{
 assert.doesNotThrow(()=>new Function(script));
});
test('the primordial settlement has visible supplies and a market awning',()=>{
 const ops=render(0);
 assert.ok(ops.filter(o=>o[0]==='fill').length>=5);
 assert.ok(ops.some(o=>o[0]==='ellipse'));
});
test('the architectural tiers progressively add stonework, towers and clock',()=>{
 const base=render(0),stone=render(2),fort=render(4),industrial=render(6);
 assert.ok(stone.length>base.length);
 assert.ok(fort.length>stone.length);
 assert.ok(industrial.length>fort.length);
 assert.ok(industrial.filter(o=>o[0]==='arc').length>=3);
 assert.equal(fort.filter(o=>o[0]==='arc').length,0);
});
test('level-of-detail skips the town hall overlay when zoomed out',()=>{
 assert.equal(render(6,20).length,0);
 assert.ok(render(6,32).length>0);
 assert.ok(render(6,74).length>render(6,32).length);
});
test('banners and clock are deterministic at a fixed timestamp but animate over time',()=>{
 assert.deepEqual(render(6,74,1500),render(6,74,1500));
 assert.notDeepEqual(render(6,74,1500),render(6,74,3400));
});
test('architectural upgrades are wired only to the player settlement without save migration',()=>{
 assert.match(script,/drawTownHall\(px,py,ww,hh,false\);drawTownHallEraDetails\(px,py,ww,hh,game\.era,frameTime\)/);
 assert.match(script,/drawTownHall\(px,py,ww,hh,true\)/);
 assert.match(script,/cronicas-v04/);
});
