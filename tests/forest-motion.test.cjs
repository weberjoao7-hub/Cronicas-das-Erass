'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const art=html.slice(html.indexOf('function tree('),html.indexOf('// Decorative landmarks'));
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(zoom=1){
 const calls=[],methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','quadraticCurveTo','fillRect','arc']);
 const ctx=new Proxy({}, {get:(o,k)=>methods.has(k)?(...a)=>calls.push([k,...a]):o[k],set:(o,k,v)=>(o[k]=v,true)});
 const api=new Function('ctx','scale','rnd','biome',art+';return {canopySway,tree,oak,drawBirch,drawForestGrove};')(ctx,zoom,rnd,()=>3);
 return {api,calls};
}
test('script v6.15 preserva sintaxe e salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(html.includes('cronicas-v04'));
 assert.match(script,/function drawForestGrove\(/);
});
test('vento determinístico varia com o tempo e cessa no zoom distante',()=>{
 const {api}=scene();
 assert.equal(api.canopySway(7,22,1200,.6),0);
 assert.equal(api.canopySway(7,6,1200,1),0);
 assert.equal(api.canopySway(7,22,1200,1),api.canopySway(7,22,1200,1));
 assert.notEqual(api.canopySway(7,22,1200,1),api.canopySway(7,22,2700,1));
});
test('copas de carvalho e bétula oscilam sem mover as sombras de contato',()=>{
 for(const method of ['oak','drawBirch']){
  const s=scene();
  s.api[method](200,160,22,5,100);
  const first=s.calls.filter(c=>c[0]==='ellipse');
  s.calls.length=0;
  s.api[method](200,160,22,5,1600);
  const second=s.calls.filter(c=>c[0]==='ellipse');
  assert.deepEqual(first[0],second[0],method+' deve manter sombra estática');
  assert.notDeepEqual(first.slice(1),second.slice(1),method+' deve mover a copa');
 }
});
test('bosque desenha três espécies, folhas e cogumelos com LOD',()=>{
 const close=scene(),far=scene(.55);
 close.api.drawForestGrove(200,160,74,38,25,30,.95,1200);
 far.api.drawForestGrove(200,160,24,12,25,30,.95,1200);
 assert.ok(close.calls.length>far.calls.length*2);
 assert.ok(close.calls.some(c=>c[0]==='fillRect'));
 assert.ok(close.calls.filter(c=>c[0]==='ellipse').length>far.calls.filter(c=>c[0]==='ellipse').length);
});
