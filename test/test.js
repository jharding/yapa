var assert = require('assert')
  , sinon = require('sinon')
  , Promise = require('../');

describe('Yapa', function() {
  var value1 = 'i am value 1'
    , value2 = 'i am value 2';

  describe('#value', function() {
    it('should not return a promise', function() {
      var promise = new Promise();

      assert.equal(promise.value(), undefined);
    });

    it('should call then(null, fn)', function() {
      var promise = new Promise()
        , spy = sinon.spy(promise, 'then')
        , fn = function() {};

      promise.value(fn);

      assert(spy.calledWith(fn, null));
    });
  });

  describe('#error', function() {
    it('should return a promise', function() {
      var promise = new Promise();

      assert(promise.error() instanceof Promise);
    });

    it('should be sugar for then(fn, null)', function() {
      var promise = new Promise()
        , spy = sinon.spy(promise, 'then')
        , fn = function() {};

      promise.error(fn);

      assert(spy.calledWith(null, fn));
    });
  });

  describe('#values', function() {
    it('should call fulfilled handler with values from chain', function(done) {
      var promise = new Promise();

      promise
      .then(function(val) {
        return value2;
      })
      .values(function(val1, val2) {
        assert.equal(val1, value1);
        assert.equal(val2, value2);
        done();
      });

      promise.resolve(value1);
    });

    it('should not be affected by intermediary null handlers', function(done) {
      var promise = new Promise();

      promise
      .then(null, null)
      .then(function(val) {
        return value2;
      })
      .then(null, null)
      .values(function(val1, val2) {
        assert.equal(val1, value1);
        assert.equal(val2, value2);
        done();
      });

      promise.resolve(value1);
    });

    describe('when handler in chain returns a promise', function() {
      it('should call fulfilled handler with fulfilled value', function(done) {
        var promise1 = new Promise()
          , promise2 = new Promise();

        promise1
        .then(function(val) {
          process.nextTick(function() { promise2.resolve(value2); });

          return promise2;
        })
        .values(function(val1, val2) {
          assert.equal(val1, value1);
          assert.equal(val2, value2);
          done();
        });

        promise1.resolve(value1);
      });
    });
  });

  describe('when error is thrown within a handler', function() {
    it('should reset return values', function(done) {
      var promise = new Promise();

      promise
      .then(function(val) { throw new Error(); })
      .error(function(err) { return value2; })
      .values(function(val) {
        assert(arguments.length, 1);
        assert.equal(val, value2);
        done();
      });

      promise.resolve(value1);
    });
  });

  describe('when promise has been resolved', function(done) {
    it('should call fulfilled handler on next tick', function(done) {
      var promise = new Promise()
        , value = 'i am a value'
        , count = 0;

      promise.value(function(val) {
        assert.equal(val, value);
        assert.equal(count, 0);
        count += 1;
      });

      promise.resolve(value);

      process.nextTick(function() {
        promise.value(function(val) {
          assert.equal(val, value);
          assert.equal(count, 1);
          done();
        });
      });
    });
  });

  describe('when promise has been rejected', function(done) {
    it('should call error handler on next tick', function(done) {
      var promise = new Promise()
        , error = new Error('i am error')
        , count = 0;

      promise.error(function(err) {
        assert.equal(err, error);
        assert.equal(count, 0);
        count += 1;
      });

      promise.reject(error);

      process.nextTick(function() {
        promise.error(function(err) {
          assert.equal(err, error);
          assert.equal(count, 1);
          done();
        });
      });
    });
  });
});
