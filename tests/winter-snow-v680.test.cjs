'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('function drawSnowWeather(');
const end=script.indexOf('function drawWeather(',start);
assert.ok(start>0&&end>start,'Winter snow renderer must exist');
const snow=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function paint({width=390,height=844,zoom=1,visible=true,strength=.82,now=15000,day=27}={}){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));calls.push([k,...args]);}},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const render=new Function('ctx','w','h','rnd','scale','tileAt','visibleAt','game',snow+';return drawSnowWeather;')(ctx,width,height,rnd,zoom,()=>({x:80,y:80}),()=>visible,{day});
 const before=JSON.stringify({day});
 const painted=render(now,strength);
 assert.equal(JSON.stringify({day}),before);
 return {calls,painted};
}
test('v6.80 JavaScript parses and keeps local save schema',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(snow,/localStorage|game\.buildings|game\.units/);
});
test('winter snow uses bounded flakes and desktop LOD',()=>{
 const mobile=paint(),desktop=paint({width:1366});
 assert.ok(mobile.painted>15);
 assert.ok(desktop.painted>mobile.painted);
 assert.ok(mobile.painted<=76);
 assert.ok(desktop.painted<=148);
 assert.ok(paint({zoom:.5}).painted<mobile.painted);
});
test('snow cannot reveal unexplored or fogged terrain',()=>{
 assert.equal(paint({visible:false}).painted,0);
 assert.equal(paint({visible:false}).calls.filter(c=>c[0]==='ellipse').length,0);
 assert.ok(paint({visible:true}).painted>0);
});
test('snow animation is deterministic at fixed time and changes with time',()=>{
 assert.deepEqual(paint().calls,paint().calls);
 assert.notDeepEqual(paint({now:15000}).calls,paint({now:17000}).calls);
 assert.equal(paint({strength:0}).painted,0);
});
test('snow is drawn only in winter and rainfall remains active in other seasons',()=>{
 const a=script.indexOf('function drawWeather('),b=script.indexOf('// Janelas acesas:',a);
 const renderer=script.slice(a,b);
 const calls=[],ctx=new Proxy({}, {get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args])},set(o,k,v){o[k]=v;return true}});
 const run=(season)=>{
  const snowCalls=[];
  const draw=new Function('ctx','game','dayClock','w','h','rnd','scale','tileAt','W','H','biome','visibleAt','at','weatherForDay','weatherPreview','forestSeason','drawSnowWeather',renderer+';return drawWeather;')(ctx,{day:27},60,390,844,rnd,1,()=>({x:80,y:80}),160,160,()=>0,()=>true,()=>null,()=>.82,false,()=>season,(...args)=>snowCalls.push(args));
  draw(15000);return snowCalls;
 };
 assert.equal(run(3).length,1);
 assert.equal(run(1).length,0);
 assert.ok(calls.some(c=>c[0]==='stroke'),'Rain streaks should still render');
});
test('winter disables rain puddles and roof runoff, and HUD labels snowfall',()=>{
 assert.match(script,/const rainLevel=forestSeason\(\)===3\?0:/);
 assert.match(script,/forestSeason\(\)===3\?'❄️ Neve · ':'🌧️ Chuva · '/);
 assert.match(script,/forestSeason\(\)===3\?'❄️ Testar neve no mapa':'🌧️ Testar chuva no mapa'/);
 assert.match(script,/drawAmbientParticles\(frameTime\);drawWeather\(frameTime\)/);
});
