'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const a=script.indexOf('function resize(){'),b=script.indexOf("addEventListener('resize',resize);",a);
assert.ok(a>=0&&b>a,'Safari resize handler');
const code=script.slice(a,b);
function resized(cssWidth,cssHeight,innerWidth=420,innerHeight=800,pixelRatio=3){
 const C={width:0,height:0,getBoundingClientRect(){return {width:cssWidth,height:cssHeight}}};
 const run=new Function('C','innerWidth','innerHeight','devicePixelRatio',
  'let w=0,h=0,dpr=1,dirty=false;'+code+';resize();return {w,h,dpr,dirty,bw:C.width,bh:C.height};');
 return run(C,innerWidth,innerHeight,pixelRatio);
}
test('browser script parses after viewport fix',()=>assert.doesNotThrow(()=>new Function(script)));
test('Safari uses the visible canvas box rather than stale innerHeight',()=>{
 assert.deepEqual(resized(390,634),{w:390,h:634,dpr:2,dirty:true,bw:780,bh:1268});
});
test('resize gracefully falls back to window dimensions for zero-size canvas',()=>{
 assert.deepEqual(resized(0,0,375,700,1),{w:375,h:700,dpr:1,dirty:true,bw:375,bh:700});
});
test('Safari toolbar changes trigger resize and save data remains unchanged',()=>{
 assert.match(script,/visualViewport\.addEventListener\('resize',resize\)/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
