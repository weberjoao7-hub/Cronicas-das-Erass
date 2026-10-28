'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const source=script.slice(script.indexOf('function drawNightBeacons('),script.indexOf('// Transient arrow trails',script.indexOf('function drawNightBeacons(')));
assert.ok(source.startsWith('function drawNightBeacons('),'balizas presentes');
function scene({era=3,phase=.82,zoom=1,visible=true,now=1200,buildings=[{x:80,y:80,t:'Torre'},{x:81,y:80,t:'Pesqueiro'}]}={}){
 const ops=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),'coordenada finita');ops.push([k,...args])}},set(o,k,v){o[k]=v;ops.push(['set',k,v]);return true}});
 const lightSource=script.slice(script.indexOf('function smoothstep('),script.indexOf('function drawAmbientParticles('));
 const lightLevels=new Function(lightSource+';return lightLevels')();
 const fn=new Function('ctx','game','scale','TW','TH','point','visibleAt','lightLevels','w','h',source+';return drawNightBeacons')(
  ctx,{era,buildings},zoom,74,38,(x,y)=>[200+(x-80)*12,170+(y-80)*5],()=>visible,lightLevels,600,400);
 return {painted:fn(phase,now),ops};
}
test('v6.71: sintaxe e chave de salvamento preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.72<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('balizas de torres e pesqueiros aparecem apenas ao anoitecer',()=>{
 assert.equal(scene({phase:.15}).painted,0);
 assert.equal(scene({phase:.82}).painted,2);
 assert.ok(scene({phase:.82}).ops.some(x=>x[0]==='quadraticCurveTo'));
});
test('eras industriais usam luminárias frias em vez de chamas',()=>{
 const modern=scene({era:7}),historic=scene({era:3});
 assert.ok(modern.ops.some(x=>x[0]==='set'&&x[1]==='fillStyle'&&x[2]==='#d9f3fa'));
 assert.ok(!modern.ops.some(x=>x[0]==='quadraticCurveTo'));
 assert.ok(historic.ops.some(x=>x[0]==='quadraticCurveTo'));
});
test('nevoeiro, obras, zoom distante e fora de tela ocultam fontes',()=>{
 assert.equal(scene({visible:false}).painted,0);
 assert.equal(scene({zoom:.45}).painted,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Torre',buildLeft:8}]}).painted,0);
 assert.equal(scene({buildings:[{x:130,y:130,t:'Torre'}]}).painted,0);
 assert.equal(scene({buildings:[{x:80,y:80,t:'Cabana'}]}).painted,0);
});
test('limite de 24, animação determinística e estado do Canvas balanceado',()=>{
 const buildings=Array.from({length:70},(_,i)=>({x:80+i%5,y:80+Math.floor(i/5),t:'Torre'}));
 const a=scene({buildings}),b=scene({buildings}),c=scene({buildings,now:2700});
 assert.equal(a.painted,24);
 assert.deepEqual(a.ops,b.ops);
 assert.notDeepEqual(a.ops,c.ops);
 assert.equal(a.ops.filter(x=>x[0]==='save').length,a.ops.filter(x=>x[0]==='restore').length);
});
test('brilho descarta edifícios invisíveis e inclui torres e píeres',()=>{
 const a=script.slice(script.indexOf('function drawAtmosphere('),script.indexOf('function drawNightBeacons('));
 assert.match(a,/!visibleAt\(b\.x\+\.5,b\.y\+\.5\)/);
 assert.match(a,/\['Aldeia','Quartel','Cabana','Torre','Pesqueiro'\]/);
 assert.match(a,/drawNightBeacons\(phase,Date\.now\(\)\)/);
 assert.ok(script.indexOf('drawAtmosphere();')<script.indexOf('drawAmbientParticles(frameTime);drawWeather'));
});
