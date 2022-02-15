// deno bundle sched-gen/index.ts | sed 's/import.meta.main/true/g' - > sched-gen/index.js

import { Scraper } from '../scrape.ts'

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
    }

type NormalizedCourse = {
  code: string
  includesSection: string[]
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
  const courses: NormalizedCourse[] = wantedCourses.map(course =>
    typeof course === 'string'
      ? { code: course, includesSection: [] }
      : {
          code: course.code,
          includesSection:
            typeof course.includesSection === 'string'
              ? [course.includesSection]
              : course.includesSection ?? []
        }
  )
}

if (import.meta.main) {
  await generateSchedules(
    'SP22',
    [{ code: 'CAT 3', includesSection: 'A00' }, 'ECE 45', 'CSE 30', 'MATH 20D'],
    {
      remote: false
    }
  )
}
