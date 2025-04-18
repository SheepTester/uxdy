/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { Course } from '../../scheduleofclasses/group-sections.ts'
import { getHolidays } from '../../terms/holidays.ts'
import {
  CurrentTerm,
  getTerm,
  Season,
  termCode,
  termName
} from '../../terms/index.ts'
import { Day } from '../../util/Day.ts'
import { useLast } from '../../util/useLast.ts'
import { buildings } from '../lib/buildings.ts'
import {
  TermBuildings,
  coursesToClassrooms
} from '../lib/coursesToClassrooms.ts'
import { northeast, southwest, PADDING, mapPosition } from '../lib/locations.ts'
import { now } from '../lib/now.ts'
import { Term, TermCache, TermError } from '../lib/TermCache.ts'
import { OnView, viewFromUrl, viewToUrl, ViewWithTerm } from '../View.ts'
import { BuildingPanel } from './building/BuildingPanel.tsx'
import { BuildingButton } from './BuildingButton.tsx'
import { DateTimeButton } from './date-time/DateTimeButton.tsx'
import { DateTimePanel } from './date-time/DateTimePanel.tsx'
import { navigate } from './Link.tsx'
import { ModalView, ResultModal } from './search/ResultModal.tsx'
import { SearchBar, State } from './search/SearchBar.tsx'
import { TermStatus } from './TermStatus.tsx'
import { fromMoment, MomentContext } from '../moment-context.ts'

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

function getTerms ({ year, season, current }: CurrentTerm): Term[] {
  const terms: Term[][] = [
    current ? [{ year, quarter: season }] : [],
    season === 'S1' || season === 'S2' || (season === 'FA' && !current)
      ? [{ year, quarter: 'S3' }]
      : []
  ]
  return terms.flat()
}

