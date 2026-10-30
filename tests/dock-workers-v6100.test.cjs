'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('// v6.100: atividade portuaria');
const end=script.indexOf('function drawDock(',start);
assert.ok(start>=0&&end>start,'animacao do pesqueiro encontrada');
const source=script.slice(start,end);
const create=new Function('ctx',source+'return drawDockWorkers;');
function scene(era=4,ww=74,level=3,boat={state:'ready',wait:2.5},now=1400){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenada finita em '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const count=create(ctx)(220,190,ww,ww*38/74,era,now,boat,level);
 return {count,calls,styles};
}
test('v6.100: sintaxe valida e chave de salvamento legada intacta',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/Crônicas das Eras v6\.(\d+)/)?.[1])>=100);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.food\s*[+\-]?=/);
});
test('LOD: detalhes e trabalhadores somem no zoom distante',()=>{
 assert.equal(scene(4,24).count,0);
 assert.equal(scene(4,24).calls.length,0);
 assert.equal(scene(4,74).count,2);
});
test('segundo trabalhador apenas no nivel tres com zoom proximo',()=>{
 assert.equal(scene(4,74,3).count,2);
 assert.equal(scene(4,74,2).count,1);
 assert.equal(scene(4,58,3).count,1);
});
test('uniformes e equipamento mudam nas eras primitivas, medievais e industriais',()=>{
 assert.ok(scene(0).styles.includes('#b58a57'));
 assert.ok(scene(4).styles.includes('#7c6651'));
 assert.ok(scene(7).styles.includes('#527c8d'));
 assert.ok(scene(7).styles.includes('#4d6971')||scene(7).styles.includes('#a38b61'));
});
test('desembarque ocorre somente com barco pronto e em espera',()=>{
 const ready=scene(4,74,3,{state:'ready',wait:2.5});
 const moving=scene(4,74,3,{state:'outbound',wait:0});
 assert.notDeepEqual(ready.calls,moving.calls);
 assert.ok(ready.styles.includes('#a5c8bd'));
 assert.ok(!moving.styles.includes('#a5c8bd'));
});
test('animacao deterministica e Canvas equilibrado nas oito eras',()=>{
 assert.deepEqual(scene(4,74,3,null,1400),scene(4,74,3,null,1400));
 assert.notDeepEqual(scene(4,74,3,null,1400).calls,scene(4,74,3,null,1900).calls);
 for(let era=0;era<8;era++)for(const ww of [24,38,52,74]){
  const s=scene(era,ww);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('trabalhadores desenhados somente em pesqueiros concluidos e explorados',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 assert.match(render,/if\(!exploredFog\[y\*W\+x\]\)continue/);
 assert.match(render,/if\(obj&&obj\.buildLeft\)\{drawConstructionSite\(obj,px,py,ww,hh\)\}/);
 assert.ok(render.includes("else if(obj.t==='Pesqueiro'){drawDock(px,py,ww,hh,obj.level,!!obj.boat);drawDockWorkers(px,py,ww,hh,game.era,frameTime,obj.boat,obj.level);}"));
});
