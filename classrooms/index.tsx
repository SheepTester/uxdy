/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm } from '../terms/index.ts'
import { Day } from '../util/Day.ts'
import { Time } from '../util/Time.ts'
import { useAsyncEffect } from '../util/useAsyncEffect.ts'
import { BuildingButton } from './components/BuildingButton.tsx'
import { Calendar } from './components/date-time/Calendar.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { RoomList } from './components/RoomList.tsx'
import {
  northeast,
  southwest,
  PADDING,
  mapPosition
} from './lib/building-locations.ts'
import { Building } from './lib/coursesFromFile.ts'
import {
  Buildings,
  coursesToClassrooms,
  defaultBuildings
} from './lib/coursesToClassrooms.ts'
import { useNow } from './lib/now.ts'
import { QuarterCache } from './lib/QuarterCache.ts'

function App () {
  const quarters = useRef(new QuarterCache())
  const [date, setDate] = useState(Day.today()) // TEMP
  const [customTime, setCustomTime] = useState<Time | null>(null)
  const [buildings, setBuildings] = useState<Buildings | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const now = useNow()

  const currentTime = customTime ? { day: date.day, time: customTime } : now

  useAsyncEffect(async () => {
    const { year, season, current, finals } = getTerm(date)
    if (current) {
      const courses = await quarters.current.get(year, season)
      if (courses) {
        setBuildings(
          coursesToClassrooms(courses, { monday: date.monday, finals })
        )
        return
      }
    }
    setBuildings(defaultBuildings())
  }, [date.id])

  return buildings ? (
    <>
      <Calendar date={date} onDate={setDate} />
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
          Object.values(buildings).map(building => (
            <BuildingButton
              key={building.name}
              now={currentTime}
              building={building}
              onSelect={setViewing}
              scrollWrapper={scrollWrapper}
              selected={building.name === viewing}
            />
          ))}
      </div>
      <div class={`panel ${viewing ? 'has-rooms' : 'has-info'}`}>
        {viewing ? (
          <RoomList
            // Force state to reset on prop change
            // https://stackoverflow.com/a/53313430
            key={viewing}
            now={currentTime}
            building={buildings[viewing]}
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
