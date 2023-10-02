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
        return this.array.last()
    }
    shift(): T | undefined {
        return this.array.shift()
    }
    length(): number {
        return this.array.length
    }
}

export function assert(arg: any, msg: string = ''): asserts arg {
    if (arg != 0 && ! arg) {
        throw new Error(`Assertion failed: ${msg}`)
    }
}

export function assertBool(arg: boolean, msg: string = ''): asserts arg {
    if (! arg) {
        throw new Error(`Assertion failed: ${msg}`)
    }
}
