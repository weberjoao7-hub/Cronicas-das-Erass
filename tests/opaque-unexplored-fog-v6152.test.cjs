'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const draw=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
assert.ok(draw.length>5000,'renderizador principal presente');

test('script compila e salvamento legado permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
});
test('ladrilhos nunca explorados sao descartados antes do atlas e das ruinas',()=>{
 const first=draw.slice(0,draw.indexOf('drawCloudShadows('));
 const guard=first.indexOf('if(!exploredFog[y*W+x])continue;');
 const ruin=first.indexOf('ruinKind=ruinAt(x,y,b)');
 const atlas=first.indexOf('ctx.drawImage(tileArt[b]');
 assert.ok(guard>=0&&ruin>guard&&atlas>guard,'sem trabalho caro antes do descarte');
 assert.equal(first.match(/if\(!exploredFog\[y\*W\+x\]\)continue;/g)?.length,1);
});
test('nevoa desconhecida e opaca; explorada conserva translucidez',()=>{
 const a=draw.indexOf('// Névoa sobre o mundo renderizado');
 const b=draw.indexOf('// Segunda passagem',a);
 assert.ok(a>0&&b>a,'passagem de nevoa isolavel');
 const calls=[];
 const bounds={minX:0,maxX:1,minY:0,maxY:1},visibleFog=new Uint8Array(4);
 const exploredFog=new Uint8Array(4);exploredFog[1]=1;visibleFog[2]=1;
 const fogPass=new Function('bounds','visibleFog','exploredFog','W','point','ww','hh','w','h','diamond',draw.slice(a,b));
 fogPass(bounds,visibleFog,exploredFog,2,()=>[100,100],74,38,400,300,(...args)=>calls.push(args));
 assert.equal(calls.length,3);
 assert.equal(calls.filter(c=>c[4]==='#06111d').length,2,'sem vazamento de bioma desconhecido');
 assert.equal(calls.filter(c=>c[4]==='#081722a6').length,1,'historico visivel sob sombra');
 assert.ok(!calls.some(c=>c[4]==='#06111ded'),'nenhuma translucidez em area desconhecida');
});
test('transicao de fronteira e composicao final permanecem ativas',()=>{
 const fog=draw.indexOf("diamond(px,py,ww+2,hh+2,exploredFog[i]");
 const frontier=draw.indexOf('drawFogFrontier(px,py,ww,hh,x,y,visibleFog,exploredFog)');
 const weather=draw.indexOf('drawAmbientParticles(frameTime);');
 assert.ok(fog>=0&&frontier>fog&&weather>frontier);
 assert.match(draw,/if\(ww>=38\)/);
});
