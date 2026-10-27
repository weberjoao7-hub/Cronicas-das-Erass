'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=html.indexOf('function drawWadingBird(');
const end=html.indexOf('// Fazenda isométrica:',start);
assert.ok(start>0&&end>start,'renderizador de garças encontrado');
const art=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function render(mask,ww=74,now=1200,scale=1){
 const calls=[];
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','quadraticCurveTo','bezierCurveTo','arc','translate','scale']);
 const ctx=new Proxy({},{
  get:(obj,k)=>methods.has(k)?(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenadas finitas');
   calls.push([k,...args]);
  }:obj[k],
  set:(obj,k,v)=>(obj[k]=v,true)
 });
 const draw=new Function('ctx','scale','rnd',art+';return drawWadingBird;')(ctx,scale,rnd);
 draw(220,150,ww,ww*.513,36,52,mask,now);
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 return calls;
}
test('script principal compila e preserva salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
});
test('garças só são desenhadas em margens com zoom suficiente',()=>{
 assert.equal(render(0).length,0);
 assert.equal(render(1,42).length,0);
 assert.equal(render(1,74,1200,.5).length,0);
 for(const flag of [1,2,4,8,15])assert.ok(render(flag).length>25);
});
test('detalhes e movimento sutis com pés fixos',()=>{
 const far=render(1,44),close=render(1,74);
 assert.ok(close.length>far.length);
 const a=render(2,74,1200),b=render(2,74,3900);
 assert.deepEqual(a.find(c=>c[0]==='translate'),b.find(c=>c[0]==='translate'));
 assert.notDeepEqual(a,b,'a cabeça e as pernas devem animar');
});
test('aves ficam restritas à água rasa explorada e sem sobreposição de barcos',()=>{
 assert.ok(script.includes('b===0&&shoreMask[y*W+x]&&q>.965'));
 assert.ok(script.includes('!boatTiles.has(key(x,y))&&visibleFog[y*W+x]'));
 assert.ok(!script.includes('drawBird('));
});
