/* mostly stolen from ig.VarCondition */

var e = /^(!=|==|<=|>=|<|>|=|\+|-|%|\/|\*|AND|OR|&&|\|\|)/,
    f = /^-?\d+([.][\d]+)?/,
    g = /^(true|false|null)/,
    h = /^(\"(\\.|[^"])*\"|\'(\\.|[^'])*\')/,
    i = /^([\w/.-]|\[|\])+/

export class VarExtractor {
    static parse(source: string): { formatted: string; vars: string[] } {
        return new VarExtractor().parse(source)
    }
    source!: string
    vars: string[] = []
    index: number = 0
    searchedIndex: number = 0
    tokenType: number = 0
    tokenValue?: string

    parse(source: string): { formatted: string; vars: string[] } {
        this.source = source
        this.index = 0
        const formatted: string = this.parseExpression()
        return { formatted, vars: this.vars.sort().filter((e, i, arr) => e != arr[i - 1]) }
    }
    private parseExpression(): string {
        var a = this.parseTerminalExpression()
        this.checkToken()
        if (this.tokenType == 0 || this.tokenType == 2) return a!
        if (this.tokenType == 8) {
            this.stepToken()
            return a + ' ' + this.tokenValue + ' ' + this.parseExpression()
        }
        throw Error("Unexpected token '" + this.tokenValue + "' when parsing expression")
    }
    private parseTerminalExpression(): string | undefined {
        this.checkToken(true)
        this.stepToken()
        const token = this.tokenType
        if (token == 1) {
            var a = this.parseExpression()
            this.checkToken()
            if (this.tokenType !== 2) throw Error("Didn't close an open paranthesis! Bad!!")
            this.stepToken()
            return '(' + a + ')'
        }
        if (this.tokenType == 7) return '!' + this.parseTerminalExpression()
        if (this.tokenType == 4 || this.tokenType == 6 || this.tokenType == 5) return this.tokenValue
        if (this.tokenType == 3) {
            this.vars.push(this.tokenValue!)
            return this.tokenValue
        }
        throw Error("Unsupported Token: '" + this.tokenValue + "' during terminal expression parsing")
    }
    private checkToken(a?: boolean) {
        for (var b = this.index, c = this.source; c[b] == ' '; ) b++
        if (b >= c.length) {
            this.tokenType = 0
            this.tokenValue = undefined
        } else if (c[b] == '(') {
            this.tokenType = 1
            this.tokenValue = '('
            b++
        } else if (c[b] == ')') {
            this.tokenType = 2
            this.tokenValue = ')'
            b++
        } else if (c[b] == '!' && c[b + 1] != '=') {
            this.tokenType = 7
            this.tokenValue = '!'
            b++
        } else {
            var c = c.substring(b),
                d
            if (!a && (d = c.match(e))) {
                d = d[0]
                b = b + d.length
                this.tokenType = 8
                d == 'AND' ? (d = '&&') : d == 'OR' ? (d = '||') : d == '=' && (d = '==')
                this.tokenValue = d
            } else if ((d = c.match(f))) {
                d = d[0]
                this.tokenType = 4
                this.tokenValue = d
                b = b + d.length
            } else if ((d = c.match(h))) {
                d = d[0]
                this.tokenType = 6
                this.tokenValue = d
                b = b + d.length
            } else if ((d = c.match(g))) {
                d = d[0]
                this.tokenType = 5
                this.tokenValue = d
                b = b + d.length
            } else if ((d = c.match(i))) {
                d = d[0]
                this.tokenType = 3
                this.tokenValue = d
                b = b + d.length
            } else throw Error("Could not parse next token of '" + c + "'")
        }
        this.searchedIndex = b
    }
    private stepToken() {
        this.index = this.searchedIndex
    }
}
