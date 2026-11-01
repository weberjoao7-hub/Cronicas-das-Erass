'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline RTS script exists');
const begin=script.indexOf('function collectSettlementPaths(');
const end=script.indexOf('// Piso assentado no mesmo plano',begin);
assert.ok(begin>0&&end>begin,'isolated settlement route generator exists');
const source=script.slice(begin,end);
const key=(x,y)=>x+','+y;
const collect=new Function('key',source+'return collectSettlementPaths;')(key);
const house=(x,y,extra={})=>({x,y,t:'Cabana',...extra});
const buildings=(...items)=>new Map(items.map(b=>[key(b.x,b.y),b]));

test('main game remains valid JavaScript and save format stays unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|routeFor\(/);
});

test('same buildings and roads reuse exactly one pedestrian network',()=>{
 const structures=buildings(house(10,10),house(12,10)),roads=new Set();
 let terrainCalls=0;
 const land=()=>{terrainCalls++;return 2};
 const first=collect(structures,roads,land),count=terrainCalls;
 assert.deepEqual(first.get('11,10'),[[1,0],[-1,0]]);
 assert.strictEqual(collect(structures,roads,land),first);
 assert.equal(terrainCalls,count,'no second BFS/terrain scan on unchanged frame');
 assert.equal(collect.cache.paths,first);
});

test('construction completion and building demolition invalidate cached routes',()=>{
 const left=house(10,10),right=house(12,10,{buildLeft:5});
 const structures=buildings(left,right),roads=new Set(),land=()=>2;
 const pending=collect(structures,roads,land);
 assert.equal(pending.size,0);
 right.buildLeft=0;
 const ready=collect(structures,roads,land);
 assert.notStrictEqual(ready,pending);
 assert.deepEqual(ready.get('11,10'),[[1,0],[-1,0]]);
 structures.delete('12,10');
 assert.equal(collect(structures,roads,land).size,0);
});

test('road edits invalidate even if the road set retains the same size',()=>{
 const structures=buildings(house(10,10)),roads=new Set(['15,10']),land=()=>2;
 const near=collect(structures,roads,land);
 assert.equal(near.size,4);
 roads.delete('15,10');roads.add('16,10');
 const far=collect(structures,roads,land);
 assert.notStrictEqual(far,near);
 assert.equal(far.size,0);
});

test('changes in terrain evaluator and building type cannot reuse stale paths',()=>{
 const a=house(10,10),b=house(12,10);
 const structures=buildings(a,b),roads=new Set(),land=()=>2,water=()=>0;
 const paved=collect(structures,roads,land);
 assert.equal(paved.size,1);
 assert.equal(collect(structures,roads,water).size,0);
 assert.notStrictEqual(collect(structures,roads,land),paved,'terrain evaluator is part of cache key');
 b.t='Pesqueiro';
 assert.equal(collect(structures,roads,land).size,0);
 b.t='Cabana';
 assert.equal(collect(structures,roads,land).size,1);
});

test('camera and zoom do not enter the cache; only last scene is retained',()=>{
 assert.match(source,/collectSettlementPaths\.cache=\{signature,biomeAt,paths\}/);
 assert.match(script,/const settlementPaths=ww>=38\?collectSettlementPaths\(structures,roadTiles,biome\):new Map\(\)/);
 assert.doesNotMatch(source,/\b(?:scale|zoom|camera|cx|cy|localStorage)\b/);
});
