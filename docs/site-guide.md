# ram. — site guide

Your own reference manual for this website. Written in plain English — no developer background needed to use it.

---

## The basics

| | |
|---|---|
| **Local folder** | `~/Projects/veryramdom/` |
| **Git repo** | `raamcoumar/raamcoumar.github.io` (branch `main`) |
| **Live site** | https://veryramdom.com |
| **Built with** | Plain HTML + CSS + JavaScript. No framework, no build step, no npm. |

**One rule to never forget:** the file `CNAME` in the project root contains `veryramdom.com`. GitHub uses it to point your domain at the site. If you ever delete it, your domain stops working.

---

## Running it locally

```bash
cd ~/Projects/veryramdom
python3 dev-server.py
# open http://localhost:8000
```

Always use `dev-server.py` — NOT `python3 -m http.server`. The plain server breaks two things:
1. Blog post links (`/blog/some-post`) return 404 — the dev server fakes the URL rewrite Vercel does in production
2. The like button shows nothing — the dev server implements the likes API locally

Stop it with `Ctrl-C`. Likes you test locally are stored in `.likes.json` (never committed).

---

## The pages

| Page | File | What's on it |
|---|---|---|
| Home | `index.html` | Sleeping-person doodle + speech bubble with your 12 facts. Click the bubble to cycle through them. |
| About | `about.html` | Your personal copy + education + "now at". **Bilingual** (English/Tamil). |
| Career | `career.html` | 2×2 grid: suryan fm, big fm, notion press, freshworks. Hovering a card tints the whole page in that company's color. English only. |
| Blog | `blog.html` | List of posts from `blog/posts.json`. English only. |
| Contact | `contact.html` | Email + socials + credits. English only. |

Each career card links to a detail page in `career/` — four files, one per company.

---

## The systems, explained simply

### The navigation menu
The left (desktop) / top (mobile) nav is NOT in the HTML files. It lives in `partials/nav.html`, and `js/main.js` fetches it into every page at load. Edit that one file to change the menu everywhere.

If you edit it and don't see the change: browsers cache it. Bump the `?v=3` number in `js/main.js` (search for `partials/nav.html?v=`).

### The colors (themes)
Every color on the site comes from two CSS variables: `--bg` (background) and `--ink` (text). The theme rules live at the top of `css/style.css`:

```css
body[data-theme="freshworks"] { --bg: #EAE7E1; --ink: #1A1A1A; }
```

- Hovering a career card copies that theme onto the page body (handled in `js/main.js` — `bindWorksHover`)
- Each career detail page sets its theme directly on its `<body>` tag
- **To add a new company:** add one color rule here + one card in `career.html` + one detail page. That's the whole job.

### The bilingual system (English + Tamil)
The design is unusual, and it matters when you edit text:

- **English lives directly in the HTML** as normal, readable content
- **Tamil lives in `js/i18n.js`** in an object called `TA` — each line has a key like `"about.l1": "ஒரு சாதாரண நபர்"`
- HTML elements that should translate carry a `data-i18n="about.l1"` marker
- On load, the site reads the English from the HTML, and if the visitor prefers Tamil (or clicks **த**), it swaps in the Tamil text

**Two rules you can break by accident:**
1. Never put `data-i18n` on an element that contains other elements (links, icons). The engine replaces the text and destroys the children. If you need a link inside a translated sentence, put `data-i18n` on small inner `<span>`s around the link instead — the Letterboxd line on the About page is a working example.
2. When you change English text on the About page, check `js/i18n.js` — the Tamil counterpart under the same key needs updating too.

Pages that are English-only (blog, career, contact) simply have no `data-i18n` markers.

### The speech bubble (home page)
- The 12 greetings live in `js/i18n.js` → `GREETINGS.en` and `GREETINGS.ta`
- They show **in order**, not randomly: #1 on every page load, next one on each click, wrapping back to #1 after #12
- The click logic is `setupNoteBubble()` in `js/main.js`
- To change a greeting: edit the text in `GREETINGS`. The order in the file is the order visitors see.

### The blog
Publishing a post is three steps:

1. Write `blog/<slug>.en.md` — the post body in Markdown
2. Add one entry to `blog/posts.json`:

```json
{
  "slug": "2026-08-15-my-new-post",
  "date": "2026-08-15",
  "tags": ["meta"],
  "title": { "en": "my new post" },
  "summary": { "en": "one sentence shown on the list page." }
}
```

3. Done. The list page reads `posts.json`, the detail page renders your Markdown.

**The slug format matters:** `YYYY-MM-DD-title-in-kebab-case`. The server validates this pattern, and the list sorts by it.

### The fonts
- **English titles / nav / site name** — `tanqinghuafont.woff2` (your friend's handwriting, kept deliberately)
- **Tamil titles** — Karla Tamil Inclined (Google Fonts)
- **English body** — Inter (Google Fonts)
- **Tamil body** — Mukta Malar (Google Fonts)

Font loading is at the top of `css/style.css`. The Google Fonts link sits in the `<head>` of every page.

---

## Deploying (push → live)

```bash
cd ~/Projects/veryramdom
git add -A
git commit -m "describe what changed"
git pull --rebase origin main   # important: GitHub may have added commits (like CNAME)
git push origin main
```

Live in about a minute at https://veryramdom.com. No build step — GitHub Pages serves the files as they are.

---

## Known quirks (so they don't surprise you)

1. **Blog pretty URLs 404 on the live site.** `/blog/2026-08-03-why-i-built-this-site` works locally and on Vercel, but GitHub Pages has no URL rewrites. The blog *list* works fine live; direct links to posts don't. If this ever bothers you, the fix is switching links to `/blog/detail.html?p=<slug>` format, or hosting on Vercel.
2. **The like counter is always 0 on the live site.** The likes API is a serverless function that only Vercel can run. It's a soft failure by design — nothing crashes.
3. **Mobile styles live in the middle of `css/style.css`** (the `@media (max-width: 768px)` block), not at the end. CSS applies later rules over earlier ones, so new mobile rules for blog/career sections should go in their own media query further down.
4. **Cache-busting numbers.** CSS/JS `<link>` and `<script>` tags have `?v=N` on them. If you change `style.css` or a JS file and the change "doesn't show up", bump those numbers in the HTML files.
5. **Vercel leftovers.** `vercel.json`, `api/likes.js`, and `package.json` exist for a possible future move to Vercel. They do nothing on GitHub Pages and are safe to ignore.

---

## FAQ

**"I edited the nav but nothing changed"** → bump `?v=3` in `js/main.js` (see The navigation menu).

**"I edited CSS but nothing changed"** → bump the `?v=` numbers on the CSS/JS tags in the HTML files, then hard-refresh.

**"The Tamil translation is wrong/outdated"** → English lives in the HTML; Tamil lives in `js/i18n.js` under the matching key. Edit both.

**"How do I add another company to career?"** → color rule in CSS + card in `career.html` + detail page in `career/`. Copy an existing one as a template.

**"Where are the old files from the original owner?"** → Deleted from the live repo (old `works/`, `talks/`, Chinese font, his blog posts). Still recoverable from git history if you ever want them.
