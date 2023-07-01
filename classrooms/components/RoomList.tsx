/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { meetingTypes } from '../../webreg-scraping/meeting-types.ts'
import { colleges } from '../lib/building-locations.ts'
import { Building, compareRoomNums } from '../lib/coursesFromFile.ts'
import { Now, used } from '../lib/now.ts'
import { AbbrevHeading } from './AbbrevHeading.tsx'
import { BackIcon } from './BackIcon.tsx'
import { CloseIcon } from './CloseIcon.tsx'
import { Schedule } from './Schedule.tsx'

type RoomListProps = {
  now?: Now | null
  building: Building
  onClose: () => void
  visible: boolean
  rightPanelOpen: boolean
}
export function RoomList ({
  now,
  building,
  onClose,
  visible,
  rightPanelOpen
}: RoomListProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [lastRoom, setLastRoom] = useState('')

  // Keep last room number visible when animating back to room list
  useEffect(() => {
    if (selected) {
      setLastRoom(selected)
    }
  }, [selected])

  return (
    <div
      class={`room-list ${visible ? '' : 'room-list-invisible'} ${
        rightPanelOpen ? 'right-panel-open' : ''
      }`}
    >
      <div class={`building-name ${selected ? 'schedule-view' : 'list-view'}`}>
        <button
          class='back'
          onClick={() => setSelected(null)}
          disabled={!selected}
        >
          <BackIcon />
        </button>
        <div class={`building-gradient college-${colleges[building.name]}`} />
        <img class='building-image' src='https://i.imgur.com/PiC2Cb8.jpeg' />
        <AbbrevHeading
          heading='h2'
          abbrev={
            <span>
              {building.name}{' '}
              <span class='room-number'>{selected || lastRoom}</span>
            </span>
          }
        >
          Center Hall
        </AbbrevHeading>
        <button class='close' onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {selected ? (
        <Schedule now={now} meetings={building.rooms[selected]} />
      ) : (
        <div>
          <div class='gradient gradient-top' />
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
                      activeMeeting ? (soon ? 'soon' : 'active') : 'inactive'
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
          <div class='gradient gradient-bottom' />
        </div>
      )}
    </div>
  )
}
