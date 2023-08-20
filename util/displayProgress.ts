import { writeAll } from 'std/streams/write_all.ts'

const LINE_LENGTH = 80
const BAR_LENGTH = 50

type DisplayProgressOptions = {
  lineLength: number
  barLength: number
  label: string
  stderr: boolean
}

const encoder = new TextEncoder()
export async function displayProgress (
  progress: number,
  {
    lineLength = LINE_LENGTH,
    barLength = BAR_LENGTH,
    label = '',
    stderr = false
  }: Partial<DisplayProgressOptions> = {}
) {
  await writeAll(
    stderr ? Deno.stderr : Deno.stdout,
    encoder.encode(
      `\r[${'='.repeat(Math.floor(progress * barLength))}${' '.repeat(
        barLength - Math.floor(progress * barLength)
      )}] ${label}`.padEnd(lineLength, ' ')
    )
  )
}
