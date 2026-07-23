/**
 * @file
 * usage: node tss/enrollment-data.ts
 */

import { readFile, writeFile } from 'node:fs/promises'
import type { AllCourses, SectionId } from './index.ts'

const SEPERATOR = '\t'

type ParsedCsv = {
  header: string[]
  rows: Map<SectionId, string[]>
}

function parseCsv (csv: string): ParsedCsv {
  const [[_, ...header], ...rows] = csv
    .trim()
    .split(/\r?\n/)
    .values()
    .map(line => line.split(SEPERATOR))
  return {
    header,
    rows: new Map(
      rows.values().map(([sectionId, ...row]) => [sectionId as SectionId, row])
    )
  }
}

function serializeCsv (csv: ParsedCsv): string {
  let result = `Section ID${SEPERATOR}${csv.header.join(SEPERATOR)}\n`
  for (const [sectionId, row] of Array.from(csv.rows).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    result += `${sectionId}${SEPERATOR}${row.join(SEPERATOR)}\n`
  }
  return result
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
  if (stalenessDate.includes(SEPERATOR)) {
    throw new Error('Staleness date contains separator')
  }
  let index = csv.header.indexOf(stalenessDate)
  if (index === -1) {
    index = csv.header.length
    csv.header.push(stalenessDate)
  }
  for (const row of csv.rows.values()) {
    while (row.length < csv.header.length) {
      row.push('')
    }
  }
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
