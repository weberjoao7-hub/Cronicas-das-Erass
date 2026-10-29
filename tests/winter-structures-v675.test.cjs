'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawWinterRoofSnow('),end=script.indexOf('// v6.73:',start);
assert.ok(start>=0&&end>start,'helper isolável');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(season=3){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'coordenadas finitas');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','rnd','forestSeason',source+';return drawWinterRoofSnow;')(ctx,rnd,()=>season);
 return {draw,calls,styles};
}
test('v6.75 mantém sintaxe e chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('quartéis ganham coberturas específicas por era',()=>{
 for(const [era,count] of [[0,2],[1,2],[2,1],[3,1],[4,4],[5,4],[6,4],[7,4]]){
  const s=scene();assert.equal(s.draw(120,140,80,40,'Quartel',era,17),count);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('torres recebem neve nos telhados ou nas ameias, sem invadir a antena',()=>{
 for(const [era,count] of [[0,2],[1,2],[2,6],[3,6],[4,6],[5,6],[6,1],[7,1]]){
  const s=scene();assert.equal(s.draw(120,140,80,40,'Torre',era,17),count);
 }
 const stone=scene();stone.draw(120,140,80,40,'Torre',3,17);
 assert.ok(stone.styles.includes('#f6faf3'));
});
test('pesqueiro recebe camada apenas no tablado',()=>{
 const s=scene();assert.equal(s.draw(120,140,80,40,'Pesqueiro',3,17),1);
 assert.ok(s.calls.some(c=>c[0]==='fill'));
 assert.equal(s.calls.filter(c=>c[0]==='lineTo'&&c[2]>160).length,0);
});
test('estação, zoom e tipo filtram renderização',()=>{
 for(const season of [0,1,2]){
  const s=scene(season);
  for(const type of ['Quartel','Torre','Pesqueiro'])assert.equal(s.draw(120,140,80,40,type,2,17),0);
  assert.equal(s.calls.length,0);
 }
 const s=scene();assert.equal(s.draw(120,140,29,15,'Quartel',4,17),0);
 assert.equal(s.draw(120,140,80,40,'Ponte',4,17),0);
 assert.equal(s.calls.length,0);
});
test('mesma posição e era geram geometria determinística sem persistência',()=>{
 const a=scene(),b=scene();a.draw(120,140,80,40,'Torre',4,17);b.draw(120,140,80,40,'Torre',4,17);
 assert.deepEqual(a.calls,b.calls);assert.deepEqual(a.styles,b.styles);
 assert.doesNotMatch(source,/localStorage|game\.|Math\.random/);
});
test('neve arquitetônica é desenhada só depois da construção pronta',()=>{
 const begin=script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite(');
 const end=script.indexOf('if(game.enemy&&game.enemy.hp>0&&game.enemy.x===x',begin);
 assert.ok(begin>=0&&end>begin);
 const section=script.slice(begin,end);
 assert.match(section,/else if\(obj\)\{/);
 assert.match(section,/drawWinterRoofSnow\(px,py,ww,hh,obj\.t,game\.era,obj\.x\*97\+obj\.y\*13\)/);
});
