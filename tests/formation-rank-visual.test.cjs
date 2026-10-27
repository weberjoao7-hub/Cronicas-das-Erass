'use strict';
// Guias táticas sobre o terreno — v6.50.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawOrderOverlay(');
const end=script.indexOf('// Luz ambiente dinâmica:',start);
assert.ok(start>=0&&end>start,'âncoras do overlay');
const source=script.slice(start,end);
const soldier=(kind,x,y,tx,ty)=>({kind,hp:100,x,y,path:[{x:tx,y:ty}]});
const troops=[
 soldier('warrior',1,1,5,5),soldier('warrior',2,1,6,5),
 soldier('archer',3,1,5,7),soldier('archer',4,1,6,7)
];
function render(units=troops,visible=()=>true,zoom=1){
 let strokeColor='';const strokes=[],moves=[];
 const ctx=new Proxy({},{
  get(_target,key){
   if(key==='stroke')return ()=>strokes.push(strokeColor);
   if(key==='moveTo'||key==='lineTo')return (...args)=>moves.push([key,...args]);
   return ()=>{};
  },
  set(_target,key,value){if(key==='strokeStyle')strokeColor=value;return true}
 });
 const draw=new Function('game','selectedGroup','selectedUnit','visibleAt','point','ctx','scale','w','h','isMilitary',
  source+';return drawOrderOverlay;')(
  {units},new Set(units),0,visible,(x,y)=>[x*20,y*12],ctx,zoom,800,800,
  kind=>['warrior','archer','cavalry'].includes(kind));
 draw(1000);return {strokes,moves};
}
test('script compila e guias de formação estão integradas ao overlay',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/ranks\[unit\.kind==='archer'\?1:0\]/);
 assert.match(script,/drawOrderOverlay\(frameTime\)/);
});
test('linhas de frente e retaguarda recebem cores distintas',()=>{
 const {strokes,moves}=render();
 assert.ok(strokes.includes('#d8b878'),'linha de frente');
 assert.ok(strokes.includes('#8ed8a2'),'linha dos arqueiros');
 assert.ok(moves.some(c=>c[0]==='lineTo'));
});
test('névoa entre destinos bloqueia a ligação sem esconder outros postos',()=>{
 const {strokes}=render(troops,(x,y)=>!(y>6.9&&x>5.2&&x<5.8));
 assert.ok(strokes.includes('#d8b878'));
 assert.ok(!strokes.includes('#8ed8a2'));
});
test('zoom distante desativa guias e preserva as rotas existentes',()=>{
 const {strokes}=render(troops,()=>true,.7);
 assert.ok(!strokes.includes('#d8b878'));
 assert.ok(!strokes.includes('#8ed8a2'));
});
test('não conecta unidades muito distantes em uma falsa formação',()=>{
 const distant=[
  soldier('warrior',1,1,5,5),soldier('warrior',2,1,16,5),
  soldier('archer',3,1,5,7)
 ];
 const {strokes}=render(distant);
 assert.ok(!strokes.includes('#d8b878'));
});
