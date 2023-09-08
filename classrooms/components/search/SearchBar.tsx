/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { termCode } from '../../../terms/index.ts'
import { Term } from '../../lib/TermCache.ts'
import { ClearIcon } from '../icons/CloseIcon.tsx'
import { SearchIcon } from '../icons/SearchIcon.tsx'
import { SearchData, SearchResults } from './SearchResults.tsx'

export type State =
  | { type: 'unloaded' }
  | { type: 'loading' }
  | {
      type: 'loaded'
      termId: string
      data: Omit<SearchData, 'buildings'>
      offline: Term[]
    }

export type SearchBarProps = {
  state: State
  terms: Term[]
  termId: string
  buildings: string[]
  showResults: boolean
  onSearch: (showResults: boolean) => void
  visible: boolean
}
export function SearchBar ({
  state,
  terms,
  termId,
  buildings,
  showResults,
  onSearch,
  visible
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLInputElement>(null)

  const loaded = state.type === 'loaded' && state.termId === termId

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        return
      }
      if ((e.key === '/' || e.key === 's') && e.target === document.body) {
        ref.current?.focus()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // TODO: show loading, offline errors with retry button
  return (
    <form
      role='search'
      action='javascript:'
      onSubmit={e => {
        // This sucks but I'm too lazy to think of a good React way to do
        // this
        const selected = e.currentTarget
          .closest('.search-wrapper')
          ?.querySelector('.result-selected')
        if (selected instanceof HTMLElement) {
          selected.click()
        }
      }}
      class={`search-wrapper ${visible ? '' : 'hide-search'} ${
        loaded && showResults && query !== '' ? 'showing-results' : ''
      }`}
    >
      <label class='search-bar'>
        <SearchIcon />
        <input
          type='text'
          id='search'
          autocomplete='off'
          autocapitalize='none'
          autocorrect='off'
          aria-label='Search courses, people, and buildings.'
          title="Press '/' to jump to the search box."
          placeholder='Search courses, people, buildings...'
          class='search-input'
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
            setIndex(0)
            onSearch(e.currentTarget.value.length > 0)
          }}
          onKeyDown={e => {
            if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
              return
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              setIndex(index =>
                index === null
                  ? e.key === 'ArrowUp'
                    ? -1
                    : 0
                  : index + (e.key === 'ArrowUp' ? -1 : 1)
              )
              e.preventDefault()
            }
          }}
          onFocus={e => {
            onSearch(e.currentTarget.value.length > 0)
          }}
          ref={ref}
        />
        {query.length > 0 && (
          <button
            class='icon-btn clear-btn'
            type='reset'
            onClick={() => {
              setQuery('')
              onSearch(false)
            }}
          >
            <ClearIcon />
          </button>
        )}
      </label>
      {loaded && showResults && (
        <SearchResults
          terms={terms}
          query={query}
          data={{ ...state.data, buildings }}
          index={index}
        />
      )}
    </form>
  )
}
