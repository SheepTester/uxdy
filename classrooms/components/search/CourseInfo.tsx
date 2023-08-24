/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import {
  Course,
  Exam,
  Meeting,
  Section
} from '../../../scheduleofclasses/group-sections.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { View } from './SearchResults.tsx'

type MeetingCardProps = {
  meeting: Section | Meeting | Exam
  code?: string | null
  onView: (view: View) => void
}
function MeetingCard ({ meeting, code, onView }: MeetingCardProps) {
  const physicalRoom = meeting.location && meeting.location.building !== 'RCLAS'
  return (
    <section class='meeting-card'>
      <p class='meeting-type'>
        {meetingTypes[meeting.type] ?? meeting.type}
        {code && (
          <>
            <span class='colon'>: </span>
            <span class='meeting-code'>{code}</span>
          </>
        )}
      </p>
      {meeting.kind === 'section' && (
        <p class='meeting-column section-capacity'>{meeting.capacity}</p>
      )}
      <p class='meeting-column meeting-date'>
        {meeting.kind === 'exam'
          ? meeting.date.toString()
          : meeting.time?.days.join('')}
      </p>
      <button
        class={`meeting-column location ${
          physicalRoom ? '' : 'location-not-room'
        }`}
        type='button'
        disabled={!physicalRoom}
        onClick={() => {
          if (meeting.location) {
            onView({
              type: 'building',
              id: meeting.location.building,
              room: meeting.location.room
            })
          }
        }}
      >
        {meeting.location
          ? meeting.location.building === 'RCLAS'
            ? 'Remote'
            : `${meeting.location.building} ${meeting.location.room}`
          : 'TBA'}
      </button>
    </section>
  )
}

export type CourseInfoProps = {
  course: Course
  onView: (view: View) => void
}
export function CourseInfo ({ course, onView }: CourseInfoProps) {
  return (
    <div class='course-info'>
      {course.groups.map(group => (
        <article class='group' key={group.code}>
          <header class='group-info'>
            <span class='group-code'>{group.code}</span>
            <div class='instructors'>
              {group.instructors.map(({ first, last }) => (
                <p class='instructor' key={`${last}, ${first}`}>
                  {first} <span class='last-name'>{last}</span>
                </p>
              ))}
            </div>
          </header>
          {group.sections.map(section => (
            <MeetingCard
              meeting={section}
              code={section.code !== group.code ? section.code : null}
              onView={onView}
              key={section.code}
            />
          ))}
          {(group.meetings.length > 0 || group.exams.length > 0) && (
            <hr class='additional-meetings-divider' />
          )}
          {group.meetings.map((meeting, i) => (
            <MeetingCard
              meeting={meeting}
              code={meeting.code !== group.code ? meeting.code : null}
              onView={onView}
              key={i}
            />
          ))}
          {group.exams.map((exam, i) => (
            <MeetingCard meeting={exam} onView={onView} key={i} />
          ))}
        </article>
      ))}
    </div>
  )
}
