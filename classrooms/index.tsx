/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { getTerm, termName } from '../terms/index.ts'
import { Day } from '../util/Day.ts'
import { Time } from '../util/Time.ts'
import { useAsyncEffect } from '../util/useAsyncEffect.ts'
import { BuildingButton } from './components/BuildingButton.tsx'
import { DateTimeButton } from './components/date-time/DateTimeButton.tsx'
import { DateTimePanel } from './components/date-time/DateTimePanel.tsx'
import { InfoPanel } from './components/InfoPanel.tsx'
import { RoomList } from './components/RoomList.tsx'
import {
  northeast,
  southwest,
  PADDING,
  mapPosition
} from './lib/building-locations.ts'
import {
  coursesToClassrooms,
  defaultBuildings
} from './lib/coursesToClassrooms.ts'
import { Now, useNow } from './lib/now.ts'
import { QuarterCache } from './lib/QuarterCache.ts'

function App () {
  const quarters = useRef(new QuarterCache())
  const [showDate, setShowDate] = useState(false)
  const [date, setDate] = useState(Day.today())
  const [customTime, setCustomTime] = useState<Time | null>(null)
  const [scrollToDate, setScrollToDate] = useState<number | null>(1)
  const [buildings, setBuildings] = useState(defaultBuildings)
  const [viewing, setViewing] = useState<string | null>(null)
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const [notice, setNotice] = useState('Loading...')
  const [noticeVisible, setNoticeVisible] = useState(true)
  const { time: realTime } = useNow()
  // TODO: Use Day + Time instead of Now in the components that currently use
  // it, since they're now independent
  const currentTime: Now = { day: date.day, time: customTime ?? realTime }

  useAsyncEffect(async () => {
    const { year, season, current, finals } = getTerm(date)
    setNoticeVisible(true)
    if (current) {
      const promise = quarters.current.get(year, season)
      const needToFetch = await Promise.race([
        promise.then(() => false).catch(() => false),
        // Probably for event loop reasons, I need to add some dummy .then's so
        // that it doesn't resolve faster than an already fulfilled
        // .then(.catch)
        Promise.resolve()
          .then(() => {})
          .then(() => true)
      ])
      if (needToFetch) {
        setNotice('Loading...')
      }
      try {
        const courses = await promise
        if (courses) {
          setBuildings(
            coursesToClassrooms(courses, { monday: date.monday, finals })
          )
          setNoticeVisible(false)
          return
        } else {
          setNotice(`Schedules aren't available for ${termName(year, season)}.`)
        }
      } catch (error) {
        console.error(error)
        setNotice(
          needToFetch
            ? `I couldn't load schedules for ${termName(
                year,
                season
              )}. Is ResNet failing you again?`
            : `For whatever reason, I couldn't load the schedules for ${termName(
                year,
                season
              )}. Something weird happened. If you're a CSE major, can you check the console to see what's wrong?`
        )
      }
    } else {
      setNotice(
        season === 'WI'
          ? 'Winter break.'
          : season === 'SP'
          ? 'Spring break.'
          : 'Summer break.'
      )
    }
    setViewing(null)
  }, [date.id])

  return (
    <>
      <DateTimeButton
        date={date}
        time={currentTime.time}
        onClick={() => setShowDate(true)}
        disabled={showDate}
      />
      <DateTimePanel
        date={date}
        onDate={(date, scrollToDate) => {
          setDate(date)
          if (scrollToDate) {
            // Force useEffect to run again, if necessary. Start counting from 2
            // to reserve `scrollToDate = 1` to mean "app just loaded"
            setScrollToDate(scrollToDate => (scrollToDate ?? 1) + 1)
          } else {
            setScrollToDate(null)
          }
        }}
        scrollToDate={scrollToDate}
        realTime={realTime}
        customTime={customTime}
        onCustomTime={setCustomTime}
        visible={showDate}
        onClose={() => setShowDate(false)}
      />
      <div class='buildings-wrapper'>
        <p class={`notice ${noticeVisible ? 'notice-visible' : ''}`}>
          <span class='notice-text'>{notice}</span>
        </p>
        <div
          class='buildings'
          ref={scrollWrapper ? undefined : setScrollWrapper}
        >
          <div
            class='scroll-area'
            style={{
              width: `${northeast.x - southwest.x + PADDING * 2}px`,
              height: `${southwest.y - northeast.y + PADDING * 2}px`,
              backgroundSize: `${mapPosition.width}px`,
              backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`
            }}
          />
          {buildings &&
            scrollWrapper &&
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
      </div>
      {buildings && (
        <RoomList
          now={currentTime}
          building={viewing ? buildings[viewing] : null}
          onClose={() => setViewing(null)}
          visible={!!viewing}
          rightPanelOpen={showDate}
        />
      )}
    </>
  )
}

render(<App />, document.getElementById('root')!)
