'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const start=script.indexOf('function setCameraFollow(');
const end=script.indexOf('function drawDesktopEdgePanHint()',start);
assert.ok(start>=0&&end>start,'funções de acompanhamento isoláveis');
const source=script.slice(start,end);

function scene(unit={x:120,y:95,hp:100}){
 const game={units:[unit]},pointers={size:0},document={hidden:false};
 let menuOpen=false,minimapPointer=null;
 const panel={classList:{contains:()=>menuOpen}};
 const create=new Function('game','pointers','panel','document','getMinimapPointer',
  'const W=160,H=160;let cameraFollowUnit=null,cx=80,cy=80,dirty=false;'+
  source.replaceAll('minimapPointer!==null','getMinimapPointer()!==null')+
  'return {setCameraFollow,applyCameraFollow,state:()=>({cx,cy,dirty,follow:cameraFollowUnit})};');
 const camera=create(game,pointers,panel,document,()=>minimapPointer);
 return {camera,unit,game,pointers,document,openMenu:v=>menuOpen=v,dragMinimap:v=>minimapPointer=v};
}

test('v6.118: script compila e mantém save legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(script,/applyDesktopEdgePan\(dt\);applyCameraFollow\(dt\)/);
});
test('câmera segue suavemente, sem saltar instantaneamente nem modificar a unidade',()=>{
 const s=scene(),original={...s.unit};
 assert.equal(s.camera.setCameraFollow(s.unit),true);
 assert.equal(s.camera.applyCameraFollow(.016),true);
 const state=s.camera.state();
 assert.ok(state.cx>80&&state.cx<120);
 assert.ok(state.cy>80&&state.cy<95);
 assert.deepEqual(s.unit,original);
 assert.equal(state.dirty,true);
});
test('gestos, minimapa, painel e aba oculta pausam o acompanhamento',()=>{
 const s=scene();s.camera.setCameraFollow(s.unit);
 s.pointers.size=1;assert.equal(s.camera.applyCameraFollow(.016),false);
 s.pointers.size=0;s.dragMinimap(42);assert.equal(s.camera.applyCameraFollow(.016),false);
 s.dragMinimap(null);s.openMenu(true);assert.equal(s.camera.applyCameraFollow(.016),false);
 s.openMenu(false);s.document.hidden=true;assert.equal(s.camera.applyCameraFollow(.016),false);
 s.document.hidden=false;assert.equal(s.camera.applyCameraFollow(.016),true);
});
test('unidade morta, removida ou com coordenadas inválidas cancela acompanhamento',()=>{
 for(const mode of ['dead','removed','invalid']){
  const s=scene();s.camera.setCameraFollow(s.unit);
  if(mode==='dead')s.unit.hp=0;
  if(mode==='removed')s.game.units.length=0;
  if(mode==='invalid')s.unit.x=NaN;
  assert.equal(s.camera.applyCameraFollow(.016),false);
  assert.equal(s.camera.state().follow,null);
 }
});
test('botão e tecla F alternam o modo; ações manuais interrompem',()=>{
 const s=scene();
 assert.equal(s.camera.setCameraFollow(s.unit),true);
 assert.equal(s.camera.setCameraFollow(s.unit),false);
 assert.match(script,/id="unitFollow"/);
 assert.match(script,/else if\(k==='f'\)/);
 assert.match(script,/function panMinimap\(clientX,clientY\)\{\s*cameraFollowUnit=null/);
 assert.match(script,/function applyDesktopEdgePan\(dt\)[\s\S]*?cameraFollowUnit=null;cx=nextX/);
 assert.match(script,/if\(Math\.hypot\(e\.clientX-down\.x,e\.clientY-down\.y\)>5\)\{dragged=true;cameraFollowUnit=null\}/);
});
test('intervalos inválidos não alteram a câmera; coordenadas ficam nos limites do mapa',()=>{
 const s=scene({x:1000,y:-200,hp:100});s.camera.setCameraFollow(s.unit);
 assert.equal(s.camera.applyCameraFollow(NaN),false);
 assert.equal(s.camera.applyCameraFollow(-1),false);
 for(let i=0;i<300;i++)s.camera.applyCameraFollow(.05);
 assert.ok(s.camera.state().cx<=159&&s.camera.state().cx>=0);
 assert.ok(s.camera.state().cy<=159&&s.camera.state().cy>=0);
});
