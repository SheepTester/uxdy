/**
 * @file
 * usage: node tss2/api.ts
 */

import z from 'zod'
import { xhrHeaders as headers } from '../tss/headers.ts'
import {
  courseSchemaBase,
  encodeQuery,
  formatSectionId,
  type SectionId,
  type Query,
  sectionIdSchema,
  errorSchema
} from '../tss/index.ts'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const BASE = 'https://classplanner.apps.ucsd.edu/api/v1'

function parse<T> (schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) {
    return result.data
  }
  let message = 'Does not fit schema'
  for (const issue of result.error.issues) {
    let path = ''
    let value = data as any
    for (const key of issue.path) {
      if (typeof key === 'string') {
        if (path) {
          path += '.'
        }
        path += key
      } else {
        path += `[${String(key)}]`
      }
      value = value?.[key]
    }
    message += `\n- ${path}: [${issue.code}] ${issue.message}`
    if (typeof value !== 'object' || value === null) {
      message += ` (received: ${JSON.stringify(value)})`
    }
  }
  throw new TypeError(message)
}
async function checkResponse (response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} error:\n${await response.text().catch(() => '(failed to read response text)')}`
    )
  }
  return response
}

const termSchema = z.strictObject({
  // e.g. 'FA26'
  term_code: z.string(),
  term_name: z.null(),
  calendar_year: z.null(),
  course_count: z.int(),
  section_count: z.int(),
  meeting_count: z.int(),
  // e.g. '2026-07-24 10:47:43+00'
  last_full_refresh_at: z.string(),
  configured: z.literal(true)
})
const termsSchema = z.strictObject({
  terms: z.array(termSchema)
})
export async function getTerms () {
  return parse(
    termsSchema,
    await fetch(`${BASE}/planner/terms`, { headers })
      .then(checkResponse)
      .then(r => r.json())
  ).terms
}

const courseSchema = courseSchemaBase.extend({
  // 'CSE'
  subject_code: z.string(),
  // '011'
  course_code: z.string(),
  // '8509'
  module_id: z.templateLiteral([z.int()]),
  // 'https://tss.ucsd.edu/fiori#YSchedule-view&/YUCSD_CON_MODULE(AcademicYear='2026',AcademicPeriod='2',ModuleID='8509')?layout=MidColumnFullScreen'
  // Not particularly interesting since this isn't the actual booking page
  tss_booking_url: z.url(),
  seat_freshness: z.strictObject({
    // This will change depending on the class
    is_stale: z.boolean(),
    // '7/24/26 6:27 PM PDT', 'not yet refreshed'
    label: z.string(),
    // '1 hour ago'; gone if is_partial is false
    relative_label: z.string().optional(),
    has_timestamp: z.boolean(),
    is_partial: z.boolean(),
    refresh_pending: z.boolean()
  })
})
const itemSchema = z.strictObject({
  severity: z.literal(['warning', 'conflict']),
  // 'Section not available'
  title: z.string(),
  // 'CSE-210 001-000-LE FA26:E 00001000 does not currently have an open seat or waitlist option.'
  message: z.string(),
  // ['FA26:E 00001000']
  section_refs: z.string().array(),
  // ['cse-210']
  course_slugs: z.string().array(),
  display_message: z.string().optional()
})
const timeSchema = z.templateLiteral([
  z.int(),
  ':',
  z.int(),
  z.literal(['am', 'pm'])
])
const meetingSchema = z.strictObject({
  day_code: z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']),
  dayCode: z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']),
  // 570
  start_minutes: z.int(),
  startMinutes: z.int(),
  // 650
  end_minutes: z.int(),
  endMinutes: z.int(),
  // '9:30am'
  start_time_display: timeSchema,
  startTimeDisplay: timeSchema,
  // '10:50am'
  end_time_display: timeSchema,
  endTimeDisplay: timeSchema,
  // 'GH'
  building_code: z.string().optional(),
  buildingCode: z.string().optional(),
  // 'GH 242'
  room_code: z.templateLiteral([z.string(), ' ', z.string()]).optional(),
  roomCode: z.templateLiteral([z.string(), ' ', z.string()]).optional(),
  // 'Galbraith Hall'
  building_name: z.string().optional(),
  buildingName: z.string().optional(),
  // 'Room 242 - Lecture Hall
  room_name: z.string().optional(),
  roomName: z.string().optional(),
  is_remote: z.literal(false),
  isRemote: z.literal(false),
  is_tba: z.literal(false),
  isTba: z.literal(false)
})
const sectionSchema = z.strictObject({
  section_id: sectionIdSchema,
  // 'FA26:E 00000959'
  section_ref: z.templateLiteral([z.string(), ':', sectionIdSchema]),
  sectionRef: z.templateLiteral([z.string(), ':', sectionIdSchema]),
  // '001-000-LE'
  section_code: z.templateLiteral([
    z.int(),
    '-',
    z.int(),
    '-',
    z.literal(['LE', 'LA', 'DI', 'SE', 'ST', 'TU', 'PR', 'FW', 'IN', 'IT'])
  ]),
  eventCode: z.templateLiteral([
    z.int(),
    '-',
    z.int(),
    '-',
    z.literal(['LE', 'LA', 'DI', 'SE', 'ST', 'TU', 'PR', 'FW', 'IN', 'IT'])
  ]),
  // 'CSE 011'
  class_name: z.templateLiteral([z.string(), ' ', z.string()]),
  // 'CSE-011
  moduleCode: z.templateLiteral([z.string(), '-', z.string()]),
  // 'Accel. Intro to Programming'
  // 'Accel. Intro to Programming'
  moduleName: z.string(),
  course_title: z.string(),
  instruction_type_name: z.literal([
    'lecture',
    'lab',
    'discussion',
    'se',
    'st',
    'tu',
    'pr',
    'fw',
    'in',
    'it'
  ]),
  instructionTypeName: z.literal([
    'lecture',
    'lab',
    'discussion',
    'se',
    'st',
    'tu',
    'pr',
    'fw',
    'in',
    'it'
  ]),
  instructors_text: z.string(),
  instructorsText: z.string(),
  seats_available: z.int(),
  capacity: z.int(),
  meetings: z.array(
    meetingSchema.extend({
      meeting_kind: z.literal(['class', 'final', 'midterm', 'other']),
      meetingKind: z.literal(['class', 'final', 'midterm', 'other']),
      // only if kind is not 'class' maybe; '2026-12-10'
      specific_date: z
        .templateLiteral([z.int(), '-', z.int(), '-', z.int()])
        .optional(),
      specificDate: z
        .templateLiteral([z.int(), '-', z.int(), '-', z.int()])
        .optional(),
      roomId: z.templateLiteral([z.int()]).optional(),
      room_id: z.templateLiteral([z.int()]).optional()
    })
  ),
  // 'FA26'
  termCode: z.string(),
  term_code: z.string(),
  eventId: sectionIdSchema,
  // 'CSE'
  subjectCode: z.string(),
  subject_code: z.string(),
  // '011'
  courseCode: z.string(),
  course_code: z.string(),
  moduleId: z.templateLiteral([z.int()]),
  module_id: z.templateLiteral([z.int()]),
  enrollmentLimit: z.int(),
  enrolledQuantity: z.int(),
  // appears to be identical to enrolledQuantity
  enrolled: z.int(),
  availableSeats: z.int(),
  // presence comorbid with last refreshed at and seat/waitlist count refreshed at
  waitlistEnrolled: z.int().optional(),
  waitlist_enrolled: z.int().optional(),
  eventStatusCode: z.literal(['AC']),
  status: z.literal(['AC']),
  isCancelled: z.literal(false),
  is_cancelled: z.literal(false),
  // '2026-07-24T10:47:43+00:00'
  lastRefreshedAt: z.string().optional(),
  last_refreshed_at: z.string().optional(),
  // '2026-07-25T01:27:52.080947+00:00'
  seat_count_refreshed_at: z.string().optional(),
  // '2026-07-25T01:28:07.154667+00:00'; not the same as seat_count_refreshed_at
  waitlist_count_refreshed_at: z.string().optional(),
  availability_refresh_pending: z.boolean()
})
const timedEventSchema = z.strictObject({
  section: sectionSchema,
  meeting: meetingSchema.extend({
    meeting_kind: z.literal('class'),
    meetingKind: z.literal('class'),
    // '0' if building/room is undefined
    roomId: z.templateLiteral([z.int()]),
    room_id: z.templateLiteral([z.int()])
  }),
  color: z.tuple([
    z.templateLiteral(['#', z.hex()]),
    z.templateLiteral(['#', z.hex()]),
    z.templateLiteral(['#', z.hex()])
  ]),
  // 'cse-011'
  course_slug: z.templateLiteral([z.string(), '-', z.string()]),
  // 'CSE-011'
  title: z.templateLiteral([z.string(), '-', z.string()]),
  type_label: z.literal([
    'LEC',
    'SEM',
    'LAB',
    'DIS',
    'STU',
    'PR',
    'TU',
    'FW',
    'IND',
    'IT'
  ]),
  time_label: z.templateLiteral([
    z.int(),
    ':',
    z.int(),
    z.literal(['am', 'pm']),
    '-',
    z.int(),
    ':',
    z.int(),
    z.literal(['am', 'pm'])
  ]),
  // 'GH 242'
  location_label: z.union([
    z.templateLiteral([z.string(), ' ', z.string()]),
    z.literal('TBA')
  ]),
  // 'GH 242 • Joe Politz'
  subtitle: z.string(),
  overlap_index: z.int(),
  overlap_count: z.int(),
  instructor_label: z.literal('')
})
const supplementalSchema = z.strictObject({
  kind: z.literal(['Final', 'Midterm', 'Other', 'Class']),
  // 'CSE-011'
  title: z.templateLiteral([z.string(), '-', z.string()]),
  // '12/10/26'
  date: z.union([
    z.templateLiteral([z.int(), '/', z.int(), '/', z.int()]),
    z.literal('TBA')
  ]),
  // '2026-12-10'. undefined if date is TBA
  raw_date: z.templateLiteral([z.int(), '-', z.int(), '-', z.int()]).optional(),
  // undefined if date is TBA
  day_code: z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']).optional(),
  // '8:00am-10:59am'. empty string if date is TBA
  time: z.union([
    z.templateLiteral([
      z.int(),
      ':',
      z.int(),
      z.literal(['am', 'pm']),
      '-',
      z.int(),
      ':',
      z.int(),
      z.literal(['am', 'pm'])
    ]),
    z.literal('')
  ]),
  // 'Galbraith Hall 242'
  location: z.string(),
  color: z.tuple([
    z.templateLiteral(['#', z.hex()]),
    z.templateLiteral(['#', z.hex()]),
    z.templateLiteral(['#', z.hex()])
  ]),
  // 'cse-011'
  course_slug: z.templateLiteral([z.string(), '-', z.string()])
})
const scheduleSchema = z.strictObject({
  // 'FA26'
  term_code: z.string(),
  // 'Fall 2026'
  term_label: z.string(),
  section_ids: z.array(sectionIdSchema),
  schedule_ref: z.templateLiteral(['CS2', z.string()]),
  // '2 sections • CSE-210, CSE-227 • No conflicts'
  summary: z.string(),
  summary_parts: z.strictObject({
    section_count: z.int(),
    // '2 sections',
    section_text: z.string(),
    course_count: z.int(),
    // Comma separated 'CSE-210, CSE-227',
    course_text: z.string(),
    conflict_count: z.int(),
    // 'No conflicts', '18 conflict(s)'
    conflict_text: z.string()
  }),
  issue_summary: z.strictObject({
    has_issues: z.boolean(),
    conflict_count: z.int(),
    warning_count: z.int(),
    // '2 warnings'
    pill_text: z.string(),
    items: z.array(itemSchema),
    groups: z.array(
      z.strictObject({
        // 'Sections Not Available'
        title: z.string(),
        // 'The following section IDs do not currently have an open seat or waitlist option:'
        description: z.string(),
        severity: z.literal(['warning', 'conflict']),
        items: z.array(itemSchema)
      })
    ),
    // 'Waitlist availability is missing for 2 sections; availability uses seats only.'
    quiet_notes: z.string().array()
  }),
  display_day_codes: z.union([
    z.tuple([
      z.literal('M'),
      z.literal('T'),
      z.literal('W'),
      z.literal('R'),
      z.literal('F')
    ]),
    z.tuple([
      z.literal('M'),
      z.literal('T'),
      z.literal('W'),
      z.literal('R'),
      z.literal('F'),
      z.literal('S'),
      z.literal('U')
    ])
  ]),
  start_hour: z.int(),
  end_hour: z.int(),
  timed_events: z.array(timedEventSchema),
  supplemental: z.array(supplementalSchema),
  course_details: z.record(
    z.templateLiteral([z.string(), '-', z.string()]),
    courseSchema
  ),
  // FA26 Schedule
  //
  // CSE-210 - Principle/Software Engineering
  // Instructor: Thomas Powell
  // Sections:
  // - Lecture: 001-000-LE
  //   Section ID: E 00001000
  //   Meeting: Thu, 5:00pm-6:20pm, CENTR 105
  //   Meeting: Tue, 5:00pm-6:20pm, CENTR 105
  //
  // CSE-227 - Computer Security
  // Instructor: Earlence Fernandes
  // Sections:
  // - Lecture: 001-000-LE
  //   Section ID: E 00001001
  //   Meeting: Thu, 11:00am-12:20pm, PODEM 1A18
  //   Meeting: Tue, 11:00am-12:20pm, PODEM 1A18
  //
  // Warnings:
  // - Availability is refreshing in the background; displayed seat and waitlist counts may be out of date.
  // - Waitlist availability missing for FA26:E 00001000; availability used seats only.
  // - Waitlist availability missing for FA26:E 00001001; availability used seats only.
  schedule_text: z.string(),
  warnings: z.array(z.string()),
  // 	"https://classplanner.apps.ucsd.edu/course-schedule/export?schedule_ref=CS2eyJzIjpbIkUgMDAwMDEwMDAiLCJFIDAwMDAxMDAxIl0sInQiOiJGQTI2In0&type=ics&download=true"
  ics_url: z.url(),
  calendar_actions: z
    .strictObject({
      label: z.string(),
      href: z.url(),
      download: z.boolean(),
      description: z.string(),
      // It seems to be either or but I don't care enough to enforce that
      icon_lucide: z.string().optional(),
      icon_url: z.string().optional()
    })
    .array(),
  // depends on ?context=; default is 'standalone'. they reject other parameters
  context: z.literal(['standalone', 'planner'])
})
type Schedule = z.infer<typeof scheduleSchema>
/**
 * "Schedules are limited to 12 distinct courses." There's not an easy way to
 * know, so I'll just keep it simple and cap it to 12.
 */
const MAX_SECTION_IDS = 12
type ScheduleResult =
  | { success: true; schedule: Schedule }
  | { success: false; nonexistentSectionIds: SectionId[] }
const cacheDir = 'tss2/.cache'
export async function getSchedule (query: Query): Promise<ScheduleResult> {
  if (query.sectionIds.size > MAX_SECTION_IDS) {
    throw new RangeError(`Max ${MAX_SECTION_IDS} section IDs`)
  }

  const encoded = encodeQuery(query)
  const cachePath = join(cacheDir, `${encoded}.json`)
  const cached = await readFile(cachePath, 'utf-8')
    .then(JSON.parse)
    .catch(error =>
      Error.isError(error) && 'code' in error && error.code === 'ENOENT'
        ? null
        : Promise.reject(error)
    )
  if (cached) {
    return cached
  }

  const url = `${BASE}/schedules/${encoded}`
  let result: ScheduleResult
  try {
    const response = await fetch(url, { headers })
    if (response.status === 404) {
      result = {
        success: false,
        nonexistentSectionIds: parse(
          errorSchema,
          await response.json()
        ).detail.missing.map(missing => missing.section_id)
      }
    } else {
      result = {
        success: true,
        schedule: parse(
          scheduleSchema,
          await checkResponse(response).then(r => r.json())
        )
      }
    }
  } catch (cause) {
    throw new Error(`Failure: ${url}`, { cause })
  }
  await mkdir(cacheDir, { recursive: true })
  await writeFile(cachePath, JSON.stringify(result))
  return result
}

if (import.meta.main) {
  const PARALLEL_GROUP_SIZE = 10
  const term = 'FA26'
  await Promise.all(
    (['event', 'eventless'] as const).map(async eventType => {
      for (let group = 0; ; group++) {
        const successes = await Promise.all(
          Array.prototype.keys
            .call({ length: PARALLEL_GROUP_SIZE })
            .map(async i => {
              const base = (group * PARALLEL_GROUP_SIZE + i) * MAX_SECTION_IDS
              const sectionIds = new Set(
                Array.prototype.keys
                  .call({ length: MAX_SECTION_IDS })
                  .map(j => formatSectionId(eventType, base + j))
              )
              console.error({ eventType, base })
              try {
                const { success } = await getSchedule({ sectionIds, term })
                return success
              } catch (error) {
                console.error(error)
                return true
              }
            })
        ).then(successes =>
          successes.reduce((cum, curr) => cum + (curr ? 1 : 0), 0)
        )
        if (successes === 0) {
          break
        }
      }
    })
  )
}
