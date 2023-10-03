import { bareRect } from './rect'

const tilesize: number = 16

export interface CopyArea {
    bb: bareRect[]
    masterZ: number
}

export interface LevelEntry {
    height: number
}

export function mergeMapLevels(baseMapLevels: LevelEntry[], selMapLevels: LevelEntry[], selMasterZ: number):
    { levels: LevelEntry[], levelOffset: number, lvlChangeMap: number[], masterLevel: number } {
    const selLevels: LevelEntry[] = selMapLevels.map(obj => ({ height: obj.height - selMasterZ }))

    const levelsCopy: LevelEntry[] = []
    levelsCopy.push(...baseMapLevels)
    levelsCopy.push(...selLevels)
    const levelOffset = baseMapLevels.length

    /* sort levels and remove duplicates */
    const levels = [...levelsCopy].sort((a, b) => a.height - b.height).filter((e, i, a) => e.height !== a[i - 1]?.height)

    const lvlChangeMap: number[] = []
    for (let i = 0; i < levelsCopy.length; i++) {
	    lvlChangeMap[i] = levels.findIndex(l => l.height == levelsCopy[i].height)
    }
    const masterLevel = levels.findIndex(l => l.height == 0)
    
    return { levels, levelOffset, lvlChangeMap, masterLevel, }
}

export function getOffsetEntityPos(rect: bareRect, entityPos: Vec2, offset: Vec2, selSizeRect: { width: number; height: number }, selMasterZ?: number): Vec2 {
    return {
        x: Math.floor(offset.x/tilesize)*16 - Math.floor(rect.x/tilesize)*16 + entityPos.x + rect.x - selSizeRect.width,
        y: Math.floor(offset.y/tilesize)*16 - Math.floor(rect.y/tilesize)*16 + entityPos.y + rect.y - selSizeRect.height - (selMasterZ ?? 0),
    }
}
