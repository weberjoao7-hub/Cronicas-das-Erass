'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('function drawRoadConvoy('),b=script.indexOf('// Praça central',a);
assert.ok(a>0&&b>a,'renderizador de caravanas');
const source=script.slice(a,b);
function scene({era=4,ww=74,now=2000,season=1,rain=0}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','point','forestSeason','game','renderRainLevel',
  source+'return drawRoadConvoy;')(ctx,(x,y)=>[x*2,y*2],()=>season,{era},rain);
 const count=draw({x:82.5,y:83.5,dx:1,dy:0,index:0},ww,ww*.52,era,now);
 return {count,calls,styles};
}
test('script valido e salvamento cronicas-v04 intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval/);
});
test('raios das rodas giram ao longo do deslocamento',()=>{
 const a=scene({now:2000}),b=scene({now:2300});
 const spokes=x=>x.calls.filter(c=>c[0]==='lineTo').slice(-8);
 assert.notDeepEqual(spokes(a),spokes(b));
 assert.ok(a.styles.includes('#d8bd8d'));
});
test('efeitos no solo variam entre poeira, neve e chuva',()=>{
 assert.ok(scene().styles.includes('#c8ae82'));
 assert.ok(scene({season:3}).styles.includes('#e9f2ef'));
 assert.ok(scene({rain:.9}).styles.includes('#bdd8dd'));
 assert.ok(!scene({rain:.9}).styles.includes('#c8ae82'));
});
test('era industrial exibe rodas metalicas e escapamento',()=>{
 const old=scene({era:4}),modern=scene({era:7});
 assert.ok(modern.styles.includes('#84959a'));
 assert.ok(modern.styles.includes('#b4c0bc'));
 assert.ok(!old.styles.includes('#84959a'));
});
test('LOD reduz particulas e raios, preservando geometria basica',()=>{
 assert.equal(scene({ww:28}).count,0);
 assert.equal(scene({ww:28}).calls.length,0);
 assert.equal(scene({ww:40}).count,1);
 assert.ok(!scene({ww:40}).styles.includes('#c8ae82'));
 assert.ok(!scene({ww:40}).styles.includes('#d8bd8d'));
});
test('estado do Canvas equilibrado em todas as condicoes',()=>{
 for(const props of [{},{era:7},{season:3},{rain:.9},{ww:40}]){
  const {calls}=scene(props);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
