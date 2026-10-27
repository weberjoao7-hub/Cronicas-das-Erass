'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('function drawConstructionSite(');
const end=script.indexOf('// Only the civic center',start);
assert.ok(start>=0&&end>start,'renderer de obras encontrado');
const source=script.slice(start,end);
function render(type,era,width=74,progress=.6){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{calls.push([k,...args]);for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenada finita')}},
 set(o,k,v){o[k]=v;if(k==='strokeStyle'||k==='fillStyle')styles.push(v);return true}});
 const mock=(name)=>(...args)=>calls.push([name,...args]);
 const names=['drawBridge','drawEraWatchtower','drawEraResidence','drawBarracks','drawFarm','drawWindmill','drawMine','drawDock','house'];
 const args=[ctx,width/74,{era},...names.map(mock)];
 const draw=new Function('ctx','scale','game',...names,source+';return drawConstructionSite;')(...args);
 draw({t:type,x:82,y:81,buildLeft:18*(1-progress),buildTotal:18,axis:'y'},180,200,width,width*38/74);
 return {calls,styles};
}
test('script completo e teste compilam',()=>assert.doesNotThrow(()=>new Function(script)));
test('obras de cabanas, torres e quartéis exibem a arquitetura da era atual',()=>{
 for(let era=0;era<8;era++){
  const cabin=render('Cabana',era).calls.find(x=>x[0]==='drawEraResidence');
  const tower=render('Torre',era).calls.find(x=>x[0]==='drawEraWatchtower');
  const barracks=render('Quartel',era).calls.find(x=>x[0]==='drawBarracks');
  assert.equal(cabin.at(-1),era);assert.equal(tower.at(-1),era);assert.equal(barracks.at(-1),era);
 }
});
test('andaimes mudam de madeira para pedra e metal, sem alterar progresso',()=>{
 const early=render('Cabana',0),classical=render('Cabana',3),modern=render('Cabana',7);
 assert.ok(early.styles.includes('#8d7c61'));
 assert.ok(classical.styles.includes('#aaa08a'));
 assert.ok(modern.styles.includes('#69777a'));
 assert.ok(modern.styles.includes('#c3d2d0'));
 assert.ok(!early.styles.includes('#c3d2d0'));
});
test('LOD reduz geometria; silhueta surge somente depois de 30%',()=>{
 const far=render('Cabana',7,16),near=render('Cabana',7,74);
 assert.ok(near.calls.length>far.calls.length);
 assert.equal(render('Cabana',7,74,.2).calls.some(x=>x[0]==='drawEraResidence'),false);
 assert.equal(near.calls.some(x=>x[0]==='drawEraResidence'),true);
});
test('pontes preservam eixo, progresso e era',()=>{
 const call=render('Ponte',7,74,.5).calls.find(x=>x[0]==='drawBridge');
 assert.ok(call);assert.equal(call[5],'y');assert.equal(call[6],.5);assert.equal(call[7],7);
});
test('chave de salvamento original preservada',()=>assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/));
