'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.101: acessos isometricos');
const end=script.indexOf('function drawStructureShadow(',start);
assert.ok(start>=0&&end>start,'renderer isolavel');
const source=script.slice(start,end);
function scene({era=4,width=74,season=0,rain=0,type='Mina',roads=new Set(),x=20,y=20}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas sem NaN/Infinity: '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const rnd=(a,b,c)=>((a*3+b*7+c*11)%17+17)%17/17;
 const {drawBuildingApproach,buildingApproachDirection}=new Function('ctx','rnd',source+'return {drawBuildingApproach,buildingApproachDirection};')(ctx,rnd);
 const count=drawBuildingApproach(200,180,width,width*38/74,x,y,type,era,season,rain,roads);
 return {count,calls,styles,buildingApproachDirection};
}
test('v6.101: script compila e salvamento anterior permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.101<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.|Math\.random|requestAnimationFrame/);
});
test('direcao do caminho acompanha a estrada vizinha em quatro orientacoes',()=>{
 const direction=scene().buildingApproachDirection;
 assert.deepEqual(direction(20,20,new Set(['21,20'])),[1,0]);
 assert.deepEqual(direction(20,20,new Set(['20,21'])),[0,1]);
 assert.deepEqual(direction(20,20,new Set(['19,20'])),[-1,0]);
 assert.deepEqual(direction(20,20,new Set(['20,19'])),[0,-1]);
 assert.deepEqual(direction(20,20,new Set()),[1,0]);
 assert.notDeepEqual(scene({roads:new Set(['21,20'])}).calls,scene({roads:new Set(['20,21'])}).calls);
});
test('LOD limita custos em zoom distante e exclui estruturas com piso proprio',()=>{
 assert.equal(scene({width:24}).count,0);
 assert.equal(scene({width:24}).calls.length,0);
 for(const type of ['Aldeia','Ponte','Pesqueiro','Fazenda'])assert.equal(scene({type}).count,0);
 assert.equal(scene({width:36,type:'Cabana'}).count,1);
 assert.ok(scene({width:74}).calls.length>scene({width:36}).calls.length);
});
test('piso evolui de terra batida para pedra e pavimentacao industrial',()=>{
 assert.ok(scene({era:0}).styles.includes('#a28b62'));
 assert.ok(scene({era:4}).styles.includes('#a79b7d'));
 assert.ok(scene({era:7}).styles.includes('#858f8a'));
 assert.ok(scene({era:4}).calls.filter(c=>c[0]==='lineTo').length>scene({era:0}).calls.filter(c=>c[0]==='lineTo').length);
});
test('neve e chuva alteram somente o acabamento e preservam Canvas',()=>{
 const dry=scene(),snow=scene({season:3}),wet=scene({rain:.7});
 assert.notDeepEqual(snow.calls,dry.calls);
 assert.notDeepEqual(wet.calls,dry.calls);
 assert.ok(snow.styles.includes('#e6eee1b0'));
 assert.ok(wet.styles.includes('#c5d8c480'));
 for(const era of [0,2,4,6,7])for(const width of [28,44,74,95]){
  const {calls}=scene({era,width,season:3,rain:.8});
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('acesso desenhado antes das sombras e apenas para edificios concluidos',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 const approach=render.indexOf('if(obj&&!obj.buildLeft)drawBuildingApproach(');
 const shadow=render.indexOf("if(obj&&!obj.buildLeft&&obj.t!=='Ponte')drawStructureShadow(");
 const building=render.indexOf('if(obj&&obj.buildLeft){drawConstructionSite(');
 assert.ok(approach>0&&shadow>approach&&building>shadow);
 assert.match(render,/drawBuildingApproach\(px,py,ww,hh,x,y,obj\.t,game\.era,forestSeason\(\),rainLevel,roadTiles\)/);
});
