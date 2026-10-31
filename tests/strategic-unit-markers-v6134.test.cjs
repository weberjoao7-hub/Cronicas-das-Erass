'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function strategicUnitMarker(');
const end=script.indexOf('// Barras de vida acima da cabeça',start);
assert.ok(start>=0&&end>start,'marcador tático');
const source=script.slice(start,end);
function markerModule(ctx={}){
 return new Function('ctx','TH','TW','isMilitary',source+
  ';return {strategicUnitMarker,drawStrategicUnitMarker};')(
  ctx,17,34,k=>['warrior','archer','cavalry','cannon'].includes(k));
}
const unit=(kind='warrior',path=[])=>({kind,hp:100,x:10,y:10,path});
test('o script completo compila e mantém o salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('marcadores aparecem apenas no zoom distante e não cobrem trabalhadores comuns',()=>{
 const m=markerModule();
 assert.equal(m.strategicUnitMarker(unit(),1),null);
 assert.equal(m.strategicUnitMarker(unit(),.82),null);
 assert.ok(m.strategicUnitMarker(unit(),.6));
 assert.equal(m.strategicUnitMarker(unit('worker'),.6),null);
 assert.ok(m.strategicUnitMarker(unit('worker'),.6,false,true));
});
test('unidades mortas e zoom inválido nunca criam marcadores',()=>{
 const m=markerModule();
 assert.equal(m.strategicUnitMarker({...unit(),hp:0},.5),null);
 assert.equal(m.strategicUnitMarker(unit(),NaN),null);
 assert.equal(m.strategicUnitMarker(unit(),0),null);
});
test('tropas aliadas e inimigas possuem identidade cromática diferente',()=>{
 const m=markerModule();
 const ally=m.strategicUnitMarker(unit('archer'),.6);
 const enemy=m.strategicUnitMarker(unit('archer'),.6,true);
 assert.notEqual(ally.color,enemy.color);
 assert.ok(m.strategicUnitMarker(unit('cavalry'),.6));
 assert.ok(m.strategicUnitMarker(unit('cannon'),.6));
 assert.ok(m.strategicUnitMarker(unit(),.6,false,true).radius>ally.radius);
});
test('a direção da seta usa o próximo nó isométrico e ignora destino coincidente',()=>{
 const m=markerModule();
 const east=m.strategicUnitMarker(unit('warrior',[{x:11,y:10}]),.6);
 const west=m.strategicUnitMarker(unit('warrior',[{x:9,y:10}]),.6);
 assert.ok(Number.isFinite(east.angle));
 assert.ok(Math.abs(east.angle-west.angle)>2);
 assert.equal(m.strategicUnitMarker(unit('warrior',[{x:10,y:10}]),.6).angle,null);
});
test('desenho é ancorado ao solo e balanceia save/restore',()=>{
 const calls=[],ctx={save(){calls.push('save')},restore(){calls.push('restore')},
  beginPath(){calls.push('path')},ellipse(){calls.push('ellipse')},
  fill(){calls.push('fill')},stroke(){calls.push('stroke')},
  moveTo(){calls.push('move')},lineTo(){calls.push('line')},
  closePath(){calls.push('close')}};
 const m=markerModule(ctx);
 assert.equal(m.drawStrategicUnitMarker(unit('archer',[{x:11,y:10}]),100,80,.6),true);
 assert.ok(calls.includes('ellipse')&&calls.includes('move'));
 assert.equal(calls.filter(c=>c==='save').length,calls.filter(c=>c==='restore').length);
 calls.length=0;
 assert.equal(m.drawStrategicUnitMarker(unit(),100,80,1),false);
 assert.equal(calls.length,0);
});
test('o marcador fica entre a sombra e o sprite, respeitando a visibilidade de inimigos',()=>{
 const start=script.indexOf('function drawTileOccupants(');
 const end=script.indexOf('// Renderização de bosque ocupado',start);
 const body=script.slice(start,end);
 const shadow=body.indexOf('drawUnitGroundShadow(');
 const marker=body.indexOf('drawStrategicUnitMarker(');
 const sprite=body.indexOf('drawUnitSprite(');
 assert.ok(shadow>=0&&marker>shadow&&sprite>marker);
 assert.match(script,/if\(visibleFog\[y\*W\+x\]\)for\(const u of enemyTiles\.get\(id\)/);
});
