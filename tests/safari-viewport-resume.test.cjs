const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const recovery = source.match(/function restoreViewportAfterResume\(\)\{([\s\S]*?)\n\}/);
test('Safari resume recovery resets frame clocks and redraws canvas/minimap', () => {
  assert.ok(recovery, 'recovery function exists');
  for (const fragment of ['lastFrame=0', 'renderTick=0', 'minimapTick=0', 'dirty=true', 'resize()', 'redrawMinimap()']) {
    assert.ok(recovery[1].includes(fragment), fragment);
  }
});
test('bfcache pageshow restores only persisted documents', () => {
  assert.match(source, /addEventListener\('pageshow',event=>\{\s*if\(event\.persisted\)restoreViewportAfterResume\(\)/);
});
test('rotation and visibility resume restore viewport while hidden state saves', () => {
  assert.match(source, /addEventListener\('orientationchange',restoreViewportAfterResume\)/);
  assert.match(source, /if\(document\.hidden\)save\(\);\s*else restoreViewportAfterResume\(\)/);
});
