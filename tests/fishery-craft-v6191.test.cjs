'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const a=script.indexOf('function drawFisheryCraftDetails(');
const b=script.indexOf('// v6.100: atividade portuaria',a);
assert.ok(a>=0&&b>a,'helper da casa de pesca presente');
const source=script.slice(a,b);
function scene({width=70,era=2,level=2,height=36}={}){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')
    assert.ok(Number.isFinite(value),'coordenada finita: '+k);
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;styles.push([k,v]);return true;}
 });
 const fn=new Function('ctx','scale',source+'return drawFisheryCraftDetails;')(ctx,1);
 const result=fn(180,140,width,height,era,level);
 return {result,calls,styles};
}
test('v6.191: sintaxe do jogo e persistencia intactas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|setInterval|requestAnimationFrame/);
});
test('detalhes so sao desenhados com zoom suficiente',()=>{
 const s=scene({width:24});
 assert.equal(s.result,0);
 assert.equal(s.calls.length,0);
 assert.equal(scene({width:42}).result,1);
});
test('duas aguas do telhado e rede de pesca sao renderizadas',()=>{
 const s=scene();
 assert.ok(s.calls.filter(x=>x[0]==='moveTo').length>=16);
 assert.ok(s.calls.filter(x=>x[0]==='lineTo').length>=16);
 assert.equal(s.calls.filter(x=>x[0]==='ellipse').length,3);
});
test('detalhes variam conforme era e nivel sem alterar geometria base',()=>{
 const early=scene({era:0,level:1,width:70});
 const modern=scene({era:7,level:3,width:70});
 assert.notDeepEqual(early.styles,modern.styles);
 assert.equal(early.calls.filter(x=>x[0]==='ellipse').length,2);
 assert.equal(modern.calls.filter(x=>x[0]==='ellipse').length,3);
});
test('desenho deterministico, coordenadas finitas e Canvas equilibrado',()=>{
 const s=scene({width:95,era:4,level:3});
 assert.deepEqual(s,scene({width:95,era:4,level:3}));
 assert.equal(s.calls.filter(x=>x[0]==='save').length,1);
 assert.equal(s.calls.filter(x=>x[0]==='restore').length,1);
 assert.ok(s.calls.length<190,'limite de operacoes no zoom alto');
});
test('integracao da rede ocorre dentro da casa de pesca, antes de restaurar Canvas',()=>{
 const start=script.indexOf('function drawFisheryHut(');
 const end=script.indexOf('// v6.191:',start);
 const hut=script.slice(start,end);
 assert.ok(hut.includes('drawFisheryCraftDetails(px,py,ww,hh,e,lv);'));
 assert.ok(hut.indexOf('drawFisheryCraftDetails(')<hut.lastIndexOf('ctx.restore();'));
 assert.ok(hut.includes('if(ww<22)return;'));
});
