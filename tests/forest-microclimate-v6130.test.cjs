'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.130: microclima dos bosques');
const end=script.indexOf('// v6.126: pinheiros alpinos',start);
assert.ok(start>0&&end>start,'efeitos sazonais isolaveis');
const source=script.slice(start,end);
function scene({season=2,night=0,ww=84,hh=42,now=2400,kind='forest',x=84,y=80}={}){
 const calls=[],colors=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true;}
 });
 const rnd=(a,b,c)=>c===611?.9:((Math.sin(a*127.1+b*311.7+c*78.233)*43758.5453)%1+1)%1;
 const draw=new Function('ctx','rnd','forestSeason',source+';return drawSeasonalForestParticles;')(ctx,rnd,()=>season);
 return {count:draw(200,180,ww,hh,x,y,now,season,kind,night),calls,colors};
}
test('v6.130: sintaxe do jogo e save atual preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'/);
 assert.doesNotMatch(source.replace(/\/\/[^\n]*/g,''),/localStorage|Math\.random|setInterval|requestAnimationFrame|game\.units\.push/);
});
test('folhas aparecem apenas no outono com zoom suficiente',()=>{
 for(const season of [0,3])assert.equal(scene({season}).count,0);
 assert.equal(scene({season:1,night:0}).count,0);
 assert.equal(scene({season:2,ww:44}).count,0);
 assert.equal(scene({season:2,ww:60}).count,2);
 assert.equal(scene({season:2,ww:84}).count,4);
});
test('vagalumes somente no verao durante a noite',()=>{
 assert.equal(scene({season:1,night:.28}).count,0);
 assert.equal(scene({season:1,night:.6,ww:60}).count,2);
 const lit=scene({season:1,night:.85});
 assert.equal(lit.count,4);
 assert.ok(lit.colors.includes('#fff2ae'));
 assert.ok(lit.calls.some(c=>c[0]==='arc'));
});
test('folhas e vagalumes animam com o tempo e diferenciam pomares',()=>{
 assert.notDeepEqual(scene({now:2400}).calls,scene({now:3800}).calls);
 assert.notDeepEqual(scene({kind:'orchard'}).calls,scene({kind:'forest'}).calls);
 assert.notDeepEqual(scene({season:1,night:.7,now:2400}).calls,scene({season:1,night:.7,now:3800}).calls);
});
test('Canvas finito, estados equilibrados e LOD previsivel',()=>{
 for(const season of [1,2])for(const ww of [46,70,76,150]){
  const s=scene({season,night:.8,ww,hh:ww/2});
  const saves=s.calls.filter(c=>c[0]==='save').length;
  const restores=s.calls.filter(c=>c[0]==='restore').length;
  assert.equal(saves,restores);
  assert.equal(s.count,ww>=76?4:2);
 }
});
test('integracao respeita nevoa, bioma, construcoes e ordem de profundidade',()=>{
 const a=script.indexOf('function draw(){'),b=script.indexOf('drawCloudShadows(frameTime',a);
 const render=script.slice(a,b);
 const call=render.indexOf('drawSeasonalForestParticles(px,py,ww,hh,x,y,frameTime');
 assert.ok(call>0);
 assert.ok(render.lastIndexOf('visibleFog[y*W+x]',call)>=0);
 assert.ok(render.lastIndexOf('forestOpen||orchardOpen',call)>=0);
 assert.ok(render.lastIndexOf('else drawTileOccupants(x,y,unitTiles,enemyTiles,z,frameTime)',call)>=0);
 assert.match(render,/forestOpen=b===3&&!structures\.has\(forestTile\)&&!roadTiles\.has\(forestTile\)/);
 assert.match(render,/orchardOpen=.*!structures\.has\(key\(x,y\)\).*?!roadTiles\.has\(key\(x,y\)\)/);
});
