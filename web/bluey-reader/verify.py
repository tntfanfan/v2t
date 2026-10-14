"""Check source mapping, exact asset hashes, and fully decode every audio clip."""
import argparse
import concurrent.futures
import json
from pathlib import Path
import re
import subprocess

from build import HERE, ROOT, clips, find_ffmpeg, read_json, sha256, validate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--ffmpeg")
    args = parser.parse_args()
    output = args.output.resolve()
    dist = output / "dist"
    raw = (dist / "book-data.js").read_text(encoding="utf-8")
    assert raw.startswith("window.COMIC_BOOK = ") and raw.rstrip().endswith(";")
    book = json.loads(raw[len("window.COMIC_BOOK = "):].strip()[:-1])
    counts = validate(book)
    for file in (HERE / "src").iterdir():
        if file.is_file():
            assert sha256(dist / file.name) == sha256(file), f"Stale frontend file: {file.name}"
    expected = read_json(HERE / "data/s01e01.json")
    # Encoding versions may produce different MP3 bytes; timings/text/geometry must remain exact.
    for value in (book, expected):
        for clip in clips(value):
            clip.pop("sha256", None)
    assert book == expected, "Published data differs from the tracked source"
    for asset in read_json(HERE / "data/sources.json")["pages"]:
        assert sha256(dist / asset["target"]) == asset["sha256"]
    provenance = read_json(output / "qa/source-audio.json")
    by_id = {c["id"]: c for c in provenance["clips"]}
    ffmpeg = find_ffmpeg(ROOT, args.ffmpeg)

    def decode(clip):
        path = dist / clip["audio"]
        recorded = by_id[clip["id"]]
        assert all(recorded[k] == clip[k] for k in ("audio", "start", "end", "duration"))
        assert sha256(path) == recorded["sha256"]
        result = subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin",
                                 "-i", str(path), "-progress", "pipe:1", "-f", "null", "-"],
                                capture_output=True, text=True)
        assert result.returncode == 0 and not result.stderr.strip(), (clip["id"], result.stderr)
        times = re.findall(r"out_time_us=(\d+)", result.stdout)
        duration = int(times[-1]) / 1_000_000
        assert abs(duration - clip["duration"]) < .08, (clip["id"], duration, clip["duration"])
        return {"id": clip["id"], "decoded_seconds": duration}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        decoded = list(pool.map(decode, clips(book)))
    report = {"result": "passed", "counts": counts, "all_audio_fully_decoded": True,
              "page_hashes_match": True, "source_data_matches": True, "frontend_source_matches": True,
              "listening_review": "Not claimed by this automated check", "decoded_clips": decoded}
    (output / "qa/validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "decoded_clips"}))


if __name__ == "__main__":
    main()
