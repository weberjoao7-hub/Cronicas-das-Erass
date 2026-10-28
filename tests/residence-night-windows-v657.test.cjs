'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('function drawResidenceNightWindows('),b=script.indexOf('function drawAtmosphere(',a);
assert.ok(a>=0&&b>a,'renderizador noturno');
const source=script.slice(a,b);
const start=script.indexOf('function smoothstep('),end=script.indexOf('function drawAmbientParticles(',start);
const lightLevels=new Function(script.slice(start,end)+';return lightLevels;')();
function scene({era=4,phase=.82,zoom=1,visible=true,buildings=[{x:80,y:80,t:'Cabana'}],now=1200}={}){
 const calls=[],colors=[],state={};
 const ctx=new Proxy(state,{get(o,k){if(k in o)return o[k];return (...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'geometria finita: '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true}});
 const fn=new Function('ctx','game','scale','TW','TH','point','visibleAt','lightLevels','w','h',
  source+';return drawResidenceNightWindows;')(ctx,{era,buildings},zoom,74,38,
   (x,y)=>[200+(x-80)*3,140+(y-80)*2],()=>visible,lightLevels,400,320);
 return {count:fn(phase,now),calls,colors};
}
test('JavaScript compiles and original save key remains unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\\.getItem\\('cronicas-v04'\\)/);
 assert.match(script,/localStorage\\.setItem\\('cronicas-v04'/);
});
test('windows light at dusk and night, but never in daylight',()=>{
 assert.equal(scene({phase:.15}).count,0);
 assert.equal(scene({phase:.56}).count,1);
 assert.equal(scene({phase:.82}).count,1);
 assert.ok(scene({phase:.82}).calls.some(([m])=>m==='fill'));
});
test('geometry follows era and modern windows use cooler illumination',()=>{
 const early=scene({era:1}),middle=scene({era:4}),modern=scene({era:7});
 assert.equal(early.calls.filter(([m])=>m==='closePath').length,1);
 assert.equal(middle.calls.filter(([m])=>m==='closePath').length,2);
 assert.equal(modern.calls.filter(([m])=>m==='closePath').length,2);
 assert.ok(early.colors.some(s=>String(s).startsWith('rgba(255,201,116,')));
 assert.ok(modern.colors.some(s=>String(s).startsWith('rgba(185,233,255,')));
});
test('fog, construction sites and distant zoom suppress effects',()=>{
 assert.equal(scene({visible:false}).count,0);
 assert.equal(scene({zoom:.35}).count,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Cabana',buildLeft:12}]}).count,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Quartel'}]}).count,0);
});
test('effects are bounded, time-varying and canvas state balanced',()=>{
 const buildings=Array.from({length:70},(_,i)=>({x:80+i%5,y:80+Math.floor(i/5),t:'Cabana'}));
 const a=scene({buildings,now:1200}),b=scene({buildings,now:2700});
 assert.equal(a.count,36);
 assert.notDeepEqual(a.colors,b.colors);
 assert.equal(a.calls.filter(([m])=>m==='save').length,a.calls.filter(([m])=>m==='restore').length);
 assert.ok(a.calls.some(([m])=>m==='ellipse'),'luz projetada no piso');
});
test('lighting runs after atmosphere overlay and at dusk, not on top of fog',()=>{
 assert.match(script,/if\\(night<\\.01\\)\\{drawResidenceNightWindows\\(phase,Date\\.now\\(\\)\\);return;\\}/);
 assert.match(script,/ctx\\.restore\\(\\);\\s*drawResidenceNightWindows\\(phase,Date\\.now\\(\\)\\);/);
 assert.ok(script.indexOf('drawAtmosphere();')<script.indexOf('drawAmbientParticles(frameTime);drawWeather'));
});
