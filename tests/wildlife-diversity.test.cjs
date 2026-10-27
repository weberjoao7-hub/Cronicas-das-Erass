'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal deve existir');
const from=script.indexOf('function wildlifeAt(');
const renderFrom=script.indexOf('function drawWildlife(',from);
const renderTo=script.indexOf('// Garças nas margens:',renderFrom);
assert.ok(from>=0&&renderFrom>from&&renderTo>renderFrom);
const wildlifeSource=script.slice(from,renderFrom);
const renderSource=script.slice(renderFrom,renderTo);

function fauna(biomeId,seed){
 const wildlife=new Function('biome','rnd',wildlifeSource+';return wildlifeAt;')(
  ()=>biomeId,()=>seed);
 return wildlife(12,18);
}
function render(kind,width=74){
 const fills=[],ops=[];
 const ctx=new Proxy({},{
  get(_target,key){return (...args)=>ops.push([key,...args])},
  set(_target,key,value){if(key==='fillStyle')fills.push(value);return true}
 });
 const draw=new Function('ctx','scale','Date',renderSource+';return drawWildlife;')(
  ctx,1,{now:()=>120000});
 draw(100,100,width,width*.51,kind,22,18);
 return {fills,ops};
}

test('script principal mantém sintaxe válida',()=>assert.doesNotThrow(()=>new Function(script)));
test('espécies são determinísticas e associadas a biomas',()=>{
 assert.equal(fauna(0,.80),'fish');
 assert.equal(fauna(3,.99),'boar');
 assert.equal(fauna(3,.92),'deer');
 assert.equal(fauna(4,.99),'wolf');
 assert.equal(fauna(2,.99),'fox');
 assert.equal(fauna(2,.93),'rabbit');
 assert.equal(fauna(1,.99),null);
 assert.equal(fauna(3,.50),null);
});
test('raposa, lobo e javali possuem cores e geometrias distintas',()=>{
 for(const [kind,coat] of [['fox','#b86a3b'],['wolf','#707b78'],['boar','#594535']]){
  const result=render(kind);
  assert.ok(result.fills.includes(coat),kind+' tem pelagem característica');
  assert.ok(result.ops.filter(([op])=>op==='fill').length>=5,kind+' tem corpo composto');
  assert.ok(result.ops.some(([op])=>op==='scale'),kind+' tem direção animada');
  assert.equal(result.ops.filter(([op])=>op==='save').length,result.ops.filter(([op])=>op==='restore').length);
 }
});
test('LOD omite fauna distante sem gerar desenho',()=>{
 assert.equal(render('fox',18).ops.length,0);
 assert.ok(render('fox',50).ops.length>0);
});
test('caça de javali dá 20 alimentos e predadores não são caçáveis',()=>{
 assert.match(script,/wildlifeAt\(hx,hy\)==='boar'\?20:12/);
 assert.match(script,/fauna!=='fish'&&fauna!=='fox'&&fauna!=='wolf'/);
 assert.match(script,/boar:'Javalis · \+20 alimentos'/);
});
test('salvamento legado permanece estável',()=>{
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
