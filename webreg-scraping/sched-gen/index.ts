// deno bundle sched-gen/index.ts | sed 's/import.meta.main/true/g' - > sched-gen/index.js

import { InstructionCodes } from '../meeting-types.ts'
import { Scraper } from '../scrape.ts'

function * permute<T> (optionsList: T[][]): Generator<T[], void> {
  if (optionsList.length === 0) {
    yield []
    return
  }
  const [options, ...rest] = optionsList
  for (const option of options) {
    for (const others of permute(rest)) {
      yield [option, ...others]
    }
  }
}

/**
 * Represents a desired course. Could either be just a course code, or an object
 * specifying more options.
 */
type WantedCourse =
  | string
  | {
      /** The course code. */
      code: string

      /**
       * A list of section codes, of which at least one must be present in the
       * schedule's meetings.
       */
      includesSection?: string | string[]

      /**
       * List of section types to ignore for schedule conflicts or preferences.
       */
      ignoreSection?: InstructionCodes | InstructionCodes[]
    }

type NormalizedCourse = {
  code: string
  includesSection: string[]
  ignoreSection: InstructionCodes[]
}

type ScheduleOptions = {
  /**
   * Whether to only have RCLAS sections (true), no RCLAS sections (false), or
   * no preference (undefined).
   */
  remote?: boolean
}

async function generateSchedules (
  term: string,
  wantedCourses: WantedCourse[],
  { remote }: ScheduleOptions = {}
) {
  const scraper = new Scraper(term)
  const rawCourses = await scraper.courses()
  const courseOptions = []
  for (const wantedCourse of wantedCourses) {
    const normCourse: NormalizedCourse =
      typeof wantedCourse === 'string'
        ? { code: wantedCourse, includesSection: [], ignoreSection: [] }
        : {
            code: wantedCourse.code,
            includesSection:
              typeof wantedCourse.includesSection === 'string'
                ? [wantedCourse.includesSection]
                : wantedCourse.includesSection ?? [],
            ignoreSection:
              typeof wantedCourse.ignoreSection === 'string'
                ? [wantedCourse.ignoreSection]
                : wantedCourse.ignoreSection ?? []
          }
    const [subjectCode, courseCode] = normCourse.code.split(' ')
    const course = await scraper.getCourse(subjectCode, courseCode, rawCourses)
    const options = Object.values(course.getOptions()).filter(
      ({ section, otherMeetings }) =>
        [section, ...otherMeetings].some(meeting =>
          normCourse.includesSection.includes(meeting.code)
        )
    )
    courseOptions.push(options)
  }
  // Fewer options first
  courseOptions.sort((a, b) => a.length - b.length)

  for (const schedule of permute(courseOptions)) {
    //
  }
}

if (import.meta.main) {
  await generateSchedules(
    'SP22',
    [
      { code: 'CAT 3', includesSection: 'A00' },
      { code: 'ECE 45', ignoreSection: 'DI' },
      { code: 'CSE 30', ignoreSection: 'DI' },
      { code: 'MATH 20D', ignoreSection: 'DI' },
      { code: 'CSE 21', ignoreSection: ['DI', 'LE'] }
    ],
    { remote: false }
  )
}
