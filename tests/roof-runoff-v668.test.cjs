'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawRoofRunoff(');
const end=script.indexOf('// Civic and barracks campfires',start);
assert.ok(start>=0&&end>start,'efeito de beiral isolável');
const source=script.slice(start,end);
function scene(){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'coordenada finita');calls.push([k,...args])}},
  set(o,k,v){o[k]=v;return true}
 });
 const fn=new Function('ctx','scale',source+';return drawRoofRunoff')(ctx,1);
 return {calls,fn};
}
test('v6.68 compila e preserva o salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.68<\/title>/);
 assert.match(script,/cronicas-v04/);
});
test('beirais só escorrem durante chuva e em zoom suficiente',()=>{
 const dry=scene(),far=scene(),unsupported=scene();
 assert.equal(dry.fn(100,150,74,38,'Cabana',3,0,1500),0);
 assert.equal(far.fn(100,150,32,16,'Cabana',3,.9,1500),0);
 assert.equal(unsupported.fn(100,150,74,38,'Ponte',3,.9,1500),0);
 assert.equal(dry.calls.length+far.calls.length+unsupported.calls.length,0);
});
test('LOD de 2 a 6 filetes, geometria finita e animação',()=>{
 const low=scene(),mid=scene(),high=scene(),later=scene();
 assert.equal(low.fn(100,150,42,22,'Cabana',0,.8,1500),2);
 assert.equal(mid.fn(100,150,55,29,'Aldeia',3,.8,1500),4);
 assert.equal(high.fn(100,150,74,38,'Quartel',5,.8,1500),6);
 assert.equal(later.fn(100,150,74,38,'Quartel',5,.8,2100),6);
 assert.ok(low.calls.length<mid.calls.length&&mid.calls.length<high.calls.length);
 assert.notDeepEqual(high.calls,later.calls);
 assert.ok(high.calls.length<70,'limite de operações por edifício');
});
test('efeito só é chamado para edifícios prontos, sem dados persistidos',()=>{
 const start=script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite(');
 const site=script.slice(start,script.indexOf('if(game.enemy&&game.enemy.hp>0&&game.enemy.x===x',start));
 assert.ok(start>=0);
 assert.match(site,/else if\(obj\)\{/);
 assert.match(site,/drawRoofRunoff\(px,py,ww,hh,obj\.t,game\.era,rainLevel,frameTime\)/);
 assert.doesNotMatch(source,/localStorage|game\.|routeFor|save\(/);
});
test('minimapa respeita safe area do Safari em ambos breakpoints',()=>{
 assert.match(html,/#minimap\{position:fixed;right:12px;top:calc\(84px \+ env\(safe-area-inset-top\)\)/);
 assert.match(html,/width:95px;height:95px;top:calc\(91px \+ env\(safe-area-inset-top\)\)/);
 assert.match(html,/#mapLabel\{position:fixed;right:18px;top:calc\(204px \+ env\(safe-area-inset-top\)\)/);
});
