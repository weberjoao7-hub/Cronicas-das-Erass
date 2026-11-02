'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal disponivel');
const a=script.indexOf('function drawResidenceStreetProps(');
const b=script.indexOf('function drawEraRoofTiles(',a);
assert.ok(a>0&&b>a,'funcao isolavel');
const source=script.slice(a,b);
function scene(seed=0,era=4,level=2,ww=82,season=1,now=12345){
 const calls=[],colors=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')colors.push(v);return true;}
 });
 const draw=new Function('ctx',source+'return drawResidenceStreetProps;')(ctx);
 return {count:draw(180,140,ww,ww*.5,era,level,seed,season,now),calls,colors};
}
test('script principal compila e formato de save continua v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|requestAnimationFrame|setInterval/);
});
test('zoom distante e parametros invalidos nao criam geometria',()=>{
 assert.equal(scene(0,4,2,35).count,0);
 assert.equal(scene(0,4,2,35).calls.length,0);
 const s=scene(0,4,2,82);
 assert.equal(s.count,1);assert.ok(s.calls.length>15);
});
test('tres estilos arquitetonicos com geometrias distintas por lote',()=>{
 const a=scene(0),b=scene(1),c=scene(2);
 assert.deepEqual([a.count,b.count,c.count],[1,2,3]);
 assert.notDeepEqual(a.calls,b.calls);
 assert.notDeepEqual(b.calls,c.calls);
 assert.ok(a.colors.includes('#ad8150'));
 assert.ok(b.colors.includes('#ad6749'));
 assert.ok(c.colors.includes('#3f5935'));
});
test('paletas historicas e cobertura de neve',()=>{
 assert.ok(scene(1,0).colors.includes('#b18a54'));
 assert.ok(scene(1,4).colors.includes('#ad6749'));
 assert.ok(scene(1,7).colors.includes('#527b7a'));
 assert.ok(scene(1,4,2,82,3).colors.includes('#c6d0c6'));
 assert.ok(scene(2,4,2,82,3).colors.includes('#c6d3ca'));
});
test('nivel de evolucao acrescenta detalhes sem desequilibrar Canvas',()=>{
 assert.ok(scene(0,4,2).calls.length>scene(0,4,1).calls.length);
 assert.ok(scene(2,4,2).calls.length>scene(2,4,1).calls.length);
 for(let seed=0;seed<3;seed++)for(let era of [0,4,7])for(let season of [1,3]){
  const s=scene(seed,era,2,82,season);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
 assert.deepEqual(scene(1,4,2,82,1,12345),scene(1,4,2,82,1,12345));
 assert.notDeepEqual(scene(1,4,2,82,1,12345).calls,scene(1,4,2,82,1,17345).calls);
});
test('cabanas concluidas e previa de construcao usam os mesmos detalhes',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(render,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite/);
 assert.match(render,/if\(obj\.t==='Cabana'\)drawResidenceStreetProps\(px,py,ww,hh,game\.era,obj\.level\|\|1,x\*97\+y\*13,forestSeason\(\),frameTime\)/);
 assert.match(script,/if\(placing==='Cabana'\)drawResidenceStreetProps\(px,py,ww,hh,game\.era,1,p\.x\*97\+p\.y\*13,forestSeason\(\),Date\.now\(\)\)/);
});
