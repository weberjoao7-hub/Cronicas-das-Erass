'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('function drawVillageStockpiles('),b=script.indexOf('// v6.84: praça viva',a);
assert.ok(a>=0&&b>a,'renderizador de estoques presente');
const source=script.slice(a,b);
function scene({ww=96,era=3,season=1,visible=true,stocks={wood:50,stone:60,food:100,ore:80}}={}){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'coordenadas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const fn=new Function('ctx','forestSeason',source+';return drawVillageStockpiles;')(ctx,()=>season);
 const count=fn(210,170,ww,ww*.52,era,stocks,season,visible);
 return {count,calls,styles};
}
test('v6.88: JavaScript completo compila e salvamento anterior permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=88);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('estoques reais controlam a quantidade de pilhas',()=>{
 assert.equal(scene().count,4);
 assert.equal(scene({stocks:{wood:0,stone:0,food:0,ore:0}}).count,0);
 assert.equal(scene({stocks:{wood:12,stone:11,food:0,ore:0}}).count,1);
 assert.ok(scene({stocks:{wood:200}}).calls.length>scene({stocks:{wood:12}}).calls.length);
});
test('LOD móvel e névoa ocultam detalhes e valores econômicos',()=>{
 assert.equal(scene({ww:30}).count,0);
 assert.equal(scene({ww:58}).count,2);
 assert.equal(scene({ww:96,visible:false}).count,0);
 assert.equal(scene({ww:96,visible:false}).calls.length,0);
});
test('madeira, pedras, mantimentos e minério têm silhuetas distintas',()=>{
 const woods=scene({stocks:{wood:100}});
 const stones=scene({stocks:{stone:100}});
 const food=scene({stocks:{food:100}});
 const ore=scene({stocks:{ore:100}});
 assert.ok(woods.calls.some(c=>c[0]==='ellipse'));
 assert.ok(stones.calls.some(c=>c[0]==='lineTo'));
 assert.ok(food.styles.includes('#b99b67'));
 assert.ok(ore.calls.some(c=>c[0]==='fillRect'));
});
test('eras e inverno mudam os materiais sem aleatoriedade',()=>{
 const early=scene(),modern=scene({era:7}),winter=scene({season:3});
 assert.ok(early.styles.includes('#795032'));
 assert.ok(modern.styles.includes('#75604a'));
 assert.ok(winter.styles.includes('#eff5eb'));
 assert.deepEqual(scene(),scene());
});
test('Canvas equilibrado e renderização entre salão e transeuntes',()=>{
 const s=scene();
 assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 const square=script.indexOf('drawVillageSquare(px,py,ww,hh,x,y)');
 const hall=script.indexOf('drawTownHallEraDetails(px,py,ww,hh,game.era,frameTime)',square);
 const stock=script.indexOf('drawVillageStockpiles(px,py,ww,hh,game.era,game,forestSeason(),visibleFog[y*W+x])',hall);
 const villagers=script.indexOf("drawVillageLife(px,py,ww,hh,game.era,frameTime,'front'",hall);
 assert.ok(square>=0&&hall>square&&stock>hall&&villagers>stock);
});
