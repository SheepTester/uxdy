// deno bundle sched-gen/index.ts | sed 's/import.meta.main/true/g' - > sched-gen/index.js

import { InstructionCodes } from '../meeting-types.ts'
import { Group, LetterGroup, Scraper } from '../scrape.ts'

/**
 * @param scheduleSoFar Used to check for schedule conflicts. Doesn't actually
 * represent the schedule since it may have ignored sections omitted.
 * @yields sections guaranteed not to have any conflicts.
 */
function * permuteSchedule (
  [course, ...courses]: {
    letters: LetterGroup[]
    ignore: InstructionCodes[]
  }[],
  scheduleSoFar: Group[] = []
): Generator<Group[], void> {
  if (course === undefined) {
    yield []
    return
  }
  for (const letter of course.letters) {
    // If any of the other meetings conflicts with the schedule so far, then
    // none of the plannable sections are compatible either, and we can skip
    // early
    const otherMeetings = letter.otherMeetings.filter(
      section => !course.ignore.includes(section.instructionType)
    )
    if (
      letter.otherMeetings.some(meeting => meeting.intersects(scheduleSoFar))
    ) {
      continue
    }
    // TODO: Check exam times

    for (const plannable of letter.plannables) {
      const considerConflicts = !course.ignore.includes(
        plannable.instructionType
      )
      if (considerConflicts && plannable.intersects(scheduleSoFar)) {
        continue
      }
      for (const schedule of permuteSchedule(courses, [
        ...scheduleSoFar,
        ...otherMeetings,
        ...(considerConflicts ? [plannable] : [])
      ])) {
        yield [plannable, ...schedule]
      }
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
    const options = course.letters().filter(letterGroup => {
      if (normCourse.includesSection.length > 0) {
        // Ensure desired sections only
        if (
          letterGroup.otherMeetings.some(meeting =>
            normCourse.includesSection.includes(meeting.code)
          )
        ) {
          // Other meetings has at least one of the desired sections, so all of
          // the plannables pass.
        } else {
          // The other meetings don't have the desired section, so filter the
          // plannables to those with the code
          letterGroup.plannables = letterGroup.plannables.filter(section =>
            normCourse.includesSection.includes(section.code)
          )
          if (letterGroup.plannables.length === 0) {
            return false
          }
        }
      }
      if (remote !== undefined) {
        if (
          letterGroup.otherMeetings.every(
            section =>
              normCourse.ignoreSection.includes(section.instructionType) ||
              (section.time?.location?.building === 'RCLAS') === remote
          )
        ) {
          // Filter plannables
          letterGroup.plannables = letterGroup.plannables.filter(
            section =>
              normCourse.ignoreSection.includes(section.instructionType) ||
              (section.time?.location?.building === 'RCLAS') === remote
          )
          if (letterGroup.plannables.length === 0) {
            return false
          }
        } else {
          // There's a meeting that doesn't fit the remote preference. Shibai
          return false
        }
      }
      return true
    })
    courseOptions.push({
      options,
      total: options
        .map(option => option.plannables.length)
        .reduce((a, b) => a + b, 0),
      ignore: normCourse.ignoreSection
    })
  }
  // Fewer options first
  courseOptions.sort((a, b) => a.total - b.total)
  for (const schedule of permuteSchedule(
    courseOptions.map(({ options, ignore }) => ({ letters: options, ignore }))
  )) {
    console.log(schedule)
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
    ]
    //{ remote: false }
  )
}
