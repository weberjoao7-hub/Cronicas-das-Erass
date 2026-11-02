'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('function drawBoatWake('),b=script.indexOf('// Sites grow',a);
assert.ok(a>=0&&b>a);
const source=script.slice(a,b);
function scene(era=4,width=80,now=1500,moving=true){
 const calls=[],styles=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+k);
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}});
 const fn=new Function('ctx','game','scale','TW','TH','drawFishingNet',source+'return drawFishingBoat;')(ctx,{era},1,32,16,()=>{});
 fn({heading:{x:1,y:0},state:moving?'outbound':'ready',x:8,y:9,cargo:0},0,0,width,width*.5,now);
 return {calls,styles};
}
test('JavaScript compiles and legacy save format stays unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04'"));
 assert.ok(script.includes("localStorage.setItem('cronicas-v04'"));
});
test('primitive canoe, medieval sail and industrial cabin use distinct materials',()=>{
 assert.ok(scene(1).styles.includes('#b5a17b'));
 assert.ok(scene(4).styles.includes('#e1d5b7'));
 assert.ok(scene(7).styles.includes('#2e4853'));
});
test('hull has planking and contrasting bow caps',()=>{
 assert.ok(scene(1).styles.includes('#a98458'));
 assert.ok(scene(4).styles.includes('#c4a076'));
 assert.ok(scene(7).styles.includes('#c1d0c9'));
});
test('mobile LOD avoids detailed hull and sails at distant zoom',()=>{
 assert.ok(scene(4,80).calls.length>scene(4,29).calls.length);
 assert.ok(!scene(4,29).styles.includes('#e1d5b7'));
});
test('animated sail and engine exhaust respond to time and movement',()=>{
 assert.notDeepEqual(scene(4,80,1200).calls,scene(4,80,2800).calls);
 assert.ok(scene(7,80,1200,true).calls.length>scene(7,80,1200,false).calls.length);
});
test('Canvas state balanced and coordinates finite across eight eras and zooms',()=>{
 for(let era=0;era<8;era++)for(const width of [19,29,36,42,68,80,150]){
  const {calls}=scene(era,width);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
 assert.deepEqual(scene(5,80,1500),scene(5,80,1500));
 assert.ok(!source.includes('localStorage'));
});
