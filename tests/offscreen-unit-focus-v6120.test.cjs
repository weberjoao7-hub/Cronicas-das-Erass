'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal encontrado');
function segment(from,to){
 const a=script.indexOf(from),b=script.indexOf(to,a+from.length);
 assert.ok(a>=0&&b>a,'marcadores encontrados: '+from);
 return script.slice(a,b);
}
const code=segment('function offscreenUnitAnchor(','function drawOffscreenUnitIndicator(');
function fixture(){
 const state={unit:{x:900,y:300,hp:100,kind:'warrior'},visible:true,placing:false,command:null,marquee:null};
 const make=new Function('state',`
 let w=390,h=650,W=160,H=160,cx=80,cy=80,dirty=false,cameraFollowUnit={};
 let selectedUnit=0;
 const game={units:[state.unit]};
 const point=(x,y)=>[x,y];
 const visibleAt=()=>state.visible;
 ${code}
 return {anchor:()=>offscreenUnitAnchor(...point(state.unit.x,state.unit.y),w,h),
 focus:focusOffscreenUnitAt,
 camera:()=>({cx,cy,dirty,cameraFollowUnit}),
 setState:(values)=>Object.assign(state,values)};
 `);
 // Access guard variables via explicit setters in a second fixture when needed.
 return make(state);
}
test('v6.120: compila, mantem chave de salvamento e conecta o toque ao pointerup',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(script,/focusOffscreenUnitAt\(e\.clientX,e\.clientY\)/);
 assert.match(script,/pointers\.delete\(e\.pointerId\);pinchState=pinchSnapshot\(\);down=null/);
});
test('toque no marcador centraliza a camera e cancela acompanhamento anterior',()=>{
 const f=fixture(),a=f.anchor();
 assert.ok(a&&a.x>300);
 assert.equal(f.focus(a.x,a.y),true);
 assert.deepEqual(f.camera(),{cx:159,cy:159,dirty:true,cameraFollowUnit:null});
});
test('fora da area de toque de 24px nao centraliza a camera',()=>{
 const f=fixture(),a=f.anchor();
 assert.equal(f.focus(a.x-25,a.y),false);
 assert.equal(f.focus(NaN,a.y),false);
 assert.equal(f.focus(a.x,Infinity),false);
 assert.equal(f.camera().cx,80);
});
test('nevoa de guerra e unidades eliminadas bloqueiam a navegacao',()=>{
 const f=fixture(),a=f.anchor();
 f.setState({visible:false});assert.equal(f.focus(a.x,a.y),false);
 f.setState({visible:true});f.setState({unit:{x:900,y:300,hp:0,kind:'warrior'}});
 assert.equal(f.focus(a.x,a.y),false);
});
test('toque nao interfere em construcao, comandos ou selecao por arraste',()=>{
 const f=fixture(),a=f.anchor();
 // Guards are bound to local interaction variables, not the fixture object.
 const guarded=code.replace('function focusOffscreenUnitAt(px,py){',
  'function focusOffscreenUnitAt(px,py){');
 const make=new Function('mode',`
 let w=390,h=650,W=160,H=160,cx=80,cy=80,dirty=false,cameraFollowUnit=null,selectedUnit=0;
 let placing=mode.placing,command=mode.command,marquee=mode.marquee;
 const game={units:[{x:900,y:300,hp:100}]},point=(x,y)=>[x,y],visibleAt=()=>true;
 ${guarded}
 return focusOffscreenUnitAt(364,325);
 `);
 for(const mode of [{placing:'Cabana',command:null,marquee:null},{placing:null,command:'move',marquee:null},{placing:null,command:null,marquee:{}}]){
  assert.equal(make(mode),false);
 }
});
