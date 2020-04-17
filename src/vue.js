// import Observe from './observer'
// const Observe = require('./observer')

const compileUtil = {
    /**
     * @param node
     * @param expr 表达式
     * @param vm new Vue
     * @param eventName
     */
    text(node, expr, vm) {
        // console.log(node, expr, vm, 'node, expr, vm')
        let value
        // const value = this.getValue(expr, vm)
        // console.log(value, 'value')
        if(/\{\{(.+?)\}\}/.test(expr)) {
            value = expr.replace(/\{\{(.+?)\}\}/g, (...args)=> {
                // console.log(args, 'args')
                const watcher = new Watcher(vm, args[1], (newVal)=> {
                    // console.log(node, newVal, 'newVal')
                    this.updater.textUpdater(node, this.getContentVal(expr, vm))
                })
                return this.getValue(args[1], vm)
            })
        } else {
            value = this.getValue(expr, vm)
        }
        
        this.updater.textUpdater(node, value)
    },
    html(node, expr, vm) {
        const value = this.getValue(expr, vm)
        new Watcher(vm, expr, (newVal)=> {
            this.updater.htmlUpdater(node, newVal)
        })
        this.updater.htmlUpdater(node, value)
        // console.log(value, 'html')
    },
    // 表单
    model(node, expr, vm) {
        const value = this.getValue(expr, vm)
        this.updater.modelUpdater(node, value)
    },
    // 事件
    on(node, expr, vm, eventName) {
        // console.log(node, expr, vm, eventName, 'node, expr, vm, eventName')
        const fn = vm.$options && vm.$options.methods[expr]
        // console.log(fn, 'fn')
        node.addEventListener(eventName, fn.bind(vm), false)
    },
    // 动态属性
    bind(node, expr, vm, attrName) {

    },
    // 处理特殊值 
    getValue(expr, vm) {
        // textData.name [textData, name]
        return expr.split('.').reduce((data, cur)=> {
            // console.log(cur, 'getValue cur')
            return data[cur]
        }, vm.$data)
    },
    getContentVal(expr, vm) {
        // console.log(expr, vm, 'getContentVal')
        value = expr.replace(/\{\{(.+?)\}\}/g, (...args)=> {
            return this.getValue(args[1], vm)
        })
        return value
    },
    updater: {
        textUpdater(node, value) {
            // console.log(node, value, 'textUpdater')
            node.textContent = value
        },
        htmlUpdater(node, value) {
            // console.log(node, value, 'htmlUpdater')
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        }
    }
}


class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        // console.log(this.el)
        this.vm = vm
        // 1. 获取文档碎片对象，放入内存中会减少页面回流及重绘
        const fragment = this.node2Fragment(this.el)
        // console.dir(fragment, 'fragment')

        // 2. 编译模板
        this.compiler(fragment)

        // 3. 追加子元素到根元素
        this.el.appendChild(fragment)
    }
    compiler(fragment) {
        // 获取子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child=> {
            // console.dir(child, 'child')
            if(this.isElementNode(child)) {
                // 是元素节点
                // 编译元素节点
                // console.log('元素节点：', child)
                this.compileElement(child)
            } else {
                // 是文本节点
                // 编译文本节点
                // console.log('文本节点：', child)
                // this.compileText(child)
            }

            this.compileText(child)

            if(child.childNodes && child.childNodes.length) {
                this.compiler(child)
            }
        })
    }
    compileElement(node) {
        // v-text
        const [...attrs] = node.attributes
        // console.log(attrs, 'attrs');
        if(attrs && attrs.length>0) {
            attrs.forEach(attr=> {
                const { name, value } = attr
                if(this.isDirective(name)) { // v-on v-text v-on:click
                    // console.log(name, 'name')
                    const [ ,directive] = name.split('-')
                    const [ directiveName, eventName] = directive.split(':')
                    // console.log(directive, directiveName, eventName, 'directive')
                    // 指令绑定
                    compileUtil[directiveName](node, value, this.vm, eventName)
                    // 删除绑定指令
                    node.removeAttribute(`v-${directive}`)
                } else if (this.isAliasEvent(name)) { // @click
                    const [ , eventName] = name.split('@')
                    compileUtil.on(node, value, this.vm, eventName)
                }
            })
        }
    }
    compileText(node) {
        // {{}}
        let content = node.textContent
        if(/\{\{(.+?)\}\}/g.test(content)) {
            console.log(content, 'content')
            // const value = /\{\{(.+?)\}\}/g.exec(content)
            // let arr = []
            // const value = content.replace(/\{\{(.+?)\}\}/g, (...arg)=> {
            //     console.log(arg, 'arg')
            //     arr.push(arg[1])
            //     return arg[1]
            // })
            // console.log(value, arr, 'value')
            // arr.forEach(expr=> {
            //     compileUtil.text(node, expr, this.vm)
            // })
            compileUtil.text(node, content, this.vm)
            // if(value && value[1]){
            //     compileUtil.text(node, value[1], this.vm)
            // }
        }
    }

    isDirective(attrName) {
        return /^v-/.test(attrName)
    }
    isAliasEvent(attrName) {
        return attrName.startsWith('@')
    }

    node2Fragment(el) {
        // 创建文档碎片
        // console.log(el, 'els firstChild')
        const f = document.createDocumentFragment()
        let firstChild
        while(firstChild = el.firstChild) {
            f.appendChild(firstChild)
        }
        return f
    }

    // 是否是文本节点
    isElementNode(node) {
        return node.nodeType === 1
    }
}

class Vue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        this.$options = options

        if(this.$el) {
            // 1. 实现一个数据观察者 observe
            new Observer(this.$data)
            // 2. 实现一个指令解析器
            new Compiler(this.$el, this)
        }
    }
}
