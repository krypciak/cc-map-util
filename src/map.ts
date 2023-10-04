import { emptyArr2d } from "./rect"

const tilesize: number = 16

export enum Coll {
    None = 0,
    Hole = 1,
    Wall = 2,
    Floor = 3,
}
export type Tileset = 'media/map/collisiontiles-16x16.png' | 'media/map/pathmap-tiles.png' | 'media/map/lightmap-tiles.png'
                    | 'media/map/dungeon-shadow.png' | 'media/map/cold-dng.png' | 'media/map/rhombus-dungeon2.png'

export class MapLayer implements sc.MapModel.MapLayer {
    visible: number = 1
    repeat: boolean = false
    distance: number = 1
    yDistance: number = 0
    tilesize: number = tilesize
    moveSpeed: Vec2 = { x: 0, y: 0 }
    data: number[][]
    lighter: boolean = false

    constructor(public width: number, public height: number, public name: string,
        public type: sc.MapModel.MapLayerType, public tilesetName: string, 
        public level: sc.MapModel.MapLayerLevelType, public id: number, data?: number[][]) {

        this.data = data ?? []
    }

    fill(tile: number): this {
        this.data = emptyArr2d({ x: this.width, y: this.height }, tile)
        return this
    }

    toJSON() { return this as sc.MapModel.MapLayer }

    static convertArray(arr: sc.MapModel.MapLayer[]): MapLayer[] {
        return arr.map((layer) => new MapLayer(layer.width, layer.height, layer.name, layer.type, layer.tilesetName, layer.level, layer.id, layer.data))
    }
}

const mapNameToMapDisplayName: Map<string, string> = new Map<string, string>()

export async function getMapDisplayName(map: sc.MapModel.Map): Promise<string> {
    return new Promise<string>(async (resolve) => {
        const mapName = map.name.split('.').join('/')
        if (mapNameToMapDisplayName.has(mapName)) {
            resolve(mapNameToMapDisplayName.get(mapName) ?? 'maploadingerror')
            return
        }
        const areaName: string = map.attributes.area
        const area: sc.AreaLoadable = await loadArea(areaName)

        for (const floor of area.data.floors) {
            for (const map of floor.maps) {
                const displayName = map.name.en_US!
                mapNameToMapDisplayName.set(map.path.split('.').join('/'), displayName)
            }
        }
        resolve(getMapDisplayName(map))
    })
}

export async function loadArea(areaName: string): Promise<sc.AreaLoadable> {
    return new Promise((resolve) => {
        const area: sc.AreaLoadable = new sc.AreaLoadable(areaName)
        area.load(() => {
            resolve(area)
        })
    })
}
