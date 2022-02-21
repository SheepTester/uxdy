/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { RoomMeeting } from '../from-file.ts'

const DAYS = [7, 1, 2, 3, 4, 5, 6]

type BuildingProps = {
  meetings: RoomMeeting[]
}
export function Schedule ({ meetings }: BuildingProps) {
  return (
    <div class='schedule'>
      {DAYS.map(day => (
        <div class='day' key={day}>
          {meetings}
        </div>
      ))}
    </div>
  )
}
