'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const slice=(start,end)=>{const a=script.indexOf(start),b=script.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return script.slice(a,b)};
const cannonCode=slice('function drawSiegeCannon(','function drawUnitSprite(');
const shotCode=slice('const towerShots=[];','// Feedback de combate');
function mockContext(){
 const calls=[],target={};
 const ctx=new Proxy(target,{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args])},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 return {ctx,calls};
}
function renderCannon(age,z=1.1,moving=false){
 const {ctx,calls}=mockContext();
 const draw=new Function('ctx','game',cannonCode+';return drawSiegeCannon')(ctx,{era:6});
 draw({x:20,y:20,path:moving?[{x:21,y:20}]:[],attackAt:age===null?0:2000-age,face:1},150,190,z,2000);
 return calls;
}
function renderShot(kind,age=400,z=1,visible=true){
 const {ctx,calls}=mockContext();
 const env=new Function('ctx','point','TH','scale','visibleAt','now',
  'const Date={now:()=>now};'+shotCode+';return {towerShots,drawTowerShots}')(
  ctx,(x,y,height=0)=>[x*8-y*8,(x+y)*4-height*z],32,z,()=>visible,2000);
 env.towerShots.push({kind,sx:20,sy:20,ex:23,ey:22,start:2000-age});
 env.drawTowerShots();
 return {calls,remaining:env.towerShots.length};
}
const smoke=c=>c.filter(x=>x[0]==='set'&&x[1]==='fillStyle'&&
 (x[2]==='#a5aaa4'||x[2]==='#d5cbb7')).length;
test('JavaScript completo continua sintaticamente válido',()=>assert.doesNotThrow(()=>new Function(script)));
test('fumaça surge após disparo e persiste além do clarão',()=>{
 assert.equal(smoke(renderCannon(null)),0);
 assert.equal(smoke(renderCannon(120)),5);
 assert.equal(smoke(renderCannon(600)),5);
 assert.equal(smoke(renderCannon(940)),0);
});
test('sem fumaça em movimento ou zoom distante',()=>{
 assert.equal(smoke(renderCannon(400,.45)),0);
 assert.equal(smoke(renderCannon(400,1.1,true)),0);
 assert.equal(smoke(renderCannon(400,.9)),5);
});
test('fumaça não modifica os dados persistidos do canhão',()=>{
 const {ctx}=mockContext(),draw=new Function('ctx','game',cannonCode+';return drawSiegeCannon')(ctx,{era:6});
 const unit={x:20,y:20,path:[],attackAt:1600,face:1},before=JSON.stringify(unit);
 draw(unit,150,190,1.1,2000);assert.equal(JSON.stringify(unit),before);
});
test('impacto do canhão adiciona poeira isométrica sem afetar flechas',()=>{
 const cannon=renderShot('cannon'),arrow=renderShot('archer');
 assert.ok(cannon.calls.filter(x=>x[0]==='ellipse').length>=7);
 assert.ok(cannon.calls.filter(x=>x[0]==='ellipse').length>
  arrow.calls.filter(x=>x[0]==='ellipse').length+4);
 assert.equal(cannon.remaining,1);
});
test('impacto respeita nível de zoom e névoa de guerra',()=>{
 const near=renderShot('cannon',400,1),far=renderShot('cannon',400,.5),hidden=renderShot('cannon',400,1,false);
 assert.ok(near.calls.filter(x=>x[0]==='ellipse').length>
  far.calls.filter(x=>x[0]==='ellipse').length);
 assert.equal(hidden.calls.length,0);
});
test('projéteis expirados são descartados sem vazamento',()=>{
 const expired=renderShot('cannon',500);
 assert.equal(expired.remaining,0);
 assert.equal(expired.calls.length,0);
});
