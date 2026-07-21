/**
 * @file
 * usage: node tss/index.ts
 */

import { writeFile } from 'node:fs/promises'
import z from 'zod'

const BASE = 'https://courseschedule.tritonai.ucsd.edu/course-schedule/view/CS2'
const MAX_SECTION_IDS = 255
const SCRIPT_BEGIN = '<script id="course-detail-data" type="application/json">'

/**
 * I stole these from Chrome incognito
 */
const headers = {
  accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-CA,en-US;q=0.9,en;q=0.8',
  'cache-control': 'max-age=0',
  'sec-ch-ua':
    '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1'
}

const locationDetailSchema = z.strictObject({
  type: z.literal([
    'Seminar',
    'Final',
    'Lecture',
    'Lab',
    'Discussion',
    'Pr',
    'Studio',
    'Tutorial',
    'Midterm',
    'Fw',
    'Independent Study',
    'It',
    'Other'
  ]),
  // e.g. 'CENTR 115' or '' or 'tba' or 'Remote'
  location: z.union([
    z.templateLiteral([z.string(), ' ', z.string()]),
    z.literal(''),
    z.literal('tba'),
    z.literal('Remote')
  ]),
  // e.g. 'Center Hall, Room 115 - Lecture Hall'
  details: z.string(),
  // e.g. '6:30 PM\u20137:50 PM' or ''
  time: z.union([
    z.templateLiteral([z.string(), '\u2013', z.string()]),
    z.literal('')
  ]),
  // Seems to be false iff location and details are '' or location is 'tba'
  is_actionable: z.boolean()
})
const meetingSchema = z.strictObject({
  label: z.literal(['Final', 'Midterm', 'Other', 'Class']),
  // e.g. '12/7/26' or 'TBA'
  day: z.union([
    z.templateLiteral([z.number(), '/', z.number(), '/', z.number()]),
    z.literal('TBA')
  ]),
  // e.g. '7:00pm-9:59pm'
  time: z.union([
    z.templateLiteral([z.string(), '-', z.string()]),
    z.literal('TBA')
  ]),
  // e.g. 'CENTR 115' or 'TBA' or 'Remote' or 'tba'
  location: z.union([
    z.templateLiteral([z.string(), ' ', z.string()]),
    z.literal('TBA'),
    z.literal('tba'),
    z.literal('Remote')
  ])
})
const sectionSchema = z.strictObject({
  heading: z.literal([
    'Seminar',
    'Lecture',
    'Lab',
    'Discussion',
    'Pr',
    'Studio',
    'Tutorial',
    'Fw',
    'Independent Study',
    'It'
  ]),
  // e.g. '002-000-LE'
  section_code: z.templateLiteral([
    z.number(),
    '-',
    z.number(),
    '-',
    z.literal(['SE', 'LE', 'LA', 'DI', 'PR', 'ST', 'TU', 'FW', 'IN', 'IT'])
  ]),
  // e.g. 'E 00000960'
  section_id: z.templateLiteral(['E ', z.number()]),
  instruction_type: z.literal([
    'se',
    'lecture',
    'lab',
    'discussion',
    'pr',
    'st',
    'tu',
    'fw',
    'in',
    'it'
  ]),
  // e.g. 'CENTR 115' or 'TBA' or 'tba'
  location: z.union([
    z.templateLiteral([z.string(), ' ', z.string()]),
    z.literal('TBA'),
    z.literal('tba')
  ]),
  location_details: z.array(locationDetailSchema),
  // Not sure how they handle multiple instructors, or if this differs within
  // the same course
  instructors: z.string(),
  status: z.literal(['AC']),
  seats: z.templateLiteral([z.number(), '/', z.number()]),
  waitlist: z.literal(''),
  meetings: z.array(meetingSchema)
})
const courseSchema = z.strictObject({
  // Course code, e.g. 'CSE-011'
  class_name: z.templateLiteral([z.string(), '-', z.string()]),
  course_title: z.string(),
  // Instructor name, e.g. 'Michael Holst'; comma separated, e.g. 'Adam Bowers,
  // Michael Holst, Scott Tilton'. seems to represent all instructors inside
  // `sections` and thus can change depending on what sections were fetched (and
  // is probably redundant)
  subtitle: z.string(),
  sections: z.array(sectionSchema),
  seat_freshness: z.strictObject({
    is_stale: z.literal(true),
    // Human-readable date, e.g. '7/20/26 9:24 AM PDT'
    label: z.string(),
    // Human-readable relative date, e.g. '9 hours ago'
    relative_label: z.string()
  })
})
export type Course = z.infer<typeof courseSchema>

