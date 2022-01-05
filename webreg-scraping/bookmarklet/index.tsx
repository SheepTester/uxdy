/** @jsxImportSource https://esm.sh/preact@10.6.4 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { ComponentChildren, render } from 'https://esm.sh/preact@10.6.4'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.4/hooks'
import { AuthorizedGetter, Course, Group, Period } from '../scrape.ts'

const params = new URL(window.location.href).searchParams
const term = params.get('p1')
if (!term) {
  alert("I can't know what quarter you're on based on the URL.")
  throw new Error('Unable to get term from URL.')
}
const getter = new AuthorizedGetter(term)

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

type CourseEntryProps = {
  course: Course
  sections: Group[]
}
function CourseEntry ({ course, sections }: CourseEntryProps) {
  const [open, setOpen] = useState(false)

  return <li>{course.title}</li>
}

type CourseListProps = {
  lowerDivOnly: boolean
  checkSchedule?: Period[] | null
  joinableOnly: boolean
  tenPercentRule: boolean
}
function CourseList ({
  lowerDivOnly,
  checkSchedule,
  joinableOnly,
  tenPercentRule
}: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([])

  useAsyncEffect(async () => {
    const courses = []
    for await (const course of getter.allCourses()) {
      courses.push(course)
      setCourses([...courses])
      if (courses.length > 3) break
    }
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

        const sections = course.groups.filter(group => {
          // Don't show courses that can't be enrolled
          if (!group.plannable) return false
          // Don't show courses that are full or shouldn't be waitlisted
          if (
            joinableOnly &&
            group.enrollable &&
            !(tenPercentRule && group.waitlist + 1 <= group.capacity * 0.1)
          ) {
            return false
          }
          // Don't show courses that coincide with the user's existing schedule
          if (checkSchedule) {
            const times = group.times()
            if (
              checkSchedule.some(period =>
                times.some(time => time.intersects(period))
              )
            ) {
              return false
            }
          }
          return true
        })
        return (
          <CourseEntry
            key={course.subject + course.course}
            course={course}
            sections={sections}
          />
        )
      })}
    </div>
  )
}

function App () {
  const [upperDiv, setUpperDiv] = useState(false)
  const [conflicts, setConflicts] = useState(false)
  const [full, setFull] = useState(false)
  const [tenPercent, setTenPercent] = useState(false)

  const [schedule, setSchedule] = useState<Period[]>()
  useAsyncEffect(async () => {
    const sections = await getter.getSchedule()
    setSchedule(
      sections
        .filter(section => section.state.type !== 'planned')
        .flatMap(section => section.times())
    )
  })

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
      </fieldset>
      {schedule && (
        <CourseList
          lowerDivOnly={!upperDiv}
          checkSchedule={conflicts ? null : schedule}
          joinableOnly={tenPercent || !full}
          tenPercentRule={tenPercent}
        />
      )}
    </div>
  )
}

const root = document.createElement('div')
document.getElementById('msg-status')?.after(root)
render(<App />, root)
