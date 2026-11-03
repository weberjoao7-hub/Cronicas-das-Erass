'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script available');
const start=script.indexOf('function unitCrowdOffset(');
const end=script.indexOf('function drawTileOccupants(',start);
assert.ok(start>=0&&end>start);
const point=(x,y)=>[(x-y)*37,(x+y)*19];
const {unitCrowdOffset,visualUnitScreenPoint}=new Function('point',
 script.slice(start,end)+'return {unitCrowdOffset,visualUnitScreenPoint};')(point);
const squad=(n=4)=>Array.from({length:n},()=>({x:10.5,y:11.5,hp:100,kind:'warrior',path:[{x:12.5,y:11.5}]}));
const unique=points=>new Set(points.map(p=>p.map(n=>n.toFixed(4)).join(','))).size;
test('v6.196: script parses and the v04 save schema is preserved',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=196);
 assert.doesNotMatch(script.slice(start,end),/Math\.random|localStorage|assignRoute|game\./);
});
test('marching troops sharing a tile get distinct isometric lanes',()=>{
 const units=squad(4),before=JSON.stringify(units);
 const positions=units.map(u=>visualUnitScreenPoint(u,units,1));
 assert.equal(unique(positions),4);
 assert.deepEqual(positions,units.map(u=>visualUnitScreenPoint(u,units,1)));
 assert.equal(JSON.stringify(units),before,'no gameplay state changes');
});
test('lanes follow projected march heading rather than arbitrary screen axes',()=>{
 const units=squad(4);
 const offsets=units.map(u=>unitCrowdOffset(u,units,1));
 const forward=[37,19];
 for(const [dx,dy] of offsets){
  assert.ok(Math.abs(dx*forward[0]+dy*forward[1])<1e-6,'lane is perpendicular to projected travel');
  assert.ok(Math.abs(dx)<=24&&Math.abs(dy)<=24);
 }
});
test('different headings fall back to stable circular spacing',()=>{
 const units=squad(2);
 units[1].path=[{x:8.5,y:11.5}];
 const a=unitCrowdOffset(units[0],units,1);
 const b=unitCrowdOffset(units[1],units,1);
 assert.ok(Math.hypot(...a)>1&&Math.hypot(...b)>1);
 assert.deepEqual(a,unitCrowdOffset(units[0],units,1));
});
test('offsets fade continuously when soldiers diverge or approach tile edges',()=>{
 const units=squad(2);
 const full=Math.hypot(...unitCrowdOffset(units[0],units,1));
 units[1].x+=.13;
 const partial=Math.hypot(...unitCrowdOffset(units[0],units,1));
 assert.ok(partial>0&&partial<full);
 units[1].x=10.5;
 units.forEach(u=>u.x=10.99);
 const edge=Math.hypot(...unitCrowdOffset(units[0],units,1));
 assert.ok(edge>0&&edge<full);
});
test('low zoom, isolated, dead and distant actors do not receive displacement',()=>{
 const units=squad(2);
 assert.deepEqual(unitCrowdOffset(units[0],units,.6),[0,0]);
 assert.deepEqual(unitCrowdOffset(units[0],[units[0]],1),[0,0]);
 units[1].x+=.25;
 assert.deepEqual(unitCrowdOffset(units[0],units,1),[0,0]);
 units[1].x=units[0].x;units[1].hp=0;
 assert.deepEqual(unitCrowdOffset(units[0],units,1),[0,0]);
});
test('rendering and hit testing share the same visual anchor',()=>{
 assert.match(script,/visualUnitScreenPoint\(u,enemy\?enemyTiles\.get\(key\(x,y\)\):unitTiles\.get\(key\(x,y\)\),z\)/);
 assert.match(script,/pickVisibleUnitIndex\(game\.units,px,py,scale,visualUnitScreenPoint,visibleAt\)/);
 const units=squad(3),point=visualUnitScreenPoint(units[1],units,1);
 assert.ok(point.every(Number.isFinite));
});
