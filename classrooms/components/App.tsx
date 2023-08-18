/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { getTerm, termName } from '../../terms/index.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'
import { buildings } from '../lib/buildings.ts'
import {
  TermBuildings,
  coursesToClassrooms
} from '../lib/coursesToClassrooms.ts'
import { northeast, southwest, PADDING, mapPosition } from '../lib/locations.ts'
import { useNow } from '../lib/now.ts'
import { TermCache } from '../lib/TermCache.ts'
import { BuildingPanel } from './building/BuildingPanel.tsx'
import { BuildingButton } from './BuildingButton.tsx'
import { DateTimeButton } from './date-time/DateTimeButton.tsx'
import { DateTimePanel } from './date-time/DateTimePanel.tsx'
import { SearchIcon } from './icons/SearchIcon.tsx'

export function App () {
  const terms = useRef(new TermCache())
  const [showDate, setShowDate] = useState(false)
  const [customDate, setCustomDate] = useState<Day | null>(null)
  const [customTime, setCustomTime] = useState<Time | null>(null)
  const [termBuildings, setTermBuildings] = useState<TermBuildings>({})
  const [viewing, setViewing] = useState<string | null>(null)
  const [lastViewing, setLastViewing] = useState('CENTR')
  const [scrollWrapper, setScrollWrapper] = useState<HTMLElement | null>(null)
  const [notice, setNotice] = useState('Loading...')
  const [noticeVisible, setNoticeVisible] = useState(true)
  const { date: today, time: realTime } = useNow()
  const date = customDate ?? today
  const time = customTime ?? realTime

  function handleDate (date: Day, init = false) {
    const { year, season, current, finals } = getTerm(date)
    terms.current.getTerms({
      requests: [
        current ? { year, quarter: season } : null,
        season === 'S1' || season === 'S2' || (season === 'FA' && !current)
          ? { year, quarter: 'S3' }
          : null
      ],
      onNoRequest: () => {
        setNotice(
          season === 'WI'
            ? 'Winter break.'
            : season === 'SP'
            ? 'Spring break.'
            : 'Summer break.'
        )
        if (!init) {
          setNoticeVisible(true)
          // If the overlay notice is showing, then de-select the current
          // building.
          setViewing(viewing => {
            if (viewing) {
              setLastViewing(viewing)
            }
            return null
          })
        }
        // Have the date selector open for the user to select another day
        setShowDate(true)
      },
      onStartFetch: terms => {
        // TODO: Display terms loading
        if (!init) {
          setNoticeVisible(true)
          setNotice('Loading...')
        }
      },
      onError: errors => {
        // TODO: This error message could be better
        setNotice(
          errors
            .map(({ type, request: { year, quarter } }) =>
              type === 'offline'
                ? `I couldn't load schedules for ${termName(
                    year,
                    quarter
                  )}. Is ResNet failing you again?`
                : `Schedules aren't available for ${termName(year, quarter)}.`
            )
            .join(' ')
        )
        setViewing(viewing => {
          if (viewing) {
            setLastViewing(viewing)
          }
          return null
        })
        setShowDate(true)
        setNoticeVisible(true)
      },
      onLoad: (results, errors) => {
        // TODO: Show errors if any in a corner
        const courses = results.flatMap(result => result.result.courses)
        setTermBuildings(
          coursesToClassrooms(courses, {
            monday: date.monday,
            // Summer sessions' finals week overlaps with classes, it seems
            // like?
            finals: finals && season !== 'S1' && season !== 'S2'
          })
        )
        setNoticeVisible(false)
      }
    })
  }
  // TEMP?
  useEffect(() => {
    handleDate(today, true)
  }, [])

  return (
    <>
      <label class={`search-wrapper ${noticeVisible ? 'hide-search' : ''}`}>
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
        onDate={date => {
          setCustomDate(date)
          handleDate(date)
        }}
        time={time}
        onTime={setCustomTime}
        useNow={customDate === null && customTime === null}
        onUseNow={useNow => {
          if (useNow) {
            setCustomDate(null)
            setCustomTime(null)
          } else {
            setCustomDate(today)
            setCustomTime(realTime)
            handleDate(today)
          }
        }}
        visible={showDate}
        class={`${viewing ? 'date-time-panel-bottom-panel' : ''} ${
          noticeVisible ? 'date-time-panel-notice-visible' : ''
        }`}
        onClose={() => setShowDate(false)}
      />
      <div class='buildings-wrapper'>
        <p
          class={`notice ${noticeVisible ? 'notice-visible' : ''} ${
            showDate ? 'notice-date-open' : ''
          }`}
        >
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
          onClose={() => {
            setViewing(viewing => {
              if (viewing) {
                setLastViewing(viewing)
              }
              return null
            })
          }}
          visible={!!viewing}
          rightPanelOpen={showDate}
        />
      )}
    </>
  )
}
