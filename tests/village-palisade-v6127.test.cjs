'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script,'script principal');
const start=script.indexOf('// v6.127: muralha perimetral');
const end=script.indexOf(' // v6.88: estoques',start);
assert.ok(start>=0&&end>start,'muralha encontrada');
const source=script.slice(start,end);
function scene({era=4,ww=74,season=0,now=1200,layer='front',gateOpen=false}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas sem NaN');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx',source+';return drawVillagePalisade;')(ctx);
 const count=draw(180,150,ww,ww*.52,era,season,now,layer,gateOpen);
 return {count,calls,styles};
}
test('v6.127: script valido e salvamento legado preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('muralha tem duas faces traseiras e portao frontal com LOD',()=>{
 assert.equal(scene({layer:'back'}).count,2);
 assert.equal(scene({layer:'front'}).count,3);
 assert.equal(scene({ww:30}).count,0);
 assert.equal(scene({ww:30}).calls.length,0);
 assert.ok(scene({ww:74}).calls.some(c=>c[0]==='ellipse'));
});
test('material muda de madeira para pedra, ameias e ferro',()=>{
 assert.ok(scene({era:0}).styles.includes('#65432d'));
 assert.ok(scene({era:2}).styles.includes('#a49c85'));
 assert.ok(scene({era:4}).styles.includes('#8d9387'));
 assert.ok(scene({era:6}).styles.includes('#405c5f')||scene({era:6}).styles.includes('#536f70'));
 assert.ok(scene({era:4}).calls.length>scene({era:2}).calls.length);
});
test('portao responde a unidade proxima e bandeira anima',()=>{
 assert.notDeepEqual(scene({gateOpen:false}).calls,scene({gateOpen:true}).calls);
 assert.notDeepEqual(scene({now:1200}).calls,scene({now:2600}).calls);
});
test('neve e contexto Canvas equilibrado em todas as eras',()=>{
 for(const era of [0,2,4,6,7])for(const layer of ['back','front']){
  const a=scene({era,layer,season:3});
  assert.ok(a.styles.includes('#e7efe8'));
  assert.equal(a.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(a.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('profundidade e integracao limitadas a aldeia concluida',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 const a=render.indexOf("else if(obj.t==='Aldeia'){drawVillageSquare");
 const back=render.indexOf("drawVillagePalisade(px,py,ww,hh,game.era,forestSeason(),frameTime,'back')",a);
 const hall=render.indexOf("drawTownHall(px,py,ww,hh,false)",back);
 const front=render.indexOf("drawVillagePalisade(px,py,ww,hh,game.era,forestSeason(),frameTime,'front'",hall);
 assert.ok(a>=0&&back>a&&hall>back&&front>hall);
 assert.ok(render.includes("if(obj&&obj.buildLeft){drawConstructionSite(obj,px,py,ww,hh)}"));
 assert.ok(render.includes('if(!exploredFog[y*W+x])continue'));
});
