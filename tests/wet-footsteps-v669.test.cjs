'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('let renderRainLevel=0;');
const end=script.indexOf('// Ocupantes de um mesmo ladrilho',start);
assert.ok(start>=0&&end>start,'efeito de passos isolável');
const source=script.slice(start,end);
function scene(ground=2){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;return true}
 });
 const api=new Function('ctx','biome',source+';return {drawMarchDust,setRain(v){renderRainLevel=v}};')(ctx,()=>ground);
 return {...api,calls};
}
const worker={kind:'worker',x:80.5,y:80.5,path:[{x:81,y:81}]};
test('v6.69 compila e preserva o salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/cronicas-v04/);
});
test('tempo seco conserva poeira e chuva substitui poeira por água',()=>{
 const dry=scene();dry.setRain(0);dry.drawMarchDust(worker,100,150,1,1800);
 assert.equal(dry.calls.filter(c=>c[0]==='fill').length,2);
 assert.equal(dry.calls.filter(c=>c[0]==='stroke').length,0);
 const wet=scene();wet.setRain(.82);wet.drawMarchDust(worker,100,150,1,1800);
 assert.equal(wet.calls.filter(c=>c[0]==='stroke').length,2);
 assert.equal(wet.calls.filter(c=>c[0]==='fill').length,0);
});
test('LOD, terreno e imobilidade desativam partículas',()=>{
 for(const [z,ground,u] of [[.6,2,worker],[1,0,worker],[1,5,worker],[1,2,{...worker,path:[]}]]) {
  const s=scene(ground);s.setRain(.8);s.drawMarchDust(u,100,150,z,1800);
  assert.equal(s.calls.length,0);
 }
});
test('cavalaria produz respingos mais largos e animação muda com tempo',()=>{
 const a=scene(),b=scene(),c=scene();
 for(const s of [a,b,c])s.setRain(.82);
 a.drawMarchDust(worker,100,150,1.4,1800);
 b.drawMarchDust({...worker,kind:'cavalry'},100,150,1.4,1800);
 c.drawMarchDust(worker,100,150,1.4,2400);
 const ellipses=s=>s.calls.filter(c=>c[0]==='ellipse');
 assert.equal(ellipses(a).length,2);
 assert.ok(ellipses(b)[0][3]>ellipses(a)[0][3]);
 assert.notDeepEqual(ellipses(a),ellipses(c));
 assert.ok(a.calls.length<30&&b.calls.length<30,'operações limitadas por unidade');
});
test('chuva é compartilhada no quadro e não altera estado persistido',()=>{
 assert.match(script,/renderRainLevel=rainLevel;ctx\.setTransform/);
 assert.match(script,/drawMarchDust\(u,px,py,z,now\)/);
 assert.doesNotMatch(source,/localStorage|game\.|routeFor|(?:^|[^\w.])save\(/);
});
