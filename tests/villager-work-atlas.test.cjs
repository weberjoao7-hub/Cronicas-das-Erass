'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const svg=fs.readFileSync(path.join(root,'assets','cronicas_aldeoes_trabalho.svg'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawPaintedWorkerAction(');
const end=script.indexOf('// Props de coleta',start);
assert.ok(start>=0&&end>start,'função de tarefas presente');
const source=script.slice(start,end);

function render(job,now=0,{era=0,zoom=1,moving=false,loaded=true}={}){
 const calls=[],props=[];
 const ctx={save(){},translate(){},scale(){},restore(){},drawImage(...args){calls.push(args)}};
 const game={era};
 const paintedWorkerActions={complete:loaded,naturalWidth:loaded?896:0};
 const drawWorkerTaskProps=(...args)=>props.push(args);
 const draw=new Function('ctx','game','paintedWorkerActions','drawWorkerTaskProps',source+';return drawPaintedWorkerAction;')(ctx,game,paintedWorkerActions,drawWorkerTaskProps);
 const u={x:80,y:80,face:1};
 return {drawn:draw(u,100,110,zoom,job,moving,now),calls,props};
}

test('script compila, atlas de tarefas é carregado e save legado permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/paintedWorkerActions\.src='assets\/cronicas_aldeoes_trabalho\.svg'/);
 assert.match(script,/drawPaintedWorkerAction\(u,px,py,z,job,moving,now\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('atlas transparente contém 16 poses, 4 por tarefa',()=>{
 assert.match(svg,/<svg[^>]*width="896"[^>]*height="104"/);
 assert.ok(!/<(?:image|foreignObject|script)\b/i.test(svg),'sem recursos remotos ou scripts');
 const frames=[...svg.matchAll(/<g transform="translate\((\d+) 0\)">([\s\S]*?)<\/g>/g)];
 assert.equal(frames.length,16);
 frames.forEach((frame,i)=>{
  assert.equal(Number(frame[1]),i*56);
  assert.match(frame[2],/Contact shadow/);
  assert.match(frame[2],/Animated (wood|stone|farm|build) pose/);
  assert.match(frame[2],/url\(#skin\)/);
 });
 for(const job of ['wood','stone','farm','build'])
  assert.equal((svg.match(new RegExp('Animated '+job+' pose','g'))||[]).length,4);
});
test('quatro tarefas usam faixas distintas do atlas',()=>{
 assert.deepEqual(['wood','stone','farm','build'].map(job=>render(job).calls[0][1]),[0,224,448,672]);
 assert.deepEqual([0,185,370,555].map(now=>render('wood',now).calls[0][1]),[0,56,112,168]);
});
test('trabalho respeita era, LOD, carregamento e deslocamento',()=>{
 assert.equal(render('wood',0,{era:2}).drawn,false);
 assert.equal(render('wood',0,{zoom:.5}).drawn,false);
 assert.equal(render('wood',0,{loaded:false}).drawn,false);
 assert.equal(render('wood',0,{moving:true}).drawn,false);
 assert.equal(render('walk').drawn,false);
 assert.equal(render('wood').drawn,true);
});
test('tarefas desenham objetos no chão antes do personagem',()=>{
 const r=render('build');
 assert.equal(r.props.length,1);
 assert.equal(r.props[0][3],'build');
 assert.equal(r.calls.length,1);
 assert.equal(r.calls[0][2],0);
 assert.equal(r.calls[0][3],56);
 assert.equal(r.calls[0][4],104);
 assert.ok(r.calls[0][6]<0);
 assert.ok(r.calls[0][6]+r.calls[0][8]>0);
});
