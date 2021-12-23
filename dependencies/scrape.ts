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
console.log([...courseListLinks])

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
    const match = rawCourseName
      .trim()
      .match(
        /^(?:Linguistics(?:\/[A-Z][a-z]*(?: [A-Z][a-z]*)*)? \()?([A-Z]{2,4}|CLASSIC)(?:\/[A-Z]{2,4})*\)? (\d+(?:[/-]\d+)*) ?([A-Z]{1,2}(?:[-–][A-Z]{1,2})*)?(?:\/(?:[A-Z]{2,4}|COM GEN) \d+[A-Z]{0,2})*[:.] ?(.+) \((\d+(?:(?:, (?:or )?|-)\d+)*|\d+(?: (?:or|to) |–)\d+|\d+–\d+(?:(?:\/|, )\d+–\d+)*|2\.[05]) ?\)$/
      )
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
    const [, subject, courseNumber, courseLetter, name, unitsRaw] = match
  }
}
