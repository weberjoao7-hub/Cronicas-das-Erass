'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const slice=(a,b)=>{const x=script.indexOf(a),y=script.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,'marcadores: '+a);return script.slice(x,y)};
const recoilSource=slice('function atlasHitRecoil(','// v6.108:');
const cavalrySource=slice('function drawPaintedCavalry(','function drawCavalrySprite(');
const troopSource=slice('function drawPaintedTroop(','// v6.76:');
const recoil=new Function(recoilSource+'return atlasHitRecoil;')();
function render(kind,{now=1100,hitAt=1000,zoom=1.2,loaded=true,enemy=false}={}){
 const calls=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(k));calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;return true}
 });
 const u={kind:kind==='cavalry'?'cavalry':'warrior',x:80.5,y:80.5,face:1,hitAt,path:[]};
 const DateMock={now:()=>now},idle=()=>null,frames=()=>0;
 let ok;
 if(kind==='cavalry'){
  const draw=new Function('ctx','paintedCavalry','game','Date','atlasIdleMotion','strideFrame',recoilSource+cavalrySource+'return drawPaintedCavalry;')(
   ctx,{complete:loaded,naturalWidth:448,naturalHeight:448},{era:4},DateMock,idle,frames);
  ok=draw(u,160,210,zoom);
 }else{
  const draw=new Function('ctx','paintedTroops','game','Date','atlasIdleMotion','strideFrame',recoilSource+troopSource+'return drawPaintedTroop;')(
   ctx,{complete:loaded,naturalWidth:256,naturalHeight:896},{era:4},DateMock,idle,frames);
  ok=draw(u,160,210,zoom,false,false,false,now,1,enemy);
 }
 return {ok,calls,transforms:calls.filter(c=>c[0]==='transform')};
}
test('script completo compila e mantém salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(html,/<title>Crônicas das Eras v6\.144<\/title>/);
});
test('recuo não extrapola janela, não move os pés e não altera dados persistidos',()=>{
 assert.equal(recoil(null,1000),null);
 assert.equal(recoil({hitAt:1000},999),null);
 assert.equal(recoil({hitAt:1000},1190),null);
 assert.equal(recoil({hitAt:NaN},1050),null);
 assert.equal(recoil({hitAt:1000},NaN),null);
 assert.equal(recoil({hitAt:1000},1095).lean,.14);
 assert.equal(recoil({hitAt:1000},1095,true).lean,.095);
 assert.doesNotMatch(recoilSource,/localStorage|game\.|u\.hitAt\s*=/);
});
test('infantaria mantém o mesmo atlas durante impacto sem salto para fallback',()=>{
 const hit=render('troop',{now:1095}),idle=render('troop',{now:1300});
 assert.equal(hit.ok,true);assert.equal(idle.ok,true);
 assert.equal(hit.calls.filter(c=>c[0]==='drawImage').length,1);
 assert.equal(hit.transforms.length,1);assert.equal(idle.transforms.length,0);
 assert.ok(hit.transforms[0][3]>.13);
 assert.deepEqual(hit.calls.filter(c=>c[0]==='drawImage')[0].slice(1),
  idle.calls.filter(c=>c[0]==='drawImage')[0].slice(1));
 assert.equal(hit.calls.filter(c=>c[0]==='save').length,hit.calls.filter(c=>c[0]==='restore').length);
});
test('cavalaria recebe inclinação temporária mantendo contato dos cascos',()=>{
 const hit=render('cavalry',{now:1095}),idle=render('cavalry',{now:1300});
 assert.equal(hit.ok,true);assert.equal(idle.ok,true);
 assert.equal(hit.transforms.length,1);assert.equal(idle.transforms.length,0);
 assert.ok(hit.transforms[0][3]>.09);
 const image=hit.calls.find(c=>c[0]==='drawImage');
 assert.ok(image&&Math.abs(image[7]+image[9]*101/112)<1e-8);
 assert.equal(hit.calls.filter(c=>c[0]==='save').length,hit.calls.filter(c=>c[0]==='restore').length);
});
test('guarnições rivais preservam faixa vermelha durante o recuo',()=>{
 const hit=render('troop',{enemy:true,now:1080});
 assert.equal(hit.ok,true);
 assert.ok(hit.calls.some(c=>c[0]==='fill'));
 assert.equal(hit.calls.filter(c=>c[0]==='save').length,hit.calls.filter(c=>c[0]==='restore').length);
});
test('zoom distante e carregamento incompleto continuam usando fallback',()=>{
 for(const kind of ['troop','cavalry']){
  assert.equal(render(kind,{zoom:.55}).ok,false);
  assert.equal(render(kind,{loaded:false}).ok,false);
 }
 assert.doesNotMatch(script,/\(archer\|\|warrior\)&&!hit&&typeof paintedTroops/);
 assert.match(script,/if\(\(archer\|\|warrior\)&&typeof paintedTroops/);
});
