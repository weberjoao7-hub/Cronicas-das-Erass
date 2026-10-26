'use strict';
// Regressões da seleção de tropas e ordens em formação — v6.12.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script exists');
function between(start,end){
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'missing source anchors: '+start+' / '+end);
 return script.slice(a,b);
}
const military=k=>['warrior','archer','cavalry'].includes(k);
function setup(){
 const units=[
  {kind:'warrior',hp:100,x:2,y:3},
  {kind:'archer',hp:100,x:5,y:5},
  {kind:'worker',hp:100,x:2,y:3},
  {kind:'cavalry',hp:0,x:2,y:3},
  {kind:'warrior',hp:100,x:3,y:3},
 ];
 const game={units},selectedGroup=new Set(),messages=[];
 const deps=['game','selectedGroup','isMilitary','visibleAt','point','w','h','toast','dirty','selectedUnit'];
 const values=[game,selectedGroup,military,x=>x!==3,(x,y)=>[x*10,y*10],100,100,x=>messages.push(x),false,0];
 const rect=new Function(...deps,between('function selectGroupInRect(','function selectVisibleTroops(){')+';return selectGroupInRect;')(...values);
 const visible=new Function(...deps,between('function selectVisibleTroops(){','function drawSelectionMarquee(){')+';return selectVisibleTroops;')(...values);
 return {units,game,selectedGroup,messages,rect,visible};
}
test('full game JavaScript parses with group controls',()=>assert.doesNotThrow(()=>new Function(script)));
test('marquee selects only living, revealed military units within screen bounds',()=>{
 const {units,selectedGroup,rect}=setup();
 assert.equal(rect(10,20,30,40),1);
 assert.deepEqual([...selectedGroup],[units[0]]);
});
test('marquee replaces previous selection and supports additive Ctrl+Shift selection',()=>{
 const {units,selectedGroup,rect}=setup();
 assert.equal(rect(10,20,30,40),1);
 assert.equal(rect(45,45,55,55),1);
 assert.deepEqual([...selectedGroup],[units[1]]);
 assert.equal(rect(10,20,30,40,true),2);
 assert.ok(selectedGroup.has(units[0])&&selectedGroup.has(units[1]));
});
test('visible-troops button excludes hidden, dead and civilian units',()=>{
 const {units,selectedGroup,visible,messages}=setup();
 assert.equal(visible(),2);
 assert.deepEqual([...selectedGroup],[units[0],units[1]]);
 assert.match(messages.at(-1),/2 tropas visíveis/);
});
test('group move routes only chosen units to distinct valid destinations',()=>{
 const game={units:[
  {kind:'warrior',hp:100},{kind:'archer',hp:100},{kind:'cavalry',hp:100},
 ]};
 const chosen=new Set(game.units.slice(0,2)),orders=[],messages=[];
 const move=new Function('game','isMilitary','passable','key','assignRoute','toast','save','dirty',
  between('function moveArmyTo(','let pointers=new Map()')+';return moveArmyTo;')(
  game,military,()=>true,(x,y)=>x+','+y,(u,x,y)=>{orders.push([u,x,y]);return true;},
  msg=>messages.push(msg),()=>{},false);
 move(10,10,chosen);
 assert.equal(orders.length,2);
 assert.deepEqual(orders.map(o=>o[0]),game.units.slice(0,2));
 assert.notDeepEqual(orders[0].slice(1),orders[1].slice(1));
 assert.match(messages.at(-1),/2\/2/);
});
test('invalid group destination does not dispatch movement',()=>{
 const game={units:[{kind:'warrior',hp:100}]},orders=[];
 const move=new Function('game','isMilitary','passable','key','assignRoute','toast','save','dirty',
  between('function moveArmyTo(','let pointers=new Map()')+';return moveArmyTo;')(
  game,military,()=>false,(x,y)=>x+','+y,(u,x,y)=>{orders.push([x,y]);return true;},()=>{},()=>{},false);
 move(10,10,new Set(game.units));assert.equal(orders.length,0);
});
test('desktop marquee and mobile selection command are wired into existing input handlers',()=>{
 assert.match(script,/e\.pointerType==='mouse'&&e\.button===0&&e\.shiftKey/);
 assert.match(script,/if\(marquee\)\{marquee\.x1=e\.clientX/);
 assert.match(script,/selectGroupInRect\(box\.x0,box\.y0,box\.x1,box\.y1,e\.ctrlKey\)/);
 assert.match(script,/command==='moveGroup'\)\{moveArmyTo\(x,y,selectedGroup\)/);
 assert.match(script,/id="selectVisible"/);
 assert.match(script,/id="moveGroup"/);
 assert.match(script,/selectedGroup\.has\(u\)/);
});
test('legacy local save remains compatible',()=>assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/));
