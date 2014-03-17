# Spotlight.js <sup>v1.0.0-pre</sup>

An object crawler/property search library that works on nearly all JavaScript platforms<sup><a name="fnref1" href="#fn1">1</a></sup>.

## BestieJS

Spotlight.js is part of the BestieJS *"Best in Class"* module collection. This means we promote solid browser/environment support, ES5+ precedents, unit testing, and plenty of documentation.

## Documentation

The documentation for Spotlight.js can be viewed here: [/doc/README.md](https://github.com/bestiejs/spotlight.js/blob/master/doc/README.md#readme)

For a list of upcoming features, check out our [roadmap](https://github.com/bestiejs/spotlight.js/wiki/Roadmap).

## Installation and usage

Spotlight.js’ only hard dependency is [Lo-Dash](http://lodash.com/).

In a browser:

```html
<script src="lodash.js"></script>
<script src="spotlight.js"></script>
```

Via [npm](http://npmjs.org/):

```bash
npm install spotlight
```

In [Node.js](http://nodejs.org/) and [RingoJS](http://ringojs.org/):

```js
var spotlight = require('spotlight');
```

In [Rhino](http://www.mozilla.org/rhino/):

```js
load('spotlight.js');
```

In an AMD loader like [RequireJS](http://requirejs.org/):

```js
require({
  'paths': {
    'spotlight': 'path/to/spotlight',
    'lodash': 'path/to/lodash'
  }
},
['spotlight'], function(spotlight) {
  spotlight.byKind('constructor');
});
```

Usage example:

```js
// find all "length" properties
spotlight.byName('length');

// or find all "map" properties on jQuery
spotlight.byName('map', { 'object': jQuery, 'path': '$' });

// or all properties with `jQuery` objects
spotlight.byKind(jQuery);

// or all properties with `RegExp` values
spotlight.byKind('RegExp');

// or all properties with `null` values
spotlight.byKind('null');

// or all properties with `undefined` values
spotlight.byKind('undefined');

// or all constructors
spotlight.byKind('constructor');

// or all properties with the value `0`
spotlight.byValue(0);

// or all properties containing "oo" in their name
spotlight.custom(function(value, key) { return key.indexOf('oo') > -1; });

// or all properties with falsey values
spotlight.custom(function(value) { return !value; });
```

## Footnotes

  1. Spotlight.js has been tested in at least Chrome 32-33, Firefox 26-27, IE 6-11, Opera 19-20, Safari 5-7, Node.js 0.6.21~0.10.26, Narwhal 0.3.2, PhantomJS 1.9.2, RingoJS 0.9, and Rhino 1.7RC5.
     <a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>

## Author

| [![twitter/jdalton](http://gravatar.com/avatar/299a3d891ff1920b69c364d061007043?s=70)](http://twitter.com/jdalton "Follow @jdalton on Twitter") |
|---|
| [John-David Dalton](http://allyoucanleet.com/) |
