'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function orchardTile(');
const end=script.indexOf('function meadowDetails(',start);
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function orchard(){
 const calls=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawOrchard')(ctx,rnd);
 return {draw,calls};
}
test('pomar com tropas preserva sintaxe e chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval/);
});
test('as sombras sao desenhadas apenas na camada de fundo',()=>{
 const a=orchard(),b=orchard();
 a.draw(180,160,90,45,17,28,1,2000,'back',-Infinity);
 b.draw(180,160,90,45,17,28,1,2000,'range',-Infinity,Infinity);
 assert.equal(a.calls.filter(c=>c[0]==='ellipse').length,2);
 assert.ok(b.calls.filter(c=>c[0]==='ellipse').length>2);
});
test('intervalos de profundidade preservam a geometria sem duplicar copas',()=>{
 const all=orchard(),split=orchard();
 const args=[180,160,90,45,17,28,1,2000];
 all.draw(...args);
 split.draw(...args,'back',-Infinity);
 split.draw(...args,'range',-Infinity,166);
 split.draw(...args,'front',166);
 const drawing=calls=>calls.filter(c=>c[0]!=='save'&&c[0]!=='restore');
 assert.deepEqual(drawing(split.calls),drawing(all.calls));
});
test('a ordem de renderizacao intercala cada ator e as arvores',()=>{
 const a=script.indexOf('function drawOrchardOccupiedTile(');
 const b=script.indexOf('function drawForestOccupiedTile(',a);
 assert.ok(a>0&&b>a);
 const actors=[{u:{x:1,y:1}},{u:{x:2,y:2}},{u:{x:3,y:3}}],events=[];
 const draw=new Function('tileActors','point','drawOrchard','drawTileOccupants','forestSeason',script.slice(a,b)+';return drawOrchardOccupiedTile')(
  ()=>actors,(x,y)=>[0,x+y],
  (...args)=>events.push(['tree',args[8],args[9],args[10]]),
  (...args)=>events.push(['unit',args[6][0]]),()=>1
 );
 draw(17,28,180,160,90,45,new Map(),new Map(),1,2000);
 assert.deepEqual(events.map(e=>e[0]),['tree','unit','tree','unit','tree','unit','tree']);
 assert.deepEqual(events.filter(e=>e[0]==='tree').map(e=>e.slice(1)),[
  ['range',-Infinity,2],['range',2,4],['range',4,6],['front',6,undefined]
 ]);
});
test('pomares ocupados respeitam construcoes, estradas e margens',()=>{
 assert.match(script,/const orchardOpen=\(b===1\|\|b===2\)&&!ruinKind&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)&&orchardTile\(x,y,b\)&&!riparianMask\[y\*W\+x\]/);
 assert.match(script,/if\(orchardActors\.length\)drawOrchard\(px,py,ww,hh,x,y,forestSeason\(\),frameTime,'back',-Infinity\)/);
 assert.match(script,/else if\(orchardActors\?\.length\)drawOrchardOccupiedTile/);
 assert.match(script,/else drawTileOccupants\(x,y,unitTiles,enemyTiles,z,frameTime\);/);
});
