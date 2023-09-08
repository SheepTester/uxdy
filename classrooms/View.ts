import { createContext } from 'preact'

export type View =
  | {
      type: 'default'
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

export function viewFromUrl (url: string): View {
  const params = new URL(url).searchParams
  const building = params.get('building')
  const course = params.get('course')
  const professor = params.get('professor')
  if (building) {
    return { type: 'building', building, room: params.get('room') }
  } else if (course) {
    return { type: 'course', course }
  } else if (professor) {
    return { type: 'professor', name: professor }
  } else {
    return { type: 'default' }
  }
}

export function viewToUrl (view: View) {
  if (view.type === 'default') {
    return window.location.pathname
  }
  return (
    window.location.pathname +
    '?' +
    new URLSearchParams(
      view.type === 'building'
        ? view.room
          ? { building: view.building, room: view.room }
          : { building: view.building }
        : view.type === 'course'
        ? { course: view.course }
        : view.type === 'professor'
        ? { professor: view.name }
        : {}
    )
  )
}

export type ViewHandler = (view: View) => void

export const OnView = createContext<ViewHandler>((_: View) => {})

/** @param history - In reverse chronological order, newest first. */
export type BackHandler = (history: View[]) => number | null
