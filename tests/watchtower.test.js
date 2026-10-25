// Regression tests for v5.3's watchtower. Run: node --test tests/watchtower.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const between = (start, end) => {
 const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
 assert.ok(a >= 0 && b > a, 'expected source anchors: ' + start);
 return html.slice(a, b);
};
const combatSource = between('function combatTurn(){', 'const key=(x,y)');
const towerSource = between('function drawWatchtower(', 'function drawConstructionSite(');
const combat = new Function(
 'game', 'towerShots', 'refresh', 'toast', 'menu', 'panel', 'document', 'key',
 'selectedUnit', 'dirty',
 combatSource + ';combatTurn();'
);
function fight({x = 83.5, y = 80.5, buildLeft = 0, towerType = 'Torre'} = {}) {
 const game = {
  enemy: {hp: 100, x: 120, y: 120},
  enemyUnits: [{x, y, hp: 65}], units: [],
  buildings: [{t: towerType, x: 80, y: 80, buildLeft}],
  claim: [], won: false
 };
 const shots = [];
 combat(game, shots, () => {}, () => {}, () => {}, {},
  {getElementById: () => ({})}, (x,y) => x + ',' + y, 0, false);
 return {hp: game.enemyUnits[0].hp, shots};
}
test('completed tower damages a hostile guard in range', () => {
 const result = fight();
 assert.equal(result.hp, 51);
 assert.equal(result.shots.length, 1);
 assert.equal(result.shots[0].sx, 80.5);
});
test('out-of-range guard is not damaged', () => {
 const result = fight({x: 88.5});
 assert.equal(result.hp, 65);
 assert.equal(result.shots.length, 0);
});
test('tower under construction does not fire', () => {
 assert.equal(fight({buildLeft: 10}).hp, 65);
});
test('ordinary buildings do not fire', () => {
 assert.equal(fight({towerType: 'Cabana'}).hp, 65);
});
test('watchtower renders at mobile and desktop zoom without Canvas errors', () => {
 let calls = 0;
 const methods = new Set(['beginPath','ellipse','fill','stroke','closePath','save',
  'restore','moveTo','lineTo','arc']);
 const ctx = new Proxy({}, {
  get: (obj, key) => methods.has(key) ? () => {calls++} : obj[key],
  set: (obj, key, value) => {obj[key] = value;return true}
 });
 const draw = new Function('ctx','scale', towerSource + ';drawWatchtower(300,200,25,13);drawWatchtower(500,300,148,76);');
 draw(ctx, 1);
 assert.ok(calls > 100);
});
test('tower price and construction preview are wired to the game', () => {
 assert.match(html, /Torre:\[55,0,65\]/);
 assert.match(html, /if\(placing==='Torre'\)drawWatchtower/);
 assert.match(html, /if\(obj\.t==='Torre'\)drawWatchtower/);
 assert.match(html, /const duration=t==='Quartel'\?30:t==='Torre'\?26:18/);
});
