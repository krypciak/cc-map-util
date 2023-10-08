import { MapLayer } from './map'
import { bareRect, fillFromToArr2d, isVecInRect, createSubArr2d, mergeArrays2d, isArrEmpty2d, generateUniqueId } from './rect'
import { assertBool, executeRecursiveAction } from './util'
import { VarExtractor } from './varcondition'

const tilesize: number = 16
interface LevelEntry {
    height: number
}

function mergeMapLevels(baseMapLevels: LevelEntry[], selMapLevels: LevelEntry[], selMasterZ: number):
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

export function getOffsetEntityPos(rect: bareRect, entityPos: Vec2, offset: Vec2, selSizeRect: Vec2, selMasterZ?: number): Vec2 {
    return {
        x: Math.floor(offset.x/tilesize)*16 - Math.floor(rect.x/tilesize)*16 + entityPos.x + rect.x - selSizeRect.x,
        y: Math.floor(offset.y/tilesize)*16 - Math.floor(rect.y/tilesize)*16 + entityPos.y + rect.y - selSizeRect.y - (selMasterZ ?? 0),
    }
}

export interface EntityRecArgsIn {
    uniqueId?: number
    offset: Vec2
    selMasterZ: number
    selSizeRect: Vec2
    filters: ((key: any, obj: any, args: EntityRecArgs) => void)[]
    selectAllEventTriggers: boolean
}
export interface EntityRecArgs extends EntityRecArgsIn {
    lvlChangeMap: number[]
    isSel: boolean
    levelOffset: number
    repositionRect: bareRect
}
function changeEntityRecursive(key: any, obj: any, eargs: EntityRecArgs) {
    let val = obj[key]
    if (key == 'level') {
        if (typeof val === 'number' || typeof val === 'string') {
            obj.level = eargs.lvlChangeMap[parseInt(val.toString()) + (eargs.isSel ? eargs.levelOffset : 0)]
        }
        return
    }
    if (key == 'newPos' && 'lvl' in val) {
        obj.newPos.lvl = eargs.lvlChangeMap[parseInt(val.lvl) + (eargs.isSel ? eargs.levelOffset : 0)]
    }

    if (eargs.uniqueId) {
        switch (key) {
            case 'condition':      case 'spawnCondition': case 'endCondition':
            case 'startCondition': case 'hideCondition':  case 'pauseCondition':
            case 'blockEventCondition': {
                if (! val) { return }
                if (typeof val === 'string') {
                    if (val.trim().length == 0 ||
                        val.includes('_destroyed')) { return }
                }
                const vars: string[] = VarExtractor.parse(val).vars
                for (const varName of vars) {
                    val = val.replace(`/${varName}/g`, varName + '_' + eargs.uniqueId)
                }
                obj[key] = val
                return
            }

            case 'group':        case 'varName':       case 'preVariable':
            case 'postVariable': case 'countVariable': case 'varIncrease':
            case 'variable': {
                if (! val) { return }
                if (typeof val === 'string') {
                    if (val.trim().length == 0 ||
                        val.includes('_destroyed')) { return }
                }
                obj[key] = val + '_' + eargs.uniqueId
                return
            }
        }
    }

    if (eargs.repositionRect && typeof val == 'object') {
        switch (key) {
            // removing position fixes movableplatforms
            // case 'position':
            case 'val':
            case 'target':
            case 'newPos': {
                if (key == 'position' && obj.duration) { return }
                if ('x' in val && 'y' in val) {
                    let { x, y } = getOffsetEntityPos(eargs.repositionRect, obj[key], eargs.offset, eargs.selSizeRect, eargs.selMasterZ)
                    obj[key].x = x
                    obj[key].y = y
                }
                if ('lvl' in val) {
                    let oldLevel = parseInt(val.lvl)
                    let newLevel = eargs.lvlChangeMap[oldLevel + (eargs.isSel ? eargs.levelOffset : 0)]

                    obj[key].lvl = newLevel
                }
                return
            }
            case 'targetPoint': {
                let { x, y } = getOffsetEntityPos(eargs.repositionRect, obj[key], eargs.offset, eargs.selSizeRect, eargs.selMasterZ)
                obj.targetPoint.x = x
                obj.targetPoint.y = y
                
                return
            }
        }
    }
    for (const filter of eargs.filters) { filter(key, obj, eargs) }
}

