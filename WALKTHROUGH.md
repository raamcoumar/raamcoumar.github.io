# How this website actually works

A guide to your friend's site, written so you can read the code, understand every moving part, and then change it with confidence.

Read this alongside the code itself. Every file has been annotated with plain-English comments explaining what it does and why — this document is the map, the comments are the territory.

---

## 1. Running it (do this first)

Open a terminal in this folder and run:

```bash
python3 dev-server.py
```

Then open **http://localhost:8000**. Press `Ctrl-C` to stop.

**You cannot just double-click `index.html`.** You'll get a page with no navigation and a CORS error in the console. This is the single most common confusion with this codebase, and it's worth understanding why rather than just memorising the workaround.

The navigation menu doesn't exist in any of the page files. It lives in `partials/nav.html`, and `js/main.js` pulls it in at runtime with `fetch()`. When you open a file directly, the browser is on a `file://` URL, and browsers refuse to let `file://` pages fetch other files — it's a security rule, because otherwise any HTML file you downloaded could read your hard drive. Serving over `http://localhost` makes the browser treat it as a normal website, and `fetch` works.

The README suggests `python3 -m http.server 8000`. That works for most of the site, but two things silently break, so I wrote `dev-server.py` instead:

Blog post links like `/talks/2026-07-03-whats-up-lately` return **404**, because no such file exists — in production Vercel rewrites that URL to `talks/detail.html`. And the like button always shows **0**, because `api/likes.js` is server code that a static file server can't execute.

`dev-server.py` is about 120 lines of Python standard library that fakes both of those. It's commented too, and reading it is a decent way to understand what Vercel is doing for you in production. Likes get stored in a local `.likes.json` (gitignored) instead of a cloud database.

---

## 2. The three ideas that explain everything

This site has no framework, no build step, no `npm install`, no bundler. It's HTML, CSS and JavaScript exactly as the browser receives them. That's rarer than you'd think, and it's why this is such a good codebase to learn from — nothing is hidden behind a tool.

But "no framework" creates three problems every website has to solve somehow. Almost all the JavaScript here exists to solve them:

**Sharing a navigation menu across pages.** React would give you a `<Nav />` component. Here, `js/main.js` fetches `partials/nav.html` and injects it into an empty `<div id="nav-placeholder">` on each page. One file to edit, five pages updated.

**Changing the colour scheme of an entire page.** The CSS never hardcodes a colour. It uses two custom properties, `--bg` and `--ink`, everywhere. Setting one attribute on `<body>` — `data-theme="notiee"` — activates a rule that redefines those two variables, and the whole page repaints. It animates rather than snapping because `body` has a `transition` on it. There is no JavaScript animation code anywhere.

**Filling a page with data.** The blog uses HTML files as empty templates full of `data-talks-*` markers, then JavaScript looks those up and fills them in from a JSON file. Manual data binding.

Notice the pattern underneath all three: **`data-*` attributes are the glue.** They're how the HTML tells the JavaScript what to do without the JavaScript needing to know anything specific about the page. `data-i18n` marks translatable text, `data-theme` carries a colour scheme, `data-talks-title` marks a slot to fill, `data-tag` identifies a filter chip. If you understand that convention, you can read this whole codebase.

---

## 3. What happens when a page loads

Worth walking through once, because the ordering is deliberate and a couple of subtle bugs live here.

The browser parses the HTML and hits the `<head>`. Every script tag has `defer` on it, which means: download in the background, don't block rendering, and execute in document order once the HTML is fully parsed. That's what guarantees `i18n.js` has finished defining `window.I18N` before `main.js` tries to use it. If you ever remove `defer` or reorder those tags, you'll get confusing "I18N is not defined" errors.

Then `main.js`'s `DOMContentLoaded` handler runs, and the order inside it matters:

