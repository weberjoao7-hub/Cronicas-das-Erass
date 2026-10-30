'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const start=script.indexOf('function orchardTile('),end=script.indexOf('function meadowDetails(',start);
assert.ok(start>=0&&end>start,'pomares não encontrados');
const source=script.slice(start,end);
function scene(season=1,ww=74,now=1000,random=.99){
 const calls=[],colors=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true;}});
 const rnd=()=>random;
 const {orchardTile,drawOrchard}=new Function('ctx','rnd',source+'return {orchardTile,drawOrchard}')(ctx,rnd);
 return {calls,colors,orchardTile,drawOrchard,result:drawOrchard(170,220,ww,ww*.52,31,27,season,now)};
}
test('v6.114: sintaxe compila, mantém salvamento e integração só em pradarias desocupadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/if\(orchardTile\(x,y,b\)&&!riparianMask\[y\*W\+x\]\)drawOrchard/);
 assert.match(script,/if\(\(b===1\|\|b===2\)&&!ruinKind&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)\)/);
});
test('pomar aparece somente em pradaria e em posições determinísticas raras',()=>{
 const s=scene();
 assert.equal(s.orchardTile(4,9,2),true);
 assert.equal(s.orchardTile(4,9,1),false);
 const empty=scene(1,74,1000,.5);
 assert.equal(empty.orchardTile(4,9,2),false);
});
test('LOD evita desenho distante e reduz custo no zoom intermediário',()=>{
 const far=scene(1,20),mid=scene(1,40),close=scene(1,80);
 assert.equal(far.result,0);assert.equal(far.calls.length,0);
 assert.equal(mid.result,1);assert.equal(close.result,2);
 assert.ok(close.calls.length>mid.calls.length);
});
test('primavera, verão, outono e inverno possuem paletas distintas',()=>{
 const spring=scene(0),summer=scene(1),autumn=scene(2),winter=scene(3);
 assert.ok(spring.colors.includes('#f4d9c9'));
 assert.ok(summer.colors.includes('#c34f36'));
 assert.ok(autumn.colors.includes('#d49b46'));
 assert.ok(winter.colors.includes('#edf3e5b9'));
});
test('vento anima somente em zoom próximo, sem mover as raízes',()=>{
 const a=scene(1,74,1000),b=scene(1,74,2800);
 assert.notDeepEqual(a.calls,b.calls);
 assert.deepEqual(scene(1,40,1000).calls,scene(1,40,2800).calls);
});
test('Canvas usa coordenadas finitas e preserva save/restore em todas as estações',()=>{
 for(let season=0;season<4;season++){
  const s=scene(season,84);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
  assert.ok(s.calls.some(c=>c[0]==='ellipse'));
 }
});
