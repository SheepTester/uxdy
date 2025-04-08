import { createContext } from 'preact'
import { Moment } from './lib/now.ts'
import { Day } from '../util/Day.ts'
import { Time } from '../util/Time.ts'

export type View = {
  searching?: boolean
} & (
  | {
      type: 'default'
      searching?: boolean
    }
  | {
      type: 'course'
      course: string
    }
  | {
      type: 'professor'
      name: string
    }
  | {
      type: 'building'
      building: string
      room?: string | null
    }
)

export type ViewWithTerm = View & {
  term: Moment | null
}

export function viewFromUrl (url: string): ViewWithTerm {
  const { searchParams, hash } = new URL(url)
  const building = searchParams.get('building')
  const course = searchParams.get('course')
  const professor = searchParams.get('professor')
  const dateTime = searchParams.get('term')
  let term: Moment | null = null
  if (dateTime?.includes('T')) {
    const [dateStr, timeStr] = dateTime.split('T')
    const date = Day.parse(dateStr)
    const time = Time.parse24(timeStr.replace('.', ':'))
    if (date && time) {
      term = { date, time }
    }
  }
  const searching = hash === '#search'
  if (building) {
    return {
      type: 'building',
      building,
      room: searchParams.get('room'),
      term,
      searching
    }
  } else if (course) {
    return { type: 'course', course, term, searching }
  } else if (professor) {
    return { type: 'professor', name: professor, term, searching }
  } else {
    return { type: 'default', term, searching }
  }
}

export function viewToUrl (view: ViewWithTerm): URL {
  const url = new URL(window.location.pathname, window.location.href)
  if (view.searching) {
    url.hash = 'search'
  }
  if (view.term) {
    url.searchParams.append(
      'term',
      `${view.term.date.toString()}T${view.term.time
        .toString(true)
        .replace(':', '.')}`
    )
  }
  if (view.type === 'building') {
    url.searchParams.append('building', view.building)
    if (view.room) {
      url.searchParams.append('room', view.room)
    }
  } else if (view.type === 'course') {
    url.searchParams.append('course', view.course)
  } else if (view.type === 'professor') {
    url.searchParams.append('professor', view.name)
  }
  return url
}

export type ViewHandler = (view: ViewWithTerm) => void

export const OnView = createContext<ViewHandler>((_: ViewWithTerm) => {})

/** @param history - In reverse chronological order, newest first. */
export type BackHandler = (history: ViewWithTerm[]) => number | null
