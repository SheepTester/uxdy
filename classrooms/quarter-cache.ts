import { Course } from '../scheduleofclasses/group-sections.ts'
import { Season, termCode } from '../terms/index.ts'
import { CourseFormatError, coursesFromFile } from './from-file.ts'

export class QuarterCache {
  #cache: Record<string, Course[]> = {}

  async get (year: number, season: Season): Promise<Course[]> {
    const term = termCode(year, season)
    this.#cache[term] ??= await fetch(`./classrooms-${term}.txt`)
      .then(r =>
        r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status} error`))
      )
      .then(coursesFromFile)
      .catch(err => {
        // If the format is unexpected, then maybe I changed the format and the
        // web page is out of date
        if (err instanceof CourseFormatError) {
          window.location.reload()
        }
        return Promise.reject(err)
      })
    return this.#cache[term]
  }
}
