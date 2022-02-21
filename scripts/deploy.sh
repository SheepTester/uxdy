#!/bin/bash

# USAGE: ./scripts/deploy.sh <SRC_DIR> [DEST_DIR]
# Relative to directory of repo


REMOTE=$(git remote get-url origin)
# https://stackoverflow.com/a/949391
LAST_COMMIT=$(git rev-parse HEAD)
# Directories to keep (instead of overwriting)
KEEP="bookmarklet classrooms"

# Go to directory of this script https://stackoverflow.com/a/24112741
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

# Create a repo with the same remote as this repo in scripts/temp/ with branch
# gh-pages
mkdir temp
cd ./temp/
git init
git remote add origin $REMOTE
git fetch origin --depth=1

# https://stackoverflow.com/a/6482403
if [ -z "$2" ]; then
  # Copy into temp repo
  # -a: https://askubuntu.com/a/86891
  cp -ar ../../$1/. .
  # Change what Git thinks the current branch is to gh-pages
  # https://stackoverflow.com/a/16595872
  git reset --soft origin/gh-pages
  # Restore folders that were meant to be kept
  for keep in $KEEP; do
    git checkout origin/gh-pages $keep
  done
else
  # Check out existing files in gh-pages
  git checkout origin/gh-pages
  # Delete existing folder
  rm -r $2
  # Copy into folder
  mkdir $2
  cp -ar ../../$1/. $2
fi

# Commit everything and push
git checkout -b gh-pages
git add .
git commit -m "Building for $LAST_COMMIT"
git push origin gh-pages

# Clean up the repo
cd ..
rm -rf ./temp/
