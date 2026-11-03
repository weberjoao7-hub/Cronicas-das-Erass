'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.202: janelas iluminadas');
const end=script.indexOf('function drawRoadLantern(',start);
assert.ok(start>=0&&end>start,'renderizadores de luz isolaveis');
const source=script.slice(start,end);
function scene(){
 const calls=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas finito');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const lightLevels=phase=>({night:phase>.7?1:0,dusk:phase>.4&&phase<=.7?.8:0});
 const functions=new Function('ctx','lightLevels','dayClock',source+
  ';return {residenceNightLightLevel,drawResidenceGroundLight,drawResidenceLitWindows}')(ctx,lightLevels,90);
 return {calls,state,...functions};
}
test('v6.202: script completo compila e salvamento permanece compativel',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|game\.|(?:^|[^\w.])save\(/);
});
test('residencias apagam durante o dia e em zoom distante',()=>{
 const s=scene();
 assert.equal(s.drawResidenceLitWindows(100,100,72,40,4,17,2000,.2),0);
 assert.equal(s.drawResidenceGroundLight(100,100,72,40,4,0,0,2000,17,.2),0);
 assert.equal(s.drawResidenceLitWindows(100,100,30,18,4,17,2000,.85),0);
 assert.equal(s.drawResidenceGroundLight(100,100,40,20,4,0,0,2000,17,.85),0);
 assert.equal(s.calls.length,0);
});
test('fachadas acompanham periodos historicos e apresentam esquadrias em perspectiva',()=>{
 const old=scene(),medieval=scene(),modern=scene();
 assert.equal(old.drawResidenceLitWindows(100,100,72,40,0,17,2000,.85),1);
 assert.equal(medieval.drawResidenceLitWindows(100,100,72,40,4,17,2000,.85),2);
 assert.equal(modern.drawResidenceLitWindows(100,100,72,40,7,17,2000,.85),2);
 assert.equal(medieval.state.fillStyle,'#ffd58c');
 assert.equal(modern.state.fillStyle,'#b9edff');
 assert.ok(medieval.calls.some(c=>c[0]==='lineTo'));
 assert.ok(modern.calls.length<95,'orcamento de desenho por casa');
});
test('reflexos noturnos respeitam chuva, inverno e desligamento deterministico',()=>{
 const rain=scene(),winter=scene(),off=scene();
 assert.equal(rain.drawResidenceGroundLight(100,100,76,40,4,0,.8,2000,17,.85),1);
 assert.equal(winter.drawResidenceGroundLight(100,100,76,40,4,3,0,2000,17,.85),1);
 assert.equal(off.drawResidenceGroundLight(100,100,76,40,4,3,0,2000,13,.85),0);
 assert.ok(rain.calls.some(c=>c[0]==='ellipse'));
 assert.ok(winter.calls.some(c=>c[0]==='ellipse'));
 assert.ok(rain.calls.some(c=>c[0]==='lineTo'),'reflexo de chuva');
 assert.ok(winter.calls.some(c=>c[0]==='stroke'),'reflexo na neve');
 assert.equal(off.calls.length,0);
});
test('dados invalidos nao geram coordenadas Canvas e custo fica limitado',()=>{
 const s=scene();
 assert.equal(s.drawResidenceLitWindows(NaN,100,72,40,4,17,2000,.85),0);
 assert.equal(s.drawResidenceGroundLight(100,100,Infinity,40,4,0,0,2000,17,.85),0);
 assert.equal(s.drawResidenceLitWindows(100,100,72,40,4,17,2000,.85),2);
 assert.ok(s.calls.length<100);
});
test('luz no chao precede alicerce e janelas sao desenhadas depois da cabana',()=>{
 const ground=script.indexOf("if(obj&&!obj.buildLeft&&obj.t==='Cabana')drawResidenceGroundLight(");
 const foundation=script.indexOf('if(obj&&!obj.buildLeft)drawBuildingFoundation(',ground);
 const cabin=script.indexOf("else if(obj.t==='Cabana')drawEraResidence(");
 const windows=script.indexOf("if(obj.t==='Cabana')drawResidenceLitWindows(",cabin);
 const fallback=script.indexOf('else house(px,py,ww*.7,obj.t);',cabin);
 assert.ok(ground>=0&&foundation>ground,'reflexo atras da construcao');
 assert.ok(cabin>=0&&fallback>cabin&&windows>fallback,'janelas sobre fachadas prontas');
 assert.match(script,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite\(/);
});
