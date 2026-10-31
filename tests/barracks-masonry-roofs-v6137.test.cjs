'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal disponivel');
const from=script.indexOf('// v6.137: cantaria');
const to=script.indexOf('/* Quartel: fortificacao',from);
assert.ok(from>=0&&to>from,'detalhes arquitetonicos isolaveis');
const source=script.slice(from,to);
function scene(kind,{era=4,ww=90,hh=45,x=-.34}={}){
 const calls=[],colors=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+String(k)+' finite');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='strokeStyle'||k==='fillStyle')colors.push(v);return true}
 });
 const functions=new Function('ctx',source+';return {drawBarracksMasonry,drawBarracksRoofTexture}')(ctx);
 const result=kind==='roof'
  ?functions.drawBarracksRoofTexture(150,120,ww,hh,era,x)
  :functions.drawBarracksMasonry(150,120,ww,hh,era);
 return {result,calls,colors};
}
test('v6.137: script parseavel e salvamento anterior preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame|setInterval|game\./);
});
test('cantaria segue as duas faces em perspectiva e recorta as juntas',()=>{
 const s=scene('wall');
 assert.equal(s.result,1);
 assert.equal(s.calls.filter(c=>c[0]==='clip').length,2);
 assert.ok(s.calls.filter(c=>c[0]==='lineTo').length>=12);
 assert.ok(s.colors.includes('#eee1c8'));
 assert.ok(s.colors.includes('#52615c'));
});
test('masonry and roof respect zoom LOD and era thresholds',()=>{
 assert.equal(scene('wall',{ww:40}).result,0);
 assert.equal(scene('roof',{ww:40}).result,0);
 assert.equal(scene('roof',{era:2}).result,0);
 assert.equal(scene('wall',{era:1}).result,0);
 assert.ok(scene('wall',{ww:96}).calls.length>scene('wall',{ww:60}).calls.length);
});
test('telhado medieval tem fiadas de ardósia; industrial tem rebites',()=>{
 const medieval=scene('roof',{era:4,ww:90}),industrial=scene('roof',{era:6,ww:90});
 assert.equal(medieval.result,1);assert.equal(industrial.result,1);
 assert.equal(medieval.calls.filter(c=>c[0]==='clip').length,2);
 assert.equal(industrial.calls.filter(c=>c[0]==='clip').length,2);
 assert.equal(medieval.calls.filter(c=>c[0]==='arc').length,0);
 assert.equal(industrial.calls.filter(c=>c[0]==='arc').length,6);
 assert.ok(medieval.colors.includes('#d3a18a'));
 assert.ok(industrial.colors.includes('#a8c0c0'));
});
test('Canvas state is balanced, deterministic and finite on both tower sides',()=>{
 for(const kind of ['wall','roof']){
  for(const era of [2,4,6]){
   const a=scene(kind,{era,x:-.34}),b=scene(kind,{era,x:-.34});
   assert.deepEqual(a.calls,b.calls);
   assert.equal(a.calls.filter(c=>c[0]==='save').length,
                a.calls.filter(c=>c[0]==='restore').length);
   if(kind==='roof'&&era>=4)assert.notDeepEqual(
    scene(kind,{era,x:-.34}).calls,scene(kind,{era,x:.32}).calls);
  }
 }
});
test('render do quartel integra detalhes sem alterar economia ou tropas',()=>{
 assert.match(script,/drawBarracksMasonry\(px,py,ww,hh,era\)/);
 assert.match(script,/drawBarracksRoofTexture\(px,py,ww,hh,era,x\)/);
 assert.match(script,/drawBarracks\(px,py,ww,hh,game\.era,frameTime\)/);
 assert.match(script,/drawBarracksTraining\(px,py,ww,hh,game\.era,frameTime\)/);
});
