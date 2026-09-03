#!/usr/bin/env python3
"""
Dev static server for the LocalPulse frontend.

Same as `python -m http.server 5500`, but sends `Cache-Control: no-store` on
every response so the browser always picks up edited HTML/CSS/JS without a
hard refresh. Use this during development instead of the plain http.server.

    python3 serve.py            # serves this directory on http://localhost:5500
    python3 serve.py 8080       # ...on a different port
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    directory = str(Path(__file__).resolve().parent)
    handler = partial(NoCacheHandler, directory=directory)
    httpd = ThreadingHTTPServer(("", port), handler)
    print(f"Serving {directory} at http://localhost:{port} (no-store caching)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()


if __name__ == "__main__":
    main()
