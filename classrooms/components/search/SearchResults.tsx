/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useMemo } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { buildings } from '../../lib/buildings.ts'
import { SearchResult } from './SearchResult.tsx'

export type SearchData = {
  courses: Course[]
  professors: { first: string; last: string }[]
  buildings: string[]
}

type ResultScore = {
  score: number
}

type CourseResult = Course & { in: 'code' | 'title' } & ResultScore
type ProfessorResult = {
  first: string
  last: string
  order: 'forward' | 'reverse'
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
    return { score: 3 }
  }
  if (string.startsWith(query)) {
    return { score: 2 }
  }
  if (string.includes(query)) {
    return { score: 1 }
  }
  return { score: 0 }
}

function sortResults<T extends ResultScore> (results: T[]): T[] {
  // TODO: Remove duplicates
  return results
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function search (data: SearchData, query: string): SearchResults {
  if (query === '') {
    return { courses: [], buildings: [], professors: [] }
  }
  return {
    courses: sortResults(
      data.courses.flatMap(course => [
        { ...course, in: 'code', ...score(course.code, query) },
        { ...course, in: 'title', ...score(course.title, query) }
      ])
    ),
    professors: sortResults(
      data.professors.flatMap(({ first, last }) => [
        { first, last, order: 'forward', ...score(`${first} ${last}`, query) },
        { first, last, order: 'reverse', ...score(`${last}, ${first}`, query) }
      ])
    ),
    buildings: sortResults(
      data.buildings.flatMap(code => [
        { code, in: 'code', ...score(code, query) },
        { code, in: 'name', ...score(buildings[code]?.name ?? '', query) }
      ])
    )
  }
}

export type View = {
  type: 'course' | 'professor' | 'building'
  id: string
}

export type SearchResultsProps = {
  query: string
  data: SearchData
  onSelect: (view: View) => void
}
export function SearchResults ({ query, data }: SearchResultsProps) {
  const results = useMemo(
    () => search(data, query.toLowerCase()),
    [query, data]
  )
  const length =
    results.courses.length +
    results.professors.length +
    results.buildings.length
  if (length === 0) {
    if (query === '') {
      return null
    } else {
      return <p class='no-results'>No results.</p>
    }
  }
  return (
    <ul class='results'>
      {results.courses.length > 0 && <li class='result-heading'>Courses</li>}
      {results.courses.map(course => (
        <SearchResult
          name={course.title}
          code={course.code}
          primary={course.in === 'code' ? 'code' : 'name'}
          key={`course\t${course.code}\t${course.in}`}
        />
      ))}
      {results.professors.length > 0 && (
        <li class='result-heading'>Professors</li>
      )}
      {results.professors.map(professor => (
        <SearchResult
          name={`${professor.last}, ${professor.first}`}
          primary='name'
          key={`course\t${professor.last}, ${professor.first}\t${professor.order}`}
        />
      ))}
      {results.buildings.length > 0 && (
        <li class='result-heading'>Buildings</li>
      )}
      {results.buildings.map(building => (
        <SearchResult
          name={buildings[building.code].name}
          code={building.code}
          primary={building.in === 'code' ? 'code' : 'name'}
          key={`course\t${building.code}\t${building.in}`}
        />
      ))}
    </ul>
  )
}
