'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('function drawSiegeCannon(');
const end=script.indexOf('function drawUnitSprite(',start);
assert.ok(start>=0&&end>start,'artillery renderer exists');
const code=script.slice(start,end);
function render(age,zoom=1.3,moving=false,era=6){
 const calls=[],target={};
 const ctx=new Proxy(target,{
  get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args])},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const unit={x:80,y:80,path:moving?[{x:81,y:80}]:[],face:1,attackAt:age===null?0:2000-age};
 const before=JSON.stringify(unit);
 const draw=new Function('ctx','game',code+';return drawSiegeCannon')(ctx,{era});
 draw(unit,200,220,zoom,2000);
 return {calls,unit,before};
}
const style=(calls,name,value)=>calls.filter(c=>c[0]==='set'&&c[1]===name&&c[2]===value).length;
test('game script remains syntactically valid and retains existing save',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 assert.ok(script.includes("localStorage.setItem('cronicas-v04'"));
});
test('close zoom displays two grounded artillery crew members',()=>{
 const near=render(null),medium=render(null,.9),far=render(null,.4);
 assert.equal(style(near.calls,'fillStyle','#d9b48b'),1,'second crew head');
 assert.equal(style(medium.calls,'fillStyle','#d9b48b'),0,'second crew LOD');
 assert.ok(near.calls.length>medium.calls.length);
 assert.ok(medium.calls.length>far.calls.length);
});
test('ramrod is only visible during the stationary reload window',()=>{
 assert.equal(style(render(null).calls,'strokeStyle','#cbb18a'),0);
 assert.equal(style(render(120).calls,'strokeStyle','#cbb18a'),0);
 assert.equal(style(render(600).calls,'strokeStyle','#cbb18a'),1);
 assert.equal(style(render(1000).calls,'strokeStyle','#cbb18a'),1);
 assert.equal(style(render(1200).calls,'strokeStyle','#cbb18a'),0);
 assert.equal(style(render(600,1.3,true).calls,'strokeStyle','#cbb18a'),0);
});
test('reload effect is culled at distant zoom',()=>{
 assert.equal(style(render(600,.7).calls,'strokeStyle','#cbb18a'),0);
 assert.equal(style(render(600,1.3).calls,'strokeStyle','#cbb18a'),1);
});
test('animation does not modify units or persisted combat state',()=>{
 for(const age of [null,100,600,1100]){
  const state=render(age);
  assert.equal(JSON.stringify(state.unit),state.before);
 }
});
test('crew uniforms follow industrial and contemporary eras',()=>{
 const industrial=render(null,1.3,false,6).calls;
 const contemporary=render(null,1.3,false,7).calls;
 assert.ok(style(industrial,'fillStyle','#536a5a')>=1);
 assert.ok(style(contemporary,'fillStyle','#345a60')>=1);
});
