'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const a=script.indexOf('function drawShoreSpring('),b=script.indexOf('function drawTerrainMicroRelief(',a);
assert.ok(a>0&&b>a);
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(ww=74,season=1,now=10000,mask=4,x=12,y=11){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k+' got '+v);calls.push([k,...args]);}},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','rnd','forestSeason',source+'return drawShoreSpring;')(ctx,rnd,()=>season);
 return {count:draw(100,120,ww,ww*.514,x,y,mask,season,now),calls,styles};
}
test('script compila sem mudar persistencia',()=>{
 assert.doesNotThrow(()=>new Function(script));assert.match(html,/Crônicas das Eras v6\.149/);
 assert.match(script,/cronicas-v04/);assert.doesNotMatch(source,/localStorage|Math\.random|game\.|roadTiles|gameFrame/);
});
test('nascentes so aparecem em margens elegiveis e zoom proximo',()=>{
 assert.equal(scene(74,1,10000,0).count,0);
 assert.equal(scene(32).count,0);
 assert.equal(scene(74).count,1);
 assert.equal(scene(74,1,10000,1,1,1).count,0);
});
test('canal possui margens, agua, poca e clipping no losango',()=>{
 const r=scene();assert.ok(r.calls.filter(c=>c[0]==='stroke').length>=4);
 assert.ok(r.calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.ok(r.calls.some(c=>c[0]==='clip'));
 assert.ok(r.calls.some(c=>c[0]==='ellipse'));
 assert.equal(r.calls.filter(c=>c[0]==='save').length,r.calls.filter(c=>c[0]==='restore').length);
});
test('inverno troca agua corrente por gelo sem espuma animada',()=>{
 const summer=scene(74,1),winter=scene(74,3);
 assert.ok(summer.styles.includes('#377d8c'));assert.ok(winter.styles.includes('#c6dfe0'));
 assert.ok(summer.calls.filter(c=>c[0]==='ellipse').length>winter.calls.filter(c=>c[0]==='ellipse').length);
});
test('ondas mudam com o tempo e geometrias permanecem deterministicas',()=>{
 assert.deepEqual(scene(),scene());assert.notDeepEqual(scene(74,1,10000),scene(74,1,15000));
 assert.deepEqual(scene(74,3,10000),scene(74,3,15000));
});
test('renderiza somente na margem visivel e sem estradas, edificios ou ruinas',()=>{
 assert.match(script,/if\(riparianMask\[y\*W\+x\]&&visibleFog\[y\*W\+x\]&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)&&!ruinKind\)drawShoreSpring\(/);
});
