'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('function drawEnemyStrongholdDamage(');
const end=script.indexOf('function drawBuildingBadge(',start);
assert.ok(start>0&&end>start,'fortress damage renderer is present');
const code=script.slice(start,end);
function render(hp,zoom=74,now=1200){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'finite Canvas coordinates');
  calls.push([k,...args]);}},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const draw=new Function('ctx',code+';return drawEnemyStrongholdDamage')(ctx);
 const count=draw(180,190,zoom,38,hp,now);
 return {calls,count};
}
test('full game syntax, version and existing save key are intact',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.79<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('progressive wall fractures follow 75%, 50%, and 25% damage thresholds',()=>{
 assert.equal(render(100).count,0);
 assert.equal(render(75).count,0);
 assert.equal(render(74).count,2);
 assert.equal(render(50).count,4);
 assert.equal(render(25).count,6);
});
test('smoke and char appear only below half health',()=>{
 const colors=calls=>calls.filter(x=>x[0]==='set'&&x[1]==='fillStyle').map(x=>x[2]);
 assert.ok(!colors(render(74).calls).includes('#282c2aa8'));
 assert.ok(colors(render(50).calls).includes('#282c2aa8'));
 assert.ok(colors(render(25).calls).includes('#e16d32'));
});
test('zoom level of detail removes distant effects',()=>{
 assert.equal(render(20,20).calls.length,0);
 assert.ok(render(20,35).calls.length<render(20,74).calls.length);
 assert.ok(!render(20,35).calls.some(x=>x[0]==='ellipse'));
});
test('deterministic animation and balanced Canvas state',()=>{
 const a=render(20),b=render(20),c=render(20,74,3200);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,c.calls);
 assert.equal(a.calls.filter(x=>x[0]==='save').length,a.calls.filter(x=>x[0]==='restore').length);
});
test('damage overlay is restricted to visible enemy stronghold and never mutates combat state',()=>{
 const start=script.indexOf('if(game.enemy&&game.enemy.hp>0&&game.enemy.x===x');
 const end=script.indexOf('if(b===0&&visibleFog',start);
 const renderCall=script.slice(start,end);
 assert.match(renderCall,/visibleFog\[y\*W\+x\]/);
 assert.match(renderCall,/drawTownHall\(px,py,ww,hh,true\);drawEnemyStrongholdDamage\(px,py,ww,hh,game.enemy.hp,frameTime\)/);
 assert.doesNotMatch(code,/game\.enemy\.hp\s*=/);
 assert.doesNotMatch(code,/localStorage|game\.buildings/);
});
