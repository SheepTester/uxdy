// Ensures that each course and section has a valid schema
// deno test --allow-read scrape_test.ts --fail-fast

import { AuthorizedGetter } from './scrape.ts'
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertMatch,
  assertStringIncludes
} from 'https://deno.land/std@0.125.0/testing/asserts.ts'
import { exams, instructionTypes } from './meeting-types.ts'

/**
 * Asserts that the given value is a number and within the specified range
 * (inclusive lower, exclusive upper).
 *
 * @param lower Inclusive.
 * @param upper Exclusive.
 */
function assertInRange (
  value: unknown,
  lower: number,
  upper: number,
  message?: string
): asserts value is number {
  assert(
    typeof value === 'number' &&
      Number.isInteger(value) &&
      lower <= value &&
      lower < upper,
    message
  )
}

/**
 * Assert that the value only has spaces at the end.
 */
function assertEndPadded (value: string, message?: string) {
  const trimmed = value.replace(/^ +/, '')
  if (trimmed !== '') {
    assertEquals(trimmed, value, message)
  }
}
assertEndPadded('')
assertEndPadded('hi  ')

const getter = new AuthorizedGetter('WI22', Deno.args[0], Deno.args[1], true)
for await (const course of getter.allCourses()) {
  Deno.test(`${course.code}: ${course.title}`, () => {
    const { SUBJ_CODE, CRSE_CODE, CRSE_TITLE, UNIT_FROM, UNIT_TO, UNIT_INC } =
      course.raw

    assertEquals(SUBJ_CODE.length, 4)
    assertMatch(SUBJ_CODE, /^[A-Z]{2,4} *$/)

    assertEquals(CRSE_CODE.length, 5)
    assertMatch(CRSE_CODE.slice(0, 3).trimStart(), /^\d+$/)
    assertMatch(CRSE_CODE.slice(3, 5).trimEnd(), /^[A-Z]*$/)

    assertEquals(CRSE_TITLE.length, 30)
    assertEndPadded(CRSE_TITLE, 'Course title: spaces padded only at end')

    assert(UNIT_FROM >= 0)
    assert(UNIT_TO >= UNIT_FROM)
    // WI22 Math 295 has FROM = TO, but its INC = 1.0
    if (UNIT_FROM !== UNIT_TO) {
      assert(UNIT_INC > 0)
    }
  })

  for (const group of course.groups) {
    Deno.test(`${course.code}: ${group.code} (${group.type})`, () => {
      const {
        BEGIN_HH_TIME,
        BEGIN_MM_TIME,
        END_HH_TIME,
        END_MM_TIME,
        DAY_CODE,
        SECT_CODE,
        SCTN_ENRLT_QTY,
        AVAIL_SEAT,
        SCTN_CPCTY_QTY,
        COUNT_ON_WAITLIST,
        STP_ENRLT_FLAG,
        BLDG_CODE,
        ROOM_CODE,
        PERSON_FULL_NAME,
        PRIMARY_INSTR_FLAG,
        SECTION_START_DATE,
        SECTION_END_DATE,
        START_DATE,
        SECTION_NUMBER,
        LONG_DESC,
        BEFORE_DESC,
        FK_SPM_SPCL_MTG_CD,
        FK_CDI_INSTR_TYPE,
        PRINT_FLAG,
        FK_SST_SCTN_STATCD
      } = group.raw

      assertInRange(BEGIN_HH_TIME, 0, 24)
      assertInRange(BEGIN_MM_TIME, 0, 60)
      assertInRange(END_HH_TIME, 0, 24)
      assertInRange(END_MM_TIME, 0, 60)

      if (DAY_CODE !== ' ') {
        // WI22 MGT 407 C00 is a lecture on Sunday
        assertMatch(DAY_CODE, /^[1-7]+$/)
        assertEquals(
          new Set(DAY_CODE).size,
          DAY_CODE.length,
          'No duplicate days'
        )
      }

      // WI22 BGRD 200 has numerical section codes from 001 to 291
      assertMatch(SECT_CODE, /^[A-Z\d]\d{2}$/)

      assertEquals(SCTN_ENRLT_QTY + AVAIL_SEAT, SCTN_CPCTY_QTY)
      if (AVAIL_SEAT > 0 && COUNT_ON_WAITLIST > 0) {
        assert(STP_ENRLT_FLAG === 'Y')
      }

      if (BLDG_CODE !== 'TBA') {
        assertEquals(BLDG_CODE.length, 5)
        assertEndPadded(BLDG_CODE, 'Building: spaces padded only at end')
      }
      if (ROOM_CODE !== 'TBA') {
        assertEquals(ROOM_CODE.length, 5)
        assertEndPadded(ROOM_CODE, 'Room: spaces padded only at end')
      }

      if (PERSON_FULL_NAME !== 'Staff; ') {
        for (const instructor of PERSON_FULL_NAME.split(':')) {
          const [name, pid] = instructor.split(';')
          assertEquals(name.length, 35)
          // \b doesn't work because WI22 CSE 291 014 is taught by ThomÉ,
          // Emmanuel, and \b isn't Unicode-aware. However, SIO 199 005 is
          // taught by Baumann-Pickering , Simone, which has a space *before*
          // the comma. Aiya!
          assertStringIncludes(name, ',')
          assertEndPadded(name, 'Prof name: spaces padded only at end')
          assertMatch(pid, /^A\d{8}$/)
        }
      }

      assertMatch(SECTION_START_DATE, /^\d{4}-\d{2}-\d{2}$/)
      assertMatch(SECTION_END_DATE, /^\d{4}-\d{2}-\d{2}$/)
      if (START_DATE !== ' ') {
        assertMatch(START_DATE, /^\d{4}-\d{2}-\d{2}$/)
      }

      assertMatch(SECTION_NUMBER, /^\d{6}$/)
      assertEquals(LONG_DESC.length, 30)
      assertEndPadded(LONG_DESC, 'Long desc: spaces padded only at end')
      // Only not a space if and only if the section is cancelled
      assert((BEFORE_DESC !== ' ') === group.cancelled)
      if (BEFORE_DESC !== ' ') {
        assertEquals(BEFORE_DESC.length, 30)
      }

      assertArrayIncludes(['Y', 'N'], [STP_ENRLT_FLAG])
      assertArrayIncludes(['Y', ' '], [PRIMARY_INSTR_FLAG])
      assertArrayIncludes(['', 'AC', 'NC'], [BEFORE_DESC.trim()])
      assertArrayIncludes(
        ['  ', 'TBA', ...Object.keys(exams)],
        [FK_SPM_SPCL_MTG_CD]
      )
      assertArrayIncludes(Object.keys(instructionTypes), [FK_CDI_INSTR_TYPE])
      // WI22 CSE 11 A00 and EDS 259 C/D00 have PRINT_FLAG=5
      assertArrayIncludes([' ', 'N', 'Y', '5'], [PRINT_FLAG])
      assertArrayIncludes(['AC', 'NC', 'CA'], [FK_SST_SCTN_STATCD])
    })
  }
}
