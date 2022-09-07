import { Day } from './day.ts'
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

type Term = {
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

/**
 * Maps the year of the winter quarter of the school year (i.e. the end year) to
 * the dates of the fall quarter of the previous solar year and the year's
 * winter, spring, and summer quarters.
 */
export const data: Term[] = [
  // https://blink.ucsd.edu/instructors/resources/academic/calendars/index.html
  // TODO: these were by quarters not time oops
  ...transform(2029, {
    start: [47024, 47095, 47103],
    classesEnd: [47126, 47193, 47201],
    end: [47210, 47277, 47284]
  }),
  ...transform(2028, {
    start: [46653, 46724, 46732],
    classesEnd: [46762, 46829, 46837],
    end: [46846, 46913, 46920]
  }),
  ...transform(2027, {
    start: [46289, 46360, 46368],
    classesEnd: [46391, 46458, 46466],
    end: [46475, 46542, 46549]
  }),
  ...transform(2026, {
    start: [45925, 45996, 46004],
    classesEnd: [46027, 46094, 46102],
    end: [46111, 46178, 46185]
  }),
  ...transform(2025, {
    start: [45561, 45632, 45640],
    classesEnd: [45663, 45730, 45738],
    end: [45747, 45814, 45821]
  }),
  ...transform(2024, {
    start: [45197, 45268, 45276],
    classesEnd: [45299, 45366, 45374],
    end: [45383, 45450, 45457]
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
  })
]
