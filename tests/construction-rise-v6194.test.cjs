'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main JavaScript present');
const start=script.indexOf('function drawConstructionSite(');
const end=script.indexOf('function drawConstructionCrew(',start);
assert.ok(start>=0&&end>start,'construction renderer available');
const source=script.slice(start,end);
function render(type='Cabana',progress=.6,width=74,era=3){
 const calls=[],ctx=new Proxy({},{
  get(obj,key){return key in obj?obj[key]:(...args)=>{
   for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),key+' finite');
   calls.push([key,...args]);
  }},
  set(obj,key,value){obj[key]=value;calls.push(['style',key,value]);return true}
 });
 const names=['drawBridge','drawEraWatchtower','drawEraResidence','drawBarracks',
  'drawFarm','drawFarmGranaryEraDetails','drawWindmill','drawMine','drawDock',
  'house','drawConstructionCrew'];
 const fn=new Function('ctx','scale','game','forestSeason',...names,
  source+'return drawConstructionSite;');
 const draw=fn(ctx,width/74,{era,day:2},()=>1,
  ...names.map(name=>(...args)=>calls.push([name,...args])));
 draw({t:type,x:82,y:81,buildTotal:18,buildLeft:18*(1-progress),axis:'y'},
  180,200,width,width*38/74);
 return calls;
}
test('v6.194: syntax and v04 save remain unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.194<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame/);
});
test('architecture emerges only after foundations and is clipped at medium zoom',()=>{
 assert.equal(render('Cabana',.2).filter(c=>c[0]==='clip').length,0);
 const calls=render('Cabana',.6);
 const clip=calls.findIndex(c=>c[0]==='clip');
 const building=calls.findIndex(c=>c[0]==='drawEraResidence');
 assert.ok(clip>=0&&building>clip);
 assert.ok(calls.findIndex(c=>c[0]==='rect')<clip);
 assert.ok(!calls.some(c=>c[0]==='style'&&c[1]==='globalAlpha'),
  'construction uses opaque geometry, not a translucent ghost');
});
test('reveal height increases monotonically from foundation to roof',()=>{
 let previous=Infinity;
 for(const progress of [.31,.45,.6,.8,.99]){
  const rect=render('Cabana',progress).find(c=>c[0]==='rect');
  assert.ok(rect&&rect[4]>0);
  assert.ok(rect[2]<previous);
  previous=rect[2];
 }
});
test('tower and windmill have taller clipping envelopes than a cabin',()=>{
 const cabin=render('Cabana',.6).find(c=>c[0]==='rect');
 for(const type of ['Torre','Moinho']){
  const rect=render(type,.6).find(c=>c[0]==='rect');
  assert.ok(rect[2]<cabin[2],type);
 }
});
test('low zoom skips expensive architectural reveal, all Canvas saves balance',()=>{
 const far=render('Cabana',.6,16),near=render('Cabana',.6,74);
 assert.equal(far.filter(c=>c[0]==='clip').length,0);
 assert.equal(far.filter(c=>c[0]==='drawEraResidence').length,0);
 assert.equal(near.filter(c=>c[0]==='clip').length,1);
 for(const calls of [far,near,render('Torre',.9),render('Quartel',.5)]){
  assert.equal(calls.filter(c=>c[0]==='save').length,
   calls.filter(c=>c[0]==='restore').length);
 }
});
test('era silhouettes remain present and bridge construction keeps its own path',()=>{
 for(let era=0;era<8;era++){
  for(const [type,method] of [['Cabana','drawEraResidence'],['Torre','drawEraWatchtower'],['Quartel','drawBarracks']]){
   const calls=render(type,.6,74,era);
   assert.ok(calls.some(c=>c[0]===method),type+' era '+era);
  }
 }
 const bridge=render('Ponte',.6);
 assert.ok(bridge.some(c=>c[0]==='drawBridge'));
 assert.equal(bridge.filter(c=>c[0]==='clip').length,0);
 assert.ok(bridge.some(c=>c[0]==='drawConstructionCrew'));
});
