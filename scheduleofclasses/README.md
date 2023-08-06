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
