'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script do jogo presente');
const cliffStart=script.indexOf('function drawHighlandCliff(');
const cliffEnd=script.indexOf('// Encostas e colinas:',cliffStart);
assert.ok(cliffStart>=0&&cliffEnd>cliffStart,'renderizador de escarpas isolável');
const cliffCode=script.slice(cliffStart,cliffEnd);
function cliff(east,south,kind=4,ww=74){
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args])},set(o,k,v){o[k]=v;return true}});
 const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
 const biome=(x,y)=>x===41&&y===40?east:x===40&&y===41?south:kind;
 const draw=new Function('ctx','rnd','biome','scale',cliffCode+';return drawHighlandCliff')(ctx,rnd,biome,1);
 draw(200,150,ww,ww*38/74,40,40,kind);
 return calls;
}
function preview(type,era){
 const calls=[],ctx=new Proxy({},{get(o,k){if(k==='measureText')return ()=>({width:40});return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true}});
 const a=script.indexOf('function drawPlacementOverlay('),b=script.indexOf('function buildMenu(',a);
 assert.ok(a>=0&&b>a,'prévia isolável');
 const mocks={ctx,placing:type,hoverTile:{x:80,y:80},cx:80,cy:80,W:160,H:160,TW:74,TH:38,scale:1,game:{era,day:1},buildValidation:()=>null,point:()=>[200,150],diamond:()=>{},at:()=>null,bridgeAxis:()=> 'x',forestSeason:()=>1};
 for(const name of ['drawBridge','drawWatchtower','drawEraWatchtower','drawBarracks','drawDock','drawFarm','drawWindmill','drawMine','drawCottage','drawEraResidence','drawResidenceChimney','drawEraStandard','house'])mocks[name]=(...args)=>calls.push([name,...args]);
 const keys=Object.keys(mocks);
 new Function(...keys,script.slice(a,b)+';drawPlacementOverlay();')(...keys.map(k=>mocks[k]));
 return calls;
}
test('script completo compila e salvamento legado continua intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
});
test('escarpas somente nas bordas expostas e sem coordenadas inválidas',()=>{
 assert.equal(cliff(4,4).filter(c=>c[0]==='fill').length,0);
 assert.equal(cliff(2,4).filter(c=>c[0]==='fill').length,1);
 assert.equal(cliff(4,2).filter(c=>c[0]==='fill').length,1);
 const both=cliff(2,1);
 assert.equal(both.filter(c=>c[0]==='fill').length,2);
 for(const op of both)for(const value of op.slice(1))if(typeof value==='number')assert.ok(Number.isFinite(value));
 assert.equal(cliff(2,1,4,16).length,0,'LOD no zoom distante');
 assert.ok(cliff(2,1,4,74).length>cliff(2,1,4,34).length,'fissuras apenas em zoom próximo');
});
test('maciço montanhoso não cria parede contra outra montanha',()=>{
 assert.equal(cliff(5,5,5).filter(c=>c[0]==='fill').length,0);
 assert.equal(cliff(4,5,5).filter(c=>c[0]==='fill').length,1);
 assert.deepEqual(cliff(4,2,5),cliff(4,2,5),'geometria determinística');
});
test('prévias usam arquitetura histórica em todas as oito eras',()=>{
 for(let era=0;era<8;era++){
  const cabin=preview('Cabana',era),tower=preview('Torre',era),barracks=preview('Quartel',era);
  assert.equal(cabin.find(c=>c[0]==='drawEraResidence')?.at(-1),era);
  assert.equal(tower.find(c=>c[0]==='drawEraWatchtower')?.at(-1),era);
  assert.equal(barracks.find(c=>c[0]==='drawBarracks')?.at(-1),era);
  assert.ok(!cabin.some(c=>c[0]==='drawCottage'));
  assert.ok(!tower.some(c=>c[0]==='drawWatchtower'));
  assert.ok(tower.some(c=>c[0]==='drawEraStandard'));
  assert.ok(barracks.some(c=>c[0]==='drawEraStandard'));
  assert.ok(preview('Pesqueiro',era).some(c=>c[0]==='drawEraStandard'));
 }
});
test('relevo integra o pintor isométrico sem alterar navegação',()=>{
 assert.match(script,/if\(b===4\|\|b===5\)drawHighlandCliff\(px,py,ww,hh,x,y,b\)/);
 assert.match(script,/function passable\(x,y\)/);
});
