'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const start=script.indexOf('function edgePanVector(');
const end=script.indexOf('function activeEdgePan()',start);
assert.ok(start>=0&&end>start,'função pura de navegação encontrada');
const edgePanVector=new Function(script.slice(start,end)+';return edgePanVector')();

test('script do jogo compila e mantém o salvamento existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('centro e coordenadas inválidas não deslocam câmera',()=>{
 for(const args of [[400,200,800,400],[NaN,0,800,400],[0,0,0,400],[0,0,800,-1]]){
  assert.deepEqual(edgePanVector(...args),{x:0,y:0});
 }
});
test('bordas produzem vetores direcionais corretos',()=>{
 assert.deepEqual(edgePanVector(0,200,800,400),{x:-1,y:0});
 assert.deepEqual(edgePanVector(800,200,800,400),{x:1,y:0});
 assert.deepEqual(edgePanVector(400,0,800,400),{x:0,y:-1});
 assert.deepEqual(edgePanVector(400,400,800,400),{x:0,y:1});
});
test('velocidade cresce gradualmente na faixa de borda',()=>{
 const center=edgePanVector(40,200,800,400).x;
 const half=edgePanVector(16,200,800,400).x;
 const edge=edgePanVector(0,200,800,400).x;
 assert.equal(center,0);assert.equal(half,-.5);assert.equal(edge,-1);
});
test('diagonais são normalizadas para evitar aceleração',()=>{
 const {x,y}=edgePanVector(0,0,800,400);
 assert.ok(Math.abs(Math.hypot(x,y)-1)<1e-9);
 assert.ok(x<0&&y<0);
});
test('iPhone e gestos de arraste não ativam edge scrolling',()=>{
 assert.match(script,/if\(mobileRender\|\|pointers\.size\|\|panel\.classList\.contains\('show'\)\|\|document\.hidden\)/);
 assert.match(script,/if\(e\.pointerType!=='mouse'\)return/);
 assert.match(script,/C\.addEventListener\('pointerleave'/);
 assert.match(script,/applyDesktopEdgePan\(dt\);applyCameraFollow\(dt\);for\(let u of game\.units\)/);
});
