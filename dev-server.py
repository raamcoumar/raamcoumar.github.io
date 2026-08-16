#!/usr/bin/env python3
"""
dev-server.py  —  a local stand-in for Vercel, for this site.

WHY THIS FILE EXISTS
--------------------
The README tells you to run `python3 -m http.server 8000`. That works for most
of the site, but TWO things silently break, because they are not static files
at all -- they are things Vercel does for you in production:

  1. Pretty post URLs.  The talks list links to  /talks/2026-07-03-whats-up-lately
     There is no file at that path. In production, vercel.json rewrites it to
     /talks/detail.html?p=<slug>. A plain static server just returns 404.

  2. The likes counter.  api/likes.js is a *serverless function*, not a static
     file. Vercel runs it on demand at /api/likes. A plain static server has no
     idea how to execute it, so the heart button always shows 0.

This script is a ~120 line static server that also fakes those two behaviours,
using nothing but the Python standard library. No npm, no install, no account.

RUN IT:
    python3 dev-server.py
    # then open http://localhost:8000

Likes are stored in .likes.json next to this file (gitignored). That is the
local stand-in for the Upstash Redis database used in production.
"""

import json
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
LIKES_FILE = os.path.join(ROOT, ".likes.json")

# Same guard the real api/likes.js uses: a slug must look like 2026-07-03-some-title.
SLUG_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$")


def valid_slugs():
    """Only allow likes on posts that actually exist in blog/posts.json.

    The real api/likes.js does exactly this, to stop anyone writing junk keys
    into the database by POSTing made-up slugs.
    """
    try:
        with open(os.path.join(ROOT, "blog", "posts.json"), encoding="utf-8") as fh:
            return {p["slug"] for p in json.load(fh)}
    except Exception:
        return set()


def read_likes():
    try:
        with open(LIKES_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


def write_likes(data):
    with open(LIKES_FILE, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    # --- keep the browser from caching while you are editing ----------------
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _slug_from(self, raw):
        if not isinstance(raw, str) or not SLUG_RE.match(raw) or raw not in valid_slugs():
            return None
        return raw

    # --- 1. the /api/likes serverless function, reimplemented ---------------
    def do_POST(self):
        if self.path.split("?")[0] != "/api/likes":
            return self._json(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length") or 0)
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            payload = {}
        slug = self._slug_from(payload.get("slug"))
        if not slug:
            return self._json(400, {"error": "invalid slug"})
        likes = read_likes()
        likes[slug] = likes.get(slug, 0) + 1      # same as Redis INCR
        write_likes(likes)
        return self._json(200, {"count": likes[slug]})

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/api/likes":
            from urllib.parse import urlparse, parse_qs
            q = parse_qs(urlparse(self.path).query)
            slug = self._slug_from((q.get("slug") or [None])[0])
            if not slug:
                return self._json(400, {"error": "invalid slug"})
            return self._json(200, {"count": read_likes().get(slug, 0)})

        # --- 2. the vercel.json rewrite:  /blog/<slug>  ->  detail page ----
        m = re.match(r"^/blog/([^/]+)/?$", path)
        if m and not os.path.exists(os.path.join(ROOT, path.lstrip("/"))):
            self.path = "/blog/detail.html"

        return super().do_GET()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"\n  ram. dev server")
    print(f"  → http://localhost:{port}")
    print(f"  serving {ROOT}")
    print(f"  pretty /blog/<slug> URLs: on")
    print(f"  /api/likes (stored in .likes.json): on")
    print(f"  ctrl-c to stop\n")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
