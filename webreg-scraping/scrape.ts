export type RawSearchLoadSubjectResult = {
  LONG_DESC: string
  SUBJECT_CODE: string
}

export type RawSearchLoadDepartmentResult = {
  DEP_CODE: string
  DEP_DESC: string
}

export type RawSearchByAllResult = {
  UNIT_TO: number
  SUBJ_CODE: string
  UNIT_INC: number
  CRSE_TITLE: string
  UNIT_FROM: number
  CRSE_CODE: string
}

type CommonRawSectionResult = {
  END_MM_TIME: number
  LONG_DESC: string
  BEGIN_HH_TIME: number
  PRIMARY_INSTR_FLAG: 'Y' | ' '
  ROOM_CODE: string
  END_HH_TIME: number
  START_DATE: string
  DAY_CODE: string
  BEGIN_MM_TIME: number
  PERSON_FULL_NAME: string
  FK_SPM_SPCL_MTG_CD:
    | '  '
    | 'FI'
    | 'TBA'
    | 'MI'
    | 'MU'
    | 'RE'
    | 'PB'
    | 'OT'
    | 'FM'
  BLDG_CODE: string
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
}

export interface RawSearchLoadGroupDataResult extends CommonRawSectionResult {
  SCTN_CPCTY_QTY: number
  SCTN_ENRLT_QTY: number
  SECTION_NUMBER: string
  SECTION_START_DATE: string
  STP_ENRLT_FLAG: 'Y' | 'N'
  SECTION_END_DATE: string
  COUNT_ON_WAITLIST: number
  BEFORE_DESC: ' ' | 'AC' | 'NC'
  PRINT_FLAG: ' ' | 'N' | 'Y' | '5'
  FK_SST_SCTN_STATCD: 'AC' | 'NC' | 'CA'
  AVAIL_SEAT: number
}

export interface RawGetClassResult extends CommonRawSectionResult {
  TERM_CODE: string
  SECT_CREDIT_HRS: number
  SECTION_NUMBER: number
  SUBJ_CODE: string
  GRADE_OPTN_CD_PLUS: ' ' | '+'
  WT_POS: string
  FK_PCH_INTRL_REFID: number
  CRSE_TITLE: string
  GRADE_OPTION: 'L' | 'P' | 'P/NP' | 'S' | 'S/U' | 'H' | ' '
  CRSE_CODE: string
  NEED_HEADROW: boolean
  PERSON_ID: string
  SECT_CREDIT_HRS_PL: ' ' | '+'
  SECTION_HEAD: number
  ENROLL_STATUS: 'EN' | 'WT' | 'PL'
  FK_SEC_SCTN_NUM: number
}

export class AuthorizedGetter {
  #term: string
  #sessionIndex?: string
  #uqz?: string
  #cache: boolean

  constructor (
    term: string,
    sessionIndex?: string,
    uqz?: string,
    cache = false
  ) {
    this.#term = term
    this.#sessionIndex = sessionIndex
    this.#uqz = uqz
    this.#cache = cache
  }

  async get (path: string, query: Record<string, string>) {
    const fileName =
      query.subjcode?.length > 0
        ? `${path}_${query.subjcode.trim()}_${query.crsecode.trim()}`
        : path

    if (this.#cache) {
      const json = await Deno.readTextFile(`./webreg-data/${fileName}.json`)
        .then(JSON.parse)
        .catch((error: unknown) =>
          error instanceof Deno.errors.NotFound ? null : Promise.reject(error)
        )
      if (json !== null) {
        return json
      }
    }

    const json = fetch(
      `https://act.ucsd.edu/webreg2/svc/wradapter/secure/${path}?${new URLSearchParams(
        query
      )}`,
      {
        headers: {
          Cookie: `jlinksessionidx=${this.#sessionIndex}; UqZBpD3n=${this.#uqz}`
        }
      }
    ).then(response =>
      response.ok
        ? response.json()
        : Promise.reject(`HTTP ${response.status} error from ${response.url}`)
    )
    if (this.#cache) {
      await Deno.writeTextFile(
        `./webreg-data/${fileName}.json`,
        JSON.stringify(json, null, '\t') + '\n'
      )
    }
    return json
  }

