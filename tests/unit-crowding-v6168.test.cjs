'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script exists');
const start=script.indexOf('function unitCrowdOffset(');
const end=script.indexOf('function drawTileOccupants(',start);
assert.ok(start>0&&end>start,'crowding helpers can be isolated');
const source=script.slice(start,end);
const point=(x,y)=>[(x-y)*37,(x+y)*19];
const {unitCrowdOffset,visualUnitScreenPoint}=
 new Function('point',source+'return {unitCrowdOffset,visualUnitScreenPoint};')(point);
const squad=(count=4)=>Array.from({length:count},()=>({x:10.5,y:11.5,hp:100,kind:'warrior',path:[]}));
test('v6.168 script parses and retains the existing save schema',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|assignRoute|game\./);
});
test('stationary overlapping troops receive distinct ground-anchored screen positions',()=>{
 const units=squad(),original=units.map(u=>({...u}));
 const anchors=units.map(u=>visualUnitScreenPoint(u,units,1));
 assert.equal(new Set(anchors.map(p=>p.map(v=>v.toFixed(4)).join(','))).size,4);
 for(const anchor of anchors)assert.ok(anchor.every(Number.isFinite));
 assert.deepEqual(units,original,'world coordinates and paths are untouched');
 assert.deepEqual(anchors,units.map(u=>visualUnitScreenPoint(u,units,1)),'render is deterministic');
});
test('zoomed-out, isolated and dead troops stay put; marching crowds spread',()=>{
 const units=squad(2);
 assert.deepEqual(unitCrowdOffset(units[0],units,.6),[0,0]);
 assert.deepEqual(unitCrowdOffset(units[0],[units[0]],1),[0,0]);
 units[0].path=[{x:11,y:12}];units[1].path=[{x:11,y:12}];
 assert.ok(Math.hypot(...unitCrowdOffset(units[0],units,1))>1);
 units[0].path=[];units[1].path=[];units[1].hp=0;
 assert.deepEqual(unitCrowdOffset(units[0],units,1),[0,0]);
});
test('only nearby stationary units in the same tile can form a cluster',()=>{
 const units=squad(2);
 units[1].x=11.05;
 assert.deepEqual(unitCrowdOffset(units[0],units,1),[0,0]);
 units[1].x=10.5;units[1].y=11.75;
 assert.deepEqual(unitCrowdOffset(units[0],units,1),[0,0]);
 units[1].y=11.5;
 assert.ok(Math.abs(unitCrowdOffset(units[0],units,1)[0])>1);
});
test('crowds larger than eight use bounded rings and remain deterministic',()=>{
 const units=squad(16);
 const positions=units.map(u=>unitCrowdOffset(u,units,1));
 assert.equal(new Set(positions.map(p=>p.map(n=>n.toFixed(3)).join(','))).size,16);
 for(const [x,y] of positions){
  assert.ok(Math.abs(x)<=24&&Math.abs(y)<=24*.46);
 }
 assert.deepEqual(positions,units.map(u=>unitCrowdOffset(u,units,1)));
});
test('rendering and both desktop and touch selection use matching visual anchors',()=>{
 assert.match(script,/visualUnitScreenPoint\(u,enemy\?enemyTiles\.get\(key\(x,y\)\):unitTiles\.get\(key\(x,y\)\),z\)/);
 assert.match(script,/return pickVisibleUnitIndex\(game\.units,px,py,scale,visualUnitScreenPoint,visibleAt\)/);
 assert.match(script,/function selectGroupInRect\([\s\S]*?visualUnitScreenPoint\(u,game\.units,scale\)/);
 assert.match(script,/function selectVisibleTroops\([\s\S]*?visualUnitScreenPoint\(u,game\.units,scale\)/);
 const units=squad(2),start=script.indexOf('function pickVisibleUnitIndex(');
 const end=script.indexOf('\nfunction selectGroupInRect(',start);
 assert.ok(start>=0&&end>start);
 const factory=new Function('game','scale','visualUnitScreenPoint','visibleAt',
  script.slice(start,end)+'\nreturn pickUnitAtScreen;');
 const pick=factory({units},1,visualUnitScreenPoint,()=>true);
 const [x,y]=visualUnitScreenPoint(units[0],units,1);
 assert.equal(pick(x,y-15*.45),0);
 assert.equal(factory({units},1,visualUnitScreenPoint,()=>false)(x,y-15*.45),-1);
});
