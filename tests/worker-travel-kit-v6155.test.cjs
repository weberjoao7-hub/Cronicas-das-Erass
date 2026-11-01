'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=script.indexOf('function drawWorkerTravelKit('),end=script.indexOf('function drawTileOccupants(',start);
assert.ok(start>=0&&end>start,'equipamento de viagem integrado');
const source=script.slice(start,end);
function paint(role='wood',zoom=1.3,era=3,direction=1,moving=true){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenadas Canvas finitas');calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const biome=()=>role==='wood'?3:role==='stone'?4:2;
 const game={era};
 const fn=new Function('ctx','biome','game',source+'return drawWorkerTravelKit;')(ctx,biome,game);
 const u={kind:'worker',hp:100,x:80,y:80,tx:81,ty:81,path:moving?[{x:80+direction,y:80}]:[],job:true,
  buildTarget:role==='build'?'81,81':null,huntTarget:role==='hunt'?'81,81':null};
 if(role==='travel')u.job=false;
 return {result:fn(u,100,120,zoom,1000,era),calls,styles};
}
test('sintaxe e integracao na renderizacao dos aldeoes',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/drawUnitSprite\(u,px,py,z,enemy\);\s*drawWorkerTravelKit\(u,px,py,z,now,game\.era\);/);
 assert.match(script,/drawWorkerTravelKit\(u,px,py,z,now,game\.era\);\s*drawWinterTroopGear/);
 assert.ok(script.includes('cronicas-v04'));
});
test('LOD e aldeao parado nao desenham equipamento',()=>{
 assert.equal(paint('wood',.7).result,0);
 assert.equal(paint('wood',1.3,3,1,false).result,0);
 assert.equal(paint('wood',1.3).result,1);
});
test('ferramentas distintas para lenha, pedra, obra, caca e lavoura',()=>{
 const roles=['wood','stone','build','hunt','farm','travel'];
 const signatures=roles.map(r=>JSON.stringify(paint(r).calls));
 assert.equal(new Set(signatures).size,roles.length);
});
test('direcao da caminhada inverte o equipamento',()=>{
 const right=paint('wood',1.3,3,1),left=paint('wood',1.3,3,-1);
 assert.ok(right.calls.some(c=>c[0]==='scale'&&c[1]===1));
 assert.ok(left.calls.some(c=>c[0]==='scale'&&c[1]===-1));
});
test('era industrial altera materiais sem mudar a geometria',()=>{
 assert.notDeepEqual(paint('stone',1.3,2).styles,paint('stone',1.3,7).styles);
});
test('estado Canvas equilibrado, deterministico e sem persistencia',()=>{
 for(const role of ['wood','stone','build','hunt','farm','travel']){
  const {calls}=paint(role);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
  assert.deepEqual(paint(role),paint(role));
 }
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\.(?:units|buildings|wood|food)\s*=/);
});
