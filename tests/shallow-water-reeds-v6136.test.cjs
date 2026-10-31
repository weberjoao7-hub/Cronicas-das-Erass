'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('// v6.136: taboas'),end=script.indexOf('function drawShoreLilies(',start);
assert.ok(start>=0&&end>start,'renderer de juncos isolavel');
const source=script.slice(start,end);
function scene({ww=80,hh=40,mask=15,season=1,now=3000,seed=.6}={}){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawShallowWaterReeds')(ctx,()=>seed);
 const painted=draw(100,100,ww,hh,14,18,mask,season,now);
 return {painted,calls,styles};
}
test('v6.136: sintaxe, versao e salvamento legado preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/Math\.random|localStorage|requestAnimationFrame|setInterval/);
});
test('margens por bitmask e densidade deterministica',()=>{
 assert.equal(scene({mask:0}).painted,0);
 for(const mask of [1,2,4,8])assert.equal(scene({mask}).painted,2);
 assert.equal(scene({mask:15}).painted,8);
 assert.equal(scene({mask:15,seed:.1}).painted,0);
 assert.deepEqual(scene().calls,scene().calls);
});
test('LOD reduz trabalho em zoom distante e remove vegetacao fora da tela',()=>{
 assert.equal(scene({ww:39}).painted,0);
 assert.equal(scene({hh:17}).painted,0);
 assert.equal(scene({ww:55}).painted,4);
 assert.equal(scene({ww:80}).painted,8);
 assert.ok(scene({ww:100}).calls.length>scene({ww:80}).calls.length);
});
test('sombra submersa, reflexo, folhas e espigas ancoradas',()=>{
 const s=scene();
 assert.ok(s.calls.some(c=>c[0]==='ellipse'));
 assert.ok(s.calls.some(c=>c[0]==='quadraticCurveTo'));
 assert.ok(s.calls.some(c=>c[0]==='moveTo'));
 assert.ok(s.styles.includes('#0d394153'));
 assert.ok(s.styles.includes('#664d36'));
 assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
});
test('quatro estacoes apresentam cores de folhas e espigas diferentes',()=>{
 const spring=scene({season:0}),summer=scene({season:1}),autumn=scene({season:2}),winter=scene({season:3});
 assert.ok(spring.styles.includes('#8ba966'));
 assert.ok(summer.styles.includes('#719451'));
 assert.ok(autumn.styles.includes('#b3a063'));
 assert.ok(winter.styles.includes('#a5a48a'));
 assert.ok(winter.styles.includes('#a69c85'));
 assert.ok(!winter.styles.includes('#664d36'));
});
test('vento anima os caules sem alterar a distribuicao das touceiras',()=>{
 const a=scene({now:1000}),b=scene({now:3900});
 assert.equal(a.painted,b.painted);
 assert.notDeepEqual(a.calls,b.calls);
 assert.deepEqual(a.calls.filter(c=>c[0]==='ellipse').length,b.calls.filter(c=>c[0]==='ellipse').length);
});
test('integracao impede barcos, construcoes e nevoa e usa apenas lagos',()=>{
 assert.match(script,/if\(b===0&&shoreMask\[y\*W\+x\]&&visibleFog\[y\*W\+x\]&&q>\.34&&!structures\.has\(key\(x,y\)\)&&!boatTiles\.has\(key\(x,y\)\)\)drawShallowWaterReeds/);
 assert.match(script,/drawShallowWaterReeds\(px,py,ww,hh,x,y,shoreMask\[y\*W\+x\],forestSeason\(\),frameTime\)/);
});
