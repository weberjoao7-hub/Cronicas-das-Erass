'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('const unitStrideDistance=new WeakMap();');
const end=script.indexOf('const paintedCavalry=',start);
assert.ok(start>=0&&end>start,'funcoes de marcha isolaveis');
const source=script.slice(start,end);
const {advanceUnitStride,strideFrame,strideSwing}=new Function(source+';return {advanceUnitStride,strideFrame,strideSwing}')();
test('marcha: sintaxe do jogo e chave de salvamento mantidas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame/);
});
test('marcha: passos da infantaria dependem de deslocamento e nao de tempo',()=>{
 const u={};assert.equal(strideFrame(u),0);
 advanceUnitStride(u,.31);assert.equal(strideFrame(u),1);
 advanceUnitStride(u,.30);assert.equal(strideFrame(u),0);
 advanceUnitStride(u,.30);assert.equal(strideFrame(u),1);
});
test('marcha: quatro quadros do aldeao e passo mais longo da cavalaria',()=>{
 const u={};assert.equal(strideFrame(u,4,.17),0);
 for(let i=1;i<=4;i++){advanceUnitStride(u,.17);assert.equal(strideFrame(u,4,.17),i%4)}
 const horse={};advanceUnitStride(horse,.41);assert.equal(strideFrame(horse,2,.40),1);
});
test('marcha: pausa, colisao e valores invalidos nao fazem o sprite deslizar',()=>{
 const u={};advanceUnitStride(u,.13);const old=strideSwing(u);
 for(const bad of [0,-2,NaN,Infinity,undefined])advanceUnitStride(u,bad);
 assert.equal(strideSwing(u),old);assert.equal(strideFrame(u,2,.30),0);
 assert.equal(strideFrame(null),0);
});
test('marcha: animacao de passos permanece limitada apos trajetos longos',()=>{
 const u={};for(let i=0;i<10000;i++)advanceUnitStride(u,.08);
 assert.ok(Number.isFinite(strideSwing(u)));
 assert.ok([0,1].includes(strideFrame(u)));
});
test('marcha: integracao nas rotas amigas e nos guardas inimigos',()=>{
 assert.match(script,/u\.x\+=dx\/len\*step;u\.y\+=dy\/len\*step;advanceUnitStride\(u,step\)/);
 assert.match(script,/guard\.x=nx;guard\.y=ny;advanceUnitStride\(guard,step\)/);
});
test('marcha: atlas de tropas, cavalaria, aldeoes e fallback usam o passo',()=>{
 assert.match(script,/strideFrame\(u,2,\.30\)/);
 assert.match(script,/strideFrame\(u,2,\.40\)/);
 assert.match(script,/strideFrame\(u,4,\.17\)/);
 assert.match(script,/typeof strideFrame==='function'/);
 assert.match(script,/phase=moving\?strideSwing\(u\):0/);
});
