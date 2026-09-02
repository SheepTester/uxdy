/**
 * @file
 * usage: node tss2/api.ts <term>
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
  errorSchema,
  type Section as CourseDetailSection
} from '../tss/index.ts'
import { join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert'
import { execSync } from 'node:child_process'

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
  // '1 unit', '3 units', '0.5 units'
  units_display: z.union([
    z.literal('1 unit'),
    z.templateLiteral([z.number(), ' units'])
  ]),
  // '8509'
  module_id: z.templateLiteral([z.int()]),
  event_package_id: z.templateLiteral([z.int()]).optional(),
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
    refresh_pending: z.boolean(),
    // 'Academic History returned HTTP 503'
    refresh_error: z.string().optional()
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
type Meeting = z.infer<typeof meetingSchema>
export type SimplifiedSectionMeetingBase = {
  day: Meeting['day_code']
  start: Meeting['start_minutes']
  end: Meeting['end_minutes']
  location: {
    room: `${string} ${string}`
    id: number
  } | null
}
export type SimplifiedSectionMeetingClass = SimplifiedSectionMeetingBase & {
  kind: 'class'
}
export type SimplifiedSectionMeetingExam = SimplifiedSectionMeetingBase & {
  kind: 'final' | 'midterm' | 'other'
  /** In milliseconds since epoch, UTC date */
  specificDate: number
}
export type SimplifiedSectionMeeting =
  SimplifiedSectionMeetingClass | SimplifiedSectionMeetingExam
