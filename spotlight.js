/*!
 * Spotlight.js v1.1.0 <https://github.com/bestiejs/spotlight.js/>
 * Copyright 2011-2015 John-David Dalton <http://allyoucanleet.com/>
 * Based on Waldo <https://github.com/angus-c/waldo/>,
 * Copyright 2011-2015 Angus Croll <http://javascriptweblog.wordpress.com/>
 * Both available under MIT license <http://mths.be/mit>
 */
;(function() {
  'use strict';

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'console', 'document', 'environment', 'exports', 'Function', 'Iterator',
    'java', 'JSON', 'Object', 'phantom', 'print', 'RegExp', 'String'
  ];

  /** Used to determine if values are of the language type `Object` */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `define` */
  var freeDefine = typeof define == 'function' && typeof define.amd == 'object' && define.amd && define;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  /** Detect free variable `require` */
  var freeRequire = typeof require == 'function' && require;

  /*--------------------------------------------------------------------------*/

  /**
   * A wrapper around `require()` to suppress `module missing` errors.
   *
   * @private
   * @param {string} id The module id.
   * @returns {*} The exported module or `null`.
   */
  function req(id) {
    try {
      var result = freeExports && freeRequire(id);
    } catch(e) {}
    return result || null;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `spotlight` object using the given `context` object.
   *
   * @memberOf spotlight
   * @param {Object} [context=root] The context object.
   * @returns {Object} Returns a new `spotlight` object.
   */
  function runInContext(context) {
    // exit early if unable to acquire Lo-Dash
    var _ = context && context._ || !freeDefine && req('lodash') || root._;
    if (!_) {
      return { 'runInContext': runInContext };
    }

    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    var originalContext = context || root;
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Function = context.Function,
        Iterator = context.Iterator,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String;

    /** Used to indicate that methods will execute in debug mode */
    var isDebug = false;

    /** Used to resolve a value's internal `[[Class]]` */
    var toString = Object.prototype.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s?toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Native method shortcuts */
    var fnToString = Function.prototype.toString,
        getDescriptor = isNative(getDescriptor = Object.getOwnPropertyDescriptor) && getDescriptor,
        setDescriptor = isNative(setDescriptor = Object.defineProperty) && setDescriptor;

    /** Filter functions used by `crawl` */
    var filters = {
      'kind': function(value, key, object) {
        var kind = [value, value = object[key]][0];
        return kind == '*' || (_.isFunction(kind)
          ? value instanceof kind
          : typeof value == kind || getKindOf(value).toLowerCase() == kind.toLowerCase()
        );
      },
      'name': function(value, key) {
        return value == key;
      },
      'value': function(value, key, object) {
        return value === value
          ? object[key] === value
          // special case for `NaN`
          : object[key] !== object[key];
      }
    };

    /** Used to flag environments features */
    var support = {

      /** Detect ES5 property descriptor API */
      'descriptors' : (function() {
        // IE 8 only accepts DOM elements
        try {
          var o = {};
          setDescriptor(o, o, o);
          var result = 'value' in getDescriptor(o, o);
        } catch(e) {};
        return !!result;
      }()),

      /**
       * Detect JavaScript 1.7 iterators
       * https://developer.mozilla.org/en/new_in_javascript_1.7#Iterators
       */
      'iterators': (function() {
        try {
          var o = Iterator({ '': 1 });
          for (o in o) {}
        } catch(e) {}
        return _.isArray(o);
      }())
    };

    /** Used as the starting point(s) for the object crawler */
    var defaultRoots = [{ 'object': originalContext, 'path': 'window' }];

    // set `defaultRoots` for CLI environments like Narwhal, Node.js, or RingoJS
    if (freeGlobal) {
      defaultRoots = [{ 'object': freeGlobal, 'path': 'global' }];
      // for the Narwhal REPL
      if (originalContext != freeGlobal) {
        defaultRoots.unshift({ 'object': originalContext, 'path': '<module scope>' });
      }
      // avoid explicitly crawling `exports` if it's crawled indirectly
      if (!(freeGlobal.exports == freeExports || context.exports == freeExports)) {
        defaultRoots.unshift({ 'object': freeExports, 'path': 'exports' });
      }
    }
    // for Rhino
    else if (isHostType(context, 'environment') && isHostType(context, 'java')) {
      defaultRoots[0].path = '<global object>';
    }

    /*------------------------------------------------------------------------*/

    /**
     * Iterates over an object's own properties, executing the `callback` for each.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} callback A function executed per own property.
     */
    function forOwn(object, callback) {
      object = Object(object);

      try {
        // avoid problems with iterators
        // https://github.com/ringo/ringojs/issues/157
        if (support.iterators && _.isFunction(object.__iterator__)) {
          var iterator = support.descriptors
            ? getDescriptor(object, '__iterator__')
            : object.__iterator__;

          object.__iterator__ = null;
          delete object.__iterator__;

          if (object.__iterator__) {
            throw 1;
          }
          object = new Iterator(object);
          if (support.descriptors) {
            setDescriptor(object, '__iterator__', iterator);
          } else {
            object.__iterator__ = iterator;
          }
        }
        // some objects like Firefox 3's `XPCSafeJSObjectWrapper.prototype` may
        // throw errors when attempting to iterate over them
        else {
          for (var key in object) {
            break;
          }
        }
      } catch(e) {
        return;
      }
      if (iterator) {
        for (key in object) {
          // iterators will assign an array to `key`
          callback(key[1], key[0]);
        }
      }
      else {
        var index = -1,
            props = _.keys(object),
            length = props.length;

        while (++index < length) {
          // some properties like Firefox's `console.constructor` or IE's
          // `element.offsetParent` may throw errors when accessed
          try {
            key = props[index];
            var value = object[key];
          } catch(e) {
            continue;
          }
          callback(value, key);
        }
      }
    }

    /**
     * Gets the internal `[[Class]]` of a given `value`.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {string} Returns the value's internal `[[Class]]`.
     */
    function getClass(value) {
      if (value == null) {
        return value === null ? 'Null' : 'Undefined';
      }
      try {
        var result = _.result(/^\[object (.*?)\]$/.exec(toString.call(value)), 1);
      } catch(e) {}

      return result || '';
    }

    /**
     * Mimics ES 5.1's `Object.prototype.toString` behavior by returning the
     * value's `[[Class]]`, "Null" or "Undefined" as well as other non-spec'ed results
     * like "Constructor" and "Global" .
     *
     * @private
     * @param {*} value The value to check.
     * @returns {string} Returns a string representing the kind of `value`.
     */
    function getKindOf(value) {
      var result;

      if (value == null) {
        result = value === null ? 'Null' : 'Undefined';
      }
      else if (value == context) {
        result = 'Global';
      }
      else if (_.isFunction(value) && isHostType(value, 'prototype')) {
        // a function is assumed of kind "Constructor" if it has its own
        // enumerable prototype properties or doesn't have a `[[Class]]` of Object
        try {
          if (getClass(value.prototype) == 'Object') {
            for (var key in value.prototype) {
              result = 'Constructor';
              break;
            }
          } else {
            result = 'Constructor';
          }
        } catch(e) {}
      }
      return result || getClass(value) ||
        (result = typeof value, result.charAt(0).toUpperCase() + result.slice(1))
    }

    /**
     * Host objects can return type values that are different from their actual
     * data type. The objects we are concerned with usually return non-primitive
     * types of "object", "function", or "unknown".
     *
     * @private
     * @param {mixed} object The owner of the property.
     * @param {string} property The property to check.
     * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
     */
    function isHostType(object, property) {
      var type = object != null ? typeof object[property] : 'number';
      return objectTypes[type] && (type == 'object' ? !!object[property] : true);
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return _.isFunction(value) && reNative.test(fnToString.call(value));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Performs argument type checks and calls `crawl()` with specified arguments.
     *
     * @private
     * @param {string} name The name of the filter function passed.
     * @param {string} expected The data type expected of the given value.
     * @param {*} value A generic argument passed to the callback.
     * @param {Object} [options={}] The options object passed.
     * @returns {Array|null} If in debug mode return the value of the invoked function or `null` if errored.
     */
    function checkCall(name, expected, value, options) {
      var result = (!expected || RegExp('^(?:' + expected + ')$', 'i').test(getKindOf(value)))
        ? crawl(name, value, options)
        : (log('error', '`' + value + '` must be a ' + expected.split('|').join(' or ')), null);

      return isDebug ? result : undefined;
    }

    /**
     * Crawls environment objects logging all properties that pass the callback filter.
     *
     * @private
     * @param {Function|string} callback A function executed per object encountered.
     * @param {*} callbackArg An argument passed to the callback.
     * @param {Object} [options={}] The options object.
     * @returns {Array} An array of arguments passed to each `console.log()` call.
     */
    function crawl(callback, callbackArg, options) {
      options || (options = {});

      if (callback == 'custom') {
        var isCustom = true;
      } else {
        isCustom = false;
        callback = filters[callback];
      }
      var data,
          index,
          pool,
          pooled,
          queue,
          separator,
          roots = defaultRoots.slice(),
          object = options.object,
          path = options.path,
          result = [];

      // resolve object roots
      if (object) {
        // resolve `undefined` path
        if (path == null) {
          path = _.result(_.find(roots, { 'object': object }), 'path') || '<object>';
        }
        roots = [{ 'object': object, 'path': path }];
      }
      // crawl all root objects
      while ((data = roots.pop())) {
        index = 0;
        object = data.object;
        path = data.path;
        data = { 'object': object, 'path': path, 'pool': [object] };
        queue = [];

        // a non-recursive solution to avoid call stack limits
        // http://www.jslab.dk/articles/non.recursive.preorder.traversal.part4
        do {
          object = data.object;
          path = data.path;
          separator = path ? '.' : '';

          forOwn(object, function(value, key) {
            // (IE may throw errors coercing properties like `window.external` or `window.navigator`)
            try {
              // inspect objects
              if (_.isPlainObject(value)) {
                // clone current pool per prop on the current `object` to avoid
                // sibling properties from polluting each others object pools
                pool = data.pool.slice();

                // check if already pooled (prevents infinite loops when handling circular references)
                pooled = _.find(pool, function(data) {
                  return value == data.object;
                });
                // add to the "call" queue
                if (!pooled) {
                  pool.push({ 'object': value, 'path': path + separator + key, 'pool': pool });
                  queue.push(_.last(pool));
                }
              }
              // if filter passed, log it
              if (
                isCustom
                  ? callbackArg.call(data, value, key, object)
                  : callback(callbackArg, key, object)
              ) {
                value = [
                  path + separator + key + ' -> (' +
                  (pooled ? '<' + pooled.path + '>' : getKindOf(value).toLowerCase()) + ')',
                  value
                ];
                result.push(value);
                log('text', value[0], value[1]);
              }
            } catch(e) {}
          });
        } while ((data = queue[index++]));
      }
      return result;
    }

    /**
     * Logs a message to the console.
     *
     * @private
     * @param {string} type The log type, either "text" or "error".
     * @param {string} message The log message.
     * @param {*} value An additional value to log.
     */
    function log() {
      var defaultCount = 2,
          console = isHostType(context, 'console') && context.console,
          document = isHostType(context, 'document') && context.document,
          phantom = isHostType(context, 'phantom') && context.phantom,
          JSON = isHostType(context, 'JSON') && _.isFunction(context.JSON && context.JSON.stringify) && context.JSON;

      // lazy define
      log = function(type, message, value) {
        var argCount = defaultCount,
            method = 'log';

        if (type == 'error') {
          argCount = 1;
          if (isHostType(console, type)) {
            method = type;
          } else {
            message = type + ': ' + message;
          }
        }
        // avoid logging if in debug mode and running from the CLI
        if (!isDebug || (document && !phantom)) {
          // because `console.log` is a host method we don't assume `.apply()` exists
          if (argCount < 2) {
            if (JSON) {
              value = [JSON.stringify(value), value];
              value = value[0] == 'null' ? value[1] : value[0];
            }
            console[method](message + (type == 'error' ? '' : ' ' + value));
          } else {
            console[method](message, value);
          }
        }
      };

      // for Narwhal, Rhino, or RingoJS
      if (!console && !document && _.isFunction(context.print)) {
        console = { 'log': print };
      }
      // use noop for no log support
      if (!isHostType(console, 'log')) {
        log = function() {};
      }
      // avoid Safari 2 crash bug when passing more than 1 argument
      else if (console.log.length == 1) {
        defaultCount = 1;
      }
      return log.apply(null, arguments);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Crawls environment objects logging all object properties whose values
     * are of a specified constructor instance, `[[Class]]`, or type.
     *
     * @memberOf spotlight
     * @param {Function|string} kind The constructor, `[[Class]]`, or type to check against.
     * @param {Object} [options={}] The options object.
     * @example
     *
     * // by constructor
     * spotlight.byKind(jQuery);
     *
     * // or by `[[Class]]`
     * spotlight.byKind('RegExp');
     *
     * // or by type
     * spotlight.byKind('undefined');
     *
     * // or special kind "constructor"
     * spotlight.byKind('constructor');
     */
    function byKind(kind, options) {
      return checkCall('kind', 'function|string', kind, options);
    }

    /**
     * Crawls environment objects logging all object properties of the specified name.
     *
     * @memberOf spotlight
     * @param {string} name The property name to search for.
     * @param {Object} [options={}] The options object.
     * @example
     *
     * // basic
     * spotlight.byName('length');
     * // => window.length -> (number) 0
     *
     * // or with options
     * // (finds all "map" properties on jQuery)
     * spotlight.byName('map', { 'object': jQuery, 'path': '$' });
     * // => $.map -> (function) function(a,b,c){...}
     * // => $.fn.map -> (function) function(a){...}
     */
    function byName(name, options) {
      return checkCall('name', 'string', name, options);
    }

    /**
     * Crawls environment objects logging all object properties whose values are
     * a match for the specified value, using `SameValueZero` for equality comparisons.
     *
     * **Note:** `SameValueZero` is like strict equality, e.g. `===`, except that
     * `NaN` matches `NaN`. See the [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * for more details.
     *
     * @memberOf spotlight
     * @param {*} value The value to search for.
     * @param {Object} [options={}] The options object.
     * @example
     *
     * // basic
     * spotlight.byValue(0);
     * // => window.pageXOffset -> (number) 0
     * // => window.screenX -> (number) 0
     * // => window.length -> (number) 0
     */
    function byValue(value, options) {
      return checkCall('value', null, value, options);
    }

    /**
     * Crawls environment objects executing `callback`, passing the current
     * `value`, `key`, and `object` as arguments, against each object encountered
     * and logs properties for which `callback` returns true.
     *
     * @memberOf spotlight
     * @param {Function} callback A function executed per object.
     * @param {Object} [options={}] The options object.
     * @example
     *
     * // filter by property names containing "oo"
     * spotlight.custom(function(value, key) { return key.indexOf('oo') > -1; });
     *
     * // or filter by falsey values
     * spotlight.custom(function(value) { return !value; });
     */
    function custom(callback, options) {
      return checkCall('custom', 'function', callback, options);
    }

    /**
     * This function enables or disables debug mode for all `spotlight` methods.
     *
     * @memberOf spotlight
     * @param {boolean} value The flag value.
     * @example
     *
     * spotlight.debug(true);
     * spotlight.byName('length');
     * // => [['window.length -> (number)', 0]]
     */
    function debug(value) {
      isDebug = !!value;
    }

    /*------------------------------------------------------------------------*/

    /**
     * The primary namespace.
     *
     * @type Object
     * @name spotlight
     */
    var spotlight = {};

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf spotlight
     * @type string
     */
    spotlight.version = '1.1.0';

    spotlight.byKind = byKind;
    spotlight.byName = byName;
    spotlight.byValue = byValue;
    spotlight.custom = custom;
    spotlight.debug = debug;
    spotlight.runInContext = runInContext;

    return spotlight;
  }

  /*--------------------------------------------------------------------------*/

  // export spotlight
  var spotlight = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // define as an anonymous module so, through path mapping, it can be aliased
    define(['lodash'], function(_) {
      return runInContext({
        '_': _
      });
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Narwhal, Node.js, Rhino -require, or RingoJS
    freeExports.byKind = spotlight.byKind;
    freeExports.byName = spotlight.byName;
    freeExports.byValue = spotlight.byValue;
    freeExports.custom = spotlight.custom;
    freeExports.debug = spotlight.debug;
    freeExports.runInContext = spotlight.runInContext;
    freeExports.version = spotlight.version;
  }
  else {
    // in a browser or Rhino
    root.spotlight = spotlight;
  }
}.call(this));
