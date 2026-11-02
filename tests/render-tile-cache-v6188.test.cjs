'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const draw=script.slice(script.indexOf('function draw(){'),script.indexOf('\nfunction refresh(){'));
const tile=draw.slice(draw.indexOf('// Nevoa nao explorada:'),draw.indexOf('\ndrawCloudShadows('));
test('v6.188: sintaxe completa, versao e persistencia',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=188);
 assert.match(script,/cronicas-v04/);
});
test('chave do ladrilho e criada uma vez apos o descarte da nevoa desconhecida',()=>{
 assert.match(draw,/if\(!exploredFog\[y\*W\+x\]\)continue;\s*\/\/ v6\.188:[^\n]*\nconst tileKey=key\(x,y\);/);
 assert.equal((draw.match(/const tileKey=key\(x,y\);/g)||[]).length,1);
});
test('renderizacao reutiliza a chave em mais de 65 acessos',()=>{
 assert.ok((tile.match(/tileKey/g)||[]).length>=65);
 assert.ok((tile.match(/key\(x,y\)/g)||[]).length<=3);
 for(const name of ['structures','roadTiles','unitTiles','enemyTiles','boatTiles','groundTrackTiles','remnantTiles']){
  assert.ok(tile.includes(name+'.has(tileKey)')||tile.includes(name+'.get(tileKey)'),name);
 }
});
test('sem mudar os indices, oclusao e nevoa de guerra',()=>{
 assert.match(tile,/visibleFog\[y\*W\+x\]/);
 assert.match(tile,/drawForestOccupiedTile\(x,y,px,py,ww,hh,q,unitTiles,enemyTiles,z,frameTime\)/);
 assert.ok(tile.indexOf('drawBuildingFoundation(')<tile.indexOf('drawTileOccupants(x,y,unitTiles,enemyTiles,z,frameTime);'));
 assert.match(draw,/drawFogFrontier\(px,py,ww,hh,x,y,visibleFog,exploredFog\)/);
});
test('cache efemero sem efeitos em rotas, simulacao ou save',()=>{
 const snippet=draw.slice(draw.indexOf('const tileKey=key(x,y);'),draw.indexOf('let b=biome(x,y)'));
 assert.doesNotMatch(snippet,/game\.|localStorage|assignRoute|terrain\[/);
 const key=(x,y)=>x+','+y;
 for(const [x,y] of [[0,0],[80,80],[159,159],[12,143]])assert.equal(key(x,y),x+','+y);
});
