'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.129: vestuario sazonal');
const end=script.indexOf('// Feedback de combate preso',start);
assert.ok(start>0&&end>start,'funcao sazonal isolavel');
const source=script.slice(start,end);
function scene({season=3,z=1.4,kind='warrior',era=4,enemy=false,now=2400,atlas=true,hp=100}={}){
 const calls=[],colors=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true;}});
 const factory=new Function('ctx','forestSeason','paintedTroops','paintedCavalry','game',source+';return drawWinterTroopGear;');
 const draw=factory(ctx,()=>season,{complete:atlas,naturalWidth:256,naturalHeight:896},{complete:atlas,naturalWidth:448,naturalHeight:448},{era});
 const u={kind,hp,x:80.5,y:80.5,face:1,path:[]};
 return {count:draw(u,200,160,z,now,season,enemy),calls,colors};
}
test('v6.129: sintaxe e salvamento existente preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'/);
 assert.doesNotMatch(source.replace(/\/\/[^\n]*/g,''),/localStorage|Math\.random|setInterval|game\.units\.push/);
});
test('roupas e respiracao so aparecem no inverno com zoom adequado',()=>{
 for(const season of [0,1,2]){const s=scene({season});assert.equal(s.count,0);assert.equal(s.calls.length,0)}
 for(const z of [.45,.72,.84]){const s=scene({z});assert.equal(s.count,0);assert.equal(s.calls.length,0)}
 assert.equal(scene().count,1);
});
test('classes e estados invalidos nao geram particulas',()=>{
 for(const kind of ['worker','cannon','unknown'])assert.equal(scene({kind}).count,0);
 assert.equal(scene({hp:0}).count,0);
 assert.equal(scene({kind:'archer'}).count,1);
 assert.equal(scene({kind:'cavalry'}).count,1);
});
test('equipamento diferencia era e inimigo e respeita atlas de reserva',()=>{
 assert.ok(scene({era:0}).colors.includes('#b59a76'));
 assert.ok(scene({era:4}).colors.includes('#92775c'));
 assert.ok(scene({era:7}).colors.includes('#6d8892'));
 assert.ok(scene({enemy:true}).colors.includes('#9e4d4c'));
 assert.notDeepEqual(scene({atlas:true}).calls,scene({atlas:false}).calls);
 assert.notDeepEqual(scene({kind:'cavalry'}).calls,scene({kind:'warrior'}).calls);
});
test('respiracao e tecido animados, Canvas finito e save/restore equilibrados',()=>{
 assert.notDeepEqual(scene({now:2400}).calls,scene({now:3500}).calls);
 for(const kind of ['warrior','archer','cavalry'])for(const atlas of [true,false])for(const z of [.85,1,1.5,2.8]){
  const s=scene({kind,atlas,z});
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('integracao segue sprite, precede feedback e respeita profundidade das unidades',()=>{
 const a=script.indexOf('function drawTileOccupants('),b=script.indexOf('// Renderização de bosque ocupado',a);
 const tile=script.slice(a,b);
 assert.ok(tile.indexOf('drawUnitSprite(u,px,py,z,enemy)')<tile.indexOf('drawWinterTroopGear(u,px,py,z,now,forestSeason(),enemy)'));
 assert.ok(tile.indexOf('drawWinterTroopGear(u,px,py,z,now,forestSeason(),enemy)')<tile.indexOf('drawCombatFeedback(u,px,py,z,now,enemy)'));
 assert.match(script,/if\(!exploredFog\[y\*W\+x\]\)continue/);
});
