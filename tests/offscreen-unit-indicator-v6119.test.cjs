'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const segment=(from,to)=>{
 const a=script.indexOf(from),b=script.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'trecho isolavel: '+from);
 return script.slice(a,b);
};
const anchor=new Function(segment('function offscreenUnitAnchor(','function drawOffscreenUnitIndicator(')+'return offscreenUnitAnchor;')();

test('v6.119: JavaScript compila e salvamento anterior permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(script,/drawDesktopEdgePanHint\(\);drawOffscreenUnitIndicator\(frameTime\)/);
});
test('indicador fica dentro das bordas uteis no iPhone e desktop',()=>{
 for(const [w,h] of [[390,650],[375,667],[1440,900]]){
  for(const [x,y] of [[-1000,300],[2000,300],[w/2,-1000],[w/2,2000]]){
   const p=anchor(x,y,w,h);
   assert.ok(p&&Number.isFinite(p.angle));
   assert.ok(p.x>=25.99&&p.x<=w-25.99);
   assert.ok(p.y>=Math.min(118,h*.32)-.01&&p.y<=h-93.99);
  }
 }
});
test('sem indicador para alvo dentro da area util, geometria invalida ou tela estreita',()=>{
 assert.equal(anchor(195,300,390,650),null);
 assert.equal(anchor(NaN,300,390,650),null);
 assert.equal(anchor(900,300,100,650),null);
 assert.equal(anchor(900,300,390,150),null);
});
test('indicador respeita nevoa, unidade eliminada e distancia',()=>{
 const commands=[];
 const ctx=new Proxy({}, {get:(_,k)=>k==='fillText'?((...args)=>commands.push(args)):
   (['save','restore','translate','rotate','scale','beginPath','moveTo','lineTo','closePath','fill','stroke'].includes(k)?()=>{}:undefined),
   set:()=>true});
 const code=segment('function offscreenUnitAnchor(','function draw(){if(!dirty)return;');
 const build=new Function('ctx','visibleAt','unit',`let w=390,h=650,cx=0,cy=0,selectedUnit=0;const game={units:[unit]};const point=(x,y)=>[x,y];${code}return drawOffscreenUnitIndicator;`);
 const u={x:900,y:300,hp:100,kind:'warrior'};
 let visible=true;
 const draw=build(ctx,()=>visible,u);
 assert.equal(draw(1000),1);
 assert.ok(commands.some(c=>String(c[0]).includes('quad.')));
 commands.length=0;visible=false;
 assert.equal(draw(1000),0);assert.equal(commands.length,0);
 visible=true;u.hp=0;assert.equal(draw(1000),0);
});
test('zoom por roda e pinca interrompem camera de acompanhamento',()=>{
 const zoomCode=segment('function zoomAt(','// Pinça contínua:');
 const pinchCode=segment('function applyPinch(','C.addEventListener(\'pointerdown\'');
 const zoom=new Function(`let cameraFollowUnit={},cx=80,cy=80,scale=1,dirty=false;const w=390,h=650,W=160,H=160,TW=74,TH=38;${zoomCode}zoomAt(1.1,190,300);return {cameraFollowUnit,scale,dirty};`)();
 assert.equal(zoom.cameraFollowUnit,null);
 assert.ok(zoom.scale>1&&zoom.dirty);
 const pinch=new Function(`let cameraFollowUnit={},cx=80,cy=80,scale=1,dirty=false;const W=160,H=160;const screenToWorldAt=(x,y)=>({x:x/scale+cx,y:y/scale+cy});${pinchCode}applyPinch({x:100,y:100,dist:50},{x:110,y:110,dist:65});return {cameraFollowUnit,scale,dirty};`)();
 assert.equal(pinch.cameraFollowUnit,null);
 assert.ok(pinch.scale>1&&pinch.dirty);
});
