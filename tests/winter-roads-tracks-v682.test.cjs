'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('function drawWinterRoadSnow('),b=script.indexOf('function drawRoadLantern(',a);
const c=script.indexOf('let renderRainLevel=0;'),d=script.indexOf('// Ocupantes de um mesmo ladrilho',c);
assert.ok(a>0&&b>a&&c>0&&d>c);
const road=script.slice(a,b),march=script.slice(c,d);
function scene(){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;return true}});
 return {ctx,calls};
}
function roads(season=3,ww=68){
 const s=scene(),rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
 const fn=new Function('ctx','rnd','forestSeason',road+';return drawWinterRoadSnow;')(s.ctx,rnd,()=>season);
 return {...s,painted:fn(180,150,ww,ww*.5,80,81,[[1,0],[0,1]],ww*.15)};
}
function footsteps(season=3,rain=0,kind='worker',z=1.4,ground=2,now=1500){
 const s=scene(),api=new Function('ctx','biome','forestSeason',march+';return {drawMarchDust,setRain(v){renderRainLevel=v}};')(s.ctx,()=>ground,()=>season);
 api.setRain(rain);api.drawMarchDust({kind,x:80.5,y:81.5,path:[{x:81,y:82}]},180,150,z,now);return s;
}
test('v6.82 parses and retains the v04 save schema',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(road+march,/localStorage|routeFor|game\.units\s*=/);
});
test('winter accumulates snow along both shoulders of connected roads',()=>{
 assert.equal(roads(3).painted,4);
 assert.ok(roads(3).calls.some(c=>c[0]==='quadraticCurveTo'));
 for(const season of [0,1,2])assert.equal(roads(season).calls.length,0);
});
test('road snow obeys zoom LOD and finite deterministic Canvas geometry',()=>{
 assert.equal(roads(3,25).painted,0);
 assert.deepEqual(roads(3).calls,roads(3).calls);
 assert.ok(roads(3).calls.length<55);
 assert.match(script,/drawWinterRoadSnow\(px,py,ww,hh,x,y,links,width\)/);
});
test('winter tracks replace dry dust and wet splashes',()=>{
 const snow=footsteps(),dry=footsteps(1),wet=footsteps(1,.82);
 assert.equal(snow.calls.filter(c=>c[0]==='fill').length,2);
 assert.equal(dry.calls.filter(c=>c[0]==='fill').length,2);
 assert.equal(wet.calls.filter(c=>c[0]==='stroke').length,2);
 assert.ok(snow.calls.some(c=>c[0]==='stroke'));
});
test('horses leave larger hoof prints and cannons leave wheel ruts',()=>{
 const foot=footsteps(),horse=footsteps(3,0,'cavalry'),cannon=footsteps(3,0,'cannon');
 const radius=s=>s.calls.find(c=>c[0]==='ellipse')[3];
 assert.ok(radius(horse)>radius(foot)&&radius(cannon)>radius(horse));
 assert.equal(cannon.calls.filter(c=>c[0]==='stroke').length,2);
 assert.notDeepEqual(footsteps(3,0,'worker',1.4,2,1500).calls,footsteps(3,0,'worker',1.4,2,2200).calls);
});
test('zoom and impassable biomes suppress marks',()=>{
 for(const [z,b] of [[.6,2],[1.4,0],[1.4,5]])assert.equal(footsteps(3,0,'worker',z,b).calls.length,0);
 assert.match(script,/if\(!enemy\)drawMarchDust\(u,px,py,z,now\)/);
});
