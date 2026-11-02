'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawFarmGranaryEraDetails('),end=script.indexOf('// Animais de criação',start);
assert.ok(start>0&&end>start);
const source=script.slice(start,end);
function scene(era=3,ww=82,season=1){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),k);calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const fn=new Function('ctx',source+'return drawFarmGranaryEraDetails;')(ctx);
 const count=fn(120,140,ww,ww*.5,era,2,season,1400,8,11);
 return {count,calls,styles};
}
test('v6.180: JavaScript compila e save antigo permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=180);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random|game\./);
});
test('quatro estilos de granario usam materiais historicos diferentes',()=>{
 for(const [era,color] of [[0,'#735035'],[3,'#b7764e'],[5,'#798d8d'],[7,'#a7b7b4']])
  assert.ok(scene(era).styles.includes(color),'material era '+era);
});
test('distancia reduz o detalhamento e zoom distante omite a fachada',()=>{
 for(const era of [0,3,5,7]){
  assert.equal(scene(era,25).count,0);
  assert.ok(scene(era,85).calls.length>scene(era,40).calls.length);
 }
});
test('neve cobre somente as aguas do telhado no inverno',()=>{
 assert.ok(scene(3,82,3).styles.includes('#e6ece4a8'));
 assert.ok(!scene(3,82,1).styles.includes('#e6ece4a8'));
});
test('Canvas finito e estados equilibrados nas eras e escalas',()=>{
 for(let era=0;era<8;era++)for(const ww of [25,31,45,68,90])for(const season of [0,3]){
  const {calls}=scene(era,ww,season);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 }
});
test('construcao, pre-visualizacao e edificios concluidos usam o mesmo acabamento',()=>{
 assert.match(script,/drawFarmGranaryEraDetails\(px,py,ww,hh,era,1,forestSeason\(\)/);
 assert.match(script,/drawFarmGranaryEraDetails\(px,py,ww,hh,game\.era,obj\.level,forestSeason\(\)/);
 assert.match(script,/drawFarmGranaryEraDetails\(px,py,ww,hh,game\.era,1,forestSeason\(\)/);
 assert.deepEqual(scene(7),scene(7));
 assert.notDeepEqual(scene(0).styles,scene(7).styles);
});
