'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
function section(a,b){
 const i=script.indexOf(a),j=script.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'ancoras ausentes: '+a);
 return script.slice(i,j);
}
const code=section('function setRallyPoint(','function upgradeBuilding(');
function setup(){
 const game={wood:100,food:100,stone:100,ore:20,people:10,units:[],buildings:[
  {x:80,y:80,t:'Aldeia'},{x:85,y:85,t:'Quartel'}
 ]};
 const fog=new Uint8Array(160*160).fill(1),notes=[];
 let saved=0;
 const passable=(x,y)=>x>=0&&y>=0&&x<160&&y<160&&!(x===84&&y===84);
 const routeFor=(u,x,y)=>x===90&&y===90?null:[{x:x+.5,y:y+.5}];
 const assignRoute=(u,x,y)=>{const route=routeFor(u,x,y);if(!route)return false;u.path=route;u.tx=x+.5;u.ty=y+.5;return true};
 const spend=(wood,food,stone,ore=0)=>{if(game.wood<wood||game.food<food||game.stone<stone||game.ore<ore)return false;game.wood-=wood;game.food-=food;game.stone-=stone;game.ore-=ore;return true};
 const f=new Function('game','W','H','exploredFog','passable','routeFor','save','at','isMilitary','refresh','updateVisibility','assignWorkers','toast','spend','assignRoute',
  code+';return {setRallyPoint,recruitUnit};')(
  game,160,160,fog,passable,routeFor,()=>saved++,
  (x,y)=>game.buildings.find(b=>b.x===x&&b.y===y),
  k=>k==='warrior'||k==='archer',()=>{},()=>{},()=>{},s=>notes.push(s),spend,assignRoute
 );
 return {game,fog,notes,get saved(){return saved},...f};
}
test('full browser script parses',()=>assert.doesNotThrow(()=>new Function(script)));
test('rally requires explored passable connected ground',()=>{
 const s=setup(),b=s.game.buildings[1];
 assert.equal(s.setRallyPoint(b,88,85),true);
 assert.deepEqual(b.rally,{x:88,y:85});
 assert.equal(s.saved,1);
 assert.equal(s.setRallyPoint(b,90,90),false,'unreachable terrain');
 assert.equal(s.setRallyPoint(b,84,84),false,'blocked terrain');
 assert.equal(s.setRallyPoint(b,-1,85),false,'outside map');
 s.fog[86*160+88]=0;
 assert.equal(s.setRallyPoint(b,88,86),false,'unexplored terrain');
 assert.deepEqual(b.rally,{x:88,y:85},'failed command must preserve previous rally');
});
test('new warriors and archers follow barracks rally, workers follow town hall rally',()=>{
 const s=setup(),b=s.game.buildings[1],town=s.game.buildings[0];
 assert.equal(s.setRallyPoint(b,88,85),true);
 assert.equal(s.setRallyPoint(town,82,80),true);
 s.recruitUnit('warrior');s.recruitUnit('archer');s.recruitUnit('worker');
 assert.deepEqual(s.game.units.map(u=>u.kind),['warrior','archer','worker']);
 assert.deepEqual(s.game.units.map(u=>u.path[0].x),[88.5,88.5,82.5]);
 assert.deepEqual(s.game.units.map(u=>u.path[0].y),[85.5,85.5,80.5]);
});
test('training without rally remains valid for legacy saves',()=>{
 const s=setup();s.recruitUnit('archer');
 assert.equal(s.game.units.length,1);
 assert.deepEqual(s.game.units[0].path,[]);
 assert.equal(s.game.units[0].kind,'archer');
});
test('rally flags render only when currently visible and respect fog',()=>{
 const source=section('function drawRallyMarkers(','// Ordens de movimento renderizadas');
 const ops=[],ctx=new Proxy({},{
  get(obj,k){if(k in obj)return obj[k];return (...args)=>ops.push([k,args])},
  set(obj,k,v){obj[k]=v;return true}
 });
 const game={buildings:[{x:80,y:80,t:'Quartel',rally:{x:85,y:85}}]};
 const fog=new Uint8Array(160*160);
 const draw=new Function('game','visibleFog','W','H','ctx','point','scale','w','h','selected','visibleAt',
  source+';return drawRallyMarkers;')(
  game,fog,160,160,ctx,(x,y)=>[x*2,y*2],1,500,500,null,()=>true
 );
 draw(1000);assert.equal(ops.length,0,'hidden rally must not be drawn');
 fog[85*160+85]=1;draw(1000);
 assert.ok(ops.some(op=>op[0]==='quadraticCurveTo'),'animated pennant must be drawn');
 assert.ok(ops.some(op=>op[0]==='ellipse'),'ground marker must be drawn');
});
