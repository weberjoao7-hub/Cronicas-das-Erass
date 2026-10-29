'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawUnitGroundShadow(');
const end=script.indexOf('// Barras de vida acima da cabeça',start);
assert.ok(start>=0&&end>start,'sombra solar e sombra de contato presentes');
const source=script.slice(start,end);
function scene(phase=.5,night=0){
 const ellipses=[],events=[];
 const ctx={save(){events.push('save')},restore(){events.push('restore')},beginPath(){},
  ellipse(...args){ellipses.push(args)},fill(){}};
 const lightLevels=()=>({night,dusk:.2});
 const api=new Function('ctx','lightLevels','dayClock',source+
  ';return {unitSunShadow,drawUnitGroundShadow};')(ctx,lightLevels,phase*120);
 return {...api,ellipses,events};
}
test('v6.96 mantém JavaScript válido e formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=96);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('projeção varia com posição solar sem alterar a unidade',()=>{
 const s=scene(),u={kind:'warrior',x:7,y:8,path:[]};
 const morning=s.unitSunShadow(u,1,.15),noon=s.unitSunShadow(u,1,.5),evening=s.unitSunShadow(u,1,.68);
 assert.ok(morning&&noon&&evening);
 assert.ok(morning.dy<noon.dy&&evening.dy>noon.dy);
 assert.ok(morning.rx>noon.rx&&evening.rx>noon.rx);
 assert.deepEqual(u,{kind:'warrior',x:7,y:8,path:[]});
});
test('cavalaria e canhões projetam silhuetas maiores que infantaria',()=>{
 const s=scene(),foot=s.unitSunShadow({kind:'warrior'},1,.5);
 const horse=s.unitSunShadow({kind:'cavalry'},1,.5);
 const cannon=s.unitSunShadow({kind:'cannon'},1,.5);
 assert.ok(horse.rx>foot.rx&&horse.ry>foot.ry);
 assert.ok(cannon.rx>foot.rx&&cannon.ry>foot.ry);
});
test('LOD e noite desativam projeção, mantendo o contato com o solo',()=>{
 assert.equal(scene().unitSunShadow({kind:'worker'},.6,.5),null);
 assert.equal(scene(.5,.95).unitSunShadow({kind:'worker'},1,.5),null);
 const far=scene();far.drawUnitGroundShadow({kind:'worker',x:1,y:2,path:[]},100,200,.6);
 assert.equal(far.ellipses.length,1);
 const dark=scene(.5,.95);dark.drawUnitGroundShadow({kind:'worker',x:1,y:2,path:[]},100,200,1);
 assert.equal(dark.ellipses.length,2);
 assert.equal(dark.ellipses[0][0],104);
});
test('sombra projetada e contato usam só dois elipses e contexto equilibrado',()=>{
 const s=scene(.5,0),u={kind:'cavalry',x:12,y:14,path:[{x:13,y:14}]};
 s.drawUnitGroundShadow(u,100,200,1,1000);
 assert.equal(s.ellipses.length,2);
 assert.ok(s.ellipses[0][0]>100&&s.ellipses[0][2]>s.ellipses[1][2]);
 assert.deepEqual(s.events,['save','restore']);
});
test('renderização de tropas mantém ordenação e sombra antes do sprite',()=>{
 const start=script.indexOf('function drawTileOccupants('),end=script.indexOf('function draw(){',start);
 const render=script.slice(start,end);
 assert.match(render,/drawUnitGroundShadow\(u,px,py,z,now\)/);
 assert.ok(render.indexOf('drawUnitGroundShadow(u,px,py,z,now)')<render.indexOf('drawUnitSprite(u,px,py,z,enemy)'));
});
