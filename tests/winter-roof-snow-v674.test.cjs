'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawWinterRoofSnow(');
const end=script.indexOf('// v6.73:',start);
assert.ok(start>=0&&end>start,'helper sazonal isolável');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(season=3){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd','forestSeason',source+';return drawWinterRoofSnow;')(ctx,rnd,()=>season);
 return {draw,calls,styles};
}
test('v6.74 compila e preserva o salvamento anterior',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.74<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('neve aparece somente no inverno, em construções suportadas e zoom próximo',()=>{
 for(const season of [0,1,2]){const s=scene(season);assert.equal(s.draw(100,130,74,38,'Cabana',0,13),0);assert.equal(s.calls.length,0)}
 const s=scene(3);
 assert.equal(s.draw(100,130,29,15,'Cabana',0,13),0);
 assert.equal(s.draw(100,130,74,38,'Mina',0,13),0);
 assert.equal(s.draw(100,130,74,38,'Ponte',0,13),0);
 assert.equal(s.calls.length,0);
});
test('cabanas históricas, modernas e sede da aldeia têm faces corretas',()=>{
 for(const era of [0,1,2,3,4,5,6,7]){
  const s=scene();assert.equal(s.draw(100,130,74,38,'Cabana',era,13),2);
  assert.ok(s.styles.includes('#f6faf3'));
 }
 const hall=scene();assert.equal(hall.draw(100,130,74,38,'Aldeia',0,13),4);
 assert.ok(hall.styles.includes('#e5f0e9'));
});
test('detalhes dos beirais e pingentes respeitam o nível de detalhe',()=>{
 const mid=scene(),near=scene();
 mid.draw(100,130,38,20,'Cabana',0,13);
 near.draw(100,130,74,38,'Cabana',0,13);
 assert.ok(near.calls.length>mid.calls.length);
 assert.ok(near.calls.filter(c=>c[0]==='stroke').length>mid.calls.filter(c=>c[0]==='stroke').length);
 assert.equal(near.calls.filter(c=>c[0]==='save').length,near.calls.filter(c=>c[0]==='restore').length);
});
test('neve é determinística e não gera dados persistentes',()=>{
 const a=scene(),b=scene();a.draw(120,170,74,38,'Aldeia',4,17);b.draw(120,170,74,38,'Aldeia',4,17);
 assert.deepEqual(a.calls,b.calls);
 assert.deepEqual(a.styles,b.styles);
 assert.doesNotMatch(source,/localStorage|game\.|(?:^|[^\w.])save\(|Math\.random/);
});
test('a neve é renderizada após a estrutura pronta, sem cobrir obras em andamento',()=>{
 const start=script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite(');
 const end=script.indexOf('if(game.enemy&&game.enemy.hp>0&&game.enemy.x===x',start);
 assert.ok(start>=0&&end>start);
 const site=script.slice(start,end);
 assert.match(site,/else if\(obj\)\{/);
 assert.match(site,/drawWinterRoofSnow\(px,py,ww,hh,obj\.t,game\.era,obj\.x\*97\+obj\.y\*13\)/);
});
