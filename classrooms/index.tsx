/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm } from '../terms/index.ts'
import { Day } from '../util/Day.ts'
import { Time } from '../util/Time.ts'
import {
  northeast,
  southwest,
  PADDING,
  mapPosition
} from './building-locations.ts'
import { Building as BuildingComponent } from './components/Building.tsx'
import { Calendar } from './components/date-time/Calendar.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { RoomList } from './components/RoomList.tsx'
import { Building, coursesToClassrooms } from './from-file.ts'
import { useNow } from './now.ts'
import { QuarterCache } from './quarter-cache.ts'

function App () {
  const quarters = useRef(new QuarterCache())
  const [date, setDate] = useState(Day.parse('2023-05-03')!) // TEMP
  const [customTime, setCustomTime] = useState<Time | null>(null)
  const [buildings, setBuildings] = useState<Building[] | null>(null)
  const [viewing, setViewing] = useState<Building | null>(null)
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const now = useNow()

  const currentTime = customTime ? { day: date.day, time: customTime } : now

  useEffect(() => {
    const { year, season, current, finals } = getTerm(date)
    if (current) {
      quarters.current
        .get(year, season)
        .then(courses =>
          coursesToClassrooms(courses, { monday: date.monday, finals })
        )
        .then(setBuildings)
    } else {
      setBuildings([])
    }
  }, [+date])

  return buildings ? (
    <>
      <Calendar />
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
              now={currentTime}
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
            now={currentTime}
            building={viewing}
            onClose={() => setViewing(null)}
            class='panel-contents'
          />
        ) : (
          <InfoPanel class='panel-contents' />
        )}
      </div>
    </>
  ) : (
    <p>Loading...</p>
  )
}

render(<App />, document.getElementById('root')!)
