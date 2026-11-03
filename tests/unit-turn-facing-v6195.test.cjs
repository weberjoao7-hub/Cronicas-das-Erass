'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main script');
const start=script.indexOf('// v6.195: a direção visual');
const end=script.indexOf('const eras=',start);
assert.ok(start>=0&&end>start,'facing and turn helpers');
const source=script.slice(start,end);
const {facingFromTravel,updateUnitFacing,atlasTurnMotion,unitTurnStamp}=
 new Function(source+';return {facingFromTravel,updateUnitFacing,atlasTurnMotion,unitTurnStamp};')();

test('v6.195: full syntax and save schema remain compatible',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=195);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|requestAnimationFrame/);
});
test('projected heading follows the actual isometric screen direction',()=>{
 assert.equal(facingFromTravel(1,3,0),1);
 assert.equal(facingFromTravel(1,0,3),-1);
 assert.equal(facingFromTravel(-1,-2,0),-1);
 assert.equal(facingFromTravel(-1,0,-2),1);
});
test('deadband retains heading on near vertical projection',()=>{
 assert.equal(facingFromTravel(-1,1,1),-1);
 assert.equal(facingFromTravel(1,1,1.06),1);
 assert.equal(facingFromTravel(-1,1.06,1),-1);
});
test('invalid movement cannot flip or corrupt facing',()=>{
 for(const pair of [[NaN,1],[Infinity,0],[0,NaN],[0,0],[1e-9,0]]){
  assert.equal(facingFromTravel(-1,...pair),-1);
 }
 assert.equal(updateUnitFacing(null,1,0),1);
});
test('the last heading persists after the path ends',()=>{
 const u={face:1,path:[{x:2,y:3}]};
 assert.equal(updateUnitFacing(u,0,2,1000),-1);
 u.path=[];
 assert.equal(updateUnitFacing(u,0,0,1010),-1);
 assert.equal(u.face,-1);
});
test('turn is a short foot-anchored transient, not a saved field',()=>{
 const u={face:1};
 updateUnitFacing(u,0,2,1000);
 assert.equal(unitTurnStamp.get(u),1000);
 assert.equal(atlasTurnMotion(u,999),null);
 const halfway=atlasTurnMotion(u,1115);
 assert.ok(halfway&&halfway.lean>0&&halfway.stretch<1);
 assert.equal(atlasTurnMotion(u,1230),null);
 assert.equal(Object.hasOwn(u,'turnAt'),false);
});
test('unchanged facing does not retrigger a pivot every frame',()=>{
 const u={face:1};
 updateUnitFacing(u,0,3,1000);
 updateUnitFacing(u,0,4,1100);
 assert.equal(unitTurnStamp.get(u),1000);
 updateUnitFacing(u,3,0,1200);
 assert.equal(unitTurnStamp.get(u),1200);
});
test('friendly and hostile movement both record the final facing',()=>{
 assert.match(script,/updateUnitFacing\(guard,dx,dy\);guard\.x=nx/);
 assert.match(script,/updateUnitFacing\(u,dx,dy\);u\.x\+=dx\/len\*step/);
 assert.ok((script.match(/const turn=typeof atlasTurnMotion==='function'\?/g)||[]).length>=5);
 assert.match(script,/atlasTurnMotion\(u,now,true\):null/);
});
