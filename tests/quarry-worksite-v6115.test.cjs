'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const begin=script.indexOf('// v6.116: pedreira de campo');
const end=script.indexOf('function drawForestOccupiedTile(',begin);
assert.ok(begin>=0&&end>begin,'pedreira isolavel');
const source=script.slice(begin,end);
const predicateStart=script.indexOf('function isActiveForestWorker(');
const predicateEnd=script.indexOf('function drawForestWorksite(',predicateStart);
const isActiveForestWorker=new Function(script.slice(predicateStart,predicateEnd)+'return isActiveForestWorker')();
function scene(era=4,ww=74,now=1200,season=1){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const f=new Function('ctx','rnd','scale','forestSeason','isActiveForestWorker',
  source+'return {isActiveQuarryWorker,drawQuarryWorksite}')(ctx,()=>.6,1,()=>season,isActiveForestWorker);
 const count=f.drawQuarryWorksite(200,180,ww,ww*.52,24,27,era,now,season);
 return {count,calls,styles,check:f.isActiveQuarryWorker};
}
test('v6.115: sintaxe JavaScript valida e save legado preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('pedreira exige trabalhador ativo parado e sem tarefas de construção ou caça',()=>{
 const check=scene().check;
 const worker={kind:'worker',job:true,x:24.5,y:27.5,tx:24.5,ty:27.5,path:[]};
 assert.equal(check(worker,24,27),true);
 assert.equal(check({...worker,kind:'warrior'},24,27),false);
 assert.equal(check({...worker,job:false},24,27),false);
 assert.equal(check({...worker,path:[{x:25.5,y:27.5}]},24,27),false);
 assert.equal(check({...worker,buildTarget:'24,27'},24,27),false);
 assert.equal(check({...worker,huntTarget:'24,27'},24,27),false);
 assert.equal(check({...worker,x:25.5},24,27),false);
});
test('LOD nao desenha a distancia e aumenta detalhes no zoom proximo',()=>{
 const far=scene(4,25),mid=scene(4,47),near=scene(4,74);
 assert.equal(far.count,0);assert.equal(far.calls.length,0);
 assert.equal(mid.count,1);assert.equal(near.count,1);
 assert.ok(near.calls.length>mid.calls.length);
 assert.ok(near.calls.some(c=>c[0]==='quadraticCurveTo'));
});
test('ferramentas e protecoes evoluem entre eras, inverno cobre as pedras',()=>{
 assert.ok(scene(0).styles.includes('#98724a'));
 assert.ok(scene(4).styles.includes('#8b7655'));
 assert.ok(scene(7).styles.includes('#607e83'));
 assert.ok(scene(7).styles.includes('#d6b858'));
 assert.ok(scene(4,74,1200,3).styles.includes('#e3ece6c7'));
 assert.ok(!scene(4,74,1200,1).styles.includes('#e3ece6c7'));
});
test('animacao deterministica e Canvas balanceado nas oito eras',()=>{
 assert.deepEqual(scene(4,74,1200).calls,scene(4,74,1200).calls);
 assert.notDeepEqual(scene(4,74,1200).calls,scene(4,74,1650).calls);
 for(let era=0;era<8;era++)for(const zoom of [25,47,74]){
  const s=scene(era,zoom,1650);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('integracao somente em colinas exploradas, sem estradas, ruinas ou construcoes',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.ok(render.includes('if(!exploredFog[y*W+x])continue'));
 assert.ok(render.includes('if(b===4&&!ruinKind&&!structures.has(key(x,y))&&!roadTiles.has(key(x,y)))'));
 assert.ok(render.includes('quarryWorkers?.some(u=>isActiveQuarryWorker(u,x,y))'));
 assert.ok(render.includes('drawQuarryWorksite(px,py,ww,hh,x,y,game.era,frameTime,forestSeason())'));
 assert.ok(render.indexOf('drawQuarryWorksite(px,py')<render.indexOf('drawTileOccupants(x,y'));
});
