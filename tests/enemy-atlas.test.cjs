'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const svg=fs.readFileSync(path.join(__dirname,'..','assets','cronicas_tropas_atlas.svg'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script');
const begin=script.indexOf('function drawUnitSprite(');
const end=script.indexOf('const harvesting=',begin);
assert.ok(begin>=0&&end>begin,'sprite dispatch is present');
const dispatcher=script.slice(begin,end)+'return false;}';
function route(u,enemy=false,zoom=1.2){
 const calls=[];
 const draw=new Function('drawPaintedTroop','paintedTroops','Date',dispatcher+';return drawUnitSprite;')(
  (...args)=>{calls.push(args);return true},
  {complete:true,naturalWidth:256,naturalHeight:896},
  {now:()=>10000}
 );
 draw({x:80.5,y:80.5,path:[],...u},200,220,zoom,enemy);
 return calls;
}
test('enemy guards route through the animated troop atlas without changing their game data',()=>{
 const calls=route({face:-1},true);
 assert.equal(calls.length,1,'enemy guard uses the same atlas as friendly warriors');
 assert.equal(calls[0][3],1.2);
 assert.equal(calls[0][4],false,'enemy guard uses warrior frames');
 assert.equal(calls[0][8],-1,'last facing is preserved');
 assert.equal(calls[0][9],true,'enemy affiliation reaches the atlas renderer');
 assert.equal(route({kind:'warrior'},false)[0][9],false);
});
test('damage keeps the procedural fallback and cavalry retains its dedicated renderer',()=>{
 assert.equal(route({hitAt:9900},true).length,0,'recent enemy damage uses hit effects');
 assert.equal(route({kind:'warrior',hitAt:9900},false).length,0);
 assert.equal(route({face:1},true,.6).length,1,'LOD is decided inside atlas renderer');
 assert.match(script,/if\(z<\.72\|\|!paintedTroops\.complete/);
});
test('all troop atlas cells are independently clipped and the enemy overlay is scarlet',()=>{
 assert.equal([...svg.matchAll(/data-frame="\d-\d-\d"/g)].length,32);
 assert.equal([...svg.matchAll(/clip-path="url\(#troopFrameClip\)"/g)].length,32);
 assert.match(svg,/<clipPath id="troopFrameClip"><rect x="0" y="0" width="64" height="112"\/><\/clipPath>/);
 assert.match(script,/ctx\.fillStyle='#a83532'/);
 assert.match(script,/ctx\.ellipse\(0,z\*\.6,w\*\.50,h\*\.095/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
