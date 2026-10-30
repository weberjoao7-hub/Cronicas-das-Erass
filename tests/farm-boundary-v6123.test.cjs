'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawFarmBoundary(');
const end=script.indexOf('// Mina isométrica:',start);
assert.ok(start>0&&end>start,'limites do desenho da fazenda presentes');
const source=script.slice(start,end);

function scene({width=88,era=0,level=2,season=1,now=5000,x=19,y=25}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas: '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx',source+';return drawFarmBoundary;')(ctx);
 const count=draw(190,170,width,width*.5,era,level,season,now,x,y);
 return {count,calls,styles};
}

test('v6.123: JavaScript compila e salvamento v04 nao e modificado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|setInterval/);
});

test('LOD reduz geometria em zoom baixo e preserva cercas no medio',()=>{
 const far=scene({width:32}),medium=scene({width:48}),near=scene({width:88});
 assert.equal(far.count,0);
 assert.equal(far.calls.length,0);
 assert.equal(medium.count,1);
 assert.ok(near.calls.length>medium.calls.length);
});

test('cercas de madeira evoluem para estrutura e tubos metalicos',()=>{
 const tribal=scene({era:0}),medieval=scene({era:4}),industrial=scene({era:6});
 assert.ok(tribal.styles.includes('#a78557'));
 assert.ok(medieval.styles.includes('#93754f'));
 assert.ok(industrial.styles.includes('#8ca9a8'));
 assert.ok(industrial.styles.includes('#a2b8b4'));
 assert.ok(!tribal.styles.includes('#a2b8b4'));
});

test('irrigacao e visual: exige nivel 2 e congela no inverno',()=>{
 const basic=scene({level:1}),advanced=scene({level:2});
 const winter=scene({level:2,season:3});
 assert.ok(!basic.styles.includes('#507f80'));
 assert.ok(advanced.styles.includes('#507f80'));
 assert.ok(winter.styles.includes('#e3e8dc'));
 assert.ok(!winter.styles.includes('#507f80'));
});

test('pano e reflexos animados, mas sem aleatoriedade entre quadros iguais',()=>{
 const a=scene(),b=scene(),c=scene({now:7500});
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,c.calls);
});

test('Canvas finito e save/restore balanceados nas quatro estacoes e eras',()=>{
 for(const era of [0,3,6,7])for(const season of [0,1,2,3])for(const level of [1,2,3]){
  const {count,calls}=scene({era,season,level});
  assert.equal(count,1);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});

test('fazenda pronta desenha limite entre lavoura e trabalhadores',()=>{
 const farm=script.indexOf("else if(obj.t==='Fazenda'){drawFarm(");
 assert.ok(farm>0);
 const block=script.slice(farm,script.indexOf('}',farm)+1);
 assert.match(block,/drawFarm\(/);
 assert.match(block,/drawFarmBoundary\(px,py,ww,hh,game\.era,obj\.level,forestSeason\(\),frameTime,obj\.x,obj\.y\)/);
 assert.ok(block.indexOf('drawFarm(')<block.indexOf('drawFarmBoundary('));
 assert.ok(block.indexOf('drawFarmBoundary(')<block.indexOf('drawFarmWorkers('));
 assert.ok(script.indexOf('else if(obj.t===\'Fazenda\')')>script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite'));
});
