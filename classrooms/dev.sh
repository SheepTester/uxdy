#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

echo "Serving dist/ at http://localhost:8080/"

http-server ./dist/ -c-1 -s &
deno bundle --watch ./index.tsx ./dist/index.min.js
