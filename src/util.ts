export class Stack<T> {
    array: T[] = []

    constructor(array: T[] = []) {
        this.array = [...array]
    }

    push(elements: T) {
        this.array.push(elements)
    }
    pop(): T {
        return this.array.splice(this.array.length - 1, 1)[0]
    }
    peek(): T {
        return this.array[this.array.length - 1]
    }
    shift(): T | undefined {
        return this.array.shift()
    }
    length(): number {
        return this.array.length
    }
}

export function assert(arg: any, msg: string = ''): asserts arg {
    if (arg != 0 && !arg) {
        throw new Error(`Assertion failed: ${msg}`)
    }
}

export function assertBool(arg: boolean, msg: string = ''): asserts arg {
    if (!arg) {
        throw new Error(`Assertion failed: ${msg}`)
    }
}

export function executeRecursiveAction(obj: any, action: (key: any, obj: any, args: any) => void, args: any) {
    for (const key in obj) {
        if (typeof obj[key] === 'object') {
            action(key, obj, args)
            executeRecursiveAction(obj[key], action, args)
        } else {
            action(key, obj, args)
        }
    }
}

export function generateUniqueId() {
    return Math.floor(Math.random() * 1000000).toString()
}
