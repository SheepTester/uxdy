# Findings

## How long could S3/SU be?

Purpose: Determining when to additionally fetch S3/SU when displaying summer quarters in the classroom app.

| Quarter | Earliest start | Latest end |
| ------- | -------------- | ---------- |
| S323    | 2023-06-19     | 2023-09-08 |
| SU23    | 2023-05-09     | 2023-06-26 |
| SU18    | 2018-05-14     | 2018-07-02 |

S323 (being for undergrads, I guess) doesn't overlap with SP23 or FA23, though it starts before S123.

SU23 and SU18 overlap with spring quarter, unfortunately. However, all locations in SU23 are TBA, so it's fine omitting them from this website.

## When's the earliest summer final and latest lecture?

Purpose: Finals and lectures may occur on the same day on week 5 Friday in S1 and S2. I want to know if they can overlap.

In S123 PETER 102, BILD 20's final ends one minute before ECON 1's discussion, so answering this question won't help.

## Are any professors double-booked?

Purpose: In S123, LTEN 178 and ETHN 168 (both "Comparative Ethnic Literature") occur in the same places at the same time, but they have separate enrollments. They're also taught by the same professor, so to check for these cross-listings, I'll just check for overlapping professor-time combinations.

To find overlaps in time, I assumed that professors don't show up to discussion. This means checking all required meetings common across all sections (e.g. lectures and additional meetings); I only check the sections if there are no additional meetings (e.g. a seminar class or a class that only has lecture sections, A00, B00, etc.).

For S123:

```
Rochelle Alexia McFee ETHN 127 A00 LE overlaps with CGS 112 A00 LE
Rochelle Alexia McFee ETHN 127 A00 LE overlaps with CGS 112 A00 LE
Camila Andrea Gavin ETHN 137 A00 LE overlaps with CGS 137 A00 LE
Camila Andrea Gavin ETHN 137 A00 LE overlaps with CGS 137 A00 LE
Olga Lid Olivas Hernandez GLBH 148 A00 LE overlaps with ANSC 148 A00 LE
Olga Lid Olivas Hernandez GLBH 148 A00 LE overlaps with ANSC 148 A00 LE
Ramsey Ismail GLBH 150 A00 LE overlaps with ANSC 150 A00 LE
Ramsey Ismail GLBH 150 A00 LE overlaps with ANSC 150 A00 LE
Miguel Angel Castaneda HIUS 113 A00 LE overlaps with ETHN 154 A00 LE
Miguel Angel Castaneda HIUS 113 A00 LE overlaps with ETHN 154 A00 LE
Maho Takahashi LIGN 119 A00 LE overlaps with EDS 119 A00 LE
Maho Takahashi LIGN 119 A00 LE overlaps with EDS 119 A00 LE
Evelyn Vasquez LTEN 178 A00 LE overlaps with ETHN 168 A00 LE
Evelyn Vasquez LTEN 178 A00 LE overlaps with ETHN 168 A00 LE
Shruti Singh PHYS 1BL 001 LA overlaps with PHYS 1AL 001 LA
Shruti Singh PHYS 1BL 001 LA overlaps with PHYS 1AL 001 LA
Shruti Singh PHYS 1BL 002 LA overlaps with PHYS 1AL 002 LA
Shruti Singh PHYS 1BL 002 LA overlaps with PHYS 1AL 002 LA
Shruti Singh PHYS 1CL 001 LA overlaps with PHYS 1AL 001 LA
Shruti Singh PHYS 1CL 001 LA overlaps with PHYS 1AL 001 LA
Shruti Singh PHYS 1CL 002 LA overlaps with PHYS 1AL 002 LA
Shruti Singh PHYS 1CL 002 LA overlaps with PHYS 1AL 002 LA
John Charles Anderson MGT 4 A00 LE overlaps with ECON 4 A00 LE
John Charles Anderson MGT 4 A00 LE overlaps with ECON 4 A00 LE
Fonna Forman SIO 109R A00 LE overlaps with POLI 117R A00 LE
Makeba Jones SOCI 126 A00 LE overlaps with EDS 126 A00 LE
Makeba Jones SOCI 126 A00 LE overlaps with EDS 126 A00 LE
Yael Shmaryahu Yeshurun USP 105 A00 LE overlaps with SOCI 153 A00 LE
Yael Shmaryahu Yeshurun USP 105 A00 LE overlaps with SOCI 153 A00 LE
```

Just glancing at the course codes, most of these make sense as cross-listed courses.

