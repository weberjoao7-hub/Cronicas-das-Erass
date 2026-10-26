'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const between=(a,b)=>{const s=html.indexOf(a),e=html.indexOf(b,s+a.length);assert.ok(s>=0&&e>s,'Missing anchors '+a);return html.slice(s,e)};
const helpers=between('const isMilitary=','function warriorAutoEngage(){');
const {isMilitary,attackRange,attackDamage}=new Function(helpers+';return {isMilitary,attackRange,attackDamage}')();
test('browser script parses',()=>assert.doesNotThrow(()=>new Function(html.split('<script>')[1].split('</script>')[0])));
test('cavalry is military and has distinct attack profile',()=>{
 assert.equal(isMilitary('cavalry'),true);assert.equal(isMilitary('worker'),false);
 assert.equal(attackRange('cavalry'),1.8);assert.equal(attackDamage('cavalry'),26);
 assert.equal(attackRange('archer'),4.6);assert.equal(attackDamage('warrior'),18);
});
test('Ancient era gates cavalry and recruiting spends correct resources',()=>{
 const code=between('function spawnUnit(','function upgradeBuilding(');
 const game={era:1,wood:100,food:100,stone:10,ore:30,people:6,army:0,units:[],buildings:[{x:80,y:80,t:'Aldeia'},{x:85,y:85,t:'Quartel'}]};
 const at=(x,y)=>game.buildings.find(b=>b.x===x&&b.y===y);
 const spend=(w,f,s,o=0)=>{if(game.wood<w||game.food<f||game.stone<s||game.ore<o)return false;game.wood-=w;game.food-=f;game.stone-=s;game.ore-=o;return true};
 const recruit=new Function('game','isMilitary','passable','at','refresh','updateVisibility','assignWorkers','toast','spend',code+';return recruitUnit')(
 game,isMilitary,(x,y)=>x>=0&&y>=0&&x<160&&y<160,at,()=>{},()=>{},()=>{},()=>{},spend);
 recruit('cavalry');assert.equal(game.units.length,0);assert.deepEqual([game.wood,game.food,game.ore],[100,100,30]);
 game.era=2;recruit('cavalry');assert.equal(game.units[0].kind,'cavalry');
 assert.deepEqual([game.wood,game.food,game.stone,game.ore],[70,55,10,15]);assert.equal(game.army,1);
});
test('mounted cavalry sprite has shadow, anatomy, and zoom-aware detail',()=>{
 const code=between('function drawCavalrySprite(','// Rede viária derivada');
 const render=z=>{const ops=[],ctx=new Proxy({},{get:(o,k)=>o[k]||((...a)=>ops.push(k)),set:(o,k,v)=>(o[k]=v,true)});
 const sprite=new Function('ctx','biome',code+';return drawUnitSprite')(ctx,()=>2);
 sprite({kind:'cavalry',x:80.5,y:80.5,hp:100,path:[{x:81.5,y:80.5}]},200,220,z,false);return ops};
 const near=render(1.4),far=render(.55);
 assert.ok(near.filter(x=>x==='ellipse').length>=4);
 assert.ok(near.filter(x=>x==='quadraticCurveTo').length>=2);
 assert.ok(near.length>far.length);
});
test('menus, movement, minimap, and legacy save integrate cavalry',()=>{
 for(const id of ['recruitCavalry','trainCavalry'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes("u.kind==='cavalry'?3.1"));
 assert.ok(html.includes("u.kind==='cavalry'?'#f7bb68'"));
 assert.ok(html.includes('Cavaleiro selecionado'));
 assert.ok(html.includes('cronicas-v04'));
});