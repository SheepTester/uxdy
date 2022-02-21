/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { colleges } from '../building-locations.ts'
import { Building, compareRoomNums } from '../from-file.ts'
import { Now, used } from '../now.ts'

type RoomListProps = {
  now: Now
  building: Building
  onClose: () => void
}
export function RoomList ({ now, building, onClose }: RoomListProps) {
  return (
    <div class='room-list'>
      <h2 class='building-name'>
        <div
          class={`building-gradient college-${colleges[building.name]}`}
        ></div>
        {building.name}
        <button class='close' onClick={onClose}>
          ×
        </button>
      </h2>
      <div class='rooms'>
        {Object.entries(building.rooms)
          // Can't sort the rooms object because JS sorts numerical properties
          // differently
          .sort(([a], [b]) => compareRoomNums(a, b))
          .map(([room, meetings]) => {
            const activeMeeting = meetings.find(used(now))
            return (
              <button class={`room ${activeMeeting ? 'active' : ''}`}>
                {building.name} {room}
                {activeMeeting && (
                  <>
                    :{' '}
                    <span className='active-meeting'>
                      {activeMeeting.course} ({activeMeeting.type})
                    </span>
                  </>
                )}
              </button>
            )
          })}
      </div>
    </div>
  )
}
