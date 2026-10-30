'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const a=script.indexOf('function drawWindmill('),b=script.indexOf('// Defensive stone watchtower',a);
assert.ok(a>=0&&b>a);
const source=script.slice(a,b);
function render(width=74,level=1,now=12345){
 const ops=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>ops.push([k,args]);},set(o,k,v){o[k]=v;return true}});
 const fn=new Function('ctx','scale',source+';return drawWindmill;')(ctx,1);
 fn(100,150,width,width/2,level,now);return ops;
}
test('JavaScript principal é válido',()=>assert.doesNotThrow(()=>new Function(script)));
test('moinho possui quatro pás e fachadas isométricas',()=>{
 const ops=render();assert.ok(ops.length>80);
 assert.equal(ops.filter(op=>op[0]==='rotate').length,5);
 assert.ok(ops.filter(op=>op[0]==='fill').length>12);
});
test('velas são determinísticas com relógio fixo',()=>assert.deepEqual(render(74,2,1000),render(74,2,1000)));
test('zoom distante reduz operações Canvas',()=>assert.ok(render(18).length<render(74).length));
test('moinho integrado a custos, renderização, produção e salvamento',()=>{
 for(const marker of ["Moinho:[60,0,30]","data-t=\"Moinho\"","drawWindmill(px,py,ww,hh,obj.level,frameTime)","total('Moinho')*12","case 'Moinho':return","cronicas-v04"])
  assert.ok(script.includes(marker),'Integração ausente: '+marker);
});
test('produção por nível ignora obras não concluídas',()=>{
 const a=script.indexOf('function nextDay()'),b=script.indexOf('function showTutorial()',a);
 const game={day:1,food:0,wood:0,stone:0,ore:0,buildings:[{t:'Moinho',level:2},{t:'Moinho',level:1,buildLeft:3},{t:'Fazenda',level:1}],enemy:null};
 const next=new Function('game','refresh','toast','spawnEnemyGuard',script.slice(a,b)+';return nextDay;')(game,()=>{},()=>{},()=>{});
 next();assert.equal(game.food,54);assert.equal(game.day,2);
});
test('construção exige campos ou pradarias dominados',()=>{
 const a=script.indexOf('function buildValidation('),b=script.indexOf('function beginPlacement(',a);
 let ground=2;
 const check=new Function('game','key','at','biome','passable','W','H','ownedTile',script.slice(a,b)+';return buildValidation;')(
  {claim:['80,80'],buildings:[]},(x,y)=>x+','+y,()=>null,()=>ground,()=>true,160,160,(x,y)=>x===80&&y===80);
 assert.equal(check('Moinho',80,80),null);
 ground=3;assert.match(check('Moinho',80,80),/campos ou pradarias/);
 ground=2;assert.match(check('Moinho',81,80),/região dominada/);
});
