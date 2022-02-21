/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { Building as BuildingComponent } from './components/Building.tsx'
import { Building, coursesFromFile, coursesToClassrooms } from './from-file.ts'

function App () {
  const [buildings, setBuildings] = useState<Building[] | null>(null)

  useEffect(() => {
    fetch('./classrooms.txt')
      .then(r => r.text())
      .then(coursesFromFile)
      .then(coursesToClassrooms)
      .then(setBuildings)
  }, [])

  return buildings ? (
    <div className='buildings'>
      {buildings.map(building => (
        <BuildingComponent building={building} key={building.name} />
      ))}
    </div>
  ) : (
    <p>Loading...</p>
  )
}

render(<App />, document.getElementById('root')!)
