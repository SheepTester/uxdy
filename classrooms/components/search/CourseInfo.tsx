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
import { Day } from '../../../util/Day.ts'
import { Time } from '../../../util/Time.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { Link } from '../Link.tsx'

const webregDays = ['Sun', 'M', 'Tu', 'W', 'Th', 'F', 'S', 'Sun']

type MeetingCardProps = {
  meeting: Section | Meeting | Exam
  code?: string | null
}
function MeetingCard ({ meeting, code }: MeetingCardProps) {
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
        <p class='meeting-column section-capacity'>
          {meeting.capacity === Infinity ? (
            'No limit'
          ) : (
            <>
              Capacity: <strong>{meeting.capacity}</strong>
            </>
          )}
        </p>
      )}
      <div class='mobile-break' />
      <p class='meeting-column meeting-date'>
        {meeting.time && (
          <abbr
            title={meeting.time.days
              .map(day => Day.dayName(day, 'long'))
              .join(', ')}
          >
            {meeting.time.days.map(day => webregDays[day]).join('')}
          </abbr>
        )}{' '}
        {meeting.kind === 'exam'
          ? meeting.date.toString([], { month: 'short', day: 'numeric' })
          : null}{' '}
        {meeting.time &&
          Time.from(meeting.time.start).formatRange(
            Time.from(meeting.time.end)
          )}
      </p>
      <Link
        view={
          physicalRoom && meeting.location
            ? {
              type: 'building',
              building: meeting.location.building,
              room: meeting.location.room
            }
            : null
        }
        class={`meeting-column location ${
          physicalRoom ? '' : 'location-not-room'
        }`}
      >
        {meeting.location
          ? meeting.location.building === 'RCLAS'
            ? 'Remote'
            : `${meeting.location.building} ${meeting.location.room}`
          : 'TBA'}
      </Link>
    </section>
  )
}

export type CourseInfoProps = {
  course: Course
}
export function CourseInfo ({ course }: CourseInfoProps) {
  return (
    <div class='course-info'>
      {course.groups.map(group => (
        <article class='group' key={group.code}>
          <header class='group-info'>
            <span class='group-code'>{group.code}</span>
            <div class='instructors'>
              {group.instructors.map(({ first, last }) => (
                <Link
                  view={{ type: 'professor', name: `${last}, ${first}` }}
                  class='instructor'
                  key={`${last}, ${first}`}
                >
                  {first} <span class='last-name'>{last}</span>
                </Link>
              ))}
              {group.instructors.length === 0 && (
                <span class='staff'>Instructor TBA</span>
              )}
            </div>
          </header>
          {group.meetings.map((meeting, i) => (
            <MeetingCard
              meeting={meeting}
              code={meeting.code !== group.code ? meeting.code : null}
              key={i}
            />
          ))}
          {group.sections.length > 0 && group.meetings.length > 0 && (
            <hr class='additional-meetings-divider' />
          )}
          {group.sections.map(section => (
            <MeetingCard
              meeting={section}
              code={section.code !== group.code ? section.code : null}
              key={section.code}
            />
          ))}
          {group.meetings.length > 0 && group.exams.length > 0 && (
            <hr class='additional-meetings-divider' />
          )}
          {group.exams.map((exam, i) => (
            <MeetingCard meeting={exam} key={i} />
          ))}
        </article>
      ))}
    </div>
  )
}
