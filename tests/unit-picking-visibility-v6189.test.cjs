'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('function pickVisibleUnitIndex(');
const end=script.indexOf('\nfunction selectGroupInRect(',start);
assert.ok(start>=0&&end>start,'hit test isolavel');
const source=script.slice(start,end);
const pick=new Function(source+'\nreturn pickVisibleUnitIndex;')();
const a={x:10,y:10,hp:100,kind:'warrior'};
const b={x:11,y:11,hp:100,kind:'cavalry'};
const pos=(u)=>u===a?[60,80]:[65,80];
test('v6.189: sintaxe e save original preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=189);
 assert.match(script,/cronicas-v04/);
});
test('toque nao seleciona unidades ocultas na nevoa',()=>{
 assert.equal(pick([a,b],60,73,1,pos,(x)=>x===11),1);
 assert.equal(pick([a,b],60,73,1,pos,()=>false),-1);
});
test('unidades mortas ou coordenadas invalidas nao recebem toque',()=>{
 assert.equal(pick([{...a,hp:0}],60,73,1,()=>[60,80],()=>true),-1);
 assert.equal(pick([{...a,x:NaN}],60,73,1,()=>[60,80],()=>true),-1);
 assert.equal(pick([a],NaN,73,1,()=>[60,80],()=>true),-1);
 assert.equal(pick([a],60,73,0,()=>[60,80],()=>true),-1);
 assert.equal(pick(null,60,73,1,()=>[60,80],()=>true),-1);
});
test('silhuetas maiores da cavalaria facilitam selecao por toque',()=>{
 assert.equal(pick([b],85,74,1,()=>[65,80],()=>true),0);
 assert.equal(pick([a],85,74,1,()=>[65,80],()=>true),-1);
});
test('selecao prioriza unidade mais proxima e nao altera unidades',()=>{
 const before=JSON.stringify([a,b]);
 assert.equal(pick([a,b],60,73,1,pos,()=>true),0);
 assert.equal(JSON.stringify([a,b]),before);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.units\.push/);
});
test('fallback no mesmo losango tambem exige unidade viva e visivel',()=>{
 assert.match(script,/game\.units\.findIndex\(u=>u&&u\.hp>0&&Number\.isFinite\(u\.x\).*?visibleAt\(u\.x,u\.y\)/);
 assert.match(script,/unitSelectionPulse=\{unit:game\.units\[unitIndex\],started:Date\.now\(\)\}/);
});
test('pulso visual de selecao tem duracao limitada e restaura o Canvas',()=>{
 const part=script.slice(script.indexOf('function drawTileOccupants('),script.indexOf('function isActiveForestWorker('));
 assert.match(part,/age>=0&&age<550/);
 assert.match(part,/ctx\.save\(\);ctx\.globalAlpha=\(1-t\)\*\.78/);
 assert.match(part,/ctx\.restore\(\)/);
 assert.doesNotMatch(part,/localStorage|requestAnimationFrame/);
});
