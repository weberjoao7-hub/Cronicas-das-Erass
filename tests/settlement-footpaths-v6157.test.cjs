'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script exists');
const start=script.indexOf('function collectSettlementPaths(');
const end=script.indexOf('function drawBuildingApproach(',start);
assert.ok(start>0&&end>start,'settlement rendering helpers exist');
const source=script.slice(start,end);
const key=(x,y)=>x+','+y;
const collect=new Function('key',source+'return collectSettlementPaths;')(key);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const structures=(...items)=>new Map(items.map(b=>[key(b.x,b.y),b]));
function scene(links=[[1,0],[-1,0]],era=4,season=1,ww=80,rain=0){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k+' received '+v);
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd',source+'return drawSettlementFootpath;')(ctx,rnd);
 return {count:draw(120,180,ww,ww*.51,11,10,links,era,season,rain),calls,styles};
}
test('whole game parses and save key is unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|\.push\(\s*\{/);
});
test('pedestrian paving joins two finished houses but never an isolated house',()=>{
 const both=collect(structures({x:10,y:10,t:'Cabana'},{x:12,y:10,t:'Cabana'}),new Set(),()=>2);
 assert.deepEqual(both.get('11,10'),[[1,0],[-1,0]]);
 assert.equal(collect(structures({x:10,y:10,t:'Cabana'}),new Set(),()=>2).size,0);
 assert.equal(collect(structures({x:10,y:10,t:'Cabana',buildLeft:3},{x:12,y:10,t:'Cabana'}),new Set(),()=>2).size,0);
});
test('paths also join a completed building to a real road without replacing it',()=>{
 const roads=new Set(['12,10']);
 const result=collect(structures({x:10,y:10,t:'Cabana'}),roads,()=>2);
 assert.equal(result.get('11,10').length,2);
 assert.equal(result.has('12,10'),false);
 assert.equal(collect(structures({x:10,y:10,t:'Cabana'}),new Set(['11,10']),()=>2).size,0);
});
test('no paths on lakes, mountains, buildings or docks',()=>{
 const buildings=structures({x:10,y:10,t:'Cabana'},{x:12,y:10,t:'Cabana'});
 assert.equal(collect(buildings,new Set(),()=>0).size,0);
 assert.equal(collect(buildings,new Set(),()=>5).size,0);
 assert.equal(collect(structures({x:10,y:10,t:'Pesqueiro'},{x:12,y:10,t:'Cabana'}),new Set(),()=>2).size,0);
});
test('perspective geometry is finite, deterministic and canvas state is balanced',()=>{
 const a=scene(),b=scene();
 assert.deepEqual(a,b);
 assert.equal(a.count,2);
 assert.ok(a.calls.some(c=>c[0]==='lineTo'));
 assert.ok(a.calls.some(c=>c[0]==='ellipse'));
 assert.equal(a.calls.filter(c=>c[0]==='save').length,a.calls.filter(c=>c[0]==='restore').length);
});
test('era, winter, rain and mobile LOD change visual detail without entities',()=>{
 assert.notDeepEqual(scene(undefined,1).styles,scene(undefined,7).styles);
 assert.ok(scene(undefined,4,3).styles.includes('#e6eee4bb'));
 assert.ok(scene(undefined,4,1,80,.7).styles.includes('#d1ded086'));
 assert.equal(scene(undefined,4,1,30).count,0);
 assert.ok(scene(undefined,4,1,80).calls.length>scene(undefined,4,1,40).calls.length);
});
test('paths are drawn only on visible, unoccupied, non-ruin terrain',()=>{
 assert.match(script,/const settlementPaths=ww>=38\?collectSettlementPaths\(structures,roadTiles,biome\):new Map\(\)/);
 assert.match(script,/visibleFog\[y\*W\+x\]&&!ruinKind&&settlementPaths\.has\(key\(x,y\)\)/);
 assert.match(script,/const orchardOpen=\(b===1\|\|b===2\)&&!settlementPaths\.has/);
 assert.match(script,/const fieldOakOpen=b===2&&visibleFog\[y\*W\+x\]&&!settlementPaths\.has/);
});
