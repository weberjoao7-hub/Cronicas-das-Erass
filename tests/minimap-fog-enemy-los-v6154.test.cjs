'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
const visibility=script.slice(script.indexOf('function updateVisibility(){'),script.indexOf('function save(){'));
const enemy=script.slice(script.indexOf('function enemyTurn(dt){'),script.indexOf('const isMilitary='));
assert.ok(visibility.includes('function updateVisibility()')&&enemy.includes('function enemyTurn(dt)'));

function fogScene(){
 const W=3,H=1,visibleFog=new Uint8Array(W*H),exploredFog=new Uint8Array(W*H);
 exploredFog[1]=1;
 const fogImage={data:new Uint8ClampedArray(W*H*4)};
 let updates=0;
 const game={buildings:[],units:[{x:2.5,y:.5,hp:100,kind:'worker'}]};
 const factory=new Function('W','H','visibleFog','exploredFog','fogImage','fogCtx',
   'sightCells','game','ownedRegions','REGION_SIZE','dirty','fogRevision',
   visibility+';return updateVisibility;');
 const update=factory(W,H,visibleFog,exploredFog,fogImage,{putImageData:()=>updates++},
   ()=>[2],game,()=>new Set(),12,false,0);
 update();
 return {alpha:[fogImage.data[3],fogImage.data[7],fogImage.data[11]],updates};
}
function guardScene(canSee){
 const guard={x:4.5,y:5.5,homeX:4.5,homeY:5.5,kind:'warrior',path:[],repath:0};
 const calls=[];
 const game={enemy:{hp:100},enemyUnits:[guard],units:[{x:8.5,y:5.5,hp:100}]};
 const factory=new Function('game','terrainSightClear','assignRoute','passable',
  'advanceUnitStride','dirty','hasRangedSight','approachHostile',enemy+';return enemyTurn;');
 const update=factory(game,()=>canSee,(u,x,y)=>{calls.push([x,y]);return true},
   ()=>true,()=>{},false,()=>true,()=>true);
 update(.1);
 return calls;
}
test('script completo compila e salvamento legado e preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
});
test('minimapa esconde 100% da cartografia nunca explorada',()=>{
 assert.deepEqual(fogScene(),{alpha:[255,155,0],updates:1});
 assert.match(script,/mc\.drawImage\(fogCanvas,0,0\)/);
});
test('guarda sem linha de visao nao persegue unidades atras de montanhas',()=>{
 assert.ok(!guardScene(false).some(([x])=>x===8));
 assert.ok(guardScene(true).some(([x,y])=>x===8&&y===5));
});
test('deteccao valida coordenadas e respeita oclusao do terreno',()=>{
 assert.match(enemy,/Number\.isFinite\(u\.x\)/);
 assert.match(enemy,/terrainSightClear\(Math\.floor\(guard\.x\)/);
 assert.doesNotMatch(enemy,/localStorage|Math\.random/);
});
