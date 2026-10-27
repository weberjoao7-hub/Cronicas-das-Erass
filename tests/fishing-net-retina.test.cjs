'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const netStart=script.indexOf('function drawFishingNet(');
const netEnd=script.indexOf('function drawFishingBoat(',netStart);
assert.ok(netStart>=0&&netEnd>netStart,'rede e barco');
const netSource=script.slice(netStart,netEnd);

function net(width,era=2,now=1200){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(_obj,key){return (...args)=>calls.push([key,...args])},
  set(_obj,key,value){if(key==='strokeStyle'||key==='fillStyle')styles.push(value);return true}
 });
 const draw=new Function('ctx','scale',netSource+';return drawFishingNet;')(ctx,1);
 draw(width*.245,width*.51*.24,width,now,era);
 return {calls,styles};
}
function viewport(width,height,ratio,coarse=false){
 const start=script.indexOf('function resize(){'),end=script.indexOf("addEventListener('resize',resize);",start);
 assert.ok(start>=0&&end>start);
 const code=script.slice(start,end);
 const C={width:0,height:0,getBoundingClientRect(){return {width,height}}};
 return new Function('C','devicePixelRatio','matchMedia','innerWidth','innerHeight',
  'let w=0,h=0,dpr=1,dirty=false;'+code+';resize();return {w,h,dpr,pixels:C.width*C.height};'
 )(C,ratio,()=>({matches:coarse}),width,height);
}

test('script principal compila e salvamento legado permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('pesca utiliza rede ancorada ao barco e evita custo no zoom distante',()=>{
 assert.match(script,/if\(boat\.state==='fishing'\)drawFishingNet\(r,beam,ww,now,game\.era\)/);
 assert.equal(net(20).calls.length,0);
 assert.ok(net(74).calls.length>net(34).calls.length*2);
});
test('malha de rede tem boias, peixes e acabamento por era',()=>{
 const early=net(74,2),modern=net(74,7);
 assert.ok(early.styles.includes('#d5c5a0'));
 assert.ok(modern.styles.includes('#a8c5c6'));
 assert.ok(early.calls.filter(([op])=>op==='lineTo').length>=15);
 assert.ok(early.calls.filter(([op])=>op==='arc').length>=3);
 assert.ok(early.calls.filter(([op])=>op==='ellipse').length>=3);
 assert.equal(early.calls.filter(([op])=>op==='save').length,early.calls.filter(([op])=>op==='restore').length);
});
test('rede oscila com o tempo sem estado persistente',()=>{
 const a=net(74,2,1000),b=net(74,2,2500);
 assert.notDeepEqual(a.calls,b.calls);
 assert.match(script,/function drawFishingNet\(r,beam,ww,now,era\)/);
});
test('Retina mantém nitidez no iPhone e limita backing store no tablet',()=>{
 const phone=viewport(390,634,3,true),tablet=viewport(1366,1024,3,true);
 assert.equal(phone.dpr,2);
 assert.ok(tablet.pixels<=2605000);
 assert.ok(tablet.dpr<2&&tablet.dpr>1);
});
test('desktop tem orçamento separado sem alterar dimensões CSS',()=>{
 const desktop=viewport(1920,1080,2,false);
 assert.equal(desktop.w,1920);
 assert.equal(desktop.h,1080);
 assert.ok(desktop.pixels<=6005000);
 assert.ok(desktop.dpr>1.5);
});
