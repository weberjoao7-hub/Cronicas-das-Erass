'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawMountain(');
const end=script.indexOf('// v6.130: microclima',start);
assert.ok(start>=0&&end>start,'renderizador de montanhas');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function render(ww=94,season=1,clock=0,x=60,y=20){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito: '+k);
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','biome','rnd','forestSeason','dayClock',source+'return drawMountain')(ctx,()=>5,rnd,()=>season,clock);
 draw(200,180,ww,ww*38/74,x,y);
 return {calls,styles};
}
test('sintaxe do jogo e salvamento preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(source,/drawMountainOreSeams\(px,py,ww,hh,x,y,peakX,peakY/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random/);
});
test('veios aparecem em faces selecionadas, sem alterar outros ladrilhos',()=>{
 const rich=render(94,1,0,60,20),empty=render(94,1,0,42,32);
 assert.ok(rich.styles.includes('#c6a77b')||rich.styles.includes('#93b7ae')||rich.styles.includes('#b6c3c8'));
 assert.ok(!empty.styles.includes('#c6a77b')&&!empty.styles.includes('#93b7ae')&&!empty.styles.includes('#b6c3c8'));
});
test('geometria deterministica e Canvas balanceado',()=>{
 const a=render(),b=render();
 assert.deepEqual(a,b);
 assert.equal(a.calls.filter(v=>v[0]==='save').length,a.calls.filter(v=>v[0]==='restore').length);
 assert.ok(a.calls.length<400,'custo limitado por montanha');
});
test('LOD reduz o numero de detalhes no Safari',()=>{
 const far=render(38),mid=render(65),near=render(94);
 assert.ok(far.calls.length<mid.calls.length);
 assert.ok(mid.calls.length<near.calls.length);
});
test('neve recobre os cristais e brilho evolui sem alterar geometria',()=>{
 const summer=render(94,1,0),winter=render(94,3,0);
 assert.ok(winter.styles.includes('#e5ede7'));
 assert.ok(winter.calls.filter(c=>c[0]==='fill').length>summer.calls.filter(c=>c[0]==='fill').length);
 const a=render(94,1,0),b=render(94,1,2);
 assert.notDeepEqual(a,b);
});
