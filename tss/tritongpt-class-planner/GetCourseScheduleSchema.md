# Course Schedule Cache Schema

Preferred flow: call this endpoint, generate SQL against the views below, then call `/course-schedule/plan` with exact `subject_code` and `course_code` values before presenting the returned `short_url`.

## Views
- `course_sections`: course + section availability and identity
- `section_meetings`: one row per meeting/exam occurrence
- `course_search_fts`: course-level partial search index
- `course_cache_status`: per-term freshness and counts

## Time Encoding
- `start_minutes` / `end_minutes` are minutes since midnight
- `specific_date` is `YYYY-MM-DD` for exams/date-bound meetings
- `day_code` uses `MTWRFSU` for recurring meetings

## Planning Notes
- Fetch class meetings, midterms, and finals together for requested courses.
- For course meeting lookups, query `section_meetings` directly with `term_code`, `subject_code`, `course_code`, and `is_cancelled`; do not join `course_sections` back to `section_meetings` because `section_meetings` already contains section identity and course filter columns.
- Students may enter legacy course names such as `CSE 8A` or `BILD 1`. Resolve exact course codes from query results before planning: `CSE 8A` uses `course_code = '008A'`, `BILD 1` uses `course_code = '001'`, and `CHEM 6A` uses `course_code = '006A'`.
- For a legacy subject/course request, filter by `subject_code` plus a leading-zero-insensitive `course_code` comparison (for example, `LTRIM(course_code, '0') = '1'`) before preserving the exact returned code.
- Preserve returned `course_code` values exactly when calling `/course-schedule/plan`; do not strip leading zeroes.
- In student-facing text, write each course as its TSS module code: `CSE-008A`, `BILD-001`, or `CHEM-006A`.
- For exact course requests, narrow broad FTS hits with `subject_code` and `course_code`.
- Preserve related section families when section codes indicate grouping, such as `A00`, `A01`, and `A50`.
- Use `section_ref` values from selected rows for conversation context; `/course-schedule/plan` returns validation and a student-facing `short_url`.

## Natural Language To SQL Examples
### Student asks: "Can you find BILD 1 and CSE 8A for Fall 2026?" Resolve legacy course codes without guessing their padding, then use canonical course codes.
```sql
SELECT term_code, subject_code, course_code, class_name, course_title
FROM course_sections
WHERE term_code = 'FA26'
  AND ((subject_code = 'BILD' AND LTRIM(course_code, '0') = '1')
       OR (subject_code = 'CSE' AND LTRIM(course_code, '0') = '8A'))
ORDER BY subject_code, course_code
```

### Student asks: "Show me all open DSC 10 section A lecture, discussion, lab, and final options for Winter 2026."
```sql
SELECT section_ref, section_id, class_name, course_title, section_code,
       instruction_type_name, instructors_text, seats_available,
       waitlist_available, meeting_kind, day_code, specific_date,
       start_time_display, end_time_display, building_code, room_code,
       is_remote, is_tba
FROM section_meetings
WHERE term_code = 'WI26'
  AND subject_code = 'DSC'
  AND course_code = '10'
  AND section_code LIKE 'A%'
  AND is_cancelled = 0
  AND seats_available > 0
ORDER BY section_code,
         CASE meeting_kind WHEN 'class' THEN 0 WHEN 'midterm' THEN 1 WHEN 'final' THEN 2 ELSE 3 END,
         specific_date, day_code, start_minutes
```

### Student asks: "Find DSC10A". Search broadly, then narrow exact course matches so DSC 100 is not included.
```sql
WITH course_hits AS (
  SELECT DISTINCT term_code, subject_code, course_code
  FROM course_search_fts
  WHERE term_code = 'WI26'
    AND course_search_fts MATCH 'dsc* 10*'
)
SELECT m.section_ref, m.section_id, m.class_name, m.course_title,
       m.section_code, m.instruction_type_name, m.instructors_text,
       m.seats_available, m.meeting_kind, m.day_code, m.specific_date,
       m.start_time_display, m.end_time_display, m.building_code, m.room_code
FROM course_hits h
JOIN section_meetings m
  ON m.term_code = h.term_code
 AND m.subject_code = h.subject_code
 AND m.course_code = h.course_code
WHERE m.subject_code = 'DSC'
  AND m.course_code = '10'
  AND m.is_cancelled = 0
  AND m.seats_available > 0
ORDER BY m.class_name, m.section_code, m.meeting_kind,
         m.specific_date, m.day_code, m.start_minutes
```

### Student asks: "I want DSC 10, but no classes before 10am." Keep all rows for sections that pass the time filter.
```sql
WITH candidate_sections AS (
  SELECT DISTINCT term_code, section_id
  FROM section_meetings
  WHERE term_code = 'WI26'
    AND subject_code = 'DSC'
    AND course_code = '10'
    AND is_cancelled = 0
    AND seats_available > 0
    AND NOT EXISTS (
      SELECT 1
      FROM section_meetings early
      WHERE early.term_code = section_meetings.term_code
        AND early.section_id = section_meetings.section_id
        AND early.meeting_kind = 'class'
        AND early.start_minutes < 600
    )
)
SELECT m.section_ref, m.class_name, m.section_code,
       m.instruction_type_name, m.seats_available, m.meeting_kind,
       m.day_code, m.specific_date, m.start_time_display, m.end_time_display
FROM candidate_sections c
JOIN section_meetings m
  ON m.term_code = c.term_code
 AND m.section_id = c.section_id
ORDER BY m.section_code, m.meeting_kind, m.specific_date,
         m.day_code, m.start_minutes
```

### Student asks: "What undergraduate lectures are available in Winter 2026?"
```sql
SELECT section_ref, class_name, course_title, section_code,
       instruction_type_name, instructors_text, seats_available
FROM course_sections
WHERE term_code = 'WI26'
  AND academic_level = 'UD'
  AND instruction_type_name = 'lecture'
  AND is_cancelled = 0
ORDER BY subject_code, course_code, section_code
```
