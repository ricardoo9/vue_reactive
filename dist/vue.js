(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  /**
   * 判断是否是对象：类型是object，且不能为 null
   * @param {*} val 
   * @returns 
   */
  function isObject(val) {
    return typeof val == 'object' && val !== null;
  }

  /**
   * 判断是否是数组
   * @param {*} val 
   * @returns 
   */
  function isArray(val) {
    return Array.isArray(val);
  }

  const arrayPrototype = Array.prototype; // 缓存真实原型

  // 需要处理的方法
  const reactiveMethods = ['push', 'pop', 'unshift', 'shift', 'splice', 'reverse', 'sort'];

  // 增加代理原型 arrayMethods.__proto__ === arrayProrotype
  // 然后将arrayMethods继承自数组原型
  // 这里是面向切片编程思想（AOP）--不破坏封装的前提下，动态的扩展功能
  const arrayMethods = Object.create(arrayPrototype);

  // 定义响应式方法
  reactiveMethods.forEach(method => {
    const originalMethod = arrayPrototype[method];
    // 在代理原型上定义重写后的响应式方法
    Object.defineProperty(arrayMethods, method, {
      value: function reactiveMethod(...args) {
        const result = originalMethod.apply(this, args); // 执行默认原型的方法
        // ...派发更新...
        console.log('监听数组方法');
        // this代表的就是数据本身 比如数据是{a:[1,2,3]} 那么我们使用a.push(4)  this就是a  ob就是a.__ob__ 这个属性就是上段代码增加的 代表的是该数据已经被响应式观察过了指向Observer实例
        const ob = this.__ob__;

        // 这里的标志就是代表数组有新增操作
        let inserted;
        switch (method) {
          case "push":
          case "unshift":
            inserted = args;
            break;
          case "splice":
            inserted = args.slice(2);
        }
        // 如果有新增的元素 inserted是一个数组 调用Observer实例的observeArray对数组每一项进行观测
        if (inserted) ob.observeArray(inserted);
        // 之后咱们还可以在这里检测到数组改变了之后从而触发视图更新的操作--后续源码会揭晓
        return result;
      },
      enumerable: false,
      writable: true,
      configurable: true
    });
  });

  let uid$1 = 0;
  class Dep {
    constructor() {
      console.log('dep类的构造器');
      this.id = uid$1++;
      this.subs = [];
    }
    addSub(sub) {
      this.subs.push(sub);
      console.log('subs', this.subs);
    }
    depend() {
      console.log(Dep.target);
      if (Dep.target) {
        console.log('添加订阅者');
        this.addSub(Dep.target);
      }
    }
    notify(newValue) {
      const subs = this.subs.slice();
      console.log('dep通知更新', subs);
      for (let i = 0, l = subs.length; i < l; i++) {
        console.log('通知更新的watcher', subs);
        subs[i].update(newValue);
      }
    }
  }

  function observe(value) {
    // 1，如果 value 不是对象，说明写错了，就不需要观测了，直接 return
    // 注意：数据也是 Object，这里就不做容错判断了，忽略使用错误传入数组的情况
    if (!isObject(value)) {
      return;
    }

    // 通过__ob__属性判断对象是否已经被观测，如果已经被观测，就不再重复观测了；
    if (value.__ob__) {
      return;
    }
    // 2，对 对象 进行观测（最外层必须是一个object!不能是数组,Vue没有这种用法）
    return new Observer(value);
  }
  class Observer {
    constructor(value) {
      console.log('observer构造器执行', value);
      // value：为数组或对象添加自定义属性__ob__ = this，
      // this：为当前 Observer 类的实例，实例上就有 observeArray 方法；
      // value.__ob__ = this;	// 可被遍历枚举，会造成死循环
      // 定义__ob__ 属性为不可被枚举，防止对象在进入walk都继续defineProperty，造成死循环
      this.dep = new Dep(); // <=========
      Object.defineProperty(value, '__ob__', {
        value: this,
        enumerable: false // 不可被枚举
      });

      this.value = value;
      // 对 value 是数组和对象的情况分开处理
      if (isArray(value)) {
        value.__proto__ = arrayMethods; // 更改数组的原型方法
        console.log(value);
        this.observeArray(value); // 数组的深层观测处理
      } else {
        // 如果value是对象，就循环对象，将对象中的属性使用Object.defineProperty重新定义一遍
        this.walk(value); // 上来就走一步，这个方法的核心就是在循环对象
      }
    }

    /**
     * 遍历对象
     *  循环data对象（不需要循环data原型上的方法），使用 Object.keys()
     * @param {*} data 
     */
    walk(data) {
      Object.keys(data).forEach(key => {
        // 使用Object.defineProperty重新定义data对象中的属性
        defineReactive(data, key, data[key]);
      });
    }
    /**
     * 遍历数组，对数组中的对象进行递归观测
     *  1）[[]] 数组套数组
     *  2）[{}] 数组套对象
     * @param {*} data 
     */
    observeArray(data) {
      // observe方法内，如果是对象类型，继续 new Observer 进行递归处理
      data.forEach(item => observe(item));
    }
  }

  /**
   * 给对象Obj，定义属性key，值为value
   *  使用Object.defineProperty重新定义data对象中的属性
   *  由于Object.defineProperty性能低，所以vue2的性能瓶颈也在这里
   * @param {*} obj 需要定义属性的对象
   * @param {*} key 给对象定义的属性名
   * @param {*} value 给对象定义的属性值
   */
  function defineReactive(obj, key, value) {
    // childOb 是数据组进行观测后返回的结果，内部 new Observe 只处理数组或对象类型
    // 递归实现深层观测
    observe(value);
    const dep = new Dep(); // <====
    Object.defineProperty(obj, key, {
      // 可以被枚举
      enumerable: true,
      // 可以被配置
      configurable: true,
      // get方法构成闭包：取obj属性时需返回原值value，
      // value会查找上层作用域的value，所以defineReactive函数不能被释放销毁
      get() {
        console.log('访问', key, '属性');
        dep.depend();
        return value;
      },
      // 确保新对象为响应式数据：如果新设置的值为对象，需要再次进行劫持
      set(newValue) {
        console.log("修改了被观测属性 key = " + key + ", newValue = " + JSON.stringify(newValue));
        if (newValue === value) return;
        // observe方法：如果是对象，会 new Observer 深层观测
        observe(newValue);
        value = newValue;
        dep.notify(newValue);
      }
    });
  }

  var uid = 0;
  class Watcher {
    constructor(vm, exp, cb) {
      this.exp = exp;
      this.cb = cb;
      this.vm = vm;
      this.value = null;
      this.uid = uid++;
      this.getter = parseExpression(exp);
      //初始化时，触发添加到监听队列
      console.log(parseExpression(exp), 'parseExpression');
      this.value = this.get();
    }
    get() {
      Dep.target = this;
      console.log(Dep.target, 'Dep.target');
      /*
      this.getter是parseExpression根据exp生成的差不多这样的一个函数
      function anonymous(scope) {
          return  scope.b.c+1+scope.message;
      }
       这里的访问会逐级触发get，有两个作用
      1.在Watcher初始化时调用get，会逐级将自己添加到对象的监听列表中，如要监听a.b.c，则a、a.b、a.b.c的监听列表中都会添加这个Watcher
       这样做的目的是，在上级数据被修改时，也能接收到通知，如a.b = {c:1}时，原c元素被覆盖，不会发出变动通知，而b则会；
      2.同样是上述情况，新添加的c元素，需要添加监听原来c元素的Watcher到自己的监听列表中，在这个Watcher接收到b过来的通知时，会去取a.b.c的值与原值比较是否发生变动，
       这个取的过程中，触发新的c的get，就会添加到c的监听队列
      */
      const obj = this.vm._data;
      var value;
      try {
        value = this.getter(obj);
      } finally {
        Dep.target = null;
      }
      console.log(value);
      return value;
    }
    update(newVal) {
      console.log(newVal, '修改之后的值');
      var newVal = newVal ? newVal : this.get();
      console.log('开始更新');
      if (this.value != newVal) {
        console.log('执行回调');
        this.cb && this.cb(newVal, this.value);
        this.value = newVal;
      }
    }
  }
  function parseExpression(str) {
    var seg = str.split('.');
    return obj => {
      for (let i = 0; i < seg.length; i++) {
        if (!obj) return;
        obj = obj[seg[i]];
      }
      return obj;
    };
  }

  // src/index.js Vue 构造函数
  class Vue {
    constructor(options) {
      console.log('Vue构造器执行');
      this._data = options.data;
      const vm = this;
      vm.$options = options;
      // 响应式处理部分代码
      observe(this._data);
      new Watcher(vm, 'a', () => {
        console.log('Watcher a发生改变');
      });
      _proxy.call(this, options.data);
    }
  }
  // 实现非侵入的数据修改
  function _proxy(data) {
    const that = this;
    Object.keys(data).forEach(key => {
      Object.defineProperty(that, key, {
        configurable: true,
        enumerable: true,
        get: function proxyGetter() {
          return that._data[key];
        },
        set: function proxySetter(val) {
          that._data[key] = val;
        }
      });
    });
  }

  return Vue;

}));
//# sourceMappingURL=vue.js.map
