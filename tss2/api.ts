/**
 * @file
 * usage: node tss2/api.ts
 */

import z from 'zod'
import { xhrHeaders as headers } from '../tss/headers.ts'

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
  }
  throw new TypeError(message)
}
function checkResponse (response: Response): Response {
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} error:\n${response.text().catch(() => '(failed to read response text)')}`
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
  const json = await checkResponse(
    await fetch(`${BASE}/planner/terms`, { headers })
  ).json()
  return parse(termsSchema, json).terms
}

if (import.meta.main) {
  console.log(await getTerms())
}
