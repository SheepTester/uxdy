// Create a Git-friendly set of files summarizing WebReg data
// deno run --allow-all track-classes.ts <UqZBpD3n> <jlinksessionidx>

import { ensureDir } from 'https://deno.land/std@0.125.0/fs/ensure_dir.ts'
import { writeAll } from 'https://deno.land/std@0.125.0/streams/conversion.ts'
import { AuthorizedGetter } from './scrape.ts'

const QUARTER = 'SP22'
const PROGBAR_LENGTH = 50

const encoder = new TextEncoder()
async function print (content: string) {
  await writeAll(Deno.stdout, encoder.encode(content))
}

await ensureDir('./webreg-data2/courses/')

type Enrollment = {
  enrolled: number
  capacity: number
  waitlist: number
}
type HistoryEntry = {
  date: string
  sectionEnrollments: Record<string, Enrollment | null>
}

class CourseHistory {
  entries: HistoryEntry[]

  constructor (entries: HistoryEntry[]) {
    this.entries = entries
  }

  toFile (sectionCodes = Object.keys(this.entries[0].sectionEnrollments)) {
    return [
      `DATE\t${sectionCodes.join('\t')}`,
      ...this.entries.map(
        ({ date, sectionEnrollments }) =>
          `${date}\t${sectionCodes
            .map(section => {
              const enrollment = sectionEnrollments[section]
              if (enrollment) {
                const { enrolled, capacity, waitlist } = enrollment
                return `${enrolled}/${capacity}${
                  waitlist > 0 ? ` (WL: ${waitlist})` : ''
                }`
              } else {
                return 'N/A'
              }
            })
            .join('\t')}`
      )
    ]
      .map(line => line + '\n')
      .join('')
  }

  static parse (file: string): CourseHistory {
    const [[_, ...sectionCodes], ...rows] = file
      .trim()
      .split(/\r?\n/)
      .map(row => row.trim().split('\t'))
    return new CourseHistory(
      rows.map(row => ({
        date: row[0],
        sectionEnrollments: Object.fromEntries(
          row.slice(1).map((cell, i) => {
            if (cell === 'N/A') {
              return [sectionCodes[i], null]
            }
            const match = cell.match(/(\d+)\/(\d+)(?: WL(\d+))?/)
            if (!match) {
              throw new SyntaxError(
                `Couldn't parse enrollment numbers from '${cell}'`
              )
            }
            const [, enrolled, capacity, waitlist = 0] = match
            return [
              sectionCodes[i],
              { enrolled: +enrolled, capacity: +capacity, waitlist: +waitlist }
            ]
          })
        )
      }))
    )
  }
}

export async function main (sessionIndex: string, uqz: string) {
  const getter = new AuthorizedGetter(QUARTER, sessionIndex, uqz)
  print(`\r[${' '.repeat(PROGBAR_LENGTH)}]`.padEnd(80, ' '))
  for await (const { course, progress } of getter.allCoursesWithProgress()) {
    print(
      `\r[${'='.repeat(Math.floor(progress * PROGBAR_LENGTH))}${' '.repeat(
        PROGBAR_LENGTH - Math.floor(progress * PROGBAR_LENGTH)
      )}] ${course.code}`.padEnd(80, ' ')
    )
  }
}

if (import.meta.main) {
  // The UqZBpD3n cookie doesn't seem to expire as often, so I put it first
  const [uqz, sessionIndex] = Deno.args
  await main(sessionIndex, uqz)
}
