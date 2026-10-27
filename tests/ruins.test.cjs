'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
function part(a,b){const x=script.indexOf(a),y=script.indexOf(b,x+a.length);assert.ok(x>=0&&y>x,a);return script.slice(x,y)}
const locate=part('function ruinAt(','const ruinSites=');
const draw=part('function drawAncientRuin(','function drawLandmark(');
const explore=part('function exploreRuin(','function tileMenu(');
const ruinAt=new Function('biome','rnd','W','H',locate+';return ruinAt;')(()=>2,()=>.5,160,160);
function render(kind='obelisk',width=74,explored=false,now=1000){
 const ops=[],ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>ops.push([k,args]);},set(o,k,v){o[k]=v;return true}});
 new Function('ctx','scale',draw+';return drawAncientRuin;')(ctx,1)(100,100,width,width/2,kind,explored,now);return ops;
}
test('script principal tem sintaxe válida',()=>assert.doesNotThrow(()=>new Function(script)));
test('ruína inicial fica perto da aldeia e é determinística',()=>{assert.equal(ruinAt(82,81),'obelisk');assert.equal(ruinAt(80,80),null);assert.equal(ruinAt(0,0),null)});
test('obelisco e colunata são desenhados em perspectiva',()=>{assert.ok(render('obelisk').filter(x=>x[0]==='fill').length>=8);assert.ok(render('columns').filter(x=>x[0]==='fill').length>=12)});
test('detalhes diminuem no zoom distante e animação é determinística',()=>{assert.deepEqual(render('obelisk',74,false,1234),render('obelisk',74,false,1234));assert.ok(render('obelisk',22).length<render('obelisk',74).length);assert.equal(render('obelisk',16).length,0)});
test('investigação só concede recursos uma vez e registra o save',()=>{
 const game={claim:['80,80'],ruinsExplored:[],stone:0,ore:0,wood:0,food:100},fog=new Uint8Array(160*160);fog[81*160+82]=1;
 let saved=0;const spend=(w,f)=>{if(game.food<f)return false;game.food-=f;return true};
 const fn=new Function('game','key','ownedTile','exploredFog','ruinAt','at','spend','refresh','toast','W',explore+';return exploreRuin;')(game,(x,y)=>x+','+y,(x,y)=>game.claim.some(id=>{const [rx,ry]=id.split(',').map(Number);return Math.floor(rx/12)===Math.floor(x/12)&&Math.floor(ry/12)===Math.floor(y/12)}),fog,ruinAt,()=>null,spend,()=>saved++,()=>{},160);
 assert.equal(fn(82,81),true);assert.deepEqual([game.food,game.stone,game.ore],[85,30,18]);assert.equal(fn(82,81),false);assert.equal(saved,1);
});
test('sem domínio ou exploração prévia não há recompensa',()=>{
 const game={claim:[],ruinsExplored:[],stone:0,ore:0,wood:0,food:100},fog=new Uint8Array(160*160);let spent=0;
 const fn=new Function('game','key','ownedTile','exploredFog','ruinAt','at','spend','refresh','toast','W',explore+';return exploreRuin;')(game,(x,y)=>x+','+y,(x,y)=>game.claim.some(id=>{const [rx,ry]=id.split(',').map(Number);return Math.floor(rx/12)===Math.floor(x/12)&&Math.floor(ry/12)===Math.floor(y/12)}),fog,ruinAt,()=>null,()=>{spent++;return true},()=>{},()=>{},160);
 assert.equal(fn(82,81),false);game.claim.push('82,81');assert.equal(fn(82,81),false);assert.equal(spent,0);
});
test('minimapa, bloqueio de obras, névoa e save antigo integrados',()=>{
 for(const marker of ['ruinSites','visibleAt(site.x+.5,site.y+.5)','drawAncientRuin(px,py,ww,hh,ruinKind','Investigue as ruínas antes de construir','ruinsExplored','cronicas-v04'])assert.ok(script.includes(marker),marker);
});
