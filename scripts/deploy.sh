#!/bin/bash

REMOTE=$(git remote get-url origin)
# https://stackoverflow.com/a/949391
LAST_COMMIT=$(git rev-parse HEAD)

# Build and cd to dist/
sh build.sh
cd dist

# Create a repo with the same remote in dist/ with branch gh-pages
git init
git remote add origin $REMOTE
git fetch origin --depth=1
# https://stackoverflow.com/a/16595872
git reset --soft origin/gh-pages
git checkout -b gh-pages

# Commit everything in dist/ and push
git add .
git commit -m "Building for $LAST_COMMIT"
git push origin gh-pages

# Clean up the repo
rm -rf .git
