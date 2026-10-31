'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const svg=fs.readFileSync(path.join(root,'assets','cronicas_aldeoes_atlas.svg'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawPaintedVillager(');
const end=script.indexOf('// Props de coleta',start);
assert.ok(start>=0&&end>start,'renderizador de aldeão presente');
const source=script.slice(start,end);

function render(moving,now,era=0,zoom=1,job=moving?'walk':'idle',distance=0){
 const calls=[];
 const ctx={
  save(){},translate(){},scale(){},restore(){},
  drawImage(...args){calls.push(args)}
 };
 const game={era};
 const paintedVillagers={complete:true,naturalWidth:336,naturalHeight:104};
 const strideFrame=(_u,frames,step)=>Math.floor(distance/step)%frames;
 const draw=new Function('ctx','game','paintedVillagers','strideFrame',source+';return drawPaintedVillager;')(ctx,game,paintedVillagers,strideFrame);
 return {drawn:draw({x:80,y:80},100,100,zoom,job,moving,now),calls};
}

test('script compila e conserva a chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('atlas SVG transparente contém seis quadros alinhados de 56 por 104',()=>{
 assert.match(svg,/<svg[^>]*width="336"[^>]*height="104"/);
 assert.ok(!/<(?:image|foreignObject|script)\b/i.test(svg),'sem dependências externas ou scripts');
 const frames=[...svg.matchAll(/<g transform="translate\((\d+) (-?\d+)\)">([\s\S]*?)<\/g>/g)];
 assert.equal(frames.length,6);
 frames.forEach((frame,i)=>{
  assert.equal(Number(frame[1]),i*56);
  assert.match(frame[3],/Contact shadow/);
  assert.match(frame[3],/Independent legs/);
  assert.match(frame[3],/Neck, hair/);
 });
});
test('idle usa dois quadros, caminhada usa quatro quadros diferentes',()=>{
 assert.match(script,/paintedVillagers\.src='assets\/cronicas_aldeoes_atlas\.svg'/);
 assert.deepEqual([render(false,0),render(false,550)].map(r=>r.calls[0][1]),[0,56]);
 assert.deepEqual([0,.17,.34,.51].map(d=>render(true,0,0,1,'walk',d).calls[0][1]),[112,168,224,280]);
});
test('atlas respeita LOD e troca de era, mantendo fallback procedural',()=>{
 assert.equal(render(false,0,0,.5).drawn,false);
 assert.equal(render(false,0,2,1).drawn,false);
 assert.equal(render(false,0,0,1,'wood').drawn,false);
 assert.equal(render(true,0,0,1).drawn,true);
 assert.match(script,/drawVillagerAtlas\(u,px,py,z,job,moving,now\)/);
});
test('desenho do atlas ancora o personagem no terreno',()=>{
 const {calls}=render(false,0);
 assert.equal(calls.length,1);
 assert.equal(calls[0][2],0);
 assert.equal(calls[0][3],56);
 assert.equal(calls[0][4],104);
 assert.ok(calls[0][6]<0);
 assert.ok(calls[0][6]+calls[0][8]>0);
});
