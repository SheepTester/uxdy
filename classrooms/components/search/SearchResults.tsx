/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useMemo } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { termName } from '../../../terms/index.ts'
import { buildings } from '../../lib/buildings.ts'
import { Term } from '../../lib/TermCache.ts'
import { SearchResult } from './SearchResult.tsx'

export type SearchData = {
  courses: Course[]
  professors: { first: string; last: string }[]
  buildings: string[]
}

type ResultScore = {
  score: number
  match?: {
    start: number
    end: number
  }
}
type CourseResult = {
  code: string
  title: string
  in: 'code' | 'title'
} & ResultScore
type ProfessorResult = {
  first: string
  last: string
  order: 'forward' | 'reverse'
  /** The name displayed as `Last, First`. */
  id: string
} & ResultScore
type BuildingResult = { code: string; in: 'code' | 'name' } & ResultScore
type SearchResults = {
  courses: CourseResult[]
  professors: ProfessorResult[]
  buildings: BuildingResult[]
}

function score (string: string, query: string): ResultScore {
  if (string === '') {
    return { score: 0 }
  }
  string = string.toLocaleLowerCase()
  if (string === query) {
    return { score: 3, match: { start: 0, end: string.length } }
  }
  if (string.startsWith(query)) {
    return {
      score: 2 + (/\W/.test(string[query.length]) ? 0.5 : 0),
      match: { start: 0, end: query.length }
    }
  }
  const index = string.indexOf(query)
  if (index !== -1) {
    return {
      score:
        1 +
        (/\W/.test(string[index - 1]) &&
        (index + query.length === string.length ||
          /\W/.test(string[index + query.length]))
          ? 0.5
          : 0),
      match: { start: index, end: index + query.length }
    }
  }
  return { score: 0 }
}

/** The first parameter wins ties. */
function maxResult<T extends ResultScore> (a: T, b: T): T {
  return a.score >= b.score ? a : b
}

function sortResults<T extends ResultScore> (results: T[]): T[] {
  return results
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
}

function search (data: SearchData, query: string): SearchResults {
  if (query === '') {
    return { courses: [], buildings: [], professors: [] }
  }
  const results: SearchResults = {
    courses: sortResults(
      data.courses.map(course =>
        maxResult(
          { ...course, in: 'title', ...score(course.title, query) },
          { ...course, in: 'code', ...score(course.code, query) }
        )
      )
    ),
    professors: sortResults(
      data.professors.map(({ first, last }) => {
        const id = `${last}, ${first}`
        return maxResult(
          {
            first,
            last,
            id,
            order: 'forward',
            ...score(`${first} ${last}`, query)
          },
          { first, last, id, order: 'reverse', ...score(id, query) }
        )
      })
    ),
    buildings: sortResults(
      data.buildings.map(code =>
        maxResult(
          { code, in: 'name', ...score(buildings[code]?.name ?? '', query) },
          { code, in: 'code', ...score(code, query) }
        )
      )
    )
  }

  const sections =
    (results.courses.length > 0 ? 1 : 0) +
    (results.professors.length > 0 ? 1 : 0) +
    (results.buildings.length > 0 ? 1 : 0)
  const maxSectionLength = sections === 3 ? 5 : sections === 2 ? 7 : 12
  return {
    courses: results.courses.slice(0, maxSectionLength),
    professors: results.professors.slice(0, maxSectionLength),
    buildings: results.buildings.slice(0, maxSectionLength)
  }
}

export type View =
  | {
      type: 'course' | 'professor'
      id: string
    }
  | {
      type: 'building'
      id: string
      room?: string
    }

export type SearchResultsProps = {
  terms: Term[]
  query: string
  data: SearchData
  index: number | null
  onSelect: (view: View) => void
}
export function SearchResults ({
  terms,
  query,
  data,
  index,
  onSelect
}: SearchResultsProps) {
  const results = useMemo(
    () => search(data, query.toLowerCase()),
    [query, data]
  )
  const length =
    results.courses.length +
    results.professors.length +
    results.buildings.length
  index = index === null ? -1 : ((index % length) + length) % length
  if (length === 0) {
    if (query === '') {
      return null
    } else {
      return (
        <p class='no-results'>
          No results from&nbsp;
          {terms
            .map(({ year, quarter }) => termName(year, quarter))
            .join(' nor ')}
          .
        </p>
      )
    }
  }
  return (
    <div class='results'>
      {results.courses.length > 0 && <h2 class='result-heading'>Courses</h2>}
      {results.courses.map((course, i) => (
        <SearchResult
          name={course.title}
          code={course.code}
          primary={course.in === 'code' ? 'code' : 'name'}
          match={course.match}
          selected={i === index}
          onSelect={() => onSelect({ type: 'course', id: course.code })}
          key={`course\t${course.code}\t${course.in}`}
        />
      ))}
      {results.professors.length > 0 && (
        <h2 class='result-heading'>Professors</h2>
      )}
      {results.professors.map((professor, i) => (
        <SearchResult
          name={
            professor.order === 'forward'
              ? `${professor.first} ${professor.last}`
              : professor.id
          }
          primary='name'
          match={professor.match}
          selected={i + results.courses.length === index}
          onSelect={() => onSelect({ type: 'professor', id: professor.id })}
          key={`course\t${professor.id}\t${professor.order}`}
        />
      ))}
      {results.buildings.length > 0 && (
        <h2 class='result-heading'>Buildings</h2>
      )}
      {results.buildings.map((building, i) => (
        <SearchResult
          name={buildings[building.code].name}
          code={building.code}
          primary={building.in === 'code' ? 'code' : 'name'}
          match={building.match}
          selected={
            i + results.courses.length + results.professors.length === index
          }
          onSelect={() => onSelect({ type: 'building', id: building.code })}
          key={`course\t${building.code}\t${building.in}`}
        />
      ))}
    </div>
  )
}