const sectionSchema = z.strictObject({
  section_id: sectionIdSchema,
  eventId: sectionIdSchema,
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
  // '1 unit', '3 units'
  units_display: z.union([
    z.literal('1 unit'),
    z.templateLiteral([z.number(), ' units'])
  ]),
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
  // empty string if TBA; no "staff"
  instructors_text: z.string(),
  instructorsText: z.string(),
  seats_available: z.int(),
  availableSeats: z.int(),
  capacity: z.int(),
  enrollmentLimit: z.int(),
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
  // 'CSE'
  subjectCode: z.string(),
  subject_code: z.string(),
  // '011'
  courseCode: z.string(),
  course_code: z.string(),
  moduleId: z.templateLiteral([z.int()]),
  module_id: z.templateLiteral([z.int()]),
  eventPackageIds: z.templateLiteral([z.int()]).array(),
  event_package_ids: z.templateLiteral([z.int()]).array(),
  eventPackages: z.array(
    z.strictObject({
      module_id: z.templateLiteral([z.int()]),
      event_package_id: z.templateLiteral([z.int()]),
      // 'P-001-001', 'CENG-124A#1', 'MAE-207-01', 'POLI-138D-08', 'BISP194|U2',
      // 'MAE207|N1'
      event_package_name: z.union([
        z.templateLiteral([z.string(), '-', z.string(), '-', z.int()]),
        z.templateLiteral([z.string(), '-', z.string(), '#', z.int()]),
        z.templateLiteral([z.string(), '|U', z.int()]),
        z.templateLiteral([z.string(), '|N', z.int()])
      ])
    })
  ),
  event_packages: z.array(
    z.strictObject({
      module_id: z.templateLiteral([z.int()]),
      event_package_id: z.templateLiteral([z.int()]),
      event_package_name: z.union([
        z.templateLiteral([z.string(), '-', z.string(), '-', z.int()]),
        z.templateLiteral([z.string(), '-', z.string(), '#', z.int()]),
        z.templateLiteral([z.string(), '|U', z.int()]),
        z.templateLiteral([z.string(), '|N', z.int()])
      ])
    })
  ),
  enrolledQuantity: z.int(),
  // appears to be identical to enrolledQuantity
  enrolled: z.int(),
  // presence comorbid with last refreshed at and seat/waitlist count refreshed at
  waitlistEnrolled: z.int().optional(),
  waitlist_enrolled: z.int().optional(),
  eventStatusCode: z.literal(['AC', 'waitlist_only']),
  status: z.literal(['AC', 'waitlist_only']),
  isCancelled: z.literal(false),
  is_cancelled: z.literal(false),
  // '2026-07-24T10:47:43+00:00'
  lastRefreshedAt: z.string().optional(),
  last_refreshed_at: z.string().optional(),
  // '2026-07-25T01:27:52.080947+00:00'
  seat_count_refreshed_at: z.string().optional(),
  // '2026-07-25T01:28:07.154667+00:00'; not the same as seat_count_refreshed_at
  waitlist_count_refreshed_at: z.string().optional(),
  availability_refresh_pending: z.boolean(),
  // 'Academic History returned HTTP 503'
  availability_refresh_error: z.string().optional(),
  // '2026-08-06T07:13:01.490161+00:00'; maybe appears alongside
  // availability_refresh_error
  availability_refresh_retry_at: z.string().optional()
})
type Section = z.infer<typeof sectionSchema>
export type SimplifiedSection = {
  subject: string
  number: string
  courseTitle: string
  moduleId: number

  sectionId: Section['section_id']
  sectionCode: CourseDetailSection['section_code']
  instructionType: CourseDetailSection['instruction_type']
  /** 'TBA' normallized to ''. doesn't seem to contain multiple instructors */
  instructors: string

  capacity: number
  enrolled: number
  waitlist: number | null

  // In milliseconds since epoch
  refreshDate: number | null
  seatCountRefreshDate: number | null
  waitlistRefreshDate: number | null
  refreshPending: boolean

  /** Empty if eventless (actually has one TBA class) */
  meetings: SimplifiedSectionMeeting[]
}
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
  // '2026-12-05'
  finals_start_date: z.templateLiteral([z.int(), '-', z.int(), '-', z.int()]),
  finals_end_date: z.templateLiteral([z.int(), '-', z.int(), '-', z.int()]),
  valid: z.boolean(),
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
  context: z.literal(['standalone', 'planner']),
  map_data: z
    .strictObject({
      locations: z.array(
        z.strictObject({
          // 'APM'
          key: z.string(),
          // 'APM'
          building_code: z.string(),
          // 'Applied Physics and Mathematics'
          display_name: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          // 2985 Muir Lane, La Jolla, 92093
          address: z.string(),
          // ['hds-150']
          course_slugs: z.templateLiteral([z.string(), '-', z.string()]).array()
        })
      ),
      days: z.array(
        z.strictObject({
          day_code: z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']),
          stops: z.array(
            z.strictObject({
              // starts at 1
              sequence: z.int(),
              // 'PODEM'
              location_key: z.string(),
              // '597
              room_id: z.templateLiteral([z.int()]),
              // 'hds-175'
              course_slug: z.templateLiteral([z.string(), '-', z.string()]),
              // 'HDS-175'
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
              // 540
              start_minutes: z.int(),
              end_minutes: z.int(),
              color: z.tuple([
                z.templateLiteral(['#', z.hex()]),
                z.templateLiteral(['#', z.hex()]),
                z.templateLiteral(['#', z.hex()])
              ])
            })
          ),
          transitions: z.array(
            z.strictObject({
              from_sequence: z.int(),
              to_sequence: z.int(),
              // 'PODEM'; may match
              from_location_key: z.string(),
              to_location_key: z.string(),
              distance_meters: z.int(),
              estimated_minutes: z.int(),
              gap_minutes: z.int(),
              available: z.literal(true),
              status: z.literal(['available', 'overlap', 'insufficient']),
              geometry: z
                .strictObject({
                  type: z.literal('LineString'),
                  coordinates: z.tuple([z.number(), z.number()]).array()
                })
                .optional()
            })
          )
        })
      ),
      unmapped_locations: z
        .strictObject({
          // 'TASB'
          building_code: z.string(),
          // 'TASB W1131'
          room_code: z.templateLiteral([z.string(), ' ', z.string()]),
          // 'Triton Administrative Services Building'
          display_name: z.string(),
          // ['ph-491']
          course_slugs: z
            .templateLiteral([z.string(), '-', z.string()])
            .array(),
          day_codes: z.literal(['M', 'T', 'W', 'R', 'F', 'S', 'U']).array()
        })
        .array(),
      walking_speed_mps: z.literal(1.4),
      // '2026-07-24T08:15:26+00:00'
      routes_generated_at: z.literal('2026-07-24T08:15:26+00:00')
    })
    .optional()
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
const getUrl = (query: Query) => `${BASE}/schedules/${encodeQuery(query)}`
export async function getSchedule (
  query: Query,
  useCache: boolean
): Promise<ScheduleResult> {
  if (query.sectionIds.size > MAX_SECTION_IDS) {
    throw new RangeError(`Max ${MAX_SECTION_IDS} section IDs`)
  }

  const cachePath = join(cacheDir, `${encodeQuery(query)}.json`)
  const cached =
    useCache &&
    (await readFile(cachePath, 'utf-8')
      .then(JSON.parse)
      .catch(error =>
        Error.isError(error) && 'code' in error && error.code === 'ENOENT'
          ? null
          : Promise.reject(error)
      ))
  if (cached) {
    return cached
  }

  let result: ScheduleResult
  try {
    const response = await fetch(getUrl(query), { headers })
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
    throw new Error(`Failure: ${getUrl(query)}`, { cause })
  }
  if (useCache) {
    await mkdir(cacheDir, { recursive: true })
    await writeFile(cachePath, JSON.stringify(result))
  }
  return result
}

