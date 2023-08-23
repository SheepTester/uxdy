/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useMemo, useState } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { buildings } from '../../lib/buildings.ts'

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
        { code, in: 'name', ...score(buildings[code].name, query) }
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
    return null
  }
  return (
    <ul class='results'>
      {results.courses.map(course => (
        <li key={`course\t${course.code}\t${course.in}`}>{course.code}</li>
      ))}
      {results.professors.map(professor => (
        <li
          key={`course\t${professor.first}, ${professor.last}\t${professor.order}`}
        >
          {professor.first} {professor.last}
        </li>
      ))}
      {results.buildings.map(building => (
        <li key={`course\t${building.code}\t${building.in}`}>
          {building.code}
        </li>
      ))}
    </ul>
  )
}
