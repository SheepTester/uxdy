/**
 * @file
 * usage: node tss2/enrollment-data.ts
 * note: writes to enrollment-data.tsv in _tss/_
 */

import { readFile, writeFile } from 'fs/promises'
import {
  parseCsv,
  registerHeader,
  SEPARATOR,
  serializeCsv,
  type ParsedCsv
} from '../tss/enrollment-data.ts'
import type { SimplifiedSection } from './api.ts'

function mergeIntoCsv (csv: ParsedCsv, sections: SimplifiedSection[]): void {
  const earliestStalenessDate = new Date(
    sections.reduce(
      (cum, curr) =>
        curr.refreshDate !== null && curr.refreshDate < cum
          ? curr.refreshDate
          : cum,
      Infinity
    )
  ).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const stalenessDate = new Date(
    sections.reduce(
      (cum, curr) =>
        curr.refreshDate !== null && curr.refreshDate > cum
          ? curr.refreshDate
          : cum,
      0
    )
  ).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  console.error({ earliest: earliestStalenessDate, latest: stalenessDate })

  if (stalenessDate.includes(SEPARATOR)) {
    throw new Error('Staleness date contains separator')
  }
  const index = registerHeader(csv, stalenessDate)
  for (const section of sections) {
    // Apparently `seats` is available/enrolled
    csv.rows.getOrInsertComputed(section.sectionId, () =>
      csv.header.map(() => '')
    )[index] =
      `${Math.max(section.capacity - section.enrolled, 0)}/${section.capacity}${section.waitlist !== null ? `/${section.waitlist}` : ''}`
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
    JSON.parse(await readFile('tss2/sections-FA26.json', 'utf-8'))
  )
  await writeFile('tss/enrollment-data.tsv', serializeCsv(csv))
}
