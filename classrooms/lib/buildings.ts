import buildingData from './buildings.json' assert { type: 'json' }
import { Location } from './locations.ts'

export type BuildingDatum = {
  name: string
  code: string
  college: string
  location: Location
  images: { url: string; size: [number, number] }[]
}
export const buildings: Record<string, BuildingDatum> = {}
for (const [college, collegeBldgs] of Object.entries(buildingData.colleges)) {
  // Sort buildings within each college by northernmost building (greatest
  // latitude) first (so the tab order makes a bit of sense)
  for (const [code, { location, name, images }] of Object.entries(
    collegeBldgs
  ).sort((a, b) => b[1].location[0] - a[1].location[0])) {
    buildings[code] = {
      name,
      code,
      college,
      location: [location[0], location[1]],
      images: images.map(({ url, size }) => ({ url, size: [size[0], size[1]] }))
    }
  }
}
