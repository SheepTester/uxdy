import buildingData from './buildings.json'
import { Location } from './locations'

export type BuildingDatum = {
  name: string
  code: string
  college: string
  location: Location
  images: string[]
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
      images
    }
  }
}
