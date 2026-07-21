/**
 * @file
 * usage: node tss/index.ts
 */

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
  type: z.literal(['Lecture', 'Final']),
  // e.g. 'CENTR 115'
  location: z.templateLiteral([z.string(), ' ', z.string()]),
  // e.g. 'Center Hall, Room 115 - Lecture Hall'
  details: z.string(),
  // e.g. '6:30 PM\u20137:50 PM'
  time: z.templateLiteral([z.string(), '\u2013', z.string()]),
  is_actionable: z.literal(true)
})
const meetingSchema = z.strictObject({
  label: z.literal(['Final', 'Midterm']),
  // e.g. '12/7/26'
  day: z.templateLiteral([z.number(), '/', z.number(), '/', z.number()]),
  // e.g. '7:00pm-9:59pm'
  time: z.templateLiteral([z.string(), '-', z.string()]),
  // e.g. CENTR 115
  location: z.templateLiteral([z.string(), ' ', z.string()])
})
const sectionSchema = z.strictObject({
  heading: z.literal(['Lecture', 'Discussion']),
  // e.g. '002-000-LE'
  section_code: z.templateLiteral([
    z.number(),
    '-',
    z.number(),
    '-',
    z.literal(['LE'])
  ]),
  // e.g. 'E 00000960'
  section_id: z.templateLiteral(['E ', z.number()]),
  instruction_type: z.literal(['lecture', 'discussion']),
  // e.g. 'CENTR 115'
  location: z.templateLiteral([z.string(), ' ', z.string()]),
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
  class_name: z.string(),
  course_title: z.string(),
  // Instructor name, e.g. 'Michael Holst'
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

export type Query = {
  sectionIds: number[]
  term: string
}
export async function getSections ({
  sectionIds,
  term
}: Query): Promise<Record<string, Course>> {
  if (sectionIds.length > MAX_SECTION_IDS) {
    throw new RangeError(`At most ${MAX_SECTION_IDS} sectionIds please`)
  }
  const url =
    BASE +
    atob(
      JSON.stringify({
        s: sectionIds.map(id => `E ${id.toString().padStart(8, '0')}`),
        t: term
      })
    )
  const response = await fetch(url, { headers })
  if (response.url !== url) {
    throw new Error(`Redirected to ${response.url}`)
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
  if (endIndex !== -1) {
    throw new SyntaxError('#course-detail-data did not end')
  }
  return z
    .record(z.string(), courseSchema)
    .parse(JSON.parse(html.slice(scriptIndex + SCRIPT_BEGIN.length, endIndex)))
}

if (import.meta.main) {
  console.log(
    await getSections({
      sectionIds: Array.from({ length: MAX_SECTION_IDS }, (_, i) => i),
      term: 'FA26'
    })
  )
}
