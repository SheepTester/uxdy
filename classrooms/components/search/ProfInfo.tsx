/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Course, Group } from '../../../scheduleofclasses/group-sections.ts'
import { View } from './SearchResults.tsx'

export type Professor = {
  first: string
  last: string
  courses: Course[]
}

export type ProfInfoProps = {
  professor: Professor
  onView: (view: View) => void
}
export function ProfInfo ({ professor, onView }: ProfInfoProps) {
  return (
    <div class='prof-info'>
      {professor.courses.map(course => (
        <button
          class='prof-course'
          key={course.code}
          onClick={() => onView({ type: 'course', id: course.code })}
        >
          {course.code}
        </button>
      ))}
    </div>
  )
}
