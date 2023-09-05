import { createContext } from 'preact'

export type View =
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

export function viewFromUrl (url: string): View | null {
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
    return null
  }
}

export const OnView = createContext((view: View) => {})
