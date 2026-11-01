'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=script.indexOf('function drawFishingBoatReflection('),end=script.indexOf('function drawFishingBoat(',start);
assert.ok(start>=0&&end>start,'reflexo presente');
const source=script.slice(start,end);
function paint(ww=78,era=4,moving=true,now=1500){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas finito');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const fn=new Function('ctx',source+'return drawFishingBoatReflection;')(ctx);
 return {calls,styles,result:fn(ww*.245,ww*.12,ww,now,era,moving)};
}
test('sintaxe, integracao e save preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes('drawFishingBoatReflection(r,beam,ww,now,game.era,moving)'));
 assert.ok(script.includes('cronicas-v04'));
 assert.ok(!/localStorage|Math\.random|setInterval|game\./.test(source));
});
test('LOD: zoom distante nao desenha reflexo',()=>{
 const a=paint(24),b=paint(40),c=paint(78);
 assert.equal(a.result,0);assert.equal(a.calls.length,0);
 assert.equal(b.result,1);assert.ok(c.calls.length>b.calls.length);
});
test('reflexo deterministico e animado',()=>{
 assert.deepEqual(paint(),paint());
 assert.notDeepEqual(paint(78,4,true,1000),paint(78,4,true,2600));
});
test('paleta e vela refletida acompanham era',()=>{
 const a=paint(78,1),b=paint(78,4),c=paint(78,7);
 assert.ok(a.styles.includes('#a48a6c'));
 assert.ok(b.styles.includes('#c6a97c'));
 assert.ok(c.styles.includes('#77999b'));
 assert.ok(b.calls.filter(x=>x[0]==='fill').length>c.calls.filter(x=>x[0]==='fill').length);
});
test('movimento gera duas ondulacoes extras',()=>{
 const a=paint(78,4,true),b=paint(78,4,false);
 assert.equal(a.calls.filter(x=>x[0]==='stroke').length-b.calls.filter(x=>x[0]==='stroke').length,2);
});
test('Canvas balanceado em oito eras e zooms',()=>{
 for(let era=0;era<8;era++)for(const ww of [19,37,48,59,78,150]){
  const {calls}=paint(ww,era);
  assert.equal(calls.filter(x=>x[0]==='save').length,calls.filter(x=>x[0]==='restore').length);
 }
});
