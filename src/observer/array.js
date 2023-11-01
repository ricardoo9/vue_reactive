const arrayPrototype = Array.prototype // 缓存真实原型

// 需要处理的方法
const reactiveMethods = [
  'push',
  'pop',
  'unshift',
  'shift',
  'splice',
  'reverse',
  'sort'
]

// 增加代理原型 arrayMethods.__proto__ === arrayProrotype
// 然后将arrayMethods继承自数组原型
// 这里是面向切片编程思想（AOP）--不破坏封装的前提下，动态的扩展功能
export const arrayMethods = Object.create(arrayPrototype)

// 定义响应式方法
reactiveMethods.forEach((method) => {
  const originalMethod = arrayPrototype[method]
  // 在代理原型上定义重写后的响应式方法
  Object.defineProperty(arrayMethods, method, {
    value: function reactiveMethod(...args) {
      const result = originalMethod.apply(this, args) // 执行默认原型的方法
      // ...派发更新...
      console.log('监听数组方法')
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
        default:
          break;
      }
      // 如果有新增的元素 inserted是一个数组 调用Observer实例的observeArray对数组每一项进行观测
      if (inserted) ob.observeArray(inserted);
      // 之后咱们还可以在这里检测到数组改变了之后从而触发视图更新的操作--后续源码会揭晓
      return result
    },
    enumerable: false,
    writable: true,
    configurable: true  
  })
})