However, the PHYS lab courses look kind of sus because PHYS 1AL is in MAYER 2306 while PHYS 1BL is in MAYER 2326. [According to Reddit](https://www.reddit.com/r/UCSD/comments/8h4vao/phys_1aal/dyh7q0t/), it seems the professor never shows up to lab.

I took a look at SP23:

```js
BENG 193 BENG 102 A00 [ "PR", "DI" ] [ "PFBH 391", "CENTR 205" ]
```

BENG 102 has its lectures as the enrollable sections, while it has two additional discussion meetings. Pretty wacky. So my heuristic for what classes a professor might attend is wrong.

However, a lot of the later output seems promising:

```
BNFO 285 BENG 285 A00 LE PETER 104
BNFO 285 BENG 285 A00 LE PETER 104
BIMM 182 BENG 182 A00 LE MANDE B-210
BIMM 182 BENG 182 A00 LE MANDE B-210
BIMM 194 BGGN 283 A00 SE YORK 3010
BIMM 194 BGGN 283 C00 SE YORK 3010
BIMM 194 BGGN 283 D00 SE YORK 3010
BIPN 144 BGGN 250 A00 LE CENTR 212
BIPN 144 BGGN 250 A00 LE CENTR 212
BIPN 194 BGGN 284 A00 SE YORK 3010
BIPN 194 BGGN 284 B00 SE YORK 3010
BIPN 194 BGGN 284 C00 SE YORK 3010
BIPN 194 BGGN 284 D00 SE YORK 3010
BISP 194 BGGN 285 A00 SE YORK 3010
BISP 194 BGGN 285 B00 SE YORK 3010
```

I changed the program to only print as an array when the values differ. Here, the section codes, type, and location all match. I think I can check if locations match to determine if a class is the same. But what about TBA?

```
BISP 195 BGGN 500 A00 PR [ "PACIF 3500", "TBA" ]
BISP 195 BGGN 500 B00 PR [ "PACIF 3500", "TBA" ]
BISP 195 BGGN 500 C00 PR [ "PACIF 3500", "TBA" ]
```

The course catalog doesn't say anything about them being related, but ScheduleOfClasses notes,

> BGGN 500 A00 will meet the first six weeks of the quarter on April 3, 10, 17, 24 and May 1 and 8 in PACIF 3500.

wtf. Well, it's not like the classrooms website cares about TBA locations. The main purpose of this was just to remove overlapping classes.

```js
CHEM 105A CHEM 105A [ "B00", "A00" ] LE [ "TBA", "CENTR 214" ]
CHEM 108 CHEM 108 [ "B00", "A00" ] LE [ "TBA", "NSB 2303" ]
CHEM 109 CHEM 109 [ "B00", "A00" ] LE [ "TBA", "NSB 2303" ]
```

These are weird because B00 has the same times for all sections as A00, but some of the B00 sections are TBA. They had a course capacity of 0 with 0 people on the waitlist. ??

```js
CSE 100R CSE 100 A00 LE [ "RCLAS R06", "WLH 2005" ]
CSE 100R CSE 100 A00 LE [ "RCLAS R06", "WLH 2005" ]
CSE 100R CSE 100 A00 LE [ "RCLAS R06", "WLH 2005" ]
```

I know that these classes are co-taught, but since they're at different locations, my working algorithm idea wouldn't work for this.

```js
DSC 291 DSC 190 [ "E00", "C00" ] LE WLH 2114
DSC 291 DSC 190 [ "E00", "C00" ] LE WLH 2114
DSC 291 DSC 190 [ "F00", "B00" ] LE WLH 2114
DSC 291 DSC 190 [ "F00", "B00" ] LE WLH 2114
```

This just shows that the section codes don't have to match.

```js
EDS 289B EDS 282 A00 SE TBA
EDS 291B EDS 282 A00 SE TBA
EDS 294B EDS 282 A00 SE TBA [ [ 480, 990 ], [ 540, 960 ] ]
```

If TBA locations match, that doesn't mean they're co-scheduled I think.

For matching non-TBA locations (including RCLAS), their section types match too, so there's no need to check them.

Hmm, but are groups coscheduled, or are courses coscheduled? Matching coscheduled groups makes more sense because they share instructors. I think it's safe to say that groups within the same course won't be coscheduled.

```
BIMM 194 BGGN 283 A00  YORK 3010
BIMM 194 BGGN 283 C00  YORK 3010
BIMM 194 BGGN 283 D00  YORK 3010
BIPN 144 BGGN 250 A00  CENTR 212
BIPN 194 BGGN 284 A00  YORK 3010
BIPN 194 BGGN 284 B00  YORK 3010
BIPN 194 BGGN 284 C00  YORK 3010
BIPN 194 BGGN 284 D00  YORK 3010
BISP 194 BGGN 285 A00  YORK 3010
BISP 194 BGGN 285 B00  YORK 3010
```

Note that, as seen above for A00, more than two courses/groups can be coscheduled together.