const errorSchema = z.strictObject({
  detail: z.strictObject({
    message: z.literal('One or more selected sections were not found.'),
    missing: z.array(
      z.strictObject({
        term_code: z.string(),
        section_id: z.string()
      })
    )
  })
})

export type Query = {
  sectionIds: Set<number>
  term: string
}
type Result =
  | {
      success: true
      courses: Record<`${string}-${string}`, Course>
    }
  | { success: false; nonexistentSectionIds: number[] }
export async function getSections ({
  sectionIds,
  term
}: Query): Promise<Result> {
  if (sectionIds.size > MAX_SECTION_IDS) {
    throw new RangeError(`At most ${MAX_SECTION_IDS} sectionIds please`)
  }
  const url =
    BASE +
    btoa(
      JSON.stringify({
        s: Array.from(sectionIds, id => `E ${id.toString().padStart(8, '0')}`),
        t: term
      })
    )
  const response = await fetch(url, { headers })
  if (response.url !== url) {
    throw new Error(`Redirected to ${response.url}`)
  }
  if (response.status === 404) {
    const json = errorSchema.parse(await response.json())
    return {
      success: false,
      nonexistentSectionIds: json.detail.missing.map(
        ({ section_id, term_code }) => {
          if (term_code !== term) {
            throw new Error(
              `For some reason we got term '${term_code}' not '${term}'`
            )
          }
          const sectionId = +section_id.slice(2)
          if (!sectionIds.has(sectionId)) {
            throw new Error(
              `For some reason they were looking for '${section_id}' which you didn't ask for`
            )
          }
          return sectionId
        }
      )
    }
  }
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} error: ${await response.text().catch(() => '(failed to read response)')}`
    )
  }
  const html = await response.text()
  const scriptIndex = html.indexOf(SCRIPT_BEGIN)
  if (scriptIndex === -1) {
    throw new SyntaxError('Could not find #course-detail-data in page')
  }
  const endIndex = html.indexOf('</script>', scriptIndex)
  if (endIndex === -1) {
    throw new SyntaxError('#course-detail-data did not end')
  }
  const json = JSON.parse(
    html.slice(scriptIndex + SCRIPT_BEGIN.length, endIndex)
  )
  return {
    success: true,
    courses: z
      .record(z.templateLiteral([z.string(), '-', z.string()]), courseSchema)
      .parse(json)
  }
}

if (import.meta.main) {
  const allCourses = new Map<string, Course>()
  let page = 0
  let sectionIds: Set<number> | null = null
  while (true) {
    sectionIds ??= new Set(
      Array.prototype.keys
        .call({ length: MAX_SECTION_IDS })
        .map(i => i + page * MAX_SECTION_IDS)
    )
    const result = await getSections({ sectionIds, term: 'FA26' })
    if (result.success) {
      console.error('page', page, Object.keys(result.courses).length, 'ok')
      for (const [key, course] of Object.entries(result.courses)) {
        const existing = allCourses.get(key)
        if (existing) {
          if (
            existing.class_name === course.class_name &&
            existing.course_title === course.course_title &&
            existing.seat_freshness.is_stale ===
              course.seat_freshness.is_stale &&
            existing.seat_freshness.label === course.seat_freshness.label
            // Not testing relative_label since that could change
          ) {
            existing.sections.push(...course.sections)
            existing.subtitle = Array.from(
              new Set(existing.subtitle.split(', ')).union(
                new Set(course.subtitle.split(', '))
              )
            ).join(', ')
          } else {
            console.dir(
              {
                existing: { ...existing, sections: '...' },
                course: { ...course, sections: '...' }
              },
              { depth: null }
            )
            throw new Error('cannot merge course')
          }
        } else {
          allCourses.set(key, course)
        }
      }
      sectionIds = null
      page++
    } else {
      console.error(
        'page',
        page,
        result.nonexistentSectionIds.length,
        'missing, will retry'
      )
      sectionIds = sectionIds.difference(new Set(result.nonexistentSectionIds))
      if (sectionIds.size === 0) {
        console.error('done')
        break
      }
    }
  }
  await writeFile(
    'tss/courses.json',
    JSON.stringify(Object.fromEntries(allCourses.entries()))
  )
}
