'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal disponível');
const start=script.indexOf('function canvasResolutionDecision(');
const end=script.indexOf('let resolutionSlowSamples=',start);
assert.ok(start>=0&&end>start,'controlador isolável');
const source=script.slice(start,end);
const decide=new Function(source+';return canvasResolutionDecision')();

test('resolução adaptativa: JavaScript válido e save anterior preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|requestAnimationFrame|Math\.random/);
});
test('Retina começa com resolução nativa limitada e usa o fator só no backing store',()=>{
 assert.match(script,/let renderResolutionScale=1;/);
 assert.match(script,/dpr=Math\.min\(devicePixelRatio\|\|1,2,Math\.sqrt\(maxPixels\/\(w\*h\)\)\)/);
 assert.match(script,/typeof renderResolutionScale==='number'\?renderResolutionScale:1/);
 assert.match(script,/const maxPixels=mobileViewport\?2600000:6000000;/);
 assert.match(script,/if\(C\.width!==bw\)C\.width=bw;/);
 assert.match(script,/if\(C\.height!==bh\)C\.height=bh;/);
});
test('duas amostras lentas reduzem DPR no iPhone sem afetar zoom',()=>{
 assert.deepEqual(decide(1,34,true,1,0,5000),{quality:.9,slow:0,fast:0,changed:true});
 assert.deepEqual(decide(.9,34,true,0,0,5000),{quality:.9,slow:1,fast:0,changed:false});
 assert.deepEqual(decide(.9,26,true,1,0,5000),{quality:.9,slow:0,fast:0,changed:false});
});
test('quatro amostras rápidas restauram gradualmente a nitidez',()=>{
 assert.deepEqual(decide(.9,8,true,0,3,5000),{quality:.98,slow:0,fast:0,changed:true});
 assert.deepEqual(decide(.98,8,true,0,3,5000),{quality:1,slow:0,fast:0,changed:true});
 assert.deepEqual(decide(1,8,true,0,3,5000),{quality:1,slow:0,fast:4,changed:false});
});
test('histerese e limites impedem oscilações de resolução',()=>{
 assert.deepEqual(decide(1,40,true,1,0,2000),{quality:1,slow:2,fast:0,changed:false});
 assert.deepEqual(decide(.65,40,true,1,0,5000),{quality:.65,slow:2,fast:0,changed:false});
 assert.deepEqual(decide(.9,20,true,2,3,5000),{quality:.9,slow:0,fast:0,changed:false});
});
test('desktop tem limites próprios; valores inválidos não alteram qualidade',()=>{
 assert.equal(decide(1,26,false,1,0,5000).quality,.9);
 assert.equal(decide(1,20,false,1,0,5000).quality,1);
 assert.equal(decide(.8,NaN,false,1,1,5000).quality,.8);
 assert.equal(decide(.8,-1,false,1,1,5000).changed,false);
 assert.equal(decide(Infinity,40,true,1,0,5000).quality,.9);
});
test('cadência integra o controlador sem modificar simulação ou salvamento',()=>{
 assert.match(script,/adjustCanvasResolution\(average,performance\.now\(\)\);/);
 assert.match(script,/renderResolutionScale=next\.quality;resolutionLastChange=now;/);
 assert.match(script,/resize\(\);dirty=true;/);
 assert.match(script,/if\(\+\+renderSamples<24\)return frameInterval;/);
 assert.match(script,/function gameFrame\(t\)/);
});
