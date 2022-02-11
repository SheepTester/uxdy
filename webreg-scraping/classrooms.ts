// deno run --allow-read classrooms.ts

import { AuthorizedGetter } from './scrape.ts'
import { displayProgress } from './util/display-progress.ts'

export async function main (quarter: string, cachePath: string) {
  const getter = new AuthorizedGetter(quarter, undefined, undefined, cachePath)
  const buildings: Record<string, Record<string, number>> = {}
  await displayProgress(0)
  for await (const { course, progress } of getter.allCoursesWithProgress()) {
    for (const group of course.groups) {
      if (group.time?.location) {
        const { building, room } = group.time.location
        buildings[building] ??= {}
        buildings[building][room] ??= 0
        buildings[building][room]++
      }
    }
    await displayProgress(progress, { label: course.code })
  }
  console.log()

  console.log(
    Object.fromEntries(
      Object.entries(buildings)
        .map(
          ([building, rooms]) =>
            [
              building,
              Object.fromEntries(
                Object.entries(rooms).sort((a, b) => a[0].localeCompare(b[0]))
              )
            ] as const
        )
        .sort((a, b) => a[0].localeCompare(b[0]))
    )
  )
}

if (import.meta.main) {
  await main('WI22', './cache-wi22/')
}
