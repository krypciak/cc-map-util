import { AreaPoint, Dir, DirUtil, EntityPoint, MapPoint, Point } from './pos'

export type bareRect = { x: number; y: number; width: number; height: number }

export class Rect {
    static multiplier: number
    static ins: Rect
    static pointIns: Point

    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {
        if (width < 0) {
            throw new Error('Width cannot be less than 0')
        }
        if (height < 0) {
            throw new Error('Height cannot be less than 0')
        }
    }

    x2() {
        return this.x + this.width
    }
    y2() {
        return this.y + this.height
    }

    getSide(dir: Dir, smallerSize: number = 0.5): Rect {
        let pos: Point
        switch (dir) {
            case Dir.NORTH:
                pos = new Point(this.x, this.y)
                break
            case Dir.EAST:
                pos = new Point(this.x2(), this.y)
                break
            case Dir.SOUTH:
                pos = new Point(this.x, this.y2())
                break
            case Dir.WEST:
                pos = new Point(this.x, this.y)
                break
        }
        const size: Point = DirUtil.isVertical(dir) ? new Point(this.width, smallerSize) : new Point(smallerSize, this.height)
        return Rect.fromTwoPoints(pos, size)
    }

    setPosToSide(pos: Point, dir: Dir) {
        switch (dir) {
            case Dir.NORTH:
                pos.y = this.y
                break
            case Dir.EAST:
                pos.x = this.x2()
                break
            case Dir.SOUTH:
                pos.y = this.y2()
                break
            case Dir.WEST:
                pos.x = this.x
                break
        }
    }

    setToClosestRectSide(pos: Vec2): { distance: number; dir: Dir; pos: Vec2 } {
        let smallestDist: number = 10000
        let smallestDir: Dir = Dir.NORTH
        let smallestPos: Vec2 = new Point(0, 0)
        for (let dir = 0; dir < 4; dir++) {
            const p: Vec2 = this.getSide(dir)
            if (DirUtil.isVertical(dir)) {
                p.x = pos.x
            } else {
                p.y = pos.y
            }
            const dist = Vec2.distance(pos, p)
            if (dist < smallestDist) {
                smallestDist = dist
                smallestDir = dir
                smallestPos = p
            }
        }
        pos.x = smallestPos.x
        pos.y = smallestPos.y
        return { distance: smallestDist, dir: smallestDir, pos: smallestPos }
    }

    middlePoint<T extends Point>(type: new (x: number, y: number) => T): T {
        return new type(this.x + this.width / 2, this.y + this.height / 2)
    }

    extend(num: number) {
        this.x -= num
        this.y -= num
        this.width += num * 2
        this.height += num * 2
    }

    to<T extends typeof Rect>(ins: T): InstanceType<T> {
        const multi =
            ins.multiplier /
            // @ts-expect-error
            this.constructor['multiplier']

        return new ins(this.x * multi, this.y * multi, this.width * multi, this.height * multi) as InstanceType<T>
    }

    static getMinMaxPosFromRectArr(rects: Rect[]): { min: Point; max: Point } {
        const min: AreaPoint = new AreaPoint(100000, 100000)
        const max: AreaPoint = new AreaPoint(-100000, -100000)
        for (const rect of rects) {
            if (rect.x < min.x) {
                min.x = rect.x
            }
            if (rect.y < min.y) {
                min.y = rect.y
            }
            if (rect.x2() > max.x) {
                max.x = rect.x2()
            }
            if (rect.y2() > max.y) {
                max.y = rect.y2()
            }
        }
        return { min, max }
    }

    toJSON(): bareRect {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        }
    }

    static fromTwoPoints(pos: Point, size: Point): Rect {
        return new Rect(pos.x, pos.y, size.x, size.y)
    }

    static new<T extends Rect>(init: new (x: number, y: number, width: number, height: number) => T, rect: bareRect): T {
        return new init(rect.x, rect.y, rect.width, rect.height)
    }
}

export class EntityRect extends Rect {
    static multiplier: number = 64
    _entityrect: boolean = true /* set so you cant assign different types to each other */

    static fromxy2(x: number, y: number, x2: number, y2: number): EntityRect {
        return new EntityRect(x, y, x2 - x, y2 - y)
    }
    static fromTwoPoints(pos: EntityPoint, size: EntityPoint): EntityRect {
        return new EntityRect(pos.x, pos.y, size.x, size.y)
    }
}

export class MapRect extends Rect {
    static multiplier: number = 4
    _maprect: boolean = true /* set so you cant assign different types to each other */

    static fromxy2(x: number, y: number, x2: number, y2: number): MapRect {
        return new MapRect(x, y, x2 - x, y2 - y)
    }

    static fromTwoPoints(pos: MapPoint, size: MapPoint): MapRect {
        return new MapRect(pos.x, pos.y, size.x, size.y)
    }
}

export class AreaRect extends Rect {
    _arearect: boolean = true /* set so you cant assign different types to each other */
    static multiplier: number = 1

    static fromxy2(x: number, y: number, x2: number, y2: number): AreaRect {
        return new AreaRect(x, y, x2 - x, y2 - y)
    }
    static fromTwoPoints(pos: AreaPoint, size: AreaPoint): AreaRect {
        return new AreaRect(pos.x, pos.y, size.x, size.y)
    }
}

export function doRectsOverlap<T extends Rect>(rect1: T, rect2: T): boolean {
    return rect1.x < rect2.x2() && rect1.x2() > rect2.x && rect1.y < rect2.y2() && rect1.y2() > rect2.y
}

