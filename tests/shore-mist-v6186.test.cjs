'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function groundMistIntensity('),end=script.indexOf('/* Weather follows',start);
assert.ok(start>=0&&end>start,'bruma isolavel');
const source=script.slice(start,end);
function scene({visible=true,biomeType=0,road=false,built=false,scale=1,phase=.09,rain=0,season=1,width=600}={}){
 const W=30,H=30,visibleFog=new Uint8Array(W*H).fill(visible?1:0);
 const waterDepth=new Uint8Array(W*H).fill(1),riparianMask=new Uint8Array(W*H).fill(1);
 const calls=[],stops=[];
 const ctx=new Proxy({createRadialGradient(...args){
  calls.push(['gradient',...args]);return {addColorStop(...a){stops.push(a)}};
 }},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k);
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;return true}});
 const roadTiles={has:()=>road},at=()=>built,key=(x,y)=>x+','+y,rnd=()=>.81,biome=()=>biomeType;
 const bounds={minX:0,minY:0,maxX:29,maxY:29},point=(x,y)=>[x*12,y*9];
 const factory=new Function('ctx','W','H','visibleFog','waterDepth','riparianMask','roadTiles','at','key','rnd','biome','scale','w','h','TW','TH','point','visibleTileBounds','forestSeason','dayClock','renderRainLevel',source+'return {groundMistIntensity,groundMistSites,drawGroundMist};');
 const api=factory(ctx,W,H,visibleFog,waterDepth,riparianMask,roadTiles,at,key,rnd,biome,scale,width,600,74,38,point,()=>bounds,()=>season,phase*120,rain);
 return {api,calls,stops,visibleFog,bounds};
}
test('v6.186: sintaxe e save originais preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=186);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('bruma no amanhecer e crepusculo, ausente ao meio-dia e noite',()=>{
 const {groundMistIntensity:f}=scene().api;
 assert.ok(f(.09,1,0)>.95);assert.ok(f(.55,1,0)>.6);
 assert.equal(f(.32,1,0),0);assert.equal(f(.82,1,0),0);
 assert.equal(f(.09,1,1),0);assert.ok(f(.09,3,0)<f(.09,1,0));
 assert.equal(f(NaN,1,0),0);
});
test('somente margens e agua rasa visiveis recebem bruma',()=>{
 const s=scene();assert.ok(s.api.groundMistSites(s.bounds).length>0);
 s.visibleFog.fill(0);assert.equal(s.api.groundMistSites(s.bounds).length,0);
 const rock=scene({biomeType:5});assert.equal(rock.api.groundMistSites(rock.bounds).length,0);
});
test('estradas, edificios, limite e determinismo',()=>{
 for(const options of [{road:true},{built:true}]){
  const s=scene(options);assert.equal(s.api.groundMistSites(s.bounds).length,0);
 }
 const s=scene(),sites=s.api.groundMistSites(s.bounds,5);
 assert.equal(sites.length,5);assert.deepEqual(s.api.groundMistSites(s.bounds,5),sites);
 assert.ok(sites.every(p=>p.x>=0&&p.y>=0&&p.water));
});
test('LOD e chuva bloqueiam desenho sem custo Canvas',()=>{
 for(const options of [{scale:.5},{rain:1},{phase:.32}]){
  const s=scene(options);assert.equal(s.api.drawGroundMist(1000),0);assert.equal(s.calls.length,0);
 }
});
test('gradientes, recorte de mapa e Canvas equilibrado',()=>{
 for(const season of [1,3]){
  const s=scene({season}),count=s.api.drawGroundMist(2000);
  assert.ok(count>0&&count<=9);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
  assert.equal(s.calls.filter(c=>c[0]==='gradient').length,count);
  assert.equal(s.stops.length,count*3);assert.ok(s.calls.some(c=>c[0]==='clip'));
 }
 assert.match(script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){')),/drawGroundMist\(frameTime\)/);
});
