const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fn = html.match(/function drawMeadowGrassTufts\([\s\S]*?\n}\nfunction drawMeadowFlowers/);
test('meadow grass renderer is defined immediately before flowers', () => {
 assert.ok(fn, 'grass renderer missing');
});
test('grass is restricted to meadow biomes, non-winter seasons and close zoom', () => {
 assert.match(fn[0], /b!==1&&b!==2/);
 assert.match(fn[0], /season===3/);
 assert.match(fn[0], /ww<74/);
});
test('grass density scales with zoom and is deterministic', () => {
 assert.match(fn[0], /ww>=110\?4:2/);
 assert.match(fn[0], /rnd\(x\*13\+i\*17,y\*19\+i\*23,791\)/);
});
test('grass draws curved silhouettes and restores canvas state', () => {
 assert.match(fn[0], /ctx\.quadraticCurveTo/);
 assert.match(fn[0], /ctx\.save\(\)/);
 assert.match(fn[0], /ctx\.restore\(\)/);
});
test('grass and flowers render only on visible unoccupied tiles', () => {
 assert.match(html, /if\(visibleFog\[y\*W\+x\]&&!structures\.has\(key\(x,y\)\)&&!roadTiles\.has\(key\(x,y\)\)\)\{drawMeadowGrassTufts\(px,py,ww,hh,x,y,b,forestSeason\(\)\);drawMeadowFlowers/);
});
