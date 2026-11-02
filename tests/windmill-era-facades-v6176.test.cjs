'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script);
const a=script.indexOf('function drawWindmill('),b=script.indexOf('// Defensive stone watchtower',a);
const source=script.slice(a,b);
const s=script.indexOf('function drawWindmillBladeShadow('),e=script.indexOf('// v6.116:',s);
const shadowSource=script.slice(s,e);
function scene(era=4,ww=80,level=2,now=1400){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+k);
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','scale','game',source+'return drawWindmill')(ctx,1,{era});
 draw(120,150,ww,ww/2,level,now);
 return {calls,styles};
}
test('v6.176: script compila e salvamento anterior permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04'"));
 assert.ok(html.includes('Crônicas das Eras v6.176'));
});
test('fachadas distinguem madeira, pedra, tijolo e metal',()=>{
 for(const [era,color] of [[0,'#785738'],[3,'#d3c09a'],[5,'#9c7161'],[7,'#829ba5']])
  assert.ok(scene(era).styles.includes(color),'material da era '+era);
});
test('rotor moderno tem seis pás e eras anteriores têm quatro',()=>{
 for(let era=0;era<8;era++)
  assert.equal(scene(era).calls.filter(c=>c[0]==='rotate').length,era===7?7:5);
});
test('sombras acompanham a quantidade de pás',()=>{
 for(const era of [0,4,7]){
  const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>calls.push([k,...args]);},set(o,k,v){o[k]=v;return true}});
  const draw=new Function('ctx','lightLevels','dayClock','game',shadowSource+'return drawWindmillBladeShadow')(ctx,()=>({night:0,dusk:0}),0,{era});
  assert.equal(draw(120,150,80,40,1400),era===7?6:4);
  assert.equal(calls.filter(c=>c[0]==='fill').length,era===7?7:5);
 }
});
test('LOD reduz operações e estados Canvas permanecem equilibrados',()=>{
 for(const era of [0,3,5,7]){
  const far=scene(era,22),near=scene(era,90);
  assert.ok(near.calls.length>far.calls.length);
  assert.equal(near.calls.filter(c=>c[0]==='save').length,near.calls.filter(c=>c[0]==='restore').length);
 }
});
test('quadros determinísticos e integração sem modificar o salvamento',()=>{
 assert.deepEqual(scene(7,80,2,1500).calls,scene(7,80,2,1500).calls);
 assert.notDeepEqual(scene(7,80,2,1500).calls,scene(7,80,2,3300).calls);
 assert.ok(script.includes('drawWindmillEraFacades(px,py,ww,hh,era,lv,now)'));
 assert.ok(script.includes('drawWindmill(px,py,ww,hh,obj.level,frameTime)'));
 assert.ok(script.includes('drawWindmillBladeShadow(px,py,ww,hh,frameTime)'));
});
