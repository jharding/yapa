[![build status](https://secure.travis-ci.org/jharding/yapa.png?branch=master)](http://travis-ci.org/jharding/yapa)

Yapa
====

Yapa is an implementation of [Promises/A+](https://github.com/promises-aplus/promises-spec) with some extra methods bolted on. It passes the [Promises/A+ Compliance Test Suite](https://github.com/promises-aplus/promises-tests).

Installation
------------

### Download

```
$ npm install yapa
```

### Require

```javascript
var yapa = require('yapa');
```

API
---

### constructor

Constructs a new promise, but you probably already knew that.

```javascript
var promise = new yapa.Promise();
```

### Promise#fulfill(value)

Transitions promise from pending state to fulfilled state. The promise's `onFulfilled` callbacks will be invoked in the order they were attached. `value` will be the argument passed to the promise's `onFulfilled` callbacks.

```javascript
promise.fulfill('42');
```

### Promise#reject(reason)

Transitions promise from pending state to rejected state. The promise's `onRejected` callbacks will be invoked in the order they were attached. `reason` will be the argument passed to the promise's `onRejected` callbacks.

```javascript
promise.reject(new Error('cannot compute'));
```

### Promise#then(onFulfilled, onRejected)

Provides an interface for accessing the promise's current or eventual fulfillment value or rejection reason. When the promise is fulfilled or rejected, the corresponding callback will be invoked. If the promise has already been fulfilled or rejected, the corresponding callback will be invoked on the next loop through the event queue.

```javascript
var onFulfilled = function(value) { /* celebrate! */ }
  , onRejected = function(reason) { /* mourn */ };

promise.then(onFulfilled, onRejected);
```

### Promise#error(onRejected)

Sugar for `then(null, onRejected)`.

### Promise#values(onFulfilled)

Similar to the `then` method, however rather than have `onFulfilled`'s argument list only consist of the promise's fulfillment value, its argument list consists of the promise's fulfillment value _and_ the fulfillment values of all of the preceding promises in the promise chain.

```javascript
  promise
  .then(function() { return 123; })
  .then(function() { return 'do re mi' ; })
  .values(function(start, easyAs, simpleAs) { 
    console.log(start);
    console.log('easy as %s', easyAs);
    console.log('simple as %s', simpleAs);
  });

  promise.fulfill('abc');
```

Testing
-------

```
$ cd yapa
$ npm test
```

Issues
------

Found a bug? Create an issue on GitHub.

https://github.com/jharding/yapa/issues

Versioning
----------

For transparency and insight into the release cycle, releases will be numbered with the follow format:

`<major>.<minor>.<patch>`

And constructed with the following guidelines:

* Breaking backwards compatibility bumps the major
* New additions without breaking backwards compatibility bumps the minor
* Bug fixes and misc changes bump the patch

For more information on semantic versioning, please visit http://semver.org/.

License
-------

Copyright (c) 2013 [Jake Harding](http://thejakeharding.com)  
Licensed under the MIT License.
