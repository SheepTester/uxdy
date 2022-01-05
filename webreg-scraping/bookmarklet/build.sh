#!/bin/bash

# https://stackoverflow.com/a/24112741
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

deno bundle index.tsx | terser --module > bookmarklet.min.js
