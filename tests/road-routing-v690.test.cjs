'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const navigation=script.slice(script.indexOf('function passable(x,y){'),script.indexOf('// Seleção pelo desenho visível'));
const movement=script.slice(script.indexOf('function unitTravelSpeed('),script.indexOf('function loop('));
const key=(x,y)=>x+','+y;
function scene(roads=[]){
 const tiles=new Set(roads.map(([x,y])=>key(x,y))),links=new Map();
 for(const [x,y] of roads){const adj=[];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(tiles.has(key(x+dx,y+dy)))adj.push([dx,dy]);links.set(key(x,y),adj)}
 const api=new Function('game','biome','W','H','roadTiles','roadLinks','key',navigation+movement+'return {routeFor,unitTravelSpeed};')({buildings:[]},()=>2,14,5,tiles,links,key);
 return {...api,tiles,links};
}
test('v6.90: script compiles and save format remains unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.90<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('A* prefers an established road over the direct unpaved corridor',()=>{
 const s=scene(Array.from({length:11},(_,i)=>[i+1,1]));
 assert.ok(s.routeFor({x:.5,y:2.5},12,2).some(p=>p.y===1.5));
 assert.deepEqual(s.routeFor({x:.5,y:2.5},12,2).at(-1),{x:12.5,y:2.5});
});
test('road generation disables road preference to avoid recursive feedback',()=>{
 const s=scene(Array.from({length:11},(_,i)=>[i+1,1]));
 assert.ok(s.routeFor({x:.5,y:2.5},12,2,false).every(p=>p.y===2.5));
 assert.match(script,/routeFor\(\{x:hub\.x\+\.5,y:hub\.y\+\.5\},b\.x,b\.y,false\)/);
});
test('without roads A* remains unchanged and rejects inaccessible targets',()=>{
 const s=scene();
 assert.ok(s.routeFor({x:.5,y:2.5},12,2).every(p=>p.y===2.5));
 assert.equal(s.routeFor({x:.5,y:2.5},-1,2),null);
});
test('adjacent roads without a real link cannot bias A* routing',()=>{
 const s=scene(Array.from({length:11},(_,i)=>[i+1,1]));
 for(const id of s.links.keys())s.links.set(id,[]);
 assert.ok(s.routeFor({x:.5,y:2.5},12,2).every(p=>p.y===2.5));
});
test('connected roads boost workers and cavalry by 25 percent',()=>{
 const s=scene([[2,1],[3,1]]);
 assert.equal(s.unitTravelSpeed({kind:'worker',x:2.5,y:1.5},{x:3.5,y:1.5}),1.875);
 assert.equal(s.unitTravelSpeed({kind:'cavalry',x:2.5,y:1.5},{x:3.5,y:1.5}),3.875);
});
test('unconnected or off-road movement receives no bonus',()=>{
 const s=scene([[2,1],[3,1],[2,2]]);
 s.links.set('2,1',[]);
 assert.equal(s.unitTravelSpeed({kind:'worker',x:2.5,y:1.5},{x:3.5,y:1.5}),1.5);
 assert.equal(s.unitTravelSpeed({kind:'archer',x:2.5,y:1.5},{x:2.5,y:3.5}),1.9);
 assert.equal(s.unitTravelSpeed({kind:'cannon',x:2.5,y:3.5},{x:2.5,y:1.5}),1.05);
 assert.match(script,/dt\*unitTravelSpeed\(u,target\)/);
});
