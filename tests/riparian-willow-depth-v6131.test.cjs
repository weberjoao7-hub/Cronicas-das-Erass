'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawRiparianVegetation('),end=script.indexOf('function rock(',start);
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
let willow=null;
for(let x=1;x<60&&!willow;x++)for(let y=1;y<60;y++)if(rnd(x,y,183)>.72){willow=[x,y];break}
assert.ok(willow);
function scene({season=1,layer='all',lower=-Infinity,upper=Infinity,width=90,mask=15,now=3000}={}){
 const calls=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+String(k));
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}});
 const draw=new Function('ctx','rnd',source+';return drawRiparianVegetation')(ctx,rnd);
 const result=draw(180,160,width,width/2,...willow,mask,now,layer,lower,upper,season);
 return {calls:calls.filter(c=>!['save','restore'].includes(c[0])),result};
}
test('v6.131: sintaxe, versao e save preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 const version=html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/);
 assert.ok(version&&Number(version[1])>=131,'versao nao pode regredir abaixo da v6.131');
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|requestAnimationFrame/);
});
test('pintura em camadas preserva o desenho integral em todas as estacoes',()=>{
 for(const season of [0,1,2,3]){
  const all=scene({season}).calls;
  const split=[
   ...scene({season,layer:'back',lower:-Infinity}).calls,
   ...scene({season,layer:'range',lower:-Infinity,upper:164}).calls,
   ...scene({season,layer:'front',lower:164}).calls
  ];
  assert.deepEqual(split,all,'estacao '+season);
 }
});
test('sombra e juncos sao pintados apenas na camada do solo',()=>{
 const back=scene({layer:'back',lower:-Infinity});
 const front=scene({layer:'front',lower:-Infinity});
 assert.ok(back.calls.length>0);
 assert.ok(front.calls.length>0);
 assert.equal(front.calls.filter(c=>c[0]==='ellipse').length,12);
 assert.ok(back.calls.filter(c=>c[0]==='ellipse').length<front.calls.filter(c=>c[0]==='ellipse').length);
});
test('outono altera a paleta e inverno retira a copa verde',()=>{
 const colors=season=>scene({season}).calls.filter(c=>c[0]==='set'&&c[1]==='fillStyle').map(c=>c[2]);
 const summer=colors(1),autumn=colors(2),winter=colors(3);
 assert.ok(summer.includes('#386a49'));
 assert.ok(autumn.includes('#987c3d'));
 assert.ok(!winter.includes('#386a49')&&!winter.includes('#987c3d'));
 assert.ok(winter.includes('#122b2266'));
});
test('LOD e bitmask evitam vegetacao fora das margens',()=>{
 assert.equal(scene({width:27}).result,0);
 assert.equal(scene({mask:0}).result,0);
 assert.ok(scene({width:74}).calls.length>scene({width:38}).calls.length);
});
test('atores sao intercalados por profundidade com as copas',()=>{
 const a=script.indexOf('function drawRiparianOccupiedTile(');
 const b=script.indexOf('function drawForestOccupiedTile(',a);
 assert.ok(a>0&&b>a);
 const events=[],actors=[{u:{x:1,y:1}},{u:{x:2,y:2}}];
 const draw=new Function('tileActors','point','drawRiparianVegetation','drawTileOccupants','riparianMask','W','forestSeason',script.slice(a,b)+';return drawRiparianOccupiedTile')(
  ()=>actors,(x,y)=>[0,x+y],
  (...args)=>events.push(['willow',args[8],args[9],args[10]]),
  (...args)=>events.push(['unit',args[6][0]]),new Uint8Array(160*160),160,()=>2);
 draw(21,32,180,160,90,45,new Map(),new Map(),1,3000);
 assert.deepEqual(events.map(e=>e[0]),['willow','unit','willow','unit','willow']);
 assert.deepEqual(events.filter(e=>e[0]==='willow').map(e=>e.slice(1)),[
  ['range',-Infinity,2],['range',2,4],['front',4,Infinity]
 ]);
});
test('integracao respeita bioma, estradas, edificios e nevoa',()=>{
 assert.match(script,/const riparianActors=\(b===1\|\|b===2\).*?!ruinKind&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)/);
 assert.match(script,/if\(riparianMask\[y\*W\+x\]\)drawRiparianVegetation/);
 assert.match(script,/else if\(riparianActors\?\.length\)drawRiparianOccupiedTile/);
 assert.match(script,/if\(visibleFog\[y\*W\+x\]\)for\(const u of enemyTiles/);
});
