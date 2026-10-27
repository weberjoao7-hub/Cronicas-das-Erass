// Regression tests: v5.5 bridge construction, passability, A* routes and Canvas rendering.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function between(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'missing source anchors: '+start+' / '+end);
 return html.slice(a,b);
}
const navigation=between('function passable(x,y){','// Seleção pelo desenho visível');
const validation=between('function bridgeAxis(x,y){','function beginPlacement');
const bridgeArt=between('function drawBridge(','function drawConstructionSite(');
function setup(){
 const game={claim:['2,2','3,2','4,2'],buildings:[]};
 const biome=(x,y)=>x>=2&&x<=4?0:2;
 const at=(x,y)=>game.buildings.find(b=>b.x===x&&b.y===y);
 const key=(x,y)=>x+','+y;
 const ownedTile=(x,y)=>game.claim.includes(key(x,y));
 const api=new Function('game','biome','W','H','at','key','ownedTile',
  navigation+validation+';return {passable,routeFor,bridgeAxis,buildValidation};'
 )(game,biome,7,5,at,key,ownedTile);
 return {game,...api};
}
test('lake blocks A* until a complete bridge spans the water',()=>{
 const {game,routeFor,passable}=setup(),start={x:1.5,y:2.5};
 assert.equal(routeFor(start,5,2),null);
 for(const x of [2,3,4])game.buildings.push({x,y:2,t:'Ponte',axis:'x',buildLeft:0});
 const route=routeFor(start,5,2);
 assert.ok(route);
 for(const x of [2,3,4])assert.ok(route.some(p=>Math.floor(p.x)===x));
 assert.equal(passable(3,2),true);
 assert.equal(passable(3,0),false);
});
test('unfinished bridges remain impassable and cannot extend a crossing',()=>{
 const {game,passable,buildValidation}=setup();
 game.buildings.push({x:2,y:2,t:'Ponte',axis:'x',buildLeft:6});
 assert.equal(passable(2,2),false);
 assert.notEqual(buildValidation('Ponte',3,2),null);
 game.buildings[0].buildLeft=0;
 assert.equal(passable(2,2),true);
 assert.equal(buildValidation('Ponte',3,2),null);
});
test('bridge construction requires claimed water connected to a shore or bridge',()=>{
 const {game,bridgeAxis,buildValidation}=setup();
 assert.equal(buildValidation('Ponte',2,2),null);
 assert.equal(buildValidation('Ponte',3,2), 'Construa a ponte a partir de uma margem ou de outra ponte pronta');
 game.claim.push('1,2');
 assert.equal(buildValidation('Ponte',1,2),'Pontes precisam de água');
 assert.equal(bridgeAxis(2,2),'x');
 game.claim=[];
 assert.equal(buildValidation('Ponte',2,2),'Construa dentro de uma região dominada');
});
test('bridge preview, price, menu and old saves remain integrated',()=>{
 assert.match(html,/Ponte:\[45,0,25\]/);
 assert.match(html,/data-t="Ponte"/);
 assert.match(html,/if\(placing==='Ponte'\)drawBridge/);
 assert.match(html,/if\(obj\.t==='Ponte'\)drawBridge/);
 assert.match(html,/cronicas-v04/);
});
test('bridge renderer supports both directions and partial construction',()=>{
 let calls=0;
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','arc']);
 const ctx=new Proxy({},{
  get:(obj,key)=>methods.has(key)?()=>{calls++}:obj[key],
  set:(obj,key,value)=>(obj[key]=value,true)
 });
 const render=new Function('ctx','scale',bridgeArt+
  ";drawBridge(250,160,74,38,'x');drawBridge(250,160,74,38,'y',.5);drawBridge(200,110,25,13,'x',.2);");
 render(ctx,1);
 assert.ok(calls>80,'expected multiple bridge geometry operations');
});
