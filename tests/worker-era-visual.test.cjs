'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Script principal ausente');
const part=(start,end)=>{
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Âncoras não encontradas: '+start+' / '+end);
 return script.slice(a,b);
};
const ImageMock=function(){this.src='';this.complete=true;this.naturalWidth=336};
function sprites(){
 return new Function('Image','game',part('const villagerFrames=new Map();','// Atlas ilustrado opcional')+
  ';return {villagerSprite,villagerFrames,villagerEraTier};')(ImageMock,{era:0});
}
test('JavaScript do jogo compila e mantém salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
});
test('trabalhadores apresentam quatro trajes conforme as oito eras',()=>{
 const {villagerSprite,villagerEraTier}=sprites();
 assert.deepEqual([0,1,2,3,4,5,6,7].map(villagerEraTier),[0,0,1,1,2,2,3,3]);
 const sources=[0,2,4,7].map(era=>decodeURIComponent(villagerSprite('wood',0,era).src));
 assert.equal(new Set(sources).size,4);
 assert.ok(sources[0].includes('#bfa178'),'traje de tecido da era inicial');
 assert.ok(sources[2].includes('#7fa5bc'),'traje medieval');
 assert.ok(sources[3].includes('#e5ba46'),'capacete da era atual');
});
test('cache reutiliza quadros da mesma faixa histórica',()=>{
 const {villagerSprite,villagerFrames}=sprites();
 const first=villagerSprite('farm',1,0);
 assert.strictEqual(villagerSprite('farm',1,1),first);
 assert.notStrictEqual(villagerSprite('farm',1,2),first);
 assert.equal(villagerFrames.size,2);
});
test('efeitos de madeira, pedra, agricultura e construção respeitam LOD',()=>{
 const calls=[];
 const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>calls.push([k,...args])},set(o,k,v){o[k]=v;return true}});
 const fx=new Function('ctx',part('function drawWorkerTaskProps(','function drawVillagerAtlas(')+';return drawWorkerTaskProps;')(ctx);
 fx(10,20,.6,'wood',1200);
 assert.equal(calls.length,0,'zoom distante não deve desenhar props');
 const signatures=[];
 for(const job of ['wood','stone','farm','build']){
  calls.length=0;fx(10,20,1.3,job,1200);
  assert.ok(calls.length>12,'efeito ausente: '+job);
  signatures.push(JSON.stringify(calls));
 }
 assert.equal(new Set(signatures).size,4,'cada tarefa tem cenário próprio');
});
test('atlas genérico não esconde animações de trabalho ou roupas modernas',()=>{
 const calls=[];
 const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>calls.push([k,...args])},set(o,k,v){o[k]=v;return true}});
 const code=part('function drawPaintedVillager(','// Props de coleta no chão');
 const game={era:0},atlas={complete:true,naturalWidth:336};
 const draw=new Function('ctx','paintedVillagers','game',code+';return drawPaintedVillager;')(ctx,atlas,game);
 const u={x:10,y:10,path:[],face:1};
 assert.equal(draw(u,20,20,1.2,'wood',false,0),false);
 assert.equal(draw(u,20,20,1.2,'walk',true,0),true);
 game.era=4;
 assert.equal(draw(u,20,20,1.2,'idle',false,0),false);
 assert.ok(calls.some(op=>op[0]==='drawImage'));
});
