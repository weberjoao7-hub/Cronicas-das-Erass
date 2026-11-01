'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script exists');
const start=script.indexOf('function drawSettlementLandmark(');
const end=script.indexOf('function drawBuildingApproach(',start);
assert.ok(start>0&&end>start,'landmark renderer can be isolated');
const source=script.slice(start,end);
function render(era=4,ww=90,season=1,now=2000,links=[[1,0],[0,1],[-1,0]]){
 const ops=[],ctx=new Proxy({},{
  get(_,name){return (...args)=>{ops.push([name,...args]);}},
  set(_,name,value){ops.push(['set',name,value]);return true}
 });
 const draw=new Function('ctx',source+'return drawSettlementLandmark;')(ctx);
 return {count:draw(100,120,ww,ww*.51,12,16,links,era,season,now),ops};
}
const color=(ops,c)=>ops.some(o=>o[0]==='set'&&o[2]===c);
test('inline game script remains valid and the landmark is integrated into visible junctions',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/drawSettlementLandmark\(px,py,ww,hh,x,y,pathLinks,game\.era,forestSeason\(\),frameTime\)/);
 assert.match(script,/visibleFog\[y\*W\+x\]/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|passable\(|routeFor\(/);
});
test('far zoom, invalid geometry and non-junction paths do not draw',()=>{
 assert.equal(render(4,65).count,0);
 assert.deepEqual(render(4,65).ops,[]);
 assert.equal(render(4,90,1,2000,[[1,0],[-1,0]]).count,0);
 assert.equal(render(4,90,1,2000,null).count,0);
});
test('ceremonial fire, stone well, medieval roof and public fountain differ by era',()=>{
 assert.ok(color(render(0).ops,'#f1a547'));
 assert.ok(color(render(2).ops,'#776e60'));
 assert.ok(color(render(4).ops,'#a36d49'));
 assert.ok(color(render(7).ops,'#a6e0e5c9'));
});
test('seasonal snow settles on stone and firepit without altering persistent state',()=>{
 assert.ok(color(render(4,90,3).ops,'#edf2e6df'));
 assert.ok(color(render(0,90,3).ops,'#e5eae0b8'));
 assert.ok(!color(render(4,90,1).ops,'#edf2e6df'));
});
test('animations change with time but fixed inputs render deterministically',()=>{
 assert.deepEqual(render(7,90,1,1000),render(7,90,1,1000));
 assert.notDeepEqual(render(7,90,1,1000),render(7,90,1,1700));
 assert.notDeepEqual(render(0,90,1,1000),render(0,90,1,1700));
});
test('canvas state is balanced and drawing work is bounded on Safari',()=>{
 for(const era of [0,2,4,7]){
  const r=render(era);
  assert.equal(r.count,1);
  assert.equal(r.ops.filter(o=>o[0]==='save').length,1);
  assert.equal(r.ops.filter(o=>o[0]==='restore').length,1);
  assert.ok(r.ops.length<190);
 }
});
