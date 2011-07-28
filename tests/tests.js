(function(window, undefined) {

  /** Use a single load function */
  var load = typeof require == 'function' ? require : window.load;

  /** The unit testing framework */
  var QUnit =
    window.QUnit ||
    (window.QUnit = load('../vendor/qunit/qunit/qunit.js') || window.QUnit) &&
    (load('../vendor/qunit-clib/qunit-clib.js'), window.QUnit);

  /** The `find` object to test */
  var find =
    window.find ||
    (load('../waldo.js') || window.find);

  /** The root name for the environment */
  var rootName =
    typeof global == 'object' && global ? 'global' :
    typeof environment == 'object' ? '<global object>' : 'window';

  /**
   * Simplifies the debug return values of `find` methods by filtering non-log messages.
   * @private
   * @param {Array} result The result of a `find` method.
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

  // enable debug mode so `find` methods return an array of log calls
  find.debug = true;

  // must explicitly use `QUnit.module` instead of `module()`
  // in case we are in a CLI environment
  QUnit.module('Waldo');

  test('method options', function() {
    window.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    var result = simplify(find.byName('a', { 'object': a.a, 'path': '<path>' }));
    var expected = ['<path>.a -> (object)'];
    deepEqual(result, expected, 'passing options');

    result = simplify(find.byName('a', { 'object': a.a, 'path': '' }));
    expected = ['a -> (object)'];
    deepEqual(result, expected, 'path as ""');

    result = simplify(find.byName('a', { 'object': a.a }));
    expected = ['<object>.a -> (object)'];
    deepEqual(result, expected, 'no path');
  });

  /*--------------------------------------------------------------------------*/

  test('find.byKind', function() {
    function Klass() { }
    window.a = { 'b': { 'c': new Klass } };

    var result = simplify(find.byKind(Klass));
    var expected = [rootName + '.a.b.c -> (object)'];
    deepEqual(result, expected, 'Klass instance');

    window.a = { 'b': { 'c': [] } };

    result = simplify(find.byKind('Array', { 'object': a }));
    expected = ['<object>.b.c -> (array)'];
    deepEqual(result, expected, '[[Class]]');

    result = simplify(find.byKind('array', { 'object': a }));
    expected = ['<object>.b.c -> (array)'];
    deepEqual(result, expected, 'lowercase [[Class]]');

    result = simplify(find.byKind('object', { 'object': a.b }));
    expected = ['<object>.c -> (array)'];
    deepEqual(result, expected, 'typeof');

    result = simplify(find.byKind('Object', { 'object': a.b }));
    deepEqual(result, [], 'no-match [[Class]]');

    window.a = { 'b': { 'c': null } };

    result = simplify(find.byKind('null', { 'object': a }));
    expected = ['<object>.b.c -> (null)'];
    deepEqual(result, expected, 'null');

    window.a = { 'b': { 'c': undefined } };

    result = simplify(find.byKind('undefined', { 'object': a }));
    expected = ['<object>.b.c -> (undefined)'];
    deepEqual(result, expected, 'undefined');

    result = find.byKind(null);
    strictEqual(result, null, 'incorrect argument');
  });

 /*--------------------------------------------------------------------------*/

  test('find.byName', function() {
    window.a = { 'b': { 'c': 12 } };

    var result = simplify(find.byName('c'));
    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result, expected, 'basic');

    window.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    result = simplify(find.byName('c'));
    expected = [rootName + '.a.a.a.b.c -> (number)'];
    deepEqual(result, expected, 'repeated property names');

    window.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': 12 } } } } };

    result = simplify(find.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (number)'
    ];

    deepEqual(result, expected, 'multiple matches');

    window.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': null } } } } };
    a.foo.b.foo.c.foo = a;

    // qunit can't handle circular references :/
    result = simplify(find.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    deepEqual(result, expected, 'circular references');

    result = find.byName(12);
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('find.byValue', function() {
    var value = new String('special');
    window.a = { 'b': { 'c': value } };

    var result = simplify(find.byValue(value));
    var expected = [rootName + '.a.b.c -> (string)'];
    deepEqual(result, expected, 'basic');

    window.a = { 'b': { 'c': 12 } };

    result = simplify(find.byValue('12'));
    deepEqual(result, [], 'strict match');
  });

  /*--------------------------------------------------------------------------*/

  test('find.custom', function() {
    var now = String(+new Date);
    window.a = { 'b': { 'c': +now } };

    var result = simplify(find.custom(function(value) { return value == now }));
    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result, expected, 'basic');

    find.custom(function() { result = [].slice.call(arguments); }, { 'object': a.b });
    expected = [a.b.c, 'c', a.b];
    deepEqual(result, expected, 'callback arguments');

    result = find.custom('type');
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('for..in', function() {
    window.a = { 'b': { 'valueOf': function() { } } };

    var result = simplify(find.byName('valueOf', { 'object': a }));
    var expected = ['<object>.b.valueOf -> (function)'];
    deepEqual(result, expected, 'shadowed property');

    window.a = { 'b': { 'toString': function() { } } };

    result = simplify(find.byName('toString', { 'object': a }));
    expected = ['<object>.b.toString -> (function)'];
    deepEqual(result, expected, 'custom toString');

    window.a = function() { };

    result = simplify(find.byName('prototype', { 'object': a }));
    deepEqual(result, [], 'skips prototype');

    result = simplify(find.byName('constructor', { 'object': a.prototype, 'path': 'a.prototype' }));
    deepEqual(result, [], 'IE < 9 prototype.constructor');

    result = simplify(find.byName('constructor', { 'object': a.prototype, 'path': '<a.prototype>' }));
    deepEqual(result, [], 'IE < 9 prototype.constructor (alt)');

    window.a = { };

    result = simplify(find.byName('a', { 'object': window.window }));
    expected = [rootName + '.a -> (object)'];
    deepEqual(result, expected, 'Opera < 10.53 window');
  });

  /*--------------------------------------------------------------------------*/

  if (window.document && window.require) {
    test('require("find")', function() {
      strictEqual((find2 || {}).debug, false, 'require("find")');
    });
  }

  /*--------------------------------------------------------------------------*/

  // explicitly call `QUnit.start()` in a CLI environment
  if (!window.document) {
    QUnit.start();
  }
}(typeof global == 'object' && global || this));