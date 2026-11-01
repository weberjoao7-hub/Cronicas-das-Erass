'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script exists');
const start=script.indexOf('function buildingApproachDirection(');
const end=script.indexOf('// Piso assentado no mesmo plano do losango;',start);
assert.ok(start>0&&end>start,'isolatable footpath helpers exist');
const source=script.slice(start,end);
const key=(x,y)=>x+','+y;
const {collectSettlementPaths:collect,buildingApproachDirection:direction}=
 new Function('key',source+'return {collectSettlementPaths,buildingApproachDirection};')(key);
const buildings=(...entries)=>new Map(entries.map(b=>[key(b.x,b.y),b]));
const house=(x,y,extra={})=>({x,y,t:'Cabana',...extra});
const land=()=>2;
const sorted=m=>[...m].sort(([a],[b])=>a.localeCompare(b));

test('whole script parses without altering persistence or gameplay pathfinding',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|routeFor\(/);
 assert.match(script,/drawBuildingApproach\(px,py,ww,hh,x,y,obj\.t,game\.era,forestSeason\(\),rainLevel,roadTiles,settlementPaths\)/);
});
test('original one-tile passage between buildings remains unchanged',()=>{
 const paths=collect(buildings(house(10,10),house(12,10)),new Set(),land);
 assert.deepEqual(sorted(paths),[['11,10',[[1,0],[-1,0]]]]);
});
test('a distant road connects through four continuous isometric paving tiles',()=>{
 const paths=collect(buildings(house(10,10)),new Set(['15,10']),land);
 assert.equal(paths.size,4);
 for(let x=11;x<=14;x++)assert.deepEqual(paths.get(key(x,10)),[[1,0],[-1,0]]);
 assert.deepEqual(sorted(paths),sorted(collect(buildings(house(10,10)),new Set(['15,10']),land)));
});
test('BFS bends around water and rock without drawing across invalid terrain',()=>{
 const terrain=(x,y)=>(x===11||x===12)&&y===10?x===11?0:5:2;
 const paths=collect(buildings(house(10,10)),new Set(['13,10']),terrain);
 assert.ok(paths.size>0&&paths.size<=4);
 for(const id of paths.keys()){
  const [x,y]=id.split(',').map(Number);
  assert.equal(terrain(x,y),2);
  assert.ok(paths.get(id).length>=2);
 }
 assert.ok(!paths.has('11,10')&&!paths.has('12,10'));
});
test('never connects overlong routes, unfinished sites or direct adjacent roads',()=>{
 assert.equal(collect(buildings(house(10,10)),new Set(['16,10']),land).size,0);
 assert.equal(collect(buildings(house(10,10)),new Set(['11,10']),land).size,0);
 assert.equal(collect(buildings(house(10,10,{buildLeft:1})),new Set(['15,10']),land).size,0);
 assert.equal(collect(buildings(house(10,10),house(12,10,{buildLeft:1})),new Set(),land).size,0);
 assert.equal(collect(buildings(house(10,10)),new Set(['15,10']),()=>4).size,0);
});
test('entrance follows the first pedestrian tile while real roads take priority',()=>{
 const trails=new Map([['10,11',[[0,-1],[0,1]]]]);
 assert.deepEqual(direction(10,10,new Set(),trails),[0,1]);
 assert.deepEqual(direction(10,10,new Set(['11,10']),trails),[1,0]);
 assert.deepEqual(direction(10,10,new Set(),null),[1,0]);
});
