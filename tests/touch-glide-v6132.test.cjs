'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script do jogo');
const start=script.indexOf('function touchGlideVelocity(');
const end=script.indexOf('function applyTouchGlide(',start);
assert.ok(start>=0&&end>start,'função pura da câmera');
const velocity=new Function('const TW=68,TH=34,scale=1;'+script.slice(start,end)+';return touchGlideVelocity')();
test('script compila e preserva o formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('arraste horizontal desloca os dois eixos isométricos',()=>{
 const v=velocity(12,0,24,1);assert.ok(v.vx<0&&v.vy>0);
});
test('arraste vertical desloca a câmera no sentido correto',()=>{
 const v=velocity(0,12,24,1);assert.ok(v.vx<0&&v.vy<0);
});
test('velocidade máxima limita saltos bruscos',()=>{
 const v=velocity(1000,1000,8,1);assert.ok(Math.hypot(v.vx,v.vy)<=34.000001);
});
test('amostras inválidas e antigas não criam impulso',()=>{
 for(const elapsed of [0,-1,121,Infinity,NaN])assert.deepEqual(velocity(10,4,elapsed,1),{vx:0,vy:0});
 assert.deepEqual(velocity(10,4,16,0),{vx:0,vy:0});
});
test('zoom maior reduz a velocidade em coordenadas do mundo',()=>{
 const a=velocity(4,2,32,1),b=velocity(4,2,32,2);
 assert.ok(Math.abs(a.vx-2*b.vx)<1e-9);assert.ok(Math.abs(a.vy-2*b.vy)<1e-9);
});
test('pinça, obra, seleção, minimapa e zoom interrompem a inércia',()=>{
 assert.match(script,/if\(pointers\.size\|\|pinchState\|\|placing\|\|marquee\|\|panel\.classList\.contains\('show'\)\|\|document\.hidden\)/);
 assert.match(script,/C\.addEventListener\('pointerdown',e=>\{stopTouchGlide\(\)/);
 assert.match(script,/C\.addEventListener\('pointercancel',e=>\{stopTouchGlide\(\)/);
 assert.match(script,/function zoomAt\(factor,px,py\)\{\s*cameraFollowUnit=null;\s*if\(typeof stopTouchGlide==='function'\)stopTouchGlide\(\)/);
 assert.match(script,/function panMinimap\(clientX,clientY\)\{\s*cameraFollowUnit=null;\s*if\(typeof stopTouchGlide==='function'\)stopTouchGlide\(\)/);
 assert.match(script,/applyTouchGlide\(dt\);updateFishingBoats\(dt\)/);
});
