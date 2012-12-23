// dependencies
// ------------

var util = require('util')
  , EventEmitter = require('events').EventEmitter;

module.exports = {
  factory: promiseFactory
, Promise: promiseFactory()
};

function promiseFactory() {
  // constructor
  // -----------

  var Promise = function($) {
    EventEmitter.call(this);

    this.$ = $ || {};

    this._value;
    this._error;
    this._values = [];
    this.isResolved = this.isRejected = false;
  };

  util.inherits(Promise, EventEmitter);

  // public instance methods
  // -----------------------

  Promise.prototype.value = function(onResolved) {
    this.then(onResolved, null);
  };

  Promise.prototype.error = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.values = function(onResolved) {
    var thenPromise = new Promise(this.$)
      , onResolved = invokeCallback.bind(this, onResolved, 'apply');

    if (this.isResolved) {
      onResolved(this._values.concat([this._value]), thenPromise);
    }

    else {
      this.on('promise:resolved', function(value) {
        onResolved(this._values.concat([value]), thenPromise);
      });
    }

    return thenPromise;
  };

  Promise.prototype.then = function(onResolved, onRejected) {
    var thenPromise = new Promise(this.$)
      , onResolved = onResolved ?
        invokeCallback.bind(this, onResolved, 'call') : propagate.bind(this)
      , onRejected = onRejected ?
        invokeCallback.bind(this, onRejected, 'call') : propagate.bind(this);

    if (this.isResolved) {
      nextTick(function() {
        onResolved(this._value, thenPromise, 'resolve');
      }, this);
    }

    else if (this.isRejected) {
      nextTick(function() {
        onRejected(this._error, thenPromise, 'reject');
      }, this);
    }

    else {
      this.on('promise:resolved', function(value) {
        onResolved(value, thenPromise, 'resolve');
      });

      this.on('promise:rejected', function(error) {
        onRejected(error, thenPromise, 'reject');
      });
    }

    return thenPromise;
  };

  Promise.prototype.resolve = function(value) {
    nextTick(function() { this.emit('promise:resolved', value); }, this);

    this._value = value;
    this.isResolved = true;
    this.resolve = this.reject = noop;
  };

  Promise.prototype.reject = function(error) {
    nextTick(function() { this.emit('promise:rejected', error); }, this);

    this._error = error;
    this.isRejected = true;
    this.resolve = this.reject = noop;
  };

  // private instance methods
  // ------------------------

  function invokeCallback(cb, invokeMethod, valueOrError, promise, type) {
    var cbValue, cbError;

    try {
      cbValue = cb[invokeMethod](null, valueOrError);
    } catch(err) {
      // in the case a falsy value is thrown, set cbError to true so
      // it's known that an error was indeed thrown
      cbError = err || true;
    }

    // send return values in promise chain to downstream promise
    if (type === 'resolve') {
      promise._values = this._values.concat([valueOrError]);
    }

    if (!cbError && cbValue instanceof Promise) {
      cbValue.then(
        function(v) { promise.resolve(v); }
      , function(e) { promise.reject(e); }
      );
    }

    else {
      !cbError ? promise.resolve(cbValue) : promise.reject(cbError);
    }
  }

  function propagate(valueOrError, promise, type) {
    // propagate return values
    promise._values = this._values.slice(0);

    if (valueOrError instanceof Promise) {
      valueOrError.then(
        function(v) { promise.resolve(v); }
      , function(e) { promise.reject(e); }
      );
    }

    else {
      promise[type](valueOrError);
    }
  }

  return Promise;
}

// helper functions
// ----------------

function noop() {}

function nextTick(callback, context) {
  process.nextTick(function() { callback.call(context); });
}
