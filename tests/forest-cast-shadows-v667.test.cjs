'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawForestGrove(');
const end=script.indexOf('// Decorative landmarks',start);
assert.ok(start>=0&&end>start,'bosque e sombras isoláveis');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(dayClock=60){
 const calls=[],trees=[];
 const ctx=new Proxy({}, {
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'geometria finita');calls.push([k,...args])}},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const stamp=kind=>(...args)=>trees.push([kind,...args]);
 const fn=new Function('ctx','rnd','biome','oak','tree','drawBirch','dayClock','lightLevels',source+';return {drawForestGrove,drawForestCastShadows}')(
  ctx,rnd,()=>3,stamp('oak'),stamp('pine'),stamp('birch'),dayClock,p=>({night:p>=.8?1:0,dusk:0}));
 return {...fn,calls,trees};
}
test('v6.67 compila e mantém o formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.(?:67|68)<\/title>/);
 assert.match(script,/cronicas-v04/);
});
test('sombras mudam de direção com o sol e respeitam noite e zoom',()=>{
 const noon=scene(60),morning=scene(15),night=scene(110);
 assert.equal(noon.drawForestCastShadows(200,160,72,36,23,31,3),3);
 assert.equal(morning.drawForestCastShadows(200,160,72,36,23,31,3),3);
 assert.notDeepEqual(noon.calls,morning.calls,'posição das sombras deve acompanhar a hora');
 assert.equal(night.drawForestCastShadows(200,160,72,36,23,31,3),0);
 assert.equal(scene(60).drawForestCastShadows(200,160,30,15,23,31,3),0);
 assert.equal(scene(60).drawForestCastShadows(200,160,42,21,23,31,3),1);
});
test('bosque com tropas não repete sombras ao desenhar copas por profundidade',()=>{
 const all=scene(),split=scene(),args=[200,160,72,36,23,31,.9,1800];
 all.drawForestGrove(...args);
 split.drawForestGrove(...args,'back',-Infinity);
 split.drawForestGrove(...args,'range',-Infinity,160);
 split.drawForestGrove(...args,'front',160);
 assert.deepEqual(split.trees,all.trees,'copas não podem ser duplicadas');
 assert.deepEqual(split.calls,all.calls,'sombras e serapilheira só podem ser desenhadas uma vez');
});
test('LOD mantém custo previsível e nenhuma dependência de economia',()=>{
 const far=scene(),medium=scene(),near=scene();
 far.drawForestCastShadows(200,160,30,15,23,31,3);
 medium.drawForestCastShadows(200,160,42,21,23,31,3);
 near.drawForestCastShadows(200,160,72,36,23,31,3);
 assert.equal(far.calls.length,0);
 assert.ok(medium.calls.length<near.calls.length);
 assert.ok(near.calls.length<50,'custo limitado por bosque');
 assert.doesNotMatch(source,/localStorage\.|game\.wood|game\.food|routeFor\(/);
});
