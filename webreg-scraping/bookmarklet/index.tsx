/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { ComponentChildren, render } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Course, Group, Scraper } from '../scrape.ts'
import { Period } from '../../util/time.ts'

const params = new URL(window.location.href).searchParams
const term = params.get('p1')
if (!term) {
  alert(
    "I can't know what quarter you're on based on the URL. Have you selected a quarter yet?"
  )
  throw new Error('Unable to get term from URL.')
}
const getter = new Scraper(term)

// TypeScript hack: `useEffect` doesn't accept an async function.
function useAsyncEffect (callback: () => Promise<void>) {
  useEffect(() => {
    callback()
  }, [])
}

type CheckboxProps = {
  checked?: boolean
  onCheck?: (checked: boolean) => void
  disabled?: boolean
  children?: ComponentChildren
}
function Checkbox ({ checked, onCheck, disabled, children }: CheckboxProps) {
  return (
    <p>
      <label>
        <input
          type='checkbox'
          checked={checked}
          onChange={onCheck && (e => onCheck(e.currentTarget.checked))}
          disabled={disabled}
        />{' '}
        {children}
      </label>
    </p>
  )
}

const dayNames = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays'
]

type CourseEntryProps = {
  course: Course
  sections: Group[]
}
function CourseEntry ({ course, sections }: CourseEntryProps) {
  const [open, setOpen] = useState(false)

  return (
    <div class='st-course-wrapper'>
      <button
        class={`st-course ${open ? 'st-open' : ''}`}
        onClick={() => setOpen(open => !open)}
      >
        <div class='st-course-code'>
          {course.subject} {course.course}
        </div>
        <div class='st-course-title'>{course.title}</div>
      </button>
      {open && (
        <div class='st-sections'>
          {sections.map(section => (
            <div
              class={`st-section ${
                section.waitlist > 0 ? 'st-has-waitlist' : ''
              }`}
              key={section.code}
            >
              <div class='st-section-code'>
                {section.code}
                <div class='st-enrolled'>
                  {section.enrolled < section.capacity ? (
                    <>
                      <strong>{section.enrolled}</strong>
                      {section.capacity === Infinity
                        ? ''
                        : `/${section.capacity}`}{' '}
                      enrolled
                    </>
                  ) : (
                    <>
                      <strong>{section.waitlist}</strong> waitlisted
                    </>
                  )}
                </div>
              </div>
              <div className='st-info'>
                {section.time ? (
                  <div class='st-time'>
                    <div>
                      {section.time.start.toString()}–
                      {section.time.end.toString()}
                    </div>
                    <div>
                      on{' '}
                      {section.time.days.map(day => dayNames[day]).join(', ')}
                    </div>
                  </div>
                ) : null}
                <div className='st-professor'>
                  {section.instructors.length > 0
                    ? section.instructors.map(({ firstName, surname }) => {
                        return (
                          <>
                            <div>{firstName}</div>
                            <div>
                              <strong>{surname}</strong>
                            </div>
                          </>
                        )
                      })
                    : 'Staff'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type CourseListProps = {
  lowerDivOnly: boolean
  checkSchedule?: Period[] | null
  joinableOnly: boolean
  tenPercentRule: boolean
  remote: boolean
}
function CourseList ({
  lowerDivOnly,
  checkSchedule,
  joinableOnly,
  tenPercentRule,
  remote
}: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)

  useAsyncEffect(async () => {
    setLoading(true)
    const courses = []
    for await (const course of getter.allCourses()) {
      courses.push(course)
      setCourses([...courses])
    }
    setLoading(false)
  })

  return (
    <div>
      {courses.map(course => {
        if (lowerDivOnly) {
          const courseNumber = course.course.match(/\d+/)?.[0]
          if (courseNumber && +courseNumber >= 100) {
            return null
          }
        }

        // Numerical section codes are individual rather than belonging to some
        // "000"
        const approvedLetters = ['0']
        if (checkSchedule) {
          // Get the other normal sections such as lectures and additional meeting
          // types
          const otherSections = course.groups.filter(
            group => !group.isExam() && !group.plannable
          )
          const sectionsByLetters: Record<string, Group[]> = {}
          for (const section of otherSections) {
            if (/^[A-Z]$/.test(section.code[0])) {
              sectionsByLetters[section.code[0]] ??= []
              sectionsByLetters[section.code[0]].push(section)
            } else if (section.code[0] !== '0') {
              console.log(section.code, course, section)
            }
          }
          // Make sure that each of the other sections per letter, eg Axx then
          // Bxx, don't conflict with the schedule
          for (const [letter, sections] of Object.entries(sectionsByLetters)) {
            if (
              sections.every(
                section =>
                  !section
                    .times()
                    ?.some(time =>
                      checkSchedule.some(period => time.intersects(period))
                    )
              )
            ) {
              approvedLetters.push(letter)
            }
          }
        }

        const sections = course.groups.filter(group => {
          // Don't show courses that can't be enrolled
          if (!group.plannable) return false
          // Don't show courses that are full or shouldn't be waitlisted
          if (
            joinableOnly &&
            !group.enrollable &&
            !(tenPercentRule && group.waitlist + 1 <= group.capacity * 0.1)
          ) {
            return false
          }
          // Don't show sections that aren't remote (note: other meetings, like
          // finals and lectures might be in person. Whatever)
          if (remote) {
            if (group.time?.location?.building !== 'RCLAS') {
              return false
            }
          }
          // Don't show courses that coincide with the user's existing schedule
          if (checkSchedule) {
            // Other sections under the letter conflict with the schedule
            if (!approvedLetters.includes(group.code[0])) {
              return false
            }
            const times = group.times()
            // I think I'll make it filter out TBA sections as well
            if (
              !times ||
              checkSchedule.some(period =>
                times.some(time => time.intersects(period))
              )
            ) {
              return false
            }
          }
          return true
        })
        return sections.length > 0 ? (
          <CourseEntry
            key={course.subject + course.course}
            course={course}
            sections={sections}
          />
        ) : null
      })}
      {loading ? <p>Loading...</p> : null}
    </div>
  )
}

function App () {
  const [upperDiv, setUpperDiv] = useState(false)
  const [conflicts, setConflicts] = useState(false)
  const [full, setFull] = useState(false)
  const [tenPercent, setTenPercent] = useState(false)
  const [remote, setRemote] = useState(false)

  const [schedule, setSchedule] = useState<Period[]>()
  useAsyncEffect(async () => {
    const sections = await getter.getSchedule()
    setSchedule(
      sections
        .filter(section => section.state.type !== 'planned')
        .flatMap(section => section.times() ?? [])
    )
  })

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href =
      typeof Deno === 'undefined'
        ? 'https://sheeptester.github.io/uxdy/bookmarklet/styles.css'
        : 'http://localhost:8080/webreg-scraping/bookmarklet/styles.css'
    document.head.append(link)
    return () => {
      link.remove()
    }
  }, [])

  return (
    <div>
      <fieldset>
        <legend>Filters</legend>
        <Checkbox checked={upperDiv} onCheck={setUpperDiv}>
          Include upper division courses
        </Checkbox>
        <Checkbox checked={conflicts} onCheck={setConflicts}>
          Include conflicts with current schedule
        </Checkbox>
        <Checkbox checked={full} onCheck={setFull} disabled={tenPercent}>
          Include full sections
        </Checkbox>
        <Checkbox checked={tenPercent} onCheck={setTenPercent}>
          Only include full sections following the 10% waitlist rule
        </Checkbox>
        <Checkbox checked={remote} onCheck={setRemote}>
          Limit to remote classes (RCLAS)
        </Checkbox>
      </fieldset>
      {schedule && (
        <CourseList
          lowerDivOnly={!upperDiv}
          checkSchedule={conflicts ? null : schedule}
          joinableOnly={tenPercent || !full}
          tenPercentRule={tenPercent}
          remote={remote}
        />
      )}
    </div>
  )
}

const root = document.createElement('div')
document.getElementById('msg-status')?.after(root)
render(<App />, root)
