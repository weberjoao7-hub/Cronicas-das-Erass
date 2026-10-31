'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('// v6.132: rastros de passos');
const end=script.indexOf('function drawUnitGroundShadow(',start);
assert.ok(start>=0&&end>start);
const source=script.slice(start,end),calls=[];
const ctx={save(){calls.push('save')},restore(){calls.push('restore')},beginPath(){},
 fill(){calls.push('fill')},ellipse(...a){assert.ok(a.every(Number.isFinite));calls.push('ellipse')}};
const {groundTrackMaterial:m,appendGroundTrack:step,drawGroundTracksTile:draw}=
 new Function('ctx','point',source+';return {groundTrackMaterial,appendGroundTrack,drawGroundTracksTile};')(ctx,(x,y)=>[(x-y)*34,(x+y)*17]);
test('script valido e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random/);
});
test('marcas so aparecem em neve ou terreno molhado transitavel',()=>{
 assert.equal(m(3,0,1),'snow');assert.equal(m(1,.8,3),'mud');
 assert.equal(m(1,.31,2),null);
 for(const b of [0,4,5])assert.equal(m(3,1,b),null);
 assert.equal(m(3,1,1,true),null);
});
test('passos exigem distancia e historico nao ultrapassa dez',()=>{
 let s=step(null,{x:10,y:10},1000,'snow');
 s=step(s,{x:10.1,y:10.1},1100,'snow');assert.equal(s.marks.length,0);
 for(let i=1;i<=30;i++)s=step(s,{x:10+i*.3,y:10},1200+i*120,'snow');
 assert.equal(s.marks.length,10);
 assert.ok(s.marks.every(v=>v.kind==='snow'&&Number.isFinite(v.angle)));
});
test('teleporte e troca de material nao conectam rastros',()=>{
 let s=step(null,{x:2,y:2},1000,'mud');
 s=step(s,{x:2.5,y:2},1100,'mud');assert.equal(s.marks.length,1);
 s=step(s,{x:30,y:30},1200,'mud');assert.equal(s.marks.length,0);
 s=step(s,{x:30.5,y:30},1300,'snow');assert.equal(s.marks.length,0);
});
test('Canvas renderiza pares finitos, desliga longe e elimina rastros vencidos',()=>{
 const marks=[{x:4,y:5,at:1000,angle:0,kind:'snow'}];
 assert.equal(draw(marks,.6,2000),0);assert.equal(calls.length,0);
 assert.equal(draw(marks,1,2000),2);
 assert.equal(calls.filter(v=>v==='ellipse').length,2);
 assert.equal(draw(marks,1,20000),0);
});
test('integracao usa visibilidade e desenha pegadas depois do solo',()=>{
 assert.match(source,/!visibleFog\[y\*W\+x\]/);
 assert.match(source,/roadTiles\.has\(key\(x,y\)\)/);
 assert.match(script,/recordGroundTracks\(Date\.now\(\)\)/);
 assert.match(script,/const groundTrackTiles=collectGroundTrackTiles\(bounds,frameTime\)/);
 assert.match(script,/if\(visibleFog\[y\*W\+x\]\)drawGroundTracksTile\(groundTrackTiles\.get\(key\(x,y\)\),z,frameTime\)/);
});
