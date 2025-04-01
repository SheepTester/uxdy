import { createContext } from 'react'

export type View =
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

export function viewFromUrl (url: string): View {
  const { searchParams, hash } = new URL(url)
  const building = searchParams.get('building')
  const course = searchParams.get('course')
  const professor = searchParams.get('professor')
  if (building) {
    return { type: 'building', building, room: searchParams.get('room') }
  } else if (course) {
    return { type: 'course', course }
  } else if (professor) {
    return { type: 'professor', name: professor }
  } else {
    return { type: 'default', searching: hash === '#search' }
  }
}

export function viewToUrl (view: View): URL {
  const url = new URL(window.location.pathname, window.location.href)
  if (view.type === 'default') {
    if (view.searching) {
      url.hash = 'search'
    }
  } else if (view.type === 'building') {
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
