'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('let renderRainLevel=0;'),b=script.indexOf('function draw(){',a);
assert.ok(a>=0&&b>a,'helpers visuais');
const source=script.slice(a,b);
function render(units,enemies,visible=1,zoom=1,ground=2){
 const calls=[],ctx={save(){},restore(){},beginPath(){},ellipse(){if(String(ctx.fillStyle).startsWith('rgba(177,187,147')||String(ctx.fillStyle).startsWith('rgba(205,181,137'))calls.push('dust')},fill(){},fillRect(){},stroke(){}};
 const fog=new Uint8Array(160*160);fog[2*160+3]=visible;
 const draw=new Function('ctx','biome','key','visibleFog','point','drawUnitSprite','selectedGroup','game','selectedUnit','W','drawCombatFeedback','drawWinterTroopGear','forestSeason',source+';return drawTileOccupants;')(
  ctx,()=>ground,(x,y)=>x+','+y,fog,(x,y)=>[x*10,y*10],(u,px,py,z,enemy)=>calls.push(['sprite',u.id,enemy]),new Set(),{units},-1,160,()=>{},()=>{},()=>1);
 draw(3,2,new Map([['3,2',units]]),new Map([['3,2',enemies]]),zoom,1000);
 return calls;
}
test('JavaScript completo compila',()=>assert.doesNotThrow(()=>new Function(script)));
test('profundidade ordena aliados e inimigos',()=>{
 const units=[{id:'front',x:3.8,y:2.8,hp:100,path:[]},{id:'back',x:3.1,y:2.1,hp:100,path:[]}];
 const enemies=[{id:'enemy',x:3.4,y:2.4,hp:65,path:[]}];
 assert.deepEqual(render(units,enemies).filter(Array.isArray).map(c=>c[1]),['back','enemy','front']);
});
test('névoa não renderiza inimigos ocultos',()=>{
 const units=[{id:'ally',x:3,y:2,hp:100,path:[]}],enemies=[{id:'hidden',x:3,y:2,hp:65,path:[]}];
 assert.deepEqual(render(units,enemies,0).filter(Array.isArray).map(c=>c[1]),['ally']);
});
test('poeira somente em movimento e zoom próximo',()=>{
 const unit={id:'march',x:3.2,y:2.3,hp:100,path:[{x:4,y:3}]};
 assert.ok(render([unit],[]).includes('dust'));
 assert.ok(!render([unit],[],1,.6).includes('dust'));
 assert.ok(!render([{...unit,path:[]}],[]).includes('dust'));
 assert.ok(!render([unit],[],1,1,0).includes('dust'));
});
test('botão de seleção por área e comando touch estão conectados',()=>{
 assert.match(script,/id="selectArea"/);
 assert.match(script,/command='selectArea';panel\.classList\.remove/);
 assert.match(script,/command==='selectArea'\|\|\(e\.pointerType==='mouse'/);
 assert.match(script,/if\(pointers\.size>=2\)\{pinchState=pinchSnapshot\(\);dragged=true;down=null;marquee=null/);
 assert.match(script,/if\(command==='selectArea'\)command=null/);
});
test('chave de salvamento permanece intacta',()=>assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/));
