'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script);
const start=script.indexOf('// v6.132: rastros de passos');
const end=script.indexOf('function drawUnitGroundShadow(',start);
assert.ok(start>=0&&end>start);
const source=script.slice(start,end);
function scene(){
 const calls=[],ctx=new Proxy({},{
  get(obj,key){return key in obj?obj[key]:(...args)=>{
   for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'Canvas finito');
   calls.push([key,...args]);
  }},
  set(obj,key,val){obj[key]=val;return true}
 });
 const api=new Function('ctx','point',source+';return {appendGroundTrack,drawGroundTracksTile,groundTrackMaterial};')(ctx,(x,y)=>[(x-y)*34,(x+y)*17]);
 return {calls,...api};
}
function make(kind='worker',material='snow'){
 const {appendGroundTrack:step}=scene();
 let s=step(null,{x:3,y:4,kind},1000,material);
 return step(s,{x:3.4,y:4,kind},1200,material).marks[0];
}
test('v6.175: sintaxe valida e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.setItem('cronicas-v04'"));
 assert.ok(!source.includes('localStorage')&&!source.includes('Math.random'));
});
test('infantaria alterna botas sem modificar as coordenadas reais',()=>{
 const {appendGroundTrack:step}=scene();
 let s=step(null,{x:3,y:4,kind:'worker'},1000,'snow');
 for(let i=1;i<=4;i++)s=step(s,{x:3+i*.35,y:4,kind:'worker'},1000+i*150,'snow');
 assert.deepEqual(s.marks.map(m=>m.footSide),[1,-1,1,-1]);
 assert.ok(s.marks.every(m=>m.unitKind==='foot'));
});
test('classes de unidade geram marcas distintas',()=>{
 assert.equal(make('worker').unitKind,'foot');
 assert.equal(make('warrior').unitKind,'foot');
 assert.equal(make('archer').unitKind,'foot');
 assert.equal(make('cavalry').unitKind,'cavalry');
 assert.equal(make('cannon').unitKind,'cannon');
});
test('Canvas desenha botas, ferraduras e rodas com estados equilibrados',()=>{
 for(const kind of ['worker','cavalry','cannon']){
  const {calls,drawGroundTracksTile:draw}=scene();
  assert.equal(draw([make(kind)],1.2,1500),kind==='worker'?1:2);
  assert.equal(calls.filter(c=>c[0]==='stroke').length,kind==='worker'?0:2);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
 }
});
test('zoom, expiracao e marcas antigas preservados',()=>{
 const {calls,drawGroundTracksTile:draw}=scene();
 const legacy={x:4,y:5,at:1000,angle:0,kind:'snow'};
 assert.equal(draw([legacy],.6,2000),0);
 assert.equal(calls.length,0);
 assert.equal(draw([legacy],1,2000),2);
 assert.equal(draw([legacy],1,20000),0);
 assert.equal(draw([make('cannon','mud')],1,20000),0);
});
test('historico limitado, nevoa de guerra e integracao no render',()=>{
 const {appendGroundTrack:step}=scene();
 let s=step(null,{x:2,y:2,kind:'cavalry'},1000,'mud');
 for(let i=1;i<=30;i++)s=step(s,{x:2+i*.31,y:2,kind:'cavalry'},1000+i*120,'mud');
 assert.equal(s.marks.length,10);
 assert.ok(source.includes('!visibleFog[y*W+x]'));
 assert.ok(script.includes('recordGroundTracks(Date.now())'));
 assert.ok(script.includes('drawGroundTracksTile(groundTrackTiles.get'));
});
