import { createContext } from 'preact'

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

export function viewFromUrl (url: string): View {
  const { searchParams, hash } = new URL(url)
  const building = searchParams.get('building')
  const course = searchParams.get('course')
  const professor = searchParams.get('professor')
  const searching = hash === '#search'
  if (building) {
    return {
      type: 'building',
      building,
      room: searchParams.get('room'),
      searching
    }
  } else if (course) {
    return { type: 'course', course, searching }
  } else if (professor) {
    return { type: 'professor', name: professor, searching }
  } else {
    return { type: 'default', searching }
  }
}

export function viewToUrl (view: View): URL {
  const url = new URL(window.location.pathname, window.location.href)
  if (view.searching) {
    url.hash = 'search'
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

export type ViewHandler = (view: View) => void

export const OnView = createContext<ViewHandler>((_: View) => {})

/** @param history - In reverse chronological order, newest first. */
export type BackHandler = (history: View[]) => number | null
