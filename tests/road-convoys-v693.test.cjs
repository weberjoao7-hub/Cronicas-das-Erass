'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf("let roadSignature=''");
const b=script.indexOf('// Caminhos isométricos:',a);
const c=script.indexOf('function drawRoadConvoy(');
const d=script.indexOf('// Praça central',c);
assert.ok(a>0&&b>a&&c>b&&d>c,'código das caravanas presente');
const roadSource=script.slice(a,b),drawSource=script.slice(c,d);
const key=(x,y)=>x+','+y;
function roads(buildings){
 const game={buildings};
 const routeFor=(_u,x,y)=>Array.from({length:Math.max(Math.abs(x-80),Math.abs(y-80))},
  (_,i)=>({x:80.5+(x-80)*(i+1)/Math.max(Math.abs(x-80),Math.abs(y-80)),
           y:80.5+(y-80)*(i+1)/Math.max(Math.abs(x-80),Math.abs(y-80))}));
 const api=new Function('game','key','routeFor','biome',roadSource+
 ';return {updateRoads,positions:roadConvoyPositions,routes:()=>roadCartRoutes};')(
  game,key,routeFor,()=>2);
 api.updateRoads();return api;
}
function scene(era=4,ww=74,now=2000){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{
  for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finite');
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','point','forestSeason','game',drawSource+
 ';return drawRoadConvoy;')(ctx,(x,y)=>[x*2,y*2],()=>1,{era});
 const count=draw({x:82.5,y:83.5,dx:1,dy:0,index:0},ww,ww*.52,era,now);
 return {count,calls,styles};
}
test('v6.93: JavaScript válido e formato de salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.(?:9[3-9]|[1-9][0-9]{2,})<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(roadSource+drawSource,/localStorage|setInterval|Math\.random/);
});
test('rotas de caravanas seguem caminhos A* concluídos e têm limite de três',()=>{
 const hub={x:80,y:80,t:'Aldeia'};
 const api=roads([hub,{x:86,y:80,t:'Cabana'},{x:90,y:80,t:'Mina'},
  {x:88,y:80,t:'Quartel'},{x:92,y:80,t:'Fazenda'},{x:82,y:80,t:'Moinho'}]);
 const routes=api.routes();
 assert.equal(routes.length,3);
 assert.deepEqual(routes.map(r=>r.path.length),[13,11,9]);
 assert.deepEqual(routes[0].path[0],{x:80.5,y:80.5});
 assert.equal(routes[0].path.at(-1).x,92.5);
});
test('canteiros incompletos não criam caravana e reconstrução atualiza o cache',()=>{
 const b={x:87,y:80,t:'Mina',buildLeft:4};
 const api=roads([{x:80,y:80,t:'Aldeia'},b]);
 assert.equal(api.routes().length,0);
 b.buildLeft=0;api.updateRoads();
 assert.equal(api.routes().length,1);
});
test('movimento de ida e volta é contínuo e determinístico',()=>{
 const api=roads([{x:80,y:80,t:'Aldeia'},{x:86,y:80,t:'Cabana'}]);
 const route=api.routes()[0],span=route.path.length-1;
 const start=api.positions(0,[route])[0],next=api.positions(1000,[route])[0];
 const turn=api.positions(span/.00065,[route])[0];
 const back=api.positions((span+1)/.00065,[route])[0];
 assert.equal(start.x,80.5);
 assert.ok(next.x>start.x);
 assert.ok(Math.abs(turn.x-86.5)<.00001);
 assert.ok(back.x<turn.x);
 assert.equal(back.dx,-1);
 assert.deepEqual(api.positions(1000,[route]),api.positions(1000,[route]));
 assert.deepEqual(api.positions(Infinity,[route]),[]);
});
test('LOD evita desenho no zoom distante; canvas tem estados equilibrados',()=>{
 const far=scene(4,28),near=scene(4,74);
 assert.equal(far.count,0);
 assert.equal(far.calls.length,0);
 assert.equal(near.count,1);
 assert.equal(near.calls.filter(c=>c[0]==='save').length,near.calls.filter(c=>c[0]==='restore').length);
 assert.ok(near.calls.some(c=>c[0]==='rotate'));
});
test('eras diferenciam carroça de suprimentos e caminhão industrial',()=>{
 const ancient=scene(0),medieval=scene(4),industrial=scene(7);
 assert.ok(ancient.styles.includes('#ad8754'),'carregador primordial');
 assert.ok(medieval.styles.includes('#75543c'),'cavalo nas eras históricas');
 assert.ok(industrial.styles.includes('#415a60'),'cabine do caminhão');
 assert.ok(industrial.styles.includes('#b4d1d3'),'vidro da cabine');
 assert.notDeepEqual(medieval.calls,industrial.calls);
});
test('renderização usa névoa e impede carroças sobre construções e água',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function spawnUnit('));
 assert.match(render,/roadConvoyPositions\(frameTime,roadCartRoutes,ww>=54\?3:1\)/);
 assert.match(render,/roadCart&&visibleFog\[y\*W\+x\]&&!structures\.has\(key\(x,y\)\)&&b!==0/);
 assert.match(render,/drawRoadConvoy\(roadCart,ww,hh,game\.era,frameTime\)/);
});
