/** @jsxImportSource https://esm.sh/preact@10.6.4 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.6.4'
import { useEffect, useState } from 'https://esm.sh/preact@10.6.4/hooks'
import { AuthorizedGetter, Course } from '../scrape.ts'

const params = new URL(window.location.href).searchParams

// `useEffect` doesn't accept an async function.
function useAsyncEffect (callback: () => Promise<void>) {
  useEffect(() => {
    callback()
  }, [])
}

function App () {
  const [courses, setCourses] = useState<Course[]>([])

  useAsyncEffect(async () => {
    const term = params.get('p1')
    if (!term) {
      alert("I can't know what quarter you're on based on the URL.")
      return
    }
    const getter = new AuthorizedGetter(term)
    const courses = []
    for await (const course of getter.allCourses()) {
      courses.push(course)
      setCourses([...courses])
    }
  })

  return <ul>{courses.map(course => course.title)}</ul>
}

const root = document.createElement('div')
document.getElementById('msg-status')?.after(root)
render(<App />, root)