function mergeMapEntities(entities: sc.MapModel.MapEntity[],
    selEntities: sc.MapModel.MapEntity[], rects: bareRect[], eargs: Omit<EntityRecArgs, 'isSel'>) {
    
    if (! entities && ! selEntities) { return [] }

    let entityMapId: number = 0

    entities.forEach((entity) => {
        const eargs1: EntityRecArgs = { ...eargs } as EntityRecArgs
        eargs1.isSel = false
        executeRecursiveAction(entity, changeEntityRecursive, eargs1)
        entityMapId = Math.max(entityMapId, entity.settings?.mapId ?? -1)
    })

    /* add all EventTriggers */
    if (eargs.selectAllEventTriggers) {
    let eventTriggerOffsetY: number = 0
        for (const entity of selEntities) {
            if (entity.type == 'EventTrigger') {
                Vec2.assign(entity, eargs.offset)
                entity.y += eventTriggerOffsetY
                eventTriggerOffsetY += 16
            }
        }
    }
    for (const rect of rects) {
        for (const e of selEntities) {
            if (eargs.selectAllEventTriggers && e.type == 'EventTrigger') { continue }
            const pos: Vec2 = Vec2.create(e)
            Vec2.sub(pos, rect)
            if (isVecInRect(pos, rect)) {
                let eoffset: Vec2 = getOffsetEntityPos(rect, e, eargs.offset, eargs.selSizeRect, eargs.selMasterZ)
                const eargs1: EntityRecArgs = { ...eargs } as EntityRecArgs
                eargs1.isSel = true
                eargs1.repositionRect = rect
                executeRecursiveAction(e, changeEntityRecursive, eargs1)

                Vec2.assign(e, eoffset)
                if (e.settings && e.type != 'Destructible') {
                    e.settings.mapId = entityMapId++
                }
                entities.push(e)
            }
        }
    }
    return entities
}

/* as clearly stated mostly stolen from CrossCode code */
function stolenProcessCollisionLayers(collisions: sc.MapModel.MapLayer[], masterLevel: number, heights: LevelEntry[]) {
    let maxLevel = -1
    for (let layer of collisions) {
        maxLevel = Math.max(maxLevel, parseInt(layer.level.toString()))
    }
    let tmpLayer = undefined
    let masterLayer = collisions[masterLevel]
    if (masterLayer) {
        stolenProcessCollisionLayer(masterLayer, tmpLayer)
        tmpLayer = masterLayer
    }

    for (let i = masterLevel + 1; i < maxLevel; i++) {
        stolenProcessCollisionLayer(collisions[i], tmpLayer, tmpLayer ? (heights[i].height - heights[i - 1].height) / 16 : 0)
        tmpLayer = collisions[i]
    }
    tmpLayer = masterLayer ? masterLayer : undefined

    for (let i = masterLevel - 1; i >= 0; i--) {
        stolenProcessCollisionLayer(collisions[i], tmpLayer, tmpLayer ? (heights[i].height - heights[i + 1].height) / 16 : 0)
        tmpLayer = collisions[i]
    }
}
function stolenProcessCollisionLayer(layer: sc.MapModel.MapLayer, tmpLayer?: sc.MapModel.MapLayer, yDiff?: number) {
    for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
            const g: number | undefined = tmpLayer ? (tmpLayer.data[y + yDiff!] ? tmpLayer.data[y + yDiff!][x] % 32 : 2) : undefined
            layer.data[y][x] = stolenPrepareSingleTile(x, y, layer.data[y][x], g, yDiff)
        }
    }
}
function stolenPrepareSingleTile(d: number, c: number, e: number, f?: number, g?: number) {
    function b(a: number) { return a < 4 ? a % 3 : (a - 12) >> 2 }
    function a(a: number) { return a < 4 ? (a == 3 ? 0 : 1) : 2 + (a % 4) }
    c = d = e
    d = d % 32
    c = c - d
    if ((d > 0 && d < 4) || d >= 16) return e
    if (f === void 0) c = d == 0 || d >= 12 ? c + 3 : c + (d + 12)
    else {
        var e = a(f),
            h = b(f)
        if (g !== undefined && g > 0)
            if (d == 0) c = h == 2 || h == 3 ? c + (e == 1 ? 3 : (e % 4) + 16) : c + 1
            else {
                f = 2 + (d % 4)
                c = e != f && (h == 2 || h == 3) ? c + (d >= 12 ? 3 : d + 12) : c + (d >= 12 ? (f % 4) + 16 : d >= 8 ? d + 16 : 1)
            }
        else if (d == 0) c = h == 1 ? c + (e == 1 ? 3 : (e % 4) + 20) : h == 3 ? c + (f - 4) : c + 2
        else {
            f = 2 + (d % 4)
            h == 3 && (e = 2 + (e % 4))
            c = e != f && (h == 1 || h == 3) ? c + (d >= 12 ? 3 : d + 12) : c + (d >= 12 ? (f % 4) + 20 : d >= 8 ? 2 : (f % 4) + 24)
        }
    }
    return c
}

