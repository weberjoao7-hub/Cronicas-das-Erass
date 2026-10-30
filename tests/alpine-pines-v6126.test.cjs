'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.126: pinheiros alpinos');
const end=script.indexOf('// Faces rochosas expostas em colinas',start);
assert.ok(start>=0&&end>start,'pinheiros isoláveis');
const source=script.slice(start,end);
function scene({ww=74,season=0,seed=.9,now=1000}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawAlpinePines;')(ctx,()=>seed);
 return {count:draw(200,180,ww,ww*.5,21,32,season,now),calls,styles};
}
test('v6.126: sintaxe e salvamento anterior preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.units|game\.buildings|setInterval/);
});
test('pinheiros respeitam LOD e densidade determinística',()=>{
 assert.equal(scene({ww:24}).count,0);
 assert.equal(scene({ww:24}).calls.length,0);
 assert.equal(scene({ww:45}).count,1);
 assert.equal(scene({ww:74}).count,2);
 assert.equal(scene({ww:74,seed:.2}).count,0);
 assert.deepEqual(scene().calls,scene().calls);
});
test('sombras, troncos e copas são ancorados ao terreno',()=>{
 const s=scene();
 assert.ok(s.calls.some(c=>c[0]==='ellipse'));
 assert.ok(s.calls.some(c=>c[0]==='fillRect'));
 assert.ok(s.calls.some(c=>c[0]==='lineTo'));
 assert.ok(s.styles.includes('#315e50'));
 assert.ok(s.styles.includes('#20473f'));
});
test('inverno acumula neve nas faces das copas',()=>{
 const summer=scene(),winter=scene({season:3});
 assert.ok(!summer.styles.includes('#e3ede6'));
 assert.ok(winter.styles.includes('#e3ede6'));
 assert.ok(winter.styles.includes('#b7d3d1'));
});
test('vento animado e pilha Canvas equilibrada em vários zooms',()=>{
 assert.notDeepEqual(scene({now:1000}).calls,scene({now:2800}).calls);
 for(const ww of [39,45,60,61,74,100]){
  const s=scene({ww});
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('renderização integrada após montanhas, apenas em terreno livre e visível',()=>{
 const terrain=script.indexOf('if(b===5&&ww>13){drawMountain(');
 const pines=script.indexOf('drawAlpinePines(px,py,ww,hh,x,y,forestSeason(),frameTime)',terrain);
 const troops=script.indexOf('let animal=wildlifeAt(x,y)',terrain);
 assert.ok(terrain>=0&&pines>terrain&&troops>pines);
 const condition=script.slice(pines-150,pines);
 assert.match(condition,/visibleFog\[y\*W\+x\]/);
 assert.match(condition,/!ruinKind/);
 assert.match(condition,/!structures\.has\(key\(x,y\)\)/);
 assert.match(condition,/!roadTiles\.has\(key\(x,y\)\)/);
});
