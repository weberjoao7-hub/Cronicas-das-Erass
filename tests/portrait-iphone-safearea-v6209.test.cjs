const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');
const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] || '';
test('portrait iPhone narrow HUD rules are present',()=>{
 assert.match(css,/v6\.209: portrait phones/);
 assert.match(css,/@media \(orientation:portrait\) and \(max-width:430px\)/);
 assert.match(css,/@media \(orientation:portrait\) and \(max-width:350px\)/);
});
test('portrait navigation and minimap respect safe-area insets',()=>{
 assert.match(css,/nav\{left:calc\(env\(safe-area-inset-left\) \+ 5px\)/);
 assert.match(css,/#minimap\{right:calc\(env\(safe-area-inset-right\) \+ 8px\)/);
});
test('portrait resources and title avoid horizontal overflow',()=>{
 assert.match(css,/header strong\{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\}/);
 assert.match(css,/header \.resources\{min-width:0;max-width:52vw/);
});
