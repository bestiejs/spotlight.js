# Spotlight.js <sup>v1.0.0-pre</sup>

<!-- div -->


<!-- div -->

## <a id="spotlight"></a>`spotlight`
* [`spotlight`](#spotlight)
* <a href="#spotlightdebug">`spotlight.debug`</a>
* <a href="#spotlightversion">`spotlight.version`</a>
* <a href="#spotlightbykindkind-options">`spotlight.byKind`</a>
* <a href="#spotlightbynamename-options">`spotlight.byName`</a>
* <a href="#spotlightbyvaluevalue-options">`spotlight.byValue`</a>
* <a href="#spotlightcustomcallback-options">`spotlight.custom`</a>

<!-- /div -->


<!-- /div -->


<!-- div -->


<!-- div -->

## `spotlight`

<!-- div -->

### <a id="spotlight"></a>`spotlight`
<a href="#spotlight">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L533 "View in source") [&#x24C9;][1]

*(Object)*: The primary namespace.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightdebug"></a>`spotlight.debug`
<a href="#spotlightdebug">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L541 "View in source") [&#x24C9;][1]

*(boolean)*: A flag to indicate that methods will execute in debug mode.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightversion"></a>`spotlight.version`
<a href="#spotlightversion">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L550 "View in source") [&#x24C9;][1]

*(string)*: The semantic version number.

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightbykindkind-options"></a>`spotlight.byKind(kind, [options={}])`
<a href="#spotlightbykindkind-options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L461 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties whose values are of a specified constructor instance, &#91;&#91;Class&#93;&#93;, or type.

#### Arguments
1. `kind` *(Function|string)*: The constructor, &#91;&#91;Class&#93;&#93;, or type to check against.
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

### <a id="spotlightbynamename-options"></a>`spotlight.byName(name, [options={}])`
<a href="#spotlightbynamename-options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L483 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties of the specified name.

#### Arguments
1. `name` *(string)*: The property name to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// basic
spotlight.byName('length');
// > window.length -> (number) 0

// or with options
// (finds all "map" properties on jQuery)
spotlight.byName('map', { 'object': jQuery, 'path': '$' });
// > $.map -> (function) function(a,b,c){...}
// > $.fn.map -> (function) function(a){...}
```

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightbyvaluevalue-options"></a>`spotlight.byValue(value, [options={}])`
<a href="#spotlightbyvaluevalue-options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L502 "View in source") [&#x24C9;][1]

Crawls environment objects logging all object properties whose values are a strict match for the specified value.

#### Arguments
1. `value` *(&#42;)*: The value to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
```js
// basic
spotlight.byValue(0);
// > window.pageXOffset -> (number) 0
// > window.screenX -> (number) 0
// > window.length -> (number) 0
```

* * *

<!-- /div -->


<!-- div -->

### <a id="spotlightcustomcallback-options"></a>`spotlight.custom(callback, [options={}])`
<a href="#spotlightcustomcallback-options">#</a> [&#x24C8;](https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L522 "View in source") [&#x24C9;][1]

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