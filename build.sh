#!/bin/bash

# Clean up dist/ folder
rm -rf dist
mkdir -p dist

# Copy over static files
cp static/* dist

# Build CoffeeScript
coffee --compile --print src | terser --toplevel > dist/index.js
