## Scraping the course catalog

Why not use WebReg? It's because some courses are quarter-dependent (eg CAT 1)
and won't show up on WebReg for the current quarter. I suppose I could scrape
all quarters since there are courses on WebReg (eg LIGN 42) that aren't in the
catalog.

### Course name oddities

This refers to course names that required modifying my regex. When I list
examples, this doesn't mean they're the only example. They're just the first one
that came up.

- Subject codes:

  - Subject codes are usually 3 or 4 capital letters, but [SE (structural
    engineering)](https://catalog.ucsd.edu/courses/SE.html) is only 2 letters
    long.

  - [AAS 185](https://catalog.ucsd.edu/courses/AASM.html#aas185) is listed as
    "AAS/ANSC 185"; I'm making it ignore whatever subject code is after the
    slash because it's a cross listing. The entire page is under AASM.html, but
    the subject code is AAS.

    - [BENG/... 182](https://catalog.ucsd.edu/courses/BENG.html#beng182) is
      cross listed with more than two subjects.

  - [ANTH (anthropology)](https://catalog.ucsd.edu/courses/ANTH.html) has
    various subject codes listed.

  - [CLAS (classical studies)](https://catalog.ucsd.edu/courses/CLAS.html) has
    `CLASSIC` as some of its subject codes, which is very long. I feel like this
    was done in error.

  - [LISL 1A](https://catalog.ucsd.edu/courses/LING.html#lisl1a) and a lot of
    the other linguistics courses wrap the subject code in parentheses preceded
    by "Linguistics/Capitalized Language Name."

    - [LIDS 19](https://catalog.ucsd.edu/courses/LING.html#lids19) is just
      "Linguistics (LIDS)," with no slash.

- Course codes:

  - [AIP 197DC](https://catalog.ucsd.edu/courses/AIP.html#aip197dc) has two
    letters in its course code.

  - [CHIN 160/260](https://catalog.ucsd.edu/courses/CHIN.html#chin160) has a
    slash in its course code. I guess they're aliases or something.

    - [GSS 21-...-26](https://catalog.ucsd.edu/courses/GSS.html#tws21) uses
      hyphens instead.

    - [LISL 5A-C](https://catalog.ucsd.edu/courses/LING.html#lisl5a) uses commas
      instead. However, unlike the above two cases, these include letters.

      - [POLI 5 or 5D](https://catalog.ucsd.edu/courses/POLI.html#poli5) uses
        "or."

  - [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a) lists
    an entire sequence at once.

    - [SE 130A-B](https://catalog.ucsd.edu/courses/SE.html#se130a) uses an en
      dash instead of a hyphen.

  - [COMM 114M](https://catalog.ucsd.edu/courses/COMM.html#comm114m) doesn't
    have a period after the course code. This is not that rare.

  - [EDS 128 A-B](https://catalog.ucsd.edu/courses/EDS.html#eds128b) has a space
    between the course code's number and letter.

- Characters in course names:

  - [SE 87](https://catalog.ucsd.edu/courses/SE.html#se87)'s course name has a
    hyphen in it.

  - [AIP 197DC](https://catalog.ucsd.edu/courses/AIP.html#aip197dc) has a comma
    and a colon in its name.

  - [AIP 197T](https://catalog.ucsd.edu/courses/AIP.html#aip197t) has an em dash
    (—) in its name.

  - [AAS 185](https://catalog.ucsd.edu/courses/AASM.html#aas185)'s course name
    has a pound sign (#).

  - [ANAR 159GS](https://catalog.ucsd.edu/courses/ANTH.html#anar159gs) uses
    directional quotes and digits in its name.

  - [ANSC 191GS](https://catalog.ucsd.edu/courses/ANTH.html#ansc191GS) uses an e
    with an acute accent (é) in its name.

  - [ANSC 155](https://catalog.ucsd.edu/courses/ANTH.html#ansc155) has a
    question mark in its name.

  - [ANTH 209](https://catalog.ucsd.edu/courses/ANTH.html#anth209) has a
    directional single quote in its name.

  - [ANTH 292](https://catalog.ucsd.edu/courses/ANTH.html#anth292) has a slash
    in its name.

  - [ANAR 104](https://catalog.ucsd.edu/courses/ANTH.html#anar104) has
    parentheses in its name.

  - [CLIN 277A](https://catalog.ucsd.edu/courses/CLIN.html#clin227a) has an
    ampersand in its name.

  - [COGS 15](https://catalog.ucsd.edu/courses/COGS.html#cogs15) has a bunch of
    symbols in its name. At this point, I don't think it's worth having an
    allowlist of characters for the course title.

- Units:

  - [AIP 197](https://catalog.ucsd.edu/courses/AIP.html#aip197) has units
    separated by commas.

    - [AAS 198](https://catalog.ucsd.edu/courses/AASM.html#aas198) has its units
      listed using "or" instead of a comma.

    - [ECE 197](https://catalog.ucsd.edu/courses/ECE.html#ece197) lists its
      units with both commas and an or: "2, ..., 10, or 12."

  - [AAS 190](https://catalog.ucsd.edu/courses/AASM.html#aas190) has its units
    listed as a range with an en dash (–).

    - [BILD 98](https://catalog.ucsd.edu/courses/BIOL.html#bild98) has a range
      of units using "to" instead of an en dash.

  - [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a)'s
    units are also listed as (4-4-4). It seems all courses with A-B-C have n-n-n
    units.

    - [CLASSIC 399](https://catalog.ucsd.edu/courses/CLAS.html#clas399) also has
      4-4-4 units but it doesn't have the A-B-C course code.

  - [COMM 101A](https://catalog.ucsd.edu/courses/COMM.html#comm101a) doesn't
    have units. This is quite rare.

  - [ECON 202A-B-C](https://catalog.ucsd.edu/courses/ECON.html#econ202c) lists
    the units for its three quarters as 0–4/0–4/0–4.

    - [MUS 201A-F](https://catalog.ucsd.edu/courses/MUS.html#mus201a) instead
      uses commas (followed by a space).

  - [LISL 1A](https://catalog.ucsd.edu/courses/LING.html#lisl1a) and a lot of
    the other linguistics courses have 2.5 units.

    - [LIPO 15](https://catalog.ucsd.edu/courses/LING.html#lipo15) and a few
      other linguistics courses have 2.0 units. As a side note, this one in
      particular at least curiously also wraps its `anchor-parent` element
      twice.

  - [MUS 80](https://catalog.ucsd.edu/courses/MUS.html#mus80) has a space before
    the closing parenthesis.

  - [MUS 130](https://catalog.ucsd.edu/courses/MUS.html#mus130) has 2–4/0 units,
    whatever that means. My best guess is "two to four, or zero."

- Miscellaneous whitespace:

  - [ANAR 113](https://catalog.ucsd.edu/courses/ANTH.html#anar113) is very
    subtle: it has a non-breaking space (`&nbsp;`) after the period. Most of the
    others don't.

  - [CLIN 296](https://catalog.ucsd.edu/courses/CLIN.html#clin296) has a bunch
    of trialing non-breaking spaces after the units. This is quite rare it
    seems.

- [EDS 30](https://catalog.ucsd.edu/courses/EDS.html#eds30), like a lot of the
  other EDS courses, are cross-listed in the form `EDS 30/MATH 95`. I think it's
  safe to ignore whatever is after the slash.

  - [BENG 276](https://catalog.ucsd.edu/courses/BENG.html#beng276) has more than
    two subject-course code pairs, separated by slashes.

  - [HITO 193](https://catalog.ucsd.edu/courses/HIST.html#hito193) says it's
    cross-listed with COM GEN 194, which has a space in the subject code. I
    think it refers to [COMM
    194](https://catalog.ucsd.edu/courses/COMM.html#comm194).

  - [SCIS (science studies)](https://catalog.ucsd.edu/courses/SCIS.html) has
    courses separated by commas rather than slashes. All of the courses don't
    need to apply because they're already listed on their respective pages.
    Also, the page doesn't have anchors. I think this can be omitted.

- [SIO 114](https://catalog.ucsd.edu/courses/SIO.html#sio114)'s "Prerequisite:"
  label has the `course-name` class for some reason. I should just check if it's
  a `<p>` tag.

- [TDAC 103A](https://catalog.ucsd.edu/courses/THEA.html#tdac103a) is missing a
  space after its period. This is quite rare and seems to only happen on theatre
  course listings (TDGR 217, TDGR 243, and VIS 145B are the others).

  - [GPCO 468](https://catalog.ucsd.edu/courses/GPS.html#gpco468) has a colon
    instead of a period. The only other time this happens is with another GPS
    course.

- [MBC (marine biodiversity and
  conversion)](https://catalog.ucsd.edu/courses/MBC.html) has a section with the
  class `course-name` labelled "Electives. Varies (12)." It has a unit count,
  but it doesn't have an `anchor`, so it's not an actual course. It's probably
  just a major requirement. I think this should be ignored.

This leaves the following:

- Missing units. I don't really know how to deal with these, though I suppose I
  don't really need the units.

  - COMM 101A. Media Activism
  - HIEU 124. The Age of Alexander: Hellenistic History from Alexander the Great to Cleopatra
  - HILA 119. Central America: Popular Struggle, Political Change, and US Intervention
  - JAPN 190. Selected Topics in Contemporary Japanese Studies
  - LIGN 9GS. Sign Languages and Deaf Culture in the U.S. and France
  - USP 131. Culture, Tourism, and the Urban Economy: Case Studies of Craft Breweries
  - USP 141A. Life Course Scholars Research and Core Fundamentals
  - USP 141B. Life Course Scholars Capstone Project
  - USP 188. Field Research in Migrant Communities—Practicum

- Missing a period (I can fix this easily, but I don't want there to be false
  positives at this stage).

  - COMM 114M CSI: Communication and the Law (4)
  - COMM 114T CSI: Science Communication (4)
  - HIUS 178/278 The Atlantic World, 1400–1800 (4)
  - SOCI 123 Japanese Culture Inside/Out: A Transnational Perspective (4)

- Lists of course codes. The regex is quite large right now, so I plan on fixing these

  - Linguistics/American Sign Language (LISL) 5A, 5B, 5C. Fundamentals of American Sign Language (5)
  - Linguistics/French (LIFR) 5B, 5C, 5D. Fundamentals of French (5)
  - Linguistics/German (LIGM) 5A, 5B, 5C, 5D. Fundamentals of German (5)
  - Linguistics/Spanish (LISP) 5A, 5B, 5C, 5D. Fundamentals of Spanish (5)
  - Linguistics/Spanish (LISP) 15, 16, 17. Intermediate Spanish for the Social Sciences (2)
  - POLI 5 or 5D. Data Analytics for the Social Sciences (4)
  - POLI 10 or 10D. Introduction to Political Science: American Politics (4)
  - POLI 11 or 11D. Introduction to Political Science: Comparative Politics (4)
  - POLI 12 or 12D. Introduction to Political Science: International Relations (4)
  - POLI 13 or 13D. Power and Justice (4)
  - POLI 30 or 30D. Political Inquiry (4)

- `/0` in units. I think this means "or zero," but I'll first simplifiy the regex before adding this.

  - MUS 130. Chamber Music Performance (2–4/0)
  - MUS 131. Advanced Improvisation Performance (4/0)

- I'm not sure if I will need to capture the subject-course code pair from the
  middle of the list.

  - ANTH 268, COGR 225A, HIGR 238, PHIL 209A, SOCG 255A. Introduction to Science Studies (4)
  - ANTH 272, COGR 225B, HIGR 239, PHIL 209B, SOCG 255B. Seminar in Science Studies (4)
  - ANTH 273, COGR 225C, HIGR 240, PHIL 209C, SOCG 255C. Colloquium in Science Studies (4)
  - ANTH 269, COGR 225D, HIGR 241, PHIL 209D, SOCG 255D. Advanced Approaches to Science Studies (4)

Summary:

```
# Subjects
CSE
SE
BENG/BIMM/CSE/CHEM
CLASSIC
Linguistics/American Sign Language (LISL)
Linguistics/Spanish (LISP)

# Courses
11
197DC
160/260
21-22-23-24-25-26
5A, 5B, 5C
5 or 5D
249A-B-C
130A–B
128 A-B

# Subject-course code pairs
CSE 11
BENG 276/CHEM 276/MATH 276/SPPS 276
HITO 193/POLI 194/COM GEN 194/USP 194
ANTH 268, COGR 225A, HIGR 238, PHIL 209A, SOCG 255A

# Units
(4)
(2, 4, 6, 8, 10, 12)
(2 or 4)
(2, 4, 6, 8, 10, or 12)
(1–4)
(1 to 4)
(4-4-4)
(0–4/0–4/0–4)
(1–4, 1–4, 1–4, 1–4, 1–4, 1–4)
(2.5)
(2.0)
(1–4 )
(2–4/0)
(4/0)
```

### Description oddities

I'm starting to think the catalog is maintained by editing the HTML directly. My
assumption here is that every `p.course-name` is followed by exactly one
`p.course-descriptions`.

- [MGTF 408](https://catalog.ucsd.edu/courses/MGT.html#mgtf408) and some other
  courses are listed twice on the web page. The second time seldom uses the
  `course-descriptions` class for its paragraphs.

- [LTWL 140](https://catalog.ucsd.edu/courses/LIT.html#ltwl140) has a typo; its
  description's class is `course-description` not `course-descriptions`.

  - [HDS 191](https://catalog.ucsd.edu/courses/HDS.html#hds191) uses an atypical
    `faculty-staff-listing` class for its description.

  - [MATS 299](https://catalog.ucsd.edu/courses/MATS.html#mats299) uses
    `course-note`.

- [FPM 259B](https://catalog.ucsd.edu/courses/FMPH.html#fpm259b) has a second
  `course-descriptions` but it's for the anchor.

  - [COMM 101](https://catalog.ucsd.edu/courses/COMM.html#comm101) uses the
    `course-descriptions` class for headings as well.

- [CSS 100](https://catalog.ucsd.edu/courses/css.html#css100) has a second
  `course-descriptions` paragraph that just contains a non-breaking space.

- [VIS 23](https://catalog.ucsd.edu/courses/VIS.html#vis23) has a legitimate
  second description paragraph that just contains a note.

  - [MUS 95](https://catalog.ucsd.edu/courses/MUS.html#mus95) has various
    paragraphs in the form of a note as well.

- [POLI 132](https://catalog.ucsd.edu/courses/POLI.html#poli132) has a bare
  description that isn't in a `<p>` tag.

- [PHYS 258](https://catalog.ucsd.edu/courses/PHYS.html#phys259a) is interrupted
  by an `anchor-parent` in between the name and description.

- [JAPN 190](https://catalog.ucsd.edu/courses/JAPN.html#japn190) straight up
  just doesn't have a description.

Therefore, I can follow the following rule:

- If the next element sibling is a `<p>` element, then it has the course
  description.

  - Otherwise, see if there's a non-empty adjacent text node.

- If the next next element sibling starts with `Note:` (as with the two cases
  listed above), then keep taking the next element until you run out of
  `course-descriptions`.

## Prerequisite parsing

The only time "prerequisite" is mentioned other than in the form
`Prerequisites:` is to clarify that one course is not a prerequisite for another
([ETHN 257A](https://catalog.ucsd.edu/courses/ETHN.html#ethn257a) and [HIUS
151](https://catalog.ucsd.edu/courses/HIST.html#hius151)).

- Four courses ([LING 256](https://catalog.ucsd.edu/courses/LING.html#lign256),
  [SIOC 207B](https://catalog.ucsd.edu/courses/SIO.html#sioc207b),
  [C](https://catalog.ucsd.edu/courses/SIO.html#sioc207c), and
  [D](https://catalog.ucsd.edu/courses/SIO.html#sioc207d)) have "Recommended
  Prerequisites:", so I'll have to check for that. Fortunately, it's always
  listed before the actual prerequisites, so I don't have to look for a period
  or something.

I think for now, I will just focus on prerequisite (and maybe corequisite)
courses, excluding major-exclusivities and whatnot. Let's compare various
prerequisites.

### Stage 1: "and" and "or"

Generally, it seems that `/[A-Z]+ \d+[A-Z]*/` matches all mentioned course
names. "Or" binds tighter than "and." I think a comma implies "and" unless
otherwise noted.

I'll tokenize prerequisite strings into:

- Commas
- Conjunctions ("and" and "or")
- Subject-course code pairs

Examples:

- VIS 161.
  <!-- VIS 161 -->
- successful completion of USP 141A.
  <!-- USP 141A -->
- VIS 83 or VIS 84.
  <!-- VIS 83 or VIS 84 -->
- graduate standing, SIOB 276 or SIO 276 and consent of instructor. Department stamp. Sugihara
  <!-- , SIOB 276 or SIO 276 and -->
- THDA 132 or TDMV 136 or TDMV 142 or TDMV 143 or TDMV 144, or consent of instructor.
  <!-- THDA 132 or TDMV 136 or TDMV 142 or TDMV 143 or TDMV 144 , (and) -->
- upper-division standing; RELI 110A or 110B; overall GPA of 2.5.
  <!-- RELI 110A or 110B -->
- THPW or TDPW 1 and THPW or TDPW 101.
  <!-- THPW or TDPW 1 and THPW or TDPW 101 -->
- CHEM 6C or CHEM 6CH and MATH 20C or MATH 31BH or consent of instructor.
  <!-- CHEM 6C or CHEM 6CH and MATH 20C or MATH 31BH (and) -->
- SIOC 210 or SIO 210 and SIOB 280 or SIO 280 or consent of instructor. Ohman, A. Allen
  <!-- SIOC 210 or SIO 210 and SIOB 280 or SIO 280 (and) , -->
- (CHEM 6B or 6BH) and (BILD 3 or SIO 50 or SIO 60)
  <!-- CHEM 6B or 6BH and BILD 3 or SIO 50 or SIO 60 -->

This should be relatively trivial. I could have a list of requirements ("and"),
each with a list of options ("or"). Split by "and" first, then for each, split
by "or."

1. Split by "and."
2. For each resulting group, split by "or."

### Stage 1.5: Commas

- graduate standing; SOCI 1, SOCI 2; or consent of instructor.
  <!-- SOCI 1 , SOCI 2 (and) -->
- THGR 270A, THGR 270B, graduate standing, consent of instructor.
  <!-- THGR 270A , THGR 270B , , -->
- BILD 3, MATH 10A or MATH 20A, CHEM 6B, or consent of instructor.
  <!-- BILD 3 , MATH 10A or MATH 20A , CHEM 6B , (and) -->
- THGR 270A or TDGR 270A, THGR 270B or TDGR 270B, graduate standing, and consent of instructor.
  <!-- THGR 270A or TDGR 270A , THGR 270B or TDGR 270B , , and -->
- THPR or TDPR 4, THPR or TDPR 104, THDR or TDDR 101, consent of instructor, and department stamp.
  <!-- THPR or TDPR 4 , THPR or TDPR 104 , THDR or TDDR 101 , , and -->
- USP 177, USP 177A, or USP 179.
  <!-- USP 177 , USP 177A , or USP 179 -->

These involve Oxford commas. I might be able to get away with treating commas as
global, meaning that there can only be one list involving commas in a prereq
string. Then, if a comma is followed by a conjunction, I can remove the comma
and replace all the commas before it with the conjunction. Thus, `A , B , or C`
becomes `A or B or C`. Any unresolved commas become "and." Duplicate
conjunctions can be merged; hopefully I don't have to deal with "or and."

Note: "or consent of instructor" is not the same as plain "or"; it actually
means .

For example, [SIO 124](https://catalog.ucsd.edu/courses/SIO.html#sio124)'s
prerequisites are:

> CHEM 6C and BILD 1 or BILD 3 or consent of instructor.

WebReg presents the prerequisites as:

> **Course Prerequisites:**
>
> 1. - CHEM: 6C - General Chemistry III
> 2. - BILD: 1 - The Cell _or_
>    - BILD: 3 - Organismic&Evolutionary Biol

In other words, Chem 6C is _not_ a substitute for BILD 1/3.

That doesn't mean that "or" always actually means "and," though; see the last
example. I may have to tokenize "or consent of instructor" as a distinct token
from "or" and treat it as "and."

1. For commas followed by a conjunction, remove the comma and replace all prior
   commas with the conjunction. "or consent of instructor" is considered "and."
2. Follow the steps in Stage 1.

Theoretically, there could be a "A and B, C and D, or E and F," but I don't
think I've encountered it yet so I don't have to worry about it yet.

### Stage 2: Shorthand with common subject/course code

- VIS 30 and 41.
  <!-- VIS 30 and 41 -->
- CHEM 6C and BILD 1 or 3 or consent of instructor.
  <!-- CHEM 6C and BILD 1 or 3 (and) -->
- THPR or TDPR 1, 2, 3, or 5; permission of instructor; department stamp required.
  <!-- THPR or TDPR 1 , 2 , 3 , or 5 -->
- audition; department stamp; concurrent enrollment in TDMV 110, 111, 112, 120, 122, 130, or 133.
  <!-- TDMV 110 , 111 , 112 , 120 , 122 , 130 , or 133 -->
  - TODO: Deal with "concurrent."
- twelve units of THDA 101A-B-C or TDMV 111 or consent of instructor.
  <!-- THDA 101A-B-C or TDMV 111 (and) -->
- THDE or TDDE 1 and THDE or TDDE 101 or THDE or TDDE 121, or THDE or TDDE 131, or consent of instructor.
  <!-- THDE or TDDE 1 and THDE or TDDE 101 or THDE or TDDE 121 , or THDE or TDDE 131 , (and) -->
- undergraduate: PHYS 2A-B or PHYS 4A-B-C, or consent of instructor. Graduate: graduate-level standing or consent of instructor.
  <!-- PHYS 2A-B or PHYS 4A-B-C , (and) (and) -->
- PHYS 2A–C or PHYS 4A–C and MATH 20A–E, or consent of instructor.
  <!-- PHYS 2A–C or PHYS 4A–C and MATH 20A–E , (and) -->
- PHYS 105A, MATH 20A, 20B, 20C or 31BH, 20D, 20E or 31CH, and 18 or 20F or 31AH.
  <!-- PHYS 105A , MATH 20A , 20B , 20C or 31BH , 20D , 20E or 31CH , and 18 or 20F or 31AH -->

Instead of tokenizing subject-course code pairs, I should tokenize them
individually, as well as allowing ranges in course codes.

Conjunctions can be applied to just subject or just course codes. I think if I
encounter a conjunction that follows a subject code (eg "CSE or") or precedes a
course code (eg "and 3"), then the conjunction must be for that code
specifically. Subject codes will probably only have "or."

I think I will group course codes together by taking as many tokens as possible
until it encounters a subject code. For example, "SUBJ 1 or 2 or 3 or SUB2 ..."
will be grouped as "SUBJ (1 or 2 or 3) or SUB2 ..." Hmm, maybe commas shouldn't
be processed, then. I should do the grouping first, then process the commas.

For example:

- PHYS 105A, THDE or MATH 20A, 20C or 31BH, 20D, or USP 179.
- PHYS 105A , THDE or MATH 20A , 20C or 31BH , 20D , or USP 179 (tokenize)
- (PHYS) (105A) , (THDE or MATH) (20A , 20C or 31BH , 20D) , or (USP) (179) (group)
- (PHYS) (105A) or (THDE or MATH) (20A and 20C or 31BH and 20D) or (USP) (179) (comma processing)
- Distribute subject and course code pairs.
- All of:
  1. One of:
     - PHYS 105A
     - All of:
       1. One of: THDE 20A, MATH 20A
       2. One of: THDE 20C, MATH 20C, THDE 31BH, MATH 31BH
       3. One of: THDE 20D, MATH 20D
     - USP 179

1. Tokenize.
2. Group sequences of subject and course codes, including everything in between,
   as long as it begins and ends with a code.
   1. Go from left to right.
   2. When encountering a subject/course code, keep track of a start and end
      index.
   3. Every time a code of the same type is encountered, update the end index.
   4. When a code of a different type or the end of the tokens is encountered,
      splice the range of tokens into a group.
   5. When not in a range, add the tokens (probably conjunctions and commas) to
      the main group.
3. For each of the groups, including the main group, parse the commas and
   conjunctions as specified in Stage 1.5.

After that, there'll be a mess of ands and ors, which I'll have to figure out
how to dea lwith later.

### Stage 3: Excluding "Will not receive credit for"

- upper-division standing. Will not receive credit for SOCI 154 and SOCC 154.
- SOCI 60. Will not receive credit for SOCI 108 and SOCA 108.
- SOCI 60; majors only. Will not receive credit for SOCI 104 and SOCA 104.

I can probably just ignore everything after "Will not receive credit for."

```
# Stage 4: Other scary oddities
senior standing, VIS 135, and two from VIS 100A, VIS 101A, VIS 133A, VIS 136A, VIS 161, VIS 162.
VIS 142; CSE 11 recommended. Open to visual arts majors and ICAM minors only. Two production-course limitation.
THGR or TDGR 213A for B, THGR or TDGR 213B for C; admission to the MFA theatre program.
POLI 5D/POLI 5D/ECON 5 or POLI 30D.
CHEM 132 or the combination of PHYS 100A and 110A. Corequisites: PHYS 140A.
```

### Corequisites

Split by "concurrent" or "Corequisites"; parse them the same way as for
prerequisites, but store them separately, I think.

- upper-division standing. Must be taken concurrently with PSYC 121 or PSYC 140.
- CHEM 132 or the combination of PHYS 100A and 110A. Corequisites: PHYS 140A.
