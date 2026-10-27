'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('function drawMine(');
const end=script.indexOf('/* Casa de pesca',start);
assert.ok(start>=0&&end>start,'mina histórica encontrada');
const art=script.slice(start,end);
const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','arc','quadraticCurveTo','fillRect','strokeRect']);
function render(era,level=1,width=74,now=1000){
 const calls=[],styles=[],rockCalls=[];
 const ctx=new Proxy({},{get(o,k){
  if(methods.has(k))return (...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenada finita: '+k);
   calls.push([k,...args]);
  };
  return o[k];
 },set(o,k,v){
  o[k]=v;
  if(k==='fillStyle'||k==='strokeStyle')styles.push(v);
  if(k==='globalAlpha')assert.ok(Number.isFinite(v));
  return true;
 }});
 const draw=new Function('ctx','scale','rock',art+'return drawMine')(ctx,width/74,(...args)=>rockCalls.push(args));
 draw(220,190,width,width*38/74,level,era,now);
 return {calls,styles,rockCalls};
}
test('JavaScript completo compila e mantém o save existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('mina desenha oito eras, três níveis e três distâncias sem corromper Canvas',()=>{
 for(let era=0;era<8;era++)for(let level=1;level<=3;level++)for(const width of [18,40,74]){
  const {calls,rockCalls}=render(era,level,width);
  assert.ok(calls.length>8);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
  assert.equal(rockCalls.length,2);
 }
});
test('silhuetas de madeira, pedra, guincho, aço e equipamento moderno são distintas',()=>{
 assert.ok(render(0).styles.includes('#ae8751'));
 assert.ok(render(2).styles.includes('#b9af95'));
 assert.ok(render(4).styles.includes('#6d4e34'));
 assert.ok(render(6).styles.includes('#647b83'));
 assert.ok(render(7).styles.includes('#e4bd53'));
});
test('LOD reduz desenho no zoom distante, preservando o relevo',()=>{
 for(const era of [0,2,4,6,7]){
  const far=render(era,1,18),mid=render(era,1,40),near=render(era,1,74);
  assert.ok(near.calls.length>mid.calls.length);
  assert.ok(mid.calls.length>far.calls.length);
  assert.equal(far.rockCalls.length,2);
 }
});
test('animação é determinística e muda com o tempo sem alterar estado',()=>{
 const a=render(6,2,74,1200),b=render(6,2,74,1200),c=render(6,2,74,2300);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,c.calls);
});
test('mina recebe era atual na obra, na estrutura pronta e na prévia',()=>{
 assert.match(script,/drawMine\(px,py,ww,hh,1,era\)/);
 assert.match(script,/drawMine\(px,py,ww,hh,obj\.level,game\.era,frameTime\)/);
 assert.match(script,/drawMine\(px,py,ww,hh,1,game\.era\)/);
});
