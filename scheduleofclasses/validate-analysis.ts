import { red } from 'https://deno.land/std@0.177.0/fmt/colors.ts'
import { Course as ScrapedCourse } from './scrape.ts'

const term = 'SP23'

const courses: ScrapedCourse[] = JSON.parse(
  await Deno.readTextFile(`./scheduleofclasses/terms/${term}.json`),
  (key, value) =>
    key === 'section' && value.endsWith('T00:00:00.000Z')
      ? new Date(value)
      : value
)

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
          `${red('DIFF')}: ${course.subject} ${course.number} ${
            section.section
          } is taught by ${instructors}, not ${ref[letter]}.`
        )
      }
    }
  }
}
