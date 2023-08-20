this has nothing to do with the rest of the repo but idk where to put this

let's figure out what term it is based on the date

## Notes

This is based on calendars from the 2004–2005 school year to 2028–2029. Summer session dates are only available from 2009–2010 to 2022–2023.

Winter quarter always starts between January 3 and 9.

| Quarter   | Start day\* | End day  |
| --------- | ----------- | -------- |
| Fall      | Thursday    | Saturday |
| Winter    | Monday      | Saturday |
| Spring    | Monday      | Friday   |
| Summer I  | Monday      | Saturday |
| Summer II | Monday      | Saturday |

\*Based on when instruction begins, as opposed to the administrative quarter start date.

Breaks:

- Spring break is always a week long.
- There are always two weeks between spring quarter and summer session I.
- Summer sessions I and II are always adjacent (there is no break between them).
- After summer session II, there are another 2 weeks until fall quarter week 0.

Finals:

- For fall, winter, and spring quarters, finals always begin the Saturday before the end of the quarter.
- For summer sessions, the finals occur in the last two days of the quarter.

Therefore, in a given year,

- Winter quarter weeks 1–10 and finals (11 weeks)
- Spring break (1 week)
- Spring quarter weeks 1–10 and finals (11 weeks)
- Summer break I (2 weeks)
- Summer session I weeks 1–5 (5 weeks)
- Summer session II weeks 1–5 (5 weeks)
- Summer break II (2 weeks)
- Fall quarter weeks 0–10 and finals (12 weeks)
- Winter break (3–4 weeks)
- = 52–53 weeks in a year

Exceptions:

- In 2006, fall quarter was one week earlier, moving a week of summer break into winter break. I'm not sure why.
  - Identical dates also occur around 2017 and 2023, but their fall quarters are normal.
- In [2014] and [2020], fall quarter was delayed by a week, moving a week of winter break into summer. I'm not sure why.
  - What's strange is that the calendars around 2025 have the same dates as around 2014, yet 2025–2026 is not delayed.
  - Considering one of the years is 2020, it is possible that these years were manually made exceptions due to acts of God, such as COVID-19. However, even in 2016, [2020–2021 was planned to start in October.][2020-v2016]
  - On the page for [2020], it says "\* All dates for Fall 2020 are in compliance with UCOP Religious Holiday Conflict Policy."
    - [This policy][conflict-policy] went into effect for 2010, which can explain why 2006 is odd; in fact, Fall 2006 was cited as problematic, so they might've shifted all later fall quarters a week forward. It cites "the Jewish High Holy Days of Rosh Hashanah and Yom Kippur" as a concern.
    - In 2020, Rosh Hashanah ran from Sept 18 to 20 (FA20's move-in weekend would've been Sept 19 and 20). In 2014, it ran from Sept 24 to 26 (FA14 would've started Sept 25). In 2006, it ran from Sept 22 to 24 (FA06 started on Sept 21).
    - In 2020, Yom Kippur ran from Sept 27 to 28. In 2014, it ran from Sept Oct 3 to 4. In 2006, it ran from Oct 1 to 2.
- It seems that in S121, S122, and S222, instruction ends on the same day finals start, which suggest that classes may overlap with finals. This might be an error, or a beginning of a new convention.
- [Winter 2028][2027] starts on Jan 10, rather than Jan 3, lengthening winter break by a week.
  - It might be because fall 2028 would otherwise September 21, which is earlier than all quarters except for 2006, which itself appears to be an oddball.
    - And Rosh Hashanah 2028 will be from Sept 21 to 22.
  - Curiously, "Winter Quarter begins" is on a Wednesday (Jan 5) before instruction begins. This is a change starting with [2027–2028][2027].

[2014]: https://blink.ucsd.edu/instructors/resources/academic/calendars/2014.html
[2020]: https://blink.ucsd.edu/instructors/resources/academic/calendars/2020.html
[2027]: https://blink.ucsd.edu/instructors/resources/academic/calendars/2027.html
[conflict-policy]: https://www.ucop.edu/institutional-research-academic-planning/_files/policy-religious-holiday-conflict-residence-hall-movein-2007.pdf
[2020-v2016]: https://web.archive.org/web/20160228052634/https://blink.ucsd.edu/instructors/resources/academic/calendars/2020.html

Current test failure categories:

- 2028 winter quarter begins change (WI28, SP28, FA28 a week later than predicted)
- Post-2010 Jewish holiday adjustment (FA14, FA20 a week later than predicted)
- Unexplained week differences:
  - FA06, FA01, FA95 a week earlier than predicted
  - FA99, WI00, SP00, S100, S200 a week later than expected
- 1995 spring quarter end day change (SP94, SP95 end Saturday not Friday)
