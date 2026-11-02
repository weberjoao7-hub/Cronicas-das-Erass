'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const a=html.indexOf('function drawBridge('),b=html.indexOf('function drawConstructionSite(',a);
assert.ok(a>=0&&b>a,'renderizador de pontes encontrado');
const art=html.slice(a,b);
function scene(era=3,axis='x',progress=1,width=74){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'coordenadas Canvas finitas');calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const draw=new Function('ctx','scale',art+'return drawBridge;')(ctx,width/74);
 draw(240,150,width,width*38/74,axis,progress,era);
 return {calls,styles};
}
test('script compila e chave de salvamento anterior permanece',()=>{
 assert.ok(script);assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
});
test('oito eras, dois eixos e diferentes zooms preservam estado Canvas e coordenadas',()=>{
 for(let era=0;era<8;era++)for(const axis of ['x','y'])for(const width of [20,42,74,140]){
  const {calls}=scene(era,axis,1,width);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('madeira, aduelas de pedra, trelicas e defensas modernas sao diferenciadas',()=>{
 assert.ok(scene(0).styles.includes('#d3ae78'));
 assert.ok(scene(3).styles.includes('#4b5650'));
 assert.ok(scene(5).styles.includes('#354c53'));
 assert.ok(scene(7).styles.includes('#b9c4c2'));
});
test('detalhes estruturais so aparecem quando a ponte esta quase concluida',()=>{
 assert.ok(!scene(5,'x',.5).styles.includes('#354c53'));
 assert.ok(scene(5,'x',1).styles.includes('#354c53'));
 assert.ok(!scene(3,'x',0).styles.includes('#4b5650'));
});
test('LOD retira detalhes distantes e inclui pedra-chave, rebites e refletivos de perto',()=>{
 assert.ok(!scene(5,'x',1,20).styles.includes('#354c53'));
 assert.ok(scene(3,'x',1,90).styles.includes('#d9d2bc'));
 assert.ok(scene(5,'x',1,90).styles.includes('#aebfbd'));
 assert.ok(scene(7,'x',1,90).styles.includes('#d6e7e0'));
});
test('detalhes integrados a ponte existente sem alterar movimentacao ou persistencia',()=>{
 assert.match(art,/drawBridgeEngineering\(px,py,ww,hh,axis,stage,complete\)/);
 assert.match(script,/drawBridge\(px,py,ww,hh,obj\.axis\|\|'x',1,game\.era\)/);
 assert.ok(!art.includes('localStorage'));assert.ok(!art.includes('game.units'));
 assert.notDeepEqual(scene(5,'x').calls,scene(5,'y').calls);
});
