'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1];
const start=html.indexOf('function drawMountain('),end=html.indexOf('// Encostas e colinas:',start);
assert.ok(start>0&&end>start,'renderizador da cordilheira presente');
const source=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function render(x,y,ww,hh,biome=(x,y)=>((x+y)%5===0?4:5)){
 const calls=[],methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath']);
 const ctx=new Proxy({},{get:(o,k)=>methods.has(k)?(...args)=>calls.push([k,...args]):o[k],set:(o,k,v)=>(o[k]=v,true)});
 const draw=new Function('ctx','biome','rnd',source+'return drawMountain')(ctx,biome,rnd);
 draw(200,180,ww,hh,x,y);
 return calls;
}
test('sintaxe, mapa montanhoso e salvamento legado preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/if\(b===5&&ww>13\)\{drawMountain\(/);
 assert.ok(html.includes('cronicas-v04'));
});
test('cordilheiras mantêm facetas determinísticas e ombros ligados ao terreno',()=>{
 const a=render(42,32,74,38),b=render(42,32,74,38),c=render(43,32,74,38);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a,c);
 assert.ok(a.some(call=>call[0]==='ellipse'));
 assert.equal(a[0][0],'save');
 assert.equal(a.at(-1)[0],'restore');
});
test('LOD reduz custo no zoom distante e permite mais detalhes de perto',()=>{
 const far=render(42,32,20,10),mid=render(42,32,40,20),near=render(42,32,74,38);
 assert.ok(near.length>mid.length);
 assert.ok(mid.length>far.length);
});
test('densidade de vizinhos influencia a silhueta sem alterar o mapa',()=>{
 const isolated=render(42,32,74,38,()=>4),massif=render(42,32,74,38,()=>5);
 assert.notDeepEqual(isolated,massif);
});
