## Scraping

### Course name oddities

This refers to course names that required modifying my regex. When I list
examples, this doesn't mean they're the only example. They're just the first one
that came up.

- Subject codes are usually 3 or 4 capital letters, but [SE (structural
  engineering)](https://catalog.ucsd.edu/courses/SE.html) is only 2 letters
  long.

- [AAS 185](https://catalog.ucsd.edu/courses/AASM.html#aas185) is listed as
  "AAS/ANSC 185"; I'm making it ignore whatever subject code is after the slash
  because it's a cross listing. The entire page is under AASM.html, but the
  subject code is AAS.

- [AIP 197DC](https://catalog.ucsd.edu/courses/AIP.html#aip197dc) has two
  letters in its course code.

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

- [ANAR 113](https://catalog.ucsd.edu/courses/ANTH.html#anar113) is very subtle:
  it has a non-breaking space (`&nbsp;`) after the period. Most of the others
  don't.

- Units:

  - [AAS 190](https://catalog.ucsd.edu/courses/AASM.html#aas190) has its units
    listed as a range with an en dash (–).

  - [AAS 198](https://catalog.ucsd.edu/courses/AASM.html#aas198) has its units
    listed using "or" instead of a comma.

- [ANTH (anthropology)](https://catalog.ucsd.edu/courses/ANTH.html) has various
  subject codes listed.

- [CLAS (classical studies)](https://catalog.ucsd.edu/courses/CLAS.html) has
  `CLASSIC` as some of its subject codes, which is very long. I feel like this
  was done in error.

- [CHIN 160/260](https://catalog.ucsd.edu/courses/CHIN.html#chin160) has a slash
  in its course code. I guess they're aliases or something.

- [BGGN 249A-B-C](https://catalog.ucsd.edu/courses/BIOL.html#bggn-249a) lists an
  entire sequence at once. Its units are also listed as (4-4-4). It seems all
  courses with A-B-C have n-n-n units.

- [CLASSIC 399](https://catalog.ucsd.edu/courses/CLAS.html#clas399) also has
  4-4-4 units but it doesn't have the A-B-C course code.

- [CLIN 296](https://catalog.ucsd.edu/courses/CLIN.html#clin296) has a bunch of
  trialing non-breaking spaces after the units. This is quite rare it seems.
