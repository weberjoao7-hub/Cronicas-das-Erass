'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');

const start=script.indexOf('const mobileRender=');
const end=script.indexOf("addEventListener('pagehide'",start);
assert.ok(start>=0&&end>start,'controlador adaptativo');
const source=script.slice(start,end);
function controller(mobile){
 return new Function('matchMedia','innerWidth',source+
  ';return {get interval(){return frameInterval},adjustRenderCadence,nextRenderInterval};')(
  ()=>({matches:mobile}),mobile?390:1440);
}
function sample(c,cost,count=24){for(let i=0;i<count;i++)c.adjustRenderCadence(cost)}

test('JavaScript completo compila e preserva salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/const drawStart=performance\.now\(\);draw\(\);adjustRenderCadence\(performance\.now\(\)-drawStart\)/);
});
test('iPhone rápido aumenta de 20 para aproximadamente 30 FPS',()=>{
 const c=controller(true);assert.equal(c.interval,50);
 sample(c,7,23);assert.equal(c.interval,50,'não reage a uma amostra isolada');
 sample(c,7,1);assert.equal(c.interval,30);
});
test('iPhone sob carga retorna ao limite de 20 FPS',()=>{
 const c=controller(true);sample(c,8);assert.equal(c.interval,30);
 sample(c,35);assert.equal(c.interval,50);
});
test('desktop usa 60, 30 ou 20 FPS conforme custo médio',()=>{
 const c=controller(false);sample(c,5);assert.equal(c.interval,16);
 sample(c,21);assert.equal(c.interval,30);
 sample(c,35);assert.equal(c.interval,50);
});
test('amostras inválidas não contaminam o ajuste',()=>{
 const c=controller(true);c.adjustRenderCadence(NaN);c.adjustRenderCadence(-1);
 sample(c,7,23);assert.equal(c.interval,50);
 sample(c,7);assert.equal(c.interval,30);
});
