'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function drawDock('),end=script.indexOf('/* Barcos: pesca',start);
assert.ok(start>=0&&end>start,'renderizador do cais');
const source=script.slice(start,end);
const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','arc','quadraticCurveTo','fillRect','strokeRect','translate','rotate']);
function render(era,level=1,width=74,activeBoat=false,now=1200){
 const calls=[],styles=[],huts=[];
 const ctx=new Proxy({},{get(o,k){
  if(methods.has(k))return (...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'coordenada finita '+k);
   calls.push([k,...args]);
  };return o[k];
 },set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}});
 const draw=new Function('ctx','scale','game','drawFisheryHut','Date',source+'return drawDock;')(
  ctx,width/74,{era},(...args)=>huts.push(args),{now:()=>now});
 draw(220,190,width,width*38/74,level,activeBoat);
 return {calls,styles,huts};
}
test('JavaScript compila e mantém o salvamento existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('o cais funciona em oito eras, três níveis e três zooms',()=>{
 for(let era=0;era<8;era++)for(let level=1;level<=3;level++)for(const width of [18,40,74]){
  const {calls,huts}=render(era,level,width);
  assert.ok(calls.length>10);
  assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
  assert.equal(huts.length,1);
 }
});
test('paleta histórica distinta para cada era',()=>{
 const colors=['#8d6a43','#b68c55','#c4ad83','#c9bba1','#8e8c82','#b6a58b','#657d87','#9ba9aa'];
 colors.forEach((color,era)=>assert.ok(render(era).styles.includes(color),'era '+era));
});
test('detalhes diminuem conforme o zoom sem remover o cais',()=>{
 for(let era=0;era<8;era++){
  const far=render(era,1,18),mid=render(era,1,40),near=render(era,1,74);
  assert.ok(near.calls.length>mid.calls.length);
  assert.ok(mid.calls.length>far.calls.length);
 }
});
test('barco atracado só é desenhado antes da inicialização da frota',()=>{
 assert.ok(render(2,1,74,false).calls.length>render(2,1,74,true).calls.length);
});
test('animação é determinística para o mesmo instante',()=>{
 assert.deepEqual(render(7,2,74,false,1500),render(7,2,74,false,1500));
 assert.notDeepEqual(render(7,2,74,false,1500).calls,render(7,2,74,false,2300).calls);
});
test('obra, prévia e pesqueiro pronto compartilham renderizador',()=>{
 assert.match(script,/drawDock\(px,py,ww,hh,1\)/);
 assert.match(script,/drawDock\(px,py,ww,hh,obj\.level,!!obj\.boat\)/);
 assert.match(script,/placing==='Pesqueiro'\)drawDock\(px,py,ww,hh,1\)/);
});
