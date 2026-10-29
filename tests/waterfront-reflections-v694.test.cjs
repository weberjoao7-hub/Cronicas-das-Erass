'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawWaterfrontReflections(');
const end=script.indexOf('function drawShoreFoam(',start);
assert.ok(start>0&&end>start,'efeito costeiro isolável');
const source=script.slice(start,end);
const key=(x,y)=>x+','+y;
function scene({width=72,season=1,era=4,mask=1,buildings=[['9,10',{t:'Aldeia'}]],
 visibleWater=true,visibleLand=true,now=1500}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'Canvas recebe coordenadas finitas');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='strokeStyle')styles.push(v);return true}});
 const visible=new Uint8Array(160*160);visible.fill(1);
 if(!visibleWater)visible[10*160+10]=0;
 if(!visibleLand)visible[10*160+9]=0;
 const draw=new Function('ctx','key','W','game',source+';return drawWaterfrontReflections')(
  ctx,key,160,{era});
 const count=draw(100,100,width,width*.5,10,10,mask,new Map(buildings),visible,season,now,era);
 return {count,calls,styles};
}
test('v6.94 mantém script válido e chave de salvamento existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.(?:9[4-9]|[1-9][0-9]{2,})<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.buildings|Math\.random/);
});
test('somente edificações concluídas e adjacentes à margem refletem',()=>{
 assert.equal(scene().count,1);
 assert.equal(scene({mask:2}).count,0);
 assert.equal(scene({buildings:[]}).count,0);
 assert.equal(scene({buildings:[['9,10',{t:'Aldeia',buildLeft:3}]]}).count,0);
 assert.equal(scene({visibleLand:false}).count,0);
 assert.equal(scene({visibleWater:false}).count,0);
});
test('pontes e pesqueiros não criam silhuetas de edifícios',()=>{
 assert.equal(scene({buildings:[['9,10',{t:'Ponte'}]]}).count,0);
 assert.equal(scene({buildings:[['9,10',{t:'Pesqueiro'}]]}).count,0);
 assert.equal(scene({buildings:[['9,10',{t:'Torre'}]]}).count,1);
});
test('quatro orientações e recorte no losango da água',()=>{
 const buildings=[['9,10',{t:'Aldeia'}],['10,9',{t:'Torre'}],['11,10',{t:'Cabana'}],['10,11',{t:'Moinho'}]];
 const s=scene({mask:15,buildings});
 assert.equal(s.count,4);
 assert.equal(s.calls.filter(c=>c[0]==='clip').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='stroke').length,80);
});
test('LOD e inverno evitam reflexos desnecessários no Safari',()=>{
 assert.equal(scene({width:30}).count,0);
 assert.equal(scene({season:3}).count,0);
 const medium=scene({width:48}),close=scene({width:72});
 assert.equal(medium.calls.filter(c=>c[0]==='stroke').length,6);
 assert.equal(close.calls.filter(c=>c[0]==='stroke').length,20);
});
test('cores por era, ondas determinísticas e nenhuma mutação de edifícios',()=>{
 const building={t:'Aldeia',level:2};
 const ancient=scene({era:1,buildings:[['9,10',building]]});
 const industrial=scene({era:7,buildings:[['9,10',building]]});
 assert.ok(ancient.styles.includes('#bb9571'));
 assert.ok(industrial.styles.includes('#8cabb0'));
 assert.notDeepEqual(ancient.styles,industrial.styles);
 assert.deepEqual(scene().calls,scene().calls);
 assert.deepEqual(building,{t:'Aldeia',level:2});
});
test('reflexos são desenhados após árvores e antes da espuma costeira',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function spawnUnit('));
 const forest=render.indexOf('drawForestWaterReflections(px,py,ww,hh,x,y,shoreMask');
 const buildings=render.indexOf('drawWaterfrontReflections(px,py,ww,hh,x,y,shoreMask');
 const foam=render.indexOf('drawShoreFoam(px,py,ww,hh,x,y,shoreMask');
 assert.ok(forest>=0&&buildings>forest&&foam>buildings);
 assert.match(render.slice(buildings,buildings+170),/structures,visibleFog,forestSeason\(\)/);
});
