/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { meetingTypes } from '../../../webreg-scraping/meeting-types.ts'
import { compareRoomNums } from '../../lib/compareRoomNums.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { Now, used } from '../../lib/now.ts'

export type RoomListProps = {
  now?: Now | null
  buildingCode: string
  rooms: Record<string, RoomMeeting[]>
  onSelect: (room: string) => void
}
export function RoomList ({
  now,
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
      <div class='gradient gradient-top' />
      <div class='rooms'>
        {Object.entries(rooms)
          // Can't pre-sort the rooms object entries because JS sorts numerical
          // properties differently
          .sort(([a], [b]) => compareRoomNums(a, b))
          .map(([room, meetings]) => {
            const activeMeeting = now && meetings.find(used(now, 10))
            const soon = activeMeeting && now.time < activeMeeting.start
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
                {now && (
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
                )}
              </button>
            )
          })}
      </div>
      <div class='gradient gradient-bottom' />
    </div>
  )
}
