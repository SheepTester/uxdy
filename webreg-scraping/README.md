# WebReg documentation

## Authentication

WebReg requests require two cookies to be set in the Cookie header:
`jlinksessionidx` and `UqZBpD3n`.

Also, I think even though you need to specify `termcode` in the URL parameters,
you still need to select it in WebReg when you first log in.

## Endpoints

**NOTE**: Prettier gets rid of the padded spaces at the end of the example
string values, unfortunately.

### List all subjects

```
GET https://act.ucsd.edu/webreg2/svc/wradapter/secure/search-load-subject
```

| Query parameter | Example value | Notes                   |
| --------------- | ------------- | ----------------------- |
| termcode        | WI22          | The ID of this quarter. |

Responds with a JSON array of objects:

```ts
function searchLoadSubject (): {
  LONG_DESC: string
  SUBJECT_CODE: string
}[]
```

| Field          | Example value     | Notes                                                                  |
| -------------- | ----------------- | ---------------------------------------------------------------------- |
| `SUBJECT_CODE` | `"DSC "`          | Seems to always be 4 characters long, padded on the right with spaces. |
| `LONG_DESC`    | `"Data Science "` | Seems to be 30 characters long, padded on the right with spaces.       |

### List all departments

```
GET https://act.ucsd.edu/webreg2/svc/wradapter/secure/search-load-department
```

| Query parameter | Example value | Notes                   |
| --------------- | ------------- | ----------------------- |
| termcode        | WI22          | The ID of this quarter. |

Responds with a JSON array of objects:

```ts
function searchLoadDepartment (): {
  DEP_CODE: string
  DEP_DESC: string
}[]
```

| Field      | Example value               | Notes                                   |
| ---------- | --------------------------- | --------------------------------------- |
| `DEP_CODE` | `"CCS "`                    | 4 characters long, padded with spaces.  |
| `DEP_DESC` | `"Climate Change Studies "` | 35 characters long, padded with spaces. |

### List all courses

```
GET https://act.ucsd.edu/webreg2/svc/wradapter/secure/search-by-all
```

Leaving most of the query parameters blank will list all the courses.

| Query parameter  | Example value | Notes                   |
| ---------------- | ------------- | ----------------------- |
| subjcode         | ""            |                         |
| crsecode         | ""            |                         |
| department       | ""            |                         |
| professor        | ""            |                         |
| title            | ""            |                         |
| levels           | ""            |                         |
| days             | ""            |                         |
| timestr          | ""            |                         |
| opensection      | false         |                         |
| isbasic          | true          |                         |
| basicsearchvalue | ""            |                         |
| termcode         | WI22          | The ID of this quarter. |

Responds with a JSON array of objects:

```ts
function searchByAll (): {
  UNIT_TO: number
  SUBJ_CODE: string
  UNIT_INC: number
  CRSE_TITLE: string
  UNIT_FROM: number
  CRSE_CODE: string
}[]
```

UCSD course units are quite bizarre and not what you'd expect. Some courses can
be up to 21 units, and some courses have 2.5 units. WebReg uses from/inc/to to
determine what options to show in the dropdown for courses that can have a
variable number of units.

| Field        | Example value            | Notes                                                    |
| ------------ | ------------------------ | -------------------------------------------------------- |
| `SUBJ_CODE`  | `"AAS "`                 | 4 characters                                             |
| `CRSE_CODE`  | `"500 "`                 | 5 characters                                             |
| `CRSE_TITLE` | `"Apprentice Teaching "` | 30 characters                                            |
| `UNIT_FROM`  | `1.0`                    |                                                          |
| `UNIT_TO`    | `4.0`                    | Always greater than `UNIT_FROM`                          |
| `UNIT_INC`   | `1.0`                    | Always zero if and only if `UNIT_FROM` equals `UNIT_TO`. |

**Exception**: Math 295 has `UNIT_FROM` = `UNIT_TO` = `UNIT_INC` = 1.0, for some
reason.

### List all sections for a course

```
GET https://act.ucsd.edu/webreg2/svc/wradapter/secure/search-load-group-data
```

| Query parameter | Example value | Notes                               |
| --------------- | ------------- | ----------------------------------- |
| subjcode        | USP           | Needs to be padded to 4 characters. |
| crscode         | 131           | Needs to be padded to 5 characters. |
| termcode        | WI22          | The ID of this quarter.             |

You can take the strings directly from `search-by-all`'s `SUBJ_CODE` and
`CRSE_CODE`.

Responds with a JSON array of objects:

```ts
function searchLoadGroupData (): {
  END_MM_TIME: number
  SCTN_CPCTY_QTY: number
  LONG_DESC: string
  SCTN_ENRLT_QTY: number
  BEGIN_HH_TIME: number
  SECTION_NUMBER: string
  SECTION_START_DATE: string
  STP_ENRLT_FLAG: 'Y' | 'N'
  SECTION_END_DATE: string
  COUNT_ON_WAITLIST: number
  PRIMARY_INSTR_FLAG: 'Y' | ' '
  BEFORE_DESC: ' ' | 'AC' | 'NC'
  ROOM_CODE: string
  END_HH_TIME: number
  START_DATE: string
  DAY_CODE: string
  BEGIN_MM_TIME: number
  PERSON_FULL_NAME: string
  FK_SPM_SPCL_MTG_CD: '  ' | 'FI' | 'TBA' | 'MI' | 'MU' | 'RE' | 'PB' | 'OT'
  PRINT_FLAG: ' ' | 'N' | 'Y' | '5'
  BLDG_CODE: string
  FK_SST_SCTN_STATCD: 'AC' | 'NC' | 'CA'
  FK_CDI_INSTR_TYPE:
    | 'DI'
    | 'LE'
    | 'SE'
    | 'PR'
    | 'IN'
    | 'IT'
    | 'FW'
    | 'LA'
    | 'CL'
    | 'TU'
    | 'CO'
    | 'ST'
    | 'OP'
    | 'OT'
    | 'SA'
  SECT_CODE: string
  AVAIL_SEAT: number
}[]
```

