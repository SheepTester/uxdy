/**
 * @file
 * usage: node tss/enrollment-data.ts
 */

import { readFile, writeFile } from 'node:fs/promises'
import type { AllCourses, SectionId } from './index.ts'

export const SEPARATOR = '\t'

export type ParsedCsv = {
  header: string[]
  rows: Map<SectionId, string[]>
}

export function parseCsv (csv: string): ParsedCsv {
  const [[_, ...header], ...rows] = csv
    .trim()
    .split(/\r?\n/)
    .values()
    .map(line => line.split(SEPARATOR))
  return {
    header,
    rows: new Map(
      rows.values().map(([sectionId, ...row]) => [sectionId as SectionId, row])
    )
  }
}

export function serializeCsv (csv: ParsedCsv): string {
  let result = `Section ID${SEPARATOR}${csv.header.join(SEPARATOR)}\n`
  for (const [sectionId, row] of Array.from(csv.rows).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    result += `${sectionId}${SEPARATOR}${row.join(SEPARATOR)}\n`
  }
  return result
}

export function registerHeader (csv: ParsedCsv, headerText: string): number {
  let index = csv.header.indexOf(headerText)
  if (index === -1) {
    index = csv.header.length
    csv.header.push(headerText)
  }
  for (const row of csv.rows.values()) {
    while (row.length < csv.header.length) {
      row.push('')
    }
  }
  return index
}

function mergeIntoCsv (csv: ParsedCsv, courses: AllCourses): void {
  const stalenessDates = new Set(
    courses.values().map(course => course.seat_freshness.label)
  )
  if (stalenessDates.size !== 1) {
    throw new Error(
      `Multiple staleness dates: ${Array.from(stalenessDates).join(', ')}`
    )
  }
  const [stalenessDate] = stalenessDates
  if (stalenessDate.includes(SEPARATOR)) {
    throw new Error('Staleness date contains separator')
  }
  const index = registerHeader(csv, stalenessDate)
  for (const course of courses.values()) {
    for (const section of course.sections) {
      csv.rows.getOrInsertComputed(section.section_id, () =>
        csv.header.map(() => '')
      )[index] = section.seats
    }
  }
}

if (import.meta.main) {
  const csv = parseCsv(
    await readFile('tss/enrollment-data.tsv', 'utf-8').catch(error =>
      Error.isError(error) && 'code' in error && error.code === 'ENOENT'
        ? ''
        : Promise.reject(error)
    )
  )
  mergeIntoCsv(
    csv,
    new Map(
      Object.entries(JSON.parse(await readFile('tss/courses.json', 'utf-8')))
    ) as AllCourses
  )
  await writeFile('tss/enrollment-data.tsv', serializeCsv(csv))
}
