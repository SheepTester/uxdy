import { Day } from './day.ts'

/**
 * Lists days in the following order: fall, winter, spring, summer I, summer II.
 * The days use Google Sheet days, which is an integer counting the days since
 * 1899-12-31.
 */
type TermDates = {
  /**
   * The days when the respective quarter begins instruction. This is distinct
   * from the administrative date when the quarter starts, which tends to be a
   * few days earlier and is irrelevant for students.
   */
  start: number[]
  /**
   * The days when the respective quarter ends instruction. This is the day
   * before finals, usually, but it appears in recent summer quarters, which
   * have finals on Friday and Saturday, classes still meet on Friday,
   * overlapping with finals. I'm not sure if this is an error on their part,
   * though.
   */
  classesEnd: number[]
  /**
   * The days when the respective quarter ends, which is the last day of finals.
   */
  end: number[]
}

/** 1899-12-31 */
const SHEETS_EPOCH = Day.from(1900, 1, 0)

export function toDay (sheetsDay: number): Day {
  // Offset by a day because my dates were localized to Pacific Time, which is
  // behind UTC
  return SHEETS_EPOCH.add(sheetsDay - 1)
}

/**
 * Maps the year of the winter quarter of the school year (i.e. the end year) to
 * the dates of the fall quarter of the previous solar year and the year's
 * winter, spring, and summer quarters.
 */
export const data: Record<number, TermDates> = {
  2023: {
    start: [44826, 44935, 45019, 45110, 45145],
    classesEnd: [44897, 45002, 45086, 45142, 45177],
    end: [44905, 45010, 45093, 45143, 45178]
  },
  2022: {
    start: [44462, 44564, 44648, 44739, 44774],
    classesEnd: [44533, 44631, 44715, 44771, 44806],
    end: [44541, 44639, 44722, 44772, 44807]
  },
  2021: {
    start: [44105, 44200, 44284, 44375, 44410],
    classesEnd: [44176, 44267, 44351, 44407, 44441],
    end: [44184, 44275, 44358, 44408, 44443]
  },
  2020: {
    start: [43734, 43836, 43920, 44011, 44046],
    classesEnd: [43805, 43903, 43987, 44043, 44078],
    end: [43813, 43911, 43994, 44044, 44079]
  },
  2019: {
    start: [43370, 43472, 43556, 43647, 43682],
    classesEnd: [43441, 43539, 43623, 43678, 43713],
    end: [43449, 43547, 43630, 43680, 43715]
  },
  2018: {
    start: [43006, 43108, 43192, 43283, 43318],
    classesEnd: [43077, 43175, 43259, 43314, 43349],
    end: [43085, 43183, 43266, 43316, 43351]
  },
  2017: {
    start: [42635, 42744, 42828, 42919, 42954],
    classesEnd: [42706, 42811, 42895, 42950, 42985],
    end: [42714, 42819, 42902, 42952, 42987]
  },
  2016: {
    start: [42271, 42373, 42457, 42548, 42583],
    classesEnd: [42342, 42440, 42524, 42579, 42614],
    end: [42350, 42448, 42531, 42581, 42616]
  },
  2015: {
    start: [41914, 42009, 42093, 42184, 42219],
    classesEnd: [41985, 42076, 42160, 42215, 42250],
    end: [41993, 42084, 42167, 42217, 42252]
  },
  2014: {
    start: [41543, 41645, 41729, 41820, 41855],
    classesEnd: [41614, 41712, 41796, 41851, 41886],
    end: [41622, 41720, 41803, 41853, 41888]
  },
  2013: {
    start: [41179, 41281, 41365, 41456, 41491],
    classesEnd: [41250, 41348, 41432, 41487, 41522],
    end: [41258, 41356, 41439, 41489, 41524]
  }
}
