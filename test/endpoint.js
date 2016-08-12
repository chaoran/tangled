const expect = require('chai').expect;
const sinon = require('sinon');
const EventEmitter = require('events');
const Endpoint = require('../lib/endpoint');

describe('Endpoint', function() {
  let domain = 'example.com';
  let root;

  beforeEach(function() {
    root = new Endpoint(domain);
  });

  describe('#child()', function() {
    it('should return a child at a child path', function() {
      let child = root.child('hello');
      expect(child.parent).to.equal(root);
    });

    it('should return a grandchild given a grandchild path', function() {
      let child = root.child('hello');
      let grandchild = root.child('hello/world');

      expect(grandchild).to.equal(child.child('world'));
    });
  });

  describe('#toString()', function() {
    it('should return its path', function() {
      expect(root.toString()).to.equal(domain);
      expect(root.child('hello').toString()).to.equal(domain + '/hello');
      expect(root.child('hello/world').toString()).to.equal(domain + '/hello/world');
    });
  });

  describe('#tangle()', function() {
    let obj, rootCreateSpy, helloCreateSpy, fooCreateSpy, foobarCreateSpy;

    beforeEach(function() {
      obj = new EventEmitter();
      obj.hello = 'world';
      obj.foo = new EventEmitter();
      obj.foo.bar = 'foobar';

      rootCreateSpy = sinon.spy();
      root.on('create', rootCreateSpy);

      helloCreateSpy = sinon.spy();
      root.child('hello').on('create', helloCreateSpy);

      fooCreateSpy = sinon.spy();
      root.child('foo').on('create', fooCreateSpy);

      foobarCreateSpy = sinon.spy();
      root.child('foo/bar').on('create', foobarCreateSpy);

      root.tangle(obj);
    });

    it('should tangle the object at the endpoint', function() {
      expect(root.tangled).to.equal(obj);
    });

    it('should tangle the child at a child endpoint', function() {
      expect(root.child('hello').tangled).to.equal(obj.hello);
      expect(root.child('foo').tangled).to.equal(obj.foo);
      expect(root.child('foo/bar').tangled).to.equal(obj.foo.bar);
    });

    it('should emit "create" on tangled endpoints', function() {
      expect(rootCreateSpy).to.have.been.calledOnce;
      expect(helloCreateSpy).to.have.been.calledOnce;
      expect(fooCreateSpy).to.have.been.calledOnce;
      expect(foobarCreateSpy).to.have.been.calledOnce;
    });

    describe('when tangled object emit "set"', function() {
      describe('when it is an "update"', function() {
        let helloUpdateSpy;

        beforeEach(function() {
          helloUpdateSpy = sinon.spy();
          root.child('hello').on('update', helloUpdateSpy);
        });

        it('should emit "update" and replace the value', function() {
          obj.emit('set', 'hello', 'global');
          expect(helloUpdateSpy).to.have.been.calledOnce;
          expect(root.child('hello').tangled).to.equal('global');
        });
      });

      describe('when it is a "delete"', function() {
        let foobarDeleteSpy;

        beforeEach(function() {
          foobarDeleteSpy = sinon.spy();
          root.child('foo/bar').on('delete', foobarDeleteSpy);
        });

        it('should emit "delete" and replace the value', function() {
          obj.emit('set', 'foo', { x: 1 });
          expect(foobarDeleteSpy).to.have.been.calledOnce;
          expect(root.child('foo/bar').tangled).to.be.undefined;
          expect(root.child('foo/x').tangled).to.equal(1);
        });
      });
    });
  });
});