export function doesRectArrayOverlapRectArray<T extends Rect>(arr1: T[], arr2: T[]): boolean {
    for (let i1 = arr1.length - 1; i1 >= 0; i1--) {
        for (let i2 = arr2.length - 1; i2 >= 0; i2--) {
            if (doRectsOverlap(arr1[i1], arr2[i2])) {
                return true
            }
        }
    }
    return false
}

export function isVecInRect(vec: Vec2, rect: bareRect) {
    return vec.x >= rect.x && vec.x < rect.x + rect.width && vec.y >= rect.y && vec.y < rect.y + rect.height
}
export function isVecInRectArr(vec: Vec2, arr: bareRect[]) {
    for (const rect of arr) {
        if (isVecInRect(vec, rect)) {
            return true
        }
    }
    return false
}

export function emptyArr2d(size: Vec2, fill: number = 0): number[][] {
    return Array.from(new Array(size.y), () => new Array(size.x).fill(fill))
}

export function reduceRectArr(rects: bareRect[]) {
    const min: Vec2 = Vec2.createC(100000, 100000)
    const max: Vec2 = Vec2.createC(-1, -1)
    for (let rect of rects) {
        Vec2.min(min, rect)
        Vec2.max(max, Vec2.createC(rect.x + rect.width, rect.y + rect.height))
    }

    let size: Vec2 = Vec2.create(max)
    Vec2.sub(size, min)

    const map: number[][] = emptyArr2d(size)

    for (let rect of rects) {
        const pos: Vec2 = Vec2.create(rect)
        Vec2.sub(pos, min)
        for (let y = pos.y; y < rect.height + pos.y; y++) {
            for (let x = pos.x; x < rect.width + pos.x; x++) {
                map[y][x] = 1
            }
        }
    }

    let newRects: MapRect[] = []

    for (let y = 0; y < size.y; y++) {
        for (let x = 0; x < size.x; x++) {
            if (map[y][x] == 1) {
                let maxX = x
                for (let x1 = x; x1 < size.x; x1++) {
                    if (map[y][x1] == 0) {
                        break
                    }
                    maxX = x1
                    map[y][x1] = 0
                }

                maxX += 1

                let maxY = y
                for (let y1 = y + 1; y1 < size.y; y1++) {
                    let ok = true
                    for (let x1 = x; x1 < maxX; x1++) {
                        if (map[y1][x1] == 0) {
                            ok = false
                            break
                        }
                    }
                    if (ok) {
                        maxY = y1
                    } else {
                        break
                    }
                }

                maxY += 1

                for (let y1 = y; y1 < maxY; y1++) {
                    for (let x1 = x; x1 < maxX; x1++) {
                        map[y1][x1] = 0
                    }
                }

                newRects.push(new MapRect(min.x + x, min.y + y, maxX - x, maxY - y))
            }
        }
    }

    return {
        rects: newRects,
        rectSize: MapRect.fromTwoPoints(min as MapPoint, max as MapPoint),
    }
}

export function fillFromToArr2d<T>(arr: T[][], value: T, x1: number, y1: number, x2: number, y2: number) {
    const iteX = Math.min(x2, arr[0].length)
    const iteY = Math.min(y2, arr.length)

    for (let y = y1; y < iteY; y++) {
        for (let x = x1; x < iteX; x++) {
            arr[y][x] = value
        }
    }
}
export function createSubArr2d(arr: any[][], x1: number, y1: number, x2: number, y2: number, offsetX: number, offsetY: number, size: Vec2) {
    const nArr = emptyArr2d(size)

    const arrWidth = arr[0].length
    const arrHeight = arr.length
    // make sure cords are within 0 - width or height of arr
    x2 = Math.min(arrWidth, x2)
    y2 = Math.min(arrHeight, y2)

    // make sure cords are in bounds with baseMap
    let xTmp = x2 - x1 + 1 - (size.x - offsetX)
    if (xTmp > 0) {
        x2 -= xTmp
    }
    let yTmp = y2 - y1 + 1 - (size.y - offsetY)
    if (yTmp > 0) {
        y2 -= yTmp
    }

    x1 = Math.min(arrWidth, Math.max(x1, 0))
    y1 = Math.min(arrHeight, Math.max(y1, 0))
    x2 = Math.min(arrWidth, Math.max(x2, 0))
    y2 = Math.min(arrHeight, Math.max(y2, 0))

    if (x2 < x1 || y2 < y1) throw new Error('invalid createSubArray inputs')

    for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
            let nArrX = x - x1 + offsetX
            let nArrY = y - y1 + offsetY
            nArr[nArrY][nArrX] = arr[y][x]
        }
    }
    return nArr
}
export function mergeArrays2d<T>(arr1: T[][], arr2: T[][]) {
    for (let y = 0; y < Math.min(arr1.length, arr2.length); y++) {
        for (let x = 0; x < Math.min(arr1[y].length, arr2[0].length); x++) {
            let val = arr2[y][x]
            if (val != 0) {
                arr1[y][x] = val
            }
        }
    }
}

export function parseArrAt2d<T>(arr1: T[][], arr2: T[][], x1: number, y1: number) {
    for (let y = y1; y < y1 + arr2.length; y++) {
        for (let x = x1; x < x1 + arr2[y - y1].length; x++) {
            arr1[y][x] = arr2[y - y1][x - x1]
        }
    }
}
export function isArrEmpty2d<T>(arr: T[][]) {
    for (let y = 0; y < arr.length; y++) {
        for (let x = 0; x < arr[y].length; x++) {
            if (arr[y][x] != 0) return false
        }
    }
    return true
}

export function generateUniqueId() {
    return Math.floor(Math.random() * 10000000)
}
