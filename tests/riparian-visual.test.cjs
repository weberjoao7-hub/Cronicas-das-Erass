'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawRiparianVegetation('),end=script.indexOf('function rock(',start);
assert.ok(start>0&&end>start,'helper de margens');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function render(width,mask=15,x=11,y=14){
 const calls=[],ctx=new Proxy({}, {get(t,k){if(!(k in t))t[k]=(...args)=>{
  for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenada finita');
  calls.push(k);};return t[k];}});
 const draw=new Function('ctx','rnd',source+';return drawRiparianVegetation;')(ctx,rnd);
 draw(100,100,width,width*38/74,x,y,mask,12500);return calls;
}
test('JavaScript principal compila',()=>assert.doesNotThrow(()=>new Function(script)));
test('cache ripário usa quatro vizinhos e somente campos',()=>{
 assert.match(script,/const riparianMask=new Uint8Array\(W\*H\)/);
 assert.match(script,/biome\(x,y\)===1\|\|biome\(x,y\)===2/);
 assert.match(script,/biome\(x-1,y\)===0\?1:0/);
});
test('LOD e bitmask impedem desenho desnecessário',()=>{
 assert.equal(render(27,15).length,0);assert.equal(render(74,0).length,0);
 assert.ok(render(38,1).length>0);
});
test('juncos ficam mais detalhados perto e seguem margens adjacentes',()=>{
 assert.ok(render(54,1).length>render(38,1).length);
 assert.ok(render(54,15).length>render(54,1).length);
});
test('salgueiro possui copa, tronco e ramos animados',()=>{
 let found=null;for(let x=0;x<30&&!found;x++)for(let y=0;y<20;y++)if(rnd(x,y,183)>.72){found=[x,y];break}
 assert.ok(found);assert.ok(render(74,15,...found).length>render(54,15,...found).length);
});
test('renderização respeita construções, estradas e ruínas',()=>{
 assert.match(script,/if\(\(b===1\|\|b===2\)\&\&!ruinKind\&\&!structures\.has\(key\(x,y\)\)\&\&!roadTiles\.has\(key\(x,y\)\)\)\{/);
 assert.match(script,/if\(riparianMask\[y\*W\+x\]\)drawRiparianVegetation/);
});
test('chave de salvamento preservada',()=>assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/));
