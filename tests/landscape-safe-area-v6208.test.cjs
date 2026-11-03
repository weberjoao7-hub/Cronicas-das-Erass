'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const block=html.match(/\/\* v6\.208: compact landscape HUD[\s\S]*?(?=@media\(prefers-reduced-motion:reduce\))/);
test('landscape mobile layout is explicitly scoped',()=>{
 assert.ok(block,'landscape stylesheet must exist');
 assert.match(block[0],/@media \(orientation:landscape\) and \(max-height:500px\)/);
});
test('notched iPhone landscape HUD respects all relevant safe-area insets',()=>{
 assert.ok(block);
 for(const edge of ['top','right','left','bottom'])
  assert.match(block[0],new RegExp('env\\(safe-area-inset-'+edge+'\\)'));
});
test('landscape touch targets retain 44px height',()=>{
 assert.ok(block);
 assert.match(block[0],/nav button\{[^}]*min-height:44px/);
});
test('minimap and placement controls stay within the safe viewport',()=>{
 assert.ok(block);
 assert.match(block[0],/#minimap\{[^}]*width:78px;height:78px/);
 assert.match(block[0],/#cancelPlacement\{[^}]*safe-area-inset-left/);
});
