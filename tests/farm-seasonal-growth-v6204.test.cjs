'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.204: o ciclo agricola');
const end=script.indexOf('/* v6.180: granarios historicos',start);
assert.ok(start>=0&&end>start,'renderizador da fazenda isolavel');
const source=script.slice(start,end);
const forestSeason=day=>Math.floor(((((Math.floor(day)-1)%32)+32)%32)/8);
function scene(){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas recebe coordenadas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const funcs=new Function('ctx','scale','forestSeason',source+
  ';return {farmCropStage,drawFarm}')(ctx,1,forestSeason);
 return {calls,styles,...funcs};
}
test('v6.204: JavaScript compila e formato dos saves permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.doesNotMatch(source,/localStorage|(?:^|[^\w.])save\(|game\.buildings\.push/);
});
test('fases da lavoura acompanham primavera, verao, outono e inverno',()=>{
 const {farmCropStage:stage}=scene();
 for(const [day,expected] of [[1,0],[6,1],[10,2],[15,3],[18,3],[24,0],[26,0],[31,0],[33,0]])
  assert.equal(stage(day,1,1),expected,'dia '+day);
});
test('lotes vizinhos amadurecem em momentos diferentes e nao alteram os dias',()=>{
 const {farmCropStage:stage}=scene();
 assert.notEqual(stage(3,1,1),stage(3,2,1));
 assert.equal(stage(26,1,1),stage(26,2,1),'inverno permanece dormente');
 assert.equal(stage(NaN,1,1),0);
 assert.equal(stage(8,Infinity,1),0);
});
test('inverno apresenta faixas de neve sem feixes de colheita',()=>{
 const winter=scene(),summer=scene();
 winter.drawFarm(100,100,78,38,2,1000,26,1,1);
 summer.drawFarm(100,100,78,38,2,1000,15,1,1);
 assert.ok(winter.styles.includes('#dbe6dfad')&&winter.styles.includes('#eff2e4c4'));
 assert.ok(winter.styles.includes('#aabbb0')&&winter.styles.includes('#667a72'));
 assert.ok(!winter.styles.includes('#dfbe6d')&&!winter.styles.includes('#c3a468'));
 assert.ok(summer.styles.includes('#dfbe6d')||summer.styles.includes('#c3a468'));
 assert.ok(!summer.styles.includes('#dbe6dfad'));
});
test('LOD: neve reduz detalhes no zoom distante e mantem custo limitado',()=>{
 const far=scene(),medium=scene(),near=scene();
 far.drawFarm(100,100,22,11,1,1000,26,1,1);
 medium.drawFarm(100,100,36,18,1,1000,26,1,1);
 near.drawFarm(100,100,80,40,1,1000,26,1,1);
 assert.ok(!far.styles.includes('#dbe6dfad'));
 assert.ok(medium.styles.includes('#dbe6dfad'));
 assert.ok(near.calls.length>medium.calls.length);
 assert.ok(near.calls.length<650,'orçamento Canvas por fazenda');
});
test('geometria sazonal deterministica para mesmo dia e quadro',()=>{
 const a=scene(),b=scene();
 a.drawFarm(100,100,78,38,2,1000,26,1,1);
 b.drawFarm(100,100,78,38,2,1000,26,1,1);
 assert.deepEqual(a.calls,b.calls);
 assert.deepEqual(a.styles,b.styles);
});
test('a fazenda continua integrada a obra e ao mundo, sem alterar producao',()=>{
 assert.match(script,/drawFarm\(px,py,ww,hh,obj\.level,frameTime,game\.day,obj\.x,obj\.y\)/);
 assert.match(script,/drawFarm\(px,py,ww,hh,1,Date\.now\(\),game\.day,b\.x,b\.y\)/);
 assert.match(script,/case 'Fazenda':return 'Alimentos \+'/);
});
