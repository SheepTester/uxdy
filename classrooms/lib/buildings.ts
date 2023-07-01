import buildingData from './buildings.json' assert { type: 'json' }
import { Location } from './locations.ts'

type BuildingDatum = {
  name: string
  code: string
  college: string
  location: Location
  images: string[]
}
export const buildings: Record<string, BuildingDatum> = {}
for (const [college, collegeBldgs] of Object.entries(buildingData.colleges)) {
  for (const [code, { location, name, images }] of Object.entries(
    collegeBldgs
  )) {
    buildings[code] = {
      name,
      code,
      college,
      location: [location[0], location[1]],
      images
    }
  }
}
