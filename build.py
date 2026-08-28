#!/usr/bin/env python3
"""Склейка модулей в один самодостаточный HTML.

Заставка обязана открываться с диска двойным щелчком, поэтому подключить
модули через <script type="module"> нельзя: по file:// браузер блокирует их
политикой CORS. Отсюда сборка — стили в <style>, скрипты в одну IIFE.

Порядок файлов важен: config и core объявляют константы, которыми пользуются
остальные, main запускает всё последним.
"""
import pathlib
import sys

SRC = pathlib.Path(__file__).parent / "src"
OUT = pathlib.Path(__file__).parent / "deep-space.html"

ORDER = [
    "config.js",
    "engine/core.js",
    "engine/rng.js",
    "engine/sector.js",
    "engine/star.js",
    "engine/planet.js",
    "engine/world.js",
    "engine/flight.js",
    "engine/ship.js",
    "engine/audio.js",
    "engine/comms.js",
    "engine/render.js",
    "ui/hud.js",
    "ui/sysmap.js",
    "ui/dock.js",
    "ui/sound-panel.js",
    "ui/jumpmenu.js",
    "ui/sysinfo.js",
    "main.js",
]


def assets_block():
    """Карты Земли и голос связи вшиваются в файл: без сети всё должно работать."""
    import base64
    parts = []
    for key, name in (("day", "earth-day.webp"), ("night", "earth-night.webp"),
                      ("clouds", "earth-clouds.webp")):
        path = SRC / "assets" / name
        if not path.exists():
            continue
        data = base64.b64encode(path.read_bytes()).decode()
        parts.append('%s:"data:image/webp;base64,%s"' % (key, data))
    for key, name in (("voice", "comms-check.webm"), ("mir", "comms-mir.webm")):
        path = SRC / "assets" / name
        if not path.exists():
            continue
        data = base64.b64encode(path.read_bytes()).decode()
        parts.append('%s:"data:audio/webm;base64,%s"' % (key, data))
    if not parts:
        return ""
    return ("/* ==== карты Земли: NASA Blue Marble, Earth at Night, Cloud Cover ====\n"
            "   Общественное достояние. Вшиты в файл, чтобы дом выглядел домом\n"
            "   и без сети. Там же голос проверки канала — piper, голос ryan. */\n"
            "const EARTH_MAPS={%s};" % ",".join(parts))


def main():
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css = (SRC / "style.css").read_text(encoding="utf-8")

    chunks = []
    block = assets_block()
    if block:
        chunks.append(block)
    for name in ORDER:
        path = SRC / name
        if not path.exists():
            continue
        chunks.append("/* ==== %s ==== */\n%s" % (name, path.read_text(encoding="utf-8").rstrip()))

    script = '<script>\n(function(){\n"use strict";\n\n%s\n})();\n</script>' % "\n\n".join(chunks)

    html = html.replace("<!--STYLE-->", "<style>\n%s</style>" % css)
    html = html.replace("<!--SCRIPT-->", script)
    OUT.write_text(html, encoding="utf-8")

    size = len(html.encode("utf-8"))
    print("собрано: %s, %.1f КБ, %d строк" % (OUT.name, size / 1024, html.count("\n") + 1))
    if "<!--" in html.split("<body>")[-1] and "-->" in html.split("<body>")[-1]:
        print("внимание: в теле остался неподставленный плейсхолдер", file=sys.stderr)


if __name__ == "__main__":
    main()
