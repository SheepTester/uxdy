#!/bin/bash

./scripts/build.sh

coffee --output dist --compile --watch src &
pug --out dist --watch src &
sass --watch src:dist &

echo "Open http://localhost:8080/dist/ in your browser." &&
http-server -c-1 -s
