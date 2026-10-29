'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('function drawVillageLife('),end=script.indexOf('function drawTerritoryEdge(',start);
assert.ok(start>0&&end>start,'renderizador de praça vivo entre praça e fronteira');
const source=script.slice(start,end);
function scene({width=74,era=4,now=120000,layer='front',season=0,visible=true,night=0}={}){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas sem NaN/Infinity');
  calls.push([k,...args]);
 };},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const draw=new Function('ctx','lightLevels','dayClock',source+';return drawVillageLife;')(ctx,()=>({night}),30);
 const count=draw(220,170,width,width*.52,era,now,layer,season,visible);
 return {count,calls};
}
test('v6.84: script válido, salvamento intacto e renderizador sem mutação',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.|Math\.random|setInterval/);
});
test('bancas têm toldos históricos, cestos primordiais e neve sazonal',()=>{
 const early=scene({layer:'back',era:0}),late=scene({layer:'back',era:6}),winter=scene({layer:'back',season:3});
 assert.equal(early.count,2);assert.equal(late.count,2);
 assert.ok(late.calls.length>early.calls.length);
 assert.ok(winter.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]==='#eaf0e8'));
});
test('aldeões animam na praça, reduzindo população à noite',()=>{
 const a=scene(),b=scene(),c=scene({now:320000}),night=scene({night:.9});
 assert.equal(a.count,3);assert.deepEqual(a,b);assert.notDeepEqual(a.calls,c.calls);
 assert.equal(night.count,1);
});
test('LOD móvel e névoa suprimem detalhes e personagens',()=>{
 assert.equal(scene({width:30}).count,0);
 assert.equal(scene({width:60}).count,2);
 assert.equal(scene({visible:false}).count,0);
 assert.equal(scene({layer:'back',visible:false}).count,2);
});
test('estado Canvas é balanceado e coordenadas finitas em todas as eras',()=>{
 for(const era of [0,2,4,6,7])for(const layer of ['back','front']){
  const {calls}=scene({era,layer});
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('praça, bancas, salão e transeuntes obedecem à profundidade isométrica',()=>{
 const a=script.indexOf('drawVillageSquare(px,py,ww,hh,x,y)');
 const back=script.indexOf("drawVillageLife(px,py,ww,hh,game.era,frameTime,'back'",a);
 const hall=script.indexOf('drawTownHall(px,py,ww,hh,false)',a);
 const front=script.indexOf("drawVillageLife(px,py,ww,hh,game.era,frameTime,'front'",hall);
 const occupants=script.indexOf('if(forestCount)drawForestOccupiedTile(',front);
 assert.ok(a>0&&back>a&&hall>back&&front>hall&&occupants>front);
 assert.match(script.slice(a,front+120),/visibleFog\[y\*W\+x\]/);
});