const PARALLEL_GROUP_SIZE = 10
export type GetSectionsOptions = {
  /** @default false */
  useCache?: boolean
}
export async function getSections (
  term: string,
  { useCache = false }: GetSectionsOptions = {}
): Promise<SimplifiedSection[]> {
  const sectionMap = new Map<SectionId, SimplifiedSection>()
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
              process.stderr.write(`\r${formatSectionId(eventType, base)}`)
              const query = { sectionIds, term }
              let lastSection: SectionId | undefined
              try {
                const result = await getSchedule(query, useCache)
                if (!result.success) {
                  return false
                }
                // TODO: timed_events excludes eventless sections
                for (const { section } of result.schedule.timed_events) {
                  lastSection = section.section_id
                  assert.strictEqual(section.section_id, section.eventId)
                  assert.strictEqual(section.section_ref, section.sectionRef)
                  assert.strictEqual(
                    section.section_ref,
                    `${term}:${section.section_id}`
                  )
                  assert.strictEqual(section.section_code, section.eventCode)
                  assert.strictEqual(
                    section.class_name.replace(' ', '-'),
                    section.moduleCode
                  )
                  assert.strictEqual(section.moduleName, section.course_title)
                  assert.strictEqual(
                    section.instruction_type_name,
                    section.instructionTypeName
                  )
                  assert.strictEqual(
                    section.instructorsText,
                    section.instructors_text
                  )
                  assert(!section.instructors_text.includes(','))
                  assert.strictEqual(section.capacity, section.enrollmentLimit)
                  assert.strictEqual(section.termCode, term)
                  assert.strictEqual(section.term_code, term)
                  assert.strictEqual(section.subjectCode, section.subject_code)
                  assert.strictEqual(section.courseCode, section.course_code)
                  assert.strictEqual(section.moduleId, section.module_id)
                  assert.strictEqual(section.enrolledQuantity, section.enrolled)
                  assert.strictEqual(
                    Math.max(section.capacity - section.enrolled, 0),
                    section.availableSeats
                  )
                  assert.strictEqual(
                    section.waitlistEnrolled,
                    section.waitlist_enrolled
                  )
                  assert.strictEqual(
                    section.lastRefreshedAt,
                    section.last_refreshed_at
                  )
                  // assert.strictEqual(
                  //   section.waitlist_enrolled !== undefined,
                  //   section.last_refreshed_at !== undefined
                  // )
                  // assert.strictEqual(
                  //   section.waitlist_enrolled !== undefined,
                  //   section.seat_count_refreshed_at !== undefined
                  // )
                  assert.strictEqual(
                    section.waitlist_enrolled !== undefined,
                    section.waitlist_count_refreshed_at !== undefined
                  )
                  if (section.waitlist_enrolled !== undefined) {
                    if (section.waitlist_enrolled > 0) {
                      assert.deepEqual(section.availableSeats, 0)
                    }
                    if (section.availableSeats > 0) {
                      assert.deepEqual(section.waitlist_enrolled, 0)
                    }
                  }
                  for (const meeting of section.meetings) {
                    assert.strictEqual(meeting.day_code, meeting.dayCode)
                    assert.strictEqual(
                      meeting.start_minutes,
                      meeting.startMinutes
                    )
                    assert.strictEqual(meeting.end_minutes, meeting.endMinutes)
                    // TODO: check display
                    assert.strictEqual(
                      meeting.start_time_display,
                      meeting.startTimeDisplay
                    )
                    assert.strictEqual(
                      meeting.end_time_display,
                      meeting.endTimeDisplay
                    )
                    assert.strictEqual(
                      meeting.building_code,
                      meeting.buildingCode
                    )
                    assert.strictEqual(meeting.room_code, meeting.roomCode)
                    assert(
                      meeting.room_code?.startsWith(
                        `${meeting.building_code} `
                      ) ?? true
                    )
                    assert.strictEqual(
                      meeting.building_name,
                      meeting.buildingName
                    )
                    assert.strictEqual(meeting.room_name, meeting.roomName)
                    assert.strictEqual(
                      meeting.specific_date,
                      meeting.specificDate
                    )
                    assert.strictEqual(meeting.roomId, meeting.room_id)
                    assert.strictEqual(
                      !!meeting.roomId && meeting.roomId !== '0',
                      !!meeting.room_code
                    )
                    assert.strictEqual(
                      meeting.meeting_kind,
                      meeting.meetingKind
                    )
                    if (meeting.meeting_kind === 'class') {
                      assert.strictEqual(meeting.specific_date, undefined)
                    } else {
                      assert.notStrictEqual(meeting.specific_date, undefined)
                    }
                  }
                  const simplified: SimplifiedSection = {
                    subject: section.subject_code,
                    number: section.course_code,
                    courseTitle: section.course_title,
                    moduleId: +section.module_id,
                    sectionId: section.section_id,
                    sectionCode: section.section_code,
                    instructionType: section.instruction_type_name,
                    instructors: section.instructors_text,
                    capacity: section.capacity,
                    enrolled: section.enrolled,
                    waitlist: section.waitlist_enrolled ?? null,
                    refreshDate: section.last_refreshed_at
                      ? new Date(section.last_refreshed_at).getTime()
                      : null,
                    seatCountRefreshDate: section.seat_count_refreshed_at
                      ? new Date(section.seat_count_refreshed_at).getTime()
                      : null,
                    waitlistRefreshDate: section.waitlist_count_refreshed_at
                      ? new Date(section.waitlist_count_refreshed_at).getTime()
                      : null,
                    refreshPending: section.availability_refresh_pending,
                    meetings: section.meetings.map(
                      (meeting): SimplifiedSectionMeeting => {
                        const base = {
                          day: meeting.day_code,
                          start: meeting.start_minutes,
                          end: meeting.end_minutes,
                          location:
                            meeting.room_code &&
                            meeting.room_id &&
                            meeting.room_id !== '0'
                              ? {
                                room: meeting.room_code,
                                id: +meeting.room_id
                              }
                              : null
                        }
                        if (meeting.meeting_kind === 'class') {
                          return { kind: 'class', ...base }
                        } else {
                          if (!meeting.specific_date) {
                            throw 'up'
                          }
                          return {
                            kind: meeting.meeting_kind,
                            ...base,
                            specificDate: new Date(
                              meeting.specific_date
                            ).getTime()
                          }
                        }
                      }
                    )
                  }
                  const existing = sectionMap.get(section.section_id)
                  if (existing) {
                    assert.deepStrictEqual(existing, simplified)
                  } else {
                    sectionMap.set(section.section_id, simplified)
                  }
                }

                for (const course of Object.values(
                  result.schedule.course_details
                )) {
                  for (const section of course.sections) {
                    if (section.section_id.startsWith('E ')) {
                      continue
                    }
                    let available = 0
                    let capacity = 0
                    if (section.seats !== 'Not open for direct booking') {
                      const [availableStr, capacityStr] = section.seats
                        .replace(' (FULL)', '')
                        .split('/')
                      available = +availableStr
                      capacity = +capacityStr
                      // not true
                      // assert.deepStrictEqual(capacity, enrolled)
                      assert(
                        available <= capacity,
                        `available <= capacity; ${course.class_name} ${section.section_code}`
                      )
                      assert(available >= 0)
                    }
                    assert.deepStrictEqual(section.meetings, [
                      {
                        label: 'Class',
                        day: 'TBA',
                        time: 'TBA',
                        location: 'tba'
                      }
                    ])
                    const simplified: SimplifiedSection = {
                      subject: course.subject_code,
                      number: course.course_code,
                      courseTitle: course.course_title,
                      moduleId: +course.module_id,
                      sectionId: section.section_id,
                      sectionCode: section.section_code,
                      instructionType: section.instruction_type,
                      instructors:
                        section.instructors === 'TBA'
                          ? ''
                          : section.instructors,
                      capacity: capacity,
                      enrolled: capacity - available,
                      waitlist:
                        section.waitlist === '' ? null : +section.waitlist,
                      refreshDate:
                        course.seat_freshness.label === 'not yet refreshed'
                          ? null
                          : new Date(course.seat_freshness.label).getTime(),
                      seatCountRefreshDate: null,
                      waitlistRefreshDate: null,
                      refreshPending: course.seat_freshness.refresh_pending,
                      meetings: []
                    }
                    const existing = sectionMap.get(section.section_id)
                    if (existing) {
                      assert.deepStrictEqual(existing, simplified)
                    } else {
                      sectionMap.set(section.section_id, simplified)
                    }
                  }
                }
              } catch (error) {
                if (lastSection) {
                  console.error(`section: ${lastSection}`)
                }
                console.error(`url: ${getUrl(query)}`)
                console.error(error)
              }
              return true
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
  console.error()
  return sectionMap
    .values()
    .toArray()
    .sort((a, b) => (a.sectionId < b.sectionId ? -1 : 1))
}

if (import.meta.main) {
  if (process.argv.length !== 3) {
    console.error(`usage: node tss2/api.ts <term>`)
    process.exit(1)
  }
  const [, , term] = process.argv
  await writeFile(
    `tss2/sections-${term}.json`,
    JSON.stringify(await getSections(term, { useCache: true }))
  )
  execSync(`npx @biomejs/biome format --write tss2/sections-${term}.json`, {
    stdio: 'inherit'
  })
}
