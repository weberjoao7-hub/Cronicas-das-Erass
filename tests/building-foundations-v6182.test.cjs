'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawBuildingFoundation(');
const end=script.indexOf('function drawStructureShadow(',start);
assert.ok(start>=0&&end>start,'funcao isolavel');
const source=script.slice(start,end);
function scene(era=3,ww=80,season=1,rain=0,type='Quartel'){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k);calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const fn=new Function('ctx',source+'return drawBuildingFoundation;')(ctx);
 return {count:fn(130,160,ww,ww*.5,type,era,season,rain,37),calls,styles};
}
test('v6.182: sintaxe JavaScript e chave de save preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=182);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random|game\./);
});
test('fundacoes usam madeira pedra e concreto metal conforme era',()=>{
 assert.ok(scene(0).styles.includes('#a28b63'));
 assert.ok(scene(3).styles.includes('#b7a88b'));
 assert.ok(scene(7).styles.includes('#899a99'));
 assert.notDeepEqual(scene(0).styles,scene(7).styles);
});
test('LOD limita custo de desenho no zoom distante',()=>{
 assert.equal(scene(3,25).count,0);
 assert.equal(scene(3,25).calls.length,0);
 assert.ok(scene(3,90).calls.length>scene(3,38).calls.length);
 assert.equal(scene(3,80,1,0,'Ponte').count,0);
 assert.equal(scene(3,80,1,0,'Pesqueiro').count,0);
});
test('neve e chuva mudam somente o acabamento',()=>{
 const snow=scene(3,80,3),sun=scene(3,80,1),rain=scene(3,80,1,.7);
 assert.ok(snow.styles.includes('#e9f0e4c9'));
 assert.ok(!sun.styles.includes('#e9f0e4c9'));
 assert.ok(rain.styles.includes('#c8d9cc83'));
 assert.ok(!sun.styles.includes('#c8d9cc83'));
});
test('geometria finita e pilha Canvas equilibrada em oito eras',()=>{
 for(let era=0;era<8;era++)for(const season of [0,1,2,3])for(const ww of [25,35,55,90]){
  const {calls}=scene(era,ww,season,.5);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('fundacao integra render de edificios concluidos sem mudar colisoes',()=>{
 assert.match(script,/if\(obj&&!obj\.buildLeft\)drawBuildingFoundation\(px,py,ww,hh,obj\.t,game\.era,forestSeason\(\),rainLevel,x\*97\+y\*13\)/);
 assert.ok(script.indexOf('drawBuildingFoundation(px,py,ww,hh,obj.t')<script.indexOf('drawBuildingApproach(px,py,ww,hh,x,y,obj.t'));
 assert.deepEqual(scene(3,80,1,.2),scene(3,80,1,.2));
 assert.doesNotMatch(source,/\b(?:assignRoute|passable|localStorage)\s*\(/);
});
