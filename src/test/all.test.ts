import { LevelEntry, getOffsetEntityPos, mergeMapLevels } from '../map-copy'
import { EntityPoint, MapPoint } from '../pos'
import { EntityRect, MapRect, } from '../rect'
import { assert, assertBool } from '../util'
import { VarExtractor } from '../varcondition'

import './vec2'

// import * as mocha from 'mocha'
import * as chai from 'chai'


const expect = chai.expect
describe('Vec2', () => {
    it('init', () => {
        expect(Vec2).to.not.be.undefined
        expect(Vec2.create).to.not.be.undefined
    })
})

function assertVarCondition(exp: string, expectedExp: string, expectedVars: string[]) {
    const obj = VarExtractor.parse(exp)
    expect(obj.formatted).to.eq(expectedExp)
    expect(obj.vars.length).to.eq(expectedVars.length)
    for (let i = 0; i < expectedVars.length; i++) {
        expect(obj.vars[i]).to.equal(expectedVars[i])
    }
}


describe('VarCondition', () => {
    it('basic tests' , () => {
        assertVarCondition('1+3', '1 + 3', [])
        assertVarCondition('a+2', 'a + 2', ['a'])
        assertVarCondition('a+b*(d*c)*a', 'a + b * (d * c) * a', ['a', 'b', 'c', 'd'])
    })
})

describe('Asset tests', () => {
    it('assert', () => {
        expect(() => assert(true)).to.not.throw()
        expect(() => assert(false)).to.not.throw()
        expect(() => assert(0)).to.not.throw()
        expect(() => assert(null)).to.throw()
        expect(() => assert(undefined)).to.throw()
        expect(() => assertBool(true)).to.not.throw()
        expect(() => assertBool(false)).to.throw()
    })
})

describe('Pos', () => {
    it('Point MapPoint -> EntityPoint', () => {
        expect(new MapPoint(10, -5).to(EntityPoint)).that.deep.include({
            x: 160, y: -80,
        })
    })
    it('Rect MapPoint -> EntityPoint', () => {
        expect(new MapRect(10, -5, 1, 2).to(EntityRect)).that.deep.include({
            x: 160, y: -80, width: 16, height: 32
        })
    })
})

describe('Map copy', () => {
    it('mergeMapLayers', () => {
        const l1: LevelEntry[] = [{ height: -16 }, { height: 0 }, { height: 64 }]
        const l2: LevelEntry[] = [{ height: -16 }, { height: 0 }, { height: 16 }, { height: 32 }]
        const { levels, levelOffset, lvlChangeMap, masterLevel } = mergeMapLevels(l1, l2, 32)

        const expectedLevels: LevelEntry[] = [{ height: -48 }, { height: -32 }, { height: -16 }, { height: 0 }, { height: 64 }]
        expect(levels).to.deep.equal(expectedLevels)

        expect(levelOffset).to.equal(l1.length)
        expect(masterLevel).to.equal(3)
        expect(lvlChangeMap).to.deep.equal([2, 3, 4, 0, 1, 2, 3])
    })
    it('getOffsetEntityPos', () => {
        const expected: Vec2 = Vec2.createC(749, 790)
        const res: Vec2 = getOffsetEntityPos(
            { x: 20, y: 16, width: 32, height: 48 },
            { x: 121, y: 543 },
            { x: 762, y: 346 },
            { width: 128, height: 64 },
            25,
        )
        expect(res).to.deep.equals(expected)
    })
})
