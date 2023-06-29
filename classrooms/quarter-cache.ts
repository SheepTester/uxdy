import { Course } from '../scheduleofclasses/group-sections.ts'
import { Season, termCode } from '../terms/index.ts'
import { CourseFormatError, coursesFromFile } from './from-file.ts'

export class QuarterCache {
  #cache: Record<string, Course[] | 'none'> = {}

  async #fetch (term: string): Promise<Course[] | 'none'> {
    const response = await fetch(`./classrooms-${term}.txt`)
    if (response.ok) {
      try {
        return coursesFromFile(await response.text())
      } catch (error) {
        // If the format is unexpected, then maybe I changed the format and the
        // web page is out of date
        if (error instanceof CourseFormatError) {
          window.location.reload()
        }
        throw error
      }
    } else if (response.status === 404) {
      return 'none'
    } else {
      throw new Error(`HTTP ${response.status} error`)
    }
  }

  async get (year: number, season: Season): Promise<Course[] | null> {
    const term = termCode(year, season)
    this.#cache[term] ??= await this.#fetch(term)
    const courses = this.#cache[term]
    return courses === 'none' ? null : courses
  }
}
