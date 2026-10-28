'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const code=html.slice(html.indexOf('function drawFarm('),html.indexOf('function drawMine('));
assert.ok(code.startsWith('function drawFarm('),'farm renderer available');
function render(zoom,level,day,x=20,y=20,now=2500){
 const ops=[],ctx=new Proxy({},{get(o,k){return (...args)=>{ops.push([k,...args]);return {addColorStop(){}}}},set(o,k,v){ops.push(['set',k,v]);o[k]=v;return true}});
 const farm=new Function('ctx','scale',code+';return drawFarm;')(ctx,zoom);
 farm(200,180,34*zoom,18*zoom,level,now,day,x,y);return ops;
}
test('script parses and live/preview farm dispatch receives day and world position',()=>{
 assert.doesNotThrow(()=>new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]));
 assert.match(html,/drawFarm\(px,py,ww,hh,obj\.level,frameTime,game\.day,obj\.x,obj\.y\)/);
 assert.match(html,/drawFarm\(px,py,ww,hh,1,Date\.now\(\),game\.day,p\.x,p\.y\)/);
});
test('four crop stages visibly differ and repeat after four days',()=>{
 const samples=[1,2,3,4].map(day=>render(1.6,2,day));
 assert.equal(new Set(samples.map(s=>JSON.stringify(s))).size,4);
 assert.deepEqual(render(1.6,2,1),render(1.6,2,5));
});
test('neighboring farm plots have staggered growth',()=>assert.notDeepEqual(render(1.6,2,2,20,20),render(1.6,2,2,21,20)));
test('golden grain appears only in ripe phase',()=>{
 const gold=[1,2,3,4].map(day=>render(1.6,2,day).some(o=>o[0]==='set'&&o[1]==='fillStyle'&&o[2]==='#e9c56c'));
 assert.equal(gold.filter(Boolean).length,1);
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
