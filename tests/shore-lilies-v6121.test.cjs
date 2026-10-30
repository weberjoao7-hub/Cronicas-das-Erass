'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawShoreLilies(');
const end=script.indexOf('function drawFarm(',start);
assert.ok(start>=0&&end>start,'nenúfares inseridos antes das fazendas');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene({width=100,season=0,now=200000,x=45,y=58}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenadas Canvas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd','forestSeason',source+';return drawShoreLilies;')(ctx,rnd,()=>season);
 const count=draw(200,160,width,width*.5,x,y,now,season);
 return {count,calls,styles};
}
test('v6.121: sintaxe JavaScript e salvamento v04 preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('flores de primavera/verão, folhas de outono e ausência no inverno',()=>{
 const spring=scene({season:0}),summer=scene({season:1}),autumn=scene({season:2}),winter=scene({season:3});
 assert.ok(spring.count>=2);
 assert.equal(spring.count,summer.count);
 assert.ok(spring.styles.includes('#f8e5df'));
 assert.ok(summer.styles.includes('#e9bf61'));
 assert.ok(autumn.count>=2);
 assert.ok(!autumn.styles.includes('#e9bf61'));
 assert.equal(winter.count,0);
 assert.equal(winter.calls.length,0);
});
test('LOD reduz desenhos no zoom distante e mantém folhagem no zoom médio',()=>{
 assert.equal(scene({width:30}).count,0);
 assert.equal(scene({width:45}).count,0);
 assert.ok(scene({width:50}).count>=2);
 assert.ok(scene({width:100}).calls.length>scene({width:50}).calls.length);
});
test('posições determinísticas, animação da água e contexto Canvas balanceado',()=>{
 const a=scene(),b=scene(),c=scene({now:220000});
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,c.calls);
 assert.ok(a.calls.some(c=>c[0]==='ellipse'));
 for(const season of [0,1,2,3]){
  const {calls}=scene({season});
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('nenúfares ficam nas enseadas visíveis, sob barcos e sem colisões',()=>{
 const call=script.indexOf('drawShoreLilies(px,py,ww,hh,x,y,frameTime,forestSeason())');
 assert.ok(call>0);
 const guard=script.slice(call-170,call);
 assert.match(guard,/b===0/);
 assert.match(guard,/shoreMask\[y\*W\+x\]/);
 assert.match(guard,/visibleFog\[y\*W\+x\]/);
 assert.match(guard,/!structures\.has\(key\(x,y\)\)/);
 assert.match(guard,/!boatTiles\.has\(key\(x,y\)\)/);
 const boat=script.indexOf('drawFishingBoat(boat,',call);
 assert.ok(boat>call,'barcos desenhados depois das plantas aquáticas');
});
