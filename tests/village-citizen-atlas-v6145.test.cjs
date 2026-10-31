'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('function drawVillageCitizenAtlas(');
const end=script.indexOf('function drawVillageLife(',start);
assert.ok(start>0&&end>start,'helper do atlas da praça localizado');
const source=script.slice(start,end);
function scene({width=74,era=4,now=120000,index=1,loaded=true,hasImage=true}={}){
 const calls=[],frames=[];
 const ctx=new Proxy({},{
  get(target,key){return (...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenada Canvas finita');
   calls.push([key,...args]);
  }},
  set(target,key,value){calls.push(['set',key,value]);return true;}
 });
 const Image=hasImage?function Image(){}:undefined;
 const villagerSprite=(job,frame,tier)=>{
  frames.push([job,frame,tier]);
  return {complete:loaded,naturalWidth:loaded?48:0};
 };
 const draw=new Function('ctx','Image','villagerSprite',source+'return drawVillageCitizenAtlas;')(ctx,Image,villagerSprite);
 return {drawn:draw(200,150,width,era,now,index),calls,frames};
}
test('village atlas: JavaScript principal continua válido e salvamento preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('cidadãos usam quadros de caminhada por era e posição, sem imagens flutuantes',()=>{
 const a=scene({index:0}),b=scene({index:1}),c=scene({era:7,index:2});
 for(const result of [a,b,c]){
  assert.equal(result.drawn,true);
  assert.equal(result.calls.filter(c=>c[0]==='drawImage').length,1);
  assert.equal(result.calls.filter(c=>c[0]==='save').length,result.calls.filter(c=>c[0]==='restore').length);
  assert.equal(result.frames[0][0],'walk');
  assert.ok(result.frames[0][1]>=0&&result.frames[0][1]<4);
 }
 assert.notEqual(a.frames[0][1],b.frames[0][1]);
 assert.equal(c.frames[0][2],7);
});
test('mercador mantém cesto junto ao atlas, sem adicionar estado persistente',()=>{
 const merchant=scene({index:1}),other=scene({index:0});
 assert.ok(merchant.calls.some(c=>c[0]==='fillRect'));
 assert.ok(merchant.calls.some(c=>c[0]==='arc'));
 assert.ok(!other.calls.some(c=>c[0]==='fillRect'));
});
test('zoom distante não cria atlas nem executa desenho adicional',()=>{
 const far=scene({width:42}),medium=scene({width:55});
 for(const result of [far,medium]){
  assert.equal(result.drawn,false);
  assert.equal(result.frames.length,0);
  assert.equal(result.calls.length,0);
 }
});
test('imagem indisponível e Safari sem construtor Image preservam fallback procedural',()=>{
 for(const result of [scene({loaded:false}),scene({hasImage:false})]){
  assert.equal(result.drawn,false);
  assert.ok(!result.calls.some(c=>c[0]==='drawImage'));
 }
});
test('renderizador da praça usa atlas opcional antes do desenho procedural',()=>{
 const life=script.slice(end,script.indexOf('function drawTerritoryEdge(',end));
 const atlas=life.indexOf("drawVillageCitizenAtlas(x,y,ww,era,now,i)");
 const coat=life.indexOf('const coat=late?');
 assert.ok(atlas>=0&&coat>atlas);
 assert.match(life,/if\(typeof drawVillageCitizenAtlas==='function'&&drawVillageCitizenAtlas\(x,y,ww,era,now,i\)\)continue;/);
 assert.match(life,/if\(layer!=='front'\|\|!visible\)/);
});
