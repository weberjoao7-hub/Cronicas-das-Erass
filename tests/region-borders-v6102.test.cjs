'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.102: contorno de regiões');
const end=script.indexOf('// Bandeiras isométricas',start);
assert.ok(start>=0&&end>start,'função de fronteiras isolável');
const source=script.slice(start,end);
function render(owned,width=74,era=4,x=12,y=12){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas com coordenadas finitas: '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','key','game','scale',source+'return drawTerritoryEdge;')(
  ctx,(a,b)=>a+','+b,{era},width/74);
 const count=draw(180,150,width,width*38/74,x,y,new Set(owned));
 return {count,calls,styles};
}
test('script compila, versão atualizada e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.102<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|requestAnimationFrame|Math\.random/);
});
test('interior de região não recebe tintura nem comandos Canvas',()=>{
 const scene=render(['12,11','13,12','12,13','11,12']);
 assert.equal(scene.count,0);
 assert.equal(scene.calls.length,0);
 assert.doesNotMatch(script,/#3bd88b1d/);
});
test('borda isolada desenha quatro lados com dupla leitura',()=>{
 const scene=render([]);
 assert.equal(scene.count,4);
 assert.equal(scene.calls.filter(c=>c[0]==='stroke').length,12); // 8 arestas + 4 hastes dos marcos
 assert.equal(scene.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(scene.calls.filter(c=>c[0]==='restore').length,1);
});
test('vizinhos internos removem arestas de forma independente',()=>{
 assert.equal(render(['12,11']).count,3);
 assert.equal(render(['12,11','13,12']).count,2);
 assert.equal(render(['12,11','13,12','12,13']).count,1);
 assert.equal(render(['12,11','13,12','12,13','11,12']).count,0);
});
test('marcos aparecem apenas em cantos externos e zoom próximo',()=>{
 const corner=render(['12,11','13,12'],74);
 const far=render(['12,11','13,12'],35);
 assert.ok(corner.calls.some(c=>c[0]==='ellipse'));
 assert.ok(corner.calls.some(c=>c[0]==='fill'));
 assert.ok(!far.calls.some(c=>c[0]==='ellipse'));
 assert.ok(!far.calls.some(c=>c[0]==='fill'));
 assert.ok(render(['12,11','12,13'],74).calls.every(c=>c[0]!=='ellipse'));
});
test('marcadores e contorno mudam com era sem alterar geometria',()=>{
 const old=render([],74,2),modern=render([],74,7);
 assert.ok(old.styles.includes('#d9b879'));
 assert.ok(modern.styles.includes('#b8d0c1'));
 assert.ok(old.styles.includes('#d2aa66'));
 assert.ok(modern.styles.includes('#8dbbb3'));
 assert.deepEqual(old.calls,modern.calls);
});
test('render principal conserva somente contorno sobre região dominada',()=>{
 assert.match(script,/if\(own\.has\(key\(x,y\)\)\)drawTerritoryEdge\(px,py,ww,hh,x,y,own\)/);
 assert.doesNotMatch(script,/diamond\(px,py,ww-1,hh-1,'#3bd88b1d'/);
 assert.match(script,/const claimed=\(\)=>\{/);
 assert.match(script,/REGION_SIZE=12/);
});