function processCollisionLayers(map: sc.MapModel.Map) {
    const width = map.mapWidth
    const height = map.mapHeight

    const collisionLayers: sc.MapModel.MapLayer[] = []
    map.layer.filter(l => l.type == 'Collision').forEach(l => {
        const lvl = parseInt(l.level.toString())
        assertBool(collisionLayers[lvl] === undefined, 'A map cannot have two collision layers on the same level')
        collisionLayers[lvl] = l
    })
    for (let i = 0; i < map.levels.length; i++) {
        if (! collisionLayers[i]) {
            collisionLayers[i] = new MapLayer(width, height, `Collision ${i}`, 'Collision', 'media/map/collisiontiles-16x16.png', i, -1)
        }
    }
    
    stolenProcessCollisionLayers(collisionLayers, map.masterLevel, map.levels)

    /* for (let i = 0; i < map.layer.length; i++) {
        const layer: sc.MapModel.MapLayer = map.layer[i]
        if (layer.type != 'Collision') { continue }
        map.layer[i] = collisionLayers[layer.level]
    } */
}

function getMapLayerCords(rect: bareRect, offset: Vec2, selSize: Vec2) {
   const x1 = rect.x
   const y1 = rect.y
   const x2 = x1 + rect.width
   const y2 = y1 + rect.height
   const x3 = offset.x + rect.x - selSize.x
   const y3 = offset.y + rect.y - selSize.y
   const x4 = x3 + rect.width
   const y4 = y3 + rect.height
   return { x1, y1, x2, y2, x3, y3, x4, y4 }
}

