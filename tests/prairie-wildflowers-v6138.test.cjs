'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const start=script.indexOf('function drawPrairieWildflowers(');
const end=script.indexOf('function meadowDetails(',start);
assert.ok(start>=0&&end>start,'renderer das flores ausente');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
let eligible=null,ineligible=null;
for(let x=0;x<32;x++)for(let y=0;y<32;y++){
 if(rnd(x,y,6)>.79&&!eligible)eligible=[x,y];
 if(rnd(x,y,6)<=.79&&!ineligible)ineligible=[x,y];
}
assert.ok(eligible&&ineligible);
function render(ww,hh,season,coords=eligible,now=1000){
 const calls=[];let fillStyle='',strokeStyle='';
 const ctx={save(){calls.push(['save'])},restore(){calls.push(['restore'])},
  beginPath(){},moveTo(...a){assert.ok(a.every(Number.isFinite))},
  quadraticCurveTo(...a){assert.ok(a.every(Number.isFinite))},
  lineTo(...a){assert.ok(a.every(Number.isFinite))},
  ellipse(...a){assert.ok(a.every(Number.isFinite));calls.push(['ellipse',...a])},
  arc(...a){assert.ok(a.every(Number.isFinite));calls.push(['arc',...a])},
  fill(){calls.push(['fill',fillStyle])},stroke(){calls.push(['stroke',strokeStyle])},
  set fillStyle(v){fillStyle=v},get fillStyle(){return fillStyle},
  set strokeStyle(v){strokeStyle=v},get strokeStyle(){return strokeStyle}};
 const draw=new Function('ctx','rnd',source+'return drawPrairieWildflowers;')(ctx,rnd);
 const count=draw(100,100,ww,hh,...coords,season,now);
 return {count,calls};
}
test('script principal permanece sintaticamente valido e save legado intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/Math\.random|localStorage|setInterval/);
});
test('LOD distante e inverno evitam custo de desenho',()=>{
 for(const [ww,hh,season] of [[39,20,0],[75,13,0],[75,38,3]]){
  const {count,calls}=render(ww,hh,season);assert.equal(count,0);assert.equal(calls.length,0);
 }
});
test('densidade e nivel de detalhe sao limitados por tile',()=>{
 assert.equal(render(75,38,0).count,3);
 assert.equal(render(48,24,1).count,1);
 assert.equal(render(75,38,0,ineligible).count,0);
});
test('geometria finita e pilha Canvas balanceada',()=>{
 const {calls}=render(82,42,0);
 assert.equal(calls.filter(c=>c[0]==='save').length,1);
 assert.equal(calls.filter(c=>c[0]==='restore').length,1);
 assert.ok(calls.some(c=>c[0]==='ellipse'));
});
test('flores de primavera e verao usam paletas diferentes',()=>{
 const spring=render(80,40,0).calls.filter(c=>c[0]==='fill').map(c=>c[1]);
 const summer=render(80,40,1).calls.filter(c=>c[0]==='fill').map(c=>c[1]);
 assert.notDeepEqual(spring,summer);
 assert.ok(spring.includes('#e7d8f2'));
 assert.ok(summer.includes('#e9b75d'));
});
test('outono produz espigas em vez de petalas',()=>{
 const spring=render(80,40,0).calls;
 const autumn=render(80,40,2).calls;
 assert.ok(spring.filter(c=>c[0]==='ellipse').length>autumn.filter(c=>c[0]==='ellipse').length);
 assert.ok(autumn.some(c=>c[0]==='fill'&&c[1]==='#c0a267'));
});
test('integracao impede flores em estradas, construcoes, ruinas e nevoa',()=>{
 const call='if(b===2&&!ruinKind&&!structures.has(key(x,y))&&!roadTiles.has(key(x,y))&&visibleFog[y*W+x])drawPrairieWildflowers(px,py,ww,hh,x,y,forestSeason(),frameTime);';
 assert.ok(script.includes(call));
 const pos=script.indexOf(call);
 assert.ok(pos>script.indexOf('function draw(){'));
 assert.ok(pos<script.indexOf('let animal=wildlifeAt(x,y)',pos));
});
