'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('// v6.104: cartografia do minimapa'),b=script.indexOf('function resize(){',a);
assert.ok(a>=0&&b>a,'funções de cartografia isoláveis');
const code=script.slice(a,b);
function scene(){
 const calls=[],styles=[],mc=new Proxy({},{
  get(o,k){if(k==='createImageData')return (w,h)=>{calls.push(['createImageData',w,h]);return {data:new Uint8ClampedArray(w*h*4)}};
   return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));calls.push([k,...args]);};},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const W=160,H=160,terrain=new Uint8Array(W*H).fill(2),waterDepth=new Uint8Array(W*H).fill(1),riparianMask=new Uint8Array(W*H);
 const regions=new Set(['6,6','7,6']);
 const game={buildings:[{x:80,y:80}],units:[{x:80.5,y:80.5,kind:'worker'}],ruinsExplored:[],enemy:{x:91,y:86,hp:100},enemyUnits:[]};
 const factory=new Function('mc','terrain','waterDepth','riparianMask','rnd','W','H','REGION_SIZE','ownedRegions','game','ruinSites','visibleAt','key','fogCanvas','tileAt','w','h','selectedUnit','miniBase',code+'return {minimapTerrainColor,minimapRegionSegments,redrawMinimap,drawMinimap};');
 const api=factory(mc,terrain,waterDepth,riparianMask,(x,y,z)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)},W,H,12,()=>regions,game,[],()=>true,(x,y)=>x+','+y,{},(x,y)=>({x:x/5,y:y/5}),390,844,0,null);
 return {api,calls,styles,terrain,waterDepth,riparianMask,regions,game};
}
test('script completo compila e mantém salvamento legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=104);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('perímetro elimina divisórias internas entre regiões vizinhas',()=>{
 const {api}=scene();
 assert.equal(api.minimapRegionSegments(new Set(['6,6'])).length,4);
 assert.equal(api.minimapRegionSegments(new Set(['6,6','7,6'])).length,6);
 assert.equal(api.minimapRegionSegments(new Set(['6,6','7,6','6,7','7,7'])).length,8);
 assert.ok(!api.minimapRegionSegments(new Set(['6,6','7,6'])).some(s=>s[0]===84&&s[2]===84&&s[1]===72&&s[3]===84));
});
test('bordas do mapa são recortadas e entradas inválidas ignoradas',()=>{
 const {api}=scene();
 assert.deepEqual(api.minimapRegionSegments(new Set(['13,13','-1,0','x,1'])),[
  [156,156,160,156],[160,156,160,160],[160,160,156,160],[156,160,156,156]
 ]);
});
test('profundidade da água altera tonalidade de forma determinística',()=>{
 const s=scene(),{api}=s,i=12*160+20;
 s.terrain[i]=0;s.waterDepth[i]=1;
 const shallow=api.minimapTerrainColor(20,12);
 s.waterDepth[i]=7;const deep=api.minimapTerrainColor(20,12);
 assert.ok(deep[1]<shallow[1]&&deep[2]<shallow[2]);
 s.terrain[i]=5;const highland=api.minimapTerrainColor(20,12);
 assert.notDeepEqual(highland,deep);
 for(const color of [shallow,deep,highland])for(const c of color)assert.ok(Number.isInteger(c)&&c>=0&&c<=255);
 assert.deepEqual(api.minimapTerrainColor(20,12),highland);
});
test('atlas de pixels é calculado uma vez para múltiplos quadros',()=>{
 const s=scene();s.api.redrawMinimap();s.api.redrawMinimap();
 assert.equal(s.calls.filter(c=>c[0]==='createImageData').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='putImageData').length,2);
});
test('biomas não recebem tintura de posse; névoa e câmera continuam visíveis',()=>{
 const s=scene();s.api.drawMinimap();
 assert.ok(s.calls.filter(c=>c[0]==='stroke').length>=3);
 assert.ok(s.calls.some(c=>c[0]==='arc'&&c[1]===80.5));
 assert.ok(!s.styles.includes('#55ef9c'));
 assert.ok(!s.calls.some(c=>c[0]==='fillRect'&&c[3]===12&&c[4]===12));
 const fog=s.calls.findIndex(c=>c[0]==='drawImage'),lastStroke=s.calls.map(c=>c[0]).lastIndexOf('stroke');
 assert.ok(fog>=0&&lastStroke>fog);
 assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
});
test('integração mantém toque, pan, névoa e marcador de unidade',()=>{
 assert.match(script,/panMinimap\(e\.clientX,e\.clientY\)/);
 assert.match(code,/minimapRegionSegments\(ownedRegions\(\)\)/);
 assert.match(code,/game\.units\[selectedUnit\]/);
 assert.doesNotMatch(code,/localStorage|requestAnimationFrame|Math\.random/);
});
