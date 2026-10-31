'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const begin=script.indexOf('function drawFarmLivestock(');
const end=script.indexOf('function drawFarmWorkers(',begin);
assert.ok(begin>=0&&end>begin,'renderizador dos animais isolavel');
const source=script.slice(begin,end);
function scene(ww=94,level=2,now=1234,season=1,era=3){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const rnd=(x,y,salt)=>((Math.sin(x*17.13+y*21.2+salt*7.1)*43758.5453)%1+1)%1;
 const draw=new Function('ctx','rnd',source+'return drawFarmLivestock')(ctx,rnd);
 const count=draw(190,210,ww,ww*.5,era,level,now,season,14,22);
 return {count,calls,styles};
}
test('script completo compila e o save existente permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|game\.|save\(|setInterval|Math\.random/);
});
test('animais sao renderizados somente nas fazendas construidas, apos cerca e antes dos trabalhadores',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function drawPlacementOverlay(){'));
 const farm=render.match(/else if\(obj\.t==='Fazenda'\)\{([^}]+)\}/)?.[1];
 assert.ok(farm,'ramo da fazenda ausente');
 assert.ok(farm.indexOf('drawFarmBoundary(')<farm.indexOf('drawFarmLivestock('));
 assert.ok(farm.indexOf('drawFarmLivestock(')<farm.indexOf('drawFarmWorkers('));
 assert.ok(render.includes('if(obj&&obj.buildLeft){drawConstructionSite'));
});
test('LOD limita animais em zoom distante e cabra exige nivel dois',()=>{
 assert.equal(scene(35).count,0);
 assert.equal(scene(60,1).count,2);
 assert.equal(scene(60,3).count,2);
 assert.equal(scene(75,1).count,2);
 assert.equal(scene(75,2).count,3);
 assert.equal(scene(94,1).count,3);
 assert.equal(scene(94,2).count,4);
 assert.equal(scene(94,3).count,4);
});
test('animacao e distribuicao sao deterministicas, sem posicoes aleatorias por quadro',()=>{
 assert.deepEqual(scene(96,2,1300).calls,scene(96,2,1300).calls);
 assert.notDeepEqual(scene(96,2,1300).calls,scene(96,2,2400).calls);
});
test('inverno altera galinhas e cabra sem modificar geometria ou quantidade',()=>{
 const summer=scene(96,2,1500,1),winter=scene(96,2,1500,3);
 assert.equal(summer.count,winter.count);
 assert.ok(summer.styles.includes('#d8b88a'));
 assert.ok(winter.styles.includes('#d5c5a7'));
 assert.ok(winter.styles.includes('#d6d5ca'));
 assert.notDeepEqual(summer.styles,winter.styles);
});
test('Canvas balanceado e coordenadas finitas em diferentes eras, zooms e estacoes',()=>{
 for(const ww of [28,56,65,74,82,120])for(const season of [0,1,2,3])for(const era of [0,3,7]){
  const {calls}=scene(ww,2,1500,season,era);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('entrada invalida e zoom baixo nao desenham nada',()=>{
 const ctx=new Proxy({}, {get:()=>()=>{throw Error('Canvas nao deve ser chamado')}});
 const rnd=()=>.5;
 const draw=new Function('ctx','rnd',source+'return drawFarmLivestock')(ctx,rnd);
 assert.equal(draw(0,0,40,20,2,2,1200,1,1,1),0);
 assert.equal(draw(0,0,70,30,2,2,Infinity,1,1,1),0);
});
