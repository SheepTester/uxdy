/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { getHolidays } from '../../terms/holidays.ts'
import { getTerm, Season, termName } from '../../terms/index.ts'
import { Day } from '../../util/Day.ts'
import { Time } from '../../util/Time.ts'
import { useLast } from '../../util/useLast.ts'
import { buildings } from '../lib/buildings.ts'
import {
  TermBuildings,
  coursesToClassrooms
} from '../lib/coursesToClassrooms.ts'
import { northeast, southwest, PADDING, mapPosition } from '../lib/locations.ts'
import { now } from '../lib/now.ts'
import { Term, TermCache, TermError } from '../lib/TermCache.ts'
import { BuildingPanel } from './building/BuildingPanel.tsx'
import { BuildingButton } from './BuildingButton.tsx'
import { DateTimeButton } from './date-time/DateTimeButton.tsx'
import { DateTimePanel } from './date-time/DateTimePanel.tsx'
import { SearchBar } from './search/SearchBar.tsx'
import { TermStatus } from './TermStatus.tsx'

/**
 * Represents the state of the app:
 * - If the object is `null`, then the app is fetching classroom data.
 * - If `buildings` is defined, the object should not be empty. Show the
 *   classrooms, and display the errors in a corner if any.
 * - If there are no classes, show the errors in an overlay message.
 * - If there are no classes and no errors, then show that school is on break.
 */
type AppState = {
  /** If undefined, then that means there are no classes for this time. */
  buildings?: TermBuildings
  status: TermStatus[]
  errors: TermError[]
  season: Season
  holiday?: string
}

/**
 * Displays errors. This won't mention if a term is unavailable if the other
 * term failed to load.
 * @param errors - Guaranteed to be nonempty.
 */
function displayError (errors: TermError[]): string {
  const offlineErrors = errors
    .filter(({ type }) => type === 'offline')
    .map(({ request: { year, quarter } }) => termName(year, quarter))
  if (offlineErrors.length > 0) {
    return `I couldn't load schedules for ${offlineErrors.join(
      ' and '
    )}. Is ResNet failing you again?`
  } else {
    return `Schedules aren't available for ${errors
      .map(({ request: { year, quarter } }) => termName(year, quarter))
      .join(' and ')}.`
  }
}

