import { createContext } from 'preact'

export type View =
  | {
      type: 'course'
      id: string
    }
  | {
      type: 'professor'
      id: string
    }
  | {
      type: 'building'
      id: string
      room?: string | null
    }

export function viewFromUrl (url: string): View | null {
  const params = new URL(url).searchParams
  const building = params.get('building')
  const course = params.get('course')
  const professor = params.get('professor')
  if (building) {
    return { type: 'building', id: building, room: params.get('room') }
  } else if (course) {
    return { type: 'course', id: course }
  } else if (professor) {
    return { type: 'professor', id: professor }
  } else {
    return null
  }
}

export const OnView = createContext((view: View) => {})
