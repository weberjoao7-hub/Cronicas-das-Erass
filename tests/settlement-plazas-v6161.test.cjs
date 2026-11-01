'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline game script exists');
const start=script.indexOf('function drawSettlementPlaza(');
const end=script.indexOf('function drawBuildingApproach(',start);
assert.ok(start>0&&end>start,'plaza renderer is isolatable');
const source=script.slice(start,end);
function render(ww=80,era=4,season=1,rain=0,links=[[1,0],[0,1],[-1,0]]){
 const ops=[],ctx=new Proxy({},{
  get(target,prop){return (...args)=>{ops.push([prop,...args])}},
  set(target,prop,value){ops.push(['set',prop,value]);return true}
 });
 const draw=new Function('ctx',source+'return drawSettlementPlaza;')(ctx);
 return {count:draw(120,100,ww,ww*.514,10,10,links,era,season,rain),ops};
}
const hasColor=(ops,color)=>ops.some(o=>o[0]==='set'&&o[2]===color);

test('script parses and junction decorations do not alter saves or movement',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(script,/if\(links\.length>=3\)drawSettlementPlaza\(px,py,ww,hh,x,y,links,era,season,rain\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|passable\(|routeFor\(/);
});
test('two-link paths and distant zoom skip plaza work',()=>{
 assert.equal(render(80,4,1,0,[[1,0],[-1,0]]).count,0);
 assert.equal(render(53).count,0);
 assert.deepEqual(render(40).ops,[]);
 assert.equal(render(80,4,1,0,null).count,0);
});
test('junction has a grounded ring, cobbled radial seams and bounded LOD',()=>{
 const near=render(80),far=render(60);
 assert.equal(near.count,12);
 assert.equal(far.count,8);
 assert.ok(near.ops.filter(o=>o[0]==='ellipse').length>=14);
 assert.ok(near.ops.filter(o=>o[0]==='stroke').length>=13);
 assert.equal(near.ops.filter(o=>o[0]==='save').length,1);
 assert.equal(near.ops.filter(o=>o[0]==='restore').length,1);
});
test('tribal, medieval and industrial plazas use distinct period materials',()=>{
 assert.ok(hasColor(render(80,0).ops,'#71543b'));
 assert.ok(hasColor(render(80,4).ops,'#886c4d'));
 assert.ok(hasColor(render(80,7).ops,'#496a69'));
});
test('snow settles on rim, rain glints and clear weather stays dry',()=>{
 assert.ok(hasColor(render(80,4,3,0).ops,'#e6eee6d9'));
 assert.ok(hasColor(render(80,4,1,.75).ops,'#d7e9e0b8'));
 assert.ok(!hasColor(render(80,4,1,0).ops,'#d7e9e0b8'));
 assert.ok(!hasColor(render(80,4,3,.75).ops,'#d7e9e0b8'));
});
test('plaza rendering is deterministic for identical inputs',()=>{
 assert.deepEqual(render(80,5,2,.5),render(80,5,2,.5));
 assert.equal(render(80,5,1,0,[[1,0],[0,1],[-1,0],[0,-1]]).count,12);
});
