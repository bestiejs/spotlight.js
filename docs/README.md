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

### <a id="spotlight" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L515" title="View in source">`spotlight`</a>
*(Object)*: The primary namespace.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="spotlight.debug" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L522" title="View in source">`spotlight.debug`</a>
*(Boolean)*: A flag to indicate that methods will execute in debug mode.
[&#9650;][1]

<!-- /div -->


<!-- div -->

### <a id="spotlight.byKind" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L447" title="View in source">`spotlight.byKind(kind [, options={}])`</a>
Crawls environment objects logging all object properties whose values are of a specified constructor instance, [[Class]], or type.
[&#9650;][1]

#### Arguments
1. `kind` *(Function|String)*: The constructor, [[Class]], or type to check against.
2. `[options={}]` *(Object)*: The options object.

<!-- /div -->


<!-- div -->

### <a id="spotlight.byName" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L468" title="View in source">`spotlight.byName(name [, options={}])`</a>
Crawls environment objects logging all object properties of the specified name.
[&#9650;][1]

#### Arguments
1. `name` *(String)*: The property name to search for.
2. `[options={}]` *(Object)*: The options object.

<!-- /div -->


<!-- div -->

### <a id="spotlight.byValue" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L486" title="View in source">`spotlight.byValue(value [, options={}])`</a>
Crawls environment objects logging all object properties whose values are a strict match for the specified value.
[&#9650;][1]

#### Arguments
1. `value` *(Mixed)*: The value to search for.
2. `[options={}]` *(Object)*: The options object.

<!-- /div -->


<!-- div -->

### <a id="spotlight.custom" href="https://github.com/bestiejs/spotlight/blob/master/spotlight.js#L505" title="View in source">`spotlight.custom(callback [, options={}])`</a>
Crawls environment objects executing `callback`, passing the current `value`, `key`, and `object` as arguments, against each object encountered and logs properties for which `callback` returns true.
[&#9650;][1]

#### Arguments
1. `callback` *(Function)*: A function executed per object.
2. `[options={}]` *(Object)*: The options object.

<!-- /div -->


<!-- /div -->


<!-- /div -->


  [1]: #readme "Jump back to the TOC."