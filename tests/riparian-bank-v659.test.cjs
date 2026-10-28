'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawRiparianBank(');
const end=script.indexOf('function drawRiparianVegetation(',start);
assert.ok(start>0&&end>start,'renderizador da margem úmida presente');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};

function render(width,mask=15,biomeId=2){
 const calls=[];
 const ctx=new Proxy({}, {get(target,k){
  if(!(k in target))target[k]=(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenadas finitas');
   calls.push({method:k,args});
  };
  return target[k];
 }});
 const draw=new Function('ctx','rnd','biome',source+';return drawRiparianBank;')(ctx,rnd,()=>biomeId);
 const painted=draw(100,100,width,width*38/74,11,14,mask);
 return {calls,painted};
}

test('script principal continua sintaticamente válido',()=>assert.doesNotThrow(()=>new Function(script)));
test('LOD omite margens no zoom distante e sem lago vizinho',()=>{
 assert.equal(render(23,15).painted,0);
 assert.equal(render(23,15).calls.length,0);
 assert.equal(render(70,0).painted,0);
 assert.equal(render(70,0).calls.length,0);
});
test('as quatro orientações do lago geram faixas independentes',()=>{
 for(const flag of [1,2,4,8])assert.equal(render(60,flag).painted,1);
 assert.equal(render(60,15).painted,4);
 assert.ok(render(60,15).calls.length>render(60,1).calls.length*3);
});
test('cascalho e brilho de margem aumentam somente em zoom próximo',()=>{
 assert.ok(render(55,1).calls.length>render(35,1).calls.length);
 assert.ok(render(75,1).calls.length>render(55,1).calls.length);
 assert.ok(render(75,1,1).calls.length>0);
});
test('faixa úmida é renderizada antes da vegetação e respeita ocupação',()=>{
 assert.match(script,/if\(\(b===1\|\|b===2\)\&\&!ruinKind\&\&!structures\.has\(key\(x,y\)\)\&\&!roadTiles\.has\(key\(x,y\)\)\)\{/);
 const a=script.indexOf('if(riparianMask[y*W+x])drawRiparianBank(');
 const b=script.indexOf('meadowDetails(px,py,ww,hh,x,y,b);',a);
 const c=script.indexOf('if(riparianMask[y*W+x])drawRiparianVegetation(',b);
 assert.ok(a>0&&b>a&&c>b,'banco, prado e juncos mantêm a ordem de camadas');
});
test('sem mudanças de economia, colisões ou salvamento',()=>{
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/\b(?:game|localStorage|routeFor|passable)\s*[.=(]/);
});
