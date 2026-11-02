'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function drawShallowWaterCaustics('),end=script.indexOf('// v6.169:',start);
assert.ok(start>=0&&end>start,'causticas isolaveis');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene({ww=90,mask=15,depth=1,season=1,phase=.3,rain=0,occupied=false,now=1000}={}){
 const calls=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'geometria finita em '+k);
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;return true}
 });
 const fn=new Function('ctx','rnd','lightLevels','forestSeason','dayClock','renderRainLevel',source+'return drawShallowWaterCaustics;');
 const draw=fn(ctx,rnd,p=>({night:p>.7?1:0}),()=>season,phase*120,rain);
 const count=draw(200,140,ww,ww*46/90,17,24,mask,depth,season,phase,rain,occupied,now);
 return {count,calls};
}
test('v6.187: script compila e preserva o salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=187);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('causticas so existem em agua rasa, de dia e sem neve',()=>{
 for(const options of [{mask:0},{depth:0},{depth:3},{season:3},{phase:.9},{rain:1},{occupied:true},{ww:40}]){
  const s=scene(options);assert.equal(s.count,0,JSON.stringify(options));assert.equal(s.calls.length,0);
 }
});
test('arestas e nivel de zoom controlam custo',()=>{
 assert.equal(scene({mask:1}).count,3);
 assert.equal(scene({mask:15}).count,6);
 assert.ok(scene({ww:90}).calls.length>scene({ww:58}).calls.length);
 assert.ok(scene({depth:2}).count>0);
});
test('geometria deterministica e animacao no tempo',()=>{
 assert.deepEqual(scene({now:12345}),scene({now:12345}));
 assert.notDeepEqual(scene({now:12345}),scene({now:22345}));
});
test('Canvas permanece equilibrado, recortado e com limite de custo',()=>{
 const s=scene();
 assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='clip').length,1);
 assert.ok(s.calls.filter(c=>c[0]==='ellipse').length<=8);
 assert.ok(s.calls.length<115);
});
test('integracao no lago respeita visibilidade e precede a espuma',()=>{
 const a=script.indexOf('if(b===0)drawLakeDepth(');
 const b=script.indexOf('if(b===0&&visibleFog[y*W+x]&&shoreMask[y*W+x])drawShallowWaterCaustics(',a);
 const c=script.indexOf('drawShoreFoam(px,py,ww,hh,x,y,shoreMask[y*W+x],frameTime)',b);
 assert.ok(a>=0&&b>a&&c>b);
 assert.match(script.slice(b,b+370),/structures\.has\(key\(x,y\)\)\|\|boatTiles\.has\(key\(x,y\)\)/);
});
