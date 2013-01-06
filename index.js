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

  var Promise = function() {
    EventEmitter.call(this);

    this._value;
    this._reason;
    this._values = [];
    this.isFulfilled = this.isRejected = false;
  };

  util.inherits(Promise, EventEmitter);

  // public instance methods
  // -----------------------

  Promise.prototype.error = function(onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.values = function(onFulfilled) {
    var thenPromise = new Promise()
      , onFulfilled = invokeCallback.bind(this, onFulfilled, 'apply')
      , onRejected = propagate.bind(this);

    if (this.isFulfilled) {
      onFulfilled(this._values.concat([this._value]), thenPromise);
    }

    else {
      this.on('promise:fulfilled', function(value) {
        onFulfilled(this._values.concat([value]), thenPromise);
      });

      this.on('promise:rejected', function(reason) {
        onRejected(reason, thenPromise, 'reject');
      });
    }

    return thenPromise;
  };

  Promise.prototype.then = function(onFulfilled, onRejected) {
    var thenPromise = new Promise()
      , onFulfilled = typeof onFulfilled === 'function' ?
        invokeCallback.bind(this, onFulfilled, 'call') : propagate.bind(this)
      , onRejected = typeof onRejected === 'function' ?
        invokeCallback.bind(this, onRejected, 'call') : propagate.bind(this);

    if (this.isFulfilled) {
      nextTick(function() {
        onFulfilled(this._value, thenPromise, 'fulfill');
      }, this);
    }

    else if (this.isRejected) {
      nextTick(function() {
        onRejected(this._reason, thenPromise, 'reject');
      }, this);
    }

    else {
      this.on('promise:fulfilled', function(value) {
        onFulfilled(value, thenPromise, 'fulfill');
      });

      this.on('promise:rejected', function(reason) {
        onRejected(reason, thenPromise, 'reject');
      });
    }

    return thenPromise;
  };

  Promise.prototype.fulfill = function(value) {
    nextTick(function() { this.emit('promise:fulfilled', value); }, this);

    this._value = value;
    this.isFulfilled = true;
    this.fulfill = this.reject = noop;
  };

  Promise.prototype.reject = function(reason) {
    nextTick(function() { this.emit('promise:rejected', reason); }, this);

    this._reason = reason;
    this.isRejected = true;
    this.fulfill = this.reject = noop;
  };

  // private instance methods
  // ------------------------

  function invokeCallback(cb, invokeMethod, valueOrReason, promise, type) {
    var cbValue, cbError, errorThrown;

    try {
      cbValue = cb[invokeMethod](null, valueOrReason);
    } catch(err) { errorThrown = true, cbError = err; }

    // send return values in promise chain to downstream promise
    if (type === 'fulfill') {
      promise._values = this._values.concat([valueOrReason]);
    }

    if (!errorThrown && cbValue && typeof cbValue.then === 'function') {
      cbValue.then(
        function(value) { promise.fulfill(value); }
      , function(reason) { promise.reject(reason); }
      );
    }

    else {
      !errorThrown ? promise.fulfill(cbValue) : promise.reject(cbError);
    }
  }

  function propagate(valueOrReason, promise, type) {
    // propagate return values
    promise._values = this._values.slice(0);

    if (valueOrReason && typeof valueOrReason.then === 'function') {
      valueOrReason.then(
        function(v) { promise.fulfill(v); }
      , function(e) { promise.reject(e); }
      );
    }

    else {
      promise[type](valueOrReason);
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
