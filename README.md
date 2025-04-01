# UCSD classroom schedules

[Live](https://sheeptester.github.io/uxdy/classrooms/)

> [!NOTE]
>
> This repo contains code related to other, fairly unrelated projects.
> The code for the classrooms website sits in two directories:
>
> - `scheduleofclasses/` - web scraping
> - `classrooms/` - web app

> [!CAUTION]
>
> This repo uses Deno 1.x. Since the `deno bundle` command has since been deprecated and removed, you must downgrade to Deno 1.x.
>
> If you don't have Deno installed already, set `deno_version` to specify the version to install.
>
> ```shell
> $ export deno_version=v1.46.3
> $ sudo apt-get install unzip -y
> $ curl -fsSL https://deno.land/install.sh | sh
> ```
>
> If you already have Deno installed, you can use `deno upgrade` to switch versions.
>
> ```shell
> $ deno upgrade 1.46.3
> ```

```sh
# In the repo root directory
$ TERM=FA23 deno task classrooms:scrape-to-file
# Deploy classroom data files
$ ./scripts/deploy.sh ./classrooms/data/ data

# Develop (does not minify)
$ deno task classrooms:watch
# Build
$ deno task classrooms:build
# Deploy built version (run classrooms:build first to minify)
$ ./scripts/deploy.sh ./classrooms/public/ classrooms
```

Map image was made with [this tool](https://sheeptester.github.io/words-go-here/misc/ucsd-map.html) (zoom 17, x: -6 to 5, y: -6 to 4).

<!-- Because the map is now HD, please scale the image down to 3072 by 2816. -->

Current uses:

- **Checking when a classroom is available.** Does RWAC 0935 have classes in it? When are they?
  - Feature: schedule for each room.
- **Finding ongoing lectures nearby to crash.** I'm sitting in the Jeannie studying as the next lecture comes in. What course is it for?
  - Feature: map of buildings.
- **Finding available classrooms during a specific time.** Spencer is available to teach juggling at 3 pm. What classroom can he teach it in?
  - Feature: changing the "current" time.
- **Getting the start and end dates of each quarter.** The internship application asks when I'm available to start. When does spring end? I'm too lazy to find that enrollment calendar website.
  - Feature: calendar view with quarters marked out.
- **Converting between month/day dates and quarter weeks.** May 15, what week is that?
  - Feature: calendar view with week numbers.
- **Looking up the lecture location for a class.** I'll crash ECE 100. Where is it? I'm too lazy to sign into WebReg, and searching up courses on there is slow.
  - Feature: search courses by course code, list meeting times/locations for a course.
- **Finding buildings by their code on the map.** Where is RECGM?
  - Feature: search buildings by code.
- **Finding what classes are taught by a professor this quarter.** What classes is Sworder teaching next quarter?
  - Feature: search sections by professor.

Planned uses:

- **Determining when a professor is free.** I want to schedule a meeting with my professor. When might they be free?
  - Feature: calendar view for a professor. Note: this might have privacy implications, tread carefully.
- **Guiding students to buildings.** Where is Mosaic? It's next to Wolftown.
  - Feature: link to buildings directly, include photos of buildings.

Features to add:

- [x] Scrape data from schedule of classes rather than WebReg (so it doesn't require authentication)
- [x] Search by professor and course code
- [x] Set current time so can see what classrooms are available at a given date/time
- [x] Use Pacific Time regardless of browser time zone

- [x] Load summer session 3 when needed
- [ ] Handle co-scheduled courses
- [x] Show when the quarter's data was last refreshed
- [ ] Show all images for building

- [x] Support using back/forward for modals
- [x] Permalink buildings, courses, and professors
- [ ] Permalink dates
- [ ] Simplify term selection

---

# uxdy

What if 👀 i made 👉👈 another schedule app 👁👁 but for ucsd 😮💦

[**Scrape schedules**](https://github.com/SheepTester/uxdy/actions/workflows/scrape.yml)

## Development

```sh
$ npm install --global coffeescript pug-cli sass http-server

# Build
$ ./scripts/build.sh

# Deploy built version to GitHub Pages
$ ./scripts/deploy.sh dist/
```

This will auto-build the files in `src/` whenever you edit them, but you need to
run `./scripts/build.sh` at least once to copy over the `static/` files. This
will also make the web app available locally at http://localhost:8080/dist/.

```sh
$ ./scripts/watch.sh
```

## Features that I want

This is just a personal app.

- View all five days at once (can be squished on phones, whatever, web design is
  my passion)
- Keep track of my professor names and section codes (I will probably remember
  them eventually, though)
- Show the time left until the next class
  - This can be a bit smart-dumb in that if the next class is on Monday and it's
    Friday evening, it'll calculate it across days
- Show a notification for a given Zoom link for remote classes
- Hard code the quarter start/end times and final times and holidays, perhaps

Maybe I can also add the ability to add homework due dates since they seem a lot
simpler and fixed than high school.

Eventually, I can open this up to other people by having a way to import classes
from WebReg (by pasting some JS in the console, probably).

# Other projects

## [Enrollable classes bookmarklet](./webreg-scraping/bookmarklet/)

[Live](https://sheeptester.github.io/hello-world/bookmarklet.html?../uxdy/bookmarklet/open-classes)

```sh
# In the repo root directory
# Build
$ deno task bookmarklet:build
# Deploy built version
$ ./scripts/deploy.sh webreg-scraping/bookmarklet/dist/ bookmarklet
```

For development,

```sh
$ http-server -c-1 -s --cors
# Also run
$ nodemon --watch ./webreg-scraping/bookmarklet/ --ext ts,tsx --exec ./webreg-scraping/bookmarklet/build.sh
```

Then, to run the bookmarklet, reload the page (if the bookmarklet had already
run) and run this in the console.

```js
import(
  'http://localhost:8080/webreg-scraping/bookmarklet/dist/bookmarklet.min.js'
)
```
