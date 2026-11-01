'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('const sightCache=new Map();');
const end=script.indexOf('function updateVisibility(){',start);
assert.ok(start>0&&end>start,'helpers de linha de visao isolaveis');
const source=script.slice(start,end);
function scene(mountains=[],width=15,height=15){
 const blocked=new Set(mountains.map(p=>p.join(',')));
 return new Function('W','H','biome',source+'return {terrainSightClear,sightCells,sightCache};')
  (width,height,(x,y)=>blocked.has(x+','+y)?5:2);
}
test('script compila, save legado e renderizacao de nevoa preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.match(script,/fogCtx.putImageData\(fogImage,0,0\)/);
 assert.doesNotMatch(source,/localStorage|requestAnimationFrame|Math\.random/);
});
test('montanha e visivel, mas oculta o terreno atras dela',()=>{
 const s=scene([[5,4],[5,5],[5,6]]);
 assert.equal(s.terrainSightClear(2,5,5,5),true);
 assert.equal(s.terrainSightClear(2,5,8,5),false);
 assert.equal(s.sightCells(2,5,8).includes(5*15+5),true);
 assert.equal(s.sightCells(2,5,8).includes(5*15+8),false);
});
test('fresta diagonal entre duas montanhas nao revela terreno',()=>{
 const s=scene([[3,2],[2,3]]);
 assert.equal(s.terrainSightClear(2,2,4,4),false);
 assert.equal(scene([[3,2]]).terrainSightClear(2,2,4,4),true);
});
test('batedores movidos para tras da serra revelam o outro lado',()=>{
 const s=scene([[5,4],[5,5],[5,6]]);
 assert.equal(s.sightCells(2,5,8).includes(5*15+8),false);
 assert.equal(s.sightCells(7,5,4).includes(5*15+8),true);
});
test('alcance circular e limites do mapa sao respeitados',()=>{
 const s=scene(),a=s.sightCells(6,6,4);
 assert.ok(a.includes(6*15+6));
 assert.ok(a.includes(6*15+10));
 assert.ok(!a.includes(6*15+11));
 assert.ok(s.sightCells(0,0,8).every(i=>i>=0&&i<225));
 assert.equal(s.sightCells(Infinity,5,4).length,0);
 assert.equal(s.sightCells(-1,5,4).length,0);
 assert.equal(s.terrainSightClear(-1,0,1,1),false);
});
test('cache LRU reutiliza mascaras e nao cresce indefinidamente',()=>{
 const s=scene();
 const first=s.sightCells(6,6,5);
 assert.strictEqual(first,s.sightCells(6.2,6.4,5));
 for(let k=0;k<120;k++)s.sightCells(k%15,Math.floor(k/15),4);
 assert.ok(s.sightCache.size<=96);
});
test('torres e unidades exploradoras possuem alcances diferenciados',()=>{
 const visibility=script.slice(script.indexOf('function updateVisibility(){'),script.indexOf('function save(){'));
 assert.match(visibility,/for\(const i of sightCells\(x,y,r\)\)/);
 assert.match(visibility,/b\.t==='Torre'&&!b\.buildLeft\?9:5/);
 assert.match(visibility,/u\.kind==='cavalry'\?7:u\.kind==='archer'\?6/);
 assert.match(visibility,/if\(u\.hp<=0\)continue/);
 assert.match(visibility,/exploredFog\[i\]=1/);
 assert.match(script,/drawFogFrontier\(px,py,ww,hh,x,y,visibleFog,exploredFog\)/);
});
