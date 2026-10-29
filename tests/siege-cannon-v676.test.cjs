'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const part=(a,b)=>{const x=script.indexOf(a),y=script.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,a);return script.slice(x,y)};
const stats=new Function(part('const isMilitary=','// Linha de tiro no terreno')+';return {isMilitary,attackRange,attackDamage}')();
test('sintaxe e compatibilidade do save',()=>{assert.doesNotThrow(()=>new Function(script));assert.ok(/<title>Crônicas das Eras v6\.\d+<\/title>/.test(html));assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));assert.ok(script.includes("localStorage.setItem('cronicas-v04'"))});
test('perfil da artilharia',()=>{assert.equal(stats.isMilitary('cannon'),true);assert.equal(stats.isMilitary('worker'),false);assert.equal(stats.attackRange('cannon'),6.3);assert.equal(stats.attackDamage('cannon'),44);assert.equal(stats.attackRange('archer'),4.6)});
test('recrutamento bloqueado antes da Era Industrial',()=>{
 const game={era:5,wood:120,food:50,stone:70,ore:80,people:5,army:0,units:[],buildings:[{x:80,y:80,t:'Aldeia'},{x:85,y:85,t:'Quartel'}]};
 const notes=[],spend=(w,f,s,o=0)=>{if(game.wood<w||game.food<f||game.stone<s||game.ore<o)return false;game.wood-=w;game.food-=f;game.stone-=s;game.ore-=o;return true};
 const recruit=new Function('game','isMilitary','passable','at','refresh','updateVisibility','assignWorkers','toast','spend',part('function spawnUnit(','function upgradeBuilding(')+';return recruitUnit')(
 game,stats.isMilitary,(x,y)=>x>=0&&y>=0&&x<160&&y<160,(x,y)=>game.buildings.find(b=>b.x===x&&b.y===y),()=>{},()=>{},()=>{},x=>notes.push(x),spend);
 recruit('cannon');assert.equal(game.units.length,0);
 game.era=6;recruit('cannon');assert.equal(game.units.length,1);assert.equal(game.units[0].kind,'cannon');
 assert.equal(game.army,1);assert.deepEqual([game.wood,game.food,game.stone,game.ore],[55,50,35,35]);assert.ok(notes.some(s=>s.includes('Canhão')));
});
test('tiro parado, bloqueio em movimento e linha de visão',()=>{
 const code=part('function combatTurn(){','const key=(x,y)');
 const battle=(moving=false,sight=()=>true)=>{
  const game={enemy:{x:120,y:120,hp:100},enemyUnits:[{x:85.5,y:80.5,hp:65}],buildings:[],units:[{kind:'cannon',x:80.5,y:80.5,hp:100,path:moving?[{x:81,y:80}]:[]}],claim:[]},shots=[];
  new Function('game','towerShots','refresh','toast','menu','panel','document','key','visibleAt','isMilitary','attackRange','attackDamage','selectedUnit','dirty','hasRangedSight',code+';combatTurn();')(
   game,shots,()=>{},()=>{},()=>{},{},{getElementById:()=>({})},(x,y)=>x+','+y,()=>true,stats.isMilitary,stats.attackRange,stats.attackDamage,0,false,sight);
  return {game,shots};
 };
 const fired=battle();assert.equal(fired.game.enemyUnits[0].hp,21);assert.equal(fired.shots[0].kind,'cannon');
 assert.equal(battle(true).shots.length,0);assert.equal(battle(false,()=>false).shots.length,0);
});
test('canhão tem geometria e LOD sem sprites flutuantes',()=>{
 const code=part('function drawSiegeCannon(','function drawUnitSprite(');
 const render=(z,attackAt=0)=>{const ops=[],ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>ops.push([k,...args])},set(o,k,v){o[k]=v;return true}});
  const draw=new Function('ctx','game',code+';return drawSiegeCannon')(ctx,{era:6});
  draw({x:80.5,y:80.5,path:[],attackAt,face:-1},200,220,z,1200);return ops};
 const near=render(1.4),far=render(.4),firing=render(1.4,1140);
 assert.ok(near.filter(o=>o[0]==='ellipse').length>=4);assert.ok(near.filter(o=>o[0]==='lineTo').length>=12);
 assert.ok(near.length>far.length*2);assert.ok(firing.length>near.length);assert.deepEqual(near[1],['translate',200,220]);
});
test('menus, formação e projéteis integrados',()=>{
 for(const id of ['recruitCannon','trainCannon'])assert.ok(html.includes('id="'+id+'"'));
 for(const token of ["role:u.kind==='cannon'?3","u.kind==='cannon'?1.05","shot.kind==='cannon'","drawSiegeCannon(u,px,py,z)"])assert.ok(script.includes(token),token);
});
