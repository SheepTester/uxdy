#!/bin/bash

# In webreg-scraping/

http-server ./classrooms/dist/ -c-1 -s &
nodemon --ext ts,tsx --exec ./classrooms/build.sh
