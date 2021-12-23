## Scraping

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
      instead.

  - [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a) lists
    an entire sequence at once. Its units are also listed as (4-4-4). It seems
    all courses with A-B-C have n-n-n units.

  - [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a) lists
    an entire sequence at once.

    - [SE 130A-B](https://catalog.ucsd.edu/courses/SE.html#se130a) uses an en
      dash instead of a hyphen.

  - [COMM 114M](https://catalog.ucsd.edu/courses/COMM.html#comm114m) doesn't
    have a period after the course code. This is quite rare.

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

- Whitespace:

  - [ANAR 113](https://catalog.ucsd.edu/courses/ANTH.html#anar113) is very
    subtle: it has a non-breaking space (`&nbsp;`) after the period. Most of the
    others don't.

  - [CLIN 296](https://catalog.ucsd.edu/courses/CLIN.html#clin296) has a bunch
    of trialing non-breaking spaces after the units. This is quite rare it
    seems.

- Units:

  - [AAS 190](https://catalog.ucsd.edu/courses/AASM.html#aas190) has its units
    listed as a range with an en dash (–).

  - [AAS 198](https://catalog.ucsd.edu/courses/AASM.html#aas198) has its units
    listed using "or" instead of a comma.

  - [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a)'s
    units are also listed as (4-4-4). It seems all courses with A-B-C have n-n-n
    units.

    - [CLASSIC 399](https://catalog.ucsd.edu/courses/CLAS.html#clas399) also has
      4-4-4 units but it doesn't have the A-B-C course code.

  - [COMM 101A](https://catalog.ucsd.edu/courses/COMM.html#comm101a) doesn't
    have units. This is quite rare.

  - [ECON 202A-B-C](https://catalog.ucsd.edu/courses/ECON.html#econ202c) lists
    the units for its three quarters as 0–4/0–4/0–4.

  - [ECE 197](https://catalog.ucsd.edu/courses/ECE.html#ece197) lists its units
    with both commas and an or: "2, ..., 10, or 12."

  - [LISL 1A](https://catalog.ucsd.edu/courses/LING.html#lisl1a) and a lot of
    the other linguistics courses have 2.5 units.

    - [LIPO 15](https://catalog.ucsd.edu/courses/LING.html#lipo15) and a few
      other linguistics courses have 2.0 units. As a side note, this one in
      particular at least curiously also wraps its `anchor-parent` element
      twice.

- [EDS 30](https://catalog.ucsd.edu/courses/EDS.html#eds30), like a lot of the
  other EDS courses, are cross-listed in the form `EDS 30/MATH 95`. I think it's
  safe to ignore whatever is after the slash.

  - [BENG 276](https://catalog.ucsd.edu/courses/BENG.html#beng276) has more than
    two subject-course code pairs, separated by slashes.

  - [HITO 193](https://catalog.ucsd.edu/courses/HIST.html#hito193) says it's
    cross-listed with COM GEN 194, which has a space in the subject code. I
    think it refers to [COMM
    194](https://catalog.ucsd.edu/courses/COMM.html#comm194).
