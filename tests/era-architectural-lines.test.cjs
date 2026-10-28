'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script exists');

function extract(name,nextMarker){
 const start=script.indexOf('function '+name+'(');
 const end=script.indexOf(nextMarker,start);
 assert.ok(start>=0&&end>start,name+' renderer exists');
 return script.slice(start,end);
}
const residence=extract('drawEraResidence','/* Fortificações');
const tower=extract('drawEraWatchtower','function drawTownHallEraDetails');

function render(kind,era,level=1,ww=72){
 const ops=[];
 const ctx=new Proxy({},{get(target,key){
  if(key in target)return target[key];
  return (...args)=>ops.push({name:key,args,stroke:target.strokeStyle});
 },set(target,key,value){target[key]=value;return true}});
 const source=kind==='residence'?residence:tower;
 const name=kind==='residence'?'drawEraResidence':'drawEraWatchtower';
 const draw=new Function('ctx','scale','drawCottage','drawWatchtower',source+';return '+name+';')(ctx,1,()=>{},()=>{});
 if(kind==='residence')draw(180,150,ww,ww*.52,level,13,era);
 else draw(180,150,ww,ww*.52,level,era,1000);
 return ops;
}
test('complete inline game JavaScript parses',()=>assert.doesNotThrow(()=>new Function(script)));
test('era architecture never submits NaN coordinates to Canvas',()=>{
 let checked=0;
 for(const kind of ['residence','tower'])for(let era=0;era<8;era++)
  for(let level=1;level<=3;level++)for(const ww of [28,72]){
   const ops=render(kind,era,level,ww);
   for(const op of ops.filter(o=>['moveTo','lineTo','ellipse','arc'].includes(o.name))){
    for(const n of op.args)assert.ok(Number.isFinite(n),kind+' era '+era+' level '+level+' zoom '+ww+' '+op.name+' '+String(n));
    checked++;
   }
  }
 assert.ok(checked>500,'renderers produce meaningful geometry');
});
test('wooden and industrial watchtower braces are actually stroked',()=>{
 const wood=render('tower',0),steel=render('tower',6);
 assert.ok(wood.some(o=>o.name==='stroke'&&o.stroke==='#765035'));
 assert.ok(steel.some(o=>o.name==='stroke'&&o.stroke==='#6e8a91'));
});
test('medieval facade gables draw complete multi-segment trim',()=>{
 const ops=render('residence',4,1,72);
 let segments=0,found=false;
 for(const op of ops){
  if(op.name==='beginPath')segments=0;
  if(op.name==='lineTo')segments++;
  if(op.name==='stroke'&&op.stroke==='#70503a'&&segments>=2)found=true;
 }
 assert.ok(found,'fronton has two connected line segments');
});
test('close zoom retains architectural details across eras',()=>{
 for(const era of [2,4,5,6,7]){
  const far=render('residence',era,1,28);
  const near=render('residence',era,1,72);
  assert.ok(near.length>far.length,'era '+era+' adds near-zoom detail');
 }
});
test('existing save format remains unchanged',()=>assert.match(script,/cronicas-v04/));
