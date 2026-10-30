'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('// v6.103: posto de extração florestal');
const end=script.indexOf('function drawForestOccupiedTile(',start);
assert.ok(start>=0&&end>start,'fonte isolavel');
const source=script.slice(start,end);
const build=()=>new Function('ctx','forestSeason',source+'return {isActiveForestWorker,drawForestWorksite};');
function scene(era=4,ww=74,now=1200,season=1){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k);calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const f=build()(ctx,()=>season);
 return {count:f.drawForestWorksite(200,180,ww,ww*38/74,24,27,era,now,season),calls,styles};
}
test('v6.103: sintaxe e salvamento legado preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.103<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('apenas aldeão ativo parado no tile gera posto de trabalho',()=>{
 const {isActiveForestWorker}=build()({},()=>1);
 const worker={kind:'worker',job:true,x:24.5,y:27.5,tx:24.5,ty:27.5,path:[]};
 assert.equal(isActiveForestWorker(worker,24,27),true);
 assert.equal(isActiveForestWorker({...worker,kind:'warrior'},24,27),false);
 assert.equal(isActiveForestWorker({...worker,job:false},24,27),false);
 assert.equal(isActiveForestWorker({...worker,path:[{x:25.5,y:27.5}]},24,27),false);
 assert.equal(isActiveForestWorker({...worker,buildTarget:'26,27'},24,27),false);
 assert.equal(isActiveForestWorker({...worker,huntTarget:'25,27'},24,27),false);
 assert.equal(isActiveForestWorker({...worker,x:25.5},24,27),false);
 assert.equal(isActiveForestWorker({...worker,tx:24.9},24,27),false);
});
test('LOD distante e toras volumetricas no zoom proximo',()=>{
 assert.equal(scene(4,24).count,0);
 assert.equal(scene(4,24).calls.length,0);
 assert.equal(scene(4,74).count,1);
 assert.ok(scene(4,74).calls.filter(c=>c[0]==='ellipse').length>=5);
});
test('cavalete historico, estrutura industrial e neve',()=>{
 const primitive=scene(0),medieval=scene(4),modern=scene(7),winter=scene(4,74,1200,3);
 assert.ok(!primitive.styles.includes('#9c784c'));
 assert.ok(medieval.styles.includes('#89765a'));
 assert.ok(modern.styles.includes('#6c8a91'));
 assert.ok(modern.styles.includes('#455d62'));
 assert.ok(winter.styles.includes('#e6eee6c9'));
 assert.ok(!medieval.styles.includes('#e6eee6c9'));
});
test('animacao deterministica e Canvas equilibrado em oito eras',()=>{
 assert.deepEqual(scene(4,74,1200),scene(4,74,1200));
 assert.notDeepEqual(scene(4,74,1200).calls,scene(4,74,1550).calls);
 for(let era=0;era<8;era++)for(const zoom of [24,38,54,74]){
  const s=scene(era,zoom,1300);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('integracao no bosque mantem profundidade e fog',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.ok(render.includes('if(!exploredFog[y*W+x])continue'));
 assert.ok(render.includes('if(forestFriendlies?.some(u=>isActiveForestWorker(u,x,y)))'));
 assert.ok(render.includes('drawForestWorksite(px,py,ww,hh,x,y,game.era,frameTime,forestSeason())'));
 assert.ok(render.includes('if(forestCount)drawForestOccupiedTile('));
 assert.ok(render.includes("if(forestCount)drawForestGrove(px,py,ww,hh,x,y,q,frameTime,'back',-Infinity)"));
});
