const EventEmitter = require('events');

module.exports = function() {
  let o2p = new WeakMap();

  let methods = {
    on: undefined,
    once: undefined,
    removeListener: undefined
  };

  class Tangled extends EventEmitter {
    constructor(obj) {
      super();

      this.methods = Object.keys(methods).reduce((methods, name) => {
        methods[name] = (...args) => { this[name](...args); };
        return methods;
      }, {});

      this.proxy = new Proxy(obj, {
        get: (obj, key) => {
          return this.methods[key] || Tangled.get(obj[key]);
        },
        set: (obj, key, val) => {
          /* forbid assignment on reserved methods */
          if (methods[key]) {
            throw new Error('setting property "' + key + '" is forbidden');
          }

          this.set(obj, key, val);
        },
      });
    }

    static wrap(obj, visited) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      let proxy = o2p.get(obj);

      if (proxy === undefined) {
        let tgl = new Tangled(obj);
        proxy = tgl.proxy;

        o2p.set(obj, proxy);
        o2p.set(proxy, proxy);
      }

      if (visited === undefined) {
        visited = new Map();
      }

      /* recursively wrap children */
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (methods[key] === undefined) {
            let val = obj[key];
            if (val !== undefined && !visited.has(val)) {
              visited.set(val, true);
              Tangled.wrap(val, visited);
            }
          }
        }
      }

      return proxy;
    }

    /**
     * Find a tangled instance for the tangled object.
     * @param  {object} obj the tangled object.
     * @return {Tangled}    the tangled instance or the object itself.
     */
    static get(obj) {
      if (obj !== null && typeof obj === 'object') {
        obj = o2p.get(obj);
      }
      return obj;
    }

    set(obj, key, val) {
      /* silently ignores assignment of 'undefined' */
      if (val === undefined) return;

      /* wrap object */
      let proxy = Tangled.wrap(val);

      /* notify listeners */
      this.emit('set', key, proxy);

      /* perform the actual "set" */
      obj[key] = val;
    }
  }

  return function(obj) {
    return obj === undefined ? obj : Tangled.wrap(obj);
  };
};
