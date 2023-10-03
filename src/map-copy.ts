const tilesize: number = 16

interface CopyArea {
    bb: bareRect[]
    masterZ: number
}

interface LevelEntry {
    height: number
}

function mergeMapLevels(baseMap: sc.MapModel.Map, selMap: sc.MapModel.Map, cpa: CopyArea):
    { levels: LevelEntry[], levelOffset: number, lvlChangeMap: number[], masterLevel: number } {
    const selLevels: LevelEntry[] = baseMap.levels.map(obj => ({ height: obj.height - cpa.masterZ }))

    const levelsCopy: LevelEntry[] = []
    baseMap.levels.forEach((level) => { levelsCopy.push(level.height) })
    selLevels.forEach((level) => { levelsCopy.push(level.height) })
    const levelOffset = baseLevels.length

    /* sort levels and remove duplicates */
    const levels = [...levelsCopy].sort((a, b) => a - b).filter((e, i, a) => e.height !== a[i - 1]?.height)

    const lvlChangeMap: number[] = []
    for (let i = 0; i < levelsCopy.length; i++) {
	lvlChangeMap[i] = levels.findIndex(l => l.height == levelsCopy[i])
        // lvlChangeMap[i] = levels.indexOf(levelsCopy[i])
    }
    const masterLevel = levels.indexOf(0)
    
    return { levels, levelOffset, lvlChangeMap, masterLevel, }
}
