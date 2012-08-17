# Spotlight.js <sup>v1.0.0-pre</sup>

<!-- div -->


<!-- div -->

## <a id="spotlight"></a>`spotlight`
* [`spotlight`](#spotlight)
* [`spotlight.debug`](#spotlightdebug)
* [`spotlight.version`](#spotlightversion)
* [`spotlight.byKind`](#spotlightbykindkind--options)
* [`spotlight.byName`](#spotlightbynamename--options)
* [`spotlight.byValue`](#spotlightbyvaluevalue--options)
* [`spotlight.custom`](#spotlightcustomcallback--options)

<!-- /div -->


<!-- /div -->


<!-- div -->


<!-- div -->

## `spotlight`

<!-- div -->

### <a id="spotlight"></a>`spotlight`
<a href="#spotlight">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L681 "View in source") [&#x24C9;][1]

*(Object)*: The primary namespace.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightdebug"></a>`spotlight.debug`
<a href="#spotlightdebug">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L689 "View in source") [&#x24C9;][1]

*(Boolean)*: A flag to indicate that methods will execute in debug mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightversion"></a>`spotlight.version`
<a href="#spotlightversion">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L698 "View in source") [&#x24C9;][1]

*(String)*: The semantic version number.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightbykindkind--options"></a>`spotlight.byKind(kind [, options={}])`
<a href="#spotlightbykindkind--options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L609 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties whose values are of a specified constructor instance, [[Class]], or type.

#### Arguments
1. `kind` *(Function|String)*: The constructor, [[Class]], or type to check against.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// by constructor
spotlight.byKind(jQuery);

// or by [[Class]]
spotlight.byKind('RegExp');

// or by type
spotlight.byKind('undefined');

// or special kind "constructor"
spotlight.byKind('constructor');
```

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightbynamename--options"></a>`spotlight.byName(name [, options={}])`
<a href="#spotlightbynamename--options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L631 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties of the specified name.

#### Arguments
1. `name` *(String)*: The property name to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// basic
// > window.length -> (number) 0
spotlight.byName('length');

// or with options
// (finds all "map" properties on jQuery)
// > $.map -> (function) function(a,b,c){...}
// > $.fn.map -> (function) function(a){...}
spotlight.byName('map', { 'object': jQuery, 'path': '$' });
```

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightbyvaluevalue--options"></a>`spotlight.byValue(value [, options={}])`
<a href="#spotlightbyvaluevalue--options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L650 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties whose values are a strict match for the specified value.

#### Arguments
1. `value` *(Mixed)*: The value to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// basic
// > window.pageXOffset -> (number) 0
// > window.screenX -> (number) 0
// > window.length -> (number) 0
spotlight.byValue(0);
```

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightcustomcallback--options"></a>`spotlight.custom(callback [, options={}])`
<a href="#spotlightcustomcallback--options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L670 "View in source") [&#x24C9;][1]

Crawls environment objects executing `callback`, passing the current `value`, `key`, and `object` as arguments, against each object encountered and logs properties for which `callback` returns true.

#### Arguments
1. `callback` *(Function)*: A function executed per object.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// filter by property names containing "oo"
spotlight.custom(function(value, key) { return key.indexOf('oo') > -1; });

// or filter by falsey values
spotlight.custom(function(value) { return !value; });
```

* * *

<!-- /div -->


<!-- /div -->


<!-- /div -->


  [1]: #spotlight "Jump back to the TOC."