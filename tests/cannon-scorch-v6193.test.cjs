'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const start=script.indexOf('// v6.193: marcas de artilharia');
const end=script.indexOf('// v6.132: rastros de passos',start);
assert.ok(start>=0&&end>start,'scorch helpers');
const source=script.slice(start,end);
function scene({terrain=2,buildings=[],enemy=null,season=1}={}){
 const calls=[],visibleFog=new Uint8Array(160*160).fill(1);
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'finite '+k);
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['style',k,v]);return true}
 });
 const api=new Function('ctx','biome','W','H','game','rnd','visibleFog','key','point','forestSeason',
   source+'return {cannonScorches,cannonScorchEligible,recordCannonScorch,collectCannonScorches,drawCannonScorchesTile};'
 )(ctx,()=>terrain,160,160,{buildings,enemy},()=>.5,visibleFog,
   (x,y)=>x+','+y,(x,y)=>[x*10,y*5],()=>season);
 return {...api,calls,visibleFog};
}
const bounds={minX:0,minY:0,maxX:20,maxY:20};
test('v6.193: script parses and artillery impact hooks precede scene fog',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(script,/shot\.kind==='cannon'&&age>=2\/3&&!shot\.scorchRecorded/);
 assert.match(script,/const scorchTiles=collectCannonScorches\(bounds,frameTime\)/);
 const decal=script.indexOf('drawCannonScorchesTile(scorchTiles.get(');
 const troops=script.indexOf('drawTileOccupants(x,y,unitTiles,enemyTiles,z,frameTime);',decal);
 assert.ok(decal>=0&&troops>decal,'ground decals drawn before troops');
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame|setInterval/);
});
test('marks require land, in-bounds coordinates and no occupied building',()=>{
 const s=scene();
 assert.equal(s.recordCannonScorch(5.4,6.2,1000),true);
 for(const x of [-1,160,NaN,Infinity])assert.equal(s.recordCannonScorch(x,5,1000),false);
 assert.equal(scene({terrain:0}).recordCannonScorch(5,5,1000),false);
 assert.equal(scene({terrain:5}).recordCannonScorch(5,5,1000),false);
 assert.equal(scene({buildings:[{x:5,y:5}]}).recordCannonScorch(5.2,5.8,1000),false);
 assert.equal(scene({enemy:{x:5,y:5,hp:50}}).recordCannonScorch(5.2,5.8,1000),false);
 assert.equal(s.recordCannonScorch(5,5,NaN),false);
});
test('impact history is capped at 24 and tile draw capped at three',()=>{
 const s=scene();
 for(let i=0;i<40;i++)assert.equal(s.recordCannonScorch(5.1+i*.001,6.1,1000+i),true);
 assert.equal(s.cannonScorches.length,24);
 assert.equal(s.collectCannonScorches(bounds,1200).get('5,6').length,3);
});
test('fog and camera bounds prevent hidden craters, expiry prunes memory',()=>{
 const s=scene();s.recordCannonScorch(5.1,6.1,1000);
 s.visibleFog[6*160+5]=0;
 assert.equal(s.collectCannonScorches(bounds,1100).size,0);
 s.visibleFog[6*160+5]=1;
 assert.equal(s.collectCannonScorches({minX:7,maxX:8,minY:7,maxY:8},1100).size,0);
 assert.equal(s.collectCannonScorches(bounds,1100).size,1);
 assert.equal(s.collectCannonScorches(bounds,25000).size,0);
 assert.equal(s.cannonScorches.length,0);
});
test('Canvas geometry is finite, grounded and has balanced save/restore',()=>{
 const s=scene();s.recordCannonScorch(5.4,6.2,1000);
 const marks=s.collectCannonScorches(bounds,1200).get('5,6');
 assert.equal(s.drawCannonScorchesTile(marks,.5,1200,1),0);
 assert.equal(s.calls.length,0);
 assert.equal(s.drawCannonScorchesTile(marks,1.2,1200,1),1);
 assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 assert.ok(s.calls.filter(c=>c[0]==='ellipse').length>=3);
 assert.ok(s.calls.length<90,'bounded draw calls per mark');
});
test('winter palette and fading embers adapt to season and age',()=>{
 const render=(season,now)=>{
  const s=scene({season});s.recordCannonScorch(5,6,1000);
  const marks=s.collectCannonScorches(bounds,now).get('5,6');
  s.drawCannonScorchesTile(marks,1.2,now,season);return s.calls;
 };
 const summer=render(1,1200),winter=render(3,1200),old=render(1,18000);
 assert.notDeepEqual(summer,winter);
 assert.ok(summer.filter(c=>c[0]==='arc').length>0,'embers when fresh');
 assert.equal(winter.filter(c=>c[0]==='arc').length,0,'no embers in snow');
 assert.equal(old.filter(c=>c[0]==='arc').length,0,'embers expire');
 assert.ok(old.find(c=>c[0]==='style'&&c[1]==='globalAlpha')[2]<
           summer.find(c=>c[0]==='style'&&c[1]==='globalAlpha')[2]);
});
