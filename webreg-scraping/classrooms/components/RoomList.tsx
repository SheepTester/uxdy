/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { colleges } from '../building-locations.ts'
import { Building, compareRoomNums } from '../from-file.ts'

type RoomListProps = {
  building: Building
  onClose: () => void
}
export function RoomList ({ building, onClose }: RoomListProps) {
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
        {Object.keys(building.rooms)
          // Can't sort the rooms object because JS sorts numerical properties
          // differently
          .sort(compareRoomNums)
          .map(room => (
            <button class='room'>
              {building.name} {room}
            </button>
          ))}
      </div>
    </div>
  )
}
