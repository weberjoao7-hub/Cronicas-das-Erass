'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const a=script.indexOf('function drawBarracksForge(');
const b=script.indexOf('/* Quartel: fortificacao',a);
assert.ok(a>=0&&b>a,'forja isolada do renderizador');
const source=script.slice(a,b);
function render(era=4,now=1000,ww=100,season=1){
 const calls=[],sets=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k)+' finito');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;sets.push([k,v]);return true}
 });
 const draw=new Function('ctx',source+'return drawBarracksForge;')(ctx);
 const result=draw(160,220,ww,ww*.4,era,now,season);
 return {result,calls,sets};
}
test('sintaxe principal, salvamento e integração no quartel',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/drawBarracksTraining\(px,py,ww,hh,game\.era,frameTime\);drawBarracksForge\(px,py,ww,hh,game\.era,frameTime,forestSeason\(\)\)/);
 assert.doesNotMatch(source,/localStorage|\.push\(|setInterval|requestAnimationFrame/);
});
test('forja não aparece em eras tribais ou em zoom distante',()=>{
 for(const era of [0,1]){
  const out=render(era);assert.equal(out.result,0);assert.equal(out.calls.length,0);
 }
 const out=render(4,1000,38);assert.equal(out.result,0);assert.equal(out.calls.length,0);
});
test('forja desenha faces isométricas, fogo, bigorna e chaminé',()=>{
 const out=render();
 assert.equal(out.result,1);
 assert.ok(out.calls.filter(c=>c[0]==='ellipse').length>=3);
 assert.ok(out.calls.filter(c=>c[0]==='lineTo').length>=10);
 assert.ok(out.calls.some(c=>c[0]==='fillRect'));
 assert.equal(out.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(out.calls.filter(c=>c[0]==='restore').length,1);
});
test('industrialização muda materiais, inverno modifica fumaça',()=>{
 const old=render(3),industrial=render(7);
 assert.notDeepEqual(old.sets.filter(c=>c[0]==='fillStyle'),industrial.sets.filter(c=>c[0]==='fillStyle'));
 const summer=render(4,1000,1.3*70,1),winter=render(4,1000,1.3*70,3);
 assert.notDeepEqual(summer.sets.filter(c=>c[0]==='globalAlpha'),winter.sets.filter(c=>c[0]==='globalAlpha'));
});
test('animação determinística, sem partículas persistentes',()=>{
 const a=render(4,12345),b=render(4,12345),c=render(4,12900);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a,c);
 assert.ok(a.calls.length<150,'custo limitado por quartel');
});
