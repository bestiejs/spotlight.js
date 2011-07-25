# Waldo API documentation

<!-- div -->


<!-- div -->

## `find`
* [`find`](#find)
* [`find.debug`](#find.debug)
* [`find.byKind`](#find.byKind)
* [`find.byName`](#find.byName)
* [`find.byValue`](#find.byValue)
* [`find.custom`](#find.custom)

<!-- /div -->


<!-- /div -->


<!-- div -->


<!-- div -->

## `find`

<!-- div -->

### <a id="find" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L484" title="View in source">`find`</a>
*(Object)*: The primary namespace.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="find.debug" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L491" title="View in source">`find.debug`</a>
*(Boolean)*: A flag to indicate that methods will execute in debug mode.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="find.byKind" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L416" title="View in source">`find.byKind(kind [, options={}])`</a>
Crawls environment objects logging all object properties whose values
[&#9650;][1]

#### Arguments
1. `kind` *(Function|String)*: The constructor, [[Class]], or type to check against.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// by constructor
find.byKind(jQuery);

// or by [[Class]]
find.byKind('RegExp');

// or by type
find.byKind('undefined');

// or special kind "constructor"
find.byKind('constructor');
~~~

<!-- /div -->


<!-- div -->

### <a id="find.byName" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L437" title="View in source">`find.byName(name [, options={}])`</a>
Crawls environment objects logging all object properties of the specified name.
[&#9650;][1]

#### Arguments
1. `name` *(String)*: The property name to search for.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// basic
// > window.length -> (number) 0
find.byName('length');

// or with options
// (finds all "map" properties on jQuery)
// > $.map -> (function) function(a,b,c){...}
// > $.fn.map -> (function) function(a){...}
find.byName('map', { 'object': jQuery, 'path': '$' });
~~~

<!-- /div -->


<!-- div -->

### <a id="find.byValue" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L455" title="View in source">`find.byValue(value [, options={}])`</a>
Crawls environment objects logging all object properties whose values are
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
find.byValue(0);
~~~

<!-- /div -->


<!-- div -->

### <a id="find.custom" href="https://github.com/bestiejs/waldo.js/blob/master/waldo.js#L474" title="View in source">`find.custom(callback [, options={}])`</a>
Crawls environment objects executing `callback`, passing the current
[&#9650;][1]

#### Arguments
1. `callback` *(Function)*: A function executed per object.
2. `[options={}]` *(Object)*: The options object.

#### Example
~~~ js
// filter by property names containing "oo"
find.custom(function(value, key) { return key.indexOf('oo') > -1; });

// or filter by falsey values
find.custom(function(value) { return !value; });
~~~

<!-- /div -->


<!-- /div -->


<!-- /div -->


  [1]: #readme "Jump back to the TOC."