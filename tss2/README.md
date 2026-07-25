https://classplanner.apps.ucsd.edu/

i love vibe coded ucsd slop
they're all unauthenticated

routes:

- GET https://classplanner.apps.ucsd.edu/api/v1/planner/terms
- GET https://classplanner.apps.ucsd.edu/api/v1/planner/courses?term_code=FA26&q=CSE%20011&limit=10
- POST https://classplanner.apps.ucsd.edu/api/v1/planner/alternatives
- GET https://classplanner.apps.ucsd.edu/api/v1/schedules/CS2eyJzIjpbIkUgMDAwMDA5NTkiLCJFIDAwMDAzOTkxIl0sInQiOiJGQTI2In0?context=planner
- GET https://classplanner.apps.ucsd.edu/api/v1/planner/courses?term_code=FA26&q=cse&limit=10

from the code:

```js
K('/api/v1/planner/availability-refreshes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    term_code: e.termCode,
    subject_code: e.subjectCode,
    course_code: e.courseCode
  })
})

await H.GET('/api/v1/capes/summary', {
  params: {
    query: {
      subject_code: e,
      course_code: t,
      course_title: n,
      term_code: r,
      section_id: i
    }
  },
  signal: a
})

await H.POST('/api/v1/planner/offering-options', { body: e, signal: t })

await H.POST('/api/v1/schedules/short-links', { body: e })
```
