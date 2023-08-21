import { buildings } from './buildings.ts'

export type Location = [latitude: number, longitude: number]

// Tile bounds used to generate the map image
const TILE_LEFT = -6
const TILE_RIGHT = 5
const TILE_TOP = 4
/** maps.ucsd.edu zoom level used for the map image. */
export const ZOOM = 17
/** Size of each map tile */
const TILE_SIZE = 256
/** Zoom into the map on this web page */
export const MAP_ZOOM = 1.5
const SCALE = 2 ** (7 + ZOOM) * MAP_ZOOM
export function latLongToPixel ([latitude, longitude]: Location): {
  x: number
  y: number
} {
  return {
    x: SCALE * (longitude / 180 + 1),
    y:
      -SCALE *
      (Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) / Math.PI +
        1)
  }
}

const coords = Object.values(buildings).map(({ location }) => location)
function getExtremeCoord (index: 0 | 1, max: boolean) {
  return coords.reduce(
    (acc, curr) => (max ? Math.max : Math.min)(acc, curr[index]),
    max ? -Infinity : Infinity
  )
}
export const southwest = latLongToPixel([
  getExtremeCoord(0, false),
  getExtremeCoord(1, false)
])
export const northeast = latLongToPixel([
  getExtremeCoord(0, true),
  getExtremeCoord(1, true)
])
/** In px. */
export const PADDING = {
  top: 60,
  horizontal: 50,
  bottom: 168
}

const MAP_TILE_SIZE = TILE_SIZE * MAP_ZOOM
/** Center of map. */
const center = latLongToPixel([32.877341347399, -117.23531663418])
export const mapPosition = {
  x:
    Math.floor(center.x / MAP_TILE_SIZE + TILE_LEFT) * MAP_TILE_SIZE -
    (southwest.x - PADDING.horizontal),
  y:
    Math.floor(center.y / MAP_TILE_SIZE - TILE_TOP) * MAP_TILE_SIZE -
    (northeast.y - PADDING.top),
  width: (TILE_RIGHT - TILE_LEFT + 1) * MAP_TILE_SIZE
}
