/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { Building } from '../from-file.ts'

type BuildingProps = {
  building: Building
}

export function Building ({ building }: BuildingProps) {
  return (
    <div className='building'>
      <h2 className='building-name'>{building.name}</h2>
      <p>{Object.keys(building.rooms).sort().join(' ')}</p>
    </div>
  )
}
