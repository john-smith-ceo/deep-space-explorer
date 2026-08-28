#!/bin/sh
# Сборка и публикация одной командой: забыть про build.py нельзя,
# иначе на хранилище уедет вчерашний артефакт.
set -e
cd "$(dirname "$0")"
python3 build.py
publish site deep-space deep-space.html
