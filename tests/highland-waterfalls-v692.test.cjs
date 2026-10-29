'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawHighlandWaterfall(');
const end=script.indexOf('function drawHighlandGround(',start);
assert.ok(start>0&&end>start,'cachoeira isolável do renderizador');
const source=script.slice(start,end);
function scene({east=0,south=2,seed=.8}={}){
 const fills=[],strokes=[],ctx={
  save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},closePath(){},
  fill(){fills.push(this.fillStyle)},stroke(){strokes.push(this.strokeStyle)},
  ellipse(){},arc(){}
 };
 const draw=new Function('ctx','biome','rnd',source+';return drawHighlandWaterfall;')(
  ctx,(x,y)=>x===11&&y===10?east:x===10&&y===11?south:2,()=>seed);
 return {draw,fills,strokes};
}
test('v6.92: script compila e salvamento legado permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.92<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.buildings|game\.units|save\(/);
});
test('cachoeira respeita zoom distante e bioma não rochoso',()=>{
 const s=scene();
 assert.equal(s.draw(100,100,24,12,10,10,4,1,1000,false),0);
 assert.equal(s.draw(100,100,64,32,10,10,2,1,1000,false),0);
 assert.equal(s.fills.length,0);
});
test('cachoeira não invade construções nem estradas',()=>{
 const s=scene();
 assert.equal(s.draw(100,100,64,32,10,10,4,1,1000,true),0);
 assert.equal(s.fills.length,0);
});
test('somente penhascos adjacentes a lagos produzem queda d’água',()=>{
 const inland=scene({east:2,south:2}),coast=scene();
 assert.equal(inland.draw(100,100,64,32,10,10,5,1,1000,false),0);
 assert.equal(coast.draw(100,100,64,32,10,10,5,1,1000,false),1);
 assert.ok(coast.fills.includes('#428b9b'));
});
test('inverno troca a água corrente por gelo e pingentes',()=>{
 const summer=scene(),winter=scene();
 assert.equal(summer.draw(100,100,64,32,10,10,4,1,1000,false),1);
 assert.equal(winter.draw(100,100,64,32,10,10,4,3,1000,false),1);
 assert.ok(summer.fills.includes('#d7f5ed'));
 assert.ok(winter.fills.includes('#b9e0df'));
 assert.ok(!winter.fills.includes('#d7f5ed'));
 assert.ok(winter.strokes.includes('#f5fcf2'));
});
test('LOD remove spray distante e preserva água em zoom médio',()=>{
 const medium=scene(),close=scene();
 assert.equal(medium.draw(100,100,40,20,10,10,4,1,1000,false),1);
 assert.equal(close.draw(100,100,72,36,10,10,4,1,1000,false),1);
 assert.ok(close.fills.length>medium.fills.length);
});
test('cachoeira entra após montanhas e antes de tropas, somente com visibilidade',()=>{
 const terrain=script.indexOf('if(b===5&&ww>13){drawMountain(');
 const fall=script.indexOf('drawHighlandWaterfall(px,py,ww,hh,x,y,b,forestSeason(),frameTime');
 const troops=script.indexOf('const forestTile=key(x,y)',terrain);
 assert.ok(terrain>=0&&fall>terrain&&troops>fall);
 assert.match(script.slice(fall-110,fall),/visibleFog\[y\*W\+x\]/);
});
