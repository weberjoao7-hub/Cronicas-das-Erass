'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function fogRevealAlpha(');
const end=script.indexOf('function save()',start);
assert.ok(start>0&&end>start,'transição e atualização da névoa isoláveis');
const source=script.slice(start,end);
function harness(){
 const W=4,H=4,visibleFog=new Uint8Array(W*H),exploredFog=new Uint8Array(W*H);
 const fogRevealAt=new Float64Array(W*H),fogRevealWasExplored=new Uint8Array(W*H);
 const fogImage={data:new Uint8ClampedArray(W*H*4)};
 const fogCtx={putImageData(){}},game={buildings:[{x:1,y:1,t:'Aldeia'}],units:[]};
 let cells=[5];
 const sightCells=()=>cells,ownedRegions=()=>[];
 const api=new Function('W','H','visibleFog','exploredFog','fogRevealAt','fogRevealWasExplored',
  'fogImage','fogCtx','game','sightCells','ownedRegions','REGION_SIZE',
  'let fogInitialized=false,fogRevision=0,dirty=false;'+source+
  'return {updateVisibility,fogRevealAlpha};')(
  W,H,visibleFog,exploredFog,fogRevealAt,fogRevealWasExplored,
  fogImage,fogCtx,game,sightCells,ownedRegions,4);
 return {...api,visibleFog,exploredFog,fogRevealAt,fogRevealWasExplored,fogImage,game,
  setCells:(next)=>{cells=next}};
}
test('v6.170 compila e preserva visibilidade, minimapa e salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/fogRevealAlpha\(frameTime-started,!!fogRevealWasExplored\[i\]\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.explored\s*=/);
});
test('fade quadrático determinístico, sem opacidade negativa ou NaN',()=>{
 const a=harness().fogRevealAlpha;
 assert.equal(a(0,false),.96);
 assert.equal(a(0,true),.63);
 assert.ok(Math.abs(a(325,false)-.24)<1e-12);
 assert.ok(Math.abs(a(325,true)-.1575)<1e-12);
 for(const age of [-10,650,900,NaN,Infinity])assert.equal(a(age,false),0);
 assert.ok(a(100,false)>a(200,false));
});
test('primeira inicialização não pisca; nova área inicia transição',()=>{
 const h=harness();h.updateVisibility();
 assert.equal(h.visibleFog[5],1);
 assert.equal(h.fogRevealAt[5],0);
 h.setCells([6]);h.updateVisibility();
 assert.equal(h.visibleFog[5],0);
 assert.equal(h.visibleFog[6],1);
 assert.ok(h.fogRevealAt[6]>0);
 assert.equal(h.fogRevealWasExplored[6],0);
 assert.equal(h.fogImage.data[6*4+3],0);
 assert.equal(h.fogImage.data[5*4+3],155);
});
test('regresso a terreno explorado começa em meia-sombra; fora de visão zera relógio',()=>{
 const h=harness();h.updateVisibility();
 h.setCells([6]);h.updateVisibility();
 h.setCells([5]);h.updateVisibility();
 assert.ok(h.fogRevealAt[5]>0);
 assert.equal(h.fogRevealWasExplored[5],1);
 assert.equal(h.fogRevealAt[6],0);
 h.setCells([5]);h.updateVisibility();
 assert.ok(h.fogRevealAt[5]>0,'não reinicia animação em área continuamente visível');
});
test('revelação é apenas gráfica: não muda unidades nem construções',()=>{
 const h=harness(),before=JSON.stringify(h.game);
 h.updateVisibility();h.setCells([7,8]);h.updateVisibility();
 assert.equal(JSON.stringify(h.game),before);
 assert.equal(h.visibleFog[7],1);
 assert.equal(h.visibleFog[8],1);
 assert.equal(h.exploredFog[7],1);
 assert.equal(h.exploredFog[8],1);
});
test('Canvas desenha o fade somente em terrenos visíveis e encerra em 650ms',()=>{
 const from=script.indexOf('// Névoa sobre o mundo renderizado:');
 const to=script.indexOf('// Segunda passagem evita',from);
 assert.ok(from>0&&to>from);
 const fragment=script.slice(from,to),paint=new Function('bounds','W','visibleFog','exploredFog',
  'fogRevealAt','fogRevealWasExplored','fogRevealAlpha','frameTime','point','ww','hh','w','h','diamond',fragment);
 const h=harness(),visible=new Uint8Array([1,0,0,0]),explored=new Uint8Array([1,0,0,0]);
 const starts=new Float64Array([1000,0,0,0]),prior=new Uint8Array(4),draws=[];
 const args=[{minX:0,maxX:1,minY:0,maxY:1},2,visible,explored,starts,prior,h.fogRevealAlpha,
  1000,(x,y)=>[x*40,y*20],40,20,200,200,(...a)=>draws.push(a)];
 paint(...args);
 assert.ok(draws.some(d=>String(d[4]).includes('0.960')));
 assert.ok(draws.some(d=>d[4]==='#06111d'));
 draws.length=0;args[7]=1700;paint(...args);
 assert.equal(starts[0],0);
 assert.ok(!draws.some(d=>String(d[4]).includes('rgba')));
});
