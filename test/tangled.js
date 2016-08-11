const expect = require('chai').expect;
const tangled = require('../lib/tangled');
const sinon = require('sinon');

describe('Tangled', function() {
  let tangle, obj, tgl;

  beforeEach(function() {
    tangle = tangled();
    obj = { hello: 'world', foo: { bar: 'foobar' } };
    tgl = tangle(obj);
  });

  describe('tangle', function() {
    it('should be a function', function() {
      expect(tangle).to.be.a('function');
    });
  });

  describe('trap:get', function() {
    it('should return its value for non-object values', function() {
      expect(tgl.hello).to.be.a('string');
      expect(tgl.hello).to.equal('world');
    });

    it('should return a wrapped object for object values', function() {
      expect(tgl.foo).to.not.equal(obj.foo);
      expect(tgl.foo).to.deep.equal(obj.foo);
    });
  });

  describe('trap:set', function() {
    let objval = { y: 2 };
    let plainval = 1;

    it('should add the value to the original object', function() {
      tgl.x = plainval;
      expect(tgl.x).to.equal(plainval);
      expect(obj.x).to.equal(plainval);
    });

    it('should wrap the object if it is an object', function() {
      tgl.x = objval;
      expect(tgl.x).to.not.equal(objval);
      expect(tgl.x).to.deep.equal(objval);
      expect(obj.x).to.equal(objval);
    });

    it('should emit "set" on itself', function() {
      let spy = sinon.spy();
      tgl.on('set', spy);

      tgl.x = plainval;
      tgl.y = objval;

      expect(spy).to.have.been.calledTwice;
      expect(spy.firstCall).to.have.been.calledWith('x', plainval);
      // check deep equal but not strict equal
      expect(spy.secondCall).to.have.been.calledWith('y',
      sinon.match(function(val) {
        return val !== objval && JSON.stringify(val) === JSON.stringify(objval);
      }));
    });
  });
});
