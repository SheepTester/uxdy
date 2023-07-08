/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Time } from '../../../util/Time.ts'
import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { compareRoomNums } from '../../lib/compareRoomNums.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { used } from '../../lib/now.ts'

export type RoomListProps = {
  weekday: number
  time: Time
  buildingCode: string
  rooms: Record<string, RoomMeeting[]>
  onSelect: (room: string) => void
}
export function RoomList ({
  weekday,
  time,
  buildingCode,
  rooms,
  onSelect
}: RoomListProps) {
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
    <div>
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
              <button
                class={`room ${
                  activeMeeting ? (soon ? 'soon' : 'active') : 'inactive'
                }`}
                onClick={() => onSelect(room)}
              >
                <div className='room-name'>
                  {buildingCode} {room}
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
              </button>
            )
          })}
      </div>
      <div class='gradient gradient-sticky gradient-bottom' />
    </div>
  )
}
