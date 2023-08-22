import { Quarter, termCode } from '../../terms/index.ts'
import {
  coursesFromFile,
  CourseFormatError,
  TermCourses
} from './coursesFromFile.ts'

export type Term = {
  year: number
  quarter: Quarter
}

/**
 * Represents a term result that was unintentionally not retrieved.
 * - `unavailable` means the term data successfully loaded.
 * - `offline` means the term data failed to load.
 */
export type TermError = {
  type: 'unavailable' | 'offline'
  request: Term
}
export type TermSuccess = {
  request: Term
  result: TermCourses
}
export type TermResults = {
  successes: TermSuccess[]
  errors: TermError[]
}

export class TermCache {
  #cache: Record<string, TermCourses | 'unavailable' | undefined> = {}

  async #fetch (
    term: string,
    summer: boolean
  ): Promise<TermCourses | 'unavailable'> {
    const response = await fetch(`../data/classrooms-${term}.txt`)
    if (response.ok) {
      try {
        return coursesFromFile(await response.text(), summer)
      } catch (error) {
        // If the format is unexpected, then maybe I changed the format and the
        // web page is out of date
        if (error instanceof CourseFormatError) {
          window.location.reload()
        }
        throw error
      }
    } else if (response.status === 404) {
      return 'unavailable'
    } else {
      throw new Error(`HTTP ${response.status} error`)
    }
  }

  #term ({ year, quarter }: Term, full: boolean): string {
    return full ? `${termCode(year, quarter)}-full` : termCode(year, quarter)
  }

  #request (
    request: Term,
    full = false
  ): TermSuccess | TermError | Promise<TermSuccess | TermError> {
    const termId = this.#term(request, full)
    const cached = this.#cache[termId] ?? this.#cache[this.#term(request, true)]
    if (cached === 'unavailable') {
      return { type: 'unavailable', request }
    } else if (cached) {
      return { request, result: cached }
    } else {
      // Only S3 has relevant date ranges (well, and SU I guess)
      return this.#fetch(termId, request.quarter === 'S3')
        .then((result): TermSuccess | TermError => {
          this.#cache[termId] = result
          return result === 'unavailable'
            ? { type: 'unavailable', request }
            : { request, result }
        })
        .catch(() => ({ type: 'offline', request }))
    }
  }

  #partition (results: (TermSuccess | TermError)[]): TermResults {
    const successes: TermSuccess[] = []
    const errors: TermError[] = []
    for (const result of results) {
      if ('result' in result) {
        successes.push(result)
      } else {
        errors.push(result)
      }
    }
    return { successes, errors }
  }

  requestTerms (
    requests: Term[],
    full = false
  ): TermResults | Promise<TermResults> {
    const rawResults = requests.map(request => this.#request(request, full))
    const allCached = rawResults.every(
      (result): result is TermSuccess | TermError =>
        !(result instanceof Promise)
    )
    if (allCached) {
      return this.#partition(rawResults)
    } else {
      return Promise.all(rawResults).then(results => this.#partition(results))
    }
  }
}
