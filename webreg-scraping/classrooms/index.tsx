/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.6'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { Day } from '../../terms/day.ts'
import { getTerm, termCode } from '../../terms/index.ts'
import {
  northeast,
  southwest,
  PADDING,
  mapPosition
} from './building-locations.ts'
import { Building as BuildingComponent } from './components/Building.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { RoomList } from './components/RoomList.tsx'
import { Building, coursesFromFile, coursesToClassrooms } from './from-file.ts'
import { useNow } from './now.ts'

function currentQuarter () {
  const { year, season } = getTerm(Day.today())
  return termCode(year, season).toLowerCase()
}

function App () {
  const [quarter, setQuarter] = useState<string | null>(() => null)
  const [buildings, setBuildings] = useState<Building[] | null>(null)
  const [viewing, setViewing] = useState<Building | null>(null)
  const now = useNow()

  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)

  useEffect(() => {
    fetch(`./classrooms-${quarter ?? currentQuarter()}.txt`)
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
            width: `${northeast.x - southwest.x + PADDING * 2}px`,
            height: `${southwest.y - northeast.y + PADDING * 2}px`,
            backgroundSize: `${mapPosition.width}px`,
            backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`
          }}
        />
        {scrollWrapper &&
          buildings.map(building => (
            <BuildingComponent
              key={building.name}
              now={quarter ? null : now}
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
            now={quarter ? null : now}
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
