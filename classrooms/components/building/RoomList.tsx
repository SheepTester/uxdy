/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Time } from '../../../util/Time.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { compareRoomNums } from '../../lib/compareRoomNums.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { used } from '../../lib/now.ts'
import { Link } from '../Link.tsx'

export type RoomListProps = {
  weekday: number
  time: Time
  building: string
  rooms: Record<string, RoomMeeting[]>
}
export function RoomList ({ weekday, time, building, rooms }: RoomListProps) {
  if (Object.keys(rooms).length === 0) {
    return (
      <div class='empty'>
        <p>
          This building isn't used for any classes this week, as far as WebReg
          is concerned.
        </p>
      </div>
    )
  }

  return (
    <div class='room-list'>
      <div class='gradient gradient-sticky gradient-top' />
      <div class='rooms'>
        {Object.entries(rooms)
          // Can't pre-sort the rooms object entries because JS sorts numerical
          // properties differently
          .sort(([a], [b]) => compareRoomNums(a, b))
          .map(([room, meetings]) => {
            const activeMeeting = meetings.find(used(weekday, time, 10))
            const soon = activeMeeting && time < activeMeeting.start
            return (
              <Link
                view={{ type: 'building', building, room }}
                class={`room ${
                  activeMeeting ? (soon ? 'soon' : 'active') : 'inactive'
                }`}
              >
                <div className='room-name'>
                  {building} {room}
                </div>
                <div className='current-meeting'>
                  {activeMeeting ? (
                    <>
                      {activeMeeting.course}{' '}
                      {soon ? (
                        'soon'
                      ) : (
                        <>
                          (
                          <abbr title={meetingTypes[activeMeeting.type]}>
                            {activeMeeting.type}
                          </abbr>
                          )
                        </>
                      )}
                    </>
                  ) : (
                    'Not in use'
                  )}
                </div>
              </Link>
            )
          })}
      </div>
      <div class='gradient gradient-sticky gradient-bottom' />
    </div>
  )
}
