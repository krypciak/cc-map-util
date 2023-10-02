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