  /**
   * Lists all subjects.
   */
  subjects (): Promise<RawSearchLoadSubjectResult[]> {
    return this.get('search-load-subject', { termcode: this.#term })
  }

  /**
   * Lists all departments.
   */
  departments (): Promise<RawSearchLoadDepartmentResult[]> {
    return this.get('search-load-department', { termcode: this.#term })
  }

  /**
   * Lists all courses.
   */
  courses ({
    subjcode = '',
    crsecode = '',
    department = '',
    professor = '',
    title = '',
    levels = '',
    days = '',
    timestr = '',
    opensection = false,
    isbasic = true,
    basicsearchvalue = ''
  } = {}): Promise<RawSearchByAllResult[]> {
    return this.get('search-by-all', {
      subjcode,
      crsecode,
      department,
      professor,
      title,
      levels,
      days,
      timestr,
      opensection: opensection.toString(),
      isbasic: isbasic.toString(),
      basicsearchvalue,
      termcode: this.#term
    })
  }

  /**
   * Lists all sections for a course.
   */
  sections (
    subject: string,
    course: string
  ): Promise<RawSearchLoadGroupDataResult[]> {
    return this.get('search-load-group-data', {
      subjcode: subject.padEnd(4, ' '),
      crsecode: course.padEnd(5, ' '),
      termcode: this.#term
    })
  }

  /**
   * Gets all the course and section data from WebReg. Yields a `Course` as
   * sections are loaded for each course.
   */
  async * allCourses () {
    const courses = await this.courses()
    for (const course of courses) {
      const groups = await this.sections(course.SUBJ_CODE, course.CRSE_CODE)
      yield new Course(course, groups)
    }
  }

  /**
   * Gest the user's schedule.
   */
  schedule (
    scheduleName = 'My Schedule',
    { final = '', sectnum = '' } = {}
  ): Promise<RawGetClassResult[]> {
    return this.get('get-class', {
      schedname: scheduleName,
      final,
      sectnum,
      termcode: this.#term
    })
  }

  /**
   * Gets the user's schedule with the given name. Defaults to `My Schedule`.
   * Unlike `schedule`, this method processes the raw schedule sections as
   * `ScheduleSection`s.
   */
  getSchedule (name?: string) {
    return this.schedule(name).then(sections =>
      sections.map(section => new ScheduleSection(section))
    )
  }
}

export type Instructor = {
  name: string
  pid: string
}

/**
 * A time.
 */
export class Time {
  /** The hour (24-hour). */
  hour: number
  /** The minute. */
  minute: number

  constructor (hour: number, minute: number) {
    this.hour = hour
    this.minute = minute
  }

  /**
   * Displays the time in a 12-hour format Americans are familiar with.
   */
  toString () {
    return `${((this.hour + 11) % 12) + 1}:${this.minute
      .toString()
      .padStart(2, '0')} ${this.hour < 12 ? 'a' : 'p'}m`
  }

  /**
   * Returns the minutes since 00:00. This allows `Time` to be used with JS's
   * comparison operators.
   */
  valueOf () {
    return this.hour * 60 + this.minute
  }
}

/**
 * A time period on a given day.
 */
export class Period {
  /** The day of the week. */
  day: number
  /** The start time. */
  start: Time
  /** The end time. */
  end: Time

  constructor (day: number, start: Time, end: Time) {
    this.day = day
    this.start = start
    this.end = end
  }

  /**
   * Whether two time periods overlap. A time period starting when another ends
   * is not considered an intersection.
   */
  intersects (other: Period) {
    return (
      this.day === other.day && this.start < other.end && other.start < this.end
    )
  }

  /**
   * Displays the time range.
   */
  displayTime () {
    return `${this.start}–${this.end}`
  }

  static readonly #DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  /**
   * Returns the name of the day the time period is on.
   */
  dayName () {
    return Period.#DAY_NAMES[this.day]
  }

  /**
   * Displays the time range with the day name. Probably should just be used for
   * debug purposes because in most cases you'd rather have more control over
   * the formatting. Use `displayTime` and `dayName` instead.
   */
  toString () {
    return `${this.displayTime()} on ${this.dayName()}`
  }

  static readonly #MINUTES_PER_DAY = 24 * 60

  /**
   * Returns the number of minutes between the beginning of the week and the
   * start of the time range. This might be useful for sorting time periods
   * chronologically.
   */
  valueOf () {
    return this.day * Period.#MINUTES_PER_DAY + this.start.valueOf()
  }
}

class BaseGroup<Raw extends CommonRawSectionResult> {
  /** The section code, such as "A07." */
  code: string
  /**
   * The location of the meeting, or null if TBA.
   */
  location: { building: string; room: string } | null
  /**
   * List of instructors. If empty, then the section is taught by "Staff."
   */
  instructors: Instructor[]
  /**
   * Distinguishes between normal and exam (midterm or final) meetings. Refer to
   * [this table](https://registrar.ucsd.edu/StudentLink/instr_codes.html) for a
   * key.
   */
  groupType: RawSearchLoadGroupDataResult['FK_SPM_SPCL_MTG_CD']
  /**
   * Distinguishes between lectures and discussions. Refer to [this
   * table](https://registrar.ucsd.edu/StudentLink/instr_codes.html) for a key.
   */
  instructionType: RawSearchLoadGroupDataResult['FK_CDI_INSTR_TYPE']

  /** The start time of the meeting. */
  start: Time
  /** The end time of the meeting. */
  end: Time
  /** The days of the week on which the meeting meets. */
  days: number[]

  raw: Raw

  constructor (rawGroup: Raw) {
    const {
      SECT_CODE,
      BLDG_CODE,
      ROOM_CODE,
      PERSON_FULL_NAME,
      FK_SPM_SPCL_MTG_CD,
      FK_CDI_INSTR_TYPE,
      BEGIN_HH_TIME,
      BEGIN_MM_TIME,
      END_HH_TIME,
      END_MM_TIME,
      DAY_CODE
    } = rawGroup
    // Unused: { LONG_DESC, PRIMARY_INSTR_FLAG, START_DATE }

    this.code = SECT_CODE
    this.location =
      BLDG_CODE === 'TBA' && ROOM_CODE === 'TBA'
        ? null
        : {
            building: BLDG_CODE.trim(),
            room: ROOM_CODE.trim()
          }
    this.instructors =
      PERSON_FULL_NAME === 'Staff; '
        ? []
        : PERSON_FULL_NAME.split(':').map(instructor => {
            const [name, pid] = instructor.split(';')
            return { name, pid }
          })
    this.groupType = FK_SPM_SPCL_MTG_CD
    this.instructionType = FK_CDI_INSTR_TYPE

    this.start = new Time(BEGIN_HH_TIME, BEGIN_MM_TIME)
    this.end = new Time(END_HH_TIME, END_MM_TIME)
    this.days = DAY_CODE.split('').map(day => +day)

    this.raw = rawGroup
  }

  /**
   * Whether the meeting is special and only happens on scheduled days rather
   * than regularly, such as a midterm or final.
   */
  isExam () {
    return this.groupType !== '  ' && this.groupType !== 'TBA'
  }

  /**
   * Gets the time ranges during which the section meets.
   */
  times () {
    return this.days.map(day => new Period(day, this.start, this.end))
  }

  /**
   * Returns the exam type (e.g. final vs midterm) if the meeting is an exam;
   * otherwise, the normal meeting type (e.g. discussion vs lecture).
   */
  get type () {
    return this.isExam() ? this.groupType : this.instructionType
  }
}

export class Group extends BaseGroup<RawSearchLoadGroupDataResult> {
  /** The maximum number of seats. May be Infinity for no limit. */
  capacity: number
  /** The number of people enrolled. */
  enrolled: number
  /** The number of people on the waitlist. */
  waitlist: number
  /**
   * Whether enrolment has been stopped. This isn't the only determiner of
   * whether a course can be enrolled rather than waitlisted.
   */
  stopEnrolment: boolean
  /** Whether the section has been cancelled. */
  cancelled: boolean
  /**
   * Whether the section can be planned. The difference between this and `full`
   * is that some sections, such as lectures or finals, aren't selectable as
   * plannable/enrollable/waitlistable sections. This should reflect whether the
   * "Plan" and "Enroll"/"Waitlist" buttons are shown in the section's row on
   * WebReg.
   */
  plannable: boolean
  /**
   * Whether the section can be enrolled directly. This should reflect whether
   * the button says "Enroll" or "Waitlist" on WebReg.
   */
  enrollable: boolean

  constructor (rawGroup: RawSearchLoadGroupDataResult) {
    super(rawGroup)
    const {
      SCTN_CPCTY_QTY,
      SCTN_ENRLT_QTY,
      COUNT_ON_WAITLIST,
      STP_ENRLT_FLAG,
      FK_SST_SCTN_STATCD
    } = rawGroup
    // Unused: {
    //   AVAIL_SEAT,
    //   BEFORE_DESC,
    //   PRINT_FLAG,
    //   SECTION_END_DATE,
    //   SECTION_NUMBER,
    //   SECTION_START_DATE
    // }

    this.capacity = SCTN_CPCTY_QTY === 9999 ? Infinity : SCTN_CPCTY_QTY
    this.enrolled = SCTN_ENRLT_QTY
    this.waitlist = COUNT_ON_WAITLIST
    this.stopEnrolment = STP_ENRLT_FLAG === 'Y'
    this.cancelled = FK_SST_SCTN_STATCD === 'CA'

    this.plannable = FK_SST_SCTN_STATCD === 'AC' && !this.isExam()
    this.enrollable =
      this.plannable && this.enrolled < this.capacity && !this.stopEnrolment
  }
}

export type CourseUnit = {
  from: number
  to: number
  step: number
}

export class Course {
  /** The subject code, such as "CSE." */
  subject: string
  /** The course code, such as "8B." */
  course: string
  /** The name of the course. */
  title: string
  /** The unit range that one can take the course for. */
  unit: CourseUnit
  /** List of meetings, including discussions and finals. */
  groups: Group[]

  raw: RawSearchByAllResult

  constructor (
    rawCourse: RawSearchByAllResult,
    rawGroups: RawSearchLoadGroupDataResult[]
  ) {
    this.subject = rawCourse.SUBJ_CODE.trim()
    this.course = rawCourse.CRSE_CODE.trim()
    this.title = rawCourse.CRSE_TITLE.trim()
    this.unit = {
      from: rawCourse.UNIT_FROM,
      to: rawCourse.UNIT_TO,
      step: rawCourse.UNIT_INC
    }
    this.groups = rawGroups.map(group => new Group(group))
    this.raw = rawCourse
  }

  get code () {
    return `${this.subject} ${this.course}`
  }
}

const gradeScaleKey = {
  L: 'L',
  P: 'P/NP',
  'P/NP': 'P/NP',
  S: 'S/U',
  'S/U': 'S/U',
  H: 'H',
  ' ': null
} as const

export class ScheduleSection extends BaseGroup<RawGetClassResult> {
  course: {
    subject: string
    course: string
    title: string
    unit: number
    canChangeUnit: boolean
    gradeScale: typeof gradeScaleKey[keyof typeof gradeScaleKey]
    canChangeGradeScale: boolean
  }
  state:
    | { type: 'enrolled' }
    | { type: 'waitlisted'; position: number }
    | { type: 'planned' }

  constructor (rawClass: RawGetClassResult) {
    super(rawClass)

    const {
      SUBJ_CODE,
      CRSE_CODE,
      CRSE_TITLE,
      SECT_CREDIT_HRS,
      SECT_CREDIT_HRS_PL,
      GRADE_OPTION,
      GRADE_OPTN_CD_PLUS,
      ENROLL_STATUS,
      WT_POS
    } = rawClass
    // Unused: {
    //   FK_PCH_INTRL_REFID,
    //   FK_SEC_SCTN_NUM,
    //   NEED_HEADROW,
    //   PERSON_ID,
    //   SECTION_HEAD,
    //   SECTION_NUMBER,
    //   TERM_CODE
    // }

    this.course = {
      subject: SUBJ_CODE.trim(),
      course: CRSE_CODE.trim(),
      title: CRSE_TITLE.trim(),
      unit: SECT_CREDIT_HRS,
      canChangeUnit: SECT_CREDIT_HRS_PL === '+',
      gradeScale: gradeScaleKey[GRADE_OPTION],
      canChangeGradeScale: GRADE_OPTN_CD_PLUS === '+'
    }
    this.state =
      ENROLL_STATUS === 'WT'
        ? { type: 'waitlisted', position: +WT_POS }
        : { type: ENROLL_STATUS === 'EN' ? 'enrolled' : 'planned' }
  }
}

if (import.meta.main) {
  const getter = new AuthorizedGetter('WI22', Deno.args[0], Deno.args[1], true)
  const courses = []
  const freq: Record<number, number> = {}
  for await (const course of getter.allCourses()) {
    courses.push(course)
    for (const group of course.groups) {
      freq[group.raw.BEFORE_DESC.length] ??= 0
      freq[group.raw.BEFORE_DESC.length]++
      if (group.cancelled && group.raw.BEFORE_DESC === ' ') {
        console.log(course.code, group.code, group.raw.BEFORE_DESC)
      }
    }
  }
  console.log(freq)

  // idk
}
