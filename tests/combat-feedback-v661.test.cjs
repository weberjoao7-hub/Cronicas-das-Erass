'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('function drawCombatFeedback('),end=script.indexOf('function drawMarchDust(',start);
assert.ok(start>=0&&end>start,'efeitos isoláveis');
const source=script.slice(start,end);
function render(unit,zoom=1.2,now=10000,enemy=false){
 const calls=[],colors=[],ctx=new Proxy({},{
  get(obj,key){if(key in obj)return obj[key];return (...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),String(key)+' recebeu coordenada inválida');
   calls.push({method:key,args});
  }},
  set(obj,key,value){obj[key]=value;if(key==='strokeStyle')colors.push(value);return true}
 });
 const draw=new Function('ctx',source+';return drawCombatFeedback;')(ctx);
 draw(unit,80,120,zoom,now,enemy);
 return {calls,colors};
}
const unit=(data={})=>({kind:'warrior',x:12.4,y:10.7,face:1,...data});
test('script principal compila e mantém salvamento v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('fora da janela de combate não executa desenho',()=>{
 assert.equal(render(unit()).calls.length,0);
 assert.equal(render(unit({attackAt:9000,hitAt:9000})).calls.length,0);
 assert.equal(render(unit({attackAt:9900,hitAt:9900}),.6).calls.length,0);
});
test('golpe corpo a corpo tem arco orientado e cor distinta para o inimigo',()=>{
 const right=render(unit({attackAt:9920})),left=render(unit({attackAt:9920,face:-1})),enemy=render(unit({attackAt:9920}),1.2,10000,true);
 const r=right.calls.find(c=>c.method==='arc'),l=left.calls.find(c=>c.method==='arc');
 assert.ok(r&&l&&r.args[0]>80&&l.args[0]<80);
 assert.ok(right.colors.includes('#fff0bd')&&enemy.colors.includes('#f7a187'));
 assert.equal(right.calls.filter(c=>c.method==='save').length,right.calls.filter(c=>c.method==='restore').length);
});
test('arqueiro não recebe arco de espada e o impacto permanece visível',()=>{
 const archer=render(unit({kind:'archer',attackAt:9920,hitAt:9950}));
 assert.ok(archer.calls.some(c=>c.method==='lineTo'));
 assert.ok(!archer.calls.some(c=>c.method==='arc'));
});
test('impactos têm LOD de 3 ou 5 raios e desaparecem após 260 ms',()=>{
 const u=unit({hitAt:9910});
 const medium=render(u,.85),close=render(u,1.3),old=render(unit({hitAt:9700}),1.3);
 assert.equal(medium.calls.filter(c=>c.method==='lineTo').length,3);
 assert.equal(close.calls.filter(c=>c.method==='lineTo').length,5);
 assert.equal(old.calls.length,0);
 assert.ok(close.calls.some(c=>c.method==='ellipse'));
});
test('feedback é desenhado após sprite sem modificar combate nem salvamento',()=>{
 assert.match(script,/drawUnitSprite\(u,px,py,z,enemy\);\s*drawCombatFeedback\(u,px,py,z,now,enemy\);/);
 assert.doesNotMatch(source,/\b(?:localStorage|game|save|attackDamage|combatTurn)\b/);
});
