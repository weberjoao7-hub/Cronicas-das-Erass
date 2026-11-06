'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','tools','biome-atlas-preview.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'RTS preview script');
test('RTS preview JavaScript parses',()=>assert.doesNotThrow(()=>new Function(script)));
const match=script.match(/function wheelPixels\(e\)\{[\s\S]*?\n\}/);
assert.ok(match,'wheel normalization function');
const wheel=new Function('height','return ('+match[0].replace('function wheelPixels','function')+')')(800);
test('wheel normalizes pixel, line and page modes',()=>{
 assert.equal(wheel({deltaY:100,deltaMode:0}),100);
 assert.equal(wheel({deltaY:3,deltaMode:1}),48);
 assert.equal(wheel({deltaY:1,deltaMode:2}),240);
 assert.equal(wheel({deltaY:-10000,deltaMode:0}),-240);
});
test('wheel listener uses normalized delta and non-passive handling',()=>{
 assert.match(script,/Math\.exp\(-wheelPixels\(e\)\*\.001\)/);
 assert.match(script,/\{passive:false\}/);
});
