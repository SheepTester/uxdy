/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { Link } from '../Link.tsx'

export type Professor = {
  first: string
  last: string
  courses: Course[]
}

export type ProfInfoProps = {
  professor: Professor
}
export function ProfInfo ({ professor }: ProfInfoProps) {
  return (
    <div class='prof-info'>
      {professor.courses.map(course => (
        <Link
          view={{ type: 'course', course: course.code }}
          class='prof-course'
          key={course.code}
        >
          {course.code}
        </Link>
      ))}
    </div>
  )
}
