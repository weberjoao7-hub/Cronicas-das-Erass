'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const begin=script.indexOf('function drawGrazingAurochs(');
const end=script.indexOf('function drawWildlife(',begin);
assert.ok(begin>=0&&end>begin,'rebanho isolavel');
const source=script.slice(begin,end);
function scene(ww=78,now=1234,season=1,x=14,y=22){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const rnd=(x,y,salt)=>((Math.sin(x*71.13+y*17.2+salt*11.1)*43758.5453)%1+1)%1;
 const draw=new Function('ctx','rnd','forestSeason',source+'return drawGrazingAurochs')(ctx,rnd,()=>season);
 const count=draw(190,210,ww,ww*.5,x,y,now,season);
 return {count,calls,styles};
}
test('script completo compila e o formato do salvamento continua intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('auroques aparecem somente em pradarias livres, exploradas e visiveis',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.ok(render.includes('if(!exploredFog[y*W+x])continue'));
 assert.match(render,/if\(\(b===1\|\|b===2\)\&\&!ruinKind\&\&!structures\.has\(key\(x,y\)\)\&\&!roadTiles\.has\(key\(x,y\)\)\)/);
 assert.match(render,/if\(b===1&&q>\.962&&ww>=48&&visibleFog\[y\*W\+x\]&&!riparianMask\[y\*W\+x\]&&!orchardTile\(x,y,b\)\)/);
 assert.ok(render.indexOf('drawGrazingAurochs(px,py')<render.lastIndexOf('drawTileOccupants(x,y'));
});
test('LOD reduz o custo: sem desenho distante, dois ou tres animais perto',()=>{
 const far=scene(30),mid=scene(52),near=scene(94);
 assert.equal(far.count,0);assert.equal(far.calls.length,0);
 assert.equal(mid.count,2);assert.equal(near.count,3);
 assert.ok(near.calls.length>mid.calls.length);
});
test('sombra e pes fixos, pastagem animada e inverno com pelagem propria',()=>{
 const summer=scene(90,1234,1),winter=scene(90,1234,3);
 assert.ok(summer.styles.includes('#12251e85'));
 assert.ok(winter.styles.includes('#a69a83'));
 assert.ok(!summer.styles.includes('#c3bba7'));
 assert.ok(winter.styles.includes('#c3bba7'));
 assert.deepEqual(scene(90,1234).calls,scene(90,1234).calls);
 assert.notDeepEqual(scene(90,1234).calls,scene(90,2234).calls);
});
test('coordenadas finitas e saves/restores balanceados em todos os zooms e estacoes',()=>{
 for(const ww of [24,48,60,70,90,120])for(let season=0;season<4;season++){
  const {calls}=scene(ww,1800,season);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
