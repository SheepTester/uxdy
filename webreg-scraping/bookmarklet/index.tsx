/** @jsxImportSource https://esm.sh/preact@10.6.4 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.4'
import { useState } from 'https://esm.sh/preact@10.6.4/hooks'
import { AuthorizedGetter } from '../scrape.ts'

function App () {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count => count + 1)}>+1</button>
    </div>
  )
}

const root = document.createElement('div')
document.getElementById('msg-status')?.after(root)
render(<App />, root)
