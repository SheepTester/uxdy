#!/bin/bash

# In webreg-scraping/

echo "Serving dist/ at http://localhost:8080/"

http-server ./classrooms/dist/ -c-1 -s &
nodemon --ext ts,tsx --exec ./classrooms/build.sh
