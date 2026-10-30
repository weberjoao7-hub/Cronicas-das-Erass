'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('function drawConstructionCrew(');
const end=script.indexOf('// Only the civic center',start);
assert.ok(start>=0&&end>start,'equipe de obra encontrada');
const source=script.slice(start,end);
function render({era=2,width=74,time=1500,type='Cabana',progress=.55}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenada finita');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const fn=new Function('ctx',source+';return drawConstructionCrew;')(ctx);
 const count=fn({t:type,x:81,y:82,buildLeft:18*(1-progress),buildTotal:18},180,200,width,width*38/74,era,time);
 return {count,calls,styles};
}
test('v6.86: JavaScript completo compila e salvamento permanece compatível',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=86);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval/);
});
test('LOD: sem operários distantes, um no zoom médio e dois no próximo',()=>{
 assert.equal(render({width:25}).count,0);
 assert.equal(render({width:50}).count,1);
 assert.equal(render({width:80}).count,2);
 assert.ok(render({width:80}).calls.length>render({width:50}).calls.length);
});
test('trajes evoluem de tecido e couro para uniforme industrial',()=>{
 const early=render({era:0}),medieval=render({era:4}),modern=render({era:7});
 assert.ok(early.styles.includes('#967b52'));
 assert.ok(medieval.styles.includes('#846a4a'));
 assert.ok(modern.styles.includes('#516d78'));
 assert.ok(modern.styles.includes('#d7b45e'));
});
test('animação é determinística e Canvas mantém save/restore equilibrados',()=>{
 const a=render(),b=render(),later=render({time:2200});
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,later.calls);
 assert.equal(a.calls.filter(([m])=>m==='save').length,a.calls.filter(([m])=>m==='restore').length);
});
test('guincho só aparece em obras avançadas, próximas e fora de pontes',()=>{
 const ready=render({progress:.65,width:80}),early=render({progress:.1,width:80});
 const bridge=render({type:'Ponte',width:80,progress:.65});
 assert.ok(ready.calls.filter(([m])=>m==='strokeRect').length>early.calls.filter(([m])=>m==='strokeRect').length);
 assert.ok(ready.calls.filter(([m])=>m==='strokeRect').length>bridge.calls.filter(([m])=>m==='strokeRect').length);
});
test('equipe aparece em obras normais e pontes, sem alterar a lógica de progresso',()=>{
 const site=script.slice(script.indexOf('function drawConstructionSite('),script.indexOf('function drawConstructionCrew('));
 assert.equal((site.match(/drawConstructionCrew\(b,px,py,ww,hh,era\)/g)||[]).length,2);
 assert.match(site,/const progress=Math\.max\(0,Math\.min\(1,1-b\.buildLeft\/total\)\)/);
});
