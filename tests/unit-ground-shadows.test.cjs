'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');

const visualStart=script.indexOf('function drawUnitGroundShadow(');
const visualEnd=script.indexOf('function drawTileOccupants(',visualStart);
assert.ok(visualStart>0&&visualEnd>visualStart,'helpers de sombras e barras de vida');
const visual=script.slice(visualStart,visualEnd);
function renderer(){
 const ellipses=[],ctx={save(){},restore(){},beginPath(){},fill(){},ellipse(...args){ellipses.push(args)}};
 const api=new Function('ctx',visual+';return {drawUnitGroundShadow,unitHealthBarTop};')(ctx);
 return {...api,ellipses};
}
test('JavaScript compila e mantém salvamento existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('todos os sprites recebem sombra no chão antes do desenho',()=>{
 assert.match(script,/drawUnitGroundShadow\(u,px,py,z,now\);\s*if\(!enemy\)drawMarchDust/);
 const r=renderer(),u={kind:'worker',x:80.5,y:80.5,path:[]};
 r.drawUnitGroundShadow(u,100,200,1,1000);
 assert.equal(r.ellipses.length,2,'sombra difusa e contato próximo');
 assert.ok(r.ellipses.every(e=>e[1]>=200),'sombras ficam abaixo da âncora');
});
test('LOD evita segunda sombra em zoom distante e cavalaria ocupa mais solo',()=>{
 const infantry=renderer(),mounted=renderer();
 infantry.drawUnitGroundShadow({kind:'warrior',x:80,y:80,path:[]},100,200,.6,1000);
 mounted.drawUnitGroundShadow({kind:'cavalry',x:80,y:80,path:[]},100,200,.6,1000);
 assert.equal(infantry.ellipses.length,1);
 assert.ok(mounted.ellipses[0][2]>infantry.ellipses[0][2]);
});
test('barra de vida fica acima do topo do atlas e respeita fallback distante',()=>{
 const r=renderer();
 for(const kind of ['worker','warrior','archer','cavalry']){
  const top=r.unitHealthBarTop({kind},200,1);
  assert.ok(top<165,kind+' health bar must clear tall atlas');
  assert.ok(r.unitHealthBarTop({kind},200,.5)>180,'fallback pequeno');
 }
 assert.match(script,/barY=unitHealthBarTop\(u,py,z\)/);
 assert.ok(!script.slice(script.indexOf('function drawTileOccupants('),script.indexOf('function draw(){')).includes('py-r*1.95'));
});
test('HUD mede FPS reais de quadros desenhados e pode ser desligado',()=>{
 assert.match(html,/id="perfHud"/);
 assert.match(script,/id="togglePerf"/);
 assert.match(script,/recordRenderSample\(t,performance\.now\(\)-drawStart\)/);
 const a=script.indexOf('let perfVisible='),b=script.indexOf('// Adapta a cadência',a);
 assert.ok(a>0&&b>a);
 const hud={style:{display:'none'},textContent:''};
 const api=new Function('perfHud','dpr',script.slice(a,b)+';return {togglePerformanceHud,recordRenderSample};')(hud,2);
 assert.equal(api.togglePerformanceHud(),true);
 api.recordRenderSample(100,8);
 api.recordRenderSample(1400,12);
 assert.match(hud.textContent,/FPS · 10\.0 ms Canvas · 2\.00× DPR/);
 assert.equal(api.togglePerformanceHud(),false);
 assert.equal(hud.style.display,'none');
});
