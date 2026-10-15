"""Open the local comic reader, reusing its server when already running."""
import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import urllib.error
import urllib.request
import webbrowser

DIST = Path(__file__).resolve().parents[2] / "output/S01E01/comic-web-v4/dist"


class PreviewServer(ThreadingHTTPServer):
    # Windows SO_REUSEADDR can let a second server bind an already used port.
    allow_reuse_address = os.name != "nt"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--no-browser", action="store_true", help="Start without opening a browser")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535")
    if not (DIST / "index.html").is_file() or not (DIST / "book-data.js").is_file():
        print(f"找不到漫画网页，请保留完整的项目和交付文件：\n{DIST}", flush=True)
        return 1

    url = f"http://127.0.0.1:{args.port}/"
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(url + "book-data.js", timeout=2) as response:
            same_reader = response.read(1024) == (DIST / "book-data.js").read_bytes()[:1024]
    except (OSError, urllib.error.URLError):
        same_reader = False
    if same_reader:
        print(f"漫画预览已经在运行：{url}", flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        return 0
    try:
        server = PreviewServer(("127.0.0.1", args.port), partial(SimpleHTTPRequestHandler, directory=str(DIST)))
    except OSError as error:
        print(f"无法启动预览，端口 {args.port} 可能被其他程序占用：{error}", flush=True)
        return 1

    print(f"漫画预览已启动：{url}\n请保留此窗口，最小化即可。关闭窗口或按 Ctrl+C 会停止预览。", flush=True)
    with server:
        if not args.no_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n预览已停止。下次双击“打开漫画预览.cmd”即可重新打开。", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
