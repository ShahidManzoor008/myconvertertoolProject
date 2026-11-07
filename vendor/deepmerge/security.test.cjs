const test = require('node:test');
const assert = require('node:assert/strict');
const merge = require('./index.cjs');
for (const side of ['target', 'source']) {
  test(`blocks poisoned keys in ${side}, including nested objects`, () => {
    const poisoned = JSON.parse('{"__proto__":{"admin":true},"constructor":{"prototype":{"admin":true}},"prototype":{"admin":true},"nested":{"__proto__":{"admin":true},"safe":1}}');
    const result = side === 'target' ? merge(poisoned, {}) : merge({}, poisoned);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.admin, undefined);
    assert.equal(result.nested.admin, undefined);
    assert.equal(result.nested.safe, 1);
    assert.equal(Object.hasOwn(result, '__proto__'), false);
    assert.equal(Object.hasOwn(result, 'constructor'), false);
    assert.equal({}.admin, undefined);
  });
}
test('retains arrays, symbols, custom array merge and merge.all', () => {
  const symbol = Symbol('setting');
  assert.deepEqual(merge({a:[1]}, {a:[2]}), {a:[1,2]});
  assert.deepEqual(merge({a:[1]}, {a:[2]}, {arrayMerge: (_a,b) => b}), {a:[2]});
  assert.deepEqual(merge.all([{a:1},{b:2}]), {a:1,b:2});
  assert.equal(merge({}, {[symbol]:3})[symbol], 3);
});
