'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'game script');
const a=script.indexOf('function touchSelectionCanArm(');
const b=script.indexOf('function clearTouchSelection(',a);
assert.ok(a>=0&&b>a,'pure touch selection helpers');
const {touchSelectionCanArm,touchSelectionMoved}=new Function(script.slice(a,b)+';return {touchSelectionCanArm,touchSelectionMoved}')();
test('v6.167 JavaScript parses and retains existing save format',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('long press is armed only for a single idle touch without overlays',()=>{
 assert.equal(touchSelectionCanArm('touch',1,null,null,false),true);
 for(const type of ['mouse','pen'])assert.equal(touchSelectionCanArm(type,1,null,null,false),false);
 assert.equal(touchSelectionCanArm('touch',2,null,null,false),false);
 assert.equal(touchSelectionCanArm('touch',1,'Cabana',null,false),false);
 assert.equal(touchSelectionCanArm('touch',1,null,'moveGroup',false),false);
 assert.equal(touchSelectionCanArm('touch',1,null,null,true),false);
});
test('12px dead zone tolerates small Safari finger jitter',()=>{
 assert.equal(touchSelectionMoved(20,20,25,27),false);
 assert.equal(touchSelectionMoved(20,20,32,20),false);
 assert.equal(touchSelectionMoved(20,20,33,20),true);
 assert.equal(touchSelectionMoved(20,20,20,33),true);
 assert.equal(touchSelectionMoved(NaN,0,30,0),false);
});
test('long press timer creates the existing RTS marquee and disables inertia',()=>{
 assert.match(script,/touchSelect\.timer=setTimeout\(\(\)=>\{/);
 assert.match(script,/marquee=\{x0:x,y0:y,x1:x,y1:y\}/);
 assert.match(script,/dragged=true;cameraFollowUnit=null;stopTouchGlide\(\);dirty=true/);
 assert.match(script,/,460\);/);
});
test('all pointer endings cancel pending timer and second touch prevents selection',()=>{
 assert.match(script,/C\.addEventListener\('pointerdown',armTouchSelection\)/);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])
  assert.ok(script.includes("C.addEventListener('"+name+"',clearTouchSelection)"));
 assert.match(script,/touchSelectionCanArm\(e\.pointerType,pointers\.size,placing,command,panel\.classList\.contains\('show'\)\)/);
 assert.match(script,/touchSelectionMoved\(touchSelect\.x,touchSelect\.y,e\.clientX,e\.clientY\)\)clearTouchSelection\(\)/);
});
test('touch marquee uses existing group routing and leaves pinch and placement intact',()=>{
 assert.match(script,/if\(marquee\)\{marquee\.x1=e\.clientX/);
 assert.match(script,/selectGroupInRect\(box\.x0,box\.y0,box\.x1,box\.y1,e\.ctrlKey\)/);
 assert.match(script,/command==='moveGroup'\)\{moveArmyTo\(x,y,selectedGroup\)/);
 assert.match(script,/if\(pointers\.size>=2\)\{pinchState=pinchSnapshot\(\)/);
 assert.match(script,/if\(finishTouchPlacement\(e\)\)return/);
});
