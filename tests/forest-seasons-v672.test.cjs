'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const source=script.slice(script.indexOf('function tree('),script.indexOf('// Decorative landmarks'));
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(day=1,zoom=1){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle')styles.push(v);return true}
 });
 const game={day};
 const api=new Function('ctx','scale','rnd','biome','game',source+
  ';return {tree,oak,drawBirch,drawForestGrove,forestSeason};')(ctx,zoom,rnd,()=>3,game);
 return {...api,calls,styles};
}
test('v6.72 compila e mantém o salvamento existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.72<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('quatro estações repetem a cada 32 dias, inclusive após o primeiro ciclo',()=>{
 const s=scene();
 for(const [day,expected] of [[1,0],[8,0],[9,1],[16,1],[17,2],[24,2],[25,3],[32,3],[33,0],[49,2],[57,3]])
  assert.equal(s.forestSeason(day),expected,'dia '+day);
});
test('carvalhos e bétulas mudam de cor e ficam sem copa no inverno',()=>{
 const spring=scene(2),autumn=scene(19),winter=scene(29);
 for(const s of [spring,autumn,winter]){s.oak(100,140,23,4,1300);s.drawBirch(160,140,23,4,1300)}
 assert.ok(spring.styles.includes('#497b3e')&&spring.styles.includes('#79a255'));
 assert.ok(autumn.styles.includes('#9a4d30')&&autumn.styles.includes('#bd773b'));
 assert.ok(!winter.styles.includes('#9a4d30')&&!winter.styles.includes('#bd773b'));
 assert.ok(winter.calls.filter(c=>c[0]==='lineTo').length>spring.calls.filter(c=>c[0]==='lineTo').length);
});
test('coníferas mantêm agulhas e recebem neve no inverno',()=>{
 const summer=scene(11),winter=scene(28);
 summer.tree(120,160,24,4,1400);winter.tree(120,160,24,4,1400);
 assert.ok(summer.styles.includes('#245b36'));
 assert.ok(winter.styles.includes('#254e47'));
 assert.ok(winter.calls.filter(c=>c[0]==='stroke').length>summer.calls.filter(c=>c[0]==='stroke').length);
});
test('serapilheira sazonal aparece apenas na camada de chão e com zoom adequado',()=>{
 const autumn=scene(19),winter=scene(29),far=scene(29,.5);
 const args=[200,160,74,38,23,31,.9,1800,'back',-Infinity];
 autumn.drawForestGrove(...args);winter.drawForestGrove(...args);
 far.drawForestGrove(200,160,25,13,23,31,.9,1800,'back',-Infinity);
 assert.ok(autumn.styles.includes('#d69a4d'));
 assert.ok(winter.styles.includes('#f1f4e4b5'));
 assert.ok(!far.styles.includes('#f1f4e4b5'));
 const split=scene(19),whole=scene(19);
 whole.drawForestGrove(200,160,74,38,23,31,.9,1800);
 split.drawForestGrove(...args);
 split.drawForestGrove(200,160,74,38,23,31,.9,1800,'front',-Infinity);
 assert.deepEqual(split.calls,whole.calls,'solo sazonal não pode ser duplicado entre camadas');
});