export type AppProps = {
  title: string
}
export function App ({ title }: AppProps) {
  const [realTime, setRealTime] = useState(true)
  const [moment, setMoment] = useState(() => fromMoment(now(), realTime))
  useEffect(() => {
    if (realTime) {
      const intervalId = setInterval(() => {
        const newMoment = now()
        // Avoid unnecessary rerenders by returning original object if they have
        // the same values
        setMoment(moment =>
          +moment.date !== +newMoment.date || +moment.time !== +newMoment.time
            ? fromMoment(newMoment, realTime)
            : moment
        )
      }, 1000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [realTime])

  const termCache = useRef(new TermCache())
  const [state, setState] = useState<AppState | null>(null)

  // TODO: Show errors, if any, in a corner
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
  const [buildingCode, setBuildingCode] = useState<string | null>(null)
  const lastBuilding = useLast('CENTR', buildingCode)
  const [scrollTo, setScrollTo] = useState({ building: 'CENTR', init: true })
  const [room, setRoom] = useState<string | null>(null)

  const [showResults, setShowResults] = useState(false)
  const [searchState, setSearchState] = useState<State>({ type: 'unloaded' })
  const [modal, setModal] = useState<ModalView | null>(null)
  const modalView = useLast<ModalView>(
    { type: 'course', course: { code: '', title: '', groups: [] } },
    modal
  )

  const terms = getTerms(getTerm(moment.date))
  const termId = terms.map(term => termCode(term.year, term.quarter)).join(' ')

  const datePanelVisible = showDatePanel || (noticeVisible && state !== null)
  const buildingPanelVisible = buildingCode !== null && !noticeVisible

  async function handleDate (date: Day) {
    const currentTerm = getTerm(date)
    const { season, finals } = currentTerm
    const terms = getTerms(currentTerm)
    const holiday = getHolidays(date.year)[date.id]
    if (holiday || terms.length === 0) {
      // Have the date selector open for the user to select another day
      setState({ errors: [], status: [], season, holiday })
      return
    }
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
    const classrooms = coursesToClassrooms(courses)
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
  }
  useEffect(() => {
    handleDate(moment.date)
  }, [+moment.date])

  async function loadTerms (): Promise<Course[]> {
    const maybePromise = termCache.current.requestTerms(terms, true)
    if (maybePromise instanceof Promise) {
      // Show "Loading..."
      setSearchState({ type: 'loading' })
    }
    const { successes, errors } =
      maybePromise instanceof Promise ? await maybePromise : maybePromise
    const courses = successes.flatMap(result => result.result.courses)
    setSearchState({
      type: 'loaded',
      termId,
      data: {
        courses,
        professors: Array.from(
          new Set(
            courses.flatMap(course =>
              course.groups.flatMap(group =>
                group.instructors.map(({ first, last }) => `${last}, ${first}`)
              )
            )
          ),
          name => {
            const [last, first] = name.split(', ')
            return { first, last }
          }
        )
      },
      // Don't show `unavailable` errors since it's already shown by the term
      // status
      offline: errors
        .filter(error => error.type === 'offline')
        .map(error => error.request)
    })
    return courses
  }

  async function handleView (view: ViewWithTerm) {
    setRealTime(view.term === null)
    setMoment(fromMoment(view.term ?? now(), view.term === null))
    setShowResults(!!view.searching)
    if (view.type === 'default') {
      setModal(null)
      setBuildingCode(null)
      document.title = title
      return
    }
    if (view.type === 'building') {
      setScrollTo({ building: view.building, init: false })
      setBuildingCode(view.building)
      setModal(null)
      setRoom(view.room ?? null)
      document.title = `${
        view.room
          ? `${view.building} ${view.room}`
          : buildings[view.building]?.name ?? view.building
      } · ${title}`
      return
    }
    setBuildingCode(null)
    const courses =
      searchState.type === 'loaded' && searchState.termId === termId
        ? searchState.data.courses
        : await loadTerms()
    if (view.type === 'course') {
      const course = courses.find(course => course.code === view.course)
      if (course) {
        setModal({ type: 'course', course })
        document.title = `${view.course} · ${title}`
      } else {
        setModal({
          type: 'course',
          course: { code: view.course, title: view.course, groups: [] }
        })
        document.title = `Course not found · ${title}`
      }
    } else {
      const [last, first] = view.name.split(', ')
      setModal({
        type: 'professor',
        professor: {
          first,
          last,
          courses: courses.flatMap(course => {
            const groups = course.groups.filter(group =>
              group.instructors.some(
                prof => prof.first === first && prof.last === last
              )
            )
            return groups.length > 0 ? [{ ...course, groups }] : []
          })
        }
      })
      document.title = `${first} ${last} · ${title}`
    }
  }

  useEffect(() => {
    const initView = viewFromUrl(window.location.href)
    if (initView.searching) {
      // On page load, if #search is in the URL, remove it
      window.history.replaceState(
        window.history.state,
        '',
        viewToUrl({ ...initView, searching: false })
      )
    }
  }, [])

  useEffect(() => {
    const initView = viewFromUrl(window.location.href)
    handleView(initView)
    const handlePopstate = () => {
      handleView(viewFromUrl(window.location.href))
    }
    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
    // Unintuitively, searchState is a dependency in handleView. Otherwise,
    // going back/forth will use courses from the wrong term
  }, [searchState])

  return (
    <OnView.Provider value={handleView}>
      <MomentContext.Provider value={moment}>
        <SearchBar
          state={searchState}
          terms={terms}
          termId={termId}
          buildings={state?.buildings ? Object.keys(state?.buildings) : []}
          showResults={showResults}
          onSearch={showResults => {
            setShowResults(showResults)
            const currentView = viewFromUrl(window.location.href)
            navigate(handleView, {
              view: { ...currentView, searching: showResults },
              back: ([previous]) => {
                if (
                  showResults ||
                  !previous ||
                  previous.type !== currentView.type
                ) {
                  return null
                }
                if (!previous.searching) {
                  return 0
                } else {
                  return null
                }
              }
            })
            if (
              searchState.type === 'unloaded' ||
              (searchState.type === 'loaded' && searchState.termId !== termId)
            ) {
              loadTerms()
            }
          }}
          visible={!noticeVisible}
        />
        <ResultModal view={modalView} open={modal !== null} />
        <div
          class={`corner ${buildingPanelVisible ? 'bottom-panel-open' : ''}`}
        >
          <DateTimeButton
            onClick={() => setShowDatePanel(true)}
            disabled={datePanelVisible}
          />
          <TermStatus status={state?.status} visible={!noticeVisible} />
        </div>
        <DateTimePanel
          date={moment.date}
          onDate={date => {
            navigate(handleView, {
              view: {
                ...viewFromUrl(window.location.href),
                term: { ...moment, date }
              }
            })
          }}
          time={moment.time}
          onTime={time => {
            navigate(handleView, {
              view: {
                ...viewFromUrl(window.location.href),
                term: { ...moment, time }
              }
            })
          }}
          useNow={realTime}
          onUseNow={useNow => {
            navigate(handleView, {
              view: {
                ...viewFromUrl(window.location.href),
                term: useNow ? null : moment
              }
            })
          }}
          visible={datePanelVisible}
          closeable={!noticeVisible || state === null}
          class={`${
            buildingPanelVisible ? 'date-time-panel-bottom-panel' : ''
          } ${noticeVisible ? 'date-time-panel-notice-visible' : ''}`}
          onClose={() => setShowDatePanel(false)}
        />
        <div class='buildings-wrapper'>
          <p
            class={`notice ${noticeVisible ? 'notice-visible' : ''} ${
              datePanelVisible ? 'notice-date-open' : ''
            }`}
          >
            <span class='notice-text'>{notice}</span>
          </p>
          <div class='buildings'>
            <div
              class='scroll-area'
              style={{
                width: `${
                  northeast.x - southwest.x + PADDING.horizontal * 2
                }px`,
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
                building={building}
                rooms={Object.values(state?.buildings?.[building.code] ?? {})}
                selected={building.code === buildingCode}
                scrollTarget={
                  building.code === scrollTo.building ? scrollTo : null
                }
                visible={!!state?.buildings && building.code in state.buildings}
              />
            ))}
          </div>
        </div>
        <BuildingPanel
          building={
            buildings[lastBuilding] ?? {
              code: lastBuilding,
              college: '',
              images: '',
              location: [0, 0],
              name: lastBuilding
            }
          }
          room={room}
          rooms={state?.buildings?.[lastBuilding] ?? {}}
          visible={buildingPanelVisible}
          rightPanelOpen={datePanelVisible}
        />
      </MomentContext.Provider>
    </OnView.Provider>
  )
}
