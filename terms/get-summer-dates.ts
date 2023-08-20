// deno run --allow-net=act.ucsd.edu terms/get-summer-dates.ts > terms/summer-dates.json

import { Day } from '../util/Day.ts'
import { displayProgress } from '../util/displayProgress.ts'
import { getTerm, termCode } from './index.ts'

const START_YEAR = 1995
// Summer should be available by May
const endYear = Day.today().year + (Day.today().month < 5 ? -1 : 0)

const months = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
async function getYear (term: string): Promise<[Day, Day]> {
  // From scheduleofclasses/scrape.ts
  const html = await fetch(
    `https://act.ucsd.edu/scheduleOfClasses/scheduleOfClassesStudentResult.htm?selectedTerm=${term}&selectedSubjects=MATH`
  ).then(r => r.text())
  const dateRangeMatch = html.match(
    /:&nbsp;([A-Z][a-z]*) (\d+) (\d+)&nbsp;-&nbsp;([A-Z][a-z]*) (\d+) (\d+)/
  )
  if (!dateRangeMatch) {
    throw new Error(`Couldn't get date range from ${term}.`)
  }
  return [
    Day.from(
      +dateRangeMatch[3],
      months.indexOf(dateRangeMatch[1]),
      +dateRangeMatch[2]
    ),
    Day.from(
      +dateRangeMatch[6],
      months.indexOf(dateRangeMatch[4]),
      +dateRangeMatch[5]
    )
  ]
}

const results: [number, number, Day, Day][] = []
for (let year = START_YEAR; year <= endYear; year++) {
  for (const quarter of ['S1', 'S2'] as const) {
    const term = termCode(year, quarter)
    results.push([year, +quarter[1], ...(await getYear(term))])
    displayProgress((year - START_YEAR) / (endYear - START_YEAR), {
      label: term,
      stderr: true
    })
  }
}
console.log(JSON.stringify(results) + '\n')
console.error()
