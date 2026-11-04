const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function drawMeadowFieldStones(');
const end = html.indexOf('function drawMeadowFlowers(', start);
assert.ok(start >= 0 && end > start, 'stone renderer exists');
const source = html.slice(start, end);
function render(ww, biome, season, random = () => 0.2) {
 const calls = [];
 const ctx = new Proxy({}, {get(_, name) {
  if (name === 'save' || name === 'restore' || name === 'beginPath' || name === 'ellipse' ||
      name === 'fill' || name === 'moveTo' || name === 'lineTo' || name === 'closePath' || name === 'stroke') {
   return (...args) => { calls.push([name, ...args]); };
  }
  return undefined;
 }, set(_, name, value) {calls.push(['set', name, value]);return true;}});
 const sandbox = {ctx, rnd: random, Math};
 vm.runInNewContext(source + '\n drawMeadowFieldStones(100,100,'+ww+',40,4,8,'+biome+','+season+');', sandbox);
 return calls;
}
test('field stones are culled at distant zoom and outside meadow biomes', () => {
 assert.equal(render(80,1,0).length,0);
 assert.equal(render(120,4,0).length,0);
});
test('close-up stones draw shadow, side and top facets with restored canvas', () => {
 const calls = render(120,1,0);
 assert.equal(calls.filter(c => c[0] === 'fill').length,3);
 assert.equal(calls.filter(c => c[0] === 'save').length,1);
 assert.equal(calls.filter(c => c[0] === 'restore').length,1);
});
test('seasonal top palette differs between summer, autumn and winter', () => {
 const color = season => render(120,1,season).filter(c=>c[0]==='set'&&c[1]==='fillStyle').map(c=>c[2]);
 assert.notEqual(color(0).at(-1),color(2).at(-1));
 assert.notEqual(color(2).at(-1),color(3).at(-1));
});
