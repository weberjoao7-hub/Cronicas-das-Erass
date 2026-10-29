'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('let placementPointerId=null;');
const end=script.indexOf("C.addEventListener('pointerdown'",start);
assert.ok(start>0&&end>start,'funções de prévia por toque presentes');
const helpers=script.slice(start,end);
function scene(tileAt=()=>({x:12,y:13}),reason=null){
 const placed=[],hint={textContent:'',style:{}};
 const run=new Function('tileAt','buildValidation','placeBuilding','placementHint',`
  let placing='Cabana',hoverTile=null,dirty=false,dragged=false,down={},pinchState={};
  let pointers=new Map([[5,{x:10,y:10}]]);const W=160,H=160;
  ${helpers}
  placementPointerId=5;
  return {preview:placementPreviewAt,finish:finishTouchPlacement,pointers,
   state:()=>({hoverTile,dirty,dragged,placementPointerId})};
 `);
 return {...run(tileAt,()=>reason,(t,x,y)=>placed.push({t,x,y}),hint),hint,placed};
}
test('v6.91: sintaxe, versão e salvamento legado preservados',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.91<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(helpers,/localStorage\.|game\.buildings\.push/);
});
test('prévia por toque informa posição e validade antes de gastar recursos',()=>{
 const ok=scene(),bad=scene(()=>({x:9,y:10}),'Área ocupada');
 assert.deepEqual(ok.preview(100,110),{x:12,y:13});
 assert.deepEqual(ok.state().hoverTile,{x:12,y:13});
 assert.match(ok.hint.textContent,/solte para construir/);
 bad.preview(10,20);
 assert.match(bad.hint.textContent,/Área ocupada/);
 assert.equal(bad.hint.style.color,'#ffd0c2');
 assert.equal(ok.placed.length,0);
});
test('soltar um toque arrastado constrói exatamente uma vez',()=>{
 const s=scene();
 assert.equal(s.finish({pointerId:5,clientX:100,clientY:110}),true);
 assert.deepEqual(s.placed,[{t:'Cabana',x:12,y:13}]);
 assert.equal(s.state().placementPointerId,null);
 assert.equal(s.pointers.size,0);
 assert.equal(s.finish({pointerId:5,clientX:100,clientY:110}),false);
});
test('toque fora do mapa não cria edifícios nem modifica recursos',()=>{
 const s=scene(()=>({x:-1,y:161}));
 assert.equal(s.finish({pointerId:5,clientX:-20,clientY:500}),true);
 assert.equal(s.placed.length,0);
});
test('pinça com dois dedos nunca confirma uma obra',()=>{
 const s=scene();s.pointers.set(6,{x:20,y:30});
 assert.equal(s.finish({pointerId:5,clientX:100,clientY:110}),false);
 assert.equal(s.placed.length,0);
 assert.match(script,/if\(pointers\.size>=2\)placementPointerId=null;/);
});
test('movimento da prévia não desloca câmera e mouse mantém navegação',()=>{
 const line=script.split('\n').find(l=>l.startsWith("C.addEventListener('pointermove',e=>{"));
 assert.ok(line);
 const preview=line.indexOf('if(placing&&placementPointerId===e.pointerId&&pointers.size===1)');
 const pan=line.indexOf('cx=Math.max(0,Math.min(W-1,cx-');
 assert.ok(preview>=0&&pan>preview);
 assert.match(line,/placementPreviewAt\(e\.clientX,e\.clientY\);dragged=true;return/);
 assert.match(script,/e\.pointerType!=='mouse'/);
 assert.match(script,/if\(finishTouchPlacement\(e\)\)return/);
});
