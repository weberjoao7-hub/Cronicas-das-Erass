'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const svg=fs.readFileSync(path.join(root,'assets','cronicas_tropas_atlas.svg'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script is present');
const start=script.indexOf('function drawPaintedTroop(');
const end=script.indexOf('function drawUnitSprite(',start);
assert.ok(start>=0&&end>start,'troop atlas render function present');
const source=script.slice(start,end);

function render(era,archer,{zoom=1.25,moving=false,striking=false,now=0,loaded=true,direction=1}={}){
 const calls=[],ops=[];
 const ctx={
  save(){ops.push('save')},restore(){ops.push('restore')},
  translate(...args){ops.push(['translate',...args])},
  scale(...args){ops.push(['scale',...args])},
  drawImage(...args){calls.push(args)}
 };
 const paintedTroops={complete:loaded,naturalWidth:loaded?256:0,naturalHeight:loaded?896:0};
 const draw=new Function('ctx','paintedTroops','game',source+';return drawPaintedTroop;')(ctx,paintedTroops,{era});
 const drawn=draw({kind:archer?'archer':'warrior'},200,220,zoom,archer,moving,striking,now,direction);
 return {drawn,calls,ops};
}

test('main JavaScript compiles, asset is loaded and legacy saves remain',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/paintedTroops\.src='assets\/cronicas_tropas_atlas\.svg'/);
 assert.match(script,/drawPaintedTroop\(u,px,py,z,archer,moving,striking,now,direction,enemy\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('transparent atlas contains 32 distinct historical troop frames',()=>{
 assert.match(svg,/<svg[^>]*width="256"[^>]*height="896"/);
 assert.ok(!/<(?:image|foreignObject|script)\b/i.test(svg),'no external raster assets or scripts');
 const frames=[...svg.matchAll(/data-frame="(\d)-(\d)-(\d)"/g)];
 assert.equal(frames.length,32);
 for(let era=0;era<4;era++)for(let kind=0;kind<2;kind++)for(let pose=0;pose<4;pose++)
  assert.ok(frames.some(m=>m[1]==era&&m[2]==kind&&m[3]==pose),'frame '+era+'-'+kind+'-'+pose);
 assert.match(svg,/url\(#steel\)/);
 assert.match(svg,/url\(#bronze\)/);
 assert.equal([...svg.matchAll(/clip-path="url\(#troopFrameClip\)"/g)].length,32,'every frame clips its own cell');
});
test('all eight eras and both troop types map to the correct atlas row',()=>{
 for(let era=0;era<8;era++)for(const archer of [false,true]){
  const r=render(era,archer);
  assert.equal(r.drawn,true);
  assert.equal(r.calls.length,1);
  assert.equal(r.calls[0][1],0,'idle frame');
  assert.equal(r.calls[0][2],(Math.floor(era/2)*2+Number(archer))*112,'historical row');
  assert.deepEqual(r.calls[0].slice(3,5),[64,112]);
 }
});
test('walking and attack use distinct animation poses',()=>{
 assert.deepEqual([0,155,310,465].map(now=>render(4,false,{moving:true,now}).calls[0][1]),[64,128,64,128]);
 assert.equal(render(4,true,{moving:true,striking:true,now:155}).calls[0][1],192,'attack overrides walk');
 assert.equal(render(4,true,{moving:false,striking:false}).calls[0][1],0,'idle');
});
test('mobile LOD and loading fallback keep existing vector rendering available',()=>{
 assert.equal(render(4,false,{zoom:.6}).drawn,false);
 assert.equal(render(4,false,{loaded:false}).drawn,false);
 assert.equal(render(4,false,{zoom:.72}).drawn,true);
 assert.ok(script.includes("typeof paintedTroops!=='undefined'"),'isolated troop renderers can use fallback');
 assert.match(script,/\(archer\|\|warrior\)&&!hit/);
});
test('sprites are grounded, mirrored and isolated by save/restore',()=>{
 const r=render(6,true,{direction:-1,zoom:1});
 assert.deepEqual(r.ops[0],'save');
 assert.deepEqual(r.ops[1],['translate',200,220]);
 assert.deepEqual(r.ops[2],['scale',-1,1]);
 assert.equal(r.ops.at(-1),'restore');
 const args=r.calls[0],h=args[8];
 assert.ok(Math.abs(args[6]+h*.875)<1e-8,'ground contact at 87.5 percent of sprite height');
});
