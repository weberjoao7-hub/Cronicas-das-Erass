'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script');
const a=script.indexOf("let roadSignature=''");
const b=script.indexOf('// Caminhos isométricos:',a);
const c=script.indexOf('function drawRoad(');
const d=script.indexOf('// Praça central',c);
assert.ok(a>0&&b>a&&c>b&&d>c,'road cache and renderer');
const cache=script.slice(a,b),renderer=script.slice(c,d);
const key=(x,y)=>x+','+y;
function roads(buildings,routeFor){
 const game={buildings};
 const api=new Function('game','key','routeFor','biome',cache+
  ';return {updateRoads,read:()=>({tiles:roadTiles,links:roadLinks,lanterns:roadLanternSet})};')(
   game,key,routeFor,()=>2);
 api.updateRoads();return {game,api,...api.read()};
}
function scene(links,ww=74){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite Canvas coordinates');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;return true}});
 const palettes=[{edge:'#30291d',base:'#795d3c',top:'#b89461',joint:'#e6c58a',gravel:'#dfbc83',hub:'#b18c5e',kind:'dirt'}];
 const draw=new Function('ctx','roadTiles','roadLinks','key','game','rnd','drawWinterRoadSnow','ROAD_STYLES',
  renderer+';return drawRoad;')(ctx,new Set(links.keys()),links,key,{era:0},
   ()=>.5,()=>{},palettes);
 draw(180,220,ww,ww*.51,82,82);return calls;
}
const hub={x:80,y:80,t:'Aldeia'};
test('v6.89: script compiles and legacy save remains untouched',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(cache,/localStorage|save\(\)|game\.claim/);
});
test('diagonal A* routes generate reciprocal 8-way road connections',()=>{
 const r=roads([hub,{x:84,y:84,t:'Cabana'}],
  ()=>[81,82,83,84].map(n=>({x:n+.5,y:n+.5})));
 assert.deepEqual(r.links.get('80,80'),[[1,1]]);
 assert.deepEqual(r.links.get('82,82'),[[-1,-1],[1,1]]);
 assert.deepEqual(r.links.get('84,84'),[[-1,-1]]);
 assert.equal(r.tiles.size,5);
});
test('adjacent but unrelated paths never become false junctions',()=>{
 const r=roads([hub,{x:82,y:80,t:'Cabana'},{x:80,y:82,t:'Fazenda'}],
  (_u,x,y)=>x===82?[{x:81.5,y:80.5},{x:82.5,y:80.5}]:
   [{x:80.5,y:81.5},{x:80.5,y:82.5}]);
 assert.ok(r.tiles.has('81,80')&&r.tiles.has('80,81'));
 assert.deepEqual(r.links.get('81,80'),[[-1,0],[1,0]]);
 assert.deepEqual(r.links.get('80,81'),[[0,-1],[0,1]]);
});
test('shared edges are deduplicated and roads update after construction',()=>{
 const b1={x:83,y:83,t:'Cabana',buildLeft:10},b2={x:84,y:84,t:'Fazenda'};
 const r=roads([hub,b1,b2],(_u,x,y)=>Array.from({length:x-80},(_,i)=>({x:81.5+i,y:81.5+i})));
 assert.equal(r.api.read().links.get('82,82').length,2);
 b1.buildLeft=0;r.api.updateRoads();
 assert.equal(r.api.read().links.get('82,82').length,2);
 assert.ok(r.api.read().tiles.has('83,83'));
});
test('diagonal segments are rendered as continuous isometric strokes',()=>{
 const r=roads([hub,{x:84,y:84,t:'Cabana'}],
  ()=>[81,82,83,84].map(n=>({x:n+.5,y:n+.5})));
 const calls=scene(r.links);
 assert.ok(calls.filter(c=>c[0]==='stroke').length>=6);
 assert.ok(calls.some(c=>c[0]==='lineTo'&&Math.abs(c[1]-180)<.001&&Math.abs(c[2]-220)>1),
  'diagonal x=y projects onto vertical isometric axis');
});
test('LOD reduces diagonal road detail and isolated tiles stay empty',()=>{
 const r=roads([hub,{x:84,y:84,t:'Cabana'}],
  ()=>[81,82,83,84].map(n=>({x:n+.5,y:n+.5})));
 const close=scene(r.links,74),far=scene(r.links,20);
 assert.ok(far.length<close.length*.6);
 assert.equal(scene(new Map([['82,82',[]]])).length,0);
});
