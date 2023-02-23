import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts'

// S for Saturday, SP23 BIPN 100
// Sun for Sunday, SP23 MGT 404
export const DAYS = ['Sun', 'M', 'Tu', 'W', 'Th', 'F', 'S']

function unwrap (expected?: Error): never {
  throw expected ?? new RangeError('Expected non-nullish value')
}

/**
 * Tries to parse the given string as a natural number (a non-negative integer).
 * Throws an error if the string isn't a natural number.
 */
function parseNatural (string: string): number {
  if (!/[0-9]+/.test(string)) {
    throw new RangeError(`"${string}" is not a natural number`)
  }
  return +string
}
/**
 * Parses a US-style date (eg 06/15/2023) as a UTC JS Date object. Used for
 * parsing exam dates.
 */
function parseDate (usDate: string): Date {
  const [month, date, year] = usDate.split('/').map(parseNatural)
  const dateObj = new Date(Date.UTC(year, month - 1, date))
  if (Number.isNaN(dateObj.getTime())) {
    throw new RangeError(`"${usDate}" is not a valid US date.`)
  }
  return dateObj
}
/**
 * Parses a time of the form "11:50a" or "9:59p," returning the number of
 * minutes since midnight. Used by `parseTimeRange`.
 */
function parseTime (time: string): number {
  const [hour, minute] = time.slice(0, -1).split(':').map(parseNatural)
  const am = time[time.length - 1] === 'a'
  return (hour === 12 ? (am ? 0 : 12) : am ? hour : hour + 12) * 60 + minute
}
/**
 * Parses a time range of the form "7:00p-9:59p." The times are represented in
 * minutes since midnight.
 */
function parseTimeRange (timeRange: string): { start: number; end: number } {
  const [start, end] = timeRange.split('-')
  return { start: parseTime(start), end: parseTime(end) }
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
    /**
     * If full, a negative number representing the length of the waitlist.
     * If there is no limit, both `available` and `capacity` will be Infinity.
     */
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
    /** Array of numbers 0-6 representing days of the week. 0 is Sunday. */
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
  /**
   * Empty if taught by Staff.
   *
   * Note that for exams and courses with multiple lecture times,
   * ScheduleOfClasses doesn't repeat the instructor, so this array will also be
   * empty.
   */
  instructors: [firstName: string, lastName: string][]
}

