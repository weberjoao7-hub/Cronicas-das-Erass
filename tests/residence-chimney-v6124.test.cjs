'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('// v6.124: chaminés'),end=script.indexOf('/* Telhas isométricas:',start);
assert.ok(start>=0&&end>start,'desenho de chaminés isolável');
const source=script.slice(start,end);
function scene(era=4,ww=74,now=1200,season=1,rain=0){
 const calls=[],colors=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle')colors.push(v);return true;}});
 const draw=new Function('ctx','forestSeason',source+';return drawResidenceChimney;')(ctx,()=>1);
 return {count:draw(200,180,ww,ww*.52,era,29,now,season,rain),calls,colors};
}
test('sintaxe do jogo e chave de salvamento preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('chaminés são históricas e não aparecem em eras primitivas ou modernas',()=>{
 assert.equal(scene(0).count,0);assert.equal(scene(1).count,0);
 assert.equal(scene(7).count,0);assert.equal(scene(4).count,1);assert.equal(scene(6).count,1);
});
test('LOD evita desenho distante e preserva geometria válida',()=>{
 assert.equal(scene(4,28).calls.length,0);
 assert.ok(scene(4,74).calls.length>scene(4,42).calls.length);
 for(let era=0;era<8;era++)for(const ww of [28,42,58,88]){
  const s=scene(era,ww);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('materiais diferenciam pedra medieval, tijolos e acabamento industrial',()=>{
 assert.ok(scene(4).colors.includes('#a3a6a0'));
 assert.ok(scene(5).colors.includes('#b7785b'));
 assert.ok(scene(6).colors.includes('#403c39'));
 assert.ok(!scene(6).colors.includes('#a3a6a0'));
});
test('fumaça varia com tempo, inverno e chuva',()=>{
 assert.deepEqual(scene(4,74,1200),scene(4,74,1200));
 assert.notDeepEqual(scene(4,74,1200).calls,scene(4,74,3200).calls);
 assert.ok(scene(4,74,1200,3).calls.length>scene(4,74,1200,1).calls.length);
 assert.notDeepEqual(scene(4,74,1200,1,.9).colors,scene(4,74,1200,1,0).colors);
});
test('integração respeita obra concluída, prévia e ordem do telhado',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(render,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite/);
 assert.match(render,/if\(obj\.t==='Cabana'\)drawResidenceChimney/);
 assert.ok(render.indexOf('drawResidenceChimney(px,py,ww,hh,game.era,x*97+y*13')<
  render.indexOf('drawWinterRoofSnow(px,py,ww,hh'));
 assert.match(script,/if\(placing==='Cabana'\)drawResidenceChimney/);
 assert.doesNotMatch(source,/localStorage|routeFor|game\.buildings/);
});
