// deno run --allow-net scheduleofclasses/scrape.ts SP25 > scheduleofclasses/terms/SP25.json
// Outputs JSON file of scraped courses to stdout. Prints progress status to stderr.

import { writeAll } from 'std/streams/write_all.ts'
import { DOMParser, Element } from 'deno_dom/deno-dom-wasm.ts'
import { Day } from '../util/Day.ts'

// S for Saturday, SP23 BIPN 100
// Sun for Sunday, SP23 MGT 404
export const DAYS = ['Sun', 'M', 'Tu', 'W', 'Th', 'F', 'S']

function unwrap (expected?: Error): never {
  throw expected ?? new RangeError('Expected non-nullish value')
}

const encoder = new TextEncoder()
/** Prints to stderr */
async function print (content: string): Promise<void> {
  await writeAll(Deno.stderr, encoder.encode(content))
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
function parseDate (usDate: string): Day {
  const [month, date, year] = usDate.split('/').map(parseNatural)
  const day = Day.from(year, month, date)
  if (!day.valid) {
    throw new RangeError(`"${usDate}" is not a valid US date.`)
  }
  return day
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
      r.ok
        ? r.text()
        : Promise.reject(new Error(`HTTP ${r.status} error: ${url}`))
    )
    .then(
      html =>
        parser.parseFromString(html, 'text/html') ??
        Promise.reject(new SyntaxError('DOM parse error (document is null)'))
    )

/** Represents a scheduled meeting time for a course. */
export type ScrapedSection =
  | {
      cancelled: false
      /**
       * Only defined if the section is selectable in WebReg (eg a discussion
       * time as opposed to its lecture).
       *
       * For seats: https://registrar.ucsd.edu/StudentLink/avail_limit.html
       */
      selectable: {
        /**
         * A 6-digit number.
         * https://registrar.ucsd.edu/StudentLink/id_crse_codes.html
         */
        id: number
        /**
         * If full, a negative number representing the length of the waitlist.
         * If there is no limit, both `available` and `capacity` will be
         * Infinity.
         */
        available: number
        capacity: number
      } | null
      /**
       * Normal meetings e.g. LE, DI, LA or exams e.g. FI, MI.
       * https://registrar.ucsd.edu/StudentLink/instr_codes.html
       */
      type: string
      /**
       * UTC Date if it's an exam (eg a final) that occurs on one day.
       * Otherwise, it's a section code like A00 or 001.
       */
      section: string | Day
      /** Null if TBA. */
      time: {
        /**
         * Sorted array of numbers 0-6 representing days of the week. 0 is
         * Sunday.
         */
        days: number[]
        /** In minutes since the start of the day. */
        start: number
        /** In minutes since the start of the day. */
        end: number
      } | null
      /** Null if TBA. */
      location: {
        /** https://registrar.ucsd.edu/StudentLink/bldg_codes.html */
        building: string
        room: string
      } | null
      /**
       * Empty if taught by Staff.
       *
       * Note that for exams and courses with multiple lecture times,
       * ScheduleOfClasses doesn't repeat the instructor, so this array will
       * also be empty.
       */
      instructors: [firstName: string, lastName: string][]
      note?: string
    }
  | {
      cancelled: true
      selectable: {
        id: number
      } | null
      type: string
      section: string
      note?: string
    }

/** `month` is 1-indexed. */
export type DateTuple = [year: number, month: number, date: number]

export type ScrapedCourse = {
  subject: string
  subjectName: string
  number: string
  title: string
  /** Seminar classes (e.g. CSE 291) list their topic under the course title. */
  description?: string
  /**
   * The path to the course's entry in the course catalog, e.g.
   * `/courses/CSE.html#cse11`. Some courses, such as S123 ANBI 143GS, link to
   * https://registrar.ucsd.edu/studentlink/cnd.html which says that it is not
   * in the course catalog. Others just don't have links at all (e.g. FA23 ANES
   * 227). FA23 SPPS 201 links to http://pharmacy.ucsd.edu/current, which isn't
   * in the course catalog.
   */
  catalog?: string
  /** https://students.ucsd.edu/_files/registrar/restriction-codes.html */
  restriction: string[]
  note?: string
  /**
   * A range of selectable units from `from` to `to` (inclusive) in increments
   * of `inc`.
   *
   * NOTE: `inc` may be 0.5.
   */
  units: { from: number; to: number; inc: number }
  /**
   * Guaranteed to be populated for summer terms. Each date range corresponds to
   * group.
   */
  dateRanges: [DateTuple, DateTuple][]
  sections: ScrapedSection[]
}

const BASE = 'https://act.ucsd.edu/scheduleOfClasses'

// https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm?selectedTerm=SP23&selectedSubjects=CAT&selectedSubjects=SYN&page=1
const getUrl = (term: string, departments: string[], page: number) =>
  `${BASE}/scheduleOfClassesStudentResult.htm?${new URLSearchParams([
    ['selectedTerm', term],
    ['tabNum', 'tabs-dept'],
    ['_selectedSubjects', '1'],
    ['schedOption1', 'true'],
    ['_schedOption1', 'on'],
    ['_schedOption11', 'on'],
    ['_schedOption12', 'on'],
    ['schedOption2', 'true'],
    ['_schedOption2', 'on'],
    ['_schedOption4', 'on'],
    ['_schedOption5', 'on'],
    ['_schedOption3', 'on'],
    ['_schedOption7', 'on'],
    ['_schedOption8', 'on'],
    ['_schedOption13', 'on'],
    ['_schedOption10', 'on'],
    ['_schedOption9', 'on'],
    ['schDay', 'M'],
    ['_schDay', 'on'],
    ['schDay', 'T'],
    ['_schDay', 'on'],
    ['schDay', 'W'],
    ['_schDay', 'on'],
    ['schDay', 'R'],
    ['_schDay', 'on'],
    ['schDay', 'F'],
    ['_schDay', 'on'],
    ['schDay', 'S'],
    ['_schDay', 'on'],
    ['schStartTime', '12:00'],
    ['schStartAmPm', '0'],
    ['schEndTime', '12:00'],
    ['schEndAmPm', '0'],
    ...departments.map(department => ['selectedDepartments', department]),
    ['page', String(page)]
  ])}`

type SubjectList = {
  code: string
  value: string
}[]

const expectedSumSessName: Record<string, string> = {
  S1: 'Sum Sess I',
  S2: 'Sum Ses II',
  S3: 'SpecSumSes',
  SU: 'Summer Qtr'
}
const months = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export type CourseIteratorOptions = {
  /** Start page. Default: 1 */
  start: number
  /** Whether to print progress status to stderr. Default: false */
  progress: boolean
}
export type ResultRow = {
  /** 1-indexed */
  page: number
  pages: number
} & (
  | { type: 'course'; item: Omit<ScrapedCourse, 'sections' | 'dateRanges'> }
  | { type: 'section'; item: ScrapedSection }
  | { type: 'date-range'; item: [DateTuple, DateTuple] }
)
type NoteState =
  | { type: 'none' }
  | { type: 'expect-note'; number: string }
  | { type: 'note'; number: string; content: string }
  | { type: 'note-taken' }
/** Maximum requests to be made at once. */
const MAX_CONC_REQS = 10
export async function * getCourseIterator (
  term: string,
  {
    start: startPage = 1,
    progress = false
  }: Partial<CourseIteratorOptions> = {}
): AsyncGenerator<ResultRow> {
  const departments = await fetch(
    `${BASE}/department-list.json?${new URLSearchParams([
      ['selectedTerm', term]
    ])}`
  )
    .then(r => r.json())
    .then((json: SubjectList) => json.map(({ code }) => code))

  const fetchPage = async (page: number) => {
    const document = await fetchHtml(getUrl(term, departments, page))
    return {
      page,
      form:
        document.getElementById('socDisplayCVO') ??
        unwrap(
          new Error(
            `Missing results wrapper for ${getUrl(term, departments, page)}`
          )
        ),
      url: getUrl(term, departments, page)
    }
  }
  const responseQueue = [fetchPage(startPage)]
  const pageCount = parseNatural(
    (await responseQueue[0]).form.children[6]
      .querySelector('td[align="right"]')
      ?.textContent.match(/\(\d+\sof\s(\d+)\)/)?.[1] ??
      unwrap(new Error('Missing total page count'))
  )
  let fetchedPage = startPage
  const fetchNext = () => {
    fetchedPage++
    if (fetchedPage > pageCount) {
      return
    }
    const promise = fetchPage(fetchedPage)
    responseQueue.push(promise)
    promise.then(fetchNext)
  }
  for (let i = 0; i < MAX_CONC_REQS; i++) {
    fetchNext()
  }

  let subject: string | null = null
  let subjectName = ''
  let lastNumber: string | null = null
  let noteState: NoteState = { type: 'none' }
  while (responseQueue.length > 0) {
    const { page, form, url } = await responseQueue.shift()!
    console.error('>', url)

    const rows =
      form.querySelector('.tbrdr')?.children[1].children ??
      unwrap(new Error('Missing results table'))
    for (const row of rows) {
      // Course header, but with less info, which precedes red notes
      if (row.querySelector('.crsheader') && row.children.length === 3) {
        if (noteState.type === 'none') {
          noteState = {
            type: 'expect-note',
            number: row.children[1].textContent
          }
        } else {
          throw new TypeError(
            `Invalid state '${noteState.type}' for a reduced-info course header.`
          )
        }
        continue
      }

      // Red notes describe a course.
      if (row.querySelector('.nonenrtxt') && row.children.length === 2) {
        if (noteState.type === 'expect-note') {
          noteState = {
            type: 'note',
            number: noteState.number,
            content: row.children[1].textContent.trim().replaceAll(/\s+/g, ' ')
          }
        } else {
          throw new TypeError(`Invalid state '${noteState.type}' for a note.`)
        }
        continue
      } else if (noteState.type === 'expect-note') {
        throw new TypeError(
          'Expected a note after a reduced-info course header.'
        )
      }

      // Black notes describe a section. You can see examples for S123 COMM
      // 101T and cancelled CSE sections in FA95. They describe the section
      // row before it.
      if (row.className === 'nonenrtxt' && row.children.length === 2) {
        if (noteState.type === 'note-taken') {
          noteState = { type: 'none' }
        } else {
          console.warn(subject, lastNumber)
          throw new TypeError(`Invalid state '${noteState.type}' for a note.`)
        }
        continue
      }

      // Heading with subject code
      const subjectHeading = row.querySelector('h2')
      if (subjectHeading) {
        const heading = subjectHeading.textContent
          .trim()
          .replaceAll(/\s+/g, ' ')
        const match = heading.match(/^(.+) \(([A-Z]+) ?\)$/)
        if (match) {
          if (match[2] !== subject) {
            subjectName = match[1]
            subject = match[2]
            lastNumber = null
          }
        } else if (heading.endsWith(')')) {
          throw new SyntaxError(`Couldn't parse subject heading:\n${heading}`)
        }
        continue
      }

      // Row with course title and units
      if (row.querySelector('.crsheader') && row.children.length === 4) {
        if (!subject) {
          throw new Error('No subject')
        }
        const courseInfo = row.children[2].textContent
          .trim()
          .replaceAll(/\s+/g, ' ')
        const dateRangeMatch = courseInfo.match(
          / ?(?:(Sum Sess I|Sum Ses II|SpecSumSes|Summer Qtr) (\d+))?: ([A-Z][a-z]*) (\d+) (\d+) - ([A-Z][a-z]*) (\d+) (\d+)$/
        )
        // Check that date only shows for summer quarters
        if (term[0] === 'S' && term[1] !== 'P') {
          if (dateRangeMatch) {
            if (
              dateRangeMatch[1] &&
              expectedSumSessName[term.slice(0, 2)] !== dateRangeMatch[1]
            ) {
              throw new RangeError(
                `For term ${term}, this date range says ${dateRangeMatch[1]}.`
              )
            }
            if (!months.includes(dateRangeMatch[3])) {
              throw new RangeError(`${dateRangeMatch[3]} is not a month.`)
            }
            if (!months.includes(dateRangeMatch[6])) {
              throw new RangeError(`${dateRangeMatch[6]} is not a month.`)
            }
          } else {
            throw new SyntaxError(
              'Missing summer session date range\n' + courseInfo
            )
          }
        } else if (dateRangeMatch) {
          throw new TypeError(
            'Why does a non-summer quarter have a summer session date range?'
          )
        }

        const number = row.children[1].textContent
        const note =
          noteState.type === 'note'
            ? noteState.number === number
              ? noteState.content
              : unwrap(
                new TypeError(
                  `The note was intended for ${noteState.number} but instead was received by ${number}.`
                )
              )
            : undefined
        noteState = { type: 'none' }
        const catalogUrl = row.children[2]
          .querySelector('a')
          ?.getAttribute('href')
          ?.slice(26, -2)
        const catalog =
          !catalogUrl ||
          catalogUrl === 'http://registrar.ucsd.edu/studentlink/cnd.html'
            ? undefined
            : catalogUrl?.startsWith('http://www.ucsd.edu/catalog/')
              ? catalogUrl.replace('http://www.ucsd.edu/catalog', '')
              : catalogUrl
        const restriction = row.children[0].textContent.trim()
        // ( 2 Units)
        // ( 2 /4 by 2 Units)
        // ( 1 -4 Units)
        // ( 1 /5 by 0.5 Units) [SP23 BIOM 231]
        // ( 2.5 Units) [SP23 LIAB 1C]
        const unitMatch =
          courseInfo.match(
            /^(.+) \( (\d+)(\.5)?(?: [/-](\d+)(?: by (\d+)(\.5)?)?)? Units\) ?/
          ) ?? unwrap(new SyntaxError('Missing "(N units)"\n' + courseInfo))
        const title = unitMatch[1]
        const from = parseNatural(unitMatch[2]) + (unitMatch[3] ? 0.5 : 0)
        const to = unitMatch[4] ? parseNatural(unitMatch[4]) : null
        const inc = unitMatch[5]
          ? parseNatural(unitMatch[5]) + (unitMatch[6] ? 0.5 : 0)
          : null
        if (progress) {
          print(
            `\r${subject} ${number}`.padEnd(60, ' ') +
              `${page}/${pageCount}`.padStart(20, ' ')
          )
        }
        const description = courseInfo.slice(
          unitMatch[0].length,
          dateRangeMatch?.index
        )
        yield {
          page,
          pages: pageCount,
          type: 'course',
          item: {
            subject,
            subjectName,
            number,
            title,
            description: description || undefined,
            catalog,
            restriction: restriction ? restriction.split(/\s+/) : [],
            note,
            units: { from, to: to ?? from, inc: inc ?? 1 }
          }
        }
        lastNumber = number

        const dateRange: [DateTuple, DateTuple] | undefined = dateRangeMatch
          ? [
            [
              +dateRangeMatch[5],
              months.indexOf(dateRangeMatch[3]),
              +dateRangeMatch[4]
            ],
            [
              +dateRangeMatch[8],
              months.indexOf(dateRangeMatch[6]),
              +dateRangeMatch[7]
            ]
          ]
          : undefined
        if (dateRange) {
          yield {
            page,
            pages: pageCount,
            type: 'date-range',
            item: dateRange
          }
        }

        continue
      }

      // A section (meeting)
      if (row.className === 'sectxt' || row.className === 'nonenrtxt') {
        const tds = Array.from(row.children, td => td.textContent.trim())
        let instructor: Element | null = row.children[9]
        // Manipulate the <td>s so each section row is somewhat consistent
        if (row.className === 'nonenrtxt') {
          // .nonenrtxt is used mostly for exams, but it's also used for
          // sections with multiple lectures (eg SP23 BENG 100). It appears as
          // white rather than lavender and doesn't repeat the instructor name.
          // The location may be different too.
          if (tds.length !== 10 && tds.length !== 5) {
            // 5 cells for cancelled sections (FA95 CSE sections)
            throw new RangeError(
              `This white section row has ${tds.length} cells.`
            )
          }
          tds.unshift('')
          tds.splice(9, 0, 'Staff')
          instructor = row.children[8]
        } else if (tds.length === 10) {
          // Replace the colspan TBA with four TBA cells
          tds.splice(6, 0, 'TBA', 'TBA', 'TBA')
          instructor = row.children[6]
        } else if (tds.length !== 13 && tds.length !== 6) {
          // 6 cells for cancelled sections (S123 BIPN 194)
          throw new RangeError(
            `This purple section row has ${tds.length} cells.`
          )
        }

        // Black notes describe sections.
        let note: string | undefined
        if (
          row.nextElementSibling?.className === 'nonenrtxt' &&
          row.nextElementSibling.children.length === 2
        ) {
          noteState = { type: 'note-taken' }
          note = row.nextElementSibling.children[1].textContent
            .trim()
            .replaceAll(/\s+/g, ' ')
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
          if (sectionCodeOrDate.includes('/')) {
            console.error(
              'cancelled section is date',
              subject,
              lastNumber,
              sectionCodeOrDate
            )
          }
          yield {
            page,
            pages: pageCount,
            type: 'section',
            item: {
              cancelled: true,
              selectable:
                sectionId !== ''
                  ? {
                    id: parseNatural(sectionId)
                  }
                  : null,
              type: meetingType,
              section: sectionCodeOrDate,
              note
            }
          }
          continue
        }
        if (!/^(?:(?:Sun|T[uh]|[MWFS])+|TBA)$/.test(days)) {
          throw new SyntaxError(`Unexpected days format "${days}"`)
        }
        if (lastNumber === null) {
          throw new Error('Section does not belong to a course')
        }
        if (progress) {
          print(
            `\r${subject} ${lastNumber}: ${meetingType} ${
              sectionCodeOrDate.includes('/') ? 'exam' : sectionCodeOrDate
            }`.padEnd(60, ' ') + `${page}/${pageCount}`.padStart(20, ' ')
          )
        }
        yield {
          page,
          pages: pageCount,
          type: 'section',
          item: {
            cancelled: false,
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
            instructors: Array.from(instructor.querySelectorAll('a'), td => {
              const [last, first] = td.textContent.trim().split(', ')
              return [first, last]
            }),
            note
          }
        }
        continue
      }

      // Header row
      if (row.querySelector('.ubrdr')) {
        continue
      }

      throw new TypeError(
        `Unknown row type:\n${row.outerHTML.replaceAll(/\s+/g, ' ')}`
      )
    }
  }
  if (progress) {
    print('\r'.padEnd(80, ' '))
    print('\r')
  }
}

export type ScrapedResult = {
  scrapeTime: number
  /**
   * NOTE: The same course code may appear multiple times (with potentially
   * different `units` and `description`).
   */
  courses: ScrapedCourse[]
}

export async function getCourses (
  term: string,
  progress = false
): Promise<ScrapedResult> {
  const courses: ScrapedCourse[] = []
  for await (const { type, item } of getCourseIterator(term, { progress })) {
    if (type === 'course') {
      courses.push({ ...item, sections: [], dateRanges: [] })
    } else if (type === 'section') {
      courses[courses.length - 1].sections.push(item)
    } else {
      courses[courses.length - 1].dateRanges.push(item)
    }
  }
  return {
    scrapeTime: Date.now(),
    courses
  }
}

export async function readCourses (path: string | URL): Promise<ScrapedResult> {
  return JSON.parse(await Deno.readTextFile(path), (key, value) =>
    key === 'section' && value.length > 3
      ? Day.parse(value)
      : key === 'capacity' && value === null
        ? Infinity
        : value
  )
}

if (import.meta.main) {
  if (Deno.args.length < 1 || Deno.args.length > 2) {
    console.error(
      'Usage: deno run --allow-net scheduleofclasses/scrape.ts [term code] (start page) > courses.json'
    )
    Deno.exit(64)
  }

  const [term, start = '1'] = Deno.args
  let first = start === '1'
  let course: ScrapedCourse | null = null
  if (start === '1') {
    const metadata: Omit<ScrapedResult, 'courses'> = {
      scrapeTime: Date.now()
    }
    console.log(JSON.stringify(metadata).slice(0, -1))
    console.log(', "courses":')
  }
  for await (const { type, item } of getCourseIterator(term, {
    start: +start,
    progress: true
  })) {
    if (type === 'course') {
      console.error(type, item.subject, item.number, item.description)
      if (course) {
        console.log((first ? '[ ' : ', ') + JSON.stringify(course, null, '\t'))
        first = false
      }
      course = { ...item, sections: [], dateRanges: [] }
    } else if (type === 'section') {
      console.error(type, item.section.toString(), item.type)
      if (course) {
        course.sections.push(item)
      } else {
        console.error('?? Received `section` before course')
      }
    } else {
      console.error(type, item)
      if (course) {
        course.dateRanges.push(item)
      } else {
        console.error('?? Received `date-range` before course')
      }
    }
  }
  if (course) {
    console.log((first ? '[ ' : ', ') + JSON.stringify(course, null, '\t'))
  }
  console.log(']}')
}
