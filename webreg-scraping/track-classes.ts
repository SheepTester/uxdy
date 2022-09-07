// Create a Git-friendly set of files summarizing WebReg data
// deno run --allow-all track-classes.ts <UqZBpD3n> <jlinksessionidx>

import { ensureDir } from 'https://deno.land/std@0.125.0/fs/ensure_dir.ts'
import { writeAll } from 'https://deno.land/std@0.125.0/streams/conversion.ts'
import { exams, instructionTypes } from './meeting-types.ts'
import { Scraper } from './scrape.ts'
import { displayProgress } from './util/display-progress.ts'

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
  pastCodes: string[]

  constructor (entries: HistoryEntry[] = [], pastCodes: string[] = []) {
    this.entries = entries
    this.pastCodes = pastCodes
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
                return [
                  enrolled,
                  capacity === Infinity ? '' : `/${capacity}`,
                  waitlist > 0 ? ` WL${waitlist}` : ''
                ].join('')
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
            const match = cell.match(/(\d+)(?:\/(\d+))?(?: WL(\d+))?/)
            if (!match) {
              throw new SyntaxError(
                `Couldn't parse enrollment numbers from '${cell}'`
              )
            }
            const [, enrolled, capacity = Infinity, waitlist = 0] = match
            return [
              sectionCodes[i],
              { enrolled: +enrolled, capacity: +capacity, waitlist: +waitlist }
            ]
          })
        )
      })),
      sectionCodes
    )
  }
}

const encoder = new TextEncoder()
async function writeToFile (path: string | URL) {
  const file = await Deno.open(path, {
    write: true,
    create: true
  })
  await file.truncate()
  return {
    write: (text: string) => writeAll(file, encoder.encode(text)),
    close: () => file.close()
  }
}

export async function main (
  quarter: string,
  date: string,
  source:
    | {
        type: 'fetch'
        jlinksessionidx: string
        UqZBpD3n: string
      }
    | {
        type: 'cache'
        cachePath: string
      }
) {
  await displayProgress(0)
  const getter = new Scraper(quarter, source)
  const courseList = await writeToFile('./webreg-data2/courses.md')
  await courseList.write(`## Courses (${quarter})\n\n`)
  const remoteList = await writeToFile('./webreg-data2/remote.md')
  await remoteList.write(`## Remote sections\n`)
  const enrollables: Record<number, string> = {}
  for await (const { course, progress } of getter.allCoursesWithProgress()) {
    await courseList.write(
      `- [**${course.code}**: ${course.title}](./courses/${course.subject}${
        course.course
      }.md) (${
        course.unit.from === course.unit.to
          ? `${course.unit.to} units`
          : `${course.unit.from}–${course.unit.to} units, by ${course.unit.step}`
      })\n`
    )

    await Deno.writeTextFile(
      `./webreg-data2/courses/${course.subject}${course.course}.md`,
      [
        `**${course.code}**: ${course.title} (${
          course.unit.from === course.unit.to
            ? `${course.unit.to} units`
            : `${course.unit.from}–${course.unit.to} units, by ${course.unit.step}`
        })`,
        '',
        ...course.groups
          .sort(
            // Sort by section code, then non-exams first, then the meeting type
            (a, b) =>
              a.code.localeCompare(b.code) ||
              +a.isExam() - +b.isExam() ||
              a.type.localeCompare(b.type)
          )
          .map(
            group =>
              `- **${group.code}** (${
                group.examType === null
                  ? instructionTypes[group.instructionType]
                  : exams[group.examType]
              }) ${
                group.time
                  ? `at ${group.time.start}–${group.time.end} on ${group
                      .times()!
                      .map(period => period.dayName())
                      .join(', ')} ${
                      group.time.location
                        ? `at ${group.time.location.building} ${group.time.location.room}`
                        : '(location TBA)'
                    }`
                  : '(time and location TBA)'
              } by ${
                group.instructors.length > 0
                  ? group.instructors.map(
                      instructor =>
                        `${instructor.lastFirst} (${instructor.pid})`
                    )
                  : 'staff'
              }`
          ),
        '',
        `[Enrollment numbers over time](./${course.subject}${course.course}.tsv)`
      ]
        .map(line => line + '\n')
        .join('')
    )

    const filePath = `./webreg-data2/courses/${course.subject}${course.course}.tsv`
    const history = await Deno.readTextFile(filePath)
      .then(CourseHistory.parse)
      .catch(error =>
        error instanceof Deno.errors.NotFound
          ? new CourseHistory()
          : Promise.reject(error)
      )
    // Only add a new entry if there was a change
    const sectionEnrollments = course.groups
      .filter(group => group.plannable)
      .map(
        group =>
          [
            group.code,
            {
              enrolled: group.enrolled,
              capacity: group.capacity,
              waitlist: group.waitlist
            }
          ] as const
      )
    const lastEntry =
      history.entries[history.entries.length - 1]?.sectionEnrollments
    // Only add an entry if there was a change
    if (
      !lastEntry ||
      sectionEnrollments.some(([code, enrollment]) =>
        (['enrolled', 'capacity', 'waitlist'] as const).some(
          prop => lastEntry[code]?.[prop] !== enrollment[prop]
        )
      )
    ) {
      history.entries.push({
        date,
        sectionEnrollments: Object.fromEntries(sectionEnrollments)
      })
    }
    await Deno.writeTextFile(
      filePath,
      history.toFile(
        [
          ...new Set([
            // Preserve section codes that are no longer used (e.g. cancelled,
            // such as SP22 ANAR 115 A00)
            ...history.pastCodes,
            ...course.groups
              .filter(group => group.plannable)
              .map(group => group.code)
          ])
        ].sort()
      )
    )

    const remote = course.groups.filter(
      group => group.plannable && group.time?.location?.building === 'RCLAS'
    )
    if (remote.length > 0) {
      await remoteList.write(
        `\n[**${course.code}**](./courses/${course.subject}${
          course.course
        }.md): ${course.title}\n${remote
          .map(group => `- ${group.code}\n`)
          .join('')}`
      )
    }

    const enrollable = course.groups.filter(
      group => group.plannable && group.enrollable
    )
    if (enrollable.length > 0) {
      // Determine whether the course is lower division (i.e. 0xx)
      const division = Math.floor(parseInt(course.course) / 100)
      enrollables[division] ??= `\n## ${division}xx courses\n\n`
      enrollables[
        division
      ] += `- [**${course.code}**](./courses/${course.subject}${course.course}.md) ([numbers](./courses/${course.subject}${course.course}.tsv)): ${course.title}\n`
    }

    await displayProgress(progress, { label: course.code })
  }
  courseList.close()
  remoteList.close()
  Deno.writeTextFile(
    './webreg-data2/enrollable.md',
    `# Non-full sections\n${Object.entries(enrollables)
      .sort(([a], [b]) => +a - +b)
      .map(([, text]) => text)
      .join('')}`
  )
  console.log()
}

if (import.meta.main) {
  // The UqZBpD3n cookie doesn't seem to expire as often, so I put it first
  const [UqZBpD3n, jlinksessionidx] = Deno.args
  const today = new Date()
  await main(
    'FA22',
    [
      today.getFullYear().toString().slice(2),
      (today.getMonth() + 1).toString().padStart(2, '0'),
      today.getDate().toString().padStart(2, '0')
    ].join(''),
    { type: 'fetch', jlinksessionidx, UqZBpD3n }
  )
}
