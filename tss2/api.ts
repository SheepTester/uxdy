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
  type Query
} from '../tss/index.ts'

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
  course_count: z.number(),
  section_count: z.number(),
  meeting_count: z.number(),
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
    // '7/24/26 6:27 PM PDT'
    label: z.string(),
    // '1 hour ago'
    relative_label: z.string(),
    has_timestamp: z.literal(true),
    is_partial: z.literal(false),
    refresh_pending: z.boolean()
  })
})
const scheduleSchema = z.object({
  course_details: z.record(
    z.templateLiteral([z.string(), '-', z.string()]),
    courseSchema
  )
})
const MAX_SECTION_IDS = 12
export async function getSchedule (query: Query) {
  if (query.sectionIds.size > MAX_SECTION_IDS) {
    throw new RangeError(`Max ${MAX_SECTION_IDS} section IDs`)
  }
  return parse(
    scheduleSchema,
    await fetch(`${BASE}/schedules/${encodeQuery(query)}`, { headers })
      .then(checkResponse)
      .then(r => r.json())
  )
}

if (import.meta.main) {
  const sectionIds = new Set<SectionId>()
  for (let i = 1000; i < 1012; i++) {
    sectionIds.add(formatSectionId('event', i))
  }
  console.log(await getSchedule({ sectionIds, term: 'FA26' }))
}
