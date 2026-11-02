'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('// v6.125: sentinela isometrica');
const end=script.indexOf('function drawTownHallEraDetails(',start);
assert.ok(start>=0&&end>start);
const source=script.slice(start,end);
function scene(){
 const calls=[],ctx=new Proxy({},{
  get(obj,key){return key in obj?obj[key]:(...args)=>{
   for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'coordenada Canvas finita');
   calls.push([key,...args]);
  }},
  set(obj,key,val){obj[key]=val;return true}
 });
 return {calls,...new Function('ctx',source+';return {watchtowerSentryAnchor,drawWatchtowerSentry,drawWatchtowerParapetForeground};')(ctx)};
}
test('v6.174: JavaScript válido e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 assert.ok(!source.includes('localStorage')&&!source.includes('Math.random')&&!source.includes('setInterval'));
});
test('guardas medievais ficam sobre a plataforma aberta, não no chão',()=>{
 const {watchtowerSentryAnchor:anchor}=scene();
 for(const era of [2,3,4,5]){
  for(const step of [-1,0,1]){
   const a=anchor(160,200,74,37,era,step);
   assert.equal(a.elevated,true);
   assert.ok(a.ground<145,'pés elevados à altura das ameias');
   assert.ok(Math.abs(a.x-160)<=74*.116,'patrulha restrita ao topo');
  }
 }
});
test('torres primitivas e industriais mantêm guarda no pátio',()=>{
 const {watchtowerSentryAnchor:anchor}=scene();
 for(const era of [0,1,6,7]){
  const a=anchor(160,200,74,37,era,.6);
  assert.equal(a.elevated,false);
  assert.ok(a.ground>200);
 }
});
test('parapeito dianteiro oculta os pés apenas nas torres abertas',()=>{
 for(const era of [0,2,4,5,6,7]){
  const {calls,drawWatchtowerParapetForeground:front}=scene();
  const drawn=front(160,200,74,37,era);
  assert.equal(drawn,era>=2&&era<6?1:0);
  assert.equal(calls.filter(c=>c[0]==='save').length,drawn);
  assert.equal(calls.filter(c=>c[0]==='restore').length,drawn);
  if(drawn)assert.ok(calls.filter(c=>c[0]==='fill').length>=7);
 }
});
test('sentinela animada e LOD preservados em todas as eras',()=>{
 for(const era of [0,2,4,6,7]){
  const {calls,drawWatchtowerSentry:sentry}=scene();
  assert.equal(sentry(160,200,30,15,era,1200,0,3,4),0);
  assert.equal(calls.length,0);
  assert.equal(sentry(160,200,74,37,era,1200,3,3,4),1);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('camada de ameias é desenhada após o guarda da torre pronta',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 const guard=render.indexOf("if(obj.t==='Torre')drawWatchtowerSentry(");
 const parapet=render.indexOf("if(obj.t==='Torre')drawWatchtowerParapetForeground(");
 assert.ok(guard>=0&&parapet>guard);
 assert.ok(render.includes('if(obj&&obj.buildLeft){drawConstructionSite(obj,px,py,ww,hh)}'));
});
