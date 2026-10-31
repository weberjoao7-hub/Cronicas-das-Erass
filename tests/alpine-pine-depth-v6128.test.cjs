'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('// v6.126: pinheiros alpinos');
const end=script.indexOf('// Faces rochosas expostas em colinas',start);
const source=script.slice(start,end);
const make=()=>{
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;return true}});
 return {calls,draw:new Function('ctx','rnd',source+';return drawAlpinePines;')(ctx,()=>.9)};
};
test('v6.128: sintaxe e chave de salvamento preservadas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|setInterval|Math\.random/);
});
test('pintura integral e pintura em camadas sao geometricamente identicas',()=>{
 const all=make(),split=make(),args=[200,180,74,37,21,32,3,1600];
 all.draw(...args);
 split.draw(...args,'back',-Infinity);
 split.draw(...args,'range',-Infinity,190);
 split.draw(...args,'front',190);
 const drawing=c=>c.filter(v=>v[0]!=='save'&&v[0]!=='restore');
 assert.deepEqual(drawing(split.calls),drawing(all.calls));
});
test('sombras nao se repetem em camadas de profundidade',()=>{
 const back=make(),front=make();
 // Zoom medio evita os cascalhos extras que tambem usam elipses.
 back.draw(200,180,45,22.5,21,32,0,1600,'back',-Infinity);
 front.draw(200,180,45,22.5,21,32,0,1600,'front',-Infinity);
 assert.equal(back.calls.filter(v=>v[0]==='ellipse').length,1);
 assert.equal(front.calls.filter(v=>v[0]==='ellipse').length,0);
});
test('intercalacao respeita a profundidade de cada unidade',()=>{
 const a=script.indexOf('function drawAlpineOccupiedTile(');
 const b=script.indexOf('// Pomares ocupados:',a);
 assert.ok(a>0&&b>a);
 const events=[],actors=[{u:{x:1,y:1}},{u:{x:2,y:2}}];
 const draw=new Function('tileActors','point','drawAlpinePines','drawTileOccupants','forestSeason',
  script.slice(a,b)+';return drawAlpineOccupiedTile;')(
  ()=>actors,(x,y)=>[0,x+y],(...args)=>events.push(['pine',args[8],args[9],args[10]]),
  (...args)=>events.push(['unit',args[6][0]]),()=>3);
 draw(21,32,200,180,74,37,new Map(),new Map(),1,1600);
 assert.deepEqual(events.map(e=>e[0]),['pine','unit','pine','unit','pine']);
 assert.deepEqual(events.filter(e=>e[0]==='pine').map(e=>e.slice(1)),[
  ['range',-Infinity,2],['range',2,4],['front',4,undefined]]);
});
test('pinheiros ocupados so existem em terreno montanhoso livre e visivel',()=>{
 assert.match(script,/const alpineActors=b===5&&ww>13&&visibleFog\[y\*W\+x\]&&!ruinKind&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)/);
 assert.match(script,/if\(alpineActors\?\.length\)drawAlpinePines\(px,py,ww,hh,x,y,forestSeason\(\),frameTime,'back',-Infinity\)/);
 assert.match(script,/else if\(alpineActors\?\.length\)drawAlpineOccupiedTile/);
});
