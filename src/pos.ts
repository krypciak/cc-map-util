import { AreaRect, EntityRect, MapRect } from './rect'

const tilesize: number = 16

export enum Dir {
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3,
}

export enum Dir3d {
    NORTH = 0,
    EAST = 1,
    SOUTH = 2,
    WEST = 3,
    UP = 4,
    DOWN = 5,
}

const unique2: [Dir, Dir][] = [
    [0, 1], [0, 2], [0, 3],
    [1, 0], [1, 2], [1, 3],
    [2, 0], [2, 1], [2, 3],
    [3, 0], [3, 1], [3, 2],
]
const unique3: [Dir, Dir, Dir][] = [
    [0, 1, 2], [0, 1, 3], [0, 2, 1], [0, 2, 3], [0, 3, 1], [0, 3, 2],
    [1, 0, 2], [1, 0, 3], [1, 2, 0], [1, 2, 3], [1, 3, 0], [1, 3, 2],
    [2, 0, 1], [2, 0, 3], [2, 1, 0], [2, 1, 3], [2, 3, 0], [2, 3, 1],
    [3, 0, 1], [3, 0, 2], [3, 1, 0], [3, 1, 2], [3, 2, 0], [3, 2, 1],
]
const unique4: [Dir, Dir, Dir, Dir][] = [
    [0, 1, 2, 3], [0, 1, 3, 2], [0, 2, 1, 3], [0, 2, 3, 1], [0, 3, 1, 2], [0, 3, 2, 1],
    [1, 0, 2, 3], [1, 0, 3, 2], [1, 2, 0, 3], [1, 2, 3, 0], [1, 3, 0, 2], [1, 3, 2, 0],
    [2, 0, 1, 3], [2, 0, 3, 1], [2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [2, 3, 1, 0],
    [3, 0, 1, 2], [3, 0, 2, 1], [3, 1, 0, 2], [3, 1, 2, 0], [3, 2, 0, 1], [3, 2, 1, 0],
]

export class DirUtil {
    static flip(dir: Dir): Dir {
        return ((dir + 2) % 4) as Dir
    }
    
    static toRight(dir: Dir): Dir {
        return ((dir + 1) % 4) as Dir
    }

    static convertToDir(dir: keyof typeof Dir): Dir {
        return Dir[dir]
    }
    static convertToString(dir: Dir): keyof typeof Dir {
        return Dir[dir] as keyof typeof Dir
    }

    static convertToStringFace8(dir: ig.ActorEntity.FACE8): keyof typeof ig.ActorEntity.FACE8 {
        return ig.ActorEntity.FACE8[dir] as keyof typeof ig.ActorEntity.FACE8
    }
    static convertToDirFace8(dir: keyof typeof ig.ActorEntity.FACE8): ig.ActorEntity.FACE8 {
        return ig.ActorEntity.FACE8[dir]
    }

    static isVertical(dir: Dir): boolean {
        return dir == Dir.NORTH || dir == Dir.SOUTH
    }

    static dirToDir3d(dir: Dir): Dir3d {
        return dir as unknown as Dir3d
    }

    static dir3dToDir(dir3d: Dir3d): Dir {
        if (! DirUtil.dir3dIsDir(dir3d)) { throw new Error('Invalid dir3d to dir conversion') }
        return dir3d as unknown as Dir
    }

    static dir3dIsDir(dir3d: Dir3d): boolean {
        return dir3d != Dir3d.UP && dir3d != Dir3d.DOWN
    }

    static forEachUniqueDir1(action: ((d1: Dir) => void)) { for (let dir: Dir = 0; dir < 4; dir++) { action(dir) } }
    static forEachUniqueDir2(action: ((d1: Dir, d2: Dir) => void)) { unique2.forEach(e => action(...e)) }
    static forEachUniqueDir3(action: ((d1: Dir, d2: Dir, d3: Dir) => void)) { unique3.forEach(e => action(...e)) }
    static forEachUniqueDir4(action: ((d1: Dir, d2: Dir, d3: Dir, d4: Dir) => void)) { unique4.forEach(e => action(...e)) }
}

export namespace PosDir {
    export function of<T extends Point>(p: T, dir: Dir): PosDir<T> { return Object.assign(p, { dir }) }
}
export type PosDir<T extends Point> =  T & { dir: Dir }

export namespace PosLevel {
    export function of<T extends Point>(p: T, level: number): PosLevel<T> { return Object.assign(p, { level }) }
}
export type PosLevel<T extends Point> =  T & { level: Dir }
/*
export function setToClosestSelSide(pos: Vec2, sel: Selection): { distance: number, dir: Dir, pos: Vec2 } {
    let minObj: { distance: number, dir: Dir, pos: Vec2 } = { distance: 10000, dir: 0, pos: new Point(0, 0) }
    for (let rect of sel.bb) {
        const obj = Rect.new(EntityRect, rect).setToClosestRectSide({ x: pos.x, y: pos.y })
        if (obj.distance < minObj.distance) {
            minObj = obj
        }
    }
    pos.x = minObj.pos.x
    pos.y = minObj.pos.y
    return minObj
}
*/

export class Point {
    static multiplier: number

    public constructor(
        public x: number,
        public y: number) {}

    to<T extends typeof Point>(ins: T): InstanceType<T> {
        const multi = ins.multiplier / 
            // @ts-expect-error
            this.constructor['multiplier']

        return new ins(
            this.x * multi,
            this.y * multi,
        ) as InstanceType<T>
    }

    copy(): Point {
        return new Point(this.x, this.y)
    }

    toJSON() {
        return {
            x: this.x,
            y: this.y,
        }
    }

    static moveInDirection(pos: Vec2, dir: Dir, amount: number = 1) {
        switch (dir) {
            case Dir.NORTH: pos.y -= amount; break
            case Dir.EAST: pos.x += amount; break
            case Dir.SOUTH: pos.y += amount; break
            case Dir.WEST: pos.x -= amount; break
        }
    }

    static floor(vec: Vec2) {
        vec.x = Math.floor(vec.x)
        vec.y = Math.floor(vec.y)
    }
}

export class EntityPoint extends Point {
    static multiplier: number = EntityRect.multiplier
    _entityPoint: boolean = true /* set so you cant assign different types to each other */

    copy(): EntityPoint {
        return new EntityPoint(this.x, this.y)
    }

    static fromMapPoint(pos: MapPoint): Point {
        return new Point(pos.x * tilesize, pos.y * tilesize)
    }

    static fromVec(pos: Vec2): EntityPoint {
        return new EntityPoint(pos.x, pos.y)
    }
}

export class MapPoint extends Point {
    static multiplier: number = MapRect.multiplier
    _mapPoint: boolean = true /* set so you cant assign different types to each other */

    copy(): MapPoint {
        return new MapPoint(this.x, this.y)
    }

    static fromVec(pos: Vec2): MapPoint {
        return new MapPoint(pos.x, pos.y)
    }
}

export class AreaPoint extends Point {
    static multiplier: number = AreaRect.multiplier
    _areaPoint: boolean = true /* set so you cant assign different types to each other */

    copy(): AreaPoint {
        return new AreaPoint(this.x, this.y)
    }
    static fromTwoPoints(pos: AreaPoint, size: AreaPoint): AreaRect {
        return new AreaRect(pos.x, pos.y, size.x, size.y)
    }
    static fromVec(pos: Vec2): AreaPoint {
        return new AreaPoint(pos.x, pos.y)
    }
}
