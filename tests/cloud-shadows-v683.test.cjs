'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('function drawCloudShadows('),b=script.indexOf('\nfunction ',a+1);
assert.ok(a>0&&b>a,'world-anchored cloud shadow renderer');
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene({zoom=1,night=0,rain=0,now=150000,width=390,height=844}={}){
 const calls=[],state={};
 const ctx=new Proxy(state,{get(o,k){
  if(k==='createRadialGradient')return (...args)=>{
   calls.push([k,...args]);
   return {addColorStop:(...values)=>calls.push(['stop',...values])};
  };
  return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'finite Canvas coordinates');
   calls.push([k,...args]);
  };
 },set(o,k,v){o[k]=v;return true}});
 const point=(x,y)=>[width/2+(x-y)*37*zoom,height*.47+(x+y-160)*19*zoom];
 const draw=new Function('ctx','point','rnd','scale','TW','TH','w','h','W','H','lightLevels','dayClock',
  source+';return drawCloudShadows;')(ctx,point,rnd,zoom,74,38,width,height,160,160,()=>({night}),40);
 const painted=draw(now,rain);
 return {painted,calls};
}
test('v6.83 parses and preserves the existing save schema',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.units|game\.buildings/);
});
test('daylight paints deterministic world-space cloud shadows',()=>{
 const a=scene(),b=scene(),c=scene({now:350000});
 assert.ok(a.painted>0&&a.painted<=8);
 assert.deepEqual(a,b);
 assert.notDeepEqual(a.calls,c.calls);
 assert.equal(a.calls.filter(c=>c[0]==='createRadialGradient').length,a.painted);
});
test('night and distant zoom suppress expensive gradients',()=>{
 assert.equal(scene({night:.95}).painted,0);
 assert.equal(scene({zoom:.45}).painted,0);
 assert.equal(scene({night:.95}).calls.length,0);
});
test('rain reduces the darkness of cloud shadows',()=>{
 const alpha=s=>Number(s.calls.find(c=>c[0]==='stop'&&c[1]===0)[2].match(/rgba\([^,]+,[^,]+,[^,]+,([\d.]+)\)/)[1]);
 assert.ok(alpha(scene({rain:0}))>alpha(scene({rain:1})));
});
test('mobile and desktop enforce draw caps and balance Canvas state',()=>{
 for(const width of [390,1440]){
  const s=scene({width});
  assert.ok(s.painted<=(width<700?8:14));
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
  assert.equal(s.calls.filter(c=>c[0]==='clip').length,1);
 }
});
test('cloud shadows remain behind atmosphere, fog and weather',()=>{
 const cloudCall=script.indexOf('drawCloudShadows(frameTime,');
 const atmosphere=script.indexOf('drawAtmosphere();',cloudCall);
 const fog=script.indexOf('// Névoa sobre o mundo renderizado:',atmosphere);
 const weather=script.indexOf('drawAmbientParticles(frameTime);drawWeather(frameTime)',fog);
 assert.ok(cloudCall>0&&atmosphere>cloudCall&&fog>atmosphere&&weather>fog);
});
