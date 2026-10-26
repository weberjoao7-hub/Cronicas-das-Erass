'use strict';
// Regressões do overlay tático e da névoa — v6.13.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawOrderOverlay(');
const end=script.indexOf('// Luz ambiente dinâmica:',start);
assert.ok(start>=0&&end>start,'âncoras do overlay');
const source=script.slice(start,end);
function context(){
 const calls=[];
 const ctx={calls,save(){calls.push('save')},restore(){calls.push('restore')},
  beginPath(){},closePath(){},setLineDash(){},stroke(){calls.push('stroke')},
  fill(){calls.push('fill')},ellipse(){calls.push('ellipse')},
  moveTo(x,y){calls.push(['move',x,y])},lineTo(x,y){calls.push(['line',x,y])}};
 return ctx;
}
function render(units,selected,visible,scale=1,now=1200){
 const ctx=context(),game={units},selectedGroup=new Set(selected);
 const factory=new Function('game','selectedGroup','selectedUnit','visibleAt','point','ctx','scale','w','h','isMilitary',source+';return drawOrderOverlay;');
 factory(game,selectedGroup,0,visible,(x,y)=>[x*10,y*10],ctx,scale,600,600,k=>['warrior','archer','cavalry'].includes(k))(now);
 return ctx.calls;
}
const soldier=(path,kind='warrior')=>({x:0,y:0,hp:100,kind,path});
test('sintaxe do jogo permanece válida',()=>assert.doesNotThrow(()=>new Function(script)));
test('rota visível é desenhada e marca o destino com anel',()=>{
 const u=soldier([{x:1,y:1},{x:2,y:2}]);
 const calls=render([u],[u],()=>true);
 assert.ok(calls.includes('ellipse'));
 assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='line'&&c[1]===20));
});
test('rota para no primeiro nó oculto e não desenha segmentos depois da névoa',()=>{
 const u=soldier([{x:1,y:1},{x:2,y:2},{x:3,y:3}]);
 const calls=render([u],[u],(x,y)=>x<2);
 assert.ok(calls.some(c=>Array.isArray(c)&&c[0]==='line'&&c[1]===10));
 assert.ok(!calls.some(c=>Array.isArray(c)&&c[0]==='line'&&c[1]>=20));
 assert.ok(!calls.includes('ellipse'));
});
test('destinos ocultos não geram bandeiras de tropas não selecionadas',()=>{
 const selected=soldier([]),hidden=soldier([{x:4,y:4}]);
 const calls=render([selected,hidden],[selected],(x,y)=>x<2);
 assert.equal(calls.filter(c=>c==='stroke').length,0);
});
test('zoom distante oculta linhas caras de trajetória',()=>{
 const u=soldier([{x:1,y:1},{x:2,y:2}]);
 const calls=render([u],[u],()=>true,.5);
 assert.ok(!calls.some(c=>Array.isArray(c)&&c[0]==='line'));
});
test('rotas de múltiplas tropas aparecem com limite de oito unidades',()=>{
 const units=Array.from({length:12},(_,i)=>soldier([{x:i+1,y:1}]));
 const calls=render(units,units,()=>true);
 assert.equal(calls.filter(c=>c==='ellipse').length,8);
});
test('integração preserva o salvamento legado e passa timestamp ao overlay',()=>{
 assert.match(script,/drawOrderOverlay\(frameTime\);drawPlacementOverlay\(\)/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
