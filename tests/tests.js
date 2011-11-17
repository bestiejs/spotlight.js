(function(window, undefined) {

  /** Use a single load function */
  var load = typeof require == 'function' ? require : window.load;

  /** The unit testing framework */
  var QUnit =
    window.QUnit || (
      window.setTimeout || (window.addEventListener = window.setTimeout = / /),
      window.QUnit = load('../vendor/qunit/qunit/qunit.js') || window.QUnit,
      load('../vendor/qunit-clib/qunit-clib.js'),
      window.addEventListener.test && delete window.addEventListener,
      window.QUnit
    );

  /** The `spotlight` object to test */
  var spotlight =
    window.spotlight ||
    load('../spotlight.js') ||
    window.spotlight;

  /** The root name for the environment */
  var rootName =
    typeof global == 'object' && global ? 'global' :
      typeof environment == 'object' ? '<global object>' : 'window';

  /*--------------------------------------------------------------------------*/

  /**
   * Simplifies the debug return values of `spotlight` methods by filtering non-log messages.
   * @private
   * @param {Array} result The result of a `spotlight` method.
   * @returns {Array} The filtered result.
   */
  function simplify(result) {
    result = result.slice();
    for (var i = -1, l = result.length; ++i < l; ) {
      result[i] = result[i][0];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  // enable debug mode so `spotlight` methods return an array of log calls
  spotlight.debug = true;

  // must explicitly use `QUnit.module` instead of `module()`
  // in case we are in a CLI environment
  QUnit.module('spotlight');

  test('method options', function() {
    window.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    var result = simplify(spotlight.byName('a', { 'object': a.a, 'path': '<path>' }));
    var expected = ['<path>.a -> (object)'];
    deepEqual(result, expected, 'passing options');

    result = simplify(spotlight.byName('a', { 'object': a.a, 'path': '' }));
    expected = ['a -> (object)'];
    deepEqual(result, expected, 'path as ""');

    result = simplify(spotlight.byName('a', { 'object': a.a }));
    expected = ['<object>.a -> (object)'];
    deepEqual(result, expected, 'no path');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.byKind', function() {
    function Klass() { }
    window.a = { 'b': { 'c': new Klass } };

    var result = simplify(spotlight.byKind(Klass));
    var expected = [rootName + '.a.b.c -> (object)'];
    deepEqual(result, expected, 'Klass instance');

    window.a = { 'b': { 'c': [] } };

    result = simplify(spotlight.byKind('Array', { 'object': a }));
    expected = ['<object>.b.c -> (array)'];
    deepEqual(result, expected, '[[Class]]');

    result = simplify(spotlight.byKind('array', { 'object': a }));
    expected = ['<object>.b.c -> (array)'];
    deepEqual(result, expected, 'lowercase [[Class]]');

    result = simplify(spotlight.byKind('object', { 'object': a.b }));
    expected = ['<object>.c -> (array)'];
    deepEqual(result, expected, 'typeof');

    result = simplify(spotlight.byKind('Object', { 'object': a.b }));
    deepEqual(result, [], 'no-match [[Class]]');

    window.a = { 'b': { 'c': null } };

    result = simplify(spotlight.byKind('null', { 'object': a }));
    expected = ['<object>.b.c -> (null)'];
    deepEqual(result, expected, 'null');

    window.a = { 'b': { 'c': undefined } };

    result = simplify(spotlight.byKind('undefined', { 'object': a }));
    expected = ['<object>.b.c -> (undefined)'];
    deepEqual(result, expected, 'undefined');

    result = spotlight.byKind(null);
    strictEqual(result, null, 'incorrect argument');
  });

 /*--------------------------------------------------------------------------*/

  test('spotlight.byName', function() {
    window.a = { 'b': { 'c': 12 } };

    var result = simplify(spotlight.byName('c'));
    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result, expected, 'basic');

    window.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    result = simplify(spotlight.byName('c'));
    expected = [rootName + '.a.a.a.b.c -> (number)'];
    deepEqual(result, expected, 'repeated property names');

    window.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': 12 } } } } };

    result = simplify(spotlight.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (number)'
    ];

    deepEqual(result, expected, 'multiple matches');

    window.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': null } } } } };
    a.foo.b.foo.c.foo = a;

    // qunit can't handle circular references :/
    result = simplify(spotlight.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    deepEqual(result, expected, 'circular references');

    result = spotlight.byName(12);
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.byValue', function() {
    var value = new String('special');
    window.a = { 'b': { 'c': value } };

    var result = simplify(spotlight.byValue(value));
    var expected = [rootName + '.a.b.c -> (string)'];
    deepEqual(result, expected, 'basic');

    window.a = { 'b': { 'c': 12 } };

    result = simplify(spotlight.byValue('12'));
    deepEqual(result, [], 'strict match');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.custom', function() {
    var now = String(+new Date);
    window.a = { 'b': { 'c': +now } };

    var result = simplify(spotlight.custom(function(value) { return value == now }));
    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result, expected, 'basic');

    spotlight.custom(function() { result = [].slice.call(arguments); }, { 'object': a.b });
    expected = [a.b.c, 'c', a.b];
    deepEqual(result, expected, 'callback arguments');

    result = spotlight.custom('type');
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('for..in', function() {
    window.a = { 'b': { 'valueOf': function() { } } };

    var result = simplify(spotlight.byName('valueOf', { 'object': a }));
    var expected = ['<object>.b.valueOf -> (function)'];
    deepEqual(result, expected, 'shadowed property');

    window.a = { 'b': { 'toString': function() { } } };

    result = simplify(spotlight.byName('toString', { 'object': a }));
    expected = ['<object>.b.toString -> (function)'];
    deepEqual(result, expected, 'custom toString');

    window.a = function() { };

    result = simplify(spotlight.byName('prototype', { 'object': a }));
    deepEqual(result, [], 'skips prototype');

    result = simplify(spotlight.byName('constructor', { 'object': a.prototype, 'path': 'a.prototype' }));
    deepEqual(result, [], 'IE < 9 prototype.constructor');

    result = simplify(spotlight.byName('constructor', { 'object': a.prototype, 'path': '<a.prototype>' }));
    deepEqual(result, [], 'IE < 9 prototype.constructor (alt)');

    window.a = { };

    result = simplify(spotlight.byName('a', { 'object': window.window }));
    expected = [rootName + '.a -> (object)'];
    deepEqual(result, expected, 'Opera < 10.53 window');
  });

  /*--------------------------------------------------------------------------*/

  test('require("spotlight")', function() {
    if (window.document && window.require) {
      strictEqual((spotlight2 || {}).debug, false, 'require("spotlight")');
    } else {
      ok(true, 'test skipped');
    }
  });

  /*--------------------------------------------------------------------------*/

  // explicitly call `QUnit.start()` in a CLI environment
  if (!window.document) {
    QUnit.start();
  }
}(typeof global == 'object' && global || this));