'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const begin=script.indexOf('function drawEnemyFortifications(');
const end=script.indexOf('// v6.79: o forte inimigo',begin);
assert.ok(begin>=0&&end>begin,'função de muralhas ausente');
const source=script.slice(begin,end);
function scene(era,ww=74,now=1200){
 const calls=[],colors=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+k);
   calls.push([k,...args]);
  };},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')colors.push(String(v));return true;}
 });
 const draw=new Function('ctx',source+'return drawEnemyFortifications;')(ctx);
 return {result:draw(170,210,ww,ww*.5,era,now),calls,colors};
}
test('v6.113: script compila e salvamento existente é preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/drawTownHall\(px,py,ww,hh,true\);drawEnemyFortifications\(px,py,ww,hh,game\.era,frameTime\);drawEnemyStrongholdDamage/);
});
test('paliçada, pedra, ameias e bastião industrial possuem quatro estágios',()=>{
 assert.equal(scene(0).result,1);
 assert.equal(scene(2).result,2);
 assert.equal(scene(4).result,3);
 assert.equal(scene(7).result,4);
 const first=scene(0),stone=scene(2),medieval=scene(4),industrial=scene(7);
 assert.ok(first.colors.includes('#78583b'),'madeira tribal');
 assert.ok(stone.colors.includes('#9b9787'),'muralha de pedra');
 assert.ok(medieval.colors.includes('#bbb5a2'),'ameias medievais');
 assert.ok(industrial.colors.includes('#78848a'),'alvenaria industrial');
});
test('LOD no zoom distante evita trabalho de Canvas',()=>{
 const far=scene(7,20),mid=scene(7,32),close=scene(7,74);
 assert.equal(far.result,0);assert.equal(far.calls.length,0);
 assert.ok(mid.calls.length>0);assert.ok(close.calls.length>mid.calls.length);
});
test('bandeira anima em zoom próximo e permanece estável à distância',()=>{
 const a=scene(4,74,1000),b=scene(4,74,1800);
 assert.notDeepEqual(a.calls,b.calls);
 assert.deepEqual(scene(4,40,1000).calls,scene(4,40,1800).calls);
});
test('geometria e contexto Canvas permanecem válidos em todas as eras',()=>{
 for(let era=0;era<8;era++){
  const s=scene(era,58,Date.now());
  assert.ok(s.calls.some(c=>c[0]==='ellipse'));
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
