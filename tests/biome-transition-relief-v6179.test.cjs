'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawBiomeTransitionRelief('),end=script.indexOf('function drawBiomeSeam(',start);
assert.ok(start>=0&&end>start,'funcao isolavel');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
function paint({ww=74,season=1,mask=2,here=2,other=5,x=20,y=20}={}){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k);calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const biome=(tx,ty)=>tx===x&&ty===y?here:other;
 const draw=new Function('ctx','rnd','biome','seamDirs','forestSeason',source+'return drawBiomeTransitionRelief;')(ctx,rnd,biome,dirs,()=>season);
 return {count:draw(200,180,ww,ww*38/74,x,y,mask,season),calls,styles};
}
test('v6.179: sintaxe e salvamento preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=179);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('LOD e mascara reduzem trabalho fora do zoom',()=>{
 assert.equal(paint({ww:30}).count,0);assert.equal(paint({ww:30}).calls.length,0);
 assert.equal(paint({mask:0}).count,0);assert.equal(paint({mask:0}).calls.length,0);
 assert.equal(paint({ww:74}).count,3);assert.equal(paint({ww:90}).count,4);
 assert.equal(paint({mask:15,ww:74}).count,12);
});
test('variacao espacial deterministica',()=>{
 assert.deepEqual(paint({ww:90}),paint({ww:90}));
 assert.notDeepEqual(paint({ww:90,x:21}).calls,paint({ww:90,x:20}).calls);
});
test('rochas volumetricas e neve sazonal',()=>{
 const summer=paint({other:5}),winter=paint({other:5,season:3});
 assert.ok(summer.styles.includes('#6b7779'));assert.ok(summer.styles.includes('#c3b8a0'));
 assert.ok(winter.styles.includes('#e9eee4c9'));assert.ok(!summer.styles.includes('#e9eee4c9'));
});
test('bosques e campos apresentam folhagem diferente',()=>{
 const forest=paint({here:3,other:2}),meadow=paint({here:2,other:1}),winter=paint({here:3,other:2,season:3});
 assert.ok(forest.styles.includes('#386f43'));assert.ok(meadow.styles.includes('#809c52'));
 assert.ok(winter.styles.includes('#b5bca6'));assert.ok(forest.calls.some(c=>c[0]==='quadraticCurveTo'));
});
test('Canvas equilibrado e nevoa preservada',()=>{
 for(const season of [0,1,2,3])for(const mask of [1,2,4,8,15])for(const ww of [22,44,60,90]){
  const s=paint({season,mask,ww});
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
 const seam=script.slice(script.indexOf('function drawBiomeSeam('),script.indexOf('// Espuma dinâmica na costa:'));
 assert.match(seam,/drawBiomeTransitionRelief\(px,py,ww,hh,x,y,mask,forestSeason\(\)\)/);
 assert.match(script,/if\(!exploredFog\[y\*W\+x\]\)continue/);
 assert.match(script,/if\(biomeSeams\[y\*W\+x\]\)drawBiomeSeam/);
});
