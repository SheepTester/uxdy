import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts'

const TERM = 'SP23'

const DAYS = ['', 'M', 'Tu', 'W', 'Th', 'F']

function unwrap (expected?: Error): never {
  throw expected ?? new RangeError('Expected non-nullish value')
}

const parser = new DOMParser()
const fetchHtml = (url: string) =>
  fetch(url)
    .then(r =>
      r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status} error`))
    )
    .then(
      html =>
        parser.parseFromString(html, 'text/html') ??
        Promise.reject(new SyntaxError('DOM parse error (document is null)'))
    )

/** Represents a scheduled meeting time for a course. */
type Section = {
  /**
   * Only defined if the section is selectable in WebReg (eg a discussion time
   * as opposed to its lecture)
   */
  selectable?: {
    /**
     * A 6-digit number.
     */
    id: number
    /** If full, a negative number representing the length of the waitlist. */
    available: number
    capacity: number
  } | null
  /** eg LE, DI, LA */
  type: string
  /**
   * Date if it's an exam (eg a final) that occurs on one day. Otherwise, it's a
   * section code like A00 or 001.
   */
  section: string | Date
  /** Undefined if TBA. */
  time?: {
    /** Array of numbers 1-7 representing days of the week. */
    days: number[]
    /** In minutes since the start of the day. */
    start: number
    /** In minutes since the start of the day. */
    end: number
  } | null
  /** Undefined if TBA. */
  location?: {
    building: string
    room: string
  } | null
  /** Undefined if staff. */
  instructor?: [firstName: string, lastName: string] | null
}

type Course = {
  subject: string
  number: string
  title: string
  units: { from: number; to: number; inc: number }
  sections: Section[]
}

// https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm?selectedTerm=SP23&selectedSubjects=CAT&selectedSubjects=SYN&page=1
const getUrl = (term: string, subjects: string[], page: number) =>
  'https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm?' +
  new URLSearchParams([
    ['selectedTerm', term],
    ...subjects.map(subject => ['selectedSubjects', subject]),
    ['page', String(page)]
  ])

type SubjectList = {
  code: string
  value: string
}[]
const subjects = await fetch(
  'https://act.ucsd.edu/scheduleOfClasses/subject-list.json?selectedTerm=' +
    TERM
)
  .then(r => r.json())
  .then((json: SubjectList) => json.map(({ code }) => code))

let subject = ''
const courses: Course[] = []
let course: Course | null = null
let maxPage: number | null = null
let page = 1
while (maxPage === null || page <= maxPage) {
  const document = await fetchHtml(getUrl(TERM, subjects, page))
  const form =
    document.getElementById('socDisplayCVO') ??
    unwrap(new Error('Missing results wrapper'))
  if (maxPage === null) {
    const [, maxPageStr] =
      form.children[6]
        .querySelector('td[align="right"]')
        ?.textContent.match(/\(\d+\sof\s(\d+)\)/) ??
      unwrap(new Error('Missing total page count'))
    maxPage = +maxPageStr
  }

  const rows =
    form.querySelector('.tbrdr')?.children[1].children ??
    unwrap(new Error('Missing results table'))
  for (const row of rows) {
    // Heading with subject code
    const subjectHeading = row.querySelector('h2')
    if (subjectHeading) {
      const match = subjectHeading.textContent.match(/\(([A-Z]+)\s*\)/)
      if (match && match[1] !== subject) {
        subject = match[1]
        course = null
      }
      continue
    }

    // Row with course title and units
    if (row.querySelector('.crsheader') && row.children.length === 4) {
      const number = row.children[1].textContent
      // ( 2 Units)
      // ( 2 /4 by 2 Units)
      // ( 1 -4 Units)
      const unitMatch =
        row.children[2].textContent.match(
          /\(\s*(\d+)(?:\s*[/-](\d+)(?:\s+by\s+(\d+))?)?\s+Units\)/
        ) ??
        unwrap(
          new SyntaxError(
            'Missing "(N units)"\n' +
              row.children[2].textContent.trim().replaceAll(/\s+/g, ' ')
          )
        )
      if (!course || number !== course.number) {
        course = {
          subject,
          number,
          title:
            row.querySelector('td[colspan="5"] .boldtxt')?.textContent.trim() ??
            unwrap(new Error(`No course title for ${subject} ${number}`)),
          units: {
            from: +unitMatch[1],
            to: unitMatch[2] ? +unitMatch[2] : +unitMatch[1],
            inc: unitMatch[3] ? +unitMatch[3] : 1
          },
          sections: []
        }
        courses.push(course)
      }
      continue
    }

    // A section (meeting)
    if (row.className === 'sectxt' || row.className === 'nonenrtxt') {
      const isExam = row.className === 'nonenrtxt'
      const tds = Array.from(row.children, td => td.textContent.trim())
      if (isExam) {
        tds.unshift('')
      } else if (tds.length === 10) {
        // Replace the colspan TBA with four TBA cells
        tds.splice(6, 0, 'TBA', 'TBA', 'TBA')
      }
      const [
        ,
        ,
        sectionId,
        meetingType,
        sectionCodeOrDate,
        days,
        time,
        building,
        room,
        instructor,
        seatsAvailable,
        seatsLimit
      ] = tds
      if (!/^(?:(?:[MWF]|Tu|Th)+|TBA)$/.test(days)) {
        throw new SyntaxError(`Unexpected days format "${days}"`)
      }
      const nameParts = instructor.split(', ')
      if (
        instructor !== '' &&
        instructor !== 'Staff' &&
        nameParts.length !== 2
      ) {
        throw new Error(`More than one instructor "${instructor}"`)
      }
      if (!course) {
        throw new Error('Section does not belong to a course')
      }
      course.sections.push({
        selectable:
          sectionId !== ''
            ? {
                id: +sectionId,
                available: seatsAvailable.includes('FULL')
                  ? -(
                      seatsAvailable.match(/\((\d+)\)/)?.[1] ??
                      unwrap(
                        new SyntaxError(
                          `Cannot get waitlist count from ${seatsAvailable}`
                        )
                      )
                    )
                  : +seatsAvailable,
                capacity: +seatsLimit
              }
            : null,
        type: meetingType,
        section: isExam ? new Date(sectionCodeOrDate) : sectionCodeOrDate,
        time:
          days !== 'TBA'
            ? {
                days: Array.from(days.matchAll(/[MWF]|Tu|Th/g), match =>
                  DAYS.indexOf(match[0])
                ).sort((a, b) => a - b),
                start: 0,
                end: 0
              }
            : null,
        location: building !== 'TBA' ? { building, room } : null,
        instructor: nameParts.length === 2 ? [nameParts[1], nameParts[0]] : null
      })
    }
  }

  page++
  break
}

console.log(courses)
