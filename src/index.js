import { observe } from './observer/index.js'
import  Watcher  from './observer/watcher.js';
// src/index.js Vue 构造函数
class Vue {
  constructor(options) {
      console.log('Vue构造器执行')
      this._data = options.data;
      const vm = this;
      vm.$options = options
      // 响应式处理部分代码
      observe(this._data)
      new Watcher(vm, 'a', () => {console.log('Watcher a发生改变')}) 
      _proxy.call(this, options.data)
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
      })
  });
}
// 导出 Vue 函数，提供外部使用
export default Vue;