| Field                | Example value                      | Notes                                                            |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `BEGIN_HH_TIME`      | `17`                               | Start hour of meeting.                                           |
| `BEGIN_MM_TIME`      | `0`                                | Start minute of meeting.                                         |
| `END_HH_TIME`        | `18`                               | End hour of meeting.                                             |
| `END_MM_TIME`        | `20`                               | End minute of meeting.                                           |
| `DAY_CODE`           | `"13"`                             | A string of digits (1-5)                                         |
| `SECT_CODE`          | `"A00"`                            | A capital letter or 0 or 1 followed by two digits.               |
| `SCTN_ENRLT_QTY`     | `0`                                | The number of people enrolled.                                   |
| `AVAIL_SEAT`         | `50`                               | Number of seats available.                                       |
| `SCTN_CPCTY_QTY`     | `50`                               | The maximum number of seats. 9999 for no limit.                  |
| `COUNT_ON_WAITLIST`  | `0`                                | The number of people on the waitlist.                            |
| `STP_ENRLT_FLAG`     | `"N"`                              | Whether to prevent enrolment.                                    |
| `BLDG_CODE`          | `"PCYNH"`                          | 5 characters, padded, or `"TBA"`.                                |
| `ROOM_CODE`          | `"120 "`                           | 5 characters, padded, or `"TBA"`.                                |
| `PERSON_FULL_NAME`   | `"Wartell, Julie Dara ;A00785828"` | A colon-separated (`:`) list of name-PID pairs, or `"Staff; "`.  |
| `PRIMARY_INSTR_FLAG` | `"Y"`                              | No idea.                                                         |
| `SECTION_START_DATE` | `"2022-01-03"`                     | YYYY-MM-DD. The first day of the meetings.                       |
| `SECTION_END_DATE`   | `"2022-03-11"`                     | YYYY-MM-DD. The last day of the meetings.                        |
| `START_DATE`         | `"2022-01-03"`                     | YYYY-MM-DD. Another first day??                                  |
| `SECTION_NUMBER`     | `"062908"`                         | 6 digits.                                                        |
| `LONG_DESC`          | `" "`                              | 30 characters. It's generally empty.                             |
| `BEFORE_DESC`        | `" "`                              | Usually it's just a space.                                       |
| `FK_SPM_SPCL_MTG_CD` | `" "`                              | Distinguishes between normal meetings (`" "`) and exam meetings. |
| `FK_CDI_INSTR_TYPE`  | `"LE"`                             | Distinguishes between lectures and discussions.                  |
| `PRINT_FLAG`         | `" "`                              | If `N`, then something happens, I guess.                         |
| `FK_SST_SCTN_STATCD` | `"AC"`                             | `CA` means "cancelled." I'm not sure what `AC` or `NC` mean.     |

In `PERSON_FULL_NAME`, the name itself (last name, first name then middle
initial) is 35 characters long, but `PERSON_FULL_NAME` is longer than that. The
padded name is followed by a semicolon (`;`) then the PID, starting with an A.
Here's an example of a class with multiple instructors:

```json
{
  "PERSON_FULL_NAME": "O'Donoghue, Anthony John           ;A13253073:Podust, Larissa M                  ;A12876152:Abagyan, Ruben                     ;A07495505"
}
```

Alternatively, the name is `Staff` with no padded spaces and a space for the
PID, so the entire string is `"Staff; "`.

If I recall correctly, `SCTN_ENRLT_QTY`, `AVAIL_SEAT`, `SCTN_CPCTY_QTY`, and
`COUNT_ON_WAITLIST` do not add up for some reason.

`SECTION_START_DATE`, `SECTION_END_DATE`, and `START_DATE` form an approximate range. It's also
not the same across sections for a course, apparently. It can be `0001-01-01`,
for example.

For `FK_SPM_SPCL_MTG_CD` and `FK_CDI_INSTR_TYPE`, see [this table of meeting
type codes](https://registrar.ucsd.edu/StudentLink/instr_codes.html):

| Code | Description              |
| ---- | ------------------------ |
| AC   | Activity                 |
| CL   | Clinical Clerkship       |
| CO   | Conference               |
| DI   | Discussion               |
| FI\* | Final Exam               |
| FM\* | Film                     |
| FW   | Fieldwork                |
| IN   | Independent Study        |
| IT   | Internship               |
| LA   | Laboratory               |
| LE   | Lecture                  |
| MI\* | Midterm                  |
| MU\* | Make-up Session          |
| OT\* | Other Additional Meeting |
| PB\* | Problem Session          |
| PR   | Practicum                |
| RE\* | Review Session           |
| SE   | Seminar                  |
| ST   | Studio                   |
| TU   | Tutorial                 |

\* Considered finals (or at least listed separately from normal meetings).

But that table isn't exhaustive, apparently. What's `SA` and `OP`??
