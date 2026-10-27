'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const svg=fs.readFileSync(path.join(root,'assets/cronicas_cavalaria_atlas.svg'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const begin=script.indexOf('function drawPaintedCavalry(');
const end=script.indexOf('function drawCavalrySprite(',begin);
assert.ok(begin>=0&&end>begin,'cavalry atlas renderer');
const source=script.slice(begin,end);
function render(era,{zoom=1.2,loaded=true,moving=false,attackAt=0,hitAt=0,now=1000,face=1,target=null}={}){
 const calls=[],ops=[];
 const ctx={save(){ops.push('save')},restore(){ops.push('restore')},translate(...v){ops.push(['translate',...v])},scale(...v){ops.push(['scale',...v])},drawImage(...v){calls.push(v)}};
 const paintedCavalry={complete:loaded,naturalWidth:loaded?448:0,naturalHeight:loaded?448:0};
 const draw=new Function('ctx','paintedCavalry','game','Date',source+';return drawPaintedCavalry;')(ctx,paintedCavalry,{era},{now:()=>now});
 const u={x:40,y:40,face,attackAt,hitAt,path:moving?[target||{x:41,y:40}]:[]};
 return {drawn:draw(u,200,220,zoom),calls,ops};
}
test('main script parses and legacy save remains unchanged',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/paintedCavalry\.src='assets\/cronicas_cavalaria_atlas\.svg'/);
 assert.match(script,/typeof drawPaintedCavalry==='function'/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('16 transparent cavalry frames, with distinct period palettes and poses',()=>{
 assert.match(svg,/<svg[^>]*width="448"[^>]*height="448"/);
 assert.equal([...svg.matchAll(/data-frame="\d-\d"/g)].length,16);
 for(let era=0;era<4;era++)for(let pose=0;pose<4;pose++)assert.ok(svg.includes('data-frame="'+era+'-'+pose+'"'));
 assert.ok(!/<(?:image|foreignObject|script)\b/i.test(svg));
 assert.ok(svg.includes('#a43e39')&&svg.includes('#345c70'));
 assert.equal([...svg.matchAll(/clip-path="url\(#frameClip\)"/g)].length,16,'frames are isolated to avoid neighboring-row bleed');
});
test('eight eras select correct rows and idle pose',()=>{
 for(let era=0;era<8;era++){
  const r=render(era);assert.equal(r.drawn,true);assert.equal(r.calls.length,1);
  assert.deepEqual(r.calls[0].slice(1,5),[0,Math.floor(era/2)*112,112,112]);
 }
});
test('gallop alternates frames and attack overrides movement',()=>{
 assert.equal(render(4,{moving:true,now:1000}).calls[0][1],112);
 assert.equal(render(4,{moving:true,now:1160}).calls[0][1],224);
 assert.equal(render(4,{moving:true,now:1160,attackAt:1100}).calls[0][1],336);
});
test('fallback for zoom, failed load, and recent damage',()=>{
 assert.equal(render(4,{zoom:.7}).drawn,false);
 assert.equal(render(4,{loaded:false}).drawn,false);
 assert.equal(render(4,{hitAt:950}).drawn,false);
 assert.equal(render(4,{zoom:.82}).drawn,true);
});
test('mirroring, grounded hooves, and isolated canvas state',()=>{
 const r=render(6,{face:-1});
 assert.deepEqual(r.ops,[ 'save',['translate',200,220],['scale',-1,1],'restore']);
 const args=r.calls[0],h=args[8];
 assert.ok(Math.abs(args[6]+h*101/112)<1e-9);
 assert.equal(args[5],-args[7]/2);
});