`I18N.init()` decides the language (a saved choice in `localStorage` beats the browser's language setting) and sets `<html lang>`. It doesn't touch any content yet.

`injectNav()` starts fetching the nav. This is **asynchronous** — it will finish later, after everything below has already run. That's why the code that highlights the active nav link and wires up the 中/En buttons lives inside the `.then()` callback rather than alongside the other setup calls.

Then all the page-specific setup functions run: the works-page hover themes, the about-page easter egg, the footer, the draggable cat, the greeting bubble. Each one begins by checking whether its elements exist and quietly does nothing if they don't. That's how one shared script serves five completely different pages.

`addFooter()` has to run **before** `I18N.apply()`, because the footer contains a `data-i18n` element that the translation engine needs to see.

`I18N.apply()` runs last. It harvests the English out of the DOM into a cache, then renders the current language.

Finally, a second listener on `window.load` — which fires later, once every image has loaded or failed — sets up the screenshot galleries. It needs that later moment because the broken-image handlers must have fired, and images need real dimensions before you can measure whether the strip is wide enough to need arrows.

---

## 4. The files

Roughly 2,200 lines total, which is small enough to genuinely read all of.

**Pages.** `index.html` (home), `about.html`, `works.html`, `contact.html`, `talks.html`, plus `works/notiee.html`, `works/dreamland.html`, `works/artista.html`, `works/tomanotes.html` for the four project detail pages, and `talks/detail.html` — one shell reused for every blog post.

All ten share an identical `<head>`. It's annotated in full in `index.html`; the others point back to it.

**`partials/nav.html`** — not a page. The shared navigation, fetched and injected at runtime.

**`css/style.css`** — 898 lines, the entire visual design. Organised into banner-commented sections: fonts and theme variables, layout grid, doodles and animations, then per-page blocks.

**`js/i18n.js`** — the bilingual engine. Read the header comment; the design is genuinely unusual and I'll come back to it below.

**`js/main.js`** — everything shared: nav injection, active-link highlighting, hover themes, the footer, the easter egg, galleries, the draggable cat.

**`js/talks.js`** — the blog. Both the list page and the detail page.

**`js/vendor/marked.min.js`** — a third-party Markdown parser, vendored (committed directly rather than installed). Don't edit it.

**`api/likes.js`** — the only backend code in the project.

**`talks/`** — `posts.json` is the index; each post is two Markdown files, `.en.md` and `.zh.md`.

**`assets/`** — two custom fonts, the hand-drawn doodle PNGs, project screenshots, favicons.

**`vercel.json`** — five lines, one rewrite rule, makes the pretty blog URLs work.

**`docs/`** — the design specs your friend wrote with Claude while building. Interesting background reading, not part of the site.

---

## 5. The mechanisms in detail

### The injected navigation

`main.js` fetches `/partials/nav.html?v=3`, drops the HTML into `#nav-placeholder`, then figures out which link is "active" by comparing the current filename against each link's `href`. Detail pages get special handling so `/works/notiee.html` still highlights "works".

Marking a link active just adds a CSS class. The yellow squiggle underneath is an inline `<svg>` already sitting inside every link, hidden by default and revealed by `.nav a.active .active-mark { display: block; }`.

Two details worth knowing. First, `#nav-placeholder { display: contents; }` in the CSS — this makes the wrapper `<div>` vanish from the layout entirely, so `.site-name` and `.nav` become direct children of the `.page` grid. Without it the two-column layout collapses. It's an easy line to delete by accident and a confusing one to debug.

Second, that `?v=3` on the fetch URL is manual cache-busting. Browsers cache the nav file. If you edit `partials/nav.html` and your change doesn't appear, either hard-refresh or bump that number — and note it's in the JavaScript, not the HTML.

### The colour theme system

My favourite thing in this codebase, and it's about eight lines total.

`:root` defines `--bg: #FFFFFF` and `--ink: #1A1A1A`. Every colour in the stylesheet references those variables. Then:

```css
body[data-theme="notiee"] { --bg: #09C576; --ink: #0A2A1B; }
```

Put `data-theme="notiee"` on `<body>` and every colour on the page changes at once. Because `body` also has `transition: background-color .6s, color .6s`, the change eases smoothly.

The works list uses this for hover previews — `main.js` copies the card's `data-theme` onto `<body>` on `mouseenter` and clears it on `mouseleave`. The detail pages hardcode it in the HTML: `<body data-theme="notiee">`.

There's a nice touch for the dark theme: the doodles are black line drawings on transparent PNGs, which would be invisible on `#121212`. Rather than making light versions, one CSS rule inverts them: `body[data-theme="dreamland"] .doodle { filter: invert(1); }`.

**To add your own theme:** add one line to that block in the CSS, and use the name in `data-theme` on a card or a page body. That's the whole job.

### The bilingual engine

Read the header comment in `js/i18n.js` — it explains the design better than a summary can. The short version:

Most translation systems put placeholder keys in the HTML and both languages in a dictionary. This one doesn't. The **English lives in the HTML as real, readable content**, and the dictionary holds only Chinese:

```html
<p data-i18n="about.l1">just a regular person</p>
```

The upside is that the page reads fine with JavaScript off, and you edit English copy where you see it. The cost is that the engine has to *harvest* the English into a cache on first run, because rendering Chinese overwrites it and it needs somewhere to restore from.

Two rules you can break by accident:

Elements with `data-i18n` must contain **plain text only**. The renderer writes with `textContent`, which destroys child elements. If you need an icon inside, put `data-i18n` on an inner text-only `<span>`.

The call order is `init()` → content in the DOM → `apply()` → and only then `setLang()`. Calling `setLang()` before `apply()` does nothing useful because the English cache is still empty.

For attributes rather than text, there's `data-i18n-attr="alt:some.key"`, used for `alt` and `aria-label`.

One more thing worth stealing: `setLang()` fires a custom `langchange` event on `document`. Other features subscribe to it and re-render themselves, so `i18n.js` doesn't need to know the greeting bubble or the blog list exist. That's a clean decoupling pattern in about three lines.

### The blog

Entirely static, no CMS. `talks/posts.json` is the index — slug, date, tags, and title and summary in both languages. Each post's body is two Markdown files, `<slug>.en.md` and `<slug>.zh.md`. `talks/detail.html` is a single empty shell reused for every post.

Publishing a post is: write two `.md` files, add one entry to `posts.json`. That's it.

The list page fetches `posts.json`, sorts newest-first, and builds the whole list as an HTML string. When you click a filter chip it throws away all the markup and regenerates it from scratch — same mental model as React, done by hand, and for a list this size it's instant.

The detail page reads the slug from the URL, finds the matching post, fills in the header slots, then fetches the right `.md` file and runs it through `marked` to get HTML.

The URL handling is the fiddly bit. The list links to `/talks/2026-07-03-whats-up-lately`, which isn't a real file. In production `vercel.json` **rewrites** it to `/talks/detail.html?p=<slug>` — a rewrite, not a redirect, so the address bar keeps the clean URL. The JavaScript handles both shapes: it checks for `?p=` first, then falls back to reading the last segment of the path. That fallback exists because of a real bug your friend hit after deploying (there's a commit for it), and it's also what lets `dev-server.py` work without appending a query string.

