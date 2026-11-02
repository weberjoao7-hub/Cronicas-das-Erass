'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('const SHORE_UNIT_REFLECTION_EDGES=');
const end=script.indexOf('function drawForestWaterReflections(',start);
assert.ok(start>0&&end>start,'funções de reflexo podem ser isoladas');
const source=script.slice(start,end);
const W=160,H=160,visible=new Uint8Array(W*H).fill(1);
const key=(x,y)=>x+','+y,point=(x,y)=>[(x-y)*48,(x+y)*24];
function harness(era=4,images=true){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;return true}
 });
 const troop={complete:images,naturalWidth:images?256:0},cavalry={complete:images,naturalWidth:images?448:0};
 const villager={complete:images,naturalWidth:images?336:0};
 const api=new Function('W','H','key','point','ctx','paintedTroops','paintedCavalry','paintedVillagers','game',
  source+'return {shoreUnitReflectionCandidates,drawShoreUnitReflections};')(
  W,H,key,point,ctx,troop,cavalry,villager,{era});
 return {...api,calls};
}
const unit=(kind='warrior',x=9.82,y=10.52)=>({kind,x,y,hp:100,face:1,path:[]});
const groups=(units)=>[new Map([['9,10',units]]),new Map()];
test('v6.169 compila, mantém o salvamento e integra reflexos somente nas margens visíveis',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/drawShoreUnitReflections\(px,py,ww,hh,x,y,shoreMask\[y\*W\+x\],unitTiles,enemyTiles,visibleFog,z,forestSeason\(\),frameTime\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|u\.(?:x|y|hp)\s*=/);
});
test('projeção espelhada atravessa apenas a aresta correta da costa',()=>{
 const {shoreUnitReflectionCandidates:sites}=harness();
 const [friends,enemies]=groups([unit()]);
 const result=sites(10,10,1,friends,enemies,visible);
 assert.equal(result.length,1);
 assert.ok(Math.abs(result[0].x-10.18)<1e-9);
 assert.equal(result[0].y,10.52);
 assert.ok(result[0].alpha>.10&&result[0].alpha<.18);
 assert.equal(sites(10,10,2,friends,enemies,visible).length,0);
});
test('névoa de guerra, unidades mortas e afastadas não geram reflexos',()=>{
 const {shoreUnitReflectionCandidates:sites}=harness();
 const [friends,enemies]=groups([unit()]);
 const fog=visible.slice();fog[10*W+9]=0;
 assert.equal(sites(10,10,1,friends,enemies,fog).length,0);
 fog[10*W+9]=1;fog[10*W+10]=0;
 assert.equal(sites(10,10,1,friends,enemies,fog).length,0);
 friends.set('9,10',[unit('warrior',9.53),unit('warrior',9.82,10.52)]);
 friends.get('9,10')[1].hp=0;
 assert.equal(sites(10,10,1,friends,enemies,visible).length,0);
});
test('até três reflexos por tile sem mutação, determinísticos com tropas de ambas as facções',()=>{
 const {shoreUnitReflectionCandidates:sites}=harness();
 const units=[unit(),unit('archer',9.86),unit('cavalry',9.91),unit('worker',9.94)];
 const [friends,enemies]=groups(units.slice(0,2));enemies.set('9,10',units.slice(2));
 const before=JSON.stringify(units);
 const result=sites(10,10,1,friends,enemies,visible);
 assert.equal(result.length,3);
 assert.deepEqual(result,sites(10,10,1,friends,enemies,visible));
 assert.equal(JSON.stringify(units),before);
});
test('Canvas recorta a água, desenha atlas espelhado e restaura estados',()=>{
 const h=harness(),[friends,enemies]=groups([unit()]);
 assert.equal(h.drawShoreUnitReflections(100,100,96,48,10,10,1,friends,enemies,visible,1.2,0,1000),1);
 assert.equal(h.calls.filter(c=>c[0]==='clip').length,1);
 assert.equal(h.calls.filter(c=>c[0]==='drawImage').length,1);
 assert.ok(h.calls.some(c=>c[0]==='scale'&&c[2]<0),'reflexo vertical');
 assert.equal(h.calls.filter(c=>c[0]==='save').length,h.calls.filter(c=>c[0]==='restore').length);
});
test('LOD, gelo e fallback sem atlas não quebram o desenho',()=>{
 const [friends,enemies]=groups([unit()]);
 const h=harness(4,false);
 assert.equal(h.drawShoreUnitReflections(100,100,38,20,10,10,1,friends,enemies,visible,.5,0,1000),0);
 assert.equal(h.drawShoreUnitReflections(100,100,96,48,10,10,1,friends,enemies,visible,1.2,3,1000),0);
 assert.equal(h.drawShoreUnitReflections(100,100,96,48,10,10,1,friends,enemies,visible,1.2,0,1000),1);
 assert.equal(h.calls.filter(c=>c[0]==='drawImage').length,0);
 assert.ok(h.calls.some(c=>c[0]==='ellipse'),'fallback vetorial');
});
