// deno run --allow-read scheduleofclasses/validate-analysis.ts

import { red } from 'std/fmt/colors.ts'
import { readCourses } from './scrape.ts'

const term = 'SP23'

const { courses } = await readCourses(`./scheduleofclasses/terms/${term}.json`)

const buildings: Record<string, number> = {}

// NOTES
// - SP23 BIPN 164: two instructors teach the lecture, but only one teaches the
//   discussions. This is such a rare exception (the only one in SP23) that I
//   will just assume they both teach the discussion.
// - SP23 SOMC 241: one instructor teaches the lecture, while another instructor
//   teaches the seminar and lab.

for (const course of courses) {
  const ref: Record<string, string> = {}
  for (const section of course.sections) {
    if (typeof section.section === 'string' && /^[A-Z]/.test(section.section)) {
      const letter = section.section[0]
      const instructors = section.instructors
        .map(([first, last]) => `${first} ${last}`)
        .join(', ')
      ref[letter] ??= instructors
      if (ref[letter] !== instructors) {
        console.log(
          `${red('diff instructors')}: ${course.subject} ${course.number} ${
            section.section
          } is taught by ${instructors}, not ${ref[letter]}.`
        )
      }
    }
    if (section.location?.building) {
      buildings[section.location.building] ??= 0
      buildings[section.location.building]++
    }
  }
}
// console.log(buildings)
