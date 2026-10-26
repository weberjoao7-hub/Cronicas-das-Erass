'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert.ok(start>=0&&end>start);
const script=html.slice(start+8,end);
const a=html.indexOf('function drawBirch('),b=html.indexOf('// Decorative landmarks',a);
assert.ok(a>=0&&b>a);
const art=html.slice(a,b);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function setup(biome=()=>3){
 const calls={oak:0,pine:0,geometry:0};
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath']);
 const ctx=new Proxy({}, {get:(o,k)=>methods.has(k)?()=>{calls.geometry++}:o[k],set:(o,k,v)=>(o[k]=v,true)});
 const f=new Function('ctx','scale','rnd','biome','oak','tree',art+';return {drawForestGrove,drawBirch};');
 const api=f(ctx,1,rnd,biome,()=>calls.oak++,()=>calls.pine++);
 return {calls,api};
}
test('script principal tem sintaxe válida e salvamento compatível',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(html.includes('cronicas-v04'));
});
test('bosque combina espécies e geometria determinística',()=>{
 const a=setup(),b=setup();
 for(let x=20;x<40;x++){a.api.drawForestGrove(200,160,74,38,x,25,rnd(x,25,6));b.api.drawForestGrove(200,160,74,38,x,25,rnd(x,25,6))}
 assert.deepEqual(a.calls,b.calls);
 assert.ok(a.calls.oak>0&&a.calls.pine>0&&a.calls.geometry>100);
 assert.ok(html.includes('drawForestGrove(px,py,ww,hh,x,y,q);'));
});
test('nível de detalhe reduz carga no zoom distante',()=>{
 const s=setup();s.api.drawForestGrove(200,160,25,13,23,25,.9);
 assert.ok(s.calls.oak+s.calls.pine<=1);
 const before={...s.calls};s.api.drawForestGrove(200,160,12,6,23,25,.9);
 assert.deepEqual(s.calls,before);
});
test('bétula renderiza tronco, galhos e copa',()=>{
 const s=setup();s.api.drawBirch(200,160,20,4);
 assert.ok(s.calls.geometry>45);
});
