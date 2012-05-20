(function(window, undefined) {

  /** Use a single load function */
  var load = typeof require == 'function' ? require : window.load;

  /** The unit testing framework */
  var QUnit =
    window.QUnit || (
      window.setTimeout || (window.addEventListener = window.setTimeout = / /),
      window.QUnit = load('../vendor/qunit/qunit/qunit.js') || window.QUnit,
      load('../vendor/qunit-clib/qunit-clib.js'),
      (window.addEventListener || 0).test && delete window.addEventListener,
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
   * Simplifies the debug return values of `spotlight` methods by filtering
   * non-log messages.
   *
   * @private
   * @param {Array} result The result of a `spotlight` method.
   * @returns {Array} The filtered result.
   */
  function simplify(result) {
    result = [].slice.call(result);
    for (var i = -1, l = result.length; ++i < l; ) {
      result[i] = result[i][0];
    }
    return result;
  }

  /**
   * Skips a given number of tests with a passing result.
   *
   * @private
   * @param {Number} count The number of tests to skip.
   */
  function skipTest(count) {
    while (count--) {
      ok(true, 'test skipped');
    }
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

  test('custom __iterator__', function() {
    var result,
        skipped = 5,
        noop = function() { },
        getDescriptor = Object.getOwnPropertyDescriptor,
        setDescriptor = Object.defineProperty;

    var has = {

      'descriptors' : !!(function() {
        try {
          var o = {};
          return (setDescriptor(o, o, o), 'value' in getDescriptor(o, o));
        } catch(e) { }
      }()),

      'iterators': !!(function() {
        try {
          var o = Iterator({ '': 1 }),
              toString = o.toString;
          for (o in o) { }
          return toString.call(o) == '[object Array]';
        } catch(e) { }
      }())
    };

    if (has.iterators && !Object.getOwnPropertyNames) {
      skipped = 4;

      window.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
      a.b.next = a.b.__iterator__ = function() { };

      result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
      deepEqual(result, ['a.b.y -> (number)'], 'custom __iterator__');

      if (has.descriptors) {
        skipped = 0;

        window.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'writable': true, 'value': noop });

        result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        deepEqual(result, ['a.b.y -> (number)'], 'non-configurable __iterator__');

        window.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'configurable': true, 'value': noop });

        result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        deepEqual(result, ['a.b.y -> (number)'], 'non-writable __iterator__');
        deepEqual(getDescriptor(a.b, '__iterator__'), {
          'configurable': true,
          'enumerable': false,
          'writable': false,
          'value': noop
        }, 'unchanged descriptor');

        window.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'value': noop });

        result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        deepEqual(result, [], 'non-configurable/writable __iterator__');
      }
    }
    skipTest(skipped);
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.byKind', function() {
    function Klass() { }
    window.a = { 'b': { 'c': new Klass } };

    var result = simplify(spotlight.byKind(Klass));
    var expected = [rootName + '.a.b.c -> (object)'];
    deepEqual(result.slice(0, 1), expected, 'Klass instance');

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
    deepEqual(result.slice(0, 1), expected, 'basic');

    window.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    result = simplify(spotlight.byName('c'));
    expected = [rootName + '.a.a.a.b.c -> (number)'];
    deepEqual(result.slice(0, 1), expected, 'repeated property names');

    window.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': 12 } } } } };

    result = simplify(spotlight.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (number)'
    ];

    deepEqual(result.slice(0, 3), expected, 'multiple matches');

    window.a = {
      'foo': { 'b': { 'foo': { 'c': { } } } },
      'bar': { }
    };
    a.foo.b.foo.c.foo = a;
    a.bar.b = a.foo.b;

    // QUnit can't handle circular references :/
    result = simplify(spotlight.byName('foo'));

    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    var filtered = [];
    for (var index = 0, length = result.length; index < length; index++) {
      if (/a\.foo/.test(result[index])) {
        filtered.push(result[index]);
      }
    }

    deepEqual(filtered.sort(), expected, 'circular references');

    expected = [
      rootName + '.a.bar.b.foo -> (object)',
      rootName + '.a.bar.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    filtered = [];
    for (var index = 0, length = result.length; index < length; index++) {
      if (/a\.bar/.test(result[index])) {
        filtered.push(result[index]);
      }
    }

    deepEqual(filtered.sort(), expected, 'sibling containing circular references');

    result = spotlight.byName(12);
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.byValue', function() {
    var value = new String('special');
    window.a = { 'b': { 'c': value } };

    var result = simplify(spotlight.byValue(value));
    var expected = [rootName + '.a.b.c -> (string)'];
    deepEqual(result.slice(0, 1), expected, 'basic');

    window.a = { 'b': { 'c': 12 } };

    result = simplify(spotlight.byValue('12'));
    deepEqual(result, [], 'strict match');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.custom', function() {
    var now = String(+new Date);
    window.a = { 'b': { 'c': +now } };

    var result = simplify(spotlight.custom(function(value, key) {
      // avoid problems with `window.java` and `window.netscape` objects
      // potentially killing script execution when their values are coerced
      return typeof value == 'number' && value == now;
    }));

    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result.slice(0, 1), expected, 'basic');

    spotlight.custom(function() {
      result = [].slice.call(arguments);
    }, { 'object': a.b });

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

    window.a = {};

    result = simplify(spotlight.byName('a', { 'object': window.window }));
    expected = [rootName + '.a -> (object)'];
    deepEqual(result.slice(0, 1), expected, 'Opera < 10.53 window');

    if (Object.getOwnPropertyNames) {
      skipTest(2);
    }
    else {
      window.a = function() { };

      result = simplify(spotlight.byName('prototype', { 'object': a }));
      deepEqual(result, [], 'skips prototype');

      result = simplify(spotlight.byName('constructor', { 'object': a.prototype, 'path': 'a.prototype' }));
      deepEqual(result, [], 'IE < 9 prototype.constructor');
    }
  });

  /*--------------------------------------------------------------------------*/

  test('require("spotlight")', function() {
    if (window.document && window.require) {
      strictEqual((spotlight2 || {}).debug, false, 'require("spotlight")');
    } else {
      skipTest(1);
    }
  });

}(typeof global == 'object' && global || this));