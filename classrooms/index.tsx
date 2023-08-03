/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './components/App.tsx'

render(<App />, document.getElementById('root')!)
