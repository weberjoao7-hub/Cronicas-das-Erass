'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script missing');
const a=script.indexOf('const ROAD_STYLES='),b=script.indexOf('function drawTerritoryEdge(',a);
assert.ok(a>=0&&b>a,'era road palette and square renderer anchors missing');
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(era=1,tiles=['80,80','81,80','80,81']){
 const ops=[],ctx=new Proxy({},{
  get(o,k){if(k in o)return o[k];return (...args)=>ops.push([k,args,o.strokeStyle,o.fillStyle])},
  set(o,k,v){o[k]=v;return true}
 });
 const game={era};
 const renderer=new Function('ctx','roadTiles','key','game','rnd','diamond',
  source+';return {drawRoad,drawVillageSquare};')(
   ctx,new Set(tiles),(x,y)=>x+','+y,game,rnd,
   (...args)=>ops.push(['diamond',args]));
 return {ops,game,...renderer};
}
test('main browser JavaScript parses after road renderer changes',()=>{
 assert.doesNotThrow(()=>new Function(script));
});
test('connected dirt paths render strokes and detail at normal zoom',()=>{
 const s=scene();s.drawRoad(180,220,74,38,80,80);
 assert.ok(s.ops.length>45,'connected roads should have textured geometry');
 assert.ok(s.ops.some(op=>op[0]==='stroke'&&op[2]==='#c3a177'));
});
test('classical era upgrades road surface to stone without altering saves',()=>{
 const s=scene(3);s.drawRoad(180,220,74,38,80,80);
 assert.ok(s.ops.some(op=>op[0]==='stroke'&&op[2]==='#b6ae90'));
 assert.match(html,/cronicas-v04/);
});
test('roads are deterministic and LOD reduces geometry on iPhone zoom',()=>{
 const s=scene();s.drawRoad(180,220,74,38,80,80);
 const full=JSON.stringify(s.ops),fullCount=s.ops.length;
 // The Canvas mock does not implement save()/restore() state, so use a fresh context.
 const repeat=scene();repeat.drawRoad(180,220,74,38,80,80);
 assert.equal(JSON.stringify(repeat.ops),full);
 const distant=scene();distant.drawRoad(180,220,20,10,80,80);
 assert.ok(distant.ops.length<fullCount*.6,'distant road should skip fine stones');
});
test('isolated tile does not render disconnected road',()=>{
 const s=scene(1,['80,80']);s.drawRoad(180,220,74,38,80,80);
 assert.equal(s.ops.length,0);
});
test('town square renders beneath the town hall and respects zoom LOD',()=>{
 const s=scene();s.drawVillageSquare(180,220,74,38,80,80);
 assert.ok(s.ops.some(op=>op[0]==='diamond'));
 const near=s.ops.length;
 s.ops.length=0;s.drawVillageSquare(180,220,18,9,80,80);
 assert.equal(s.ops.length,0);
 assert.ok(near>10);
 assert.match(script,/drawVillageSquare\(px,py,ww,hh,x,y\);drawTownHall/);
});

test('all eight eras have distinct road surfaces and matching LOD',()=>{
 const palettes=[];
 for(let era=0;era<8;era++){
  const s=scene(era);s.drawRoad(180,220,74,38,80,80);
  const strokes=s.ops.filter(op=>op[0]==='stroke').map(op=>op[2]);
  const color=strokes[2]; // first link: border, undercoat, road surface
  assert.ok(color,'surface color is drawn for era '+era);
  palettes.push(color);
  const close=s.ops.length;
  const distant=scene(era);distant.drawRoad(180,220,20,10,80,80);
  assert.ok(distant.ops.length<close*.6,'era '+era+' should use distant LOD');
 }
 assert.equal(new Set(palettes).size,8,'roads should visually progress in every era');
});
test('industrial tracks and contemporary road markings only appear near camera',()=>{
 const industrial=scene(6);industrial.drawRoad(180,220,74,38,80,80);
 assert.ok(industrial.ops.some(op=>op[0]==='stroke'&&op[2]==='#3b4140b8'));
 const contemporary=scene(7);contemporary.drawRoad(180,220,74,38,80,80);
 assert.ok(contemporary.ops.some(op=>op[0]==='stroke'&&op[2]==='#e4ddc19c'));
 const far=scene(7);far.drawRoad(180,220,20,10,80,80);
 assert.ok(!far.ops.some(op=>op[0]==='stroke'&&op[2]==='#e4ddc19c'));
});
