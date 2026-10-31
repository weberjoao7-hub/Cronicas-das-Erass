'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const a=script.indexOf('function drawMarketCanopyDetails(');
const b=script.indexOf('function drawVillageLife(',a);
assert.ok(a>0&&b>a,'helper de toldos isolavel');
const source=script.slice(a,b);
function scene({ww=90,era=4,now=22000,season=1,index=0}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas com coordenadas finitas');
   calls.push([k,...args]);
  };},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const draw=new Function('ctx',source+'return drawMarketCanopyDetails;')(ctx);
 return {count:draw(210,180,ww,ww*.52,era,now,season,index),calls,styles};
}
test('script principal compila e save antigo permanece preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('toldos sao restritos a mercados construidos e zoom proximo',()=>{
 assert.equal(scene({era:0}).count,0);
 assert.equal(scene({ww:55}).count,0);
 assert.equal(scene({ww:68}).count,1);
 assert.equal(scene({ww:90}).count,1);
 assert.equal(scene({ww:55}).calls.length,0);
});
test('costuras, abas de tecido e pendao variam entre eras',()=>{
 const early=scene({era:2}),medieval=scene({era:4}),industrial=scene({era:7});
 assert.ok(early.styles.includes('#d7b18c'));
 assert.ok(medieval.styles.includes('#e7c18b'));
 assert.ok(industrial.styles.includes('#d6e1d7'));
 assert.ok(medieval.calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.notDeepEqual(medieval.styles,industrial.styles);
});
test('vento anima tecido e inverno acumula neve nas costuras',()=>{
 assert.notDeepEqual(scene({now:1000}).calls,scene({now:2600}).calls);
 assert.deepEqual(scene({now:1000}).calls,scene({now:1000}).calls);
 assert.ok(scene({season:3}).styles.includes('#eaf1e9'));
 assert.ok(!scene({season:1}).styles.includes('#eaf1e9'));
});
test('Canvas balanceado e sem coordenadas invalidas em eras e escalas',()=>{
 for(const ww of [30,68,75,90,140])for(const era of [0,2,4,7])for(const season of [0,1,3]){
  const {calls}=scene({ww,era,season});
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('mercado integra toldos antes dos moradores e preserva nevoa e LOD',()=>{
 const life=script.slice(b,script.indexOf('function drawTerritoryEdge(',b));
 assert.match(life,/drawMarketCanopyDetails\(px,py,ww,hh,era,now,season,i\)/);
 assert.ok(life.indexOf('drawMarketCanopyDetails(')<life.indexOf("if(layer!=='front'||!visible)"));
 assert.match(life,/if\(ww<42\)return 0/);
});
