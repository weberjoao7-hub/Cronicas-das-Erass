'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.203: samambaias isometricas');
const end=script.indexOf('// Sombras projetadas pelas copas',start);
assert.ok(start>=0&&end>start,'renderizador isolavel');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene({clock=60,visible=true}={}){
 const calls=[],styles=[],state={},fog=new Uint8Array(160*160);
 if(visible)fog.fill(1);
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd','lightLevels','dayClock','visibleFog','W',source+
  ';return drawForestUnderstory')(ctx,rnd,p=>({night:p>=.8?1:0,dusk:0}),clock,fog,160);
 return {draw,calls,styles};
}
test('v6.203: script compila e salvamento anterior permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|game\.|routeFor\(|(?:^|[^\w.])save\(/);
});
test('luz ausente na noite, chuva intensa e zoom distante',()=>{
 const night=scene({clock:110}),rain=scene(),far=scene();
 assert.equal(night.draw(100,100,60,30,15,20,1000,1,0),0);
 assert.equal(rain.draw(100,100,60,30,15,20,1000,1,1),0);
 assert.equal(far.draw(100,100,40,20,15,20,1000,1,0),0);
 assert.equal(night.calls.length+rain.calls.length+far.calls.length,0);
});
test('luz e samambaias possuem LOD limitado',()=>{
 const medium=scene(),near=scene();
 assert.equal(medium.draw(100,100,60,30,15,20,1000,1,0),3);
 assert.equal(near.draw(100,100,110,55,15,20,1000,1,0),7);
 assert.ok(near.calls.length>medium.calls.length);
 assert.ok(near.calls.length<115,'custo limitado por terreno');
});
test('outono e inverno mudam materiais sem folhas verdes na neve',()=>{
 const summer=scene(),autumn=scene(),winter=scene();
 summer.draw(100,100,110,55,15,20,1000,1,0);
 autumn.draw(100,100,110,55,15,20,1000,2,0);
 winter.draw(100,100,110,55,15,20,1000,3,0);
 assert.ok(summer.styles.includes('#f5df9f')&&summer.styles.includes('#397349'));
 assert.ok(autumn.styles.includes('#e8bd79')&&autumn.styles.includes('#8a7943'));
 assert.ok(winter.styles.includes('#f0ecdc')&&!winter.styles.includes('#397349'));
});
test('nevoa e entradas invalidas impedem desenhos',()=>{
 const hidden=scene({visible:false}),invalid=scene();
 assert.equal(hidden.draw(100,100,110,55,15,20,1000,1,0),0);
 assert.equal(invalid.draw(NaN,100,110,55,15,20,1000,1,0),0);
 assert.equal(invalid.draw(100,100,110,55,15,20,1000,8,0),0);
 assert.equal(hidden.calls.length+invalid.calls.length,0);
});
test('padrao deterministico e brisa temporal',()=>{
 const a=scene(),b=scene(),c=scene();
 a.draw(100,100,110,55,15,20,1000,1,0);
 b.draw(100,100,110,55,15,20,1000,1,0);
 c.draw(100,100,110,55,15,20,2400,1,0);
 assert.deepEqual(a.calls,b.calls);
 assert.notDeepEqual(a.calls,c.calls);
});
test('sub-bosque aparece somente no solo, antes das copas',()=>{
 const grove=script.indexOf('function drawForestGrove(');
 const ground=script.indexOf("if(ww>=32&&(layer==='all'||layer==='back'))",grove);
 const cast=script.indexOf('drawForestCastShadows(px,py,ww,hh,x,y,count,now);',ground);
 const understory=script.indexOf('drawForestUnderstory(px,py,ww,hh,x,y,now,',cast);
 const trees=script.indexOf('for(let i=0;i<count;i++){',understory);
 assert.ok(grove>=0&&ground>grove&&cast>ground&&understory>cast&&trees>understory);
 assert.match(script,/if\(typeof visibleFog!=='undefined'&&!visibleFog\[y\*W\+x\]\)return 0/);
});