function mergeMapLayers(baseMap: sc.MapModel.Map, selMap: sc.MapModel.Map, rects: bareRect[], eargs: Omit<EntityRecArgs, 'isSel'>, levelsLen: number) {

    const size: Vec2 = { x: baseMap.mapWidth, y: baseMap.mapHeight }

    let tmp: number

    /* search for base light layer */
    let lightLayer: sc.MapModel.MapLayer | undefined = undefined
    tmp = 0
    baseMap.layer.forEach((layer) => {
        if (layer.type == 'Light') { 
            assertBool(tmp == 0, 'Map cannot have two light layers')
            lightLayer = layer; tmp++
        }
    })
    if (! lightLayer) {
        lightLayer = new MapLayer(size.x, size.y, 'Light', 'Light', 'media/map/lightmap-tiles.png', 'light', -2).fill(0)
    }

    /* search for sel light layer */
    let lightLayerSel: sc.MapModel.MapLayer | undefined = undefined
    tmp = 0
    for (const layer of baseMap.layer) {
        if (layer.type == 'Light') { 
            assertBool(tmp == 0, 'Map cannot have two light layers')
            lightLayerSel = layer
            tmp++
        }
    }
    if (lightLayerSel) {
        /* merge base light layer with selection light */
        for (const rect of rects) {
            const { x1, y1, x2, y2, x3, y3, x4, y4 } = getMapLayerCords(rect, eargs.offset, eargs.selSizeRect)
            fillFromToArr2d(lightLayer.data, 0, x3, y3, x4, y4)
            const subArray = createSubArr2d(lightLayerSel.data, x1, y1, x2, y2, x3, y3, size)
            mergeArrays2d(lightLayer.data, subArray)
        }
    }
    lightLayer.width = size.x
    lightLayer.height = size.y
    lightLayer.level = 'light' /* maybe 'last' insted of 'light'? */
    
    /* generate all collision tiles to keep the master level from ruining my day */
    processCollisionLayers(baseMap)
    processCollisionLayers(selMap)

    let collisionLayers: (sc.MapModel.MapLayer & { isBase?: boolean })[] = []
    for (let i = 0; i < levelsLen; i++) {
        collisionLayers[i] = new MapLayer(size.x, size.y, `Collision ${i}`, 'Collision', 'media/map/collisiontiles-16x16.png', i, -3).fill(0)
    }

    /* get base collision layers */
    for (const layer of baseMap.layer as (sc.MapModel.MapLayer & { isBase?: boolean })[]) {
        if (layer.type != 'Collision') { continue }
        let level = eargs.lvlChangeMap[parseInt(layer.level.toString())]
        layer.level = level
        layer.tilesetName = 'media/map/collisiontiles-16x16.png'
        layer.isBase = true
        collisionLayers[level] = layer
    }

    /* merge collision layers with sel layers */
    for (const rect of rects) {
        const { x1, y1, x2, y2, x3, y3, x4, y4 } = getMapLayerCords(rect, eargs.offset, eargs.selSizeRect)
        for (const layer of collisionLayers) {
            if (layer.isBase) {
                fillFromToArr2d(layer.data, 0, x3, y3, x4, y4)
            }
        }
        for (const layer of selMap.layer) {
            if (layer.type != 'Collision') { continue }
            let level: number = eargs.lvlChangeMap[parseInt(layer.level.toString()) + eargs.levelOffset]
            let layer1 = collisionLayers[level]

            let subArray = createSubArr2d(layer.data, x1, y1, x2, y2, x3, y3, size)
            
            mergeArrays2d(layer1.data, subArray)
        }
    }

    const tileLayers: sc.MapModel.MapLayer[][] = []
    const tileLayersClear: boolean[] = []
    /* get base tile layers */
    
    for (const layer of baseMap.layer as (sc.MapModel.MapLayer & { isBase?: boolean })[]) {
        if (layer.type != 'Background' || (typeof layer.level === 'string' && layer.level.startsWith('object'))) { continue }
        const level: number = eargs.lvlChangeMap[parseInt(layer.level.toString())]
        if (! (level in tileLayers)) {
            tileLayers[level] = []
        }
        layer.level = level
        layer.isBase = true
        tileLayersClear[level] = true
        tileLayers[level].push(layer)
    }
    /* add sel layers */
    for (const layer of selMap.layer as (sc.MapModel.MapLayer & { isBase?: boolean })[]) {
        if (layer.type != 'Background' || (typeof layer.level === 'string' && layer.level.startsWith('object'))) { continue }

        const level: number = eargs.lvlChangeMap[parseInt(layer.level.toString()) + eargs.levelOffset]

        if (! (level in tileLayers)) {
            tileLayers[level] = []
        }
        let rectLayer: sc.MapModel.MapLayer | undefined

        for (const rect of rects) {
            const { x1, y1, x2, y2, x3, y3, x4, y4 } = getMapLayerCords(rect, eargs.offset, eargs.selSizeRect)
            if (tileLayersClear[level]) {
                for (const layer1 of tileLayers[level] as (sc.MapModel.MapLayer & { isBase?: boolean })[]) {
                    if (layer1.isBase) {
                        fillFromToArr2d(layer1.data, 0, x3, y3, x4, y4)
                    }
                }
            }
            const subArray: number[][] = createSubArr2d(layer.data, x1, y1, x2, y2, x3, y3, size)
            if (isArrEmpty2d(subArray)) {
                if (rectLayer) {
                    mergeArrays2d(rectLayer.data, subArray)
                } else {
                    layer.data = subArray
                    layer.width = size.x
                    layer.height = size.y
                    layer.level = level
                    layer.name = (eargs.uniqueId ? (eargs.uniqueId + '_') : '') + layer.name
                    tileLayers[level].push(layer)
                    rectLayer = layer
                }
            }
        }
    }


    /* handle special object layers */
    const objectLayers: sc.MapModel.MapLayer[] = []
    /* get base object layers */
    for (const layer of baseMap.layer) {
        const level = layer.level
        if (! (layer.type == 'Background' && typeof level === 'string' && level.startsWith('object'))) { continue }
        objectLayers.push(layer)
    }
    /* merge base layers with sel layers */
    for (const layer of selMap.layer) {
        let level = layer.level
        if (! (layer.type == 'Background' && typeof level === 'string' &&
             level.startsWith('object'))) { continue }

        let rectLayer: sc.MapModel.MapLayer | undefined

        for (const rect of rects) {
            let { x1, y1, x2, y2, x3, y3 } = getMapLayerCords(rect, eargs.offset, eargs.selSizeRect)

            const subArray: number[][] = createSubArr2d(layer.data, x1, y1, x2, y2, x3, y3, size)

            if (!isArrEmpty2d(subArray)) {
                if (rectLayer) {
                    mergeArrays2d(rectLayer.data, subArray)
                } else {
                    layer.data = subArray
                    layer.width = size.x
                    layer.height = size.y
                    objectLayers.push(layer)
                    rectLayer = layer
                }
            }
        }
    }

    /* copy nav layers */
    const navLayers: sc.MapModel.MapLayer[] = []
    
    for (let i = 0; i < levelsLen; i++) {
        navLayers[i] = new MapLayer(size.x, size.y, `Navigation ${i}`, 'Navigation', 'media/map/pathmap-tiles.png', i, -4).fill(0)
    }

    /* get base nav layers */
    for (const layer of baseMap.layer as (sc.MapModel.MapLayer & { isBase: boolean })[]) {
        if (! (layer.type == 'Navigation')) { continue }
        const level: number = eargs.lvlChangeMap[parseInt(layer.level.toString())]
        layer.level = level
        layer.tilesetName = 'media/map/pathmap-tiles.png'
        layer.isBase = true
        navLayers[level] = layer
    }
    /* merge base layers with sel layers */
    for (const rect of rects) {
        let { x1, y1, x2, y2, x3, y3, x4, y4 } = getMapLayerCords(rect, eargs.offset, eargs.selSizeRect)
        for (const layer of navLayers as (sc.MapModel.MapLayer & { isBase: boolean })[]) {
            if (layer.isBase) {
                fillFromToArr2d(layer.data, 0, x3, y3, x4, y4)
            }
        }
        for (const layer of selMap.layer as (sc.MapModel.MapLayer & { isBase: boolean })[]) {
            if (! (layer.type == 'Navigation')) { continue }

            const level: number = eargs.lvlChangeMap[parseInt(layer.level.toString()) + eargs.levelOffset]
            const layer1 = navLayers[level]

            const subArray = createSubArr2d(layer.data, x1, y1, x2, y2, x3, y3, size)
            mergeArrays2d(layer1.data, subArray)
        }
    }
    
    return {
        lightLayer,
        collisionLayers,
        tileLayers,
        objectLayers,
        navLayers,
        size,
    }
}

