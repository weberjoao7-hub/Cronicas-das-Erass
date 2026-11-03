'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.205: leques de detritos rochosos');
const end=script.indexOf('// v6.146: rochas estratificadas',start);
assert.ok(start>=0&&end>start,'renderizador isolavel');
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(ww=80,season=1){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'geometria Canvas finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawMountainTalus')(ctx,rnd);
 const count=draw(200,180,ww,ww*.5,12,9,200,120,200-ww*.49,200+ww*.49,192,season);
 return {draw,count,calls,styles};
}
test('v6.205: sintaxe JavaScript e salvamentos anteriores preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame|routeFor\(|game\./);
});
test('LOD limita o numero de leques rochosos e custo no Safari',()=>{
 const far=scene(40),medium=scene(62),near=scene(80),close=scene(100);
 assert.deepEqual([far.count,medium.count,near.count,close.count],[0,3,5,7]);
 assert.equal(far.calls.length,0);
 assert.ok(medium.calls.length<near.calls.length&&near.calls.length<close.calls.length);
 assert.ok(close.calls.length<300,'limite de operacoes por terreno');
});
test('faces tridimensionais, sombras e recorte Canvas balanceado',()=>{
 const a=scene(80);
 assert.equal(a.calls[0][0],'save');
 assert.equal(a.calls.at(-1)[0],'restore');
 assert.ok(a.calls.some(c=>c[0]==='clip'));
 assert.ok(a.calls.some(c=>c[0]==='ellipse'));
 assert.ok(a.styles.includes('#929f9d')&&a.styles.includes('#52666b'));
});
test('inverno adiciona neve e outono usa paleta mineral distinta',()=>{
 const summer=scene(80,1),autumn=scene(80,2),winter=scene(80,3);
 assert.ok(summer.styles.includes('#929f9d'));
 assert.ok(autumn.styles.includes('#a99a80')&&autumn.styles.includes('#665f56'));
 assert.ok(winter.styles.includes('#eef2e9c9')&&winter.styles.includes('#617c88'));
 assert.ok(!summer.styles.includes('#eef2e9c9'));
});
test('padrao e deterministico e nao depende do relogio',()=>{
 const a=scene(100),b=scene(100);
 assert.deepEqual(a.calls,b.calls);
 assert.deepEqual(a.styles,b.styles);
});
test('entradas invalidas nao desenham nem modificam Canvas',()=>{
 const a=scene(80);
 const before=a.calls.length;
 assert.equal(a.draw(NaN,180,80,40,12,9,200,120,160,240,192,1),0);
 assert.equal(a.draw(200,180,80,0,12,9,200,120,160,240,192,1),0);
 assert.equal(a.calls.length,before);
});
test('integracao ocorre dentro da montanha, antes dos estratos e sem alterar terreno',()=>{
 const mountain=script.indexOf('function drawMountain(');
 const talus=script.indexOf('drawMountainTalus(px,py,ww,hh,x,y,peakX,peakY,left,right,base,',mountain);
 const strata=script.indexOf('drawMountainRockStrata(px,py,ww,hh,x,y,peakX,peakY',mountain);
 assert.ok(mountain>=0&&talus>mountain&&strata>talus);
 assert.match(html,/<title>Crônicas das Eras v6\.205<\/title>/);
});
