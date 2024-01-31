#!/usr/bin/env bash
set -euo pipefail

if ( ! command -v jq > /dev/null )
then
  echo 'The jq command is required for this script.'
  exit 1
fi

allMatch=1
function checkVersionMatch() {
    echo "- $1: $2"
    if [ ! "$manifestVersion" = "$2" ]
    then
      allMatch=0
    fi
}

echo "Detected versions:"

manifestVersion=$(jq -r .version 'manifest.json')
checkVersionMatch 'manifest.json' "$manifestVersion"

checkVersionMatch 'CHANGELOG.md' "$(sed -nE 's/^## v(.*)$/\1/p' 'CHANGELOG.md' | head -n 1)"

if [ ! "$allMatch" = 1 ]
then
  echo 'Not all versions match.'
  exit 1
else
  echo 'All version match!'
fi
