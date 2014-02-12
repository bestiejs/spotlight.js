;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used as a reference to the global object */
  var root = typeof global == 'object' && global || this;

  /** Method and object shortcuts */
  var phantom = root.phantom,
      amd = root.define && define.amd,
      document = !phantom && root.document,
      noop = function() {},
      slice = Array.prototype.slice;

  /** Detect if running in Java */
  var isJava = !document && !!root.java;

  /** Use a single "load" function */
  var load = (typeof require == 'function' && !amd)
    ? require
    : (isJava && root.load) || noop;

  /** The unit testing framework */
  var QUnit = (function() {
    return  root.QUnit || (
      root.addEventListener || (root.addEventListener = noop),
      root.setTimeout || (root.setTimeout = noop),
      root.QUnit = load('../vendor/qunit/qunit/qunit.js') || root.QUnit,
      addEventListener === noop && delete root.addEventListener,
      root.QUnit
    );
  }());

  /** Load and install QUnit Extras */
  var qa = load('../vendor/qunit-extras/qunit-extras.js');
  if (qa) {
    qa.runInContext(root);
  }

  /** The `lodash` utility function */
  var _ = root._ || (root._ = (
    _ = load('../vendor/lodash/dist/lodash.compat.js') || root._,
    _ = _._ || _,
    _.runInContext(root)
  ));

  /** The `spotlight` object to test */
  var spotlight = root.spotlight || (root.spotlight = (
    spotlight = load('../spotlight.js') || root.spotlight,
    spotlight.runInContext(root)
  ));

  /** The root name for the environment */
  var rootName = (typeof global == 'object' && global)
    ? 'global'
    : (typeof environment == 'object' ? '<global object>' : 'window');

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
    var index = -1,
        length = result.length;

    result = slice.call(result);
    while (++index < length) {
      result[index] = result[index][0];
    }
    return result;
  }

  /**
   * Skips a given number of tests with a passing result.
   *
   * @private
   * @param {number} [count=1] The number of tests to skip.
   */
  function skipTest(count) {
    count || (count = 1);
    while (count--) {
      ok(true, 'test skipped');
    }
  }

  /*--------------------------------------------------------------------------*/

  // enable debug mode so `spotlight` methods return an array of log calls
  spotlight.debug(true);

  // avoid false positives for QUnit's `noglobals` checks
  QUnit.moduleStart(function() {
    root.a = true;
  });

  QUnit.moduleDone(function() {
    delete root.a;
  });

  // explicitly call `QUnit.module()` instead of `module()`
  // in case we are in a CLI environment
  QUnit.module('spotlight');

  test('method options', function() {
    root.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

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
        getDescriptor = Object.getOwnPropertyDescriptor,
        setDescriptor = Object.defineProperty;

    var has = {
      'descriptors' : (function() {
        try {
          var o = {};
          setDescriptor(o, o, o);
          var result = 'value' in getDescriptor(o, o);
        } catch(e) { }
        return !!result;
      }()),

      'iterators': (function() {
        try {
          var o = Iterator({ '': 1 });
          for (o in o) { }
        } catch(e) { }
        return _.isArray(o);
      }())
    };

    if (has.iterators && !Object.getOwnPropertyNames) {
      skipped = 4;

      root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
      a.b.next = a.b.__iterator__ = function() {};

      result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
      deepEqual(result, ['a.b.y -> (number)'], 'custom __iterator__');

      if (has.descriptors) {
        skipped = 0;

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'writable': true, 'value': noop });

        result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        deepEqual(result, ['a.b.y -> (number)'], 'non-configurable __iterator__');

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'configurable': true, 'value': noop });

        result = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        deepEqual(result, ['a.b.y -> (number)'], 'non-writable __iterator__');
        deepEqual(getDescriptor(a.b, '__iterator__'), {
          'configurable': true,
          'enumerable': false,
          'writable': false,
          'value': noop
        }, 'unchanged descriptor');

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
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
    root.a = { 'b': { 'c': new Klass } };

    var result = simplify(spotlight.byKind(Klass));
    var expected = [rootName + '.a.b.c -> (object)'];
    deepEqual(result.slice(0, 1), expected, 'Klass instance');

    root.a = { 'b': { 'c': [] } };

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

    root.a = { 'b': { 'c': null } };

    result = simplify(spotlight.byKind('null', { 'object': a }));
    expected = ['<object>.b.c -> (null)'];
    deepEqual(result, expected, 'null');

    root.a = { 'b': { 'c': undefined } };

    result = simplify(spotlight.byKind('undefined', { 'object': a }));
    expected = ['<object>.b.c -> (undefined)'];
    deepEqual(result, expected, 'undefined');

    result = spotlight.byKind(null);
    strictEqual(result, null, 'incorrect argument');
  });

 /*--------------------------------------------------------------------------*/

  test('spotlight.byName', function() {
    root.a = { 'b': { 'c': 12 } };

    var result = simplify(spotlight.byName('c'));
    var expected = [rootName + '.a.b.c -> (number)'];
    deepEqual(result.slice(0, 1), expected, 'basic');

    root.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    result = simplify(spotlight.byName('c'));
    expected = [rootName + '.a.a.a.b.c -> (number)'];
    deepEqual(result.slice(0, 1), expected, 'repeated property names');

    root.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': 12 } } } } };

    result = simplify(spotlight.byName('foo'));
    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (number)'
    ];

    deepEqual(result.slice(0, 3), expected, 'multiple matches');

    root.a = {
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

    var filtered = _.filter(result, function (value) {
      return /a\.foo/.test(value);
    });

    deepEqual(filtered.sort(), expected, 'circular references');

    expected = [
      rootName + '.a.bar.b.foo -> (object)',
      rootName + '.a.bar.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    filtered = _.filter(result, function (value) {
      return /a\.bar/.test(value);
    });

    deepEqual(filtered.sort(), expected, 'sibling containing circular references');

    result = spotlight.byName(12);
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.byValue', function() {
    var value = new String('a');
    root.a = { 'b': { 'c': value } };

    var result = simplify(spotlight.byValue(value));
    var expected = [rootName + '.a.b.c -> (string)'];
    deepEqual(result.slice(0, 1), expected, 'basic');

    root.a = { 'b': { 'c': 12 } };

    result = simplify(spotlight.byValue('12'), { 'object': a });
    deepEqual(result, [], 'strict match');
  });

  /*--------------------------------------------------------------------------*/

  test('spotlight.custom', function() {
    var now = String(+new Date);
    root.a = { 'b': { 'c': +now } };

    var result = simplify(spotlight.custom(function(value, key) {
      // avoid problems with `window.java` and `window.netscape` objects
      // potentially killing script execution when their values are coerced
      return typeof value == 'number' && value == now;
    }, { 'object': a }));

    var expected = ['<object>.b.c -> (number)'];
    deepEqual(result.slice(0, 1), expected, 'basic');

    spotlight.custom(function() {
      result = slice.call(arguments);
    }, { 'object': a });

    expected = [a.b.c, 'c', a.b];
    deepEqual(result, expected, 'callback arguments');

    result = spotlight.custom('type');
    strictEqual(result, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  test('for..in', function() {
    root.a = { 'b': { 'valueOf': function() {} } };

    var result = simplify(spotlight.byName('valueOf', { 'object': a }));
    var expected = ['<object>.b.valueOf -> (function)'];
    deepEqual(result, expected, 'shadowed property');

    root.a = { 'b': { 'toString': function() {} } };

    result = simplify(spotlight.byName('toString', { 'object': a }));
    expected = ['<object>.b.toString -> (function)'];
    deepEqual(result, expected, 'custom toString');

    root.a = {};

    result = simplify(spotlight.byName('a', { 'object': root.window }));
    expected = [rootName + '.a -> (object)'];
    deepEqual(result.slice(0, 1), expected, 'Opera < 10.53 window');

    if (Object.getOwnPropertyNames) {
      skipTest(2);
    }
    else {
      root.a = function() {};

      result = simplify(spotlight.byName('prototype', { 'object': a }));
      deepEqual(result, [], 'skips prototype');

      result = simplify(spotlight.byName('constructor', { 'object': a.prototype, 'path': 'a.prototype' }));
      deepEqual(result, [], 'IE < 9 prototype.constructor');
    }
  });

  /*--------------------------------------------------------------------------*/

  test('supports loading Spotlight.js as a module', function() {
    if (amd) {
      equal((spotlightModule || {}).version, spotlight.version);
    }
    else {
      skipTest();
    }
  });

  /*--------------------------------------------------------------------------*/

  QUnit.config.hidepassed = true;

  if (!document) {
    QUnit.config.noglobals = true;
    QUnit.start();
  }
}.call(this));
