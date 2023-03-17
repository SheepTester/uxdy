/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { colleges } from '../building-locations.ts'
import { Building, compareRoomNums } from '../from-file.ts'
import { Now, used } from '../now.ts'
import { BackIcon } from './BackIcon.tsx'
import { CloseIcon } from './CloseIcon.tsx'
import { Schedule } from './Schedule.tsx'

type RoomListProps = {
  now?: Now | null
  building: Building
  onClose: () => void
  class?: string
}
export function RoomList ({
  now,
  building,
  onClose,
  class: className = ''
}: RoomListProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div class={`room-list ${className}`}>
      <h2 class='building-name'>
        <button
          class='back'
          onClick={() => setSelected(null)}
          disabled={!selected}
        >
          <BackIcon />
        </button>
        <div class={`building-gradient college-${colleges[building.name]}`} />
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
              const activeMeeting = now && meetings.find(used(now, 10))
              const soon = activeMeeting && now.time < activeMeeting.start
              return (
                <button
                  class={`room ${
                    activeMeeting ? (soon ? 'soon' : 'active') : ''
                  }`}
                  onClick={() => setSelected(room)}
                >
                  <div className='room-name'>
                    {building.name} {room}
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
      )}
    </div>
  )
}
