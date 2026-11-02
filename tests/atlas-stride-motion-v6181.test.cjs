'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function atlasStrideMotion('),end=script.indexOf('const paintedCavalry',start);
assert.ok(start>0&&end>start,'helper isolavel');
const source=script.slice(start,end);
const distances=new WeakMap();
const gait=new Function('unitStrideDistance',source+'return atlasStrideMotion;')(distances);
test('v6.181: script compila e save v04 permanece compativel',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=181);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('sem movimento ou sem distancia valida nao altera o atlas',()=>{
 const u={path:[]};
 assert.equal(gait(u,false),null);assert.equal(gait(u,true),null);
 assert.equal(gait(null,true),null);assert.equal(gait({},false),null);
});
test('oscilacao periodica usa distancia percorrida e limites seguros',()=>{
 const u={};for(const d of [0,.05,.15,.3,.45,.6,1.2,7.4]){
  distances.set(u,d);const v=gait(u,true,false);
  assert.ok(Number.isFinite(v.lean)&&Number.isFinite(v.stretch));
  assert.ok(Math.abs(v.lean)<=.042001);assert.ok(v.stretch>=.978999&&v.stretch<=1.021001);
 }
 distances.set(u,.15);const a=gait(u,true,false);
 distances.set(u,.75);const b=gait(u,true,false);
 assert.ok(Math.abs(a.lean-b.lean)<1e-10);assert.ok(Math.abs(a.stretch-b.stretch)<1e-10);
});
test('cavalaria usa transferencia de peso menos intensa e passada mais longa',()=>{
 const u={};distances.set(u,.12);
 const foot=gait(u,true,false),horse=gait(u,true,true);
 assert.notDeepEqual(foot,horse);
 assert.ok(Math.abs(horse.lean)<=.020001);
 assert.ok(horse.stretch>=.987999&&horse.stretch<=1.012001);
});
test('quatro caminhos de atlas aplicam a transformacao no mesmo Canvas',()=>{
 for(const name of ['drawPaintedCavalry','drawPaintedTroop','drawPaintedVillager','drawVillagerAtlas']){
  const begin=script.indexOf('function '+name+'(');
  assert.ok(begin>0,name);
  const next=script.indexOf('\nfunction ',begin+12);
  const body=script.slice(begin,next<0?begin+3200:next);
  assert.match(body,/atlasStrideMotion\(u,moving,(true|false)\)/,name);
  assert.match(body,/if\(gait\)ctx\.transform\(1,0,gait\.lean,gait\.stretch,0,0\)/,name);
 }
});
test('sem estado persistente e sem desenho extra por passada',()=>{
 assert.doesNotMatch(source,/Date\.now|performance\.now|requestAnimationFrame|drawImage|ctx\.|save\(|set\(/);
 const u={};distances.set(u,.21);
 const a=gait(u,true),b=gait(u,true);
 assert.deepEqual(a,b);
 assert.equal(gait(u,false),null);
});
