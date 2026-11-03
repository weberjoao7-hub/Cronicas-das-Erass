const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('meadow flower renderer is defined and called inside visible ground layer',()=>{
 assert.match(script,/function drawMeadowFlowers\(/);
 assert.match(script,/visibleFog\[y\*W\+x\].*drawMeadowFlowers\(/);
});
test('flowers are deterministic and skip distant zoom, snow and non-meadow biomes',()=>{
 assert.match(script,/\(b!==1&&b!==2\)\|\|ww<46\|\|season===3/);
 assert.match(script,/rnd\(x,y,781\)/);
 assert.match(script,/ww>=85\?5:ww>=62\?3:2/);
});
test('canvas state is restored and flowers stay inside tile diamond',()=>{
 const body=script.slice(script.indexOf('function drawMeadowFlowers('),script.indexOf('function draw(){'));
 assert.match(body,/ctx\.save\(\)/);
 assert.match(body,/ctx\.restore\(\)/);
 assert.match(body,/Math\.abs\(ox\)/);
});
