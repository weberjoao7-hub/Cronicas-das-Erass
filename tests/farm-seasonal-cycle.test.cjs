'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const code=html.slice(html.indexOf('// v6.204: o ciclo agricola'),html.indexOf('function drawMine('));
assert.ok(code.startsWith('// v6.204: o ciclo agricola'),'seasonal farm renderer available');
const forestSeason=day=>Math.floor(((((Math.floor(day)-1)%32)+32)%32)/8);
function render(zoom,level,day,x=20,y=20,now=2500){
 const ops=[],ctx=new Proxy({},{get(o,k){return (...args)=>{ops.push([k,...args]);return {addColorStop(){}}}},set(o,k,v){ops.push(['set',k,v]);o[k]=v;return true}});
 const farm=new Function('ctx','scale','forestSeason',code+';return drawFarm;')(ctx,zoom,forestSeason);
 farm(200,180,34*zoom,18*zoom,level,now,day,x,y);return ops;
}
test('script parses and live/preview farm dispatch receives day and world position',()=>{
 assert.doesNotThrow(()=>new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]));
 assert.match(html,/drawFarm\(px,py,ww,hh,obj\.level,frameTime,game\.day,obj\.x,obj\.y\)/);
 assert.match(html,/drawFarm\(px,py,ww,hh,1,Date\.now\(\),game\.day,p\.x,p\.y\)/);
});
test('seasonal crop stages differ and repeat after a 32-day year',()=>{
 const samples=[1,6,10,15,24].map(day=>render(1.6,2,day));
 assert.ok(new Set(samples.map(s=>JSON.stringify(s))).size>=4);
 assert.deepEqual(render(1.6,2,1),render(1.6,2,33));
});
test('neighboring farm plots have staggered growth',()=>assert.notDeepEqual(render(1.6,2,2,20,20),render(1.6,2,2,21,20)));
test('golden grain appears only in ripe phase',()=>{
 const gold=[1,6,10,15,18,24,26].map(day=>render(1.6,2,day).some(o=>o[0]==='set'&&o[1]==='fillStyle'&&o[2]==='#e9c56c'));
 assert.deepEqual(gold,[false,false,false,true,true,false,false]);
});
test('distant zoom reduces crop geometry',()=>{
 const far=render(.5,2,3),near=render(1.7,2,3);
 assert.ok(near.length>far.length*1.6);
 assert.ok(far.some(op=>op[0]==='fill'));
});
test('visual-only growth preserves the existing save key',()=>{
 assert.match(html,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(code,/a produção de comida e o save não mudam/);
});
