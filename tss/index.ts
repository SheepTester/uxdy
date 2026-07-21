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

// MUS 20R 001-000-LE is the most oddball class

const daysSchema = z.array(z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']))
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
  is_actionable: z.boolean(),
  // Doesn't actually exist in the JSON, just injected
  __days: daysSchema.optional()
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
      /** Course code, time, instruction type, location -> day of week */
      dayMap: Record<`${string}\n${string}\n${string}\n${string}`, Set<string>>
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

  const dayMap: Record<
    `${string}\n${string}\n${string}\n${string}`,
    Set<string>
  > = {}
  let index = 0
  while (true) {
    index = html.indexOf('<article class="mobile-event-card', index)
    if (index === -1) {
      break
    }
    const start = index
    index = html.indexOf('</article>', index)
    if (index === -1) {
      throw new SyntaxError('Unclosed mobile event card')
    }
    const article = html.slice(start, index)
    const match = article.match(
      /^<article class="mobile-event-card event-card(?: event-card--compact)?" data-course="([a-z]{2,4}-\d{3}[a-z]{0,2})" data-mobile-day="([MTWRFSU])" tabindex="0" role="button" aria-haspopup="dialog" style="[^"]+">\s+<div class="event-card-rail"><\/div>\s+<div class="event-card-body">\s+<div class="event-heading">\s+<div class="event-title">([A-Z]{2,4}-\d{3}[A-Z]{0,2})<\/div>\s+<span class="event-type">([A-Z]{2,3})<\/span>\s+<\/div>\s+<div class="event-time">(1?\d:[0-5]\d[ap]m-1?\d:[0-5]\d[ap]m)<\/div>\s+<div class="event-location">([A-Z\d-]{2,5} [A-Z\d-]{1,5}|TBA)<\/div>\s+<\/div>\s+$/
    )
    if (!match) {
      throw new SyntaxError(
        `Mobile event card did not match master regex: ${article}`
      )
    }
    const [, courseLower, day, courseUpper, meetingType, time, location] = match
    if (courseLower !== courseUpper.toLowerCase()) {
      throw new SyntaxError(
        `Different courses: '${courseLower}', '${courseUpper}'`
      )
    }
    const key = `${courseUpper}\n${time}\n${meetingType}\n${location}` as const
    dayMap[key] ??= new Set()
    if (dayMap[key].has(day)) {
      throw new Error(`Already saw day 'day' for '${key}'`)
    }
    dayMap[key].add(day)
  }

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
      .parse(json),
    dayMap
  }
}

if (import.meta.main) {
  const allCourses = new Map<string, Course>()
  const seenDayKeys = new Set<`${string}\n${string}\n${string}\n${string}`>()
  let page = 0
  let sectionIds: Set<number> | null = null
  while (page < 2) {
    sectionIds ??= new Set(
      Array.prototype.keys
        .call({ length: MAX_SECTION_IDS })
        .map(i => i + page * MAX_SECTION_IDS)
    )
    const result = await getSections({ sectionIds, term: 'FA26' })
    if (result.success) {
      console.error('page', page, Object.keys(result.courses).length, 'ok')
      console.log(result.dayMap)
      for (const [key, course] of Object.entries(result.courses)) {
        // Merge with existing course
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
            // Inject day information
            const sections = course.sections.map(section => {
              return {
                ...section,
                location_details: section.location_details.map(meeting => {
                  if (meeting.time === '') {
                    return meeting
                  }
                  const key = `${course.class_name}\n${meeting.time
                    .replace('\u2013', '-')
                    .replaceAll(' AM', 'am')
                    .replaceAll(' PM', 'pm')}\n${meeting.type
                    .slice(0, 3)
                    .toUpperCase()}\n${meeting.location}` as const
                  const days = result.dayMap[key]
                  if (days) {
                    delete result.dayMap[key]
                    if (seenDayKeys.has(key)) {
                      throw new Error(
                        `already have day entry for '${course.class_name}' '${meeting.time}' '${meeting.location}' '${meeting.type}'`
                      )
                    } else {
                      seenDayKeys.add(key)
                      return {
                        ...meeting,
                        __days: daysSchema.parse(Array.from(days))
                      }
                    }
                  } else {
                    throw new Error(`missing day for '${key}'`)
                  }
                })
              }
            })
            if (Object.keys(result.dayMap).length > 0) {
              throw new Error(
                `Some meetings did not get assigned: ${JSON.stringify(result.dayMap, (_key, value) => (value instanceof Set ? Array.from(value) : value), 2)}`
              )
            }
            existing.sections.push(...sections)
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
