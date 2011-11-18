# Spotlight.js

An [object crawler/property search](http://javascriptweblog.wordpress.com/2011/07/11/waldo-search-the-javascript-runtime-in-under-1-kb/) library that works on nearly all JavaScript platforms<sup><a name="fnref1" href="#fn1">1</a></sup>.

## BestieJS

Spotlight.js is part of the BestieJS *"Best in Class"* module collection. This means we promote solid browser/environment support, ES5 precedents, unit testing, and plenty of documentation.

## Documentation

The documentation for Spotlight.js can be viewed here: [/docs/README.md](https://github.com/bestiejs/spotlight.js/blob/master/docs/README.md#readme)

For a list of upcoming features, check out our [roadmap](https://github.com/bestiejs/spotlight.js/wiki/Roadmap).

## Installation and usage

In a browser:

~~~ html
<script src="spotlight.js"></script>
~~~

Via [npm](http://npmjs.org/):

~~~ bash
npm install spotlight
~~~

In [Narwhal](http://narwhaljs.org/), [Node.js](http://nodejs.org/), and [RingoJS](http://ringojs.org/):

~~~ js
var spotlight = require('spotlight');
~~~

In [Rhino](http://www.mozilla.org/rhino/):

~~~ js
load('spotlight.js');
~~~

In [RequireJS](http://requirejs.org/):

~~~ js
require({
  'paths': {
    'spotlight': 'path/to/spotlight'
  }
},
['spotlight'], function(spotlight) {
  spotlight.byKind('constructor');
});
~~~

Usage example:

~~~ js
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
~~~

## Cloning this repo

To clone this repository including all submodules, using Git 1.6.5 or later:

~~~ bash
git clone --recursive https://github.com/bestiejs/spotlight.js.git
cd spotlight.js
~~~

For older Git versions, just use:

~~~ bash
git clone https://github.com/bestiejs/spotlight.js.git
cd spotlight.js
git submodule update --init
~~~

Feel free to fork if you see possible improvements!

## Footnotes

  1. Spotlight.js has been tested in at least Chrome 5/8/12/14, Firefox 1.5-4, IE 6-10, Opera 9.25-12, Safari 2-5, Node.js 0.4.2, Narwhal 0.3.2, Ringo 0.7, and Rhino 1.7RC3.
     <a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>

## Authors

* [Angus Croll](http://javascriptweblog.wordpress.com/)
  [![twitter/angustweets](http://gravatar.com/avatar/52c6174ba60557536f93809b4e95d97c?s=70)](https://twitter.com/angustweets "Follow @angustweets on Twitter")
* [John-David Dalton](http://allyoucanleet.com/)
  [![twitter/jdalton](http://gravatar.com/avatar/299a3d891ff1920b69c364d061007043?s=70)](https://twitter.com/jdalton "Follow @jdalton on Twitter")