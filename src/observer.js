
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb

        this.oldVal = this.getOldValue()
    }
    getOldValue() {
        Dep.target = this
        const oldVal = compileUtil.getValue(this.expr, this.vm)
        Dep.target = null
        return oldVal
    }
    update() {
        const newVal = compileUtil.getValue(this.expr, this.vm)
        if(this.oldVal !== newVal) {
            this.cb(newVal)
        }
    }
}


// 依赖收集
class Dep {
    constructor() {
        this.subs = []
    }
    // 通知
    notify() {
        console.log(this.subs, '观察者')
        this.subs.forEach(w => {
            w.update()
        })
    }
    // 收集 watcher
    addSub(watcher) {
        this.subs.push(watcher)
    }
}


class Observer {
    constructor(data) {
        this.observe(data)
    }
    observe(data) {
        // console.log(data, 'data')
        if(data && typeof data === 'object') {
            Object.keys(data).forEach(key=> {
                this.deepObserve(data, key, data[key])
            })
        }
    }
    deepObserve(data, key, value) {
        this.observe(value)
        const dep = new Dep()
        // console.log(dep, 'dep')
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false, // 是否可更改、删除
            get() {
                // console.log(Dep.target, 'dep')
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set: (newValue)=> {
                if(newValue!==value) {
                    this.observe(newValue)
                    value = newValue
                    dep.notify()
                } 
            }
        })
    }
    
}