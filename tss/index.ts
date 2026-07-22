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
const normalMeetingTypeSchema = z.literal([
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
])
type NormalMeetingType = z.infer<typeof normalMeetingTypeSchema>
const sectionSchema = z.strictObject({
  heading: normalMeetingTypeSchema,
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
        section_id: z.templateLiteral([z.literal(['E ', 'EL']), z.number()])
      })
    )
  })
})

export type DayMapKey =
  `course:${string} time:${string} location:${string} type:${string}`

export type SectionId = `${'E ' | 'EL'}${number}`
export type Query = {
  sectionIds: Set<SectionId>
  term: string
}
type Result =
  | {
      success: true
      courses: Record<`${string}-${string}`, Course>
      /** Course code, time, instruction type, location -> day of week */
      dayMap: Record<DayMapKey, string[]>
    }
  | { success: false; nonexistentSectionIds: SectionId[] }
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
        // Must be sorted to be "canonical"
        s: Array.from(sectionIds).sort(),
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
          if (!sectionIds.has(section_id)) {
            throw new Error(
              `For some reason they were looking for '${section_id}' which you didn't ask for`
            )
          }
          return section_id
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

  const dayMap: Record<DayMapKey, string[]> = {}
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
    const key =
      `course:${courseUpper} time:${time} location:${location} type:${meetingType}` as const
    // Duplicates can happen due to ambiguities; they're handled below
    dayMap[key] ??= []
    dayMap[key].push(day)
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

export function formatSectionId (
  type: 'event' | 'eventless',
  id: number
): SectionId {
  return `${type === 'event' ? 'E ' : 'EL'}${id.toString().padStart(8, '0') as unknown as number}`
}

if (import.meta.main) {
  const allCourses = new Map<string, Course>()
  const resolvedDays: {
    sectionId: SectionId
    index: number
    days: string[]
  }[] = []
  const dayCandidatesToDisambiguate: {
    // Used to avoid having two of the same course in a later disambiguation
    // request
    courseCode: `${string}-${string}`
    candidates: { sectionId: SectionId; index: number }[]
  }[] = []
  let page = 0
  let sectionIds: Set<SectionId> | null = null
  while (true) {
    sectionIds ??= new Set(
      Array.prototype.keys
        .call({ length: MAX_SECTION_IDS })
        .map(i => formatSectionId('event', i + page * MAX_SECTION_IDS))
    )
    const result = await getSections({ sectionIds, term: 'FA26' })
    if (result.success) {
      console.error('page', page, Object.keys(result.courses).length, 'ok')
      const unseen = new Set(Object.keys(result.dayMap))
      for (const [key, course] of Object.entries(result.courses)) {
        const dayCandidatesMap: Record<
          DayMapKey,
          {
            days: string[]
            candidates: { sectionId: SectionId; index: number }[]
          }
        > = {}
        // Inject day information
        for (const section of course.sections) {
          for (const [i, meeting] of section.location_details.entries()) {
            if (meeting.time === '') {
              continue
            }
            // Exams already have days
            if (
              meeting.type === 'Final' ||
              meeting.type === 'Midterm' ||
              meeting.type === 'Other'
            ) {
              continue
            }
            const type: NormalMeetingType = meeting.type
            const key = `course:${course.class_name} time:${meeting.time
              .replace('\u2013', '-')
              .replaceAll(' AM', 'am')
              .replaceAll(' PM', 'pm')} location:${
              meeting.location === '' || meeting.location === 'tba'
                ? 'TBA'
                : meeting.location
            } type:${type === 'Tutorial' ? 'TU' : type.slice(0, 3).toUpperCase()}` as const
            const days = result.dayMap[key]
            if (days) {
              unseen.delete(key)
              // This approach can be ambiguous, so we'll need to disambiguate
              // later
              dayCandidatesMap[key] ??= { days, candidates: [] }
              dayCandidatesMap[key].candidates.push({
                sectionId: section.section_id,
                index: i
              })
            } else {
              throw new Error(
                `[${section.section_id}] missing day for '${key}'`
              )
            }
          }
        }

        // Merge with existing course
        const existing = allCourses.get(key)
        if (existing) {
          if (
            existing.class_name === course.class_name &&
            existing.course_title === course.course_title &&
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

        for (const { days, candidates } of Object.values(dayCandidatesMap)) {
          if (candidates.length === 1) {
            if (new Set(days).size !== days.length) {
              throw new Error(
                `${candidates[0].sectionId} ${candidates[0].index} has duplicate days: ${days.join('')}`
              )
            }
            resolvedDays.push({ ...candidates[0], days })
          } else {
            if (
              new Set(candidates.values().map(candidate => candidate.sectionId))
                .size !== candidates.length
            ) {
              throw new Error(
                `A candidate in ${JSON.stringify(candidates)} is ambiguous with another of its own meetings, which I cannot resolve`
              )
            }
            dayCandidatesToDisambiguate.push({
              courseCode: course.class_name,
              candidates
            })
          }
        }
      }

      if (unseen.size > 0) {
        throw new Error(
          `Some meetings did not get assigned:\n${Array.from(unseen).join('\n')}`
        )
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
  const disambiguationPlan = Map.groupBy(
    Map.groupBy(
      dayCandidatesToDisambiguate,
      candidates => candidates.courseCode
    )
      .values()
      .flatMap(candidates =>
        candidates
          .values()
          .flatMap(c => c.candidates)
          .map((candidate, i) => ({ candidate: candidate.sectionId, step: i }))
      ),
    candidate => candidate.step
  )
    .values()
    .map(group => group.map(c => c.candidate))
    .toArray()
  await writeFile(
    'tss/courses.json',
    JSON.stringify(Object.fromEntries(allCourses.entries()))
  )
  await writeFile('tss/resolvedDays.json', JSON.stringify(resolvedDays))
  await writeFile(
    'tss/disambiguationPlan.json',
    JSON.stringify(disambiguationPlan)
  )
}
