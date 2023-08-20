import { Day } from '../util/Day.ts'
import { Season } from './index.ts'

/**
 * Lists days in the following order: fall, winter, spring, summer I, summer II.
 * The days use Google Sheet days, which is an integer counting the days since
 * 1899-12-31.
 */
type RawTerms = {
  start: number[]
  classesEnd: number[]
  end: number[]
}

type RawTerms2 = {
  [season in Season]?: [number, number, number]
}

type RawTerms3 = {
  [season in Season]?: {
    start: [number, number]
    classesEnd?: [number, number]
    end: [number, number]
  }
}

export type Term = {
  year: number
  season: Season
  /**
   * When the term begins instruction. This is distinct from the administrative
   * date when the quarter starts, which tends to be a few days earlier and is
   * irrelevant for students.
   */
  start: Day
  // /**
  //  * When the term ends instruction. This is the day before finals, usually, but
  //  * it appears in recent summer quarters, which have finals on Friday and
  //  * Saturday, classes still meet on Friday, overlapping with finals. I'm not
  //  * sure if this is an error on their part, though.
  //  */
  // classesEnd: Day
  /**
   * When the term ends, which is the last day of finals.
   */
  end: Day
}

/** 1899-12-31 */
const SHEETS_EPOCH = Day.from(1900, 1, 0)

function toDay (sheetsDay: number): Day {
  // Offset by a day because my dates were localized to Pacific Time, which is
  // behind UTC
  return SHEETS_EPOCH.add(sheetsDay - 1)
}

const SEASONS = ['FA', 'WI', 'SP', 'S1', 'S2'] as const

function transform (year: number, days: RawTerms): Term[] {
  return SEASONS.slice(0, days.start.length).map((season, i) => ({
    year: season === 'FA' ? year - 1 : year,
    season,
    start: toDay(days.start[i]),
    // classesEnd: toDay(days.classesEnd[i]),
    end: toDay(days.end[i])
  }))
}

function transform2 (year: number, seasonDays: RawTerms2): Term[] {
  return SEASONS.flatMap(season => {
    const days = seasonDays[season]
    if (days) {
      const [start, , end] = days
      return [
        {
          year: season === 'FA' ? year - 1 : year,
          season,
          start: toDay(start),
          end: toDay(end)
        }
      ]
    } else {
      return []
    }
  })
}

function transform3 (winterYear: number, seasonDays: RawTerms3): Term[] {
  return SEASONS.flatMap(season => {
    const year = season === 'FA' ? winterYear - 1 : winterYear
    const days = seasonDays[season]
    if (days) {
      const { start, end } = days
      return [
        {
          year,
          season,
          start: Day.from(year, ...start),
          end: Day.from(year, ...end)
        }
      ]
    } else {
      return []
    }
  })
}

/**
 * Maps the year of the winter quarter of the school year (i.e. the end year) to
 * the dates of the fall quarter of the previous solar year and the year's
 * winter, spring, and summer quarters.
 */
