'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const cameraStart=script.indexOf('function pinchSnapshot()');
const cameraEnd=script.indexOf("C.addEventListener('pointerdown'",cameraStart);
assert.ok(cameraStart>=0&&cameraEnd>cameraStart,'camera helpers');
const cameraSource=script.slice(cameraStart,cameraEnd);
const bannerStart=script.indexOf('function drawEraStandard(');
const bannerEnd=script.indexOf('function drawStructureShadow(',bannerStart);
assert.ok(bannerStart>=0&&bannerEnd>bannerStart,'historical standard');
const bannerSource=script.slice(bannerStart,bannerEnd);

function camera(previous,current,init={cx:80,cy:80,scale:1}){
 const run=new Function('previous','current','init',
  'let cx=init.cx,cy=init.cy,scale=init.scale,dirty=false;'+
  'const w=390,h=700,TW=74,TH=38,W=160,H=160;'+
  'const pointers=new Map();'+cameraSource+
  'const before=screenToWorldAt(previous.x,previous.y);'+
  'applyPinch(previous,current);'+
  'const after=screenToWorldAt(current.x,current.y);'+
  'return {cx,cy,scale,dirty,before,after};');
 return run(previous,current,init);
}
function banner(type,era,width=70,now=1200){
 const calls=[],colors=[];
 const ctx=new Proxy({},{
  get(_target,key){return (...args)=>calls.push([key,...args])},
  set(_target,key,value){if(key==='fillStyle'||key==='strokeStyle')colors.push(value);return true}
 });
 const draw=new Function('ctx','scale',bannerSource+';return drawEraStandard;')(ctx,1);
 draw(100,150,width,35,type,era,now);
 return {calls,colors};
}
function close(a,b){assert.ok(Math.abs(a-b)<1e-8,'expected '+a+' ~= '+b)}

test('script principal compila e mantém chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('pinça com zoom preserva o ponto do mapa sob o centro dos dedos',()=>{
 const state=camera({x:172,y:335,dist:112},{x:211,y:365,dist:157});
 assert.ok(state.scale>1.3);
 close(state.before.x,state.after.x);close(state.before.y,state.after.y);
 assert.equal(state.dirty,true);
});
test('movimento de dois dedos sem zoom também desloca a câmera',()=>{
 const state=camera({x:175,y:310,dist:120},{x:215,y:345,dist:120});
 assert.equal(state.scale,1);
 assert.notEqual(state.cx,80);assert.notEqual(state.cy,80);
 close(state.before.x,state.after.x);close(state.before.y,state.after.y);
});
test('zoom respeita limites e bordas do mapa',()=>{
 const upper=camera({x:195,y:350,dist:100},{x:195,y:350,dist:2000});
 const lower=camera({x:195,y:350,dist:100},{x:195,y:350,dist:1});
 assert.equal(upper.scale,3);assert.equal(lower.scale,.45);
 const edge=camera({x:100,y:100,dist:100},{x:300,y:500,dist:150},{cx:0,cy:159,scale:1});
 assert.ok(edge.cx>=0&&edge.cx<=159&&edge.cy>=0&&edge.cy<=159);
});
test('gestos múltiplos não acionam seleção de terreno nem dependem de lastDist',()=>{
 assert.match(script,/if\(pointers\.size>=2\)\{pinchState=pinchSnapshot\(\);dragged=true;down=null;marquee=null\}/);
 assert.match(script,/applyPinch\(pinchState,next\)/);
 assert.doesNotMatch(script,/lastDist/);
});
test('estandartes têm quatro estilos históricos e identificação militar',()=>{
 assert.ok(banner('Aldeia',0).colors.includes('#9d7750'));
 assert.ok(banner('Aldeia',2).colors.includes('#a16c3f'));
 assert.ok(banner('Aldeia',4).colors.includes('#7d3940'));
 assert.ok(banner('Aldeia',7).colors.includes('#38697b'));
 assert.ok(banner('Quartel',7).colors.includes('#963e39'));
});
test('estandartes usam LOD e vento sem criar dados persistentes',()=>{
 assert.equal(banner('Torre',4,20).calls.length,0);
 assert.equal(banner('Cabana',4,70).calls.length,0);
 const early=banner('Torre',0,70,1000),later=banner('Torre',0,70,2100);
 assert.ok(early.calls.length>10);
 assert.notDeepEqual(early.calls,later.calls);
 assert.equal(early.calls.filter(c=>c[0]==='save').length,early.calls.filter(c=>c[0]==='restore').length);
 assert.match(script,/drawEraStandard\(px,py,ww,hh,obj\.t,game\.era,frameTime\)/);
});