### The likes counter

`api/likes.js` is the only server-side code here, and it's a good, small example of a serverless function.

There's no server you rent. Vercel sees a file in `/api` and exposes it at the matching URL. A request comes in, Vercel starts a Node process, runs the handler, returns the response, and discards the process. The count itself lives in Upstash Redis, a hosted key-value store with a free tier, one key per post.

Two things in it are worth internalising as habits. It validates input twice — a regex checking the slug's *shape*, and a membership check against `posts.json` confirming it's a *real published post*. Without the second, anyone could POST thousands of made-up slugs and fill your database with junk. Your friend added that check in a later commit, after shipping the regex-only version.

And it uses Redis `INCR` rather than read-add-write. `INCR` is atomic, so ten simultaneous likes give you ten. The naive version loses likes to race conditions.

The honest limitation: "have I already liked this?" is stored in `localStorage`, which is per-browser and trivially cleared. It stops casual double-clicking, not determined inflation. For a personal blog's heart counter, that's a fine trade — just know that's what it is.

The client side has a nice touch too. On load it fires a GET for the current count. If you click like before that GET returns, a `posted` flag makes the in-flight response discard itself, so a stale number doesn't overwrite your new one. That's the kind of bug that only shows up on a slow connection.

### The doodles

All the ambient animation is CSS keyframes on `transform` and `opacity` only — the two properties browsers can animate on the GPU without recalculating layout, which is why it stays smooth. Floating z's, coffee steam, a swaying bag, a walking cat.

The `.doodles` container has `pointer-events: none` so the decorative layer doesn't intercept clicks, and individual interactive doodles opt back in with `pointer-events: auto`. Clean pattern.

The draggable cat on the works page (`setupCatDrag` in `main.js`) is the most involved function in the codebase and rewards reading. Three things it demonstrates:

**Pointer events** — `pointerdown`/`pointermove`/`pointerup` handle mouse, touch and stylus with one set of handlers. `setPointerCapture` keeps events flowing to the element even when the cursor races outside it; without it, fast drags drop the cat.

**Handing over from CSS to JS** — at rest the cat is positioned and animated by CSS, which you can't drag. On first grab the code kills the animation, measures where the cat actually is, and switches it to `position: fixed` at those exact pixels. It looks identical at that instant but is now JS-controlled. Releasing it sets every inline style back to `""`, which *deletes* the inline declaration and hands control back to the stylesheet.

