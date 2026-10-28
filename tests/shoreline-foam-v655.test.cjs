'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const a=script.indexOf('function drawShoreFoam('),b=script.indexOf('function drawCoast(',a);
assert.ok(a>=0&&b>a,'espuma costeira isolável');
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(width,mask,now=20000){
 const calls=[],methods=new Set(['save','restore','beginPath','moveTo','lineTo','closePath','clip','quadraticCurveTo','stroke','ellipse','fill']);
 const ctx=new Proxy({},{
  get(o,k){return methods.has(k)?(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'geometria finita');
   calls.push([k,...args]);
  }:o[k]},
  set(o,k,v){o[k]=v;return true}
 });
 new Function('ctx','scale','rnd',source+';return drawShoreFoam')(ctx,1,rnd)(200,150,width,width*38/74,42,45,mask,now);
 return calls;
}
test('script completo compila e preserva salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/cronicas-v04/);
});
test('ondas seguem apenas margens e não gastam Canvas no zoom distante',()=>{
 assert.equal(scene(24,15).length,0);
 assert.equal(scene(74,0).length,0);
 assert.ok(scene(44,1).length>0);
 assert.ok(scene(74,15).length>scene(74,1).length);
});
test('LOD adiciona segunda arrebentação e partículas apenas perto',()=>{
 assert.ok(scene(74,15).length>scene(44,15).length);
 assert.ok(scene(74,1).some(op=>op[0]==='ellipse'));
 assert.ok(!scene(44,1).some(op=>op[0]==='ellipse'));
});
test('animação é determinística no tempo e não cria coordenadas inválidas',()=>{
 assert.deepEqual(scene(74,15,12345),scene(74,15,12345));
 assert.notDeepEqual(scene(74,15,12345),scene(74,15,22345));
 assert.ok(scene(74,15).length<200,'custo limitado por ladrilho');
});
test('margens usam tempo do quadro e permanecem na camada de água',()=>{
 assert.match(script,/drawCoast\(px,py,ww,hh,x,y,shoreMask\[y\*W\+x\]\);drawShoreFoam\(px,py,ww,hh,x,y,shoreMask\[y\*W\+x\],frameTime\)/);
 assert.match(script,/ctx\.clip\(\)/);
 assert.match(script,/if\(b===0&&shoreMask\[y\*W\+x\]&&ww>20\)/);
});
