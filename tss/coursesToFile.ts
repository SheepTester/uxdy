/**
 * @file
 * Same format as classrooms/scripts/coursesToFile.ts
 */

import type { Course } from './index.ts'

function isInPerson () {
  //
}

export type CourseToFileOptions = {
  scrapeTime: number
  buildingsOnly: boolean
}
export function * coursesToFile (
  courses: Record<`${string}-${string}`, Course>,
  { scrapeTime, buildingsOnly }: CourseToFileOptions
): Generator<string> {
  yield `V4${scrapeTime}\n`
  for (const { class_name, course_title, sections } of Object.values(courses)) {
    const groups = Map.groupBy(
      sections,
      section => section.section_code.split('-')[0]
    )
  }
}
