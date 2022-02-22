/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'https://esm.sh/preact@10.6.6/hooks'
import { colleges } from '../building-locations.ts'
import { Building, compareRoomNums } from '../from-file.ts'
import { Now, used } from '../now.ts'
import { BackIcon } from './BackIcon.tsx'
import { CloseIcon } from './CloseIcon.tsx'
import { Schedule } from './Schedule.tsx'

type RoomListProps = {
  now: Now
  building: Building
  onClose: () => void
}
export function RoomList ({ now, building, onClose }: RoomListProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div class='room-list'>
      <h2 class='building-name'>
        {selected && (
          <button class='back' onClick={() => setSelected(null)}>
            <BackIcon />
          </button>
        )}
        <div
          class={`building-gradient college-${colleges[building.name]}`}
        ></div>
        {building.name} {selected}
        <button class='close' onClick={onClose}>
          <CloseIcon />
        </button>
      </h2>
      {selected ? (
        <Schedule now={now} meetings={building.rooms[selected]} />
      ) : (
        <div class='rooms'>
          {Object.entries(building.rooms)
            // Can't pre-sort the rooms object entries because JS sorts numerical
            // properties differently
            .sort(([a], [b]) => compareRoomNums(a, b))
            .map(([room, meetings]) => {
              const activeMeeting = meetings.find(used(now))
              return (
                <button
                  class={`room ${activeMeeting ? 'active' : ''}`}
                  onClick={() => setSelected(room)}
                >
                  <div className='room-name'>
                    {building.name} {room}
                  </div>
                  <div className='current-meeting'>
                    {activeMeeting
                      ? `${activeMeeting.course} (${activeMeeting.type})`
                      : 'Not in use'}
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
