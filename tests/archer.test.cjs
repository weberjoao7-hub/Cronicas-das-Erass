// Archer regression tests: node --test tests/archer.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const section=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing source anchors: '+start);
 return html.slice(a,b);
};
const helpers=section('const isMilitary=','function warriorAutoEngage(){');
const {isMilitary,attackRange,attackDamage}=new Function(helpers+';return {isMilitary,attackRange,attackDamage};')();
const combatCode=section('function combatTurn(){','const key=(x,y)');
const combat=new Function('game','towerShots','refresh','toast','menu','panel','document','key','visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty',combatCode+';combatTurn();');
function battle(kind,x=80.5,y=80.5,moving=false){
 const game={enemy:{x:120,y:120,hp:100},enemyUnits:[{x:83.5,y:80.5,hp:65}],buildings:[],units:[{kind,x,y,hp:100,path:moving?[{x:81.5,y:80.5}]:[]}],claim:[]};
 const shots=[];
 combat(game,shots,()=>{},()=>{},()=>{},{},{getElementById:()=>({})},(x,y)=>x+','+y,()=>true,isMilitary,attackRange,attackDamage,0,false);
 return {game,shots};
}
test('full browser script has valid JavaScript syntax',()=>{
 const source=section('<script>','</script>');
 assert.doesNotThrow(()=>new Function(source));
});
test('archer and warrior are military with different attack profiles',()=>{
 assert.equal(isMilitary('archer'),true);
 assert.equal(isMilitary('warrior'),true);
 assert.equal(isMilitary('worker'),false);
 assert.equal(attackRange('archer'),4.6);
 assert.equal(attackRange('warrior'),1.45);
 assert.equal(attackDamage('archer'),11);
 assert.equal(attackDamage('warrior'),18);
});
test('stationary archer fires at range with a projectile',()=>{
 const {game,shots}=battle('archer');
 assert.equal(game.enemyUnits[0].hp,54);
 assert.equal(shots.length,1);
 assert.equal(shots[0].kind,'archer');
});
test('moving archer must stop before firing',()=>{
 const {game,shots}=battle('archer',80.5,80.5,true);
 assert.equal(game.enemyUnits[0].hp,65);
 assert.equal(shots.length,0);
});
test('warrior cannot hit a distant target',()=>{
 const {game,shots}=battle('warrior');
 assert.equal(game.enemyUnits[0].hp,65);
 assert.equal(shots.length,0);
});
test('archer can be recruited from a completed barracks and spends correct resources',()=>{
 const code=section('function spawnUnit(kind){','function upgradeBuilding(');
 const game={wood:100,food:100,stone:10,ore:20,people:6,army:0,units:[],buildings:[{x:80,y:80,t:'Aldeia'},{x:85,y:85,t:'Quartel'}]};
 const notes=[];
 const at=(x,y)=>game.buildings.find(b=>b.x===x&&b.y===y);
 const spend=(wood,food,stone,ore=0)=>{
  if(game.wood<wood||game.food<food||game.stone<stone||game.ore<ore)return false;
  game.wood-=wood;game.food-=food;game.stone-=stone;game.ore-=ore;return true;
 };
 const recruit=new Function('game','isMilitary','passable','at','refresh','updateVisibility','assignWorkers','toast','spend',code+';return recruitUnit;')(
  game,isMilitary,(x,y)=>x>=0&&y>=0&&x<160&&y<160,at,()=>{},()=>{},()=>{},s=>notes.push(s),spend);
 recruit('archer');
 assert.equal(game.units.length,1);
 assert.equal(game.units[0].kind,'archer');
 assert.ok(Math.hypot(game.units[0].x-85.5,game.units[0].y-85.5)<4);
 assert.deepEqual([game.wood,game.food,game.stone,game.ore],[75,75,10,15]);
 assert.equal(game.army,1);
});
test('archer sprite renders bow geometry on a simulated Canvas',()=>{
 const code=section('function drawUnitSprite(','// Rede viária derivada');
 let bows=0,ops=0;
 const ctx=new Proxy({},{
  get:(obj,key)=>obj[key]||((...args)=>{ops++;if(key==='quadraticCurveTo')bows++;}),
  set:(obj,key,value)=>{obj[key]=value;return true}
 });
 const draw=new Function('ctx','biome',code+';return drawUnitSprite;')(ctx,()=>2);
 draw({kind:'archer',x:80.5,y:80.5,path:[],hp:100},200,220,1,false);
 assert.ok(bows>0,'bow curvature should be drawn');
 assert.ok(ops>20,'sprite should produce visible geometry');
});
test('archers are available in both recruitment menus and army formations',()=>{
 assert.match(html,/id="recruitArcher"/);
 assert.match(html,/id="trainArcher"/);
 assert.match(html,/isMilitary\(u\.kind\)&&u\.hp>0/);
 assert.match(html,/shot\.kind==='archer'/);
});
