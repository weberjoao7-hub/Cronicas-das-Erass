'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
const from=script.indexOf('function drawTribalBarracks('),to=script.indexOf('function smoke(',from);
assert.ok(from>=0&&to>from);const art=script.slice(from,to);
function render(era,ww=74,now=1500){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>calls.push([k,args,o.fillStyle,o.strokeStyle]);},
  set(o,k,v){o[k]=v;return true}
 });
 const draw=new Function('ctx','scale',art+';return drawBarracks;')(ctx,ww/74);
 draw(200,180,ww,ww*38/74,era,now);return calls;
}
test('script remains valid',()=>assert.doesNotThrow(()=>new Function(script)));
test('wooden palisade and training yard appear in Primordial',()=>{
 const ops=render(0);assert.ok(ops.filter(o=>o[0]==='fillRect').length>=7);
 assert.ok(ops.some(o=>o[0]==='ellipse'));assert.ok(ops.some(o=>o[0]==='quadraticCurveTo'));
});
test('Tribal timber gateway adds geometry',()=>assert.ok(render(1).length>render(0).length));
test('Ancient barracks retain stone towers and arched gate',()=>{
 const ops=render(2);assert.ok(ops.filter(o=>o[0]==='fillRect').length>=8);
 assert.ok(ops.some(o=>o[0]==='quadraticCurveTo'));
});
test('Medieval roofs and Industrial lanterns add era-specific detail',()=>{
 const ancient=render(2),medieval=render(4),industrial=render(6);
 assert.ok(medieval.length>ancient.length);
 assert.ok(industrial.length>ancient.length);
 // Telhas medievais usam mais fiadas; rebites industriais usam arcos.
 assert.ok(industrial.filter(o=>o[0]==='arc').length>medieval.filter(o=>o[0]==='arc').length);
 assert.ok(industrial.some(o=>o[0]==='strokeRect'));
});
test('distant zoom removes fine details',()=>{
 assert.ok(render(4,20).length<render(4,74).length);
 assert.ok(render(0,20).length<render(0,74).length);
});
test('banners deterministic at fixed time and animate over time',()=>{
 assert.deepEqual(render(4,74,1500),render(4,74,1500));
 assert.notDeepEqual(render(4,74,1500),render(4,74,3700));
});
test('era and frame clock are passed by render loop, save unchanged',()=>{
 assert.match(script,/drawBarracks\(px,py,ww,hh,game\.era,frameTime\)/);
 assert.match(script,/cronicas-v04/);
});
