'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
const a=script.indexOf('const key=(x,y)=>'),b=script.indexOf('const at=(x,y)=>',a);
assert.ok(a>=0&&b>a);const source=script.slice(a,b);
function scene(claim=['80,80']){const game={claim};return {game,...new Function('game','W','H',source+'return {claimed,ownedRegions};')(game,160,160)};}
test('v6.109: compilação e cache territorial sem mexer no save',()=>{
 assert.doesNotThrow(()=>new Function(script));assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/let claimedCacheKey=null,claimedCache=new Set\(\)/);
});
test('mesma referência de posse entre quadros sem novas alocações',()=>{
 const s=scene(),first=s.claimed();assert.equal(first.size,144);
 for(let i=0;i<100;i++)assert.strictEqual(s.claimed(),first);
 assert.ok(first.has('80,80'));assert.ok(!first.has('95,80'));
});
test('conquista invalida cache mesmo com mutação do mesmo array',()=>{
 const s=scene(),first=s.claimed();s.game.claim.push('95,80');
 const second=s.claimed();assert.notStrictEqual(first,second);assert.equal(second.size,288);
 assert.strictEqual(s.claimed(),second);
 s.game.claim.pop();assert.equal(s.claimed().size,144);
});
test('limites de mapa e regiões adjacentes sem vazamento',()=>{
 const s=scene(['159,159','-5,-5']);const cells=s.claimed();
 assert.equal(cells.size,16);assert.ok(cells.has('159,159'));assert.ok(!cells.has('160,159'));
 const q=scene(['80,80','83,80']);assert.equal(q.claimed().size,144);
});
test('desenho continua usando a mesma fronteira isométrica',()=>{
 assert.match(script,/let own=claimed\(\)/);
 assert.match(script,/if\(own\.has\(key\(x,y\)\)\)drawTerritoryEdge\(px,py,ww,hh,x,y,own\)/);
});
