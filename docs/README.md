# Spotlight.js API documentation

<!-- div -->


<!-- div -->

## `spotlight`
* [`spotlight`](#spotlight)
* [`spotlight.debug`](#spotlight.debug)
* [`spotlight.byKind`](#spotlight.byKind)
* [`spotlight.byName`](#spotlight.byName)
* [`spotlight.byValue`](#spotlight.byValue)
* [`spotlight.custom`](#spotlight.custom)

<!-- /div -->


<!-- /div -->


<!-- div -->


<!-- div -->

## `spotlight`

<!-- div -->

### <a id="spotlight" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L659" title="View in source">`spotlight`</a>
*(Object)*: The primary namespace.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="spotlight.debug" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L666" title="View in source">`spotlight.debug`</a>
*(Boolean)*: A flag to indicate that methods will execute in debug mode.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="spotlight.byKind" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L591" title="View in source">`spotlight.byKind(kind [, options={}])`</a>
Crawls environment objects logging all object properties whose values are of a specified constructor instance, [[Class]], or type.
[&#9650;][1]

#### Arguments
1. `kind` *(Function|String)*: The constructor, [[Class]], or type to check against.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// by constructor
spotlight.byKind(jQuery);

// or by [[Class]]
spotlight.byKind('RegExp');

// or by type
spotlight.byKind('undefined');

// or special kind "constructor"
spotlight.byKind('constructor');
~~~

<!-- /div -->


<!-- div -->

### <a id="spotlight.byName" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L612" title="View in source">`spotlight.byName(name [, options={}])`</a>
Crawls environment objects logging all object properties of the specified name.
[&#9650;][1]

#### Arguments
1. `name` *(String)*: The property name to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// basic
// > window.length -> (number) 0
spotlight.byName('length');

// or with options
// (finds all "map" properties on jQuery)
// > $.map -> (function) function(a,b,c){...}
// > $.fn.map -> (function) function(a){...}
spotlight.byName('map', { 'object': jQuery, 'path': '$' });
~~~

<!-- /div -->


<!-- div -->

### <a id="spotlight.byValue" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L630" title="View in source">`spotlight.byValue(value [, options={}])`</a>
Crawls environment objects logging all object properties whose values are a strict match for the specified value.
[&#9650;][1]

#### Arguments
1. `value` *(Mixed)*: The value to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// basic
// > window.pageXOffset -> (number) 0
// > window.screenX -> (number) 0
// > window.length -> (number) 0
spotlight.byValue(0);
~~~

<!-- /div -->


<!-- div -->

### <a id="spotlight.custom" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L649" title="View in source">`spotlight.custom(callback [, options={}])`</a>
Crawls environment objects executing `callback`, passing the current `value`, `key`, and `object` as arguments, against each object encountered and logs properties for which `callback` returns true.
[&#9650;][1]

#### Arguments
1. `callback` *(Function)*: A function executed per object.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// filter by property names containing "oo"
spotlight.custom(function(value, key) { return key.indexOf('oo') > -1; });

// or filter by falsey values
spotlight.custom(function(value) { return !value; });
~~~

<!-- /div -->


<!-- /div -->


<!-- /div -->


  [1]: #readme "Jump back to the TOC."