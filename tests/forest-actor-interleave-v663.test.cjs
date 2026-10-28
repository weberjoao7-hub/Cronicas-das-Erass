'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=html.indexOf('function drawForestGrove(');
const end=html.indexOf('// Decorative landmarks',start);
const forest=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function grove(){
 const calls=[],methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','fillRect','arc']);
 const ctx=new Proxy({}, {get:(o,k)=>methods.has(k)?()=>{}:o[k],set:(o,k,v)=>(o[k]=v,true)});
 const stamp=kind=>(x,y,s,seed)=>calls.push({kind,x,y,s,seed});
 const draw=new Function('ctx','scale','rnd','biome','oak','tree','drawBirch',forest+';return drawForestGrove')(
  ctx,1,rnd,()=>3,stamp('oak'),stamp('pine'),stamp('birch'));
 return {draw,calls};
}
test('v6.63 preserva sintaxe e chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
});
test('intervalos de profundidade desenham cada árvore exatamente uma vez',()=>{
 const whole=grove(),split=grove(),args=[200,160,72,36,23,31,.9,1800];
 whole.draw(...args);
 split.draw(...args,'range',-Infinity,157);
 split.draw(...args,'range',157,164);
 split.draw(...args,'front',164);
 assert.deepEqual(split.calls,whole.calls);
 assert.ok(split.calls.length>=2);
});
test('bosque ocupado intercala copas e atores individualmente',()=>{
 const a=html.indexOf('function drawForestOccupiedTile('),b=html.indexOf('function draw(){',a);
 assert.ok(a>0&&b>a);
 const events=[],actors=[
  {u:{x:1,y:1},enemy:false},
  {u:{x:2,y:2},enemy:true},
  {u:{x:3,y:3},enemy:false}
 ];
 const fn=new Function('tileActors','point','drawForestGrove','drawTileOccupants',html.slice(a,b)+';return drawForestOccupiedTile')(
  ()=>actors,(x,y)=>[0,x+y],
  (...args)=>events.push({type:'tree',layer:args[8],lower:args[9],upper:args[10]}),
  (...args)=>events.push({type:'unit',unit:args[6][0]})
 );
 fn(23,31,200,160,72,36,.9,new Map(),new Map(),1,1800);
 assert.deepEqual(events.map(e=>e.type),['tree','unit','tree','unit','tree','unit','tree']);
 assert.deepEqual(events.filter(e=>e.type==='tree').map(e=>[e.layer,e.lower,e.upper]),[
  ['range',-Infinity,2],['range',2,4],['range',4,6],['front',6,undefined]
 ]);
 assert.deepEqual(events.filter(e=>e.type==='unit').map(e=>e.unit),actors);
});
test('o bosque distante preserva o LOD e o caminho sem ocupantes',()=>{
 const scene=grove();scene.draw(200,160,12,6,23,31,.9,1800,'range',-Infinity,Infinity);
 assert.equal(scene.calls.length,0);
 assert.match(html,/else drawForestGrove\(px,py,ww,hh,x,y,q\);/);
 assert.match(html,/if\(forestCount\)drawForestOccupiedTile\(/);
 assert.match(html,/else drawTileOccupants\(x,y,unitTiles,enemyTiles,z,frameTime\);/);
});