export function App () {
  const [realTime, setRealTime] = useState(true)
  const [date, setDate] = useState<Day>(() => now().date)
  const [time, setTime] = useState<Time>(() => now().time)
  useEffect(() => {
    if (realTime) {
      const intervalId = setInterval(() => {
        const { date, time } = now()
        // Avoid unnecessary rerenders by returning original object if they have
        // the same values
        setTime(oldTime => (+oldTime === +time ? oldTime : time))
        setDate(oldDate => {
          if (+oldDate === +date) {
            return oldDate
          } else {
            handleDate(date)
            return date
          }
        })
      }, 1000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [realTime])

  const termCache = useRef(new TermCache())
  const [state, setState] = useState<AppState | null>(null)

  // TODO: Show errors if any in a corner
  const noticeVisible = !state?.buildings
  const notice = useLast(
    '',
    state === null
      ? 'Loading...'
      : state.buildings
      ? null
      : state && state.errors.length > 0
      ? displayError(state.errors)
      : state.holiday
      ? `${state.holiday}!`
      : state.season === 'WI'
      ? 'Winter break.'
      : state.season === 'SP'
      ? 'Spring break.'
      : 'Summer break.'
  )

  const [showDatePanel, setShowDatePanel] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const building = useLast('CENTR', viewing)
  const [scrollTo, setScrollTo] = useState({ building: 'CENTR', init: true })

  async function handleDate (date: Day) {
    const { year, season, current, finals } = getTerm(date)
    const requests = [
      current ? { year, quarter: season } : null,
      season === 'S1' || season === 'S2' || (season === 'FA' && !current)
        ? { year, quarter: 'S3' }
        : null
    ]
    const holiday = getHolidays(date.year)[date.id]
    if (holiday || requests.every(request => request === null)) {
      // Have the date selector open for the user to select another day
      setState({ errors: [], status: [], season, holiday })
      setViewing(null)
      setShowDatePanel(true)
      return
    }
    const terms = requests.filter(
      (request): request is Term => request !== null
    )
    const maybePromise = termCache.current.requestTerms(terms)
    if (maybePromise instanceof Promise) {
      // Show "Loading..."
      setState(null)
    }
    const { successes, errors } =
      maybePromise instanceof Promise ? await maybePromise : maybePromise
    const courses = successes.flatMap(result => result.result.courses)
    // Summer sessions' finals week overlaps with classes, it seems like?
    const finalsWeek = finals && season !== 'S1' && season !== 'S2'
    const classrooms = coursesToClassrooms(courses, {
      monday: date.monday,
      finals: finalsWeek
    })
    for (const building of Object.keys(classrooms)) {
      if (!buildings[building]) {
        console.warn(`${building} does not exist.`)
      }
    }
    // For future quarters, all finals are TBA, but that doesn't mean the week
    // is on break.
    const empty =
      Object.keys(classrooms).length === 0 &&
      !(finalsWeek && courses.length > 0)
    setState({
      buildings: empty ? undefined : classrooms,
      status: [
        ...successes.map(
          (result): TermStatus => [result.request, result.result.scraped]
        ),
        ...errors.map((error): TermStatus => [error.request, error.type])
      ],
      errors,
      season
    })
    if (empty) {
      setViewing(null)
      setShowDatePanel(true)
    }
  }
  useEffect(() => {
    handleDate(date)
  }, [])

  return (
    <>
      <SearchBar
        termCache={termCache.current}
        terms={state?.status.map(([term]) => term) ?? []}
        buildings={state?.buildings ? Object.keys(state?.buildings) : []}
        onBuilding={building => {
          setScrollTo({ building, init: false })
          setViewing(building)
        }}
        visible={!noticeVisible}
      />
      <DateTimeButton
        date={date}
        time={time}
        onClick={() => setShowDatePanel(true)}
        bottomPanelOpen={!!viewing}
        disabled={showDatePanel}
      />
      <DateTimePanel
        date={date}
        onDate={date => {
          setRealTime(false)
          setDate(date)
          handleDate(date)
        }}
        time={time}
        onTime={time => {
          setRealTime(false)
          setTime(time)
        }}
        useNow={realTime}
        onUseNow={useNow => {
          if (useNow) {
            const { date, time } = now()
            setRealTime(true)
            setDate(date)
            setTime(time)
            handleDate(date)
          } else {
            setRealTime(false)
          }
        }}
        visible={showDatePanel}
        class={`${viewing ? 'date-time-panel-bottom-panel' : ''} ${
          noticeVisible ? 'date-time-panel-notice-visible' : ''
        }`}
        onClose={() => setShowDatePanel(false)}
      />
      <TermStatus status={state?.status} visible={!noticeVisible} />
      <div class='buildings-wrapper'>
        <p
          class={`notice ${noticeVisible ? 'notice-visible' : ''} ${
            showDatePanel ? 'notice-date-open' : ''
          }`}
        >
          <span class='notice-text'>{notice}</span>
        </p>
        <div class='buildings'>
          <div
            class='scroll-area'
            style={{
              width: `${northeast.x - southwest.x + PADDING.horizontal * 2}px`,
              height: `${
                southwest.y - northeast.y + PADDING.top + PADDING.bottom
              }px`,
              backgroundSize: `${mapPosition.width}px`,
              backgroundPosition: `${mapPosition.x}px ${mapPosition.y}px`
            }}
          />
          {Object.values(buildings).map(building => (
            <BuildingButton
              key={building.code}
              weekday={date.day}
              time={time}
              building={building}
              rooms={Object.values(state?.buildings?.[building.code] ?? {})}
              onSelect={setViewing}
              selected={building.code === viewing}
              scrollTarget={
                building.code === scrollTo.building ? scrollTo : null
              }
              visible={!!state?.buildings && building.code in state.buildings}
            />
          ))}
        </div>
      </div>
      <BuildingPanel
        weekday={date.day}
        time={time}
        building={buildings[building]}
        rooms={state?.buildings?.[building] ?? {}}
        onClose={() => setViewing(null)}
        visible={viewing !== null}
        rightPanelOpen={showDatePanel}
      />
    </>
  )
}