export interface MapCopyOptions {
    uniqueId?: number
    uniqueSel?: Selection
    disableEntities?: boolean
    // removeCutscenes?: boolean
    makePuzzlesUnique?: boolean
}

export function copyMapRectsToMap(baseMap: sc.MapModel.Map, selMap: sc.MapModel.Map, rects: bareRect[],
    eargs1: EntityRecArgsIn, newName: string, options: MapCopyOptions): sc.MapModel.Map {
    if (! options.uniqueId) {
        options.uniqueId = generateUniqueId()
    }

    const eargs: EntityRecArgs = eargs1 as EntityRecArgs
    const { levels, masterLevel, levelOffset, lvlChangeMap } = mergeMapLevels(baseMap.levels, selMap.levels, eargs.selMasterZ)
    eargs.lvlChangeMap = lvlChangeMap
    eargs.levelOffset = levelOffset

    // if (options.uniqueSel) {
    //     let uniqueSel = options.uniqueSel
    //     const zDiff = uniqueSel.data.startPos.z - lvlChangeMap[parseInt(uniqueSel.data.startPos.level) + selLevelOffset]

    //     for (const poslvl of [uniqueSel.data.startPos, uniqueSel.data.endPos]) {
    //         poslvl.z -= zDiff
    //         poslvl.y += zDiff
    //         poslvl.level = oldToNewLevelsMap[parseInt(poslvl.level) + selLevelOffset]
    //     }
    // }
    const { lightLayer, collisionLayers, tileLayers, objectLayers, navLayers, size } = mergeMapLayers(baseMap, selMap, rects, eargs, levels.length)
    
    let entities: sc.MapModel.MapEntity[] = []
    if (! options.disableEntities) {
        entities = mergeMapEntities(baseMap.entities, selMap.entities, rects, eargs)
    }

    const allLayers: sc.MapModel.MapLayer[] = []
    let id: number = 0
    /* prevent paralaxes that have different distance from merging
       and looking weird by adding a tiny bit of moveSpeed */
    let lastLayerDistance: number = 1
    let lastLayerSpeed: Vec2 = { x: -10000000, y: -10000000 }
    const speedInc: number = 5e-10
    for (const levelLayers of tileLayers) {
        for (const layer of levelLayers) {
            if (! layer.moveSpeed) {
                layer.moveSpeed = { x: 0, y: 0 }
            }
            if (id > 0 && lastLayerDistance != layer.distance) {
                layer.moveSpeed.x += speedInc
                if (layer.moveSpeed.x == lastLayerSpeed.x &&
                    layer.moveSpeed.y == lastLayerSpeed.y) {

                    layer.moveSpeed.x += speedInc
                }
            }
            lastLayerSpeed = ig.copy(layer.moveSpeed)
            lastLayerDistance = layer.distance
            layer.id = id++
            allLayers.push(layer)
        }
    }

    /* fill down the water from layers higher
       this makes kill pits work */
    for (let i = collisionLayers.length - 1 ; i >= 1; i--) {
        const l1: sc.MapModel.MapLayer = collisionLayers[i]
        const l2: sc.MapModel.MapLayer = collisionLayers[i - 1]
        for (let y = 0; y < l1.data.length; y++) {
            for (let x = 0; x < l1.data[y].length; x++) {
                // check if is water or corner water
                const l1nv = l1.data[y][x]
                const l2nv = l2.data[y][x]

                const l1IsWater = (l1nv == 1 || (l1nv >= 3 && l1nv <= 6) || (l1nv >= 15 && l1nv <= 18) || (l1nv >= 23 && l1nv <= 24))

                if (l1IsWater && l2nv == 0) {
                    l2.data[y][x] = l1nv
                }
            }
        }
    }
    for (const layer of collisionLayers) {
        layer.id = id++
        allLayers.push(layer)
    }
    for (const layer of navLayers) {
        layer.id = id++
        allLayers.push(layer)
    }

    for (const layer of objectLayers) {
        layer.id = id++
        allLayers.push(layer)
    }
    if (lightLayer) {
        lightLayer.id = id++
        allLayers.push(lightLayer)
    }

    const map: sc.MapModel.Map = {
        name: newName,
        levels,
        mapWidth: size.x,
        mapHeight: size.y,
        masterLevel,
        attributes: baseMap.attributes,
        /* screen is not used? setting just to be safe */
        screen: { x: 0, y: 0 },
        entities,
        layer: allLayers
    }

    console.log(map)
    return map
}
