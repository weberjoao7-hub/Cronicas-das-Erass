'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('function drawResidenceArchitecturalRelief('),b=script.indexOf('// v6.124: chaminés',a);
assert.ok(a>0&&b>a,'renderizador isolavel');
const source=script.slice(a,b);
function scene(era=4,level=2,ww=74,seed=17){
 const calls=[],colors=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true}});
 const draw=new Function('ctx',source+'return drawResidenceArchitecturalRelief;')(ctx);
 return {count:draw(180,140,ww,ww*38/74,era,level,seed),calls,colors};
}
test('sintaxe do jogo e persistencia v04 preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|setInterval|requestAnimationFrame/);
});
test('era tribal e zoom distante nao desenham geometria adicional',()=>{
 assert.equal(scene(0).count,0);assert.equal(scene(1).count,0);
 assert.equal(scene(4,3,28).count,0);assert.equal(scene(4,3,28).calls.length,0);
 assert.equal(scene(4,3,74).count,1);
});
test('niveis da cabana ganham agua-furtada e sacada volumetricas',()=>{
 const low=scene(4,1),mid=scene(4,2),high=scene(4,3);
 assert.ok(mid.calls.length>low.calls.length);
 assert.ok(high.calls.length>mid.calls.length);
 assert.ok(high.calls.filter(c=>c[0]==='closePath').length>mid.calls.filter(c=>c[0]==='closePath').length);
});
test('arquitetura evolui por era com materiais distintos',()=>{
 assert.ok(scene(4).colors.includes('#4b6170'));
 assert.ok(scene(6).colors.includes('#52616a'));
 assert.ok(scene(7).colors.includes('#8da5a5'));
 assert.ok(!scene(7).colors.includes('#4b6170'));
});
test('geometria finita, deterministica e estados Canvas balanceados',()=>{
 for(let era=0;era<8;era++)for(const ww of [28,44,74,92])for(let level=1;level<=3;level++){
  const s=scene(era,level,ww,91);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
 assert.deepEqual(scene(5,3,88,101),scene(5,3,88,101));
 assert.notDeepEqual(scene(5,3,88,101).calls,scene(5,3,88,102).calls);
});
test('integracao somente em cabanas concluidas e na previa de construcao',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(render,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite/);
 const residence=script.slice(script.indexOf('function drawEraResidence('),script.indexOf('// v6.150:',script.indexOf('function drawEraResidence(')));
 assert.match(residence,/drawResidenceArchitecturalRelief\(px,py,ww,hh,era,level,seed\)/);
 assert.match(render,/else if\(obj\.t==='Cabana'\)drawEraResidence/);
 assert.match(script,/else if\(placing==='Cabana'\)drawEraResidence/);
 assert.doesNotMatch(render,/if\(obj\.t==='Cabana'\)drawResidenceArchitecturalRelief/);
});
