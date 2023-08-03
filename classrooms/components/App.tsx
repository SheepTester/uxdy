/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm, termName } from '../../terms/index.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'
import { useAsyncEffect } from '../../util/useAsyncEffect.ts'
import { buildings } from '../lib/buildings.ts'
import {
  TermBuildings,
  coursesToClassrooms
} from '../lib/coursesToClassrooms.ts'
import { northeast, southwest, PADDING, mapPosition } from '../lib/locations.ts'
import { useNow } from '../lib/now.ts'
import { QuarterCache } from '../lib/QuarterCache.ts'
import { BuildingPanel } from './building/BuildingPanel.tsx'
import { BuildingButton } from './BuildingButton.tsx'
import { DateTimeButton } from './date-time/DateTimeButton.tsx'
import { DateTimePanel } from './date-time/DateTimePanel.tsx'
import { SearchIcon } from './icons/SearchIcon.tsx'

export function App () {
  const quarters = useRef(new QuarterCache())
  const [showDate, setShowDate] = useState(false)
  const [customDate, setCustomDate] = useState<Day | null>(null)
  const [customTime, setCustomTime] = useState<Time | null>(null)
  const [scrollToDate, setScrollToDate] = useState<number | null>(1)
  const [termBuildings, setTermBuildings] = useState<TermBuildings>({})
  const [viewing, setViewing] = useState<string | null>(null)
  const [lastViewing, setLastViewing] = useState('CENTR')
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const [notice, setNotice] = useState('Loading...')
  const [noticeVisible, setNoticeVisible] = useState(true)
  const { date: today, time: realTime } = useNow()
  const date = customDate ?? today
  const time = customTime ?? realTime

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
        const result = await promise
        if (result) {
          setTermBuildings(
            coursesToClassrooms(result.courses, {
              monday: date.monday,
              // Summer sessions' finals week overlaps with classes, it seems
              // like?
              finals: finals && season !== 'S1' && season !== 'S2'
            })
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

  // Keep last building visible when closing room list
  useEffect(() => {
    if (viewing) {
      setLastViewing(viewing)
    }
  }, [viewing])

  return (
    <>
      <label class='search-wrapper'>
        <SearchIcon />
        <input
          type='search'
          placeholder='Coming soon...'
          class='search-input'
        />
      </label>
      <DateTimeButton
        date={date}
        time={time}
        onClick={() => setShowDate(true)}
        bottomPanelOpen={!!viewing}
        disabled={showDate}
      />
      <DateTimePanel
        date={date}
        onDate={(date, scrollToDate) => {
          setCustomDate(date)
          if (scrollToDate) {
            // Force useEffect to run again, if necessary. Start counting from 2
            // to reserve `scrollToDate = 1` to mean "app just loaded"
            setScrollToDate(scrollToDate => (scrollToDate ?? 1) + 1)
          } else {
            setScrollToDate(null)
          }
        }}
        scrollToDate={scrollToDate}
        time={time}
        onTime={setCustomTime}
        useNow={customDate === null && customTime === null}
        onUseNow={useNow => {
          if (useNow) {
            setCustomDate(null)
            setCustomTime(null)
            setScrollToDate(scrollToDate => (scrollToDate ?? 1) + 1)
          } else {
            setCustomDate(today)
            setCustomTime(realTime)
          }
        }}
        visible={showDate}
        bottomPanelOpen={!!viewing}
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
          {scrollWrapper &&
            Object.values(buildings).map(building => (
              <BuildingButton
                key={building.code}
                weekday={date.day}
                time={time}
                building={building}
                rooms={Object.values(termBuildings[building.code] ?? {})}
                onSelect={setViewing}
                scrollWrapper={scrollWrapper}
                selected={building.code === viewing}
                visible={building.code in termBuildings}
              />
            ))}
        </div>
      </div>
      {buildings && (
        <BuildingPanel
          weekday={date.day}
          time={time}
          building={buildings[viewing || lastViewing]}
          rooms={termBuildings[viewing || lastViewing] ?? {}}
          onClose={() => setViewing(null)}
          visible={!!viewing}
          rightPanelOpen={showDate}
        />
      )}
    </>
  )
}
