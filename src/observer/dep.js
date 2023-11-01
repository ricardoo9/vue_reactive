let uid = 0

export default class Dep {
  constructor () {
    console.log('dep类的构造器')
    this.id = uid++
    this.subs = []
  }

  addSub (sub) {
    this.subs.push(sub)
    console.log('subs', this.subs)
  }

  depend () {
    console.log(Dep.target)
    if (Dep.target) {
      console.log('添加订阅者')
      this.addSub(Dep.target)
    }
  }

  notify (newValue) {
    const subs = this.subs.slice()
    console.log('dep通知更新', subs)
    for (let i = 0, l = subs.length; i < l; i++) {
      console.log('通知更新的watcher' ,subs)
      subs[i].update(newValue)
    }
  }
}