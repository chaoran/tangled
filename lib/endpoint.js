const EventEmitter = require('events');

class Endpoint extends EventEmitter {
  constructor(name, parent) {
    super();

    this.name = name;
    this.parent = parent;
    this.children = Object.create(null);
  }

  child(path) {
    if (path === undefined || path === null || path === '' ||
    typeof path !== 'string') {
      throw new TypeError('expects a non-empty string as path');
    }

    let names = path.split('/');
    let node = this;

    for (let i = 0; i < names.length; ++i) {
      let name = names[i];
      let next = node.children[name];

      if (!next) {
        next = new Endpoint(name, node);
        node.children[name] = next;
      }

      node = next;
    }

    return node;
  }

  delete() {
    /* remove myself from my parent's children */
    let parent = this.parent;
    delete parent.children[this.name];

    if (this.tangled) {
      if (this.listener) {
        this.tangled.removeListener('set', this.listener);
        delete this.listener;
      }

      this.emit('delete', this.tangled, 'delete');
      delete this.tangled;
    }

    /* remove children */
    for (let key in this.children) {
      this.children[key].delete();
    }
  }

  create(name, obj) {
    this.children[name] = new Endpoint(name, this);
    this.children[name].update(obj, 'create');
  }

  update(obj, act) {
    this.tangled = obj;

    if (obj !== null && typeof obj === 'object' && typeof obj.on === 'function') {
      /* create listener */
      this.listener = (key, val) => {
        this.child(key).tangle(val);
      };
      /* listen to "set" event */
      obj.on('set', this.listener);
    }

    /* notify listeners */
    this.emit(act, obj, act);

    if (obj !== null && typeof obj === 'object') {
      /* remove existing children that is not in the object */
      for (let key in this.children) {
        if (obj instanceof Object && obj.hasOwnProperty(key) === false) {
          this.children[key].delete();
        }
      }

      /* create or update children that is in the object */
      for (let key in obj) {
        if (obj instanceof Object === false || obj.hasOwnProperty(key)) {
          let child = this.children[key];

          if (child === undefined) {
            this.create(key, obj[key]);
          } else {
            this.children[key].tangle(obj[key]);
          }
        }
      }
    }
  }

  tangle(obj) {
    let old = this.tangled;

    /* throw an error about repeated entangle */
    if (old === obj) {
      throw new RangeError('this object has already tangled at this url');
    }

    /* determine what operation to perform */
    let act = old === undefined ? 'create' : 'update';

    /* perform the actual action */
    this.update(obj, act);
  }

  toString() {
    if (this.parent !== undefined) {
      return this.parent.toString() + '/' + this.name;
    } else {
      return this.name;
    }
  }
}

module.exports = Endpoint;
