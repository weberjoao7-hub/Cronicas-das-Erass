'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const a=html.indexOf('function drawBridge('),b=html.indexOf('function drawConstructionSite(',a);
assert.ok(a>=0&&b>a,'renderer de pontes encontrado');
const art=html.slice(a,b);
function render(era,axis='x',progress=1,width=74){
 const calls=[],styles=[];
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','arc']);
 const ctx=new Proxy({},{
  get:(obj,key)=>{
   if(methods.has(key))return (...args)=>{
    for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'coordenadas finitas');
    calls.push(key);
   };
   return obj[key];
  },
  set:(obj,key,value)=>{obj[key]=value;if(key==='fillStyle'||key==='strokeStyle')styles.push(value);return true}
 });
 const draw=new Function('ctx','scale',art+';return drawBridge;')(ctx,width/74);
 draw(240,150,width,width*38/74,axis,progress,era);
 return {calls,styles};
}
test('script principal compila e mantém a chave de salvamento',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('pontes renderizam em oito eras, dois eixos e três estágios de obra',()=>{
 for(let era=0;era<8;era++)for(const axis of ['x','y'])for(const progress of [0,.5,1]){
  const {calls}=render(era,axis,progress);
  assert.ok(calls.length>10);
  assert.equal(calls.filter(c=>c==='save').length,calls.filter(c=>c==='restore').length);
 }
});
test('pedra, ferro e asfalto possuem materiais históricos próprios',()=>{
 const tribal=render(1).styles,stone=render(3).styles,iron=render(5).styles,modern=render(7).styles;
 assert.ok(tribal.includes('#a97b4c'));
 assert.ok(stone.includes('#a7a89a')||stone.includes('#bfc0b0'));
 assert.ok(iron.includes('#455d64'));
 assert.ok(modern.includes('#4c585d'));
 assert.ok(modern.includes('#dfd5b2'));
});
test('progressão da obra não antecipa tabuleiro nem guarda-corpo',()=>{
 const empty=render(7,'x',0),half=render(7,'x',.5),full=render(7,'x',1);
 assert.ok(half.calls.length>empty.calls.length);
 assert.ok(full.calls.length>half.calls.length);
 assert.ok(!empty.styles.includes('#4c585d'));
 assert.ok(!half.styles.includes('#dfd5b2'));
});
test('LOD reduz geometria e preserva direção das pontes',()=>{
 const near=render(5,'x',1,74),far=render(5,'x',1,20);
 assert.ok(near.calls.length>far.calls.length);
 assert.notDeepEqual(render(5,'x',1).calls.length,0);
 assert.ok(render(5,'y',1).calls.length>10);
});
test('era atual alimenta construção, ponte pronta e prévia',()=>{
 assert.match(script,/drawBridge\(px,py,ww,hh,b\.axis\|\|'x',progress,game\.era\)/);
 assert.match(script,/drawBridge\(px,py,ww,hh,obj\.axis\|\|'x',1,game\.era\)/);
 assert.match(script,/drawBridge\(px,py,ww,hh,bridgeAxis\(p\.x,p\.y\),1,game\.era\)/);
});
