'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawGroundLightPool(');
const end=script.indexOf('function drawRoadLantern(',start);
assert.ok(start>=0&&end>start,'funcao isolavel');
const source=script.slice(start,end);
function scene({kind='fire',era=2,season=1,rain=0,phase=.5,ww=74,hh=38}={}){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k);calls.push([k,...args])}},
 set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const lightLevels=p=>({night:p>.3&&p<.7?1:0,dusk:p>.7?.5:0});
 const pool=new Function('ctx','lightLevels','dayClock',source+'return drawGroundLightPool;')(ctx,lightLevels,50);
 return {painted:pool(120,180,ww,hh,kind,era,season,rain,1200,phase),calls,styles};
}
test('v6.184: sintaxe, titulo e salvamento preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.184<\/title>/);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('luz somente a noite e em zoom suficiente',()=>{
 assert.equal(scene({phase:.5}).painted,1);
 assert.equal(scene({phase:.1}).painted,0);
 assert.equal(scene({ww:30}).painted,0);
 assert.equal(scene({ww:74,hh:-1}).painted,0);
});
test('lampadas industriais frias e fogueiras quentes',()=>{
 assert.ok(scene({kind:'lantern',era:7}).styles.includes('#9bd9f1'));
 assert.ok(scene({kind:'fire',era:7}).styles.includes('#ffc278'));
 assert.ok(scene({kind:'lantern',era:4}).styles.includes('#ffc278'));
});
test('reflexos de chuva e neve condicionais',()=>{
 assert.equal(scene({rain:.8}).calls.filter(c=>c[0]==='stroke').length,3);
 assert.equal(scene({rain:0}).calls.filter(c=>c[0]==='stroke').length,0);
 assert.equal(scene({season:3,rain:.8}).calls.filter(c=>c[0]==='stroke').length,0);
 assert.equal(scene({season:3}).calls.filter(c=>c[0]==='fill').length,5);
});
test('Canvas equilibrado e geometria finita em 96 cenarios',()=>{
 for(let era=0;era<8;era++)for(let season=0;season<4;season++)for(const rain of [0,.5,1]){
  const {calls,painted}=scene({kind:era>=4?'lantern':'fire',era,season,rain});
  assert.equal(painted,1);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
  assert.ok(calls.filter(c=>c[0]==='ellipse').length>=3);
 }
});
test('integracao no mapa, lampadas e centros civicos',()=>{
 const lantern=script.slice(script.indexOf('function drawRoadLantern('),script.indexOf('function drawRoadJunction('));
 assert.match(lantern,/drawGroundLightPool\(px,py,ww,hh,'lantern'/);
 const draw=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(draw,/obj\.t==='Aldeia'\|\|obj\.t==='Quartel'/);
 assert.match(draw,/drawGroundLightPool\(px,py,ww,hh,'fire'/);
});