type Course = {
  subject: string
  number: string
  title: string
  /**
   * A range of selectable units from `from` to `to` (inclusive) in increments
   * of `inc`.
   *
   * NOTE: `inc` may be 0.5.
   */
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

export async function * getCourseIterator (
  term: string
): AsyncGenerator<Omit<Course, 'sections'> | Section> {
  const subjects = await fetch(
    'https://act.ucsd.edu/scheduleOfClasses/subject-list.json?selectedTerm=' +
      term
  )
    .then(r => r.json())
    .then((json: SubjectList) => json.map(({ code }) => code))

  let subject: string | null = null
  let lastNumber: string | null = null
  let maxPage: number | null = null
  let page = 1
  while (maxPage === null || page <= maxPage) {
    const document = await fetchHtml(getUrl(term, subjects, page))
    const form =
      document.getElementById('socDisplayCVO') ??
      unwrap(new Error('Missing results wrapper'))
    if (maxPage === null) {
      const [, maxPageStr] =
        form.children[6]
          .querySelector('td[align="right"]')
          ?.textContent.match(/\(\d+\sof\s(\d+)\)/) ??
        unwrap(new Error('Missing total page count'))
      maxPage = parseNatural(maxPageStr)
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
          lastNumber = null
        }
        continue
      }

      // Row with course title and units
      if (row.querySelector('.crsheader') && row.children.length === 4) {
        if (!subject) {
          throw new Error('No subject')
        }
        const number = row.children[1].textContent
        if (number === lastNumber) {
          continue
        }
        // ( 2 Units)
        // ( 2 /4 by 2 Units)
        // ( 1 -4 Units)
        // ( 1 /5 by 0.5 Units) [SP23 BIOM 231]
        // ( 2.5 Units) [SP23 LIAB 1C]
        const unitMatch =
          row.children[2].textContent.match(
            /\(\s*(\d+|2\.5)(?:\s*[/-](\d+)(?:\s+by\s+(\d+|0\.5))?)?\s+Units\)/
          ) ??
          unwrap(
            new SyntaxError(
              'Missing "(N units)"\n' +
                row.children[2].textContent.trim().replaceAll(/\s+/g, ' ')
            )
          )
        const from = unitMatch[1] === '2.5' ? 2.5 : parseNatural(unitMatch[1])
        const to = unitMatch[2] ? parseNatural(unitMatch[2]) : null
        const inc =
          unitMatch[3] === '0.5'
            ? 0.5
            : unitMatch[3]
            ? parseNatural(unitMatch[3])
            : null
        yield {
          subject,
          number,
          title:
            row.querySelector('td[colspan="5"] .boldtxt')?.textContent.trim() ??
            unwrap(new Error(`No course title for ${subject} ${number}`)),
          units: { from, to: to ?? from, inc: inc ?? 1 }
        }
        lastNumber = number
        continue
      }

      // A section (meeting)
      if (row.className === 'sectxt' || row.className === 'nonenrtxt') {
        const tds = Array.from(row.children, td => td.textContent.trim())
        if (row.className === 'nonenrtxt') {
          if (tds.length === 2) {
            // SP23 BGGN 500 uses a .nonenrtxt for a note, so skip it
            continue
          }
          // .nonenrtxt is used mostly for exams, but it's also used for
          // sections with multiple lectures (eg SP23 BENG 100). It appears as
          // white rather than lavender and doesn't repeat the instructor name.
          tds.unshift('')
          tds.splice(9, 0, 'Staff')
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
          _instructor,
          seatsAvailable,
          seatsLimit
        ] = tds
        if (days === 'Cancelled') {
          // Ignore cancelled sections (NOTE: this may produce courses with no
          // sections)
          continue
        }
        if (!/^(?:(?:Sun|T[uh]|[MWFS])+|TBA)$/.test(days)) {
          throw new SyntaxError(`Unexpected days format "${days}"`)
        }
        if (lastNumber === null) {
          throw new Error('Section does not belong to a course')
        }
        yield {
          selectable:
            sectionId !== ''
              ? {
                  id: parseNatural(sectionId),
                  available:
                    seatsAvailable === 'Unlim'
                      ? Infinity
                      : seatsAvailable.includes('FULL')
                      ? -(
                          seatsAvailable.match(/\((\d+)\)/)?.[1] ??
                          unwrap(
                            new SyntaxError(
                              `Cannot get waitlist count from ${seatsAvailable}`
                            )
                          )
                        )
                      : parseNatural(seatsAvailable),
                  capacity:
                    seatsAvailable === 'Unlim'
                      ? Infinity
                      : parseNatural(seatsLimit)
                }
              : null,
          type: meetingType,
          section: sectionCodeOrDate.includes('/')
            ? parseDate(sectionCodeOrDate)
            : sectionCodeOrDate,
          time:
            days !== 'TBA'
              ? {
                  days: Array.from(days.matchAll(/Sun|T[uh]|[MWFS]/g), match =>
                    DAYS.indexOf(match[0])
                  ).sort((a, b) => a - b),
                  ...parseTimeRange(time)
                }
              : null,
          location: building !== 'TBA' ? { building, room } : null,
          instructors: Array.from(row.children[9].querySelectorAll('a'), td => {
            const [last, first] = td.textContent.trim().split(', ')
            return [first, last]
          })
        }
      }
    }

    page++
  }
}

export async function getCourses (term: string): Promise<Course[]> {
  const courses: Course[] = []
  for await (const item of getCourseIterator(term)) {
    if ('subject' in item) {
      courses.push({ ...item, sections: [] })
    } else {
      courses[courses.length - 1].sections.push(item)
    }
  }
  return courses
}
