;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used as a reference to the global object */
  var root = (typeof global == 'object' && global) || this;

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
  var QUnit = root.QUnit || (root.QUnit = (
    QUnit = load('../node_modules/qunitjs/qunit/qunit.js') || root.QUnit,
    QUnit = QUnit.QUnit || QUnit
  ));

  /** Load QUnit Extras. */
  var QUnitExtras = load('../node_modules/qunit-extras/qunit-extras.js');
  if (QUnitExtras) {
    QUnitExtras.runInContext(root);
  }

  /** The `lodash` utility function */
  var _ = root._ || (root._ = (
    _ = load('../node_modules/lodash/index.js') || root._,
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
   * @param {Object} assert The QUnit assert object.
   * @param {number} [count=1] The number of tests to skip.
   */
  function skipTest(assert, count) {
    count || (count = 1);
    while (count--) {
      assert.ok(true, 'test skipped');
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
    root.a = undefined;
  });

  QUnit.module('spotlight');

  QUnit.test('method options', function(assert) {
    assert.expect(3);

    root.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    var actual = simplify(spotlight.byName('a', { 'object': a.a, 'path': '<path>' }));
    assert.deepEqual(actual, ['<path>.a -> (object)'], 'passing options');

    actual = simplify(spotlight.byName('a', { 'object': a.a, 'path': '' }));
    assert.deepEqual(actual, ['a -> (object)'], 'path as ""');

    actual = simplify(spotlight.byName('a', { 'object': a.a }));
    assert.deepEqual(actual, ['<object>.a -> (object)'], 'no path');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('custom __iterator__', function(assert) {
    assert.expect(5);

    var skipped = 5,
        getDescriptor = Object.getOwnPropertyDescriptor,
        setDescriptor = Object.defineProperty;

    var has = {
      'descriptors' : (function() {
        try {
          var o = {};
          setDescriptor(o, o, o);
          var result = 'value' in getDescriptor(o, o);
        } catch(e) {}
        return !!result;
      }()),

      'iterators': (function() {
        try {
          var o = Iterator({ '': 1 });
          for (o in o) {}
        } catch(e) {}
        return _.isArray(o);
      }())
    };

    if (has.iterators && !Object.getOwnPropertyNames) {
      skipped = 4;

      root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
      a.b.next = a.b.__iterator__ = function() {};

      var actual = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
      assert.deepEqual(actual, ['a.b.y -> (number)'], 'custom __iterator__');

      if (has.descriptors) {
        skipped = 0;

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'writable': true, 'value': noop });

        actual = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        assert.deepEqual(actual, ['a.b.y -> (number)'], 'non-configurable __iterator__');

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'configurable': true, 'value': noop });

        actual = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        assert.deepEqual(actual, ['a.b.y -> (number)'], 'non-writable __iterator__');
        assert.deepEqual(getDescriptor(a.b, '__iterator__'), {
          'configurable': true,
          'enumerable': false,
          'writable': false,
          'value': noop
        }, 'unchanged descriptor');

        root.a = { 'b': { 'x': 1, 'y': 1, 'z': 1 } };
        setDescriptor(a.b, '__iterator__', { 'value': noop });

        actual = simplify(spotlight.byName('y', { 'object': a, 'path': 'a' }));
        assert.deepEqual(actual, [], 'non-configurable/writable __iterator__');
      }
    }
    skipTest(assert, skipped);
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.byKind', function(assert) {
    assert.expect(8);

    function Klass() {}
    root.a = { 'b': { 'c': new Klass } };

    var actual = simplify(spotlight.byKind(Klass));
    assert.deepEqual(actual.slice(0, 1), [rootName + '.a.b.c -> (object)'], 'Klass instance');

    root.a = { 'b': { 'c': [] } };

    actual = simplify(spotlight.byKind('Array', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.c -> (array)'], '[[Class]]');

    actual = simplify(spotlight.byKind('array', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.c -> (array)'], 'lowercase [[Class]]');

    actual = simplify(spotlight.byKind('object', { 'object': a.b }));
    assert.deepEqual(actual, ['<object>.c -> (array)'], 'typeof');

    actual = simplify(spotlight.byKind('Object', { 'object': a.b }));
    assert.deepEqual(actual, [], 'no-match [[Class]]');

    root.a = { 'b': { 'c': null } };

    actual = simplify(spotlight.byKind('null', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.c -> (null)'], 'null');

    root.a = { 'b': { 'c': undefined } };

    actual = simplify(spotlight.byKind('undefined', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.c -> (undefined)'], 'undefined');

    actual = spotlight.byKind(null);
    assert.strictEqual(actual, null, 'incorrect argument');
  });

 /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.byName', function(assert) {
    assert.expect(6);

    root.a = { 'b': { 'c': 12 } };

    var actual = simplify(spotlight.byName('c'));
    assert.deepEqual(actual.slice(0, 1), [rootName + '.a.b.c -> (number)'], 'basic');

    root.a = { 'a': { 'a': { 'b': { 'c': 12 } } } };

    actual = simplify(spotlight.byName('c'));
    assert.deepEqual(actual.slice(0, 1), [rootName + '.a.a.a.b.c -> (number)'], 'repeated property names');

    root.a = { 'foo': { 'b': { 'foo': { 'c': { 'foo': 12 } } } } };

    var expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (number)'
    ];

    actual = simplify(spotlight.byName('foo'));
    assert.deepEqual(actual.slice(0, 3), expected, 'multiple matches');

    root.a = {
      'foo': { 'b': { 'foo': { 'c': {} } } },
      'bar': {}
    };
    a.foo.b.foo.c.foo = a;
    a.bar.b = a.foo.b;

    expected = [
      rootName + '.a.foo -> (object)',
      rootName + '.a.foo.b.foo -> (object)',
      rootName + '.a.foo.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    actual = simplify(spotlight.byName('foo'));

    // QUnit can't handle circular references :/
    var filtered = _.filter(actual, function(value) {
      return /a\.foo/.test(value);
    });

    assert.deepEqual(filtered.sort(), expected, 'circular references');

    expected = [
      rootName + '.a.bar.b.foo -> (object)',
      rootName + '.a.bar.b.foo.c.foo -> (<' + rootName + '.a>)'
    ];

    filtered = _.filter(actual, function(value) {
      return /a\.bar/.test(value);
    });

    assert.deepEqual(filtered.sort(), expected, 'sibling containing circular references');

    actual = spotlight.byName(12);
    assert.strictEqual(actual, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.byValue', function(assert) {
    assert.expect(3);

    var value = new String('a');
    root.a = { 'b': { 'c': value } };

    var actual = simplify(spotlight.byValue(value));
    assert.deepEqual(actual.slice(0, 1), [rootName + '.a.b.c -> (string)'], 'basic');

    root.a = { 'b': { 'c': 12 } };

    actual = simplify(spotlight.byValue('12', { 'object': a }));
    assert.deepEqual(actual, [], 'strict match');

    root.a = { 'b': { 'c': NaN } };

    actual = simplify(spotlight.byValue(NaN, { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.c -> (number)'], '`NaN`');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.custom', function(assert) {
    assert.expect(3);

    var now = String(+new Date);
    root.a = { 'b': { 'c': +now } };

    var actual = simplify(spotlight.custom(function(value, key) {
      // avoid problems with `window.java` and `window.netscape` objects
      // potentially killing script execution when their values are coerced
      return typeof value == 'number' && value == now;
    }, { 'object': a }));

    assert.deepEqual(actual.slice(0, 1), ['<object>.b.c -> (number)'], 'basic');

    spotlight.custom(function() {
      actual = slice.call(arguments);
    }, { 'object': a });

    assert.deepEqual(actual, [a.b.c, 'c', a.b], 'callback arguments');

    actual = spotlight.custom('type');
    assert.strictEqual(actual, null, 'incorrect argument');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.runInContext', function(assert) {
    assert.expect(1);

    var actual,
        value = new String('a');

    var customSpotlight = spotlight.runInContext({
      '_': _,
      'console': { 'log': function(value, _) { actual = value; } }
    });

    customSpotlight.byValue(value, {
      'object': { 'b': { 'c': value } }
    });

    assert.deepEqual(actual, '<object>.b.c -> (string)');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('spotlight.debug', function(assert) {
    assert.expect(2);

    var value = new String('a');

    var customSpotlight = spotlight.runInContext({
      '_': _,
      'console': { 'log': function() {} }
    });

    customSpotlight.debug(true);

    var actual = simplify(customSpotlight.byValue(value, {
      'object': { 'b': { 'c': value } }
    }));

    assert.deepEqual(actual, ['<object>.b.c -> (string)'], 'spotlight.debug(true)');

    customSpotlight.debug(false);
    actual = customSpotlight.byValue(value, { 'object': { 'b': { 'c': value } } });
    assert.strictEqual(actual, undefined, 'spotlight.debug(false)');
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('for..in', function(assert) {
    assert.expect(5);

    root.a = { 'b': { 'valueOf': function() {} } };

    var actual = simplify(spotlight.byName('valueOf', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.valueOf -> (function)'], 'shadowed property');

    root.a = { 'b': { 'toString': function() {} } };

    actual = simplify(spotlight.byName('toString', { 'object': a }));
    assert.deepEqual(actual, ['<object>.b.toString -> (function)'], 'custom toString');

    root.a = {};

    actual = simplify(spotlight.byName('a', { 'object': (root === root.window ? root.window : root) }));
    assert.deepEqual(actual.slice(0, 1), [rootName + '.a -> (object)'], 'Opera < 10.53 window');

    if (!Object.getOwnPropertyNames) {
      root.a = function() {};

      actual = simplify(spotlight.byName('prototype', { 'object': a }));
      assert.deepEqual(actual, [], 'skips prototype');

      actual = simplify(spotlight.byName('constructor', { 'object': a.prototype, 'path': 'a.prototype' }));
      assert.deepEqual(actual, [], 'IE < 9 prototype.constructor');
    }
    else {
      skipTest(assert, 2);
    }
  });

  /*--------------------------------------------------------------------------*/

  QUnit.test('supports loading Spotlight.js as a module', function(assert) {
    assert.expect(1);

    if (amd) {
      assert.strictEqual((spotlightModule || {}).version, spotlight.version);
    }
    else {
      skipTest(assert);
    }
  });

  /*--------------------------------------------------------------------------*/

  QUnit.config.asyncRetries = 10;
  QUnit.config.hidepassed = true;

  if (!document) {
    QUnit.config.noglobals = true;
    QUnit.load();
  }
}.call(this));
