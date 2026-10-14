"""Build the S01E01 static reader from pinned local media; never overwrite a delivery."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def find_ffmpeg(root, explicit=None):
    if explicit:
        candidate = Path(explicit).resolve()
        if not candidate.is_file():
            raise FileNotFoundError(candidate)
        return str(candidate)
    config = root / "pipeline.local.json"
    deps = read_json(config).get("media_dependency_dirs", []) if config.exists() else []
    for dependency in deps:
        folder = root / dependency / "imageio_ffmpeg" / "binaries"
        for candidate in sorted(folder.glob("ffmpeg*")):
            if candidate.is_file() and candidate.suffix != ".py":
                return str(candidate)
    installed = shutil.which("ffmpeg")
    if installed:
        return installed
    raise FileNotFoundError("FFmpeg missing: configure pipeline.local.json or pass --ffmpeg")


def clips(book):
    return [clip for page in book["pages"] for panel in page["panels"]
            for clip in [panel, *panel["bubbles"]]]


def validate(book):
    pages = book["pages"]
    panels = [panel for page in pages for panel in page["panels"]]
    bubbles = [bubble for panel in panels for bubble in panel["bubbles"]]
    assert [p["number"] for p in pages] == list(range(1, 10))
    assert [p["number"] for p in panels] == list(range(1, 55))
    assert len(bubbles) == 115
    assert [i for b in bubbles for i in b["sourceIds"]] == list(range(1, 141))
    assert len({c["id"] for c in clips(book)}) == 169
    assert len({c["audio"] for c in clips(book)}) == 169
    assert [p["number"] for p in panels if p["ambient"]] == [22, 45]
    for page in pages:
        for panel in page["panels"]:
            x, y, w, h = panel["rect"]
            assert 0 <= x < x + w <= page["width"]
            assert 0 <= y < y + h <= page["height"]
            for b in panel["bubbles"]:
                bx, by, bw, bh = b["rect"]
                assert x <= bx < bx + bw <= x + w + 1
                assert y <= by < by + bh <= y + h + 1
    for clip in clips(book):
        assert 0 <= clip["start"] < clip["end"] <= 437.984
        assert abs(clip["end"] - clip["start"] - clip["duration"]) < .002
        assert Path(clip["audio"]).parts[:2] == ("assets", "audio")
        assert ".." not in Path(clip["audio"]).parts
    return {"pages": len(pages), "panels": len(panels), "bubbles": len(bubbles),
            "clips": len(clips(book)), "source_records": 140}


def checked_asset(root, asset):
    path = root / asset["path"]
    if not path.is_file():
        raise FileNotFoundError(f"Required local media is missing: {path}")
    if sha256(path) != asset["sha256"]:
        raise ValueError(f"Source hash changed; review before rebuilding: {path}")
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, required=True, help="New version directory; must not exist")
    parser.add_argument("--ffmpeg")
    args = parser.parse_args()
    root, output = args.root.resolve(), args.output.resolve()
    if output.exists():
        parser.error(f"Refusing to overwrite {output}; choose a new version directory")
    book, source = read_json(HERE / "data/s01e01.json"), read_json(HERE / "data/sources.json")
    counts = validate(book)
    ffmpeg = find_ffmpeg(root, args.ffmpeg)
    video = checked_asset(root, source["video"])
    pages = [(page, checked_asset(root, page)) for page in source["pages"]]
    dist = output / "dist"
    (dist / "assets/audio").mkdir(parents=True)
    (dist / "assets/pages").mkdir()
    (output / "qa").mkdir()
    for file in (HERE / "src").iterdir():
        if file.is_file():
            shutil.copy2(file, dist / file.name)
    for page, path in pages:
        shutil.copy2(path, dist / page["target"])

    def cut(clip):
        target = dist / clip["audio"]
        result = subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-n",
            "-ss", str(clip["start"]), "-i", str(video), "-t", str(clip["duration"]),
            "-map", "0:a:0", "-vn", "-c:a", "libmp3lame", "-b:a", "160k",
            "-map_metadata", "-1", str(target),
        ], capture_output=True, text=True)
        if result.returncode:
            raise RuntimeError(f"Cut failed for {clip['id']}: {result.stderr}")
        clip["sha256"] = sha256(target)

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(cut, clips(book)))
    (dist / "book-data.js").write_text(
        "window.COMIC_BOOK = " + json.dumps(book, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8")
    report = {"counts": counts, "source": source, "ffmpeg_version": subprocess.check_output(
        [ffmpeg, "-version"], text=True).splitlines()[0],
        "method": "Source video stream 0:a:0; MP3 160 kb/s; no TTS, mixing or volume transformation",
        "timing_note": source["timing_note"],
        "clips": [{k: c[k] for k in ("id", "audio", "start", "end", "duration", "sha256")}
                  for c in clips(book)]}
    (output / "qa/source-audio.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({**counts, "output": str(output)}))


if __name__ == "__main__":
    main()
