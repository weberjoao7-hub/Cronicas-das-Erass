'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('// v6.133: cardumes submersos');
const end=script.indexOf('// Garças nas margens:',start);
assert.ok(start>=0&&end>start,'renderizador de cardumes encontrado');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const pose=new Function('rnd',source+';return fishSchoolPose;')(rnd);
function render(ww,now=1200){
 const calls=[];
 const ctx=new Proxy({},{
  get(obj,k){if(k in obj)return obj[k];return (...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'geometria finita: '+k);
   calls.push([k,...args]);
  }},
  set(obj,k,v){obj[k]=v;return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawFishSchool;')(ctx,rnd);
 return {count:draw(ww,ww*.513,24,31,now),calls};
}
test('JavaScript principal compila sem mudar o formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval/);
});
test('cardumes deterministas nao saltam de posicao nem viram abruptamente',()=>{
 const a=pose(24,31,1,4,74,38,1200),b=pose(24,31,1,4,74,38,1216);
 assert.deepEqual(a,pose(24,31,1,4,74,38,1200));
 for(const v of Object.values(a))assert.ok(Number.isFinite(v));
 assert.ok(Math.hypot(b.x-a.x,b.y-a.y)<.5,'trajetoria continua em 16ms');
 const turn=Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle));
 assert.ok(Math.abs(turn)<.08,'rotacao suave em 16ms');
});
test('peixes nadam em trajetorias curvas e movem a cauda',()=>{
 const a=pose(24,31,1,4,74,38,1200),b=pose(24,31,1,4,74,38,5200);
 assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>.5);
 assert.notEqual(a.angle,b.angle);
 assert.notEqual(a.tail,b.tail);
});
test('zoom distante desliga desenho e tres faixas de LOD limitam cardume',()=>{
 assert.equal(render(37).count,0);
 assert.equal(render(37).calls.length,0);
 assert.equal(render(42).count,2);
 assert.equal(render(55).count,3);
 assert.equal(render(74).count,4);
});
test('peixes sao recortados ao losango da agua e usam orientacao continua',()=>{
 const {calls}=render(74);
 assert.equal(calls.filter(c=>c[0]==='clip').length,1);
 assert.equal(calls.filter(c=>c[0]==='rotate').length,4);
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 assert.ok(calls.filter(c=>c[0]==='ellipse').length>=4);
 assert.ok(calls.filter(c=>c[0]==='quadraticCurveTo').length>=4);
});
test('integracao preserva fauna aquatica, nevoa e restricoes de barcos',()=>{
 assert.match(script,/if\(kind==='fish'\)\{\s*drawFishSchool\(ww,hh,x,y,Date\.now\(\)\)/);
 assert.match(script,/if\(animal&&!ruinKind&&visibleFog\[y\*W\+x\]/);
 assert.match(script,/!\(b===0&&boatTiles\.has\(key\(x,y\)\)\)/);
});
