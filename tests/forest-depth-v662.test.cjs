'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function drawForestGrove('),end=html.indexOf('// Decorative landmarks',start);
assert.ok(start>=0&&end>start);
const art=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(){
 const calls=[],ctx=new Proxy({},{
  get:(o,k)=>typeof k==='string'&&['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','fillRect','arc'].includes(k)?()=>{}:o[k],
  set:(o,k,v)=>(o[k]=v,true)
 });
 const stamp=kind=>(x,y,s,seed,now)=>calls.push({kind,x,y,s,seed,now});
 const draw=new Function('ctx','scale','rnd','biome','oak','tree','drawBirch',art+';return drawForestGrove')(
  ctx,1,rnd,()=>3,stamp('oak'),stamp('pine'),stamp('birch'));
 return {draw,calls};
}
test('bosque ocupado preserva árvores e profundidade sem duplicação',()=>{
 const all=scene(),split=scene(),args=[200,160,72,36,23,31,.9,1800];
 all.draw(...args);
 split.draw(...args,'back',160);
 const behind=split.calls.length;
 split.draw(...args,'front',160);
 assert.ok(behind>0&&split.calls.length>behind,'deve haver árvores atrás e à frente');
 assert.deepEqual(split.calls,all.calls,'as duas camadas não podem duplicar ou deslocar árvores');
});
test('camadas mudam com a posição dos pés da unidade',()=>{
 const behind=scene(),ahead=scene(),args=[200,160,72,36,23,31,.9,1800];
 behind.draw(...args,'back',120);
 ahead.draw(...args,'back',200);
 assert.ok(behind.calls.length<ahead.calls.length);
});
test('terrenos sem unidades mantêm o caminho de renderização original',()=>{
 assert.match(html,/else drawForestGrove\(px,py,ww,hh,x,y,q\);/);
 const occupants=html.indexOf('if(forestCount)drawForestOccupiedTile(');
 const interleave=html.indexOf('function drawForestOccupiedTile(');
 assert.ok(occupants>=0&&interleave>=0);
 assert.match(html,/if\(forestCount\)drawForestGrove\(px,py,ww,hh,x,y,q,frameTime,'back',-Infinity\)/);
 assert.match(html,/forestOpen&&visibleFog\[y\*W\+x\]\?enemyTiles\.get/);
 assert.ok(html.includes('cronicas-v04'));
});
