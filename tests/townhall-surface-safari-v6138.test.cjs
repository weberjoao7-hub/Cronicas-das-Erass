'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.138: juntas de alvenaria');
const end=script.indexOf('/* Progressão arquitetônica',start);
assert.ok(start>=0&&end>start,'renderer de superficies isolavel');
const source=script.slice(start,end);
function render(era,ww=74,part='walls',enemy=false){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(target,key){return key in target?target[key]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(key));
   calls.push([key,...args]);
  }},
  set(target,key,value){target[key]=value;if(key==='strokeStyle'||key==='fillStyle')styles.push(value);return true}
 });
 const draw=new Function('ctx','scale',source+';return drawTownHallSurface;')(ctx,1);
 return {count:draw(100,100,ww,ww*.52,era,enemy,part),calls,styles};
}
test('sintaxe valida, renderer e salvamento legado preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|requestAnimationFrame/);
});
test('fachadas e telhados usam recorte isometrico sem coordenadas invalidas',()=>{
 for(const part of ['walls','roof']){
  const result=render(4,80,part);
  assert.ok(result.count>0);
  assert.equal(result.calls.filter(c=>c[0]==='clip').length,2);
  assert.equal(result.calls.filter(c=>c[0]==='save').length,3);
  assert.equal(result.calls.filter(c=>c[0]==='restore').length,3);
  assert.ok(result.calls.some(c=>c[0]==='lineTo'));
 }
});
test('LOD remove texturas distantes e aumenta detalhe apenas no zoom proximo',()=>{
 assert.equal(render(4,39).count,0);
 assert.equal(render(4,40).count>0,true);
 assert.ok(render(4,74).count>render(4,50).count);
 assert.ok(render(4,74,'roof').count>render(4,50,'roof').count);
});
test('materiais evoluem da madeira para pedra e metal industrial',()=>{
 const wood=render(0),stone=render(4),metal=render(6);
 assert.ok(wood.styles.includes('#5c412d80'));
 assert.ok(stone.styles.includes('#685d4b80'));
 assert.ok(metal.styles.includes('#52616a88'));
 assert.ok(render(6,74,'roof').styles.includes('#c2d0ca8c'));
 assert.ok(render(4,74,'roof').styles.includes('#e5c58b86'));
 assert.ok(render(4,74,'walls',true).styles.includes('#392f2a88'));
});
test('integracao posiciona juntas antes das vigas e telhas antes do portao',()=>{
 const wall=script.indexOf("drawTownHallSurface(px,py,ww,hh,game.era,enemy,'walls')");
 const beams=script.indexOf('// Vigas estruturais e janelas iluminadas.');
 const roof=script.indexOf("drawTownHallSurface(px,py,ww,hh,game.era,enemy,'roof')");
 const gate=script.indexOf('// Entrada frontal, portao de madeira e arco de pedra.');
 assert.ok(wall>0&&wall<beams&&roof>beams&&roof<gate);
 assert.match(script,/drawTownHall\(px,py,ww,hh,false\);drawTownHallEraDetails/);
 assert.match(script,/drawTownHall\(px,py,ww,hh,true\)/);
});
test('Safari com armazenamento bloqueado nao impede tutorial e inicializacao',()=>{
 const from=script.indexOf('function tutorialSeen()');
 const to=script.indexOf('function showTutorial()',from);
 assert.ok(from>0&&to>from);
 const helpers=script.slice(from,to);
 const denied={getItem(){throw new Error('SecurityError')},setItem(){throw new Error('QuotaExceededError')}};
 const funcs=new Function('localStorage',helpers+';return {tutorialSeen,markTutorialSeen}')(denied);
 assert.equal(funcs.tutorialSeen(),false);
 assert.doesNotThrow(()=>funcs.markTutorialSeen());
 const working=new Map();
 const allowed=new Function('localStorage',helpers+';return {tutorialSeen,markTutorialSeen}')({
  getItem:key=>working.get(key),setItem:(key,value)=>working.set(key,value)
 });
 assert.equal(allowed.tutorialSeen(),false);allowed.markTutorialSeen();
 assert.equal(allowed.tutorialSeen(),true);
 assert.match(script,/if\(!Array\.isArray\(game\.enemyUnits\)\)game\.enemyUnits=\[\];/);
 assert.match(script,/if\(!Array\.isArray\(game\.buildings\)\)game\.buildings=\[\];/);
 assert.match(script,/if\(!tutorialSeen\(\)\)showTutorial\(\)/);
});
