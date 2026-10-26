'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script,'script principal presente');
const start=html.indexOf('function drawHighlandGround('),end=html.indexOf('function house(',start);
assert.ok(start>=0&&end>start,'função de relevo isolável');
const art=html.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function renderer(){
 const calls=[];
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath']);
 const ctx=new Proxy({},{
  get:(obj,key)=>methods.has(key)?(...args)=>calls.push([key,...args]):obj[key],
  set:(obj,key,val)=>(obj[key]=val,true)
 });
 const draw=new Function('ctx','rnd','scale',art+';return drawHighlandGround')(ctx,rnd,1);
 return {calls,draw};
}
test('JavaScript principal e salvamento legado permanecem válidos',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(html.includes('cronicas-v04'));
});
test('colinas e sopés renderizam geometria determinística',()=>{
 const a=renderer(),b=renderer();
 for(let x=40;x<46;x++){a.draw(200,140,74,38,x,34,4);b.draw(200,140,74,38,x,34,4)}
 assert.deepEqual(a.calls,b.calls);
 assert.ok(a.calls.filter(c=>c[0]==='fill').length>100);
 const alpine=renderer();alpine.draw(200,140,74,38,41,34,5);
 assert.ok(alpine.calls.some(c=>c[0]==='ellipse'));
});
test('LOD reduz geometria e impede decoração em terrenos ocupados',()=>{
 const near=renderer(),mid=renderer(),far=renderer(),occupied=renderer();
 near.draw(200,140,74,38,43,30,4);
 mid.draw(200,140,40,20,43,30,4);
 far.draw(200,140,15,8,43,30,4);
 occupied.draw(200,140,74,38,43,30,4,true);
 assert.ok(near.calls.length>mid.calls.length);
 assert.ok(mid.calls.length>far.calls.length);
 assert.equal(far.calls.length,0);
 assert.equal(occupied.calls.length,0);
});
test('renderização integrada respeita estradas, estruturas, ruínas e névoa',()=>{
 assert.match(html,/if\(b===4&&!ruinKind\)drawHighlandGround\(/);
 assert.match(html,/drawMountain\(px,py,ww,hh,x,y\);drawHighlandGround\(/);
 assert.match(html,/structures\.has\(key\(x,y\)\)\|\|roadTiles\.has\(key\(x,y\)\)/);
 assert.match(html,/if\(!exploredFog\[y\*W\+x\]\)continue/);
});
