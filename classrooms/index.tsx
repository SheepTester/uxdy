/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm } from '../terms/index.ts'
import { Day } from '../util/day.ts'
import {
  northeast,
  southwest,
  PADDING,
  mapPosition
} from './building-locations.ts'
import { Building as BuildingComponent } from './components/Building.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { QuarterSelector } from './components/QuarterSelector.tsx'
import { RoomList } from './components/RoomList.tsx'
import { Building, coursesToClassrooms } from './from-file.ts'
import { useNow } from './now.ts'
import { QuarterCache } from './quarter-cache.ts'

function App () {
  const quarters = useRef(new QuarterCache())
  const [customDate, setCustomDate] = useState<Day | null>(
    Day.parse('2023-05-03')
  )
  const [buildings, setBuildings] = useState<Building[] | null>(null)
  const [viewing, setViewing] = useState<Building | null>(null)
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const now = useNow()

  const date = customDate ?? Day.today()

  useEffect(() => {
    const { year, season, current, finals } = getTerm(date)
    if (current) {
      quarters.current
        .get(year, season)
        .then(courses =>
          coursesToClassrooms(courses, {
            // .add(-1) is so Sunday is mapped to the previous not next Monday
            monday: date.add(-1).sunday.add(1),
            finals
          })
        )
        .then(setBuildings)
    } else {
      setBuildings([])
    }
  }, [+date])

  return buildings ? (
    <>
      {/* <QuarterSelector
        quarter={quarter}
        onQuarter={setQuarter}
        quarters={{
          WI23: 'Winter 2023',
          SP23: 'Spring 2023',
          S123: 'Summer Session I 2023',
          S223: 'Summer Session II 2023',
          FA23: 'Fall 2023'
        }}
      /> */}
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
              now={customDate ? null : now}
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
            now={customDate ? null : now}
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
