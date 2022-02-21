/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import {
  maxLat,
  maxLong,
  minLat,
  minLong,
  SCALE
} from './building-locations.ts'
import { Building as BuildingComponent } from './components/Building.tsx'
import { RoomList } from './components/RoomList.tsx'
import { Building, coursesFromFile, coursesToClassrooms } from './from-file.ts'
import { now as getNow } from './now.ts'

function App () {
  const [buildings, setBuildings] = useState<Building[] | null>(null)
  const [viewing, setViewing] = useState<Building | null>(null)
  const [now, setNow] = useState(getNow())

  useEffect(() => {
    fetch('./classrooms.txt')
      .then(r => r.text())
      .then(coursesFromFile)
      .then(coursesToClassrooms)
      .then(setBuildings)
  }, [])

  return buildings ? (
    <>
      <div
        class='buildings'
        style={{
          height: `${(maxLat - minLat) * SCALE}px`,
          width: `${(maxLong - minLong) * SCALE}px`
        }}
      >
        {buildings.map(building => (
          <BuildingComponent
            key={building.name}
            now={now}
            building={building}
            onSelect={setViewing}
          />
        ))}
      </div>
      {viewing && (
        <RoomList
          now={now}
          building={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  ) : (
    <p>Loading...</p>
  )
}

render(<App />, document.getElementById('root')!)
