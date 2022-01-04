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
  FK_SPM_SPCL_MTG_CD: '  ' | 'FI' | 'TBA' | 'MI' | 'MU' | 'RE' | 'PB' | 'OT'
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

export type GroupTime = {
  hours: number
  minutes: number
}

export type Instructor = {
  name: string
  pid: string
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
  start: GroupTime
  /** The end time of the meeting. */
  end: GroupTime
  /** The days of the week on which the meeting meets. */
  days: number[]

  raw: Raw

  constructor (rawGroup: Raw) {
    this.code = rawGroup.SECT_CODE
    this.location =
      rawGroup.BLDG_CODE === 'TBA' && rawGroup.ROOM_CODE === 'TBA'
        ? null
        : {
            building: rawGroup.BLDG_CODE.trim(),
            room: rawGroup.ROOM_CODE.trim()
          }
    this.instructors =
      rawGroup.PERSON_FULL_NAME === ''
        ? []
        : rawGroup.PERSON_FULL_NAME.split(':').map(instructor => {
            const [name, pid] = instructor.split(';')
            return { name, pid }
          })
    this.groupType = rawGroup.FK_SPM_SPCL_MTG_CD
    this.instructionType = rawGroup.FK_CDI_INSTR_TYPE

    this.start = {
      hours: rawGroup.BEGIN_HH_TIME,
      minutes: rawGroup.BEGIN_MM_TIME
    }
    this.end = {
      hours: rawGroup.END_HH_TIME,
      minutes: rawGroup.END_MM_TIME
    }
    this.days = rawGroup.DAY_CODE.split('').map(day => +day)

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
   * Whether the meeting is normal (not a final/midterm) and has a section code
   * that doesn't end in 00. WebReg puts these meetings in a list named
   * `cateAX`, where A is some letter. I think WebReg uses this to determine
   * whether it shows the "Enroll" button for the section; for example, it lets
   * you plan/enroll/waitlist discussion or lab sections, but not lectures.
   */
  isSelectable () {
    return !this.isExam() && this.code.slice(0, 2) !== '00'
  }
}

export class Group extends BaseGroup<RawSearchLoadGroupDataResult> {
  /** The maximum number of seats. May be Infinity for no limit. */
  capacity: number
  /** The number of people enrolled. */
  enrolled: number
  /** The number of seats available. */
  available: number
  /** The number of people on the waitlist. */
  waitlist: number
  /** Whether enrolment hasn't been prevented. */
  canEnrol: boolean

  constructor (rawGroup: RawSearchLoadGroupDataResult) {
    super(rawGroup)

    this.capacity = rawGroup.SCTN_CPCTY_QTY
    this.enrolled = rawGroup.SCTN_ENRLT_QTY
    this.available = rawGroup.AVAIL_SEAT
    this.waitlist = rawGroup.COUNT_ON_WAITLIST
    this.canEnrol = rawGroup.STP_ENRLT_FLAG === 'Y'
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

    this.course = {
      subject: rawClass.SUBJ_CODE.trim(),
      course: rawClass.CRSE_CODE.trim(),
      title: rawClass.CRSE_TITLE.trim(),
      unit: rawClass.SECT_CREDIT_HRS,
      canChangeUnit: rawClass.SECT_CREDIT_HRS_PL === '+',
      gradeScale: gradeScaleKey[rawClass.GRADE_OPTION],
      canChangeGradeScale: rawClass.GRADE_OPTN_CD_PLUS === '+'
    }
    this.state =
      rawClass.ENROLL_STATUS === 'WT'
        ? { type: 'waitlisted', position: +rawClass.WT_POS }
        : { type: rawClass.ENROLL_STATUS === 'EN' ? 'enrolled' : 'planned' }
  }
}