export const data: Term[] = [
  // https://blink.ucsd.edu/instructors/resources/academic/calendars/index.html
  ...transform2(2029, {
    FA: [47024, 47095, 47103],
    WI: [47126, 47193, 47201],
    SP: [47210, 47277, 47284]
  }),
  ...transform2(2028, {
    FA: [46653, 46724, 46732],
    WI: [46762, 46829, 46837],
    SP: [46846, 46913, 46920]
  }),
  ...transform2(2027, {
    FA: [46289, 46360, 46368],
    WI: [46391, 46458, 46466],
    SP: [46475, 46542, 46549]
  }),
  ...transform2(2026, {
    FA: [45925, 45996, 46004],
    WI: [46027, 46094, 46102],
    SP: [46111, 46178, 46185]
  }),
  ...transform2(2025, {
    FA: [45561, 45632, 45640],
    WI: [45663, 45730, 45738],
    SP: [45747, 45814, 45821]
  }),
  ...transform2(2024, {
    FA: [45197, 45268, 45276],
    WI: [45299, 45366, 45374],
    SP: [45383, 45450, 45457]
  }),
  // https://blink.ucsd.edu/instructors/courses/enrollment/calendars/index.html
  ...transform(2023, {
    start: [44826, 44935, 45019, 45110, 45145],
    classesEnd: [44897, 45002, 45086, 45142, 45177],
    end: [44905, 45010, 45093, 45143, 45178]
  }),
  ...transform(2022, {
    start: [44462, 44564, 44648, 44739, 44774],
    classesEnd: [44533, 44631, 44715, 44771, 44806],
    end: [44541, 44639, 44722, 44772, 44807]
  }),
  ...transform(2021, {
    start: [44105, 44200, 44284, 44375, 44410],
    classesEnd: [44176, 44267, 44351, 44407, 44441],
    end: [44184, 44275, 44358, 44408, 44443]
  }),
  ...transform(2020, {
    start: [43734, 43836, 43920, 44011, 44046],
    classesEnd: [43805, 43903, 43987, 44043, 44078],
    end: [43813, 43911, 43994, 44044, 44079]
  }),
  ...transform(2019, {
    start: [43370, 43472, 43556, 43647, 43682],
    classesEnd: [43441, 43539, 43623, 43678, 43713],
    end: [43449, 43547, 43630, 43680, 43715]
  }),
  ...transform(2018, {
    start: [43006, 43108, 43192, 43283, 43318],
    classesEnd: [43077, 43175, 43259, 43314, 43349],
    end: [43085, 43183, 43266, 43316, 43351]
  }),
  ...transform(2017, {
    start: [42635, 42744, 42828, 42919, 42954],
    classesEnd: [42706, 42811, 42895, 42950, 42985],
    end: [42714, 42819, 42902, 42952, 42987]
  }),
  ...transform(2016, {
    start: [42271, 42373, 42457, 42548, 42583],
    classesEnd: [42342, 42440, 42524, 42579, 42614],
    end: [42350, 42448, 42531, 42581, 42616]
  }),
  ...transform(2015, {
    start: [41914, 42009, 42093, 42184, 42219],
    classesEnd: [41985, 42076, 42160, 42215, 42250],
    end: [41993, 42084, 42167, 42217, 42252]
  }),
  ...transform(2014, {
    start: [41543, 41645, 41729, 41820, 41855],
    classesEnd: [41614, 41712, 41796, 41851, 41886],
    end: [41622, 41720, 41803, 41853, 41888]
  }),
  ...transform(2013, {
    start: [41179, 41281, 41365, 41456, 41491],
    classesEnd: [41250, 41348, 41432, 41487, 41522],
    end: [41258, 41356, 41439, 41489, 41524]
  }),
  ...transform(2012, {
    start: [40808, 40917, 41001, 41092, 41127],
    classesEnd: [40879, 40984, 41068, 41123, 41158],
    end: [40887, 40992, 41075, 41125, 41160]
  }),
  ...transform(2011, {
    start: [40444, 40546, 40630, 40721, 40756],
    classesEnd: [40515, 40613, 40697, 40752, 40787],
    end: [40523, 40621, 40704, 40754, 40789]
  }),
  ...transform(2010, {
    start: [40080, 40182, 40266, 40357, 40392],
    classesEnd: [40151, 40249, 40333, 40388, 40423],
    end: [40159, 40257, 40340, 40390, 40425]
  }),
  ...transform(2009, {
    start: [39716, 39818, 39902],
    classesEnd: [39787, 39885, 39969],
    end: [39795, 39893, 39976]
  }),
  ...transform(2008, {
    start: [39352, 39454, 39538],
    classesEnd: [39423, 39521, 39605],
    end: [39431, 39529, 39612]
  }),
  ...transform(2007, {
    start: [38981, 39090, 39174],
    classesEnd: [39052, 39157, 39241],
    end: [39060, 39165, 39248]
  }),
  ...transform(2006, {
    start: [38617, 38726, 38810],
    classesEnd: [38688, 38793, 38877],
    end: [38696, 38801, 38884]
  }),
  ...transform(2005, {
    start: [38253, 38355, 38439],
    classesEnd: [38324, 38422, 38506],
    end: [38332, 38430, 38513]
  }),
  // https://registrar.ucsd.edu/studentlink/AcademicCalendar03-04.pdf
  ...transform3(2004, {
    FA: { start: [9, 25], classesEnd: [12, 5], end: [12, 13] },
    WI: { start: [1, 5], classesEnd: [3, 12], end: [3, 20] },
    SP: { start: [3, 29], classesEnd: [6, 4], end: [6, 11] }
  }),
  ...transform3(2003, {
    FA: { start: [9, 26], classesEnd: [12, 6], end: [12, 14] },
    WI: { start: [1, 6], classesEnd: [3, 14], end: [3, 22] },
    SP: { start: [3, 31], classesEnd: [6, 6], end: [6, 13] }
  }),
  // https://registrar.ucsd.edu/catalog/01-02/pdfs/accalen.pdf
  ...transform3(2002, {
    FA: { start: [9, 20], classesEnd: [11, 30], end: [12, 8] },
    WI: { start: [1, 7], classesEnd: [3, 15], end: [3, 23] },
    SP: { start: [4, 1], classesEnd: [6, 7], end: [6, 14] },
    S1: { start: [7, 1], end: [8, 3] },
    S2: { start: [8, 5], end: [9, 7] }
  }),
  // https://library.ucsd.edu/dc/search?f[collection_sim][]=UC+San+Diego+General+Catalog&sort=title_ssi+asc
  ...transform3(2001, {
    FA: { start: [9, 21], classesEnd: [12, 1], end: [12, 9] },
    WI: { start: [1, 8], classesEnd: [3, 16], end: [3, 24] },
    SP: { start: [4, 2], classesEnd: [6, 8], end: [6, 15] },
    S1: { start: [7, 2], end: [8, 4] },
    S2: { start: [8, 6], end: [9, 8] }
  }),
  ...transform3(2000, {
    FA: { start: [9, 30], classesEnd: [12, 10], end: [12, 18] },
    WI: { start: [1, 10], classesEnd: [3, 17], end: [3, 25] },
    SP: { start: [4, 3], classesEnd: [6, 9], end: [6, 16] },
    // NOTE: The catalog lists the end dates on Friday, but ScheduleOfClasses
    // has it for Saturday, and there are still Saturday finals in S100.
    S1: { start: [7, 3], end: [8, 5] },
    S2: { start: [8, 7], end: [9, 9] }
  }),
  ...transform3(1999, {
    FA: { start: [9, 24], classesEnd: [12, 4], end: [12, 12] },
    WI: { start: [1, 4], classesEnd: [3, 12], end: [3, 20] },
    SP: { start: [3, 29], classesEnd: [6, 4], end: [6, 11] }
  }),
  ...transform3(1998, {
    FA: { start: [9, 25], classesEnd: [12, 5], end: [12, 13] },
    WI: { start: [1, 5], classesEnd: [3, 13], end: [3, 21] },
    SP: { start: [3, 30], classesEnd: [6, 5], end: [6, 12] }
  }),
  ...transform3(1997, {
    FA: { start: [9, 26], classesEnd: [12, 6], end: [12, 14] },
    WI: { start: [1, 6], classesEnd: [3, 14], end: [3, 22] },
    SP: { start: [3, 31], classesEnd: [6, 6], end: [6, 13] }
  }),
  ...transform3(1996, {
    FA: { start: [9, 21], classesEnd: [12, 1], end: [12, 9] },
    WI: { start: [1, 8], classesEnd: [3, 15], end: [3, 23] },
    SP: { start: [4, 1], classesEnd: [6, 5], end: [6, 14] }
  }),
  ...transform3(1995, {
    FA: { start: [9, 22], classesEnd: [12, 2], end: [12, 10] },
    WI: { start: [1, 9], classesEnd: [3, 17], end: [3, 25] },
    // This seems to be the last year where they ended spring on Saturday
    // (overlapping with commencement) rather than Friday.
    SP: { start: [4, 3], classesEnd: [6, 9], end: [6, 17] }
  }),
  ...transform3(1994, {
    FA: { start: [9, 23], classesEnd: [12, 3], end: [12, 11] },
    WI: { start: [1, 3], classesEnd: [3, 11], end: [3, 19] },
    SP: { start: [3, 28], classesEnd: [6, 11], end: [6, 11] }
  })
  // ScheduleOfClasses only has courses back to WI95
]
