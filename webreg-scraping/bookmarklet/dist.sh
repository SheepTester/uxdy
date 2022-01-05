#!/bin/bash

# Only to be called by scripts/deploy.sh
# Working directory in dist/

# Build bookmarklet
../webreg-scraping/bookmarklet/build.sh

# Copy files to dist/bookmarklet/
mkdir bookmarklet
cd bookmarklet
for file in ../../webreg-scraping/bookmarklet/*.{js,css}
do
  cp $file $(basename $file)
done
