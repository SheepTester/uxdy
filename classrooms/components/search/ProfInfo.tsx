/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { Link } from '../Link.tsx'
import { MeetingCard } from './CourseInfo.tsx'

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
    <div class='course-info'>
      {professor.courses.flatMap(course =>
        course.groups.map(group => (
          <article class='group' key={`${course.code}\n${group.code}`}>
            <header class='group-info'>
              <Link
                view={{ type: 'course', course: course.code }}
                class='course-code'
              >
                {course.code}
              </Link>
              <div class='group-code group-code-small'>{group.code}</div>
              {group.sectionTitle ? (
                <h2 class='section-title'>{group.sectionTitle}</h2>
              ) : null}
            </header>
            {(group.meetings.length > 0 ? group.meetings : group.sections).map(
              (meeting, i) => (
                <MeetingCard
                  meeting={meeting}
                  code={meeting.code !== group.code ? meeting.code : null}
                  key={i}
                />
              )
            )}
          </article>
        ))
      )}
    </div>
  )
}
