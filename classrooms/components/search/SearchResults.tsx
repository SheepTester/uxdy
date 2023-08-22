/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Course } from '../../../scheduleofclasses/group-sections.ts'

export type SearchData = {
  courses: Course[]
  professors: string[]
  buildings: string[]
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
  return (
    <ul>
      <li>{query}</li>
      <li>{data.courses.length}</li>
      <li>{data.professors.length}</li>
      <li>{data.buildings.length}</li>
    </ul>
  )
}
