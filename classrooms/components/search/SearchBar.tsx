/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { termCode } from '../../../terms/index.ts'
import { Term, TermCache } from '../../lib/TermCache.ts'
import { SearchIcon } from '../icons/SearchIcon.tsx'
import { SearchResults } from './SearchResults.tsx'

type CourseData = {
  courses: Course[]
  professors: string[]
}

type State =
  | { type: 'unloaded' }
  | { type: 'loading' }
  | { type: 'loaded'; terms: string; data: CourseData }
  | { type: 'error' }

export type SearchBarProps = {
  termCache: TermCache
  terms: Term[]
  visible: boolean
}
export function SearchBar ({ termCache, terms, visible }: SearchBarProps) {
  const termsId = terms.map(term => termCode(term.year, term.quarter)).join(' ')
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>({ type: 'unloaded' })
  const loaded = state.type === 'loaded' && state.terms === termsId

  async function loadTerms (): Promise<void> {
    const maybePromise = termCache.requestTerms(terms, true)
    if (maybePromise instanceof Promise) {
      // Show "Loading..."
      setState({ type: 'loading' })
    }
    const { successes, errors } =
      maybePromise instanceof Promise ? await maybePromise : maybePromise
    if (successes.length > 0) {
      setState({
        type: 'loaded',
        terms: termsId,
        data: { courses: [], professors: [] }
      })
    } else {
      setState({ type: 'error' })
    }
  }

  return (
    <div class={`search-wrapper ${visible ? '' : 'hide-search'}`}>
      <label class='search-bar'>
        <SearchIcon />
        <input
          type='search'
          placeholder='Coming soon...'
          class='search-input'
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
            if (!loaded && state.type !== 'loading') {
              loadTerms()
            }
          }}
        />
      </label>
      {loaded && <SearchResults query={query} />}
    </div>
  )
}
