'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('// v6.135: carvalhos isolados');
const end=script.indexOf('function meadowDetails(',start);
assert.ok(start>=0&&end>start,'funcoes de carvalho isolaveis');
const source=script.slice(start,end);
function scene({ww=74,hh=37,season=1,now=3000,layer='all',lower=-Infinity,upper=Infinity,seed=.99}={}){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const {drawFieldOak,fieldOakAt}=new Function('ctx','rnd',source+';return {drawFieldOak,fieldOakAt}')(ctx,()=>seed);
 const count=drawFieldOak(100,100,ww,hh,14,15,season,now,layer,lower,upper);
 return {count,calls,styles,fieldOakAt};
}
const drawn=s=>s.calls.filter(c=>!['save','restore'].includes(c[0])&&!(c[0]==='set'&&['lineCap','lineJoin'].includes(c[1])));
test('v6.135: sintaxe e progresso anterior preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|requestAnimationFrame|setInterval/);
});
test('carvalhos surgem apenas no bioma de pradaria e respeitam LOD',()=>{
 assert.equal(scene().fieldOakAt(14,15,2),true);
 assert.equal(scene().fieldOakAt(14,15,1),false);
 assert.equal(scene({seed:.2}).fieldOakAt(14,15,2),false);
 assert.equal(scene({ww:30}).count,0);
 assert.equal(scene({ww:30}).calls.length,0);
 assert.equal(scene().count,1);
});
test('sombras, troncos e copas possuem geometria ancorada ao solo',()=>{
 const s=scene();
 assert.ok(s.calls.some(c=>c[0]==='ellipse'));
 assert.ok(s.calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.ok(s.calls.some(c=>c[0]==='lineTo'));
 assert.ok(s.styles.includes('#15251c73'));
 assert.ok(s.styles.includes('#493a2c'));
 assert.ok(s.styles.includes('#3d7650'));
});
test('primavera, outono e inverno possuem silhuetas e paletas distintas',()=>{
 const spring=scene({season:0}),summer=scene({season:1}),autumn=scene({season:2}),winter=scene({season:3});
 assert.ok(spring.styles.includes('#87a968'));
 assert.ok(summer.styles.includes('#61966a'));
 assert.ok(autumn.styles.includes('#c09a4b'));
 assert.ok(winter.styles.includes('#dce7df'));
 assert.ok(!winter.styles.includes('#3d7650'));
 assert.ok(summer.calls.length>winter.calls.length);
});
test('camadas de profundidade recompõem a cena sem repetir sombras',()=>{
 const all=drawn(scene());
 const back=drawn(scene({layer:'back'}));
 const middle=drawn(scene({layer:'range',lower:-Infinity,upper:105}));
 const front=drawn(scene({layer:'front',lower:105}));
 assert.deepEqual([...back,...middle,...front],all);
 assert.equal(front.length,0);
 assert.ok(back.some(c=>c[0]==='ellipse'));
 assert.equal(drawn(scene({layer:'range',lower:-Infinity,upper:103})).length,0);
 assert.ok(drawn(scene({layer:'front',lower:103})).length>0);
 for(const season of [0,1,2,3]){
  const s=scene({season});
  assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
  assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
 }
 assert.notDeepEqual(drawn(scene({now:1000})),drawn(scene({now:3200})));
});
test('unidades intercalam com a arvore por profundidade dos pes',()=>{
 const a=script.indexOf('function drawFieldOakOccupiedTile(');
 const b=script.indexOf('function drawAlpineOccupiedTile(',a);
 assert.ok(a>0&&b>a);
 const events=[];
 const actors=[{u:{x:1,y:1}},{u:{x:2,y:2}}];
 const draw=new Function('tileActors','point','drawFieldOak','drawTileOccupants','forestSeason',
  script.slice(a,b)+';return drawFieldOakOccupiedTile')(
  ()=>actors,(x,y)=>[0,x+y],
  (...args)=>events.push(['oak',args[8],args[9],args[10]]),
  (...args)=>events.push(['unit',args[6][0]]),()=>2);
 draw(14,15,100,100,74,37,new Map(),new Map(),1,3000);
 assert.deepEqual(events.map(e=>e[0]),['oak','unit','oak','unit','oak']);
 assert.deepEqual(events.filter(e=>e[0]==='oak').map(e=>e.slice(1)),[
  ['range',-Infinity,2],['range',2,4],['front',4,undefined]
 ]);
});
test('integracao evita estruturas, estradas, ruinas, margens, pomares e nevoa',()=>{
 assert.match(script,/const fieldOakOpen=b===2&&visibleFog\[y\*W\+x\]&&!ruinKind&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)&&!riparianMask\[y\*W\+x\]&&!orchardOpen&&fieldOakAt/);
 assert.match(script,/if\(fieldOakOpen\)drawFieldOak\(/);
 assert.match(script,/else if\(fieldOakActors\?\.length\)drawFieldOakOccupiedTile\(/);
 assert.match(script,/if\(visibleFog\[y\*W\+x\]\)for\(const u of enemyTiles/);
});
