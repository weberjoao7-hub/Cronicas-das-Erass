'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('// v6.207: portao de quartel'),end=script.indexOf('function drawBarracks(',start);
assert.ok(start>=0&&end>start,'helper isolavel');
const source=script.slice(start,end);
function render(era=4,ww=90,hh=46){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx',source+';return drawBarracksGateRelief;')(ctx);
 return {calls,styles,draw,result:draw(150,180,ww,hh,era)};
}
test('v6.207 compila e preserva save',()=>{
 assert.doesNotThrow(()=>new Function(script));assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|game\.|requestAnimationFrame|Math\.random/);
});
test('LOD e entradas invalidas nao desenham',()=>{
 for(const args of [[0,90,46],[4,38,46],[4,90,12]]){
  const r=render(...args);assert.equal(r.result,0);assert.equal(r.calls.length,0);
 }
 const r=render();assert.equal(r.draw(NaN,180,90,46,4),0);
 assert.ok(render(4,44,25).calls.length<render(4,90,46).calls.length);
});
test('madeira antiga, medieval e metal industrial',()=>{
 assert.ok(render(2).styles.includes('#946a42'));
 assert.ok(render(4).styles.includes('#76533e'));
 assert.ok(render(7).styles.includes('#526a6b'));
});
test('arco recortado, geometria finita e custo limitado',()=>{
 const r=render();
 assert.ok(r.calls.some(c=>c[0]==='clip'));
 assert.ok(r.calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.ok(r.calls.some(c=>c[0]==='arc'));
 assert.equal(r.calls.filter(c=>c[0]==='save').length,r.calls.filter(c=>c[0]==='restore').length);
 assert.ok(r.calls.length<125);
});
test('integracao sobre portao e antes dos torreoes',()=>{
 const gate=script.indexOf('// Portao arqueado:');
 const call=script.indexOf('drawBarracksGateRelief(px,py,ww,hh,era);',gate);
 const towers=script.indexOf('// Torreoes nas duas extremidades',gate);
 assert.ok(gate>=0&&call>gate&&towers>call);
});
