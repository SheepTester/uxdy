# uxdy

What if 👀 i made 👉👈 another schedule app 👁👁 but for ucsd 😮💦

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
# In the base directory
# Build
$ ./webreg-scraping/bookmarklet/build.sh
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

## [Classrooms](./webreg-scraping/classrooms/)

[Live](https://sheeptester.github.io/uxdy/classrooms/)

```sh
# In webreg-scraping/
# Build
$ deno run --allow-read classrooms/to-file.ts > classrooms/dist/classrooms.txt
$ ./classrooms/build.sh
# Develop
$ ./classrooms/dev.sh
# Deploy built version
$ ../scripts/deploy.sh webreg-scraping/classrooms/dist/ classrooms
```
