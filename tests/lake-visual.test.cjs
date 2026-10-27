'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match);
const script=match[1];
const start=script.indexOf('function drawLakeDetails('),end=script.indexOf('function tree(',start);
assert.ok(start>=0&&end>start);
const art=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(q,mask,occupied,width=74,time=123456){
 const calls=[],methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','quadraticCurveTo','closePath','arc']);
 const ctx=new Proxy({},{get:(o,k)=>methods.has(k)?(...args)=>calls.push([k,...args]):o[k],set:(o,k,v)=>(o[k]=v,true)});
 new Function('ctx','scale','rnd',art+';return drawLakeDetails')(ctx,1,rnd)(250,200,width,38,15,17,q,mask,occupied,time);
 return calls;
}
test('sintaxe, integração e salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/if\(b===0\)drawLakeDetails\(/);
 assert.match(script,/const frameTime=Date\.now\(\)/);
 assert.match(html,/cronicas-v04/);
});
test('lago procedural determinístico e detalhado',()=>{
 assert.deepEqual(scene(.85,1,false),scene(.85,1,false));
 assert.ok(scene(.85,1,false).length>40);
});
test('LOD elimina detalhes no zoom distante',()=>{
 assert.equal(scene(.85,1,false,18).length,0);
 assert.ok(scene(.85,1,false,40).length>0);
});
test('plantas e peixes não atravessam construções aquáticas',()=>{
 assert.ok(scene(.85,1,false).length>scene(.85,1,true).length);
 assert.ok(scene(.99,0,false).length>scene(.99,0,true).length);
});
test('geometria limitada por terreno',()=>assert.ok(scene(.99,15,false).length<170));
