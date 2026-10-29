'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.97: treino ambiental no patio do quartel');
const end=script.indexOf('/* Quartel: fortificacao isometrica',start);
assert.ok(start>=0&&end>start,'funcao de treino identificada');
const source=script.slice(start,end);
const makeDrill=new Function('ctx',source+';return drawBarracksTraining;');
function scene(era=4,ww=74,now=1200){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenadas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const count=makeDrill(ctx)(180,230,ww,ww*38/74,era,now);
 return {count,calls,styles};
}
test('v6.97: JavaScript principal valido e salvamento original preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=97);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random|game\.buildings\.push/);
});
test('treino nao desenha no zoom distante e aparece perto do quartel',()=>{
 const far=scene(4,30),near=scene(4,74);
 assert.equal(far.count,0);assert.equal(far.calls.length,0);
 assert.equal(near.count,1);
 assert.ok(near.calls.some(c=>c[0]==='ellipse'),'sombras ancoradas no piso');
 assert.ok(near.calls.some(c=>c[0]==='strokeRect'),'alvo de treino');
});
test('eras mudam equipamento e figurino sem trocar dados do jogo',()=>{
 const primitive=scene(0),medieval=scene(4),industrial=scene(7);
 assert.ok(primitive.styles.includes('#ad8554'),'tunica primordial');
 assert.ok(medieval.styles.includes('#617781'),'armadura medieval');
 assert.ok(industrial.styles.includes('#526e70'),'uniforme industrial');
 assert.ok(industrial.styles.includes('#2d393b'),'fuzil de treino');
 assert.ok(primitive.styles.includes('#aaa58a'),'ponta da lanca');
 assert.ok(medieval.styles.includes('#d5d7cb'),'ponta da espada');
 assert.notDeepEqual(primitive.calls,industrial.calls);
});
test('passos e golpe variam com o relogio sem alteracao persistente',()=>{
 const a=scene(4,74,1000),b=scene(4,74,1430);
 assert.notDeepEqual(a.calls,b.calls);
 assert.equal(a.calls.length,b.calls.length);
});
test('Canvas sempre restaura estado e recebe coordenadas finitas',()=>{
 for(const era of [0,2,4,6,7])for(const zoom of [35,54,80]){
  const s=scene(era,zoom,2000);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('recrutas aparecem somente em quarteis prontos e respeitam renderizacao por tile',()=>{
 const branch=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(branch,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite\(obj,px,py,ww,hh\)\}/);
 assert.match(branch,/else if\(obj\.t==='Quartel'\)\{drawBarracks\(px,py,ww,hh,game\.era,frameTime\);drawBarracksTraining\(px,py,ww,hh,game\.era,frameTime\);\}/);
 assert.match(branch,/if\(!exploredFog\[y\*W\+x\]\)continue/);
 assert.match(branch,/const structureActors=obj\?tileActors\(x,y,unitTiles,enemyTiles\):null/);
});
