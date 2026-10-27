'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script missing');
function part(start,end){const a=script.indexOf(start),b=script.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return script.slice(a,b)}
const lightSource=part('function smoothstep(','function drawAmbientParticles(');
const visualSource=part('function drawStructureShadow(','function drawBuildingBadge(');
const lightLevels=new Function(lightSource+';return lightLevels;')();
function scene(dayClock=12.5){
 const ops=[],ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>ops.push([k,args,o.fillStyle,o.globalAlpha])},set(o,k,v){o[k]=v;return true}});
 const funcs=new Function('ctx','dayClock','lightLevels',visualSource+';return {drawStructureShadow,drawCampfire};')(ctx,dayClock,lightLevels);
 return {ops,...funcs};
}
test('game script and dynamic visual helpers parse',()=>assert.doesNotThrow(()=>new Function(script)));
test('building shadows include ground contact and a daylight projection',()=>{
 const s=scene();s.drawStructureShadow(100,100,74,38,'Aldeia',1200);
 assert.ok(s.ops.filter(op=>op[0]==='fill').length>=3);
 assert.ok(s.ops.some(op=>op[0]==='ellipse'));
 assert.ok(s.ops.some(op=>op[0]==='lineTo'));
});
test('night and distant zoom omit long projected shadows',()=>{
 const day=scene();day.drawStructureShadow(100,100,74,38,'Torre',1200);
 const night=scene(105);night.drawStructureShadow(100,100,74,38,'Torre',1200);
 const far=scene();far.drawStructureShadow(100,100,20,10,'Torre',1200);
 assert.ok(day.ops.length>night.ops.length);
 assert.ok(day.ops.length>far.ops.length);
 assert.equal(far.ops.filter(op=>op[0]==='fill').length,1);
});
test('campfire has animated layered flames and embers with LOD',()=>{
 const near=scene();near.drawCampfire(100,100,74,38,1200);
 const medium=scene();medium.drawCampfire(100,100,35,18,1200);
 const far=scene();far.drawCampfire(100,100,20,10,1200);
 assert.ok(near.ops.length>medium.ops.length);
 assert.ok(medium.ops.length>0);
 assert.equal(far.ops.length,0);
 assert.ok(near.ops.some(op=>op[0]==='quadraticCurveTo'));
});
test('visual effects are deterministic for a given clock and vary over time',()=>{
 const a=scene(),b=scene(),c=scene();
 a.drawCampfire(100,100,74,38,1200);
 b.drawCampfire(100,100,74,38,1200);
 c.drawCampfire(100,100,74,38,2400);
 assert.deepEqual(a.ops,b.ops);
 assert.notDeepEqual(a.ops,c.ops);
});
test('effects are wired into isometric drawing without changing save keys',()=>{
 assert.match(script,/drawStructureShadow\(px,py,ww,hh,obj\.t,frameTime\)/);
 assert.match(script,/drawCampfire\(px,py,ww,hh,frameTime\)/);
 assert.match(script,/obj\.t==='Aldeia'\|\|obj\.t==='Quartel'/);
 assert.match(script,/cronicas-v04/);
});