**A hand-rolled animation loop** — the hop home uses `requestAnimationFrame` with progress computed from elapsed time rather than frame count, so it takes the same duration on a 60Hz and a 144Hz display. The bounce is `|sin(t · π · hops)|` scaled by `(1 - t)` so the hops shrink as it lands.

And it respects `prefers-reduced-motion` — if you've asked your OS to reduce motion, the cat just snaps home. There's a media query at the bottom of the CSS that kills all animation for the same reason. Worth keeping.

---

## 6. Things that will bite you

**Opening files directly instead of running the server.** No nav, CORS errors. Covered above, but it's the one you'll hit most.

**Editing `partials/nav.html` and seeing no change.** Cache. Hard-refresh, or bump `?v=3` in `main.js`.

**Putting `data-i18n` on an element with children.** The children get destroyed. Put it on an inner span.

**The `@media (max-width: 768px)` block sits in the middle of `style.css`, not at the end.** All the Talks styles come *after* it. CSS applies later rules over earlier ones at equal specificity, so a responsive override in that block won't beat a Talks rule written below it. If you add mobile styles for Talks, put them in their own media query further down.

**`.page:has(.doodles)`** uses the `:has()` parent selector. Fine in every current browser, but it'll silently do nothing in anything from before mid-2023.

**Adding a blog post without redeploying.** `api/likes.js` reads `posts.json` once when the function starts, so a new post can't be liked until the next deploy.

**The `?v=3` cache-busting numbers** appear on the CSS and JS links in all ten HTML files. If you change `style.css` and deploy, returning visitors keep the old cached copy until you bump those. Ten files to edit by hand — annoying, and a reasonable thing to eventually automate.

---

## 7. Making changes

**Change the site name.** It's in `partials/nav.html`, in all ten `<title>` tags, in the footer text in `js/main.js`, and in the Chinese footer string in `js/i18n.js`. See `SWAP-THIS.md` for the full list with line numbers.

**Add a page.** Copy `contact.html`, change the `<title>` and the `<main>` content, add a link in `partials/nav.html`. The nav injection and active-link detection handle the rest automatically.

**Add a project.** Copy one of the `works/*.html` files, add a `.app-card` to `works.html` with a new `data-theme`, add that theme's colours to the CSS block, drop images in `assets/works/<name>/`.

**Add a blog post.** Two Markdown files in `talks/` named `<slug>.en.md` and `<slug>.zh.md`, plus an entry in `posts.json`. Keep the `YYYY-MM-DD-title` slug format — both the API and the sort logic depend on it.

**Go English-only.** Delete `js/i18n.js` and its `<script>` tag from all ten pages, delete the `.lang-toggle` block from `partials/nav.html`, and strip the `if (window.I18N)` blocks from `main.js` and `talks.js`. You can leave the `data-i18n` attributes in the HTML — with the engine gone they're inert, and the English is already sitting there as normal content. That's the payoff of this design: removing the translation layer degrades to a plain English site rather than a page full of placeholder keys.

**Change the fonts.** Two `@font-face` blocks at the top of `style.css`, and the `--font-hand` / `--font-body` variables just below. Read the licensing note in `SWAP-THIS.md` first.

---

## 8. Deploying

The site is a folder of static files plus one serverless function, so Vercel is the natural fit and it's what `vercel.json` is written for. Push to GitHub, import the repo in Vercel, and it deploys on every push with no build configuration.

For the likes counter you'd add an Upstash Redis integration in the Vercel dashboard, which wires the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables in automatically. If you skip that, the endpoint returns errors and the heart shows 0 — the rest of the site is unaffected.

If you'd rather host somewhere else: GitHub Pages, Netlify and Cloudflare Pages will all serve the static side happily, but you'd need to reimplement the `/talks/:slug` rewrite in their config format, and the likes function would need porting (Netlify and Cloudflare both have their own function formats).

---

## 9. Your safety net

The original code is untouched on the `main` git branch. You're on `annotated`.

```bash
git diff main annotated        # every comment that was added
git checkout main              # the pristine original
git checkout annotated         # back to the annotated version
```

Nothing but comments was changed — that was verified mechanically by stripping comments from both versions and comparing what was left, for all sixteen files.

Make your own changes on a new branch (`git checkout -b my-site`) and you can always get back to a working state.
