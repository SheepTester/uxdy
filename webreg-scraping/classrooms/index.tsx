/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import {
  maxLat,
  minLat,
  maxLong,
  minLong,
  PADDING,
  X_SCALE,
  Y_SCALE
} from './building-locations.ts'
import { Building as BuildingComponent } from './components/Building.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { RoomList } from './components/RoomList.tsx'
import { Building, coursesFromFile, coursesToClassrooms } from './from-file.ts'
import { useNow } from './now.ts'

function App () {
  const [quarter, setQuarter] = useState('s222')
  const [buildings, setBuildings] = useState<Building[] | null>(null)
  const [viewing, setViewing] = useState<Building | null>(null)
  const now = useNow()

  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)

  useEffect(() => {
    fetch(`./classrooms-${quarter}.txt`)
      .then(r => r.text())
      .then(coursesFromFile)
      .then(coursesToClassrooms)
      .then(setBuildings)
  }, [quarter])

  return buildings ? (
    <>
      <div class='buildings' ref={scrollWrapper ? undefined : setScrollWrapper}>
        <div
          class='scroll-area'
          style={{
            height: `${(maxLat - minLat) * Y_SCALE + PADDING * 2}px`,
            width: `${(maxLong - minLong) * X_SCALE + PADDING * 2}px`
          }}
        />
        {scrollWrapper &&
          buildings.map(building => (
            <BuildingComponent
              key={building.name}
              now={now}
              building={building}
              onSelect={setViewing}
              scrollWrapper={scrollWrapper}
              selected={building === viewing}
            />
          ))}
      </div>
      <div class={`panel ${viewing ? 'has-rooms' : 'has-info'}`}>
        {viewing ? (
          <RoomList
            // Force state to reset on prop change
            // https://stackoverflow.com/a/53313430
            key={viewing.name}
            now={now}
            building={viewing}
            onClose={() => setViewing(null)}
            class='panel-contents'
          />
        ) : (
          <InfoPanel
            quarter={quarter}
            onQuarter={setQuarter}
            class='panel-contents'
          />
        )}
      </div>
    </>
  ) : (
    <p>Loading...</p>
  )
}

render(<App />, document.getElementById('root')!)
