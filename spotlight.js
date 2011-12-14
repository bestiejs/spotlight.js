/*!
 * Spotlight.js <http://github.com/bestiejs/spotlight.js/>
 * Copyright 2011 John-David Dalton <http://allyoucanleet.com/>
 * Based on Waldo <http://github.com/angus-c/waldo/>,
 * Copyright 2011 Angus Croll <http://javascriptweblog.wordpress.com/>
 * Both available under MIT license <http://mths.be/mit>
 */
;(function(window, undefined) {

  /* Used as the starting point(s) for the object crawler */
  var defaultRoots = [{ 'object': window, 'path': 'window' }],

  /** Detect free variable `exports` */
  freeExports = typeof exports == 'object' && exports,

  /** Detect free variable `global` */
  freeGlobal = typeof global == 'object' && global && (global == global.global ? (window = global) : global),

  /** Used to crawl all properties regardless of enumerability */
  getAllKeys = Object.getOwnPropertyNames,

  /** Used to get __iterator__ descriptors */
  getDescriptor = Object.getOwnPropertyDescriptor,

  /** Used in case an object doesn't have its own method */
  hasOwnProperty = {}.hasOwnProperty,

  /** Used to set __iterator__ descriptors */
  setDescriptor = Object.defineProperty,

  /** Used to resolve a value's internal [[Class]] */
  toString = {}.toString,

  /** Filter functions used by `crawl()` */
  filters = {
    'custom': function(value, key, object) {
      // the `this` binding is set by `crawl()`
      return value.call(this, object[key], key, object);
    },
    'kind': function(value, key, object) {
      var kind = [value, value = object[key]][0];
      return isFunction(kind) ? value instanceof kind :
        typeof value == kind || getKindOf(value).toLowerCase() == kind.toLowerCase();
    },
    'name': function(value, key, object) {
      return value == key;
    },
    'value': function(value, key, object) {
      return object[key] === value;
    }
  },

  /** Used to flag features */
  has = {

    /** Detect if strings support accessing characters by index */
    'charByIndex': '0'[0] == '0',

    /** Detect ES5+ property descriptor API */
    'descriptors' : !!(function() {
      try {
        var o = {};
        return (setDescriptor(o, o, o), 'value' in getDescriptor(o, o));
      } catch(e) { }
    }()),

    /** Detect ES5+ Object.getOwnPropertyNames() */
    'getAllKeys': !!(function() {
      try {
        return /\bvalueOf\b/.test(getAllKeys(Object.prototype));
      } catch(e) { }
    }()),

    /**
     * Detect JavaScript 1.7 iterators
     * https://developer.mozilla.org/en/new_in_javascript_1.7#Iterators
     */
    'iterators': !!(function() {
      try {
        var o = Iterator({ '': 1 });
        for (o in o) { }
        return toString.call(o) == '[object Array]';
      } catch(e) { }
    }())
  };

  /*--------------------------------------------------------------------------*/

  /**
   * Returns the first array value for which `callback` returns true.
   * @private
   * @param {Array} array The array to search.
   * @param {Function} callback A function executed per array value .
   * @returns {Mixed} The filtered value.
   */
  function filterOne(array, callback) {
    var length = array.length;
    while (length--) {
      if (callback(array[length])) {
        return array[length];
      }
    }
  }

  /**
   * Iterates over array-like-objects.
   * Callbacks may terminate the loop by explicitly returning `false`.
   * @private
   * @param {Object} object The object to iterate over and pass to the callback.
   * @param {Function} callback The function called per iteration.
   * @param {Object} [iteratee=`object`] An alternate object to iterate over.
   * @returns {Boolean|Undefined} Returns `false` if the loop was terminated, else `undefined`.
   */
  function forArrayLike(object, callback, iteratee) {
    iteratee || (iteratee = object);
    for (var index = 0, length = object.length; index < length; index++) {
      if (callback(iteratee[index], String(index), object) === false) {
        // return `false` is needed for use in `forOwn()`
        return false;
      }
    }
  }

  /**
   * Iterates over an object's own properties, executing the `callback` for each.
   * Callbacks may terminate the loop by explicitly returning `false`.
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} callback A function executed per own property.
   */
  function forOwn() {
    var enumFlag = 0,
        forArgs = forArrayLike,
        forShadowed = false,
        forString = !has.charByIndex && forArrayLike,
        hasSeen = false,
        shadowed = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

    (function(key) {
      // must use a non-native constructor to catch the Safari 2 issue
      function Klass() { this.valueOf = 0; };
      Klass.prototype.valueOf = 0;
      // check various for..in bugs
      for (key in new Klass) {
        enumFlag += key == 'valueOf' ? 1 : 0;
      }
      // check if `arguments` objects have non-enumerable indexes
      for (key in arguments) {
        key == '0' && (forArgs = false);
      }
    }(0));

    // Safari 2 iterates over shadowed properties twice
    // http://replay.waybackmachine.org/20090428222941/http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
    if (enumFlag == 2) {
      hasSeen = function(seen, key) {
        return hasKey(seen, key) || !(seen[key] = true);
      };
    }
    // IE < 9 incorrectly makes an object's properties non-enumerable if they have
    // the same name as other non-enumerable properties in its prototype chain.
    else if (!enumFlag) {
      forShadowed = function(object, callback) {
        // Because IE < 9 can't set the `[[Enumerable]]` attribute of an existing
        // property and the `constructor` property of a prototype defaults to
        // non-enumerable, we manually skip the `constructor` property when we
        // think we are iterating over a `prototype` object.
        try {
          var ctor = object.constructor,
              skipCtor = ctor && ctor.prototype && ctor.prototype.constructor === ctor;
        } catch(e) { }

        for (var key, index = 0; key = shadowed[index]; index++) {
          if (!(skipCtor && key == 'constructor') &&
              hasKey(object, key) &&
              callback(object[key], key, object) === false) {
            break;
          }
        }
      };
    }

    // lazy define
    forOwn = function(object, callback) {
      var iterator,
          key,
          length,
          value,
          done = !object,
          index = -1,
          keys = [],
          seen = {},
          skipProto = isFunction(object);

      object = Object(object);

      // if possible search all properties
      if (has.getAllKeys) {
        try {
          keys = getAllKeys(object);
        } catch(e) { }

        if ((length = keys.length)) {
          while (++index < length) {
            key = keys[index];
            try {
              value = object[key];
            } catch(e) {
              continue;
            }
            if (callback(value, key, object) === false) {
              break;
            }
          }
          return;
        }
      }
      // else search only enumerable properties
      try {
        // avoid problems with iterators
        // https://github.com/ringo/ringojs/issues/157
        if (has.iterators && isFunction(object.__iterator__)) {
          iterator = has.descriptors
            ? getDescriptor(object, '__iterator__')
            : object.__iterator__;

          object.__iterator__ = null;
          delete object.__iterator__;
          if (object.__iterator__) {
            throw 1;
          }
          object = [new Iterator(object), has.descriptors
            ? setDescriptor(object, '__iterator__', iterator)
            : object.__iterator__ = iterator
          ][0];
        }
        // some objects like Firefox 3's `XPCSafeJSObjectWrapper.prototype` may
        // throw errors when attempting to iterate over them
        else {
          for (key in object) {
            break;
          }
        }
      } catch(e) {
        return;
      }

      for (key in object) {
        // iterators will assign an array to `key`
        if (iterator) {
          value = key[1];
          key = key[0];
        }
        else {
          // some properties like Firefox's `console.constructor` or IE's
          // `element.offsetParent` may throw errors when accessed
          try {
            value = object[key];
          } catch(e) {
            continue;
          }
        }
        // Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
        // (if the prototype or a property on the prototype has been set)
        // incorrectly set a function's `prototype` property [[Enumerable]] value
        // to true. Because of this we standardize on skipping the the `prototype`
        // property of functions regardless of their [[Enumerable]] value.
        if (done =
            !(skipProto && key == 'prototype') &&
            !(hasSeen && hasSeen(seen, key)) &&
            (iterator || hasKey(object, key)) &&
            callback(value, key, object) === false) {
          break;
        }
      }
      // in IE < 9 strings don't support accessing characters by index
      if (!done && forString && toString.call(object) == '[object String]') {
        done = forString(object, callback, object.split('')) === false;
      }
      else if (!done && forArgs && isArguments(object)) {
        done = forArgs(object, callback) === false;
      }
      if (!done && forShadowed) {
        forShadowed(object, callback);
      }
    };
    forOwn.apply(null, arguments);
  }

  /**
   * Mimics ES 5.1's `Object.prototype.toString` behavior by returning the
   * value's [[Class]], "Null" or "Undefined" as well as other non-spec'ed results
   * like "Constructor" and "Global" .
   * @private
   * @param {Mixed} value The value to check.
   * @returns {String} Returns a string representing the kind of `value`.
   */
  function getKindOf(value) {
    var result;
    if (value == null) {
      result = value === null ? 'Null' : 'Undefined';
    }
    else if (value == window) {
      result = 'Global';
    }
    else if (isFunction(value) && isHostType(value, 'prototype')) {
      // a function is assumed of kind "Constructor" if it has its own
      // enumerable prototype properties or doesn't have a [[Class]] of Object
      try {
        if (toString.call(value.prototype) == '[object Object]') {
          for (var key in value.prototype) {
            result = 'Constructor';
            break;
          }
        } else {
          result = 'Constructor';
        }
      } catch(e) { }
    }
    return result || (toString.call(value).match(/^\[object (.*?)\]$/) || 0)[1] ||
      (result = typeof value, result.charAt(0).toUpperCase() + result.slice(1))
  }

  /**
   * Checks if an object has the specified key as a direct property.
   * @private
   * @param {Object} object The object to check.
   * @param {String} key The key to check for.
   * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
   */
  function hasKey() {
    // lazy define for modern browsers
    if (isFunction(hasOwnProperty)) {
      hasKey = function(object, key) {
        return hasOwnProperty.call(Object(object), key);
      };
    }
    // or for Safari 2
    else if ({}.__proto__ == Object.prototype) {
      hasKey = function(object, key) {
        var result;
        object = Object(object);
        object.__proto__ = [object.__proto__, object.__proto__ = null, result = key in object][0];
        return result;
      };
    }
    // or for others (not as accurate)
    else {
      hasKey = function(object, key) {
        object = Object(object);
        var parent = (object.constructor || Object).prototype;
        return key in object && !(key in parent && object[key] === parent[key]);
      };
    }
    // or for an Opera < 10.53 bug, found by Garrett Smith, that occurs with
    // window objects and not the global `this`
    if (window.window == window && !hasKey(window.window, 'Object')) {
      var __hasKey = hasKey;
      hasKey = function(object, key) {
        return object == window
          ? key in object && object[key] !== {}[key]
          : __hasKey(object, key);
      };
    }
    return hasKey.apply(null, arguments);
  }

  /**
   * Checks if a value is an `arguments` object.
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the value is an `arguments` object, else `false`.
   */
  function isArguments() {
    // lazy define
    isArguments = function(value) {
      return toString.call(value) == '[object Arguments]';
    };
    if (!isArguments(arguments)) {
      isArguments = function(value) {
        return !!value && hasKey(value, 'callee');
      };
    }
    return isArguments(arguments[0]);
  }

  /**
   * Checks if the specified `value` is a function.
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if `value` is a function, else `false`.
   */
  function isFunction(value) {
    return toString.call(value) == '[object Function]';
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of object, function, or unknown.
   * @private
   * @param {Mixed} object The owner of the property.
   * @param {String} property The property to check.
   * @returns {Boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    var type = object != null ? typeof object[property] : 'number';
    return !/^(?:boolean|number|string|undefined)$/.test(type) &&
      (type == 'object' ? !!object[property] : true);
  }

  /**
   * Checks if the specified `value` is an Object object.
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if `value` is an object, else `false`.
   */
  function isObject(value) {
    var constructor,
        result = toString.call(value) == '[object Object]';

    // some objects like `window.java` may kill script execution when checking
    // for their constructor, so we filter by [[Class]] first
    if (result) {
      // some properties throw errors when accessed
      try {
        constructor = value && value.constructor;
      } catch(e) { }
      // IE < 9 presents nodes like Object objects:
      // IE < 8 are missing the node's constructor property
      // IE 8 node constructors are typeof "object"
      result = constructor && typeof constructor != 'object';
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Performs argument type checks and calls `crawl()` with specified arguments.
   * @private
   * @param {String} name The name of the filter function passed.
   * @param {String} expected The data type expected of the given value.
   * @param {Mixed} value A generic argument passed to the callback.
   * @param {Object} [options={}] The options object passed.
   * @returns {Array|Null} If in debug mode return the value of the invoked function or `null` if errored.
   */
  function checkCall(name, expected, value, options) {
    var result = (!expected || RegExp('^(?:' + expected + ')$', 'i').test(getKindOf(value)))
      ? crawl(name, value, options)
      : (log('error', '`' + value + '` must be a ' + expected.split('|').join(' or ')), null);

    return spotlight.debug ? result : undefined;
  }

  /**
   * Crawls environment objects logging all properties that pass the callback filter.
   * @private
   * @param {Function|String} callback A function executed per object encountered.
   * @param {Mixed} callbackArg An argument passed to the callback.
   * @param {Object} [options={}] The options object.
   * @returns {Array} An array of arguments passed to each `console.log()` call.
   */
  function crawl(callback, callbackArg, options) {
    callback = filters[callback] || callback;
    options || (options = {});

    var data,
        pool,
        pooled,
        queue,
        separator,
        roots = defaultRoots.slice(),
        object = options.object || roots[0].object,
        path = options.path,
        result = [];

    // resolve undefined path
    if (path == null) {
      path = (
        filterOne(roots, function(data) {
          return object == data.object;
        }) ||
        { 'path': '<object>' }
      ).path;
    }
    // resolve object roots
    if (options.object) {
      roots = [{ 'object': object, 'path': path }];
    }
    // crawl all root objects
    while ((data = roots.pop())) {
      object = data.object;
      path = data.path;
      queue = [{ 'object': object, 'path': path, 'pool': [object] }];

      // a non-recursive solution to avoid call stack limits
      // http://www.jslab.dk/articles/non.recursive.preorder.traversal.part4
      while ((data = queue.pop())) {
        object = data.object;
        path = data.path;
        separator = path ? '.' : '';

        forOwn(object, function(value, key) {
          // inspect objects
          if (isObject(value)) {
            // clone current pool per prop on the current `object` to avoid siblings
            // polluting each others object pools
            pool = data.pool.slice();

            // check if already pooled (prevents circular references)
            // console.log('debug:', path, key, data.pool.length, data.pool.slice());
            pooled = filterOne(pool, function(data) {
              return value == data.object;
            });

            // add to "call" queue
            if (!pooled) {
              pool.push({ 'object': value, 'path': path + separator + key, 'pool': pool });
              queue.push(pool[pool.length - 1]);
            }
          }
          // if filter passed, log it
          // (IE may throw errors coercing properties like `window.external` or `window.navigator`)
          try {
            if (callback.call(data, callbackArg, key, object)) {
              result.push([
                path + separator + key + ' -> (' +
                (true && pooled ? '<' + pooled.path + '>' : getKindOf(value).toLowerCase()) + ')',
                value
              ]);
              log('text', result[result.length - 1][0], value);
            }
          } catch(e) { }
        });
      }
    }
    return result;
  }

  /**
   * Logs a message to the console.
   * @private
   * @param {String} type The log type, either "text" or "error".
   * @param {String} message The log message.
   * @param {Mixed} value An additional value to log.
   */
  function log() {
    var defaultCount = 2,
        console = typeof window.console == 'object' && window.console,
        document = typeof window.document == 'object' && window.document,
        JSON = typeof window.JSON == 'object' && isFunction(window.JSON && window.JSON.stringify) && window.JSON;

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
      if (document || !spotlight.debug) {
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
    if (!console && !document && isFunction(window.print)) {
      console = { 'log': print };
    }
    // use noop for no log support
    if (!isHostType(console, 'log')) {
      log = function() { };
    }
    // avoid Safari 2 crash bug when passing more than 1 argument
    else if (console.log.length == 1) {
      defaultCount = 1;
    }
    return log.apply(null, arguments);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Crawls environment objects logging all object properties whose values
   * are of a specified constructor instance, [[Class]], or type.
   * @memberOf spotlight
   * @param {Function|String} kind The constructor, [[Class]], or type to check against.
   * @param {Object} [options={}] The options object.
   * @example
   *
   * // by constructor
   * spotlight.byKind(jQuery);
   *
   * // or by [[Class]]
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
   * @memberOf spotlight
   * @param {String} name The property name to search for.
   * @param {Object} [options={}] The options object.
   * @example
   *
   * // basic
   * // > window.length -> (number) 0
   * spotlight.byName('length');
   *
   * // or with options
   * // (finds all "map" properties on jQuery)
   * // > $.map -> (function) function(a,b,c){...}
   * // > $.fn.map -> (function) function(a){...}
   * spotlight.byName('map', { 'object': jQuery, 'path': '$' });
   */
  function byName(name, options) {
    return checkCall('name', 'string', name, options);
  }

  /**
   * Crawls environment objects logging all object properties whose values are
   * a strict match for the specified value.
   * @memberOf spotlight
   * @param {Mixed} value The value to search for.
   * @param {Object} [options={}] The options object.
   * @example
   *
   * // basic
   * // > window.pageXOffset -> (number) 0
   * // > window.screenX -> (number) 0
   * // > window.length -> (number) 0
   * spotlight.byValue(0);
   */
  function byValue(value, options) {
    return checkCall('value', null, value, options);
  }

  /**
   * Crawls environment objects executing `callback`, passing the current
   * `value`, `key`, and `object` as arguments, against each object encountered
   * and logs properties for which `callback` returns true.
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

  /*--------------------------------------------------------------------------*/

  /**
   * The primary namespace.
   * @type Object
   */
  var spotlight = {

    /**
     * A flag to indicate that methods will execute in debug mode.
     * @memberOf spotlight
     * @type Boolean
     */
    'debug': false,

    // searches for props by constructor instance, type, or [[Class]]
    'byKind': byKind,

    // searches for props by name
    'byName': byName,

    // searches for props by strict value matches
    'byValue': byValue,

    // executes a custom function per object
    'custom': custom
  };

  /*--------------------------------------------------------------------------*/

  // mod `defaultRoots` for server-side environments
  // for Narwhal, Node.js, or RingoJS
  if (freeExports && freeGlobal) {
    defaultRoots = [
      { 'object': freeExports, 'path': 'exports' },
      { 'object': freeGlobal, 'path': 'global' }
    ];
  }
  // for Rhino
  else if (getKindOf(window.environment) == 'Environment') {
    defaultRoots[0].path = '<global object>';
  }

  /*--------------------------------------------------------------------------*/

  // expose spotlight
  // in Narwhal, Node.js, or RingoJS
  if (freeExports) {
    forOwn(spotlight, function(value, key) {
      freeExports[key] = value;
    });
    // assign `exports` to `spotlight` so we can detect changes to the `debug` flag
    spotlight = freeExports;
  }
  // via curl.js or RequireJS
  else if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    define('spotlight', spotlight);
  }
  // in a browser or Rhino
  else {
    // use square bracket notation so Closure Compiler won't munge `spotlight`
    // http://code.google.com/closure/compiler/docs/api-tutorial3.html#export
    window['spotlight'] = spotlight;
  }
}(this));