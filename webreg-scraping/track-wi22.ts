// I kept a Git repository of the cached WebReg responses over time
// deno run --allow-all track-wi22.ts

import { main } from './track-classes.ts'

const QUARTER = 'WI22'
const DIRECTORY = 'cache-wi22'
const OUT_DIR = 'webreg-data2'

const decoder = new TextDecoder()
async function run (command: string[], directory = DIRECTORY) {
  const process = Deno.run({
    cmd: command,
    cwd: directory,
    stdout: 'piped'
  })
  const status = await process.status()
  if (!status.success) {
    throw new EvalError(`Exit code ${status.code}, signal ${status.signal}`)
  }
  return decoder.decode(await process.output())
}

await run(['git', 'checkout', 'master'])
const commits = await run(['git', 'log', '--format=%H %s']).then(lines =>
  lines
    .trim()
    .split(/\r?\n/)
    .map(line => {
      const [hash, message] = line.split(' ')
      if (message === '2021-01-09') {
        // Accidentally wrote 2021 for one of the dates; can't just blindly use
        // 2022 though because I have a legit 2021 date
        return { hash, date: ['22', '01', '09'] }
      }
      const match = message.match(/\d\d(\d\d)-(\d\d)-(\d\d)/)
      return { hash, date: match ? match.slice(1) : [] }
    })
    .filter(({ date }) => date.length !== 0)
)

for (const { hash, date } of commits.reverse()) {
  await run(['git', 'checkout', hash])
  await main(QUARTER, date.join(''), { type: 'cache', cachePath: DIRECTORY })
  await run(['git', 'add', '.'], OUT_DIR)
  // await run(
  //   [
  //     'git',
  //     'commit',
  //     '-m',
  //     `20${date.join(
  //       '-'
  //     )}\nAutomatically committed by https://github.com/SheepTester/uxdy/blob/main/webreg-scraping/track-wi22.ts`
  //   ],
  //   OUT_DIR
  // )
  console.log(`20${date.join('-')} done.`)
  if (!confirm('Continue?')) {
    break
  }
}
