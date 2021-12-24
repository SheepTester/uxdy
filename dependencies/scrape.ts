// deno run --allow-all dependencies/scrape.ts

import { ensureDir } from 'https://deno.land/std@0.119.0/fs/ensure_dir.ts'
import { dirname, fromFileUrl } from 'https://deno.land/std@0.119.0/path/mod.ts'
import {
  DOMParser,
  Element,
  HTMLDocument
} from 'https://deno.land/x/deno_dom@v0.1.19-alpha/deno-dom-wasm.ts'

const HOST = 'https://catalog.ucsd.edu/'

const parser = new DOMParser()

async function getPage (path: string): Promise<HTMLDocument> {
  const cachePath = new URL(`./.cache/${path}`, import.meta.url)
  const html = await Deno.readTextFile(cachePath).catch(async err => {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err
    }

    console.log(`Fetching ${path}`)
    const response = await fetch(new URL(path, HOST))
    if (response.ok) {
      const html = await response.text()
      await ensureDir(dirname(fromFileUrl(cachePath)))
      await Deno.writeTextFile(cachePath, html)
      return html
    } else {
      throw new Error(`HTTP ${response.status} error`)
    }
  })

  const document = parser.parseFromString(html, 'text/html')
  if (!document) {
    throw new Error('Document is null.')
  }
  return document
}
const courseListLinks = new Set(
  Array.from((await getPage('/front/courses.html')).querySelectorAll('a'), a =>
    (a as Element).getAttribute('href')?.slice(2)
  ).filter((href): href is string => href?.includes('/courses/') ?? false)
)
// I believe all the courses listed on this page are already listed elsewhere
courseListLinks.delete('/courses/SCIS.html')

/**
 * Matches and captures the subject code. Discards remaining subject codes if
 * separated by slashes.
 *
 * Captures:
 * 1. The first subject code.
 */
const subjectCodeRegex = /(?:Linguistics(?:\/[\w ]+)? \()?([A-Z]+)(?:\/[A-Z]+)*\)?/
/**
 * Matches course code. Captures the course number and letter(s) individually.
 * There can be multiple course numbers or letters, separated by slashes,
 * hyphens, or en dashes, all of which are captured. If they are separated by
 * dashes, it means it's a sequence, and there should be corresponding units per
 * individual course.
 *
 * There's a third capture group that captures other course codes in a list. For
 * example, it would match ", 5B, 5C" in "5A, 5B, 5C."
 *
 * Captures:
 * 2. The course code number.
 * 3. The course code letter.
 * 4. Other course codes.
 */
const courseCodeRegex = /(\d+(?:[/-]\d+)*) ?([A-Z]+(?:[-–][A-Z]+)*)?((?:(?:, | or )\d+[A-Z]*)*)/
/**
 * Matches and discards extra courses, separated by slashes or commas. There's a
 * special case for [COM
 * GEN](https://catalog.ucsd.edu/courses/HIST.html#hito193).
 */
const extraCourseRegex = /(?:(?:\/|, )(?:[A-Z]+|COM GEN) \d+[A-Z]*)*/
/**
 * Matches units.
 *
 * Captures:
 * 6. Units.
 */
const unitRegex = /\((\d+(?:\.\d+)?(?:(?:–| to )\d+)?(?:(?:, (?:or )?| or |[/-])\d+(?:–\d+)?)*(?:\/0)?) ?\)/
/**
 * Big master regex. Also matches the name (title) of the course.
 *
 * Additional captures:
 * 5. Course title.
 */
const courseNameRegex = new RegExp(
  `^${subjectCodeRegex
    .toString()
    .slice(1, -1)} ${courseCodeRegex
    .toString()
    .slice(1, -1)}${extraCourseRegex
    .toString()
    .slice(1, -1)}[:.]? ?(.+)(?: ${unitRegex.toString().slice(1, -1)})?$`
)

for (const path of courseListLinks) {
  const courseList = await getPage(path)

  for (const courseName of courseList.querySelectorAll('p.course-name')) {
    // Replace nbsp with ASCII space
    const rawCourseName = courseName.textContent.replace(/\u00a0/g, ' ')
    if (rawCourseName === 'Electives. Varies (12)') {
      // Not really a course. https://catalog.ucsd.edu/courses/MBC.html
      continue
    }
    // See README.md for oddities
    const match = rawCourseName.trim().match(courseNameRegex)
    if (!match) {
      console.error(
        'Course name regex did not match, may be too strict.',
        Deno.inspect(rawCourseName, { colors: true })
      )
      const nonAscii = rawCourseName.replace(/[\u0000-\u007f]/g, '')
      if (nonAscii.length > 0) {
        console.log(
          'Course name contains non-ASCII characters:',
          Array.from(
            nonAscii,
            char =>
              'U+' +
              char
                .codePointAt(0)
                ?.toString(16)
                .padStart(4, '0')
          )
        )
      }
      continue
    }
    const [
      ,
      subject,
      courseNumber,
      courseLetter,
      otherCourses,
      name,
      unitsRaw
    ] = match
  }
}
