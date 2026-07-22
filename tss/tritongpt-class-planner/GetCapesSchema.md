# CAPES Evaluation Cache Schema

Preferred flow: call this endpoint, generate SQL against the views below, then call `/capes/query` for historical evaluation lookups.

## Views
- `capes_evaluations`: one row per historical evaluation record
- `capes_instructor_course_summary`: aggregated instructor-by-course metrics
- `capes_search_fts`: partial search index for course and instructor discovery
- `capes_cache_status`: one-row freshness and row-count summary

## Join Guidance
- Join CAPES to live schedule data primarily on `subject_code` and `course_code`.
- Only use instructor-name matching when the student explicitly asks about a specific professor.
- `quarter_sort_key` is the safest way to order CAPES history chronologically.

## Natural Language To SQL Examples
### Student asks: "Who has the best historical CAPES results for CSE 100?"
```sql
SELECT instructor_name, evaluation_count, quarter_count,
       avg_recommended_professor_pct, avg_recommended_class_pct,
       avg_study_hours_per_week, avg_grade_received_points
FROM capes_instructor_course_summary
WHERE subject_code = 'CSE'
  AND course_code = '100'
  AND evaluation_count >= 2
ORDER BY avg_recommended_professor_pct DESC,
         avg_recommended_class_pct DESC,
         evaluation_count DESC
```

### Student asks: "Compare professors who have taught CSE 100 recently."
```sql
SELECT quarter_code, instructor_name, recommended_professor_pct,
       recommended_class_pct, study_hours_per_week,
       avg_grade_expected_points, avg_grade_received_points
FROM capes_evaluations
WHERE subject_code = 'CSE'
  AND course_code = '100'
ORDER BY quarter_sort_key DESC, instructor_name
```

### Student asks: "Find instructors with strong recommendations and lighter workload for MATH 20B."
```sql
SELECT instructor_name, evaluation_count, avg_recommended_professor_pct,
       avg_recommended_class_pct, avg_study_hours_per_week
FROM capes_instructor_course_summary
WHERE subject_code = 'MATH'
  AND course_code = '20B'
  AND evaluation_count >= 2
  AND avg_recommended_professor_pct >= 85
ORDER BY avg_study_hours_per_week ASC,
         avg_recommended_professor_pct DESC
```

### Student asks: "Find evaluations for professor Lovelace in CSE 100." Search broadly, then narrow exact matches.
```sql
WITH hits AS (
  SELECT DISTINCT record_id
  FROM capes_search_fts
  WHERE capes_search_fts MATCH 'lovelace* cse* 100*'
)
SELECT e.quarter_code, e.instructor_name, e.class_name, e.course_title,
       e.recommended_professor_pct, e.recommended_class_pct,
       e.study_hours_per_week, e.evaluation_url
FROM hits h
JOIN capes_evaluations e
  ON e.id = h.record_id
WHERE e.subject_code = 'CSE'
  AND e.course_code = '100'
ORDER BY e.quarter_sort_key DESC
